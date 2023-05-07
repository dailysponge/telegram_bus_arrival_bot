import * as dotenv from "dotenv";
import telegram_bot from "node-telegram-bot-api";
import { getBusStop } from "./util/ltaResponse.js";
import { saveStop } from "./util/saveStop.js";
import { craftMessage } from "./util/messageCraft.js";
import { getSavedStopsDetails, deleteStop } from "./util/busStop.js";
import { getBusList, findBusLocation } from "./util/getBusList.js";
import { trackUsage, exportUsage, getAllChatId } from "./util/analytics.js";
import { getPotentialBusStop } from "./util/getBusStop.js";
import moment from "moment-timezone";

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const adminId = parseInt(process.env.ADMIN_CHAT_ID);
const bot = new telegram_bot(botToken, { polling: true });

const timezone = "Asia/Singapore";
const sendStartTime = 22; // 10pm in 24-hour format
const sendEndTime = 23; // 11pm in 24-hour format

setInterval(async () => {
  const now = moment().tz(timezone);
  const currentHour = now.hour();
  if (currentHour >= sendStartTime && currentHour <= sendEndTime) {
    let usage = await exportUsage();
    bot
      .sendMessage(
        adminId,
        `usage till ${moment().tz(timezone).format("YYYY-MM-DD")}:\n${usage}`
      )
      .then((sentMessage) => {
        const messageId = sentMessage.message_id;
        bot.pinChatMessage(adminId, messageId);
      });
  }
}, 60 * 60 * 1000); // check every hour (in milliseconds)

bot.on("message", async (msg) => {
  // The message was sent by the bot
  if (msg.from.is_bot) return;

  try {
    const chatId = msg.chat.id;
    switch (true) {
      case msg.location != null:
        const { latitude, longitude } = msg.location;
        const potentialBusStop = await getPotentialBusStop(latitude, longitude);
        if (potentialBusStop == null) {
          bot.sendMessage(
            chatId,
            "No bus stops found near your location, please try again."
          );
          break;
        }

        potentialBusStop.forEach((stop) => {
          bot.sendMessage(
            chatId,
            `Did you mean this bus stop? \nBus stop: ${stop.BusStopCode}\nDescription: ${stop.RoadName} near ${stop.Description}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Select", callback_data: `${stop.BusStopCode}` },
                    {
                      text: "Save",
                      callback_data: `${stop.BusStopCode} save`,
                    },
                  ],
                ],
              },
              parse_mode: "Markdown",
            }
          );
        });
        break;

      case msg.text.includes("/admin"):
        if (chatId !== adminId) break;
        let allChatId = await getAllChatId();
        let adminMessage =
          msg.text.split(" ").join(" ").replace("/admin", "") ||
          "Hello from admin!";
        allChatId.forEach((id) => {
          bot.sendMessage(id, adminMessage);
          bot.sendDocument(id, "./asset/locationGuide.mp4");
        });
        break;

      case msg.text === "/start":
        bot.sendMessage(
          chatId,
          "Welcome! \nType in bus stop number (e.g. 04121) to start!\n\n🟢= LOW crowd\n🟠= MODERATE crowd\n🔴= HIGH crowd.\n'SD' = Single Decker\n'DD' = Double Decker  \n\n Click on the bus number buttons for their location\n\nUse /savedStops or the menu button on the left to show all saved bus stops.\nAlso, you can select bus stop based on locations via telegram location!"
        );
        bot.sendDocument(chatId, "./asset/locationGuide.mp4");
        break;

      case msg.text === "/savedstops":
        let [[registeredStops, savedStops]] = await getSavedStopsDetails(
          chatId
        );
        if (registeredStops == null || savedStops == null) {
          bot.sendMessage(
            chatId,
            "No saved bus stops, try saving a bus stop first!"
          );
          break;
        }
        registeredStops.forEach((stop) => {
          if (savedStops.includes(stop.BusStopCode)) {
            const index = savedStops.indexOf(stop.BusStopCode);
            savedStops.splice(index, 1);
          }

          bot.sendMessage(
            chatId,
            `Bus stop: ${stop.BusStopCode}\nDescription: ${stop.RoadName} near ${stop.Description}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Select", callback_data: `${stop.BusStopCode}` },
                    {
                      text: "Delete",
                      callback_data: `${stop.BusStopCode} delete`,
                    },
                  ],
                ],
              },
              parse_mode: "Markdown",
            }
          );
        });
        if (savedStops.length > 0) {
          savedStops.forEach((stop) => {
            bot.sendMessage(
              chatId,
              `Bus stop: ${stop}\nDescription: Not registered`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "Select", callback_data: `${stop}` }],
                  ],
                },
                parse_mode: "Markdown",
              }
            );
          });
        }
        break;

      case msg.text.length === 5 && !isNaN(msg.text):
        const busStopCode = msg.text;
        const data = await getBusStop(busStopCode);
        if (data.Services.length === 0) {
          bot.sendMessage(chatId, "Invalid bus stop entered. Try again");
          break;
        }
        const message = craftMessage(data);
        trackUsage(msg.chat.username, chatId);
        bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Update bus stop", callback_data: `${busStopCode}` },
                { text: "Save bus stop", callback_data: `${busStopCode} save` },
              ],
              ...getBusList(data),
            ],
          },
          parse_mode: "Markdown",
        });

        break;
      default:
        bot.sendMessage(chatId, "Invalid command");
    }
  } catch (error) {
    console.log(error);
  }
});

bot.on("callback_query", async (callback_query) => {
  try {
    let busStopCode = callback_query.data.split(" ")[0];
    let busStopData = await getBusStop(busStopCode);
    const chatId = callback_query.from.id;
    switch (true) {
      // location buttton
      case callback_query.data.includes("location"):
        const busNo = callback_query.data.split(" ")[1];
        let location = findBusLocation(busStopData, busNo);
        bot.sendMessage(chatId, `Location of 🚌${busNo}`);
        bot.sendLocation(callback_query.from.id, location[0], location[1]);
        break;

      // save bus stop button
      case callback_query.data.includes("save"):
        saveStop(chatId, busStopCode);
        bot.sendMessage(chatId, "Bus stop saved");
        break;

      // delete bus stop button
      case callback_query.data.includes("delete"):
        let success = await deleteStop(chatId, busStopCode);
        if (!success) {
          bot.sendMessage(chatId, "Something went wrong, try again later");
          break;
        }
        bot.deleteMessage(chatId, callback_query.message.message_id);
        break;

      // update bus stop button
      default:
        // notifies user that the bus stop has been updated
        bot.answerCallbackQuery(callback_query.id, `Bus stop updated`);
        const message = craftMessage(busStopData);
        trackUsage(callback_query.message.chat.username);
        bot.deleteMessage(chatId, callback_query.message.message_id);
        bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Update bus stop", callback_data: callback_query.data }],
              ...getBusList(busStopData),
            ],
          },
          parse_mode: "Markdown",
        });
    }
  } catch (error) {
    console.log(error);
  }
});

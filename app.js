import * as dotenv from "dotenv";
import telegram_bot from "node-telegram-bot-api";
import { getBusStop } from "./util/ltaResponse.js";
import { saveStop } from "./util/saveStop.js";
import { craftMessage } from "./util/messageCraft.js";
import { getSavedStopsDetails } from "./util/busStop.js";
import { getBusList, findBusLocation } from "./util/getBusList.js";
dotenv.config();

const botToken = process.env.BOT_TOKEN;
const bot = new telegram_bot(botToken, { polling: true });

bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    switch (true) {
      case msg.text === "/start":
        bot.sendMessage(
          chatId,
          "Welcome! \nType in bus stop number🚌 to start!\n\n🟢= LOW crowd\n🟠= MODERATE crowd\n🔴= HIGH crowd. \n\n Click on the bus number buttons for their location\n\nUse /savedStops or the menu button on the left to show all saved bus stops"
        );
        break;

      case msg.text === "/savedstops":
        let [[registeredStops, savedStops]] = await getSavedStopsDetails(chatId);
        if (registeredStops == null || savedStops == null) {
          bot.sendMessage(chatId, "No saved bus stops, try saving a bus stop first!");
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
                inline_keyboard: [[{ text: "Select", callback_data: `${stop.BusStopCode}` }]],
              },
              parse_mode: "Markdown",
            }
          );
        });
        if (savedStops.length > 0) {
          savedStops.forEach((stop) => {
            bot.sendMessage(chatId, `Bus stop: ${stop}\nDescription: Not registered`, {
              reply_markup: {
                inline_keyboard: [[{ text: "Select", callback_data: `${stop}` }]],
              },
              parse_mode: "Markdown",
            });
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

      // update bus stop button
      default:
        // notifies user that the bus stop has been updated
        bot.answerCallbackQuery(callback_query.id, `Bus stop updated`);
        const message = craftMessage(busStopData);
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

import * as dotenv from "dotenv";
import axios from "axios";
import telegram_bot from "node-telegram-bot-api";
import { getBusStop } from "./util/ltaResponse.js";
import { mapId } from "./util/idMap.js";
import { craftMessage } from "./util/messageCraft.js";
import { getBusList, findBusLocation } from "./util/getBusList.js";
dotenv.config();

const botToken = process.env.BOT_TOKEN;
const ltaToken = process.env.LTA_TOKEN;
const bot = new telegram_bot(botToken, { polling: true });

bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    switch (true) {
      case msg.text === "/start":
        bot.sendMessage(chatId, "Welcome to BusBot!");
        break;
      case msg.text.length === 5 && !isNaN(msg.text):
        mapId(msg.chat.username, chatId);
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
              [{ text: "Update bus stop", callback_data: msg.text }],
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

bot.on("callback_query", async (msg) => {
  try {
    let busStopData = await getBusStop(msg.data.split(" ")[0]);
    const chatId = msg.from.id;
    switch (true) {
      case msg.data.includes("location"):
        const busNo = msg.data.split(" ")[1];
        let location = findBusLocation(busStopData, busNo);
        bot.sendMessage(chatId, `Location of 🚌${busNo}`);
        bot.sendLocation(msg.from.id, location[0], location[1]);
        console.log(location);
        break;
      default:
        const message = craftMessage(busStopData);
        bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Update bus stop", callback_data: msg.data }],
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

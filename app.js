import * as dotenv from "dotenv";
import axios from "axios";
import telegram_bot from "node-telegram-bot-api";
import { getBusStop } from "./util/ltaResponse.js";
import { mapId } from "./util/idMap.js";
import { craftMessage } from "./util/messageCraft.js";
dotenv.config();

const botToken = process.env.BOT_TOKEN;
const ltaToken = process.env.LTA_TOKEN;
const bot = new telegram_bot(botToken, { polling: true });

bot.on("message", async (msg) => {
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
          inline_keyboard: [[{ text: "Update bus stop", callback_data: msg.text }]],
        },
        parse_mode: "Markdown",
      });
      break;
    default:
      bot.sendMessage(chatId, "Invalid command");
  }
});

bot.on("callback_query", async (msg) => {
  let busStopCode = await getBusStop(msg.data);
  console.log(busStopCode);
});

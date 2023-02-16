import { getBusStopDetails } from "./ltaResponse.js";
import fs from "fs";

export async function getSavedStopsDetails(chatId) {
  try {
    let savedStops = getSavedStops(chatId);
    let stopsDetails = await getBusStopDetails(savedStops);
    if (savedStops === null) return null;
    return [stopsDetails];
  } catch (error) {
    console.error(error);
    return error;
  }
}

function getSavedStops(key) {
  try {
    const data = JSON.parse(fs.readFileSync("./savedStops.json"));
    for (let i = 0; i < data.id.length; i++) {
      if (data.id[i].hasOwnProperty(key)) {
        return data.id[i][key];
      }
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

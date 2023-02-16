import { getBusStopDetails } from "./ltaResponse.js";
import fs from "fs";

export async function getSavedStopsDetails(chatId) {
  try {
    let savedStops = getSavedStops(chatId);
    if (savedStops === null) return [[null, null]];

    let stopsDetails = await getBusStopDetails(savedStops);

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

export async function deleteStop(chatId, stopNo) {
  try {
    const savedStops = JSON.parse(fs.readFileSync("./savedStops.json"));

    // Loop through the id array and delete the specified string
    savedStops.id.forEach((stopObj) => {
      if (stopObj.hasOwnProperty(chatId)) {
        const savedStops = stopObj[chatId];
        if (!savedStops.includes(stopNo)) {
          return false;
        }
        stopObj[chatId] = savedStops.filter((value) => value !== stopNo);
      }
    });

    // Write the updated JSON object back to the savedStops.json file
    fs.writeFileSync("./savedStops.json", JSON.stringify(savedStops));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

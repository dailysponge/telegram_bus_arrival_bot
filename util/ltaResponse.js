import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const config = {
  headers: {
    accept: "application/json",
    AccountKey: process.env.LTA_TOKEN,
  },
};
export async function getBusStop(busStopCode) {
  try {
    const URL = "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=";
    let res = await axios.get(`${URL}${busStopCode}`, config);
    let data = res.data;
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function getBusStopDetails(savedStops) {
  try {
    const URL = "http://datamall2.mytransport.sg/ltaodataservice/BusStops";
    let res = await axios.get(URL, config);
    let data = res.data;
    let allBusStops = data.value;
    let savedStopsDetails = [];
    allBusStops.forEach((stop) => {
      if (savedStops.includes(stop.BusStopCode)) savedStopsDetails.push(stop);
    });
    return [savedStopsDetails, savedStops];
  } catch (error) {
    console.error(error);
    return error;
  }
}

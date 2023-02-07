import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const URL = "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=";
const config = {
  headers: {
    accept: "application/json",
    AccountKey: process.env.LTA_TOKEN,
  },
};
export async function getBusStop(busStopCode) {
  try {
    let res = await axios.get(`${URL}${busStopCode}`, config);
    let data = res.data;
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
}

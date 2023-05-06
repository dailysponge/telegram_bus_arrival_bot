import allStops from "../allStops.json" assert { type: "json" };
import harvensine from "haversine-distance";

let stops = allStops.stops;
export async function getPotentialBusStop(lat, long) {
  let closestStop = [];
  stops.forEach((stop) => {
    let distance = harvensine(
      { latitude: lat, longitude: long },
      { latitude: stop.Latitude, longitude: stop.Longitude }
    );
    if (distance < 100) {
      closestStop.push(stop);
    }
  });
  return closestStop;
}

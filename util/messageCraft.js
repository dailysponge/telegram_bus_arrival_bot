export function craftMessage(data) {
  try {
    let message = `Bus stop ${data.BusStopCode} \n`;
    data.Services.forEach((bus) => {
      let busArrival = bus.NextBus.EstimatedArrival
        ? bus.NextBus.EstimatedArrival.split("T")[1].split(":").slice(0, 2).join(":")
        : "No bus";
      let busArrivalNext = bus.NextBus2.EstimatedArrival
        ? bus.NextBus2.EstimatedArrival.split("T")[1].split(":").slice(0, 2).join(":")
        : "No bus";
      let timeToArrival = parseTimeDifference(busArrival);
      let timeToArrivalNext = parseTimeDifference(busArrivalNext);
      let load = bus.NextBus.Load ? loadCheck(bus.NextBus.Load) : "";
      let loadNext = bus.NextBus2.Load ? loadCheck(bus.NextBus2.Load) : "";
      let minuteChecker = timeToArrival === "Now" ? "" : "min";
      let minuteCheckerNext = timeToArrivalNext === "Now" ? "" : "min";
      message +=
        `🚍 ${bus.ServiceNo}: ` +
        `   ${timeToArrival} ${minuteChecker} ${" ".padEnd(
          generatePaddingLength(bus.ServiceNo, timeToArrival),
          " "
        )} ${load}` +
        ` ${timeToArrivalNext} ${minuteCheckerNext} ${" ".padEnd(
          generatePaddingLength(bus.ServiceNo, timeToArrivalNext),
          " "
        )} ${loadNext} \n`;
    });
    return message;
  } catch (error) {
    console.error(error);
    return error;
  }
}

function parseTimeDifference(time) {
  try {
    if (time === "No bus") {
      return "";
    }
    const currentTime = new Date();
    const givenTime = time;

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const givenHour = parseInt(givenTime.slice(0, 2), 10);
    const givenMinute = parseInt(givenTime.slice(3, 5), 10);

    const hourDifference = givenHour - currentHour;
    const minuteDifference = givenMinute - currentMinute;

    let totalMinuteDifference = hourDifference * 60 + minuteDifference;
    totalMinuteDifference = totalMinuteDifference <= 0 ? "Now" : totalMinuteDifference;

    return totalMinuteDifference;
  } catch (error) {
    console.error(error);
    return error;
  }
}
function loadCheck(load) {
  let loadMap = {
    SEA: "🟢",
    SDA: "🟠",
    LSD: "🔴",
  };
  return loadMap[load];
}
function generatePaddingLength(busNumber, timeToArrival) {
  let minuteCheckerPadLength = timeToArrival === "Now" ? 5 : 0;
  let paddingLength =
    2 * (3 - busNumber.length) + 2 * (2 - String(timeToArrival).length) + minuteCheckerPadLength;
  return paddingLength;
}

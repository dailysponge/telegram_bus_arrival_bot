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
      let busArrivalNextNext = bus.NextBus3.EstimatedArrival
        ? bus.NextBus2.EstimatedArrival.split("T")[1].split(":").slice(0, 2).join(":")
        : "No bus";

      let type = (type) => {
        switch (type) {
          case "SD":
          case "BD":
            return "(SD)";
          case "DD":
            return "(DD)";
          default:
            return "";
        }
      };

      let timeToArrival = parseTimeDifference(busArrival);
      let timeToArrivalNext = parseTimeDifference(busArrivalNext);
      let timeToArrivalNextNext = parseTimeDifference(busArrivalNextNext);

      let load = bus.NextBus.Load ? loadCheck(bus.NextBus.Load) : "";
      let loadNext = bus.NextBus2.Load ? loadCheck(bus.NextBus2.Load) : "";
      let loadNextNext = bus.NextBus3.Load ? loadCheck(bus.NextBus3.Load) : "";

      let minuteChecker = timeToArrival === "Now" ? "" : "min";
      let minuteCheckerNext =
        timeToArrivalNext === "Now" || timeToArrivalNext == "Not available" ? "" : "min";
      let minuteCheckerNextNext =
        timeToArrivalNextNext == "Now" || timeToArrivalNextNext == "Not available" ? "" : "min";

      let [busNoPadding, arrivalPadding] = generatePaddingLength(
        bus.ServiceNo,
        timeToArrival,
        minuteChecker,
        false
      );

      let [busNoPaddingNext, arrivalPaddingNext] = generatePaddingLength(
        bus.ServiceNo,
        timeToArrivalNext,
        minuteCheckerNext,
        true
      );

      let [busNoPaddingNextNext, arrivalPaddingNextNext] = generatePaddingLength(
        bus.ServiceNo,
        timeToArrivalNextNext,
        minuteCheckerNextNext,
        true
      );

      message +=
        `🚍 ${bus.ServiceNo}: ` +
        ` ${busNoPadding} ${timeToArrival} ${minuteChecker}${
          timeToArrival !== "Not available" ? type(bus.NextBus.Type) : ""
        } ${arrivalPadding} ${load}` +
        ` ${busNoPaddingNext} ${timeToArrivalNext} ${minuteCheckerNext}${
          timeToArrivalNext !== "Not available" ? type(bus.NextBus2.Type) : ""
        } ${arrivalPaddingNext} ${loadNext}\n`;
      // +
      // ` ${busNoPaddingNextNext} ${timeToArrivalNextNext} ${minuteCheckerNextNext}${
      //   timeToArrivalNextNext !== "Not available" ? type(bus.NextBus3.Type) : ""
      // } ${arrivalPaddingNextNext} ${loadNextNext} \n`;
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
      return "Not available";
    }

    const date = new Date(); // create a new Date object

    const options = {
      timeZone: "Asia/Singapore", // set the timezone to GMT+8
      hour12: false, // use 24-hour time format
    };

    const currentTime = new Date(date.toLocaleString("en-US", options)); // convert the date to Singapore time

    // const currentTime = new Date();
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
  try {
    let loadMap = {
      SEA: "🟢",
      SDA: "🟠",
      LSD: "🔴",
    };
    return loadMap[load];
  } catch (error) {
    console.error(error);
    return error;
  }
}

function generatePaddingLength(busNumber, timeToArrival, minChecker, next) {
  try {
    let busNoPadding = 2 * (3 - busNumber.length);
    busNoPadding = next ? "" : "".padEnd(busNoPadding, " ");
    let arrivalPadding = 2 * (6 - timeToArrival.toString().length - minChecker.length);
    if (timeToArrival === "Now") arrivalPadding -= 1;
    arrivalPadding = "".padEnd(arrivalPadding, " ");
    return [busNoPadding, arrivalPadding];
  } catch (error) {
    console.error(error);
    return error;
  }
}

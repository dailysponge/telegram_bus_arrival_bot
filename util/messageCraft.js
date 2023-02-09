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
      message +=
        `🚍 ${bus.ServiceNo}: ` +
        ` ${busNoPadding} ${timeToArrival} ${minuteChecker} ${arrivalPadding} ${load}` +
        ` ${busNoPaddingNext} ${timeToArrivalNext} ${minuteCheckerNext} ${arrivalPaddingNext} ${loadNext} \n`;
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
      return " Bus timing not available";
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

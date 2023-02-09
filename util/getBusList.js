export function getBusList(data) {
  try {
    let busList = [];
    let inline_keyboard_busList = [];
    for (let i = 0; i < data.Services.length; i++) {
      busList.push(data.Services[i].ServiceNo);
    }
    busList.forEach((bus) => {
      inline_keyboard_busList.push([
        { text: `Location of ${bus}`, callback_data: `${data.BusStopCode} ${bus} location` },
      ]);
    });
    return inline_keyboard_busList;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export function findBusLocation(data, busNo) {
  try {
    let services = data.Services;
    let service = services.find((service) => service.ServiceNo === busNo);
    let location = [service.NextBus.Latitude, service.NextBus.Longitude];
    return location;
  } catch (error) {
    console.error(error);
    return error;
  }
}

import fs from "fs";

export function saveStop(chatId, stopNumber) {
  try {
    const newData = { key: chatId, value: [stopNumber] };
    fs.open("savedStops.json", "r+", (error, fd) => {
      if (error) {
        console.error(error);
        return error;
      }
      fs.readFile("savedStops.json", "utf8", (error, data) => {
        if (error) {
          console.error(error);
          return error;
        }
        let allId = JSON.parse(data);
        let usernameExists = false;

        // Check if the username exists in the array
        allId.id.forEach((item) => {
          if (item[newData.key] !== undefined) {
            // Check if the stop number is already in the value array
            if (!item[newData.key].includes(newData.value[0])) {
              // Add the new stop number to the existing value array
              item[newData.key].push(newData.value[0]);
            }
            usernameExists = true;
          }
        });

        if (!usernameExists) {
          // Create a new object with the key-value pair and push it to the array
          const newObject = {};
          newObject[newData.key] = newData.value;
          allId.id.push(newObject);
        }

        fs.writeFile("savedStops.json", JSON.stringify(allId), (error) => {
          if (error) {
            console.error(error);
            return error;
          }
          console.log("The file has been updated!");
        });

        fs.close(fd, (error) => {
          if (error) {
            console.error(error);
            return error;
          }
          console.log("The file has been closed successfully");
        });
      });
    });
    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

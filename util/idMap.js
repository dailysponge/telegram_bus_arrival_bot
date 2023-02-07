import fs from "fs";

export function mapId(username, chatId) {
  try {
    const newData = { key: username, value: chatId };
    fs.open("idMap.json", "r+", (error, fd) => {
      if (error) {
        console.error(error);
        return error;
      }
      fs.readFile("idMap.json", "utf8", (error, data) => {
        if (error) {
          console.error(error);
          return error;
        }
        let allId = JSON.parse(data);
        let found = false;
        for (let i = 0; i < allId.id.length; i++) {
          if (
            allId.id[i].hasOwnProperty(newData.key) &&
            allId.id[i][newData.key] === newData.value
          ) {
            found = true;
            break;
          }
        }
        if (!found) {
          allId.id.push({ [newData.key]: newData.value });
          fs.writeFile("idMap.json", JSON.stringify(allId), (error) => {
            if (error) {
              console.error(error);
              return error;
            }
            console.log("The file has been updated!");
          });
        } else {
          console.log("Key and value already exist in the file");
        }
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

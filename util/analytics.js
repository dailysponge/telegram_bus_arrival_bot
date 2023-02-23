import fs from "fs";

export function trackUsage(username) {
  try {
    const newData = { key: username, value: 1 };
    fs.open("analytics.json", "r+", (error, fd) => {
      if (error) {
        console.error(error);
        return error;
      }
      fs.readFile("analytics.json", "utf8", (error, data) => {
        if (error) {
          console.error(error);
          return error;
        }
        let allId = JSON.parse(data);
        let usernameExists = false;

        // Check if the username exists in the array
        allId.id.forEach((item) => {
          if (item[newData.key] !== undefined) {
            item[newData.key] += 1;
            usernameExists = true;
          }
        });

        if (!usernameExists) {
          // Create a new object with the key-value pair and push it to the array
          const newObject = {};
          newObject[newData.key] = newData.value;
          allId.id.push(newObject);
        }

        fs.writeFile("analytics.json", JSON.stringify(allId), (error) => {
          if (error) {
            console.error(error);
            return error;
          }
          console.log("Analytics has been updated!");
        });

        fs.close(fd, (error) => {
          if (error) {
            console.error(error);
            return error;
          }
          console.log("Analytics has been closed successfully");
        });
      });
    });
    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function exportUsage() {
  try {
    let usage = "";
    const data = await fs.promises.readFile("analytics.json", "utf8");
    const allId = JSON.parse(data);
    allId.id.forEach((item) => {
      usage += `${Object.keys(item)[0]}: ${Object.values(item)[0]}\n`;
    });
    return usage;
  } catch (error) {
    console.error(error);
    return error;
  }
}

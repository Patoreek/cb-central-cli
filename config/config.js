import fs from "fs";
import chalk from "chalk";

export const loadBotsConfig = () => {
  let botsConfig = {};
  try {
    botsConfig = JSON.parse(fs.readFileSync("./config/bots.json", "utf8"));
    return botsConfig;
  } catch (error) {
    console.error(
      chalk.red("Error: Unable to load bots.json. Please check the file.")
    );
    process.exit(1);
  }
};

#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import axios from "axios";
import enquirer from "enquirer";

// Load bot configuration
let botsConfig = {};
try {
  botsConfig = JSON.parse(fs.readFileSync("./bots.json", "utf8"));
} catch (error) {
  console.error(
    chalk.red("Error: Unable to load bots.json. Please check the file.")
  );
  process.exit(1);
}

// Utility function to send requests to bots
const sendRequest = async (botName, action, data = {}) => {
  console.log(botName);
  botName = botName.toLowerCase();
  const bot = botsConfig[botName];
  if (!bot) {
    console.error(
      chalk.red(`Error: Bot "${botName}" not found in configuration.`)
    );
    return null;
  }

  try {
    const endpoint = `${bot.endpoint}/${action}`;
    const response =
      action === "statuses"
        ? await axios.get(endpoint)
        : await axios.post(endpoint, data);

    return response.data;
  } catch (error) {
    console.error(
      chalk.red(
        `${bot.name}: ${
          error.response ? error.response.data.message : error.message
        }`
      )
    );
    return null;
  }
};

// Main menu logic
const mainMenu = async () => {
  console.clear();
  console.log(chalk.blue("Welcome to the Central CLI for Bots!"));

  const botChoices = Object.entries(botsConfig).map(([key, bot]) => ({
    name: `${bot.name} - ${chalk.dim(bot.description)}`,
    value: key,
  }));
  botChoices.push({ name: "Exit", value: "exit" });

  const { selectedBot } = await enquirer.prompt([
    {
      type: "select",
      name: "selectedBot",
      message: "Select a bot to manage:",
      choices: botChoices,
      result: (name) => {
        // Map the selected name back to the value
        const selectedChoice = botChoices.find(
          (choice) => choice.name === name
        );
        return selectedChoice?.value;
      },
    },
  ]);

  if (selectedBot === "exit") {
    console.log(chalk.green("Goodbye!"));
    process.exit(0);
  }

  await botActionsMenu(selectedBot);
};

// Bot actions menu
const botActionsMenu = async (botKey) => {
  console.log(botKey.value);
  const bot = botsConfig[botKey];
  if (!bot) {
    console.error(
      chalk.red(`Error: Bot "${botKey}" not found in configuration.`)
    );
    return;
  }

  while (true) {
    console.clear();
    console.log(chalk.blue(`\nManaging: ${bot.name}`));

    const botOptions = [
      { name: "🟢 Start Bot", value: "start" },
      { name: "🔴 Stop Bot", value: "stop" },
      { name: "ℹ️ Get Bot Statuses", value: "statuses" },
      { name: "⬅️ Back to Main Menu", value: "back" },
    ];

    const { action } = await enquirer.prompt([
      {
        type: "select",
        name: "action",
        message: `Choose an action for ${bot.name}:`,
        choices: botOptions,
        result: (name) => {
          // Map the selected name back to the value
          const selectedOption = botOptions.find(
            (option) => option.name === name
          );
          return selectedOption?.value;
        },
      },
    ]);

    if (action === "back") {
      return;
    }

    let data = {};
    if (action === "start") {
      data = await getBotStartInputs(bot.name);
    } else if (action === "stop") {
      const statusData = await sendRequest(bot.name, "statuses");
      if (!statusData || !statusData.running_bots.length) {
        console.log(chalk.yellow("No bots are currently running."));
      } else {
        const { botName } = await enquirer.prompt([
          {
            type: "select",
            name: "botName",
            message: "Select a bot to stop:",
            choices: statusData.running_bots.map(
              (b) =>
                `${b.bot_name} (${b.bot_data.symbol}, ${b.bot_data.interval})`
            ),
          },
        ]);
        const selectedBot = statusData.running_bots.find((b) =>
          botName.includes(b.bot_name)
        );
        if (selectedBot) {
          await sendRequest(bot.name, "stop", {
            bot_name: selectedBot.bot_name,
          });
          console.log(
            chalk.green(`Successfully stopped bot: ${selectedBot.bot_name}`)
          );
        }
      }
    } else if (action === "statuses") {
      const statusData = await sendRequest(bot.name, "statuses");
      console.log(statusData || chalk.red("Failed to fetch bot statuses."));
    }

    await enquirer.prompt([
      {
        type: "input",
        name: "continue",
        message: chalk.yellow("Press Enter to continue..."),
      },
    ]);
  }
};

// Collect inputs for starting a bot
const getBotStartInputs = async (botName) => {
  const symbols = [
    "BTCUSDT",
    "ETHUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "SOLUSDT",
    "LTCUSDT",
    "BNBUSDT",
    "DOGEUSDT",
    "MATICUSDT",
    "BTCETH",
    "ETHBTC",
  ];

  // Gather inputs
  const inputs = await enquirer.prompt([
    {
      type: "autocomplete",
      name: "symbol",
      message: "Enter or select the trading pair (e.g., BTCUSDT):",
      choices: symbols,
      suggest: (input, choices) =>
        choices.filter((choice) =>
          choice.toUpperCase().includes(input.toUpperCase())
        ),
    },
    {
      type: "select",
      name: "interval",
      message: "Choose the trading interval:",
      choices: ["1m", "5m", "15m", "1h", "4h", "1d"],
      default: "1h",
    },
    {
      type: "input",
      name: "starting_trade_amount",
      message: "Enter the trade amount (USDT):",
      default: 1000,
      validate: (input) =>
        isNaN(input) || input <= 0
          ? "Quantity must be a positive number."
          : true,
    },
    {
      type: "input",
      name: "trade_allocation",
      message: "Enter the trade allocation percentage (%):",
      default: 10,
      validate: (input) =>
        isNaN(input) || input <= 0
          ? "Percentage must be a positive number."
          : true,
    },
  ]);

  try {
    const response = await sendRequest(botName, "start", inputs);
    if (response?.message) {
      console.log(chalk.green(response.message));
    }
  } catch (error) {
    console.error(chalk.red(`Failed to start bot: ${error.message}`));
  }
};

// Start the CLI
mainMenu();

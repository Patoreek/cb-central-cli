#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import axios from "axios";
import enquirer from "enquirer";

// Load bot configuration
const botsConfig = JSON.parse(fs.readFileSync("./bots.json", "utf8"));

// Utility function to send requests to bots
const sendRequest = async (botName, action, data = {}) => {
  botName = botName.toLowerCase();
  const bot = botsConfig[botName];
  if (!bot) {
    console.error(
      chalk.red(`Error: Bot "${botName}" not found in configuration.`)
    );
    return;
  }

  try {
    const endpoint = `${bot.endpoint}/${action}`;
    const response =
      action === "status"
        ? await axios.get(endpoint)
        : await axios.post(endpoint, data);

    if (action === "status") {
      const statusData = response.data;
      console.log(chalk.green(`\n${bot.name} Status:`));
      console.log(chalk.cyan(`  - Status: ${statusData.status}`));
      console.log(
        chalk.cyan(`  - Starting Price: $${statusData.starting_price}`)
      );
      console.log(
        chalk.cyan(`  - Current Price: $${statusData.current_price}`)
      );
      console.log(
        chalk.cyan(
          `  - Current Total Profits: $${statusData.current_total_profits}`
        )
      );
      console.log(
        chalk.cyan(
          `  - Weekly Total Profits: $${statusData.weekly_total_profits}`
        )
      );
      console.log(chalk.cyan(`  - Total Trades: ${statusData.total_trades}`));
      console.log(
        chalk.cyan(`  - Successful Trades: ${statusData.successful_trades}`)
      );
      console.log(chalk.cyan(`  - Failed Trades: ${statusData.failed_trades}`));
    } else {
      console.log(chalk.green(`${bot.name}: ${response.data.message}`));
    }
  } catch (error) {
    console.error(
      chalk.red(
        `${bot.name}: ${
          error.response ? error.response.data.message : error.message
        }`
      )
    );
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
      type: "select", // Using 'select' for better functionality
      name: "selectedBot",
      message: "Select a bot to manage:",
      choices: botChoices,
      result: (answer) =>
        botChoices.find((choice) => choice.name === answer).value,
    },
  ]);

  if (selectedBot === "exit") {
    console.log(chalk.green("Goodbye!"));
    process.exit(0);
  }

  await botActionsMenu(selectedBot); // Pass the key to manage the selected bot
};

// Bot actions menu
const botActionsMenu = async (botKey) => {
  const bot = botsConfig[botKey];

  // Check if bot is undefined or not found in the config
  if (!bot) {
    console.error(
      chalk.red(`Error: Bot "${botName}" not found in configuration.`)
    );
    return; // Exit the menu if the bot is not found
  }

  while (true) {
    console.clear();
    console.log(chalk.blue(`\nManaging: ${bot.name}`)); // Now we can safely access bot.name

    const botOptions = [
      { name: "🟢 Start Bot", value: "start" },
      { name: "🔴 Stop Bot", value: "stop" },
      { name: "ℹ️ Get Bot Status", value: "status" },
      { name: "⬅️ Back to Main Menu", value: "back" },
    ];

    const { action } = await enquirer.prompt([
      {
        type: "select", // Changed from 'list' to 'select' for better functionality
        name: "action",
        message: `Choose an action for ${bot.name}:`,
        choices: botOptions,
        result: (answer) =>
          botOptions.find((choice) => choice.name === answer).value,
      },
    ]);

    if (action === "back") {
      return; // Exit the current bot menu and go back to the main menu
    }

    let data = {};
    if (action === "start") {
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

      data = await enquirer.prompt([
        {
          type: "autocomplete", // Use autocomplete for symbol selection
          name: "symbol",
          message: "Enter or select the trading pair (e.g., BTCUSDT):",
          choices: symbols, // All symbols are available
          suggest: (input, choices) => {
            return choices.filter((choice) =>
              choice.toUpperCase().includes(input.toUpperCase())
            );
          },
          default: "BTCUSDT", // Default symbol
        },
        {
          type: "select", // Changed from 'list' to 'select' for better functionality
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
              ? "Quantity must be a positive number."
              : true,
        },
      ]);
    }
    // console.log(botName);
    console.log(bot.name);
    await sendRequest(bot.name, action, data);

    // Wait for user acknowledgment before returning to the actions menu
    await enquirer.prompt([
      {
        type: "input",
        name: "continue",
        message: chalk.yellow("\nPress Enter to continue..."),
      },
    ]);
  }
};

// Start the CLI
mainMenu();

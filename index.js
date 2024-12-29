#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import axios from "axios";
import inquirer from "inquirer";

// Load bot configuration
const botsConfig = JSON.parse(fs.readFileSync("./bots.json", "utf8"));

// Utility function to send requests to bots
async function sendRequest(botName, action) {
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
        : await axios.post(endpoint);

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
}

// Main menu logic
async function mainMenu() {
  console.clear();
  console.log(chalk.blue("Welcome to the Central CLI for Bots!"));

  const botChoices = Object.entries(botsConfig).map(([key, bot]) => ({
    name: `${bot.name} - ${chalk.dim(bot.description)}`, // Combine name and description
    value: key, // Use the bot key internally
  }));

  botChoices.push({ name: "Exit", value: "exit" });

  const { selectedBot } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedBot",
      message: "Select a bot to manage:",
      choices: botChoices,
      pageSize: 10,
    },
  ]);

  if (selectedBot === "exit") {
    console.log(chalk.green("Goodbye!"));
    process.exit(0);
  }

  await botActionsMenu(selectedBot);
  await mainMenu(); // Return to the main menu after managing a bot
}

// Bot actions menu
async function botActionsMenu(botName) {
  const bot = botsConfig[botName];

  while (true) {
    console.clear();
    console.log(chalk.blue(`\nManaging: ${bot.name}`));

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `Choose an action for ${bot.name}:`,
        choices: [
          { name: "🟢 Start Bot", value: "start" },
          { name: "🔴 Stop Bot", value: "stop" },
          { name: "ℹ️ Get Bot Status", value: "status" },
          { name: "⬅️ Back to Main Menu", value: "back" },
        ],
      },
    ]);

    if (action === "back") {
      return; // Exit the current bot menu and go back to the main menu
    }

    await sendRequest(botName, action);

    // Wait for user acknowledgment before returning to the actions menu
    await inquirer.prompt([
      {
        type: "input",
        name: "continue",
        message: chalk.yellow("\nPress Enter to continue..."),
      },
    ]);
  }
}

// Start the CLI
mainMenu();

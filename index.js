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
    const response = await axios.post(`${bot.endpoint}/${action}`);
    console.log(chalk.green(`${bot.name}: ${response.data.message}`));
  } catch (error) {
    console.error(
      chalk.red(
        `${bot.name}: Failed to ${action}. ${
          error.response ? error.response.data : error.message
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
}

// Bot actions menu
async function botActionsMenu(botName) {
  const bot = botsConfig[botName];

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
    return mainMenu();
  }

  await sendRequest(botName, action);
  console.log(chalk.blue("\nReturning to the main menu..."));
  setTimeout(() => mainMenu(), 1000);
}

// Start the CLI
mainMenu();

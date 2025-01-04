#!/usr/bin/env node

import chalk from "chalk";
import enquirer from "enquirer";
import { runTrendr } from "./bots/trendr.js";
import { loadBotsConfig } from "./config/config.js";
import { startWebSocketServer } from "./config/websocket.js";

startWebSocketServer();

const botsConfig = loadBotsConfig();

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

  botActionsMenu(selectedBot);
};

const botActionsMenu = (selectedBot) => {
  console.log(selectedBot);
  if (selectedBot === "trendr") runTrendr(selectedBot);
};

// Start the CLI
mainMenu();

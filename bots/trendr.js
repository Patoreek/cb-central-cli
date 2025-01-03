// ======================== IMPORTS ========================
import fs from "fs";
import chalk from "chalk";
import axios from "axios";
import enquirer from "enquirer";
import { loadBotsConfig } from "../config/config.js";

// ======================== CONFIGURATION ========================
const botsConfig = loadBotsConfig();

// ======================== API HANDLERS ========================

const sendRequest = async (botName, action, data = {}) => {
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

// ======================== USER INPUTS ========================
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

  return await enquirer.prompt([
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
          ? "Trade amount must be a positive number."
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
};

// ======================== MENU HANDLERS ========================
const promptBotAction = async (botName) => {
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
      message: `Choose an action for ${botName}:`,
      choices: botOptions,
      result: (name) =>
        botOptions.find((option) => option.name === name)?.value,
    },
  ]);

  return action;
};

const promptStopBot = async (runningBots) => {
  const { botName } = await enquirer.prompt([
    {
      type: "select",
      name: "botName",
      message: "Select a bot to stop:",
      choices: runningBots.map(
        (b) => `${b.bot_name} (${b.bot_data.symbol}, ${b.bot_data.interval})`
      ),
    },
  ]);

  return runningBots.find((b) => botName.includes(b.bot_name));
};

// ======================== DISPLAY HELPERS ========================
const displayBotStatuses = (statusData) => {
  if (!statusData?.running_bots?.length) {
    console.log(chalk.yellow("No running bots found."));
    return;
  }

  statusData.running_bots.forEach((bot) => {
    console.log(
      chalk.bold(
        `\n${chalk.blueBright("Bot Name:")} ${chalk.yellow(bot.bot_name)}`
      )
    );
    console.log(
      `${chalk.green("Profit/Loss:")} ${chalk.red(
        bot.bot_data.total_profit_loss || 0
      )} USDT`
    );
    console.log(
      `${chalk.green("Trades:")} ${chalk.cyan(bot.bot_data.total_trades || 0)}`
    );
    console.log(
      `${chalk.green("Success:")} ${chalk.cyan(
        bot.bot_data.successful_trades || 0
      )}`
    );
    console.log(
      `${chalk.red("Failed:")} ${chalk.cyan(bot.bot_data.failed_trades || 0)}`
    );
  });
};

const pauseForUser = async () => {
  await enquirer.prompt([
    {
      type: "input",
      name: "continue",
      message: chalk.yellow("Press Enter to continue..."),
    },
  ]);
};

// ======================== MAIN BOT ACTIONS ========================
const botActionsMenu = async (botKey) => {
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

    const action = await promptBotAction(bot.name);
    if (action === "back") break;

    switch (action) {
      case "start":
        const inputs = await getBotStartInputs(bot.name);
        await sendRequest(bot.name, "start", inputs);
        break;
      case "stop":
        const statusData = await sendRequest(bot.name, "statuses");
        if (statusData?.running_bots?.length) {
          const selectedBot = await promptStopBot(statusData.running_bots);
          if (selectedBot) {
            console.log(chalk.bgRed(`Stopping ${selectedBot.bot_name}...`));
            await sendRequest(bot.name, "stop", {
              bot_name: selectedBot.bot_name,
            });
            console.log(
              chalk.green(`Successfully stopped bot: ${selectedBot.bot_name}`)
            );
          }
        } else {
          console.log(chalk.yellow("No bots are currently running."));
        }
        break;
      case "statuses":
        const statuses = await sendRequest(bot.name, "statuses");
        displayBotStatuses(statuses);
        break;
      default:
        console.log(chalk.red("Invalid action selected."));
    }

    await pauseForUser();
  }
};

// ======================== ENTRY POINT ========================
export const runTrendr = async (botKey) => {
  await botActionsMenu(botKey);
};

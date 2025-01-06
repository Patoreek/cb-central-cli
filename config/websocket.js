import { WebSocketServer } from "ws";
import fs from "fs";
import pool from "./db.js";

// Create a write stream for the log file
const logStream = fs.createWriteStream("websocket.log", { flags: "a" });

export const startWebSocketServer = () => {
  const wss = new WebSocketServer({ port: 8080 });

  console.log("WebSocket server running on ws://localhost:8080");

  const log = (message) => {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${message}\n`);
  };

  const createTableIfNotExists = async (tableName) => {
    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        running BOOLEAN,
        symbol TEXT,
        fiat_stablecoin TEXT,
        base_currency TEXT,
        quote_currency TEXT,
        interval TEXT,
        trade_allocation REAL,
        trade_window TEXT,
        start_trade_time TIMESTAMP,
        end_trade_time TIMESTAMP,
        starting_trade_amount REAL,
        current_trade_amount REAL,
        base_starting_currency_quantity REAL,
        base_current_currency_quantity REAL,
        quote_current_currency_quantity REAL,
        currency_quantity_precision REAL,
        previous_market_price REAL,
        current_market_price REAL,
        total_trades INT,
        successful_trades INT,
        failed_trades INT,
        total_buys INT,
        total_sells INT,
        total_holds INT,
        total_profit_loss REAL,
        market_action TEXT,
        market_price REAL,
        market_quantity REAL,
        market_value REAL,
        market_fee REAL,
        market_net_value REAL,
        market_timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await pool.query(query);
  };

  const insertData = async (tableName, data) => {
    const query = `
      INSERT INTO ${tableName} (
        running, symbol, fiat_stablecoin, base_currency, quote_currency, interval,
        trade_allocation, trade_window, start_trade_time, end_trade_time, starting_trade_amount,
        current_trade_amount, base_starting_currency_quantity, base_current_currency_quantity,
        quote_current_currency_quantity, currency_quantity_precision, previous_market_price,
        current_market_price, total_trades, successful_trades, failed_trades, total_profit_loss,
        total_buys, total_sells, total_holds, market_action, market_price, market_quantity,
        market_value, market_fee, market_net_value
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      );
    `;
    const values = [
      data.running,
      data.symbol,
      data.fiat_stablecoin,
      data.base_currency,
      data.quote_currency,
      data.interval,
      data.trade_allocation,
      data.trade_window,
      data.start_trade_time,
      data.end_trade_time,
      data.starting_trade_amount,
      data.current_trade_amount,
      data.base_starting_currency_quantity,
      data.base_current_currency_quantity,
      data.quote_current_currency_quantity,
      data.currency_quantity_precision,
      data.previous_market_price,
      data.current_market_price,
      data.total_trades,
      data.successful_trades,
      data.failed_trades,
      data.total_profit_loss,
      data.total_buys,
      data.total_sells,
      data.total_holds,
      data.market_action,
      data.market_price,
      data.market_quantity,
      data.market_value,
      data.market_fee,
      data.market_net_value,
    ];
    await pool.query(query, values);
  };

  wss.on("connection", (ws) => {
    // console.log("New client connected");

    ws.on("message", async (message) => {
      //   log(`Received message: ${message}`);
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.log) {
        const data = JSON.parse(parsedMessage.log).data;
        // Construct the table name
        const tableName =
          `${data.base_currency}${data.quote_currency}_${data.interval}`.toLowerCase();

        try {
          // Ensure the table exists
          await createTableIfNotExists(tableName);
          // Insert the data into the table
          await insertData(tableName, data);
        } catch (error) {
          log(error);
          console.error("Error handling WebSocket message:", error);
        }
      }

      ws.send(`Server received: ${message}`);
    });

    ws.on("close", () => console.log("Client disconnected"));
    ws.on("error", (error) => console.error(`WebSocket error: ${error}`));

    ws.send("Welcome to the WebSocket server!");
  });

  return wss;
};

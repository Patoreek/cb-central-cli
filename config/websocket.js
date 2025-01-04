import { WebSocketServer } from "ws";
import fs from "fs";

const logStream = fs.createWriteStream("websocket.log", { flags: "a" });

export const startWebSocketServer = () => {
  const wss = new WebSocketServer({ port: 8080 });

  console.log("WebSocket server running on ws://localhost:8080");

  const log = (message) => {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${message}\n`);
  };

  wss.on("connection", (ws) => {
    console.log("New client connected");
    log("New client connected");

    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
      log(`Received message: ${message}`);
      ws.send(`Server received: ${message}`);
    });

    ws.on("close", () => console.log("Client disconnected"));
    ws.on("error", (error) => console.error(`WebSocket error: ${error}`));

    ws.send("Welcome to the WebSocket server!");
  });

  return wss;
};

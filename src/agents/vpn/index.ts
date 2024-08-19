import fs from "fs";
import tls from "tls";
import WebSocket from "ws";
import http from "http";
import path from "path";

const options = {
  key: "/etc/letsencrypt/live/shiptunnel.zpaceway.com-0001/privkey.pem",
  cert: "/etc/letsencrypt/live/shiptunnel.zpaceway.com-0001/fullchain.pem",
};

const server = http.createServer();

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("WebSocket connection established");

  ws.on("message", (message) => {
    console.log("Received message:", message);

    ws.send("Echo: " + message);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const tlsServer = tls.createServer(options, (socket) => {
  console.log("Client connected:", socket.remoteAddress);

  server.emit("connection", socket);
});

tlsServer.listen(3333, () => {
  console.log("VPN server listening on port 3333");
});
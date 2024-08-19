"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const tls_1 = __importDefault(require("tls"));
const ws_1 = __importDefault(require("ws"));
const http_1 = __importDefault(require("http"));
const options = {
    key: fs_1.default.readFileSync("/etc/letsencrypt/live/shiptunnel.zpaceway.com-0001/privkey.pem"),
    cert: fs_1.default.readFileSync("/etc/letsencrypt/live/shiptunnel.zpaceway.com-0001/fullchain.pem"),
};
const server = http_1.default.createServer();
const wss = new ws_1.default.Server({ noServer: true });
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
const tlsServer = tls_1.default.createServer(options, (socket) => {
    console.log("Client connected:", socket.remoteAddress);
    server.emit("connection", socket);
});
tlsServer.listen(3333, () => {
    console.log("VPN server listening on port 3333");
});

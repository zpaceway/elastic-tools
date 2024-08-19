"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const net_1 = __importDefault(require("net"));
const logger_1 = __importDefault(require("../../logger"));
const createServer = () => {
    const server = net_1.default.createServer({ allowHalfOpen: true, keepAlive: true }, (socket) => {
        socket.once("data", (data) => {
            const requestData = data.toString();
            const [requestLine] = requestData.split("\r\n");
            if (!requestLine) {
                logger_1.default.error(`---HTTP--- Invalid HTTP Request`);
                return socket.end();
            }
            const targetSocket = new net_1.default.Socket();
            const [method, fullUrl] = requestLine.split(" ");
            if (!fullUrl) {
                logger_1.default.error(`---HTTP--- Invalid HTTP Request`);
                return socket.end();
            }
            targetSocket.on("error", (err) => {
                logger_1.default.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
                targetSocket.end();
                socket.end();
            });
            socket.on("error", (err) => {
                logger_1.default.log(`Socket error: ${err.message}`);
                targetSocket.end();
                socket.end();
            });
            if (method === "CONNECT") {
                const [hostname, port] = fullUrl.split(":");
                logger_1.default.info(`---HTTP--- ${method} ${fullUrl}`);
                targetSocket.connect({ host: hostname, port: parseInt(port || "443") }, () => {
                    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
                    targetSocket.pipe(socket, { end: true });
                    socket.pipe(targetSocket, { end: true });
                    logger_1.default.success(`---HTTP--- ${method} ${fullUrl}`);
                });
            }
            else {
                const url = new URL(fullUrl);
                targetSocket.connect({ host: url.hostname, port: parseInt(url.port || "80") }, () => {
                    targetSocket.pipe(socket, { end: true });
                    targetSocket.write(data);
                    socket.pipe(targetSocket, { end: true });
                    logger_1.default.success(`---HTTP--- ${method} ${fullUrl}`);
                });
            }
        });
    });
    return server;
};
exports.createServer = createServer;

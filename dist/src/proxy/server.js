"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const net_1 = __importDefault(require("net"));
const logger_1 = __importDefault(require("../logger"));
const createServer = () => {
    const server = net_1.default.createServer({ allowHalfOpen: true, keepAlive: true }, (socket) => {
        socket.once("data", (data) => {
            const requestData = data.toString();
            const [requestLine, ...headers] = requestData.split("\r\n");
            if (!requestLine) {
                logger_1.default.error(`---HTTP--- Invalid HTTP Request`);
                return socket.end();
            }
            const [method, fullUrl] = requestLine.split(" ");
            if (!fullUrl) {
                logger_1.default.error(`---HTTP--- Invalid HTTP Request`);
                return socket.end();
            }
            if (method === "CONNECT") {
                // Handle HTTPS proxying
                const [hostname, port] = fullUrl.split(":");
                logger_1.default.info(`---HTTP--- ${method} ${fullUrl}`);
                const targetSocket = net_1.default.createConnection({ host: hostname, port: parseInt(port || "443") }, () => {
                    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
                    targetSocket.pipe(socket, { end: true });
                    socket.pipe(targetSocket, { end: true });
                    logger_1.default.success(`---HTTP--- ${method} ${fullUrl}`);
                });
                targetSocket.on("error", (err) => {
                    logger_1.default.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
                    socket.end();
                });
            }
            else {
                // Handle HTTP proxying
                const url = new URL(fullUrl);
                const targetSocket = net_1.default.createConnection({ host: url.hostname, port: parseInt(url.port || "80") }, () => {
                    targetSocket.pipe(socket, { end: true });
                    targetSocket.write(data);
                    socket.pipe(targetSocket, { end: true });
                    logger_1.default.success(`---HTTP--- ${method} ${fullUrl}`);
                });
                targetSocket.on("error", (err) => {
                    logger_1.default.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
                    socket.end();
                });
            }
        });
        socket.on("error", (err) => {
            logger_1.default.log(`Socket error: ${err.message}`);
        });
    });
    return server;
};
exports.createServer = createServer;

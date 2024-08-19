"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const net_1 = __importDefault(require("net"));
const logger_1 = __importDefault(require("../../core/logger"));
const http_1 = require("../../core/http");
const createServer = () => {
    const server = net_1.default.createServer({ allowHalfOpen: true, keepAlive: true }, (socket) => {
        socket.once("data", (data) => {
            const { method, fullUrl } = (0, http_1.parseHttp)(data);
            if (!method || !fullUrl) {
                logger_1.default.error(`---PROXY--- Invalid HTTP Request`);
                return socket.end();
            }
            const targetSocket = new net_1.default.Socket();
            targetSocket.on("error", (err) => {
                logger_1.default.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
                targetSocket.end();
                socket.end();
            });
            socket.on("error", (err) => {
                logger_1.default.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
                targetSocket.end();
                socket.end();
            });
            socket.on("end", () => targetSocket.end());
            targetSocket.on("end", () => socket.end());
            logger_1.default.info(`---PROXY--- ${method} ${fullUrl}`);
            if (method === "CONNECT") {
                const [hostname, port] = fullUrl.split(":");
                return targetSocket.connect({ host: hostname, port: parseInt(port || "443") }, () => {
                    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n", (err) => {
                        if (err)
                            return socket.end();
                    });
                    targetSocket.pipe(socket, { end: true });
                    socket.pipe(targetSocket, { end: true });
                    logger_1.default.success(`---PROXY--- ${method} ${fullUrl}`);
                });
            }
            const url = new URL(fullUrl);
            targetSocket.connect({ host: url.hostname, port: parseInt(url.port || "80") }, () => {
                targetSocket.pipe(socket, { end: true });
                targetSocket.write(data, (err) => {
                    if (err)
                        return socket.end();
                });
                socket.pipe(targetSocket, { end: true });
                logger_1.default.success(`---PROXY--- ${method} ${fullUrl}`);
            });
        });
    });
    return server;
};
exports.createServer = createServer;

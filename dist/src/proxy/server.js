"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const net_1 = __importDefault(require("net"));
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const logger_1 = __importDefault(require("../logger"));
const SOCKS_VERSION_4 = 0x04;
const SOCKS_VERSION_5 = 0x05;
const handleSocks4Connection = (socket) => {
    socket.once("data", (data) => {
        if (data[0] !== SOCKS_VERSION_4) {
            logger_1.default.error("---SOCKS4--- Connection: Invalid version, closing socket.");
            socket.end();
            return;
        }
        const port = data.readUInt16BE(2);
        const ip = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
        logger_1.default.info(`---SOCKS4--- ${ip}:${port}`);
        const destinationSocket = net_1.default.createConnection({ host: ip, port }, () => {
            const response = Buffer.alloc(8);
            response.writeUInt8(0x00, 0);
            response.writeUInt8(0x5a, 1); // Request granted
            socket.write(response);
            destinationSocket.pipe(socket);
            socket.pipe(destinationSocket);
            logger_1.default.success(`---SOCKS4--- ${ip}:${port}`);
        });
        destinationSocket.on("error", (err) => {
            logger_1.default.error(`---SOCKS4--- ${ip}:${port} - ${err.message}`);
            socket.end();
        });
    });
};
const handleSocks5Connection = (socket) => {
    socket.once("data", (data) => {
        if (data[0] !== SOCKS_VERSION_5) {
            logger_1.default.error("---SOCKS5--- Connection: Invalid version, closing socket.");
            socket.end();
            return;
        }
        logger_1.default.log("📄 ---SOCKS5--- connection: Client authentication request received.");
        socket.write(Buffer.from([0x05, 0x00])); // No authentication required
        socket.once("data", (data) => {
            const cmd = data[1];
            const addrType = data[3];
            let host = "";
            let port;
            if (addrType === 0x01) {
                host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
                port = data.readUInt16BE(8);
            }
            else if (addrType === 0x03 && data[4]) {
                const hostLength = data[4];
                host = data.subarray(5, 5 + hostLength).toString();
                port = data.readUInt16BE(5 + hostLength);
            }
            else {
                logger_1.default.error("---SOCKS5--- connection: Unsupported address type, closing socket.");
                socket.end();
                return;
            }
            logger_1.default.info(`---SOCKS5--- ${host}:${port}`);
            if (cmd !== 0x01) {
                logger_1.default.error("---SOCKS5--- Connection: Unsupported command, closing socket.");
                socket.end();
                return;
            }
            const destinationSocket = net_1.default.createConnection({ host, port }, () => {
                const response = Buffer.alloc(10);
                response.writeUInt8(0x05, 0);
                response.writeUInt8(0x00, 1); // Request granted
                response.writeUInt8(0x00, 2);
                response.writeUInt8(0x01, 3); // IPv4 address type
                destinationSocket.address().address
                    .split(".")
                    .forEach((num, index) => {
                    response.writeUInt8(parseInt(num), 4 + index);
                });
                response.writeUInt16BE(destinationSocket.address().port, 8);
                socket.write(response);
                destinationSocket.pipe(socket);
                socket.pipe(destinationSocket);
                logger_1.default.success(`---SOCKS5--- ${host}:${port}`);
            });
            destinationSocket.on("error", (err) => {
                logger_1.default.error(`---SOCKS5--- ${host}:${port} - ${err.message}`);
                socket.end();
            });
        });
    });
};
const handleHttpConnection = (socket, data) => {
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
            targetSocket.pipe(socket);
            socket.pipe(targetSocket);
            logger_1.default.success(`---HTTP--- ${method} ${fullUrl}`);
        });
        targetSocket.on("error", (err) => {
            logger_1.default.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
            socket.end();
        });
    }
    else {
        // Handle HTTP proxying
        const url = new url_1.URL(fullUrl);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method,
            headers: headers.reduce((acc, line) => {
                const [key, value] = line.split(": ");
                if (key && value) {
                    acc[key] = value;
                }
                return acc;
            }, {}),
        };
        logger_1.default.info(`---HTTP--- ${method} ${fullUrl}`);
        const proxyReq = http_1.default.request(options, (proxyRes) => {
            socket.write(`HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`);
            proxyRes.rawHeaders.forEach((header, index) => {
                if (index % 2 === 0) {
                    socket.write(`${header}: ${proxyRes.rawHeaders[index + 1]}\r\n`);
                }
            });
            socket.write("\r\n");
            proxyRes.pipe(socket);
            logger_1.default.success(`---HTTP--- ${method} ${fullUrl}`);
        });
        proxyReq.on("error", (err) => {
            logger_1.default.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
            socket.end();
        });
        proxyReq.end();
    }
};
const createServer = () => {
    const server = net_1.default.createServer((socket) => {
        socket.once("data", (data) => {
            const [version, ...rest] = data;
            if (version === SOCKS_VERSION_4) {
                handleSocks4Connection(socket);
                if (rest.length)
                    socket.emit("data", data);
            }
            else if (version === SOCKS_VERSION_5) {
                handleSocks5Connection(socket);
                if (rest.length)
                    socket.emit("data", data);
            }
            else {
                handleHttpConnection(socket, data);
            }
        });
        socket.on("error", (err) => {
            logger_1.default.log(`Socket error: ${err.message}`);
        });
    });
    return server;
};
exports.createServer = createServer;

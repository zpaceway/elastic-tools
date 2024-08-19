"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTunnel = void 0;
const net_1 = __importDefault(require("net"));
const logger_1 = __importDefault(require("../core/logger"));
const constants_1 = require("../core/constants");
const crypto_1 = require("../core/crypto");
const location_1 = require("../core/location");
const platform_1 = require("../core/platform");
const assert_1 = __importDefault(require("assert"));
const createTunnel = ({ username, password, }) => {
    logger_1.default.log(`Tunnel server created with username: ${username}`);
    const availableProxiesByCountry = constants_1.COUNTRY_CODES.reduce((acc, countryCode) => {
        acc[countryCode] = [];
        return acc;
    }, {});
    const platformConnector = new platform_1.PlatformConnector({ username, password });
    const onProxyConnection = (proxySocket) => __awaiter(void 0, void 0, void 0, function* () {
        proxySocket.once("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
            proxySocket.pause();
            const key = data.toString();
            const client = yield platformConnector.getClient(key);
            (0, assert_1.default)(client);
            const proxyCountryCode = yield (0, location_1.getCountryCodeFromIpAddress)(proxySocket.remoteAddress);
            proxySocket.resume();
            if (!proxyCountryCode) {
                proxySocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                    "Content-Type: text/plain\r\n" +
                    "\r\n");
                return proxySocket.end(`Error: incorrect country code`);
            }
            logger_1.default.log(`New proxy client ${client.username} connected from ${proxyCountryCode}`);
            availableProxiesByCountry[proxyCountryCode].push(proxySocket);
            logger_1.default.info(`Available proxies on ${proxyCountryCode}: ${availableProxiesByCountry[proxyCountryCode].length}`);
        }));
    });
    const onClientConnection = (clientSocket) => __awaiter(void 0, void 0, void 0, function* () {
        clientSocket.pause();
        const clientCountryCode = yield (0, location_1.getCountryCodeFromIpAddress)(clientSocket.remoteAddress);
        clientSocket.resume();
        clientSocket.once("data", (data) => {
            clientSocket.pause();
            const key = data.subarray(0, constants_1.CLIENT_ID_MESSAGE_LENGTH).toString();
            const countryCode = data
                .subarray(constants_1.CLIENT_ID_MESSAGE_LENGTH, constants_1.LEFT_MESSAGE_PADDING)
                .toString();
            onFirstDataChunk(key, countryCode, data.subarray(constants_1.LEFT_MESSAGE_PADDING));
        });
        const onFirstDataChunk = (key, countryCode, chunk) => __awaiter(void 0, void 0, void 0, function* () {
            const client = yield platformConnector.getClient(key);
            const proxySocket = availableProxiesByCountry[countryCode].pop();
            if (!proxySocket || !client) {
                clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                    "Content-Type: text/plain\r\n" +
                    "\r\n");
                return clientSocket.end(`Error: unavailable`);
            }
            logger_1.default.log(`New client ${client.username} connected from ${clientCountryCode} to ${countryCode}`);
            logger_1.default.log(`Available proxies ${availableProxiesByCountry[countryCode].length}`);
            const sweeper = {
                buffer: Buffer.from([]),
                size: -1,
            };
            clientSocket.on("data", (data) => {
                (0, crypto_1.handleIncommingEncryptedTcpChunk)({
                    sweeper,
                    data,
                    key: client.key,
                    onDecrypted: (decrypted) => {
                        proxySocket.write(decrypted, (err) => {
                            if (!err)
                                return;
                            proxySocket.end();
                        });
                    },
                });
            });
            clientSocket.emit("data", chunk);
            clientSocket.resume();
            proxySocket.on("data", (data) => {
                const encrypted = (0, crypto_1.encryptTcpChunk)({
                    buffer: data,
                    key: client.key,
                });
                (0, crypto_1.inTcpChunks)(encrypted).forEach((chunk) => clientSocket.write(chunk));
            });
            clientSocket.on("end", () => proxySocket.end());
            proxySocket.on("end", () => clientSocket.end());
            clientSocket.on("error", () => clientSocket.end());
            proxySocket.on("error", () => proxySocket.end());
        });
    });
    const clientsServerTunnel = net_1.default.createServer({
        allowHalfOpen: true,
        keepAlive: true,
    });
    const proxiesServerTunnel = net_1.default.createServer({
        allowHalfOpen: true,
        keepAlive: true,
    });
    clientsServerTunnel.on("connection", onClientConnection);
    proxiesServerTunnel.on("connection", onProxyConnection);
    return {
        listen: () => {
            proxiesServerTunnel.listen(constants_1.PROXIES_TUNNEL_PORT);
            clientsServerTunnel.listen(constants_1.CLIENTS_TUNNEL_PORT);
        },
    };
};
exports.createTunnel = createTunnel;
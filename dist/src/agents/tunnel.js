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
const logger_1 = __importDefault(require("../logger"));
const constants_1 = require("../constants");
const crypto_1 = require("../crypto");
const location_1 = require("../location");
const platform_1 = require("../platform");
const createTunnel = ({ username, password, }) => {
    logger_1.default.log(`Tunnel server created with username: ${username}`);
    const availableProxiesByCountry = constants_1.COUNTRY_CODES.reduce((acc, countryCode) => {
        acc[countryCode] = [];
        return acc;
    }, {});
    const platformConnector = new platform_1.PlatformConnector({ username, password });
    const onProxyConnection = (proxySocket) => __awaiter(void 0, void 0, void 0, function* () {
        proxySocket.pause();
        const proxyCountryCode = yield (0, location_1.getCountryCodeFromIpAddress)(proxySocket.remoteAddress);
        proxySocket.resume();
        if (!proxyCountryCode) {
            proxySocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            return proxySocket.end(`Error: incorrect country code`);
        }
        logger_1.default.log("New proxy connected from", proxyCountryCode);
        availableProxiesByCountry[proxyCountryCode].push(proxySocket);
        logger_1.default.info(`Available proxies on ${proxyCountryCode}: ${availableProxiesByCountry[proxyCountryCode].length}`);
    });
    const onClientConnection = (clientSocket) => __awaiter(void 0, void 0, void 0, function* () {
        clientSocket.pause();
        const clientCountryCode = yield (0, location_1.getCountryCodeFromIpAddress)(clientSocket.remoteAddress);
        logger_1.default.log(`New client connected from ${clientCountryCode}`);
        clientSocket.resume();
        clientSocket.once("data", (data) => {
            clientSocket.pause();
            const clientId = data.subarray(0, constants_1.CLIENT_ID_MESSAGE_LENGTH).toString();
            const countryCode = data
                .subarray(constants_1.CLIENT_ID_MESSAGE_LENGTH, constants_1.LEFT_MESSAGE_PADDING)
                .toString();
            onFirstDataChunk(clientId, countryCode, data.subarray(constants_1.LEFT_MESSAGE_PADDING));
        });
        const onFirstDataChunk = (clientId, countryCode, chunk) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.default.log(`New client ${clientId} connected to ${countryCode}`);
            const client = yield platformConnector.getClient(clientId);
            const proxySocket = availableProxiesByCountry[countryCode].pop();
            if (!proxySocket || !client) {
                clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                    "Content-Type: text/plain\r\n" +
                    "\r\n");
                return clientSocket.end(`Error: unavailable`);
            }
            logger_1.default.log(`Available proxies ${availableProxiesByCountry[countryCode].length}`);
            const sweeper = {
                buffer: Buffer.from([]),
                size: -1,
            };
            clientSocket.on("data", (data) => {
                (0, crypto_1.handleIncommingEncryptedTcpChunk)({
                    sweeper,
                    data,
                    key: client.encryptionKey,
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
                    key: client.encryptionKey,
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

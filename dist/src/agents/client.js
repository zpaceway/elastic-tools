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
exports.createClient = void 0;
const net_1 = __importDefault(require("net"));
const constants_1 = require("../core/constants");
const crypto_1 = require("../core/crypto");
const logger_1 = __importDefault(require("../core/logger"));
const platform_1 = require("../core/platform");
const assert_1 = __importDefault(require("assert"));
const http_1 = require("../core/http");
const createClient = ({ username, password, tunnelHost, countryCode, }) => {
    logger_1.default.log(`Client Server will proxy encrypted packets to ${tunnelHost}:`);
    const platformConnector = new platform_1.PlatformConnector({ username, password });
    const onConnect = (clientSocket) => __awaiter(void 0, void 0, void 0, function* () {
        const client = yield platformConnector.getClient();
        (0, assert_1.default)(client);
        const tunnelSocket = net_1.default.createConnection({
            allowHalfOpen: false,
            keepAlive: true,
            host: tunnelHost,
            port: constants_1.CLIENTS_TUNNEL_PORT,
        });
        const sweeper = {
            buffer: Buffer.from([]),
            size: -1,
        };
        tunnelSocket.on("connect", () => {
            tunnelSocket.write(`${client.key}${countryCode}`, (err) => err && tunnelSocket.end());
            clientSocket.once("data", (data) => {
                const { method, fullUrl } = (0, http_1.parseHttp)(data);
                logger_1.default.info(`---CLIENT--- ${method} ${fullUrl}`);
                clientSocket.on("data", (data) => {
                    const encrypted = (0, crypto_1.encryptTcpChunk)({
                        buffer: data,
                        key: client.key,
                    });
                    (0, crypto_1.inTcpChunks)(encrypted).forEach((chunk) => tunnelSocket.write(chunk, (err) => err && tunnelSocket.end()));
                });
                clientSocket.emit("data", data);
            });
            tunnelSocket.on("data", (data) => {
                (0, crypto_1.handleIncommingEncryptedTcpChunk)({
                    sweeper,
                    data,
                    key: client.key,
                    onDecrypted: (decrypted) => {
                        clientSocket.write(decrypted, (err) => err && clientSocket.end());
                    },
                });
            });
        });
        clientSocket.on("end", () => tunnelSocket.end());
        tunnelSocket.on("end", () => clientSocket.end());
        clientSocket.on("error", () => clientSocket.end());
        tunnelSocket.on("error", () => tunnelSocket.end());
    });
    const clientServer = net_1.default.createServer({
        allowHalfOpen: false,
        keepAlive: true,
    });
    clientServer.on("connection", onConnect);
    return {
        listen: () => {
            clientServer.listen(constants_1.CLIENT_SERVER_PORT);
        },
    };
};
exports.createClient = createClient;

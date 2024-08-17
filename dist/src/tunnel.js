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
const logger_1 = __importDefault(require("./logger"));
const location_1 = require("./location");
const constants_1 = require("./constants");
const createTunnel = ({ countryCode }) => {
    const availableProviders = [];
    const onProviderConnection = (providerSocket) => __awaiter(void 0, void 0, void 0, function* () {
        providerSocket.pause();
        const providerCountryCode = yield (0, location_1.geoIpAddressCountryCode)(providerSocket.remoteAddress);
        providerSocket.resume();
        if (countryCode !== providerCountryCode) {
            providerSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            return providerSocket.end(`Error: incorrect country code`);
        }
        logger_1.default.log("New provider connected from", providerCountryCode);
        availableProviders.push(providerSocket);
        logger_1.default.info(`Available providers ${availableProviders.length}`);
    });
    const onClientConnection = (clientSocket) => __awaiter(void 0, void 0, void 0, function* () {
        clientSocket.pause();
        const countryCode = yield (0, location_1.geoIpAddressCountryCode)(clientSocket.remoteAddress);
        clientSocket.resume();
        logger_1.default.log("New client connected from", countryCode);
        const providerSocket = availableProviders.pop();
        if (!providerSocket) {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            return clientSocket.end(`Error: unavailable`);
        }
        logger_1.default.log(`Available providers ${availableProviders.length}`);
        clientSocket.pipe(providerSocket, { end: true });
        providerSocket.pipe(clientSocket, { end: true });
        providerSocket.on("error", (err) => {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            clientSocket.end(`Error: ${err.message}`);
        });
    });
    const clientProxyServer = net_1.default.createServer({
        allowHalfOpen: true,
        keepAlive: true,
    });
    const providerProxyServer = net_1.default.createServer({
        allowHalfOpen: true,
        keepAlive: true,
    });
    clientProxyServer.on("connection", onClientConnection);
    providerProxyServer.on("connection", onProviderConnection);
    return {
        listen: () => {
            providerProxyServer.listen(constants_1.COUNTRY_CODE_PROVIDERS_PROXY_PORT_MAPPING[countryCode]);
            clientProxyServer.listen(constants_1.COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING[countryCode]);
        },
    };
};
exports.createTunnel = createTunnel;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTunnel = void 0;
const net_1 = __importDefault(require("net"));
const createTunnel = ({ clientsProxyPort, providersProxyPort, }) => {
    const CLIENTS_PROXY_PORT = clientsProxyPort;
    const PROVIDERS_PROXY_PORT = providersProxyPort;
    const AVAILABLE_PROVIDERS = [];
    const onProviderConnection = (providerSocket) => {
        console.log("New provider added");
        AVAILABLE_PROVIDERS.push(providerSocket);
        console.log(`Available providers ${AVAILABLE_PROVIDERS.length}`);
    };
    const onClientConnection = (clientSocket) => {
        const providerSocket = AVAILABLE_PROVIDERS.pop();
        if (!providerSocket) {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            return clientSocket.end(`Error: unavailable`);
        }
        AVAILABLE_PROVIDERS.splice(AVAILABLE_PROVIDERS.findIndex((_provider) => _provider === providerSocket), 1);
        console.log(`Available providers ${AVAILABLE_PROVIDERS.length}`);
        clientSocket.pipe(providerSocket, { end: true });
        providerSocket.pipe(clientSocket, { end: true });
        providerSocket.on("error", (err) => {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            clientSocket.end(`Error: ${err.message}`);
        });
    };
    const clientProxyServer = net_1.default.createServer();
    clientProxyServer.listen(CLIENTS_PROXY_PORT);
    clientProxyServer.on("connection", onClientConnection);
    const providerProxyServer = net_1.default.createServer();
    providerProxyServer.listen(PROVIDERS_PROXY_PORT);
    providerProxyServer.on("connection", onProviderConnection);
};
exports.createTunnel = createTunnel;

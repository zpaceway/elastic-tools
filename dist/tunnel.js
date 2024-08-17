"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTunnel = void 0;
const net_1 = __importDefault(require("net"));
const createTunnel = () => {
    const availableProviders = [];
    const onProviderConnection = (providerSocket) => {
        console.log("New provider added");
        availableProviders.push(providerSocket);
        console.log(`Available providers ${availableProviders.length}`);
    };
    const onClientConnection = (clientSocket) => {
        const providerSocket = availableProviders.pop();
        if (!providerSocket) {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            return clientSocket.end(`Error: unavailable`);
        }
        console.log(`Available providers ${availableProviders.length}`);
        clientSocket.pipe(providerSocket, { end: true });
        providerSocket.pipe(clientSocket, { end: true });
        providerSocket.on("error", (err) => {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            clientSocket.end(`Error: ${err.message}`);
        });
    };
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
        listen: ({ clientsProxyPort, providersProxyPort, }) => {
            providerProxyServer.listen(providersProxyPort);
            clientProxyServer.listen(clientsProxyPort);
        },
    };
};
exports.createTunnel = createTunnel;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = void 0;
const http_1 = __importDefault(require("http"));
const net_1 = __importDefault(require("net"));
const trackers_1 = __importDefault(require("./trackers"));
const createProxy = ({ internalProviderProxyPort, providersProxyHost, providersProxyPort, minimumAvailability, }) => {
    const INTERNAL_PROVIDER_PROXY_PORT = internalProviderProxyPort;
    const PROVIDERS_PROXY_HOST = providersProxyHost;
    const PROVIDERS_PROXY_PORT = providersProxyPort;
    const MINIMUM_AVAILABILITY = minimumAvailability;
    const AVAILABLE_PROVIDERS = [];
    const logger = {
        request: (...args) => {
            console.log.apply(this, [new Date(), ">>>>", ...args]);
        },
    };
    const onRequest = (clientReq, clientRes) => {
        logger.request(clientReq.method, clientReq.url);
        const parsedUrl = new URL(clientReq.url || "");
        if (trackers_1.default.has(parsedUrl.hostname)) {
            clientRes.writeHead(500, { "Content-Type": "text/plain" });
            return clientRes.end(`Error: Rejected}`);
        }
        const options = {
            hostname: parsedUrl.hostname || "",
            port: parseInt(parsedUrl.port || "80"),
            path: parsedUrl.pathname || "",
            method: clientReq.method,
            headers: clientReq.headers,
        };
        const proxyReq = http_1.default.request(options, (proxyRes) => {
            clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(clientRes, { end: true });
        });
        proxyReq.on("error", (err) => {
            clientRes.writeHead(500, { "Content-Type": "text/plain" });
            clientRes.end(`Error: ${err.message}`);
        });
        clientReq.pipe(proxyReq, { end: true });
    };
    const onConnect = (req, clientSocket, head) => {
        logger.request(req.method, req.url);
        const parsedUrl = new URL(`https://${req.url}`);
        const serverSocket = net_1.default.connect(parseInt(parsedUrl.port || "443"), parsedUrl.hostname || "", () => {
            clientSocket.write("HTTP/1.1 200 Connection Established\r\n" +
                "Proxy-agent: Node.js-Proxy\r\n" +
                "\r\n");
            serverSocket.write(head);
            serverSocket.pipe(clientSocket);
            clientSocket.pipe(serverSocket);
        });
        serverSocket.on("error", (err) => {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            clientSocket.end(`Error: ${err.message}`);
        });
    };
    const server = http_1.default.createServer();
    server.on("request", onRequest);
    server.on("connect", onConnect);
    server.listen(INTERNAL_PROVIDER_PROXY_PORT, () => {
        console.log(`Proxy server is running on port ${INTERNAL_PROVIDER_PROXY_PORT}`);
    });
    const createIncommingProxyConnection = () => {
        const incommingProxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: PROVIDERS_PROXY_HOST,
            port: PROVIDERS_PROXY_PORT,
        });
        const providerProxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: "localhost",
            port: INTERNAL_PROVIDER_PROXY_PORT,
        });
        AVAILABLE_PROVIDERS.push(providerProxySocket);
        if (AVAILABLE_PROVIDERS.length < MINIMUM_AVAILABILITY) {
            createIncommingProxyConnection();
        }
        const onUnavailable = () => {
            const indexOf = AVAILABLE_PROVIDERS.findIndex((provider) => provider === providerProxySocket);
            if (indexOf < 0)
                return;
            AVAILABLE_PROVIDERS.splice(indexOf, 1);
            if (AVAILABLE_PROVIDERS.length < 10) {
                createIncommingProxyConnection();
            }
        };
        incommingProxySocket.on("data", onUnavailable);
        providerProxySocket.on("data", onUnavailable);
        incommingProxySocket.on("end", onUnavailable);
        providerProxySocket.on("end", onUnavailable);
        incommingProxySocket.pipe(providerProxySocket, { end: true });
        providerProxySocket.pipe(incommingProxySocket, { end: true });
    };
    createIncommingProxyConnection();
};
exports.createProxy = createProxy;

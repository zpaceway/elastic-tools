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
exports.createProxy = void 0;
const http_1 = __importDefault(require("http"));
const net_1 = __importDefault(require("net"));
const trackers_1 = __importDefault(require("./trackers"));
const validateUsernameAndPassword = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!username || !password)
        return false;
    if (username === "zpaceway" && password === "123456")
        return true;
    return false;
});
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
    const parseAuthorization = (authHeader) => {
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return null;
        }
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
        const [username, password] = credentials.split(":");
        return { username, password };
    };
    const checkAuthorization = (authHeader) => __awaiter(void 0, void 0, void 0, function* () {
        const credentials = parseAuthorization(authHeader);
        if (!credentials) {
            return false;
        }
        const { username, password } = credentials;
        return validateUsernameAndPassword(username, password);
    });
    const unauthorizedResponse = (clientRes) => {
        clientRes.writeHead(401, {
            "Content-Type": "text/plain",
            "WWW-Authenticate": 'Basic realm="Access to the proxy"',
        });
        clientRes.end("Unauthorized");
    };
    const onRequest = (clientReq, clientRes) => __awaiter(void 0, void 0, void 0, function* () {
        logger.request(clientReq.method, clientReq.url);
        clientReq.pause();
        const authorized = yield checkAuthorization(clientReq.headers.authorization).catch(() => false);
        if (!authorized) {
            return unauthorizedResponse(clientRes);
        }
        clientReq.resume();
        const parsedUrl = new URL(clientReq.url || "");
        if (trackers_1.default.has(parsedUrl.hostname)) {
            clientRes.writeHead(500, { "Content-Type": "text/plain" });
            return clientRes.end("Error: Rejected");
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
    });
    const onConnect = (req, clientSocket, head) => {
        logger.request(req.method, req.url);
        if (!checkAuthorization(req.headers.authorization)) {
            clientSocket.write("HTTP/1.1 401 Unauthorized\r\n" +
                'WWW-Authenticate: Basic realm="Access to the proxy"\r\n' +
                "Content-Type: text/plain\r\n" +
                "\r\n" +
                "Unauthorized");
            return clientSocket.end();
        }
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

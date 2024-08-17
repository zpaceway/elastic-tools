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
const constants_1 = require("./constants");
const createClient = ({ tunnelHost, countryCode, }) => {
    const onConnect = (clientSocket) => __awaiter(void 0, void 0, void 0, function* () {
        const tunnelSocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: tunnelHost,
            port: constants_1.COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING[countryCode],
        });
        clientSocket.pipe(tunnelSocket, { end: true });
        tunnelSocket.pipe(clientSocket, { end: true });
        tunnelSocket.on("error", (err) => {
            clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n" +
                "Content-Type: text/plain\r\n" +
                "\r\n");
            clientSocket.end(`Error: ${err.message}`);
        });
    });
    const clientServer = net_1.default.createServer({
        allowHalfOpen: true,
        keepAlive: true,
    });
    clientServer.on("connection", onConnect);
    return {
        listen: () => {
            clientServer.listen(constants_1.CLIENTS_PROXY_PORT);
        },
    };
};
exports.createClient = createClient;

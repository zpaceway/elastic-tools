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
const platform_1 = require("../core/platform");
const net_1 = __importDefault(require("net"));
const location_1 = require("../core/location");
const constants_1 = require("../core/constants");
const logger_1 = __importDefault(require("../core/logger"));
const assert_1 = __importDefault(require("assert"));
const http_1 = require("../core/http");
class JumpersManager {
    constructor({ platformConnector, tunnelHost, minimumAvailability, }) {
        this.jumpers = [];
        this.platformConnector = platformConnector;
        this.tunnelHost = tunnelHost;
        this.minimumAvailability = minimumAvailability;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const [client, countryCode] = yield Promise.all([
                this.platformConnector.getClient(),
                (0, location_1.getCountryCodeFromIpAddress)(),
            ]);
            (0, assert_1.default)(client);
            (0, assert_1.default)(countryCode);
            return client;
        });
    }
    createJumper() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.initialize();
            const jumper = Symbol();
            const tunnelSocket = net_1.default.createConnection({
                allowHalfOpen: false,
                keepAlive: true,
                host: this.tunnelHost,
                port: constants_1.PROXIES_TUNNEL_PORT,
            });
            this.jumpers.push(jumper);
            if (this.jumpers.length < this.minimumAvailability) {
                this.createJumper();
            }
            const onUnavailable = () => {
                const indexOf = this.jumpers.findIndex((_jumper) => _jumper === jumper);
                if (indexOf < 0)
                    return;
                this.jumpers.splice(indexOf, 1);
                if (this.jumpers.length < 10) {
                    this.createJumper();
                }
            };
            ["error", "data", "end", "close", "timeout"].forEach((event) => {
                tunnelSocket.once(event, onUnavailable);
            });
            tunnelSocket.write(client.key, (err) => err && tunnelSocket.end());
            tunnelSocket.on("error", () => tunnelSocket.end());
            tunnelSocket.once("data", (data) => {
                const { method, fullUrl } = (0, http_1.parseHttp)(data);
                if (!method || !fullUrl) {
                    logger_1.default.error(`---PROXY--- Invalid HTTP Request`);
                    return tunnelSocket.end();
                }
                const targetSocket = new net_1.default.Socket();
                targetSocket.on("error", (err) => {
                    logger_1.default.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
                    targetSocket.end();
                });
                tunnelSocket.on("error", (err) => {
                    logger_1.default.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
                    tunnelSocket.end();
                });
                tunnelSocket.on("end", () => targetSocket.end());
                targetSocket.on("end", () => tunnelSocket.end());
                logger_1.default.info(`---PROXY--- ${method} ${fullUrl}`);
                if (method === "CONNECT") {
                    const [hostname, port] = fullUrl.split(":");
                    return targetSocket.connect({ host: hostname, port: parseInt(port || "443") }, () => {
                        tunnelSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n", (err) => err && tunnelSocket.end());
                        targetSocket.pipe(tunnelSocket);
                        tunnelSocket.pipe(targetSocket);
                        logger_1.default.success(`---PROXY--- ${method} ${fullUrl}`);
                    });
                }
                const url = new URL(fullUrl);
                targetSocket.connect({ host: url.hostname, port: parseInt(url.port || "80") }, () => {
                    targetSocket.write(data, (err) => err && targetSocket.end());
                    targetSocket.pipe(tunnelSocket);
                    tunnelSocket.pipe(targetSocket);
                    logger_1.default.success(`---PROXY--- ${method} ${fullUrl}`);
                });
            });
            const interval = setInterval(() => {
                tunnelSocket.write(Buffer.from([]), (err) => {
                    if (err) {
                        tunnelSocket.end();
                        clearInterval(interval);
                    }
                });
            }, constants_1.KEEP_ALIVE_INTERVAL);
        });
    }
}
const createProxy = ({ username, password, tunnelHost, minimumAvailability, }) => {
    const platformConnector = new platform_1.PlatformConnector({ username, password });
    const jumpersManager = new JumpersManager({
        platformConnector,
        minimumAvailability,
        tunnelHost,
    });
    return {
        listen: () => {
            jumpersManager.createJumper();
        },
    };
};
exports.createProxy = createProxy;

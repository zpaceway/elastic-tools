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
exports.createProxy = exports.createJumpers = void 0;
const platform_1 = require("../core/platform");
const net_1 = __importDefault(require("net"));
const location_1 = require("../core/location");
const constants_1 = require("../core/constants");
const logger_1 = __importDefault(require("../core/logger"));
const assert_1 = __importDefault(require("assert"));
const http_1 = require("../core/http");
const createJumpers = (_a) => __awaiter(void 0, [_a], void 0, function* ({ platformConnector, tunnelHost, minimumAvailability, }) {
    const client = yield platformConnector.getClient();
    (0, assert_1.default)(client);
    const countryCode = yield (0, location_1.getCountryCodeFromIpAddress)();
    if (!countryCode)
        return logger_1.default.error("Unsupported Country Code");
    const availableJumpers = [];
    const createJumper = () => {
        const jumper = Symbol();
        const tunnelSocket = net_1.default.createConnection({
            allowHalfOpen: false,
            keepAlive: true,
            host: tunnelHost,
            port: constants_1.PROXIES_TUNNEL_PORT,
        });
        availableJumpers.push(jumper);
        if (availableJumpers.length < minimumAvailability) {
            createJumper();
        }
        const onUnavailable = () => {
            const indexOf = availableJumpers.findIndex((_jumper) => _jumper === jumper);
            if (indexOf < 0)
                return;
            availableJumpers.splice(indexOf, 1);
            if (availableJumpers.length < 10) {
                createJumper();
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
    };
    createJumper();
});
exports.createJumpers = createJumpers;
const createProxy = ({ username, password, tunnelHost, minimumAvailability, }) => {
    const platformConnector = new platform_1.PlatformConnector({ username, password });
    return {
        listen: () => {
            (0, exports.createJumpers)({
                platformConnector,
                tunnelHost,
                minimumAvailability,
            });
        },
    };
};
exports.createProxy = createProxy;

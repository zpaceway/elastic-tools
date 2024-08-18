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
exports.createJumpers = void 0;
const net_1 = __importDefault(require("net"));
const location_1 = require("../location");
const constants_1 = require("../constants");
const logger_1 = __importDefault(require("../logger"));
const createJumpers = (_a) => __awaiter(void 0, [_a], void 0, function* ({ tunnelHost, minimumAvailability, }) {
    const countryCode = yield (0, location_1.getCountryCodeFromIpAddress)();
    if (!countryCode)
        return logger_1.default.error("Unsupported Country Code");
    const availableJumpers = [];
    const createJumper = () => {
        const jumper = Symbol();
        const tunnelSocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: tunnelHost,
            port: constants_1.PROXIES_TUNNEL_PORT,
        });
        const proxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: "127.0.0.1",
            port: constants_1.PROXY_SERVER_PORT,
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
        ["data", "end", "close", "timeout"].map((event) => {
            tunnelSocket.on(event, onUnavailable);
            proxySocket.on(event, onUnavailable);
        });
        tunnelSocket.pipe(proxySocket, { end: true });
        proxySocket.pipe(tunnelSocket, { end: true });
    };
    createJumper();
});
exports.createJumpers = createJumpers;

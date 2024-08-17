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
const server_1 = require("./server");
const jumper_1 = require("./jumper");
const location_1 = require("../location");
const constants_1 = require("../constants");
const logger_1 = __importDefault(require("../logger"));
const createProxy = (_a) => __awaiter(void 0, [_a], void 0, function* ({ tunnelHost, minimumAvailability, }) {
    const server = (0, server_1.createServer)();
    const countryCode = yield (0, location_1.getCountryCodeFromIpAddress)();
    if (!countryCode)
        return logger_1.default.error("Unsupported Country Code");
    return {
        listen: () => {
            server.listen(constants_1.PROVIDERS_PROXY_PORT, "127.0.0.1");
            (0, jumper_1.createJumpers)({
                countryCode,
                tunnelHost,
                minimumAvailability,
            });
        },
    };
});
exports.createProxy = createProxy;

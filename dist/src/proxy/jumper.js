"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJumpers = void 0;
const net_1 = __importDefault(require("net"));
const createJumpers = ({ internalProviderProxyPort, providersProxyHost, providersProxyPort, minimumAvailability, }) => {
    const availableJumpers = [];
    const createJumper = () => {
        const jumper = Symbol();
        const incommingProxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: providersProxyHost,
            port: providersProxyPort,
        });
        const providerProxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: "127.0.0.1",
            port: internalProviderProxyPort,
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
            incommingProxySocket.on(event, onUnavailable);
            providerProxySocket.on(event, onUnavailable);
        });
        incommingProxySocket.pipe(providerProxySocket, { end: true });
        providerProxySocket.pipe(incommingProxySocket, { end: true });
    };
    createJumper();
};
exports.createJumpers = createJumpers;

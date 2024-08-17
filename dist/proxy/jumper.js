"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJumpers = void 0;
const net_1 = __importDefault(require("net"));
const createJumpers = ({ internalProviderProxyPort, providersProxyHost, providersProxyPort, minimumAvailability, }) => {
    const availableProviders = [];
    const createJumper = () => {
        const incommingProxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: providersProxyHost,
            port: providersProxyPort,
        });
        const providerProxySocket = net_1.default.connect({
            allowHalfOpen: true,
            keepAlive: true,
            host: "localhost",
            port: internalProviderProxyPort,
        });
        availableProviders.push(providerProxySocket);
        if (availableProviders.length < minimumAvailability) {
            createJumper();
        }
        const onUnavailable = () => {
            const indexOf = availableProviders.findIndex((provider) => provider === providerProxySocket);
            if (indexOf < 0)
                return;
            availableProviders.splice(indexOf, 1);
            if (availableProviders.length < 10) {
                createJumper();
            }
        };
        incommingProxySocket.on("data", onUnavailable);
        providerProxySocket.on("data", onUnavailable);
        incommingProxySocket.on("end", onUnavailable);
        providerProxySocket.on("end", onUnavailable);
        incommingProxySocket.pipe(providerProxySocket, { end: true });
        providerProxySocket.pipe(incommingProxySocket, { end: true });
    };
};
exports.createJumpers = createJumpers;

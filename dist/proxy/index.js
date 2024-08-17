"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = void 0;
const server_1 = require("./server");
const jumper_1 = require("./jumper");
const createProxy = ({ providersProxyHost, providersProxyPort, minimumAvailability, }) => {
    const server = (0, server_1.createServer)();
    return {
        listen: ({ internalProviderProxyPort, }) => {
            server.listen(internalProviderProxyPort);
            (0, jumper_1.createJumpers)({
                internalProviderProxyPort,
                providersProxyHost,
                providersProxyPort,
                minimumAvailability,
            });
        },
    };
};
exports.createProxy = createProxy;

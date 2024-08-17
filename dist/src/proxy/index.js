"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = void 0;
const server_1 = require("./server");
const jumper_1 = require("./jumper");
const constants_1 = require("../constants");
const createProxy = ({ countryCode, tunnelHost, minimumAvailability, }) => {
    const server = (0, server_1.createServer)();
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
};
exports.createProxy = createProxy;

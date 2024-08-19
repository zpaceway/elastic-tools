"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = void 0;
const server_1 = require("./server");
const jumper_1 = require("./jumper");
const constants_1 = require("../../core/constants");
const platform_1 = require("../../core/platform");
const createProxy = ({ username, password, tunnelHost, minimumAvailability, }) => {
    const platformConnector = new platform_1.PlatformConnector({ username, password });
    const server = (0, server_1.createServer)();
    return {
        listen: () => {
            server.listen(constants_1.PROXY_SERVER_PORT, "127.0.0.1");
            (0, jumper_1.createJumpers)({
                platformConnector,
                tunnelHost,
                minimumAvailability,
            });
        },
    };
};
exports.createProxy = createProxy;

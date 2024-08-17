"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const tunnel = (0, src_1.createTunnel)();
tunnel.listen({
    clientsProxyPort: 53505,
    providersProxyPort: 53506,
});
const proxy = (0, src_1.createProxy)({
    minimumAvailability: 10,
    providersProxyHost: "localhost",
    providersProxyPort: 53506,
});
proxy.listen({ internalProviderProxyPort: 53507 });

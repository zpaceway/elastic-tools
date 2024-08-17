"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const tunnel = (0, src_1.createTunnel)({ countryCode: "EC" });
tunnel.listen();
const proxy = (0, src_1.createProxy)({
    tunnelHost: "localhost",
    minimumAvailability: 10,
});
proxy.listen();
const client = (0, src_1.createClient)({
    tunnelHost: "elastic.zpaceway.com",
    countryCode: "US",
});
client.listen();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
// const tunnel = createTunnel({
//   username: "zpaceway",
//   password: "123456",
// });
// tunnel.listen();
// const proxy = createProxy({
//   username: "guido",
//   password: "123456",
//   tunnelHost: "localhost",
//   minimumAvailability: 10,
// });
// proxy.listen();
const client = (0, src_1.createClient)({
    username: "alexandro",
    password: "123456",
    tunnelHost: "elastic.zpaceway.com",
    countryCode: "US",
});
client.listen();

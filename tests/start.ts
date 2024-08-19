import { createTunnel, createProxy, createClient } from "../src";

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

const client = createClient({
  username: "alexandro",
  password: "123456",
  tunnelHost: "elastic.zpaceway.com",
  countryCode: "EC",
});
client.listen();

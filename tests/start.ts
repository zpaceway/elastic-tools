import { createTunnel, createProxy, createClient } from "../src";

const tunnel = createTunnel({ countryCode: "EC" });
tunnel.listen();

createProxy({
  tunnelHost: "localhost",
  minimumAvailability: 10,
}).then((proxy) => proxy && proxy.listen());

const client = createClient({
  tunnelHost: "elastic.zpaceway.com",
  countryCode: "US",
});
client.listen();

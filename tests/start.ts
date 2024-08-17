import { createTunnel, createProxy, createClient } from "../src";

const tunnel = createTunnel({ countryCode: "EC" });
tunnel.listen();

const proxy = createProxy({
  countryCode: "EC",
  tunnelHost: "localhost",
  minimumAvailability: 10,
});
proxy.listen();

const client = createClient({
  tunnelHost: "elastic.zpaceway.com",
  countryCode: "US",
});
client.listen();

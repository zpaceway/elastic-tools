import { createTunnel, createProxy, createClient } from "../src";

const tunnel = createTunnel();
tunnel.listen();

const proxy = createProxy({
  tunnelHost: "localhost",
  minimumAvailability: 10,
});
proxy.listen();

const client = createClient({
  tunnelHost: "localhost",
  countryCode: "EC",
});
client.listen();

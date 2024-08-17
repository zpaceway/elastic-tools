import { createTunnel, createProxy } from "../src";

const tunnel = createTunnel();
tunnel.listen({
  clientsProxyPort: 53505,
  providersProxyPort: 53506,
});

const proxy = createProxy({
  minimumAvailability: 10,
  providersProxyHost: "localhost",
  providersProxyPort: 53506,
});
proxy.listen({ internalProviderProxyPort: 53507 });

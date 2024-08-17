import net from "net";
import logger from "./logger";
import { CountryCode, geoIpAddressCountryCode } from "./location";
import {
  COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING,
  COUNTRY_CODE_PROVIDERS_PROXY_PORT_MAPPING,
} from "./constants";

export const createTunnel = ({ countryCode }: { countryCode: CountryCode }) => {
  const availableProviders: net.Socket[] = [];

  const onProviderConnection = async (providerSocket: net.Socket) => {
    providerSocket.pause();
    const providerCountryCode = await geoIpAddressCountryCode(
      providerSocket.remoteAddress
    );
    providerSocket.resume();

    if (countryCode !== providerCountryCode) {
      providerSocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      return providerSocket.end(`Error: incorrect country code`);
    }

    logger.log("New provider connected from", providerCountryCode);
    availableProviders.push(providerSocket);
    logger.info(`Available providers ${availableProviders.length}`);
  };

  const onClientConnection = async (clientSocket: net.Socket) => {
    clientSocket.pause();
    const countryCode = await geoIpAddressCountryCode(
      clientSocket.remoteAddress
    );
    clientSocket.resume();
    logger.log("New client connected from", countryCode);
    const providerSocket = availableProviders.pop();

    if (!providerSocket) {
      clientSocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      return clientSocket.end(`Error: unavailable`);
    }

    logger.log(`Available providers ${availableProviders.length}`);

    clientSocket.pipe(providerSocket, { end: true });
    providerSocket.pipe(clientSocket, { end: true });

    providerSocket.on("error", (err) => {
      clientSocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      clientSocket.end(`Error: ${err.message}`);
    });
  };

  const clientProxyServer = net.createServer({
    allowHalfOpen: true,
    keepAlive: true,
  });
  const providerProxyServer = net.createServer({
    allowHalfOpen: true,
    keepAlive: true,
  });

  clientProxyServer.on("connection", onClientConnection);
  providerProxyServer.on("connection", onProviderConnection);

  return {
    listen: () => {
      providerProxyServer.listen(
        COUNTRY_CODE_PROVIDERS_PROXY_PORT_MAPPING[countryCode]
      );
      clientProxyServer.listen(
        COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING[countryCode]
      );
    },
  };
};

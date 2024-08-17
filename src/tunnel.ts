import net from "net";
import logger from "./logger";
import { CountryCode, getCountryCodeFromIpAddress } from "./location";
import {
  COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING,
  COUNTRY_CODE_PROVIDERS_PROXY_PORT_MAPPING,
  PUBLIC_KEY,
} from "./constants";
import {
  decryptBuffer,
  encryptBuffer,
  handleIncommingEncryptedMessage,
  inTcpChunks,
} from "./crypto";

export const createTunnel = ({ countryCode }: { countryCode: CountryCode }) => {
  const availableProviders: net.Socket[] = [];

  const onProviderConnection = async (providerSocket: net.Socket) => {
    providerSocket.pause();
    const providerCountryCode = await getCountryCodeFromIpAddress(
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
    const countryCode = await getCountryCodeFromIpAddress(
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

    const incommingEncryptedMessage = {
      buffer: Buffer.from([]),
      size: -1,
    };

    clientSocket.on("data", (data) => {
      handleIncommingEncryptedMessage({
        incommingEncryptedMessage,
        targetSocket: providerSocket,
        data,
      });
    });

    providerSocket.on("data", (data) => {
      const encrypted = encryptBuffer(data, PUBLIC_KEY);
      inTcpChunks(encrypted).forEach((chunk) => clientSocket.write(chunk));
    });

    clientSocket.on("end", providerSocket.end);
    providerSocket.on("end", clientSocket.end);

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

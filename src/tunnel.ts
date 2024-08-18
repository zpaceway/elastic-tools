import net from "net";
import logger from "./logger";
import {
  CLIENTS_TUNNEL_PORT,
  COUNTRY_CODES,
  CountryCode,
  PROXIES_TUNNEL_PORT,
  PUBLIC_KEY,
} from "./constants";
import {
  encryptTcpChunk,
  handleIncommingEncryptedTcpChunk,
  inTcpChunks,
} from "./crypto";
import { getCountryCodeFromIpAddress } from "./location";

export const createTunnel = () => {
  const availableProxiesByCountry: Record<CountryCode, net.Socket[]> =
    COUNTRY_CODES.reduce((acc, countryCode) => {
      acc[countryCode] = [];
      return acc;
    }, {} as Record<CountryCode, net.Socket[]>);

  const onProxyConnection = async (proxySocket: net.Socket) => {
    proxySocket.pause();
    const proxyCountryCode = await getCountryCodeFromIpAddress(
      proxySocket.remoteAddress
    );
    proxySocket.resume();

    if (!proxyCountryCode) {
      proxySocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      return proxySocket.end(`Error: incorrect country code`);
    }

    logger.log("New proxy connected from", proxyCountryCode);
    availableProxiesByCountry[proxyCountryCode].push(proxySocket);
    logger.info(
      `Available proxies on ${proxyCountryCode}: ${availableProxiesByCountry[proxyCountryCode].length}`
    );
  };

  const onClientConnection = async (clientSocket: net.Socket) => {
    clientSocket.pause();
    const clientsCountryCode = await getCountryCodeFromIpAddress(
      clientSocket.remoteAddress
    );
    clientSocket.resume();

    clientSocket.once("data", (data) => {
      clientSocket.pause();
      const countryCode = data.subarray(0, 2).toString() as CountryCode;
      onCountryCode(countryCode, data.subarray(2));
    });

    const onCountryCode = (countryCode: CountryCode, chunk: Buffer) => {
      logger.log(`New client connected to ${countryCode}`);
      const proxySocket = availableProxiesByCountry[countryCode].pop();

      if (!proxySocket) {
        clientSocket.write(
          "HTTP/1.1 500 Internal Server Error\r\n" +
            "Content-Type: text/plain\r\n" +
            "\r\n"
        );
        return clientSocket.end(`Error: unavailable`);
      }

      logger.log(
        `Available proxies ${availableProxiesByCountry[countryCode].length}`
      );

      const sweeper = {
        buffer: Buffer.from([]),
        size: -1,
      };

      clientSocket.on("data", (data) => {
        handleIncommingEncryptedTcpChunk({
          sweeper,
          data,
          onDecrypted: (decrypted) => {
            proxySocket.write(decrypted, (err) => {
              if (!err) return;
              proxySocket.end();
            });
          },
        });
      });
      clientSocket.emit("data", chunk);
      clientSocket.resume();

      proxySocket.on("data", (data) => {
        const encrypted = encryptTcpChunk({
          buffer: data,
          key: PUBLIC_KEY,
        });
        inTcpChunks(encrypted).forEach((chunk) => clientSocket.write(chunk));
      });

      clientSocket.on("end", proxySocket.end);
      proxySocket.on("end", clientSocket.end);

      proxySocket.on("error", (err) => {
        clientSocket.write(
          "HTTP/1.1 500 Internal Server Error\r\n" +
            "Content-Type: text/plain\r\n" +
            "\r\n"
        );
        clientSocket.end(`Error: ${err.message}`);
      });
    };
  };

  const clientsServerTunnel = net.createServer({
    allowHalfOpen: true,
    keepAlive: true,
  });
  const proxiesServerTunnel = net.createServer({
    allowHalfOpen: true,
    keepAlive: true,
  });

  clientsServerTunnel.on("connection", onClientConnection);
  proxiesServerTunnel.on("connection", onProxyConnection);

  return {
    listen: () => {
      proxiesServerTunnel.listen(PROXIES_TUNNEL_PORT);
      clientsServerTunnel.listen(CLIENTS_TUNNEL_PORT);
    },
  };
};

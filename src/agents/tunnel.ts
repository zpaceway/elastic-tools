import net from "net";
import logger from "../core/logger";
import {
  CLIENT_KEY_MESSAGE_LENGTH,
  CLIENTS_TUNNEL_PORT,
  COUNTRY_CODES,
  CountryCode,
  KEEP_ALIVE_INTERVAL,
  LEFT_MESSAGE_PADDING,
  PROXIES_TUNNEL_PORT,
} from "../core/constants";
import {
  encryptTcpChunk,
  handleIncommingEncryptedTcpChunk,
  inTcpChunks,
} from "../core/crypto";
import { getCountryCodeFromIpAddress } from "../core/location";
import { PlatformConnector } from "../core/platform";
import assert from "assert";
import { getFutureDate } from "../core/datetime";

export const createTunnel = ({
  username,
  password,
}: {
  username: string;
  password: string;
}) => {
  logger.log(`Tunnel server created with username: ${username}`);
  const availableProxiesByCountry: Record<CountryCode, net.Socket[]> =
    COUNTRY_CODES.reduce((acc, countryCode) => {
      acc[countryCode] = [];
      return acc;
    }, {} as Record<CountryCode, net.Socket[]>);
  const platformConnector = new PlatformConnector({ username, password });

  const onProxyConnection = async (proxySocket: net.Socket) => {
    proxySocket.once("data", async (data) => {
      proxySocket.pause();
      const key = data.toString();
      const client = await platformConnector.getClient(key);
      assert(client);
      const proxyCountryCode = await getCountryCodeFromIpAddress(
        proxySocket.remoteAddress
      );
      proxySocket.resume();

      if (!proxyCountryCode) {
        logger.error("Country code not found in request");
        return proxySocket.end();
      }

      logger.log(
        `New proxy client ${client.username} connected from ${proxyCountryCode}`
      );
      availableProxiesByCountry[proxyCountryCode].push(proxySocket);
      logger.info(
        `Available proxies on ${proxyCountryCode}: ${availableProxiesByCountry[proxyCountryCode].length}`
      );

      const fiveMinutesAfterCreation = getFutureDate(1000 * 60 * 5);
      const interval = setInterval(() => {
        proxySocket.write("", (err) => err && proxySocket.end());
        fiveMinutesAfterCreation < new Date() && proxySocket.end();
        (!proxySocket.writable || !proxySocket.readable) && proxySocket.end();
      }, KEEP_ALIVE_INTERVAL);
      proxySocket.once("end", () => clearInterval(interval));
      proxySocket.once("data", () => clearInterval(interval));

      ["error", "data", "end", "close", "timeout"].forEach((event) => {
        proxySocket.once(event, () => {
          availableProxiesByCountry[proxyCountryCode] =
            availableProxiesByCountry[proxyCountryCode].filter(
              (_proxy) => _proxy !== proxySocket
            );
        });
      });
    });
  };

  const onClientConnection = async (clientSocket: net.Socket) => {
    clientSocket.pause();
    const clientCountryCode = await getCountryCodeFromIpAddress(
      clientSocket.remoteAddress
    );

    clientSocket.resume();

    clientSocket.once("data", (data) => {
      clientSocket.pause();
      const key = data.subarray(0, CLIENT_KEY_MESSAGE_LENGTH).toString();
      const countryCode = data
        .subarray(CLIENT_KEY_MESSAGE_LENGTH, LEFT_MESSAGE_PADDING)
        .toString() as CountryCode;

      onFirstDataChunk(key, countryCode, data.subarray(LEFT_MESSAGE_PADDING));
    });

    const onFirstDataChunk = async (
      key: string,
      countryCode: CountryCode,
      chunk: Buffer
    ) => {
      const client = await platformConnector.getClient(key);
      const proxySocket = availableProxiesByCountry[countryCode].pop();

      if (!proxySocket || !client) {
        logger.error(
          `Client Unauthorized or no proxy in country ${countryCode} was found`
        );
        return clientSocket.end();
      }

      logger.log(
        `New client ${client.username} connected from ${clientCountryCode} to ${countryCode}`
      );
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
          key: client.key,
          onDecrypted: (decrypted) => {
            proxySocket.write(decrypted, (err) => err && proxySocket.end());
          },
        });
      });
      clientSocket.emit("data", chunk);
      clientSocket.resume();

      proxySocket.on("data", (data) => {
        const encrypted = encryptTcpChunk({
          buffer: data,
          key: client.key,
        });
        inTcpChunks(encrypted).forEach((chunk) =>
          clientSocket.write(chunk, (err) => err && clientSocket.end())
        );
      });

      clientSocket.on("end", () => proxySocket.end());
      proxySocket.on("end", () => clientSocket.end());
      clientSocket.on("error", () => clientSocket.end());
      proxySocket.on("error", () => proxySocket.end());
    };
  };

  const clientsServerTunnel = net.createServer({
    allowHalfOpen: false,
    keepAlive: true,
  });
  const proxiesServerTunnel = net.createServer({
    allowHalfOpen: false,
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

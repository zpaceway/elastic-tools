import net from "net";
import {
  CLIENT_SERVER_PORT,
  CLIENTS_TUNNEL_PORT,
  CountryCode,
} from "../core/constants";
import {
  encryptTcpChunk,
  handleIncommingEncryptedTcpChunk,
  inTcpChunks,
} from "../core/crypto";
import logger from "../core/logger";
import { PlatformConnector } from "../core/platform";
import assert from "assert";
import { parseHttp } from "../core/http";

export const createClient = ({
  username,
  password,
  tunnelHost,
  countryCode,
}: {
  username: string;
  password: string;
  tunnelHost: string;
  countryCode: CountryCode;
}) => {
  logger.log(`Client Server will proxy encrypted packets to ${tunnelHost}:`);
  const platformConnector = new PlatformConnector({ username, password });

  const onConnect = async (clientSocket: net.Socket) => {
    const client = await platformConnector.getClient();
    assert(client);
    const tunnelSocket = net.createConnection({
      allowHalfOpen: false,
      keepAlive: true,
      host: tunnelHost,
      port: CLIENTS_TUNNEL_PORT,
    });

    const sweeper = {
      buffer: Buffer.from([]),
      size: -1,
    };

    tunnelSocket.on("connect", () => {
      tunnelSocket.write(
        `${client.key}${countryCode}`,
        (err) => err && tunnelSocket.end()
      );
      clientSocket.once("data", (data) => {
        const { method, fullUrl } = parseHttp(data);
        logger.info(`---CLIENT--- ${method} ${fullUrl}`);
        clientSocket.on("data", (data) => {
          const encrypted = encryptTcpChunk({
            buffer: data,
            key: client.key,
          });
          inTcpChunks(encrypted).forEach((chunk) =>
            tunnelSocket.write(chunk, (err) => err && tunnelSocket.end())
          );
        });
        clientSocket.emit("data", data);
      });

      tunnelSocket.on("data", (data) => {
        handleIncommingEncryptedTcpChunk({
          sweeper,
          data,
          key: client.key,
          onDecrypted: (decrypted) => {
            clientSocket.write(decrypted, (err) => err && clientSocket.end());
          },
        });
      });
    });

    clientSocket.on("end", () => tunnelSocket.end());
    tunnelSocket.on("end", () => clientSocket.end());
    clientSocket.on("error", () => clientSocket.end());
    tunnelSocket.on("error", () => tunnelSocket.end());
  };

  const clientServer = net.createServer({
    allowHalfOpen: false,
    keepAlive: true,
  });

  clientServer.on("connection", onConnect);

  return {
    listen: () => {
      clientServer.listen(CLIENT_SERVER_PORT);
    },
  };
};

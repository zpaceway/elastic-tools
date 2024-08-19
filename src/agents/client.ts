import net from "net";
import {
  CLIENT_SERVER_PORT,
  CLIENTS_TUNNEL_PORT,
  CountryCode,
} from "../constants";
import {
  encryptTcpChunk,
  handleIncommingEncryptedTcpChunk,
  inTcpChunks,
} from "../crypto";
import logger from "../logger";
import { PlatformConnector } from "../platform";
import assert from "assert";

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
      allowHalfOpen: true,
      keepAlive: true,
      host: tunnelHost,
      port: CLIENTS_TUNNEL_PORT,
    });

    const sweeper = {
      buffer: Buffer.from([]),
      size: -1,
    };

    tunnelSocket.on("connect", () => {
      tunnelSocket.write(`${client.id}${countryCode}`);
      clientSocket.on("data", (data) => {
        const encrypted = encryptTcpChunk({
          buffer: data,
          key: client.encryptionKey,
        });
        inTcpChunks(encrypted).forEach((chunk) => tunnelSocket.write(chunk));
      });

      tunnelSocket.on("data", (data) => {
        handleIncommingEncryptedTcpChunk({
          sweeper,
          data,
          key: client.encryptionKey,
          onDecrypted: (decrypted) => {
            clientSocket.write(decrypted, (err) => {
              if (!err) return;
              clientSocket.end();
            });
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
    allowHalfOpen: true,
    keepAlive: true,
  });

  clientServer.on("connection", onConnect);

  return {
    listen: () => {
      clientServer.listen(CLIENT_SERVER_PORT);
    },
  };
};

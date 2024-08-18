import net from "net";
import {
  CLIENT_SERVER_PORT,
  CLIENTS_TUNNEL_PORT,
  CountryCode,
  PUBLIC_KEY,
} from "./constants";
import {
  encryptTcpChunk,
  handleIncommingEncryptedTcpChunk,
  inTcpChunks,
} from "./crypto";
import logger from "./logger";

export const createClient = ({
  tunnelHost,
  countryCode,
}: {
  tunnelHost: string;
  countryCode: CountryCode;
}) => {
  logger.log(`Client Server will proxy encrypted packets to ${tunnelHost}:`);

  const onConnect = async (clientSocket: net.Socket) => {
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

    clientSocket.on("end", tunnelSocket.end);
    tunnelSocket.on("end", clientSocket.end);
    tunnelSocket.on("connect", () => {
      tunnelSocket.write(countryCode);
      clientSocket.on("data", (data) => {
        const encrypted = encryptTcpChunk({
          buffer: data,
          key: PUBLIC_KEY,
        });
        inTcpChunks(encrypted).forEach((chunk) => tunnelSocket.write(chunk));
      });

      tunnelSocket.on("data", (data) => {
        handleIncommingEncryptedTcpChunk({
          sweeper,
          data,
          onDecrypted: (decrypted) => {
            clientSocket.write(decrypted, (err) => {
              if (!err) return;
              clientSocket.end();
            });
          },
        });
      });
    });

    tunnelSocket.on("error", (err) => {
      clientSocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      clientSocket.end(`Error: ${err.message}`);
    });
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

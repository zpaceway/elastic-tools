import net from "net";
import { CountryCode } from "./location";
import {
  CLIENTS_PROXY_PORT,
  COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING,
  PUBLIC_KEY,
} from "./constants";
import {
  decryptBuffer,
  encryptBuffer,
  handleIncommingEncryptedMessage,
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
  const onConnect = async (clientSocket: net.Socket) => {
    const tunnelSocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: tunnelHost,
      port: COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING[countryCode],
    });

    const incommingEncryptedMessage = {
      buffer: Buffer.from([]),
      size: -1,
    };

    clientSocket.on("data", (data) => {
      const encrypted = encryptBuffer(data, PUBLIC_KEY);
      inTcpChunks(encrypted).forEach((chunk) => tunnelSocket.write(chunk));
    });

    tunnelSocket.on("data", (data) => {
      handleIncommingEncryptedMessage({
        incommingEncryptedMessage,
        targetSocket: clientSocket,
        data,
      });
    });

    clientSocket.on("end", tunnelSocket.end);
    tunnelSocket.on("end", clientSocket.end);

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
      clientServer.listen(CLIENTS_PROXY_PORT);
    },
  };
};

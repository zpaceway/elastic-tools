import net from "net";
import { CountryCode } from "./location";
import {
  CLIENTS_PROXY_PORT,
  COUNTRY_CODE_CLIENTS_PROXY_PORT_MAPPING,
} from "./constants";

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

    clientSocket.pipe(tunnelSocket, { end: true });
    tunnelSocket.pipe(clientSocket, { end: true });

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

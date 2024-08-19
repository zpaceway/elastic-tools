import net from "net";
import logger from "../../core/logger";
import { parseHttp } from "../../core/http";

export const createServer = () => {
  const server = net.createServer(
    { allowHalfOpen: true, keepAlive: true },
    (socket) => {
      socket.once("data", (data) => {
        const { method, fullUrl } = parseHttp(data);

        if (!method || !fullUrl) {
          logger.error(`---PROXY--- Invalid HTTP Request`);
          return socket.end();
        }

        const targetSocket = new net.Socket();

        targetSocket.on("error", (err) => {
          logger.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
          targetSocket.end();
          socket.end();
        });
        socket.on("error", (err) => {
          logger.log(`Socket error: ${err.message}`);
          targetSocket.end();
          socket.end();
        });

        logger.info(`---PROXY--- ${method} ${fullUrl}`);

        if (method === "CONNECT") {
          const [hostname, port] = fullUrl.split(":");

          return targetSocket.connect(
            { host: hostname, port: parseInt(port || "443") },
            () => {
              socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
              targetSocket.pipe(socket, { end: true });
              socket.pipe(targetSocket, { end: true });
              logger.success(`---PROXY--- ${method} ${fullUrl}`);
            }
          );
        }

        const url = new URL(fullUrl);

        targetSocket.connect(
          { host: url.hostname, port: parseInt(url.port || "80") },
          () => {
            targetSocket.pipe(socket, { end: true });
            targetSocket.write(data);
            socket.pipe(targetSocket, { end: true });
            logger.success(`---PROXY--- ${method} ${fullUrl}`);
          }
        );
      });
    }
  );

  return server;
};

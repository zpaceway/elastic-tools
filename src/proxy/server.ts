import http from "http";
import net from "net";
import logger from "../logger";

export const createServer = () => {
  const server = net.createServer(
    { allowHalfOpen: true, keepAlive: true },
    (socket) => {
      socket.once("data", (data) => {
        const requestData = data.toString();
        const [requestLine, ...headers] = requestData.split("\r\n");

        if (!requestLine) {
          logger.error(`---HTTP--- Invalid HTTP Request`);
          return socket.end();
        }

        const [method, fullUrl] = requestLine.split(" ");

        if (!fullUrl) {
          logger.error(`---HTTP--- Invalid HTTP Request`);
          return socket.end();
        }

        if (method === "CONNECT") {
          // Handle HTTPS proxying
          const [hostname, port] = fullUrl.split(":");
          logger.info(`---HTTP--- ${method} ${fullUrl}`);

          const targetSocket = net.createConnection(
            { host: hostname, port: parseInt(port || "443") },
            () => {
              socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
              targetSocket.pipe(socket, { end: true });
              socket.pipe(targetSocket, { end: true });
              logger.success(`---HTTP--- ${method} ${fullUrl}`);
            }
          );

          targetSocket.on("error", (err) => {
            logger.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
            socket.end();
          });
        } else {
          // Handle HTTP proxying
          const url = new URL(fullUrl);

          const targetSocket = net.createConnection(
            { host: url.hostname, port: parseInt(url.port || "80") },
            () => {
              targetSocket.pipe(socket, { end: true });
              targetSocket.write(data);
              socket.pipe(targetSocket, { end: true });
              logger.success(`---HTTP--- ${method} ${fullUrl}`);
            }
          );

          targetSocket.on("error", (err) => {
            logger.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
            socket.end();
          });
        }
      });

      socket.on("error", (err) => {
        logger.log(`Socket error: ${err.message}`);
      });
    }
  );

  return server;
};

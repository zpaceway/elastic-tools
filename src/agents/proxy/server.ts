import net from "net";
import logger from "../../logger";

export const createServer = () => {
  const server = net.createServer(
    { allowHalfOpen: true, keepAlive: true },
    (socket) => {
      socket.once("data", (data) => {
        const requestData = data.toString();
        const [requestLine] = requestData.split("\r\n");

        if (!requestLine) {
          logger.error(`---HTTP--- Invalid HTTP Request`);
          return socket.end();
        }

        const targetSocket = new net.Socket();
        const [method, fullUrl] = requestLine.split(" ");

        if (!fullUrl) {
          logger.error(`---HTTP--- Invalid HTTP Request`);
          return socket.end();
        }

        targetSocket.on("error", (err) => {
          logger.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
          targetSocket.end();
          socket.end();
        });
        socket.on("error", (err) => {
          logger.log(`Socket error: ${err.message}`);
          targetSocket.end();
          socket.end();
        });

        if (method === "CONNECT") {
          const [hostname, port] = fullUrl.split(":");
          logger.info(`---HTTP--- ${method} ${fullUrl}`);

          targetSocket.connect(
            { host: hostname, port: parseInt(port || "443") },
            () => {
              socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
              targetSocket.pipe(socket, { end: true });
              socket.pipe(targetSocket, { end: true });
              logger.success(`---HTTP--- ${method} ${fullUrl}`);
            }
          );
        } else {
          const url = new URL(fullUrl);

          targetSocket.connect(
            { host: url.hostname, port: parseInt(url.port || "80") },
            () => {
              targetSocket.pipe(socket, { end: true });
              targetSocket.write(data);
              socket.pipe(targetSocket, { end: true });
              logger.success(`---HTTP--- ${method} ${fullUrl}`);
            }
          );
        }
      });
    }
  );

  return server;
};

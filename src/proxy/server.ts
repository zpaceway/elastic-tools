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
              targetSocket.pipe(socket);
              socket.pipe(targetSocket);
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
          const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method,
            headers: headers.reduce((acc, line) => {
              const [key, value] = line.split(": ");
              if (key && value) {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, string>),
          };

          logger.info(`---HTTP--- ${method} ${fullUrl}`);

          const proxyReq = http.request(options, (proxyRes) => {
            socket.write(
              `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`
            );
            proxyRes.rawHeaders.forEach((header, index) => {
              if (index % 2 === 0) {
                socket.write(
                  `${header}: ${proxyRes.rawHeaders[index + 1]}\r\n`
                );
              }
            });
            socket.write("\r\n");
            proxyRes.pipe(socket);
            logger.success(`---HTTP--- ${method} ${fullUrl}`);
          });

          proxyReq.on("error", (err) => {
            logger.error(`---HTTP--- ${method} ${fullUrl} - ${err.message}`);
            socket.end();
          });

          proxyReq.end();
        }
      });

      socket.on("error", (err) => {
        logger.log(`Socket error: ${err.message}`);
      });
    }
  );

  return server;
};

import net from "net";
import http from "http";
import { URL } from "url";

const SOCKS_VERSION_4 = 0x04;
const SOCKS_VERSION_5 = 0x05;

const log = (message: string) => {
  console.log(new Date(), message);
};

const handleSocks4Connection = (socket: net.Socket) => {
  socket.once("data", (data) => {
    if (data[0] !== SOCKS_VERSION_4) {
      log("---SOCKS4--- connection: Invalid version, closing socket.");
      socket.end();
      return;
    }

    const port = data.readUInt16BE(2);
    const ip = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
    log(`---SOCKS4--- ⌛ ${ip}:${port}`);

    const destinationSocket = net.createConnection({ host: ip, port }, () => {
      const response = Buffer.alloc(8);
      response.writeUInt8(0x00, 0);
      response.writeUInt8(0x5a, 1); // Request granted
      socket.write(response);
      destinationSocket.pipe(socket);
      socket.pipe(destinationSocket);
      log(`---SOCKS4--- ✅ ${ip}:${port}`);
    });

    destinationSocket.on("error", (err) => {
      log(`---SOCKS4--- ⛔ ${ip}:${port} - ${err.message}`);
      socket.end();
    });
  });
};

const handleSocks5Connection = (socket: net.Socket) => {
  socket.once("data", (data) => {
    if (data[0] !== SOCKS_VERSION_5) {
      log("---SOCKS5--- connection: Invalid version, closing socket.");
      socket.end();
      return;
    }

    log("---SOCKS5--- connection: Client authentication request received.");
    socket.write(Buffer.from([0x05, 0x00])); // No authentication required

    socket.once("data", (data) => {
      const cmd = data[1];
      const addrType = data[3];

      let host = "";
      let port;

      if (addrType === 0x01) {
        host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
        port = data.readUInt16BE(8);
      } else if (addrType === 0x03 && data[4]) {
        const hostLength = data[4];
        host = data.subarray(5, 5 + hostLength).toString();
        port = data.readUInt16BE(5 + hostLength);
      } else {
        log(
          "---SOCKS5--- connection: Unsupported address type, closing socket."
        );
        socket.end();
        return;
      }

      log(`---SOCKS5--- ⌛ ${host}:${port}`);

      if (cmd !== 0x01) {
        log("---SOCKS5--- connection: Unsupported command, closing socket.");
        socket.end();
        return;
      }

      const destinationSocket = net.createConnection({ host, port }, () => {
        const response = Buffer.alloc(10);
        response.writeUInt8(0x05, 0);
        response.writeUInt8(0x00, 1); // Request granted
        response.writeUInt8(0x00, 2);
        response.writeUInt8(0x01, 3); // IPv4 address type
        (destinationSocket.address() as net.AddressInfo).address
          .split(".")
          .forEach((num, index) => {
            response.writeUInt8(parseInt(num), 4 + index);
          });
        response.writeUInt16BE(
          (destinationSocket.address() as net.AddressInfo).port,
          8
        );
        socket.write(response);
        destinationSocket.pipe(socket);
        socket.pipe(destinationSocket);
        log(`---SOCKS5--- ✅ ${host}:${port}`);
      });

      destinationSocket.on("error", (err) => {
        log(`---SOCKS5--- ⛔ ${host}:${port} - ${err.message}`);
        socket.end();
      });
    });
  });
};

const handleHttpConnection = (socket: net.Socket, data: Buffer) => {
  const requestData = data.toString();
  const [requestLine, ...headers] = requestData.split("\r\n");

  if (!requestLine) {
    log(`---HTTP--- ⛔ Invalid HTTP Request`);
    return socket.end();
  }

  const [method, fullUrl] = requestLine.split(" ");

  if (!fullUrl) {
    log(`---HTTP--- ⛔ Invalid HTTP Request`);
    return socket.end();
  }

  if (method === "CONNECT") {
    // Handle HTTPS proxying
    const [hostname, port] = fullUrl.split(":");
    log(`---HTTP--- ⌛ ${method} ${fullUrl}`);

    const targetSocket = net.createConnection(
      { host: hostname, port: parseInt(port || "443") },
      () => {
        socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        targetSocket.pipe(socket);
        socket.pipe(targetSocket);
        log(`---HTTP--- ✅ ${method} ${fullUrl}`);
      }
    );

    targetSocket.on("error", (err) => {
      log(`---HTTP--- ⛔ ${method} ${fullUrl} - ${err.message}`);
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

    log(`---HTTP--- ⌛ ${method} ${fullUrl}`);

    const proxyReq = http.request(options, (proxyRes) => {
      socket.write(
        `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`
      );
      proxyRes.rawHeaders.forEach((header, index) => {
        if (index % 2 === 0) {
          socket.write(`${header}: ${proxyRes.rawHeaders[index + 1]}\r\n`);
        }
      });
      socket.write("\r\n");
      proxyRes.pipe(socket);
      log(`---HTTP--- ✅ ${method} ${fullUrl}`);
    });

    proxyReq.on("error", (err) => {
      log(`---HTTP--- ⛔ ${method} ${fullUrl} - ${err.message}`);
      socket.end();
    });

    proxyReq.end();
  }
};

export const createServer = () => {
  const server = net.createServer((socket) => {
    socket.once("data", (data) => {
      const [version, ...rest] = data;

      if (version === SOCKS_VERSION_4) {
        handleSocks4Connection(socket);
        if (rest.length) socket.emit("data", data);
      } else if (version === SOCKS_VERSION_5) {
        handleSocks5Connection(socket);
        if (rest.length) socket.emit("data", data);
      } else {
        handleHttpConnection(socket, data);
      }
    });

    socket.on("error", (err) => {
      log(`Socket error: ${err.message}`);
    });
  });

  return server;
};

import net from "net";

export const createTunnel = () => {
  const availableProviders: net.Socket[] = [];

  const onProviderConnection = (providerSocket: net.Socket) => {
    console.log("New provider added");
    availableProviders.push(providerSocket);
    console.log(`Available providers ${availableProviders.length}`);
  };

  const onClientConnection = (clientSocket: net.Socket) => {
    const providerSocket = availableProviders.pop();

    if (!providerSocket) {
      clientSocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      return clientSocket.end(`Error: unavailable`);
    }

    console.log(`Available providers ${availableProviders.length}`);

    clientSocket.pipe(providerSocket, { end: true });
    providerSocket.pipe(clientSocket, { end: true });

    providerSocket.on("error", (err) => {
      clientSocket.write(
        "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n"
      );
      clientSocket.end(`Error: ${err.message}`);
    });
  };

  const clientProxyServer = net.createServer({
    allowHalfOpen: true,
    keepAlive: true,
  });
  const providerProxyServer = net.createServer({
    allowHalfOpen: true,
    keepAlive: true,
  });

  clientProxyServer.on("connection", onClientConnection);
  providerProxyServer.on("connection", onProviderConnection);

  return {
    listen: ({
      clientsProxyPort,
      providersProxyPort,
    }: {
      clientsProxyPort: number;
      providersProxyPort: number;
    }) => {
      providerProxyServer.listen(providersProxyPort);
      clientProxyServer.listen(clientsProxyPort);
    },
  };
};

import net from "net";

export const createJumpers = ({
  internalProviderProxyPort,
  providersProxyHost,
  providersProxyPort,
  minimumAvailability,
}: {
  internalProviderProxyPort: number;
  providersProxyHost: string;
  providersProxyPort: number;
  minimumAvailability: number;
}) => {
  const availableProviders: net.Socket[] = [];

  const createJumper = () => {
    const incommingProxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: providersProxyHost,
      port: providersProxyPort,
    });

    const providerProxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: "localhost",
      port: internalProviderProxyPort,
    });

    availableProviders.push(providerProxySocket);
    if (availableProviders.length < minimumAvailability) {
      createJumper();
    }

    const onUnavailable = () => {
      const indexOf = availableProviders.findIndex(
        (provider) => provider === providerProxySocket
      );
      if (indexOf < 0) return;
      availableProviders.splice(indexOf, 1);
      if (availableProviders.length < 10) {
        createJumper();
      }
    };

    incommingProxySocket.on("data", onUnavailable);
    providerProxySocket.on("data", onUnavailable);
    incommingProxySocket.on("end", onUnavailable);
    providerProxySocket.on("end", onUnavailable);

    incommingProxySocket.pipe(providerProxySocket, { end: true });
    providerProxySocket.pipe(incommingProxySocket, { end: true });
  };
};

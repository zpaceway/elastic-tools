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
  const availableJumpers: Symbol[] = [];

  const createJumper = () => {
    const jumper = Symbol();
    const incommingProxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: providersProxyHost,
      port: providersProxyPort,
    });

    const providerProxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: "127.0.0.1",
      port: internalProviderProxyPort,
    });

    availableJumpers.push(jumper);
    if (availableJumpers.length < minimumAvailability) {
      createJumper();
    }

    const onUnavailable = () => {
      const indexOf = availableJumpers.findIndex(
        (_jumper) => _jumper === jumper
      );
      if (indexOf < 0) return;
      availableJumpers.splice(indexOf, 1);
      if (availableJumpers.length < 10) {
        createJumper();
      }
    };

    ["data", "end", "close", "timeout"].map((event) => {
      incommingProxySocket.on(event, onUnavailable);
      providerProxySocket.on(event, onUnavailable);
    });

    incommingProxySocket.pipe(providerProxySocket, { end: true });
    providerProxySocket.pipe(incommingProxySocket, { end: true });
  };

  createJumper();
};

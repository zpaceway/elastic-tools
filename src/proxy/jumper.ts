import net from "net";
import { getCountryCodeFromIpAddress } from "../location";
import { PROXY_SERVER_PORT, PROXIES_TUNNEL_PORT } from "../constants";
import logger from "../logger";

export const createJumpers = async ({
  tunnelHost,
  minimumAvailability,
}: {
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const countryCode = await getCountryCodeFromIpAddress();
  if (!countryCode) return logger.error("Unsupported Country Code");

  const availableJumpers: Symbol[] = [];

  const createJumper = () => {
    const jumper = Symbol();
    const tunnelSocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: tunnelHost,
      port: PROXIES_TUNNEL_PORT,
    });

    const proxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: "127.0.0.1",
      port: PROXY_SERVER_PORT,
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
      tunnelSocket.on(event, onUnavailable);
      proxySocket.on(event, onUnavailable);
    });

    tunnelSocket.pipe(proxySocket, { end: true });
    proxySocket.pipe(tunnelSocket, { end: true });
  };

  createJumper();
};

import net from "net";
import { getCountryCodeFromIpAddress } from "../../core/location";
import { PROXY_SERVER_PORT, PROXIES_TUNNEL_PORT } from "../../core/constants";
import logger from "../../core/logger";
import { PlatformConnector } from "../../core/platform";
import assert from "assert";

export const createJumpers = async ({
  platformConnector,
  tunnelHost,
  minimumAvailability,
}: {
  platformConnector: PlatformConnector;
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const client = await platformConnector.getClient();
  assert(client);

  const countryCode = await getCountryCodeFromIpAddress();
  if (!countryCode) return logger.error("Unsupported Country Code");

  const availableJumpers: Symbol[] = [];

  const createJumper = () => {
    const jumper = Symbol();
    const tunnelSocket = net.createConnection({
      allowHalfOpen: true,
      keepAlive: true,
      host: tunnelHost,
      port: PROXIES_TUNNEL_PORT,
    });

    const proxySocket = net.createConnection({
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

    tunnelSocket.write(client.key, (err) => {
      if (err) return tunnelSocket.end();
    });

    ["data", "end", "close", "timeout"].map((event) => {
      tunnelSocket.on(event, onUnavailable);
      proxySocket.on(event, onUnavailable);
    });

    tunnelSocket.on("error", () => tunnelSocket.end());
    proxySocket.on("error", () => proxySocket.end());
    tunnelSocket.pipe(proxySocket, { end: true });
    proxySocket.pipe(tunnelSocket, { end: true });
  };

  createJumper();
};

import net from "net";
import { getCountryCodeFromIpAddress } from "../../core/location";
import {
  PROXY_SERVER_PORT,
  PROXIES_TUNNEL_PORT,
  KEEP_ALIVE_INTERVAL,
} from "../../core/constants";
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
      allowHalfOpen: false,
      keepAlive: true,
      host: tunnelHost,
      port: PROXIES_TUNNEL_PORT,
    });

    const proxySocket = net.createConnection({
      allowHalfOpen: false,
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

    ["error", "data", "end", "close", "timeout"].map((event) => {
      tunnelSocket.on(event, onUnavailable);
      proxySocket.on(event, onUnavailable);
    });

    tunnelSocket.write(client.key, (err) => err && tunnelSocket.end());

    tunnelSocket.on("error", () => tunnelSocket.end());
    proxySocket.on("error", () => proxySocket.end());
    tunnelSocket.on("end", () => proxySocket.end());
    proxySocket.on("end", () => tunnelSocket.end());

    tunnelSocket.pipe(proxySocket);
    proxySocket.pipe(tunnelSocket);

    setInterval(() => {
      tunnelSocket.write(Buffer.from([]), (err) => err && tunnelSocket.end());
      proxySocket.write(Buffer.from([]), (err) => err && proxySocket.end());
    }, KEEP_ALIVE_INTERVAL);
  };

  createJumper();
};

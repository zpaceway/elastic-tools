import {
  platformClient as PlatformClient,
  PlatformConnector,
} from "../core/platform";
import net from "net";
import { getCountryCodeFromIpAddress } from "../core/location";
import { PROXIES_TUNNEL_PORT, KEEP_ALIVE_INTERVAL } from "../core/constants";
import logger from "../core/logger";
import assert from "assert";
import { parseHttp } from "../core/http";

class JumpersManager {
  jumpers: Symbol[];
  tunnelHost: string;
  platformConnector: PlatformConnector;
  minimumAvailability: number;

  constructor({
    platformConnector,
    tunnelHost,
    minimumAvailability,
  }: {
    platformConnector: PlatformConnector;
    tunnelHost: string;
    minimumAvailability: number;
  }) {
    this.jumpers = [];
    this.platformConnector = platformConnector;
    this.tunnelHost = tunnelHost;
    this.minimumAvailability = minimumAvailability;
  }

  async initialize() {
    const [client, countryCode] = await Promise.all([
      this.platformConnector.getClient(),
      getCountryCodeFromIpAddress(),
    ]);
    assert(client);
    assert(countryCode);

    return client;
  }

  async createJumper() {
    const client = await this.initialize();
    const jumper = Symbol();
    const tunnelSocket = net.createConnection({
      allowHalfOpen: false,
      keepAlive: true,
      host: this.tunnelHost,
      port: PROXIES_TUNNEL_PORT,
    });

    this.jumpers.push(jumper);
    if (this.jumpers.length < this.minimumAvailability) {
      this.createJumper();
    }

    const onUnavailable = () => {
      const indexOf = this.jumpers.findIndex((_jumper) => _jumper === jumper);
      if (indexOf < 0) return;
      this.jumpers.splice(indexOf, 1);
      if (this.jumpers.length < 10) {
        this.createJumper();
      }
    };

    ["error", "data", "end", "close", "timeout"].forEach((event) => {
      tunnelSocket.once(event, onUnavailable);
    });

    tunnelSocket.write(client.key, (err) => err && tunnelSocket.end());
    tunnelSocket.on("error", () => tunnelSocket.end());
    tunnelSocket.once("data", (data) => {
      const { method, fullUrl } = parseHttp(data);

      if (!method || !fullUrl) {
        logger.error(`---PROXY--- Invalid HTTP Request`);
        return tunnelSocket.end();
      }

      const targetSocket = new net.Socket();

      targetSocket.on("error", (err) => {
        logger.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
        targetSocket.end();
      });
      tunnelSocket.on("error", (err) => {
        logger.error(`---PROXY--- ${method} ${fullUrl} - ${err.message}`);
        tunnelSocket.end();
      });
      tunnelSocket.on("end", () => targetSocket.end());
      targetSocket.on("end", () => tunnelSocket.end());

      logger.info(`---PROXY--- ${method} ${fullUrl}`);

      if (method === "CONNECT") {
        const [hostname, port] = fullUrl.split(":");

        return targetSocket.connect(
          { host: hostname, port: parseInt(port || "443") },
          () => {
            tunnelSocket.write(
              "HTTP/1.1 200 Connection Established\r\n\r\n",
              (err) => err && tunnelSocket.end()
            );
            targetSocket.pipe(tunnelSocket);
            tunnelSocket.pipe(targetSocket);
            logger.success(`---PROXY--- ${method} ${fullUrl}`);
          }
        );
      }

      const url = new URL(fullUrl);

      targetSocket.connect(
        { host: url.hostname, port: parseInt(url.port || "80") },
        () => {
          targetSocket.write(data, (err) => err && targetSocket.end());
          targetSocket.pipe(tunnelSocket);
          tunnelSocket.pipe(targetSocket);
          logger.success(`---PROXY--- ${method} ${fullUrl}`);
        }
      );
    });

    const interval = setInterval(() => {
      tunnelSocket.write(Buffer.from([]), (err) => {
        if (err) {
          tunnelSocket.end();
          clearInterval(interval);
        }
      });
    }, KEEP_ALIVE_INTERVAL);
  }
}

export const createProxy = ({
  username,
  password,
  tunnelHost,
  minimumAvailability,
}: {
  username: string;
  password: string;
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const platformConnector = new PlatformConnector({ username, password });
  const jumpersManager = new JumpersManager({
    platformConnector,
    minimumAvailability,
    tunnelHost,
  });

  return {
    listen: () => {
      jumpersManager.createJumper();
    },
  };
};

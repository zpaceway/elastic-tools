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
import { BehaviorSubject } from "rxjs";
import { getFutureDate } from "../core/datetime";

class JumpersManager {
  jumpers$: BehaviorSubject<Symbol[]>;
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
    this.jumpers$ = new BehaviorSubject([] as Symbol[]);
    this.platformConnector = platformConnector;
    this.tunnelHost = tunnelHost;
    this.minimumAvailability = minimumAvailability;
  }

  async start() {
    const [client, countryCode] = await Promise.all([
      this.platformConnector.getClient(),
      getCountryCodeFromIpAddress(),
    ]);
    assert(client);
    assert(countryCode);

    this.jumpers$.subscribe(async (jumpers) => {
      if (jumpers.length >= this.minimumAvailability) return;
      await this.createJumper(client);
    });
  }

  async createJumper(client: PlatformClient) {
    const jumper = Symbol();
    this.jumpers$.next([...this.jumpers$.value, jumper]);
    const tunnelSocket = net.createConnection({
      allowHalfOpen: false,
      keepAlive: true,
      host: this.tunnelHost,
      port: PROXIES_TUNNEL_PORT,
    });

    const fiveMinutesAfterCreation = getFutureDate(1000 * 60 * 5);
    const interval = setInterval(() => {
      tunnelSocket.write("", (err) => err && tunnelSocket.end());
      fiveMinutesAfterCreation < new Date() && tunnelSocket.end();
      (!tunnelSocket.writable || !tunnelSocket.readable) && tunnelSocket.end();
    }, KEEP_ALIVE_INTERVAL);
    tunnelSocket.once("end", () => clearInterval(interval));
    tunnelSocket.once("data", () => clearInterval(interval));

    ["error", "data", "end", "close", "timeout"].forEach((event) => {
      tunnelSocket.once(event, () => {
        this.jumpers$.next(
          this.jumpers$.value.filter((_jumper) => _jumper !== jumper)
        );
      });
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
      jumpersManager.start();
    },
  };
};

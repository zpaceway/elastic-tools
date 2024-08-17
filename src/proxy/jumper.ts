import net from "net";
import { CountryCode } from "../location";
import {
  COUNTRY_CODE_PROVIDERS_PROXY_PORT_MAPPING,
  PROVIDERS_PROXY_PORT,
} from "../constants";

export const createJumpers = ({
  countryCode,
  tunnelHost,
  minimumAvailability,
}: {
  countryCode: CountryCode;
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const availableJumpers: Symbol[] = [];

  const createJumper = () => {
    const jumper = Symbol();
    const incommingProxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: tunnelHost,
      port: COUNTRY_CODE_PROVIDERS_PROXY_PORT_MAPPING[countryCode],
    });

    const providerProxySocket = net.connect({
      allowHalfOpen: true,
      keepAlive: true,
      host: "127.0.0.1",
      port: PROVIDERS_PROXY_PORT,
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

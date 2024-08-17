import { createServer } from "./server";
import { createJumpers } from "./jumper";
import { CountryCode } from "../location";
import { PROVIDERS_PROXY_PORT } from "../constants";

export const createProxy = ({
  countryCode,
  tunnelHost,
  minimumAvailability,
}: {
  countryCode: CountryCode;
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const server = createServer();

  return {
    listen: () => {
      server.listen(PROVIDERS_PROXY_PORT, "127.0.0.1");

      createJumpers({
        countryCode,
        tunnelHost,
        minimumAvailability,
      });
    },
  };
};

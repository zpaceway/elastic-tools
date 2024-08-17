import { createServer } from "./server";
import { createJumpers } from "./jumper";
import { CountryCode, getCountryCodeFromIpAddress } from "../location";
import { PROVIDERS_PROXY_PORT } from "../constants";
import logger from "../logger";

export const createProxy = async ({
  tunnelHost,
  minimumAvailability,
}: {
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const server = createServer();
  const countryCode = await getCountryCodeFromIpAddress();

  if (!countryCode) return logger.error("Unsupported Country Code");

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

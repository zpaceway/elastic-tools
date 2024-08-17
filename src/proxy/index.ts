import { createServer } from "./server";
import { createJumpers } from "./jumper";
import { PROVIDERS_PROXY_PORT } from "../constants";

export const createProxy = ({
  tunnelHost,
  minimumAvailability,
}: {
  tunnelHost: string;
  minimumAvailability: number;
}) => {
  const server = createServer();

  return {
    listen: () => {
      server.listen(PROVIDERS_PROXY_PORT, "127.0.0.1");

      createJumpers({
        tunnelHost,
        minimumAvailability,
      });
    },
  };
};

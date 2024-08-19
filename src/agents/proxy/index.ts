import { createServer } from "./server";
import { createJumpers } from "./jumper";
import { PROXY_SERVER_PORT } from "../../core/constants";
import { PlatformConnector } from "../../core/platform";

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

  const server = createServer();

  return {
    listen: () => {
      server.listen(PROXY_SERVER_PORT, "127.0.0.1");

      createJumpers({
        platformConnector,
        tunnelHost,
        minimumAvailability,
      });
    },
  };
};

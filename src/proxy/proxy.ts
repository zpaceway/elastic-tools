import net from "net";
import { createServer } from "./server";
import { createJumpers } from "./jumper";

export const createProxy = ({
  internalProviderProxyPort,
  providersProxyHost,
  providersProxyPort,
  minimumAvailability,
}: {
  internalProviderProxyPort: number;
  providersProxyHost: string;
  providersProxyPort: number;
  minimumAvailability: number;
}) => {
  const server = createServer();
  server.listen(internalProviderProxyPort);

  createJumpers({
    internalProviderProxyPort,
    providersProxyHost,
    providersProxyPort,
    minimumAvailability,
  });
};

import { createServer } from "./server";
import { createJumpers } from "./jumper";

export const createProxy = ({
  providersProxyHost,
  providersProxyPort,
  minimumAvailability,
}: {
  providersProxyHost: string;
  providersProxyPort: number;
  minimumAvailability: number;
}) => {
  const server = createServer();

  return {
    listen: ({
      internalProviderProxyPort,
    }: {
      internalProviderProxyPort: number;
    }) => {
      server.listen(internalProviderProxyPort);

      createJumpers({
        internalProviderProxyPort,
        providersProxyHost,
        providersProxyPort,
        minimumAvailability,
      });
    },
  };
};

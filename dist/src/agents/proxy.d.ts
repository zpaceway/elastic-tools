import { PlatformConnector } from "../core/platform";
export declare const createJumpers: ({ platformConnector, tunnelHost, minimumAvailability, }: {
    platformConnector: PlatformConnector;
    tunnelHost: string;
    minimumAvailability: number;
}) => Promise<void>;
export declare const createProxy: ({ username, password, tunnelHost, minimumAvailability, }: {
    username: string;
    password: string;
    tunnelHost: string;
    minimumAvailability: number;
}) => {
    listen: () => void;
};

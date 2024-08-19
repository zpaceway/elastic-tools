import { PlatformConnector } from "../../core/platform";
export declare const createJumpers: ({ platformConnector, tunnelHost, minimumAvailability, }: {
    platformConnector: PlatformConnector;
    tunnelHost: string;
    minimumAvailability: number;
}) => Promise<void>;

import { CountryCode } from "../location";
export declare const createProxy: ({ countryCode, tunnelHost, minimumAvailability, }: {
    countryCode: CountryCode;
    tunnelHost: string;
    minimumAvailability: number;
}) => {
    listen: () => void;
};

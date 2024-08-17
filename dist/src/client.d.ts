import { CountryCode } from "./location";
export declare const createClient: ({ tunnelHost, countryCode, }: {
    tunnelHost: string;
    countryCode: CountryCode;
}) => {
    listen: () => void;
};

import { CountryCode } from "./constants";
export declare const createClient: ({ tunnelHost, countryCode, }: {
    tunnelHost: string;
    countryCode: CountryCode;
}) => {
    listen: () => void;
};

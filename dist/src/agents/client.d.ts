import { CountryCode } from "../constants";
export declare const createClient: ({ username, password, tunnelHost, countryCode, }: {
    username: string;
    password: string;
    tunnelHost: string;
    countryCode: CountryCode;
}) => {
    listen: () => void;
};

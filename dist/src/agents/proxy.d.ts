export declare const createProxy: ({ username, password, tunnelHost, minimumAvailability, }: {
    username: string;
    password: string;
    tunnelHost: string;
    minimumAvailability: number;
}) => {
    listen: () => void;
};

export declare const createProxy: ({ tunnelHost, minimumAvailability, }: {
    tunnelHost: string;
    minimumAvailability: number;
}) => Promise<void | {
    listen: () => void;
}>;

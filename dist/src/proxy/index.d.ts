export declare const createProxy: ({ providersProxyHost, providersProxyPort, minimumAvailability, }: {
    providersProxyHost: string;
    providersProxyPort: number;
    minimumAvailability: number;
}) => {
    listen: ({ internalProviderProxyPort, }: {
        internalProviderProxyPort: number;
    }) => void;
};

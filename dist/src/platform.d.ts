type Client = {
    id: string;
    username: string;
    encryptionKey: Buffer;
};
export declare class PlatformConnector {
    username: string;
    password: string;
    keys: Record<string, Client>;
    constructor({ username, password }: {
        username: string;
        password: string;
    });
    getClient: (clientId?: string) => Promise<Client | null>;
}
export {};

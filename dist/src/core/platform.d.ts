export type platformClient = {
    id: string;
    username: string;
    key: Buffer;
};
export declare class PlatformConnector {
    username: string;
    password: string;
    cache: Record<string, platformClient>;
    constructor({ username, password }: {
        username: string;
        password: string;
    });
    getClient(key?: string): Promise<platformClient | null>;
}

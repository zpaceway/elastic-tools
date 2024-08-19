export declare class PlatformConnector {
    username: string;
    password: string;
    cache: Record<string, {
        id: string;
        username: string;
        key: Buffer;
    }>;
    constructor({ username, password }: {
        username: string;
        password: string;
    });
    getClient: (key?: string) => Promise<{
        id: string;
        username: string;
        key: Buffer;
    } | null>;
}

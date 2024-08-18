export declare const decompressBuffer: (buffer: Buffer) => Buffer;
export declare const compressBuffer: (buffer: Buffer) => Buffer;
export declare const encryptTcpChunk: ({ buffer, key, }: {
    buffer: Buffer;
    key: Buffer;
}) => Buffer;
export declare const decryptTcpChunk: ({ buffer, key, }: {
    buffer: Buffer;
    key: Buffer;
}) => Buffer;
export declare const inTcpChunks: (data: Buffer) => Buffer[];
export declare const handleIncommingEncryptedTcpChunk: ({ sweeper, data, onDecrypted, }: {
    sweeper: {
        buffer: Buffer;
        size: number;
    };
    data: Buffer;
    onDecrypted: (decrypted: Buffer) => void;
}) => void;

import net from "net";
export declare const encryptBuffer: (buffer: Buffer, key: Buffer) => Buffer;
export declare const decryptBuffer: (buffer: Buffer, key: Buffer) => Buffer;
export declare const inTcpChunks: (data: Buffer) => Buffer[];
export declare const handleIncommingEncryptedMessage: ({ incommingEncryptedMessage, data, targetSocket, }: {
    incommingEncryptedMessage: {
        buffer: Buffer;
        size: number;
    };
    data: Buffer;
    targetSocket: net.Socket;
}) => void;

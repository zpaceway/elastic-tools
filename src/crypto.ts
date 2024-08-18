import crypto from "crypto";
import net from "net";
import { PUBLIC_KEY } from "./constants";

const TCP_CHUNK_SIZE = 1400;

export const encryptBuffer = ({
  buffer,
  key,
}: {
  buffer: Buffer;
  key: Buffer;
}) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, authTag, encrypted]);
  const encoded = Buffer.concat([
    Buffer.from(result.length.toString().padStart(8, "0")),
    result,
  ]);

  return encoded;
};

export const decryptBuffer = ({
  buffer,
  key,
}: {
  buffer: Buffer;
  key: Buffer;
}) => {
  const data = buffer.subarray(8);
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encryptedData = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};

export const inTcpChunks = (data: Buffer) => {
  let offset = 0;
  const chunks: Buffer[] = [];
  while (offset < data.length) {
    const chunkSize = Math.min(TCP_CHUNK_SIZE, data.length - offset);
    const chunk = data.subarray(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
};

export const handleIncommingEncryptedMessage = ({
  sweeper,
  data,
  onDecrypted,
}: {
  sweeper: { buffer: Buffer; size: number };
  data: Buffer;
  onDecrypted: (decrypted: Buffer) => void;
}) => {
  sweeper.buffer = Buffer.concat([sweeper.buffer, data]);
  while (sweeper.buffer.length >= 8) {
    if (sweeper.size === -1) {
      sweeper.size = parseInt(sweeper.buffer.subarray(0, 8).toString()) + 8;
    }
    if (sweeper.buffer.length >= sweeper.size) {
      const decrypted = decryptBuffer({
        buffer: sweeper.buffer.subarray(0, sweeper.size),
        key: PUBLIC_KEY,
      });
      onDecrypted(decrypted);
      sweeper.buffer = sweeper.buffer.subarray(sweeper.size);
      sweeper.size = -1;
      continue;
    }
    break;
  }
};

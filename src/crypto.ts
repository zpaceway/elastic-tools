import crypto from "crypto";
import zlib from "zlib";
import { TCP_CHUNK_SIZE_MESSAGE_LENGTH } from "./constants";

export const decompressBuffer = (buffer: Buffer) => {
  return zlib.inflateSync(buffer);
};

export const compressBuffer = (buffer: Buffer) => {
  return zlib.deflateSync(buffer);
};

export const encryptTcpChunk = ({
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
  const result = compressBuffer(Buffer.concat([iv, authTag, encrypted]));
  const encoded = Buffer.concat([
    Buffer.from(
      result.length.toString().padStart(TCP_CHUNK_SIZE_MESSAGE_LENGTH, "0")
    ),
    result,
  ]);

  return encoded;
};

export const decryptTcpChunk = ({
  buffer,
  key,
}: {
  buffer: Buffer;
  key: Buffer;
}) => {
  const data = decompressBuffer(buffer.subarray(TCP_CHUNK_SIZE_MESSAGE_LENGTH));
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
    const chunkSize = Math.min(
      TCP_CHUNK_SIZE_MESSAGE_LENGTH,
      data.length - offset
    );
    const chunk = data.subarray(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
};

export const handleIncommingEncryptedTcpChunk = ({
  sweeper,
  data,
  key,
  onDecrypted,
}: {
  sweeper: { buffer: Buffer; size: number };
  data: Buffer;
  key: Buffer;
  onDecrypted: (decrypted: Buffer) => void;
}) => {
  sweeper.buffer = Buffer.concat([sweeper.buffer, data]);
  while (sweeper.buffer.length >= TCP_CHUNK_SIZE_MESSAGE_LENGTH) {
    if (sweeper.size === -1) {
      sweeper.size =
        parseInt(
          sweeper.buffer.subarray(0, TCP_CHUNK_SIZE_MESSAGE_LENGTH).toString()
        ) + TCP_CHUNK_SIZE_MESSAGE_LENGTH;
    }
    if (sweeper.buffer.length >= sweeper.size) {
      const decrypted = decryptTcpChunk({
        buffer: sweeper.buffer.subarray(0, sweeper.size),
        key,
      });
      onDecrypted(decrypted);
      sweeper.buffer = sweeper.buffer.subarray(sweeper.size);
      sweeper.size = -1;
      continue;
    }
    break;
  }
};

import crypto from "crypto";
import logger from "./logger";
import net from "net";
import { PUBLIC_KEY } from "./constants";

const TCP_CHUNK_SIZE = 1400;

export const encryptBuffer = (buffer: Buffer, key: Buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const result = Buffer.concat([iv, encrypted]);
  const encoded = Buffer.concat([
    Buffer.from(result.length.toString().padStart(8, "0")),
    result,
  ]);

  return encoded;
};

export const decryptBuffer = (buffer: Buffer, key: Buffer) => {
  const data = buffer.subarray(8);
  const iv = data.subarray(0, 16);
  const encryptedData = data.subarray(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
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
  incommingEncryptedMessage,
  data,
  targetSocket,
}: {
  incommingEncryptedMessage: { buffer: Buffer; size: number };
  data: Buffer;
  targetSocket: net.Socket;
}) => {
  incommingEncryptedMessage.buffer = Buffer.concat([
    incommingEncryptedMessage.buffer,
    data,
  ]);
  while (incommingEncryptedMessage.buffer.length >= 8) {
    if (incommingEncryptedMessage.size === -1) {
      incommingEncryptedMessage.size =
        parseInt(incommingEncryptedMessage.buffer.subarray(0, 8).toString()) +
        8;
    }
    if (
      incommingEncryptedMessage.buffer.length >= incommingEncryptedMessage.size
    ) {
      const decrypted = decryptBuffer(
        incommingEncryptedMessage.buffer.subarray(
          0,
          incommingEncryptedMessage.size
        ),
        PUBLIC_KEY
      );
      targetSocket.write(decrypted, (err) => {
        if (!err) return;
        targetSocket.end();
      });
      incommingEncryptedMessage.buffer =
        incommingEncryptedMessage.buffer.subarray(
          incommingEncryptedMessage.size
        );
      incommingEncryptedMessage.size = -1;
      continue;
    }
    break;
  }
};

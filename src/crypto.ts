import crypto from "crypto";

const TCP_CHUNK_SIZE = 1400;

export const encryptBuffer = (buffer: Buffer, key: Buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
};

export const decryptBuffer = (buffer: Buffer, key: Buffer) => {
  const iv = buffer.subarray(0, 16);
  const encryptedData = buffer.subarray(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};

export const inTcpChunks = (data: Buffer) => {
  let offset = 0;
  const chunks: Buffer[] = [];
  while (offset < data.length) {
    const chunkSize = Math.min(TCP_CHUNK_SIZE, data.length - offset);
    const chunk = data.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
};

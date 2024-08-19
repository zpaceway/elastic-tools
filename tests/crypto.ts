import crypto from "crypto";

import {
  compressBuffer,
  decompressBuffer,
  decryptTcpChunk,
  encryptTcpChunk,
} from "../src/crypto";

const key = crypto.createHash("sha256").update("justakey").digest();
const message = Buffer.from("Hello World");

const compressed = compressBuffer(message);
const decompressed = decompressBuffer(compressed);
console.log(decompressed.toString());

const encrypted = encryptTcpChunk({ buffer: message, key });
const decrypted = decryptTcpChunk({ buffer: encrypted, key });
console.log(decrypted.toString());

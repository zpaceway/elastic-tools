"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inTcpChunks = exports.decryptBuffer = exports.encryptBuffer = void 0;
const crypto_1 = __importDefault(require("crypto"));
const TCP_CHUNK_SIZE = 1400;
const encryptBuffer = (buffer, key) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
};
exports.encryptBuffer = encryptBuffer;
const decryptBuffer = (buffer, key) => {
    const iv = buffer.subarray(0, 16);
    const encryptedData = buffer.subarray(16);
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};
exports.decryptBuffer = decryptBuffer;
const inTcpChunks = (data) => {
    let offset = 0;
    const chunks = [];
    while (offset < data.length) {
        const chunkSize = Math.min(TCP_CHUNK_SIZE, data.length - offset);
        const chunk = data.slice(offset, offset + chunkSize);
        chunks.push(chunk);
        offset += chunkSize;
    }
    return chunks;
};
exports.inTcpChunks = inTcpChunks;

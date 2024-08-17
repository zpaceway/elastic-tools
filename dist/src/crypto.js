"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncommingEncryptedMessage = exports.inTcpChunks = exports.decryptBuffer = exports.encryptBuffer = void 0;
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("./constants");
const TCP_CHUNK_SIZE = 1400;
const encryptBuffer = (buffer, key) => {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result = Buffer.concat([iv, authTag, encrypted]);
    const encoded = Buffer.concat([
        Buffer.from(result.length.toString().padStart(8, "0")),
        result,
    ]);
    return encoded;
};
exports.encryptBuffer = encryptBuffer;
const decryptBuffer = (buffer, key) => {
    const data = buffer.subarray(8);
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encryptedData = data.subarray(28);
    const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};
exports.decryptBuffer = decryptBuffer;
const inTcpChunks = (data) => {
    let offset = 0;
    const chunks = [];
    while (offset < data.length) {
        const chunkSize = Math.min(TCP_CHUNK_SIZE, data.length - offset);
        const chunk = data.subarray(offset, offset + chunkSize);
        chunks.push(chunk);
        offset += chunkSize;
    }
    return chunks;
};
exports.inTcpChunks = inTcpChunks;
const handleIncommingEncryptedMessage = ({ incommingEncryptedMessage, data, targetSocket, }) => {
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
        if (incommingEncryptedMessage.buffer.length >= incommingEncryptedMessage.size) {
            const decrypted = (0, exports.decryptBuffer)(incommingEncryptedMessage.buffer.subarray(0, incommingEncryptedMessage.size), constants_1.PUBLIC_KEY);
            targetSocket.write(decrypted, (err) => {
                if (!err)
                    return;
                targetSocket.end();
            });
            incommingEncryptedMessage.buffer =
                incommingEncryptedMessage.buffer.subarray(incommingEncryptedMessage.size);
            incommingEncryptedMessage.size = -1;
            continue;
        }
        break;
    }
};
exports.handleIncommingEncryptedMessage = handleIncommingEncryptedMessage;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncommingEncryptedTcpChunk = exports.inTcpChunks = exports.decryptTcpChunk = exports.encryptTcpChunk = exports.compressBuffer = exports.decompressBuffer = void 0;
const crypto_1 = __importDefault(require("crypto"));
const zlib_1 = __importDefault(require("zlib"));
const constants_1 = require("./constants");
const decompressBuffer = (buffer) => {
    return zlib_1.default.inflateSync(buffer);
};
exports.decompressBuffer = decompressBuffer;
const compressBuffer = (buffer) => {
    return zlib_1.default.deflateSync(buffer);
};
exports.compressBuffer = compressBuffer;
const encryptTcpChunk = ({ buffer, key, }) => {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result = (0, exports.compressBuffer)(Buffer.concat([iv, authTag, encrypted]));
    const encoded = Buffer.concat([
        Buffer.from(result.length.toString().padStart(constants_1.TCP_CHUNK_SIZE_MESSAGE_LENGTH, "0")),
        result,
    ]);
    return encoded;
};
exports.encryptTcpChunk = encryptTcpChunk;
const decryptTcpChunk = ({ buffer, key, }) => {
    const data = (0, exports.decompressBuffer)(buffer.subarray(constants_1.TCP_CHUNK_SIZE_MESSAGE_LENGTH));
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encryptedData = data.subarray(28);
    const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};
exports.decryptTcpChunk = decryptTcpChunk;
const inTcpChunks = (data) => {
    let offset = 0;
    const chunks = [];
    while (offset < data.length) {
        const chunkSize = Math.min(constants_1.TCP_CHUNK_SIZE_MESSAGE_LENGTH, data.length - offset);
        const chunk = data.subarray(offset, offset + chunkSize);
        chunks.push(chunk);
        offset += chunkSize;
    }
    return chunks;
};
exports.inTcpChunks = inTcpChunks;
const handleIncommingEncryptedTcpChunk = ({ sweeper, data, key, onDecrypted, }) => {
    sweeper.buffer = Buffer.concat([sweeper.buffer, data]);
    while (sweeper.buffer.length >= constants_1.TCP_CHUNK_SIZE_MESSAGE_LENGTH) {
        if (sweeper.size === -1) {
            sweeper.size =
                parseInt(sweeper.buffer.subarray(0, constants_1.TCP_CHUNK_SIZE_MESSAGE_LENGTH).toString()) + constants_1.TCP_CHUNK_SIZE_MESSAGE_LENGTH;
        }
        if (sweeper.buffer.length >= sweeper.size) {
            const decrypted = (0, exports.decryptTcpChunk)({
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
exports.handleIncommingEncryptedTcpChunk = handleIncommingEncryptedTcpChunk;

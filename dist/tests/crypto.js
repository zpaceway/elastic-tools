"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("../src/core/crypto");
const key = crypto_1.default.createHash("sha256").update("justakey").digest();
const message = Buffer.from("Hello World");
const compressed = (0, crypto_2.compressBuffer)(message);
const decompressed = (0, crypto_2.decompressBuffer)(compressed);
console.log(decompressed.toString());
const encrypted = (0, crypto_2.encryptTcpChunk)({ buffer: message, key });
const decrypted = (0, crypto_2.decryptTcpChunk)({ buffer: encrypted, key });
console.log(decrypted.toString());

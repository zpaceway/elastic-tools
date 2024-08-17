"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../src/constants");
const crypto_1 = require("../src/crypto");
const key = constants_1.PUBLIC_KEY;
const message = Buffer.from("Hello World");
const encrypted = (0, crypto_1.encryptBuffer)(message, key);
const decrypted = (0, crypto_1.decryptBuffer)(encrypted, key);
console.log(decrypted.toString());

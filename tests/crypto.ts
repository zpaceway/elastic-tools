import { PUBLIC_KEY } from "../src/constants";
import { decryptBuffer, encryptBuffer } from "../src/crypto";

const key = PUBLIC_KEY;
const message = Buffer.from("Hello World");
const encrypted = encryptBuffer(message, key);
const decrypted = decryptBuffer(encrypted, key);

console.log(decrypted.toString());

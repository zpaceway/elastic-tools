import { PUBLIC_KEY } from "../src/constants";
import { decryptBuffer, encryptBuffer } from "../src/crypto";

const key = PUBLIC_KEY;
const message = Buffer.from("Hello World");
const encrypted = encryptBuffer({ buffer: message, key });
const decrypted = decryptBuffer({ buffer: encrypted, key });

console.log(decrypted.toString());

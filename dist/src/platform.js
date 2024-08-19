"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformConnector = void 0;
const mockedUsers = [
    {
        id: "2aaa619e-c63b-432d-9bb6-d86af0bb7b40",
        username: "zpaceway",
        level: "admin",
        password: "123456",
        encryptionKey: "06d4ea86bcd543ddba74315c939ae999",
    },
    {
        id: "2aaa619e-c63b-432d-9bb6-d86af0bb7b40",
        username: "alexandro",
        level: "client",
        password: "123456",
        encryptionKey: "06d4ea86bcd543ddba74315c939ae999",
    },
];
class PlatformConnector {
    constructor({ username, password }) {
        this.keys = {};
        this.getClient = (...args_1) => __awaiter(this, [...args_1], void 0, function* (clientId = "self") {
            if (this.keys[clientId])
                return this.keys[clientId];
            const client = mockedUsers.find((_user) => _user.password === this.password && _user.username === this.username);
            if (client) {
                this.keys[clientId] = {
                    id: client.id,
                    username: client.username,
                    encryptionKey: Buffer.from(client.encryptionKey),
                };
                if (client.level === "admin") {
                }
            }
            return this.keys[clientId] || null;
        });
        this.username = username;
        this.password = password;
    }
}
exports.PlatformConnector = PlatformConnector;

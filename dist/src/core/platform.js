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
        key: "06d4ea86bcd543ddba74315c939ae999",
    },
    {
        id: "d93360e0-1175-48ee-845b-a1717200ad11",
        username: "alexandro",
        level: "client",
        password: "123456",
        key: "58f02cc073ce46c39230e224c4f23e8f",
    },
    {
        id: "ca69b77e-1100-4e72-a49c-250ada1b989b",
        username: "guido",
        level: "client",
        password: "123456",
        key: "8b238ee5e79549748eed7ab3a5ec14a3",
    },
];
class PlatformConnector {
    constructor({ username, password }) {
        this.cache = {};
        this.username = username;
        this.password = password;
    }
    getClient() {
        return __awaiter(this, arguments, void 0, function* (key = "self") {
            if (this.cache[key])
                return this.cache[key];
            const client = mockedUsers.find((_user) => {
                if (key === "self")
                    return (_user.password === this.password && _user.username === this.username);
                return _user.key === key;
            });
            if (client) {
                this.cache[key] = {
                    id: client.id,
                    username: client.username,
                    key: Buffer.from(client.key),
                };
            }
            return this.cache[key] || null;
        });
    }
}
exports.PlatformConnector = PlatformConnector;

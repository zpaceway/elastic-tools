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

export type platformClient = {
  id: string;
  username: string;
  key: Buffer;
};

export class PlatformConnector {
  username: string;
  password: string;
  cache: Record<string, platformClient> = {};

  constructor({ username, password }: { username: string; password: string }) {
    this.username = username;
    this.password = password;
  }

  async getClient(key: string = "self") {
    if (this.cache[key]) return this.cache[key];

    const client = mockedUsers.find((_user) => {
      if (key === "self")
        return (
          _user.password === this.password && _user.username === this.username
        );

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
  }
}

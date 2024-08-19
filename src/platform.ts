type Client = {
  id: string;
  username: string;
  encryptionKey: Buffer;
};

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

export class PlatformConnector {
  username: string;
  password: string;
  keys: Record<string, Client> = {};

  constructor({ username, password }: { username: string; password: string }) {
    this.username = username;
    this.password = password;
  }

  getClient = async (clientId: string = "self") => {
    if (this.keys[clientId]) return this.keys[clientId];

    const client = mockedUsers.find(
      (_user) =>
        _user.password === this.password && _user.username === this.username
    );

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
  };
}

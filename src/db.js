import pkg from 'pg'
const { Client } = pkg;
import fs from 'fs'

// PostgreSQL Yandex Cloud connection
const config = {
  connectionString:
  "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
  ssl: {
    rejectUnauthorized: true,
    ca: fs
      .readFileSync("/home/artjom/.postgresql/root.crt")
      .toString(),
  },
};

export const conn = new Client(config);
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./test.db');
db.serialize(() => {
  db.run('CREATE TABLE test (id INTEGER)');
  console.log('Table created');
});
db.close();

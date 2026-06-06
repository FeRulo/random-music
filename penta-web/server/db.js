import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'leaderboard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    mode       TEXT    NOT NULL,
    clef       TEXT    NOT NULL,
    key_sig    TEXT    NOT NULL,
    difficulty INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    score      INTEGER NOT NULL,
    date       TEXT    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lb_key
    ON leaderboard (mode, clef, key_sig, difficulty);
`);

export default db;

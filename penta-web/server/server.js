import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3001;
const MAX_ENTRIES = 5;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// GET /api/leaderboard?mode=&clef=&keySig=&difficulty=
app.get('/api/leaderboard', (req, res) => {
  const { mode, clef, keySig, difficulty } = req.query;
  if (!mode || !clef || !keySig || difficulty === undefined) {
    return res.status(400).json({ error: 'Missing query params' });
  }
  const rows = db.prepare(`
    SELECT name, score, date, difficulty, clef, key_sig AS keySignatureRaw, mode
    FROM leaderboard
    WHERE mode = ? AND clef = ? AND key_sig = ? AND difficulty = ?
    ORDER BY score DESC
    LIMIT ?
  `).all(mode, clef, keySig, Number(difficulty), MAX_ENTRIES);

  const entries = rows.map(r => ({
    name: r.name,
    score: r.score,
    date: r.date,
    difficulty: r.difficulty,
    clef: r.clef,
    mode: r.mode,
    keySignature: parseKeySig(r.keySignatureRaw),
  }));

  res.json(entries);
});

// POST /api/leaderboard
// Body: { mode, clef, keySig, difficulty, entry }
app.post('/api/leaderboard', (req, res) => {
  const { mode, clef, keySig, difficulty, entry } = req.body;
  if (!mode || !clef || !keySig || difficulty === undefined || !entry) {
    return res.status(400).json({ error: 'Missing body fields' });
  }

  db.prepare(`
    INSERT INTO leaderboard (mode, clef, key_sig, difficulty, name, score, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(mode, clef, keySig, Number(difficulty), entry.name, entry.score, entry.date);

  // Prune to top MAX_ENTRIES for this leaderboard key
  db.prepare(`
    DELETE FROM leaderboard
    WHERE mode = ? AND clef = ? AND key_sig = ? AND difficulty = ?
      AND id NOT IN (
        SELECT id FROM leaderboard
        WHERE mode = ? AND clef = ? AND key_sig = ? AND difficulty = ?
        ORDER BY score DESC
        LIMIT ?
      )
  `).run(
    mode, clef, keySig, Number(difficulty),
    mode, clef, keySig, Number(difficulty), MAX_ENTRIES,
  );

  res.json({ ok: true });
});

function parseKeySig(raw) {
  if (raw === 'none' || raw === 'random') return { accidental: 'none', count: 0 };
  const m = raw.match(/^(sharp|flat)(\d+)$/);
  return m ? { accidental: m[1], count: Number(m[2]) } : { accidental: 'none', count: 0 };
}

app.listen(PORT, () => {
  console.log(`Leaderboard server running on http://localhost:${PORT}`);
});

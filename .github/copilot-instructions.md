# Copilot Instructions — random-music / PentaTrainer

This file provides guidance to GitHub Copilot when working with code in this repository.

---

## Living documents — mandatory review on every change

This project has three living specification documents under `penta-web/docs/`. **Before and after any non-trivial code change, every agent must:**

1. Read whichever of the three documents is relevant to the change.
2. Decide whether each document needs updating to reflect the new behavior, new design decisions, or removed/renamed concepts.
3. Apply the updates (or explicitly confirm that no update is needed).

| Document | Path | What it covers |
|---|---|---|
| PRD | `penta-web/docs/prd.md` | Functional requirements (RF-01 to RF-10), non-functional requirements, out-of-scope |
| Architecture | `penta-web/docs/architecture.md` | Stack, data model, state machine, scoring formulas, SVG coordinates, audio, persistence, rhythm-mode extension |
| UX | `penta-web/docs/ux.md` | Screen flows, layouts, visual states, color palette, typography, responsive rules, accessibility |

Do not skip this step. These documents are the source of truth for behavior and design; code that diverges from them without updating them creates drift that breaks future agents.

---

## What this project is

### Python CLI tools (root)

- **random-notes.py** — prints N random rows of 9 chromatic notes (all 17 note names including enharmonics). Usage: `python random-notes.py <N>`
- **random-penta.py** — interactive terminal ear-training game: renders an ASCII bass-clef staff with randomly placed notes, asks the player to identify them. Tracks scores in `random-penta.txt`. Usage: `python random-penta.py <espacios>` where `espacios` controls ledger-line range (0 = staff only).

#### Dependencies (`random-penta.py`)
- `playsound` — audio feedback (`drip.ogg` wrong, `success.mp3` correct)
- `gi` (PyGObject) — GStreamer backend for playsound on Linux
- `tty` / `termios` — raw keypress input (Linux/macOS only). Install: `pip install playsound`

#### Key internals
- `espacios` — ledger-line count; all position math derives from it.
- `CIFRADO` (`"AGFEDCB"`) — bass-clef note mapping; rotated by `espacios`.
- `crear_notas(espacios)` / `crear_pentagrama(notas, NUMERO)` — build note pool and pick random non-consecutive set.
- Scoring: `(900 + 100×espacios) / response_time_seconds`; top-3 persisted in `random-penta.txt`.

---

### PentaTrainer — web app (`penta-web/`)

A React SPA that gamifies music sight-reading. No installation required; runs in any modern browser.

#### Stack
| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript, Vite 8, Tailwind CSS v4 |
| Graphics | Declarative SVG in JSX (no canvas library) |
| Audio | Web Audio API (no external files) |
| Persistence | SQLite via local Express server (port 3001) + `localStorage` fallback |
| Music fonts | Bravura / FreeSerif via CDN (SMuFL Unicode) |

#### Key source files
| File | Role |
|---|---|
| `src/types.ts` | All shared types |
| `src/constants.ts` | `CIFRADO`, `NOTES_PER_ROUND`, `DIFFICULTY_LABELS`, BPM constants |
| `src/App.tsx` | Phase router: `menu → playing → result` |
| `src/hooks/useGameEngine.ts` | Central `useReducer` state machine |
| `src/hooks/useMetronome.ts` | Web Audio lookahead scheduler for rhythm mode |
| `src/utils/noteMapping.ts` | Position → note letter algorithm (port of Python script) |
| `src/components/staff/StaffSVG.tsx` | Root staff component; accepts `noteStates` prop for result mode |
| `server/server.js` | Express: `GET/POST /api/leaderboard`, SQLite persistence |

#### Development commands
```bash
npm run dev:full   # Vite (:5173) + Express (:3001) in parallel
npm run dev        # frontend only (scores fall back to localStorage)
npm run dev:server # Express only
```

---

## PRD summary (penta-web)

Full spec: `penta-web/docs/prd.md`

- **RF-01** Menu: clef (Sol/Fa), key signature (14 options), difficulty slider 0–9, game mode (Practice/Countdown), focus (Speed/Rhythm). All settings persist when returning to menu.
- **RF-02** Staff SVG: 16 notes displayed horizontally; active note in pulsing blue; correct = green, unanswered = dark; ledger lines auto-drawn.
- **RF-03** Input: keys A–G (Anglo convention: A=La … G=Sol); virtual buttons for touch. Wrong key does not advance position.
- **RF-04** Practice scoring: `delta = (900 + 100×difficulty) / response_secs`; correct `+delta`, wrong `−delta`; final = `points / (totalSecs / 16)`.
- **RF-05** Countdown: 30s clock; correct answer < 3s adds `(3 − t)` seconds; ends at 0; score = correct count.
- **RF-06** Audio: chime (correct), buzz (wrong), 3-note descending sequence (game over) — all via Web Audio API.
- **RF-07** Leaderboard: top 5 per `mode+clef+keySig+difficulty`; SQLite server + localStorage fallback; new record prompts name entry.
- **RF-08** Post-round summary: staff with all played notes colored green/red above the score stats.
- **RF-09** Rhythm focus: metronome at configurable BPM (40–200, step 10, default 120); beat advances note automatically (miss if no correct key); timing accuracy (0–1) scales the score.
- **RF-10** Countdown+Rhythm acceleration: BPM +10 every 16 notes, cap 220; flash + sound on increase.

---

## Architecture summary (penta-web)

Full spec: `penta-web/docs/architecture.md`

### Difficulty → espacios mapping
`espacios = max(0, difficulty − 3)`. Difficulty 0–2 share `espacios=0` but filter the note pool to the center 3/5/7 positions.

### State machine phases
```
menu ──START_GAME──► playing ──(16 notes or clock=0)──► result
 ▲                                                         │
 └──────────────────RESET──────────────────────────────────┘
```

### Key actions
| Action | Effect |
|---|---|
| `START_GAME` | Generates `noteSequence`, inits timers |
| `KEY_PRESSED` | Evaluates key vs. active note; updates score / countdown timer |
| `TICK` | Decrements countdown 0.1s; triggers result if ≤ 0 |
| `BEAT` | Rhythm only — advances `currentIndex`, records miss if unanswered |
| `BPM_INCREASE` | Rhythm+Countdown only — raises `ritmoBpmCurrent` by `ritmoAccelStep` |
| `RESET` | Returns to `menu` phase |

### SVG coordinate system
- `viewBox="0 0 920 240"`, `STEP=12px`, `LINE5_Y=60`, `LINE1_Y=156`
- Note y: `60 + (staffIndex − espacios) × 12`
- 16 notes centered horizontally between key signature end and `x=910`

### Leaderboard keys
- Speed: `rmusic_lb_{mode}_{clef}_{keySig}_{difficulty}`
- Rhythm: `rmusic_lb_{mode}_rhythm_{clef}_{keySig}_{difficulty}_{bpm}bpm`

### Rhythm scoring
```
timingAccuracy = max(0, 1 − |pressWallTime − beatWallTime| / (beatWindowMs × 0.5))
baseDelta      = (900 + 100 × difficulty) × (bpm / 60)
noteScore      = baseDelta × timingAccuracy   // Practice+Rhythm
```

---

## UX summary (penta-web)

Full spec: `penta-web/docs/ux.md`

### Design principles
1. Staff is the protagonist — UI recedes into the background.
2. Feedback < 50ms (visual + audio on every keypress).
3. One-click start from the menu.
4. Physical keys A–G primary; virtual buttons cover touch devices.

### Visual states of notes
| State | Color | When |
|---|---|---|
| `idle` | `#1e1e2e` dark cream | Not yet reached |
| `active` | `#60a5fa` blue + pulsing ring | Current note |
| `wrong` flash | `#f87171` red | 350ms on wrong key (Speed mode) |
| `correct` | `#4ade80` green | Already answered correctly |

In **Rhythm mode**: past notes stay permanently green (correct) or red (wrong/miss) — no flash.

### Key color tokens
| Token | Value | Use |
|---|---|---|
| Page bg | `#0f0f1a` | Base background |
| Card bg | `#111827` | Panels, cards |
| SVG bg | `#1a1625` | Staff interior |
| Active | `#3b82f6` | Selection, Jugar button, active note |
| Rhythm | `#ea580c` | Rhythm focus, beat progress bar, BPM display |
| Correct | `#4ade80` | Correct note, ok feedback |
| Error | `#f87171` | Wrong note, error feedback |
| Record | `#d97706` | Highlighted leaderboard row |

### Rhythm-mode UX additions
- **Beat progress bar**: thin amber bar (2–3px) that fills left-to-right within each beat window via `requestAnimationFrame`, reset each beat.
- **Feedback block** (below staff): large `text-4xl` mono line showing timing quality (🎯 42ms / 👍 87ms / ⏰ 134ms) or `miss`/wrong key, with a gray subline naming the note.
- **ResultScreen** rhythm extras: 4 stats (Aciertos, Misses, T/nota, Precisión), max BPM reached, BPM range in subtitle.

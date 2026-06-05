# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Two standalone Python CLI tools for music practice:

- **[random-notes.py](random-notes.py)** — prints N random rows of 9 chromatic notes (all 17 note names including enharmonics). Usage: `python random-notes.py <N>`
- **[random-penta.py](random-penta.py)** — an interactive terminal ear-training game that renders an ASCII pentagram with randomly placed notes and asks the player to identify them by letter. Tracks scores in `random-penta.txt`. Usage: `python random-penta.py <espacios>` where `espacios` controls the ledger-line range (0 = staff only, higher = more ledger lines above/below).

## Dependencies

`random-penta.py` requires:
- `playsound` — plays feedback sounds (`drip.ogg` for wrong, `success.mp3` for correct)
- `gi` (PyGObject) — imported but used indirectly via playsound's GStreamer backend on Linux
- `tty` / `termios` — raw keypress input (Linux/macOS only)

Install: `pip install playsound`

## Key internals (random-penta.py)

- `espacios` is the ledger-line count — it expands the note grid above and below the 5-line staff. All position math derives from this value.
- `CIFRADO` (`"AGFEDCB"`) is the bass-clef note name mapping; it is rotated by `espacios` so position 0 maps to the correct note name for the chosen range.
- `crear_notas(espacios)` builds every possible note position as an ASCII column; `crear_pentagrama(notas, NUMERO)` picks `NUMERO` random non-consecutive ones for a round.
- `CLAVE_FA` is a hard-coded 9-row ASCII F-clef; `crear_armaduras` generates all key signatures (sharps and flats) as random column lists prepended to each staff.
- Scoring: points per note = `(900 + 100*espacios) / response_time_seconds`; high scores are persisted in `random-penta.txt` (top 3).

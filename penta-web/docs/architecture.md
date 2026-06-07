# Arquitectura técnica — PentaTrainer

## Stack

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS v4 (plugin `@tailwindcss/vite`) |
| Gráficos | SVG declarativo (JSX, sin librería de canvas) |
| Audio | Web Audio API nativa |
| Persistencia | SQLite (servidor local) + `localStorage` (fallback) |
| Backend | Node.js + Express 5 + `better-sqlite3` |
| Fuentes musicales | Bravura / FreeSerif (CDN) vía `<text>` SVG con Unicode SMuFL |

El frontend es una SPA estática. El backend es un proceso Express local que expone la API de leaderboard; la app funciona sin él usando localStorage como fallback.

---

## Estructura de carpetas

```
penta-web/
├── docs/               ← documentación (este directorio)
├── server/
│   ├── server.js           ← Express: GET/POST /api/leaderboard, CORS, poda top-5
│   ├── db.js               ← inicialización SQLite (better-sqlite3), schema
│   └── leaderboard.db      ← archivo SQLite generado en runtime (en .gitignore)
├── src/
│   ├── types.ts            ← todos los tipos compartidos
│   ├── constants.ts        ← CIFRADO, NOTES_PER_ROUND, etc.
│   ├── App.tsx             ← router de fase (menu → playing → result)
│   │
│   ├── utils/
│   │   ├── noteMapping.ts      ← algoritmo de mapeo de posición → letra
│   │   ├── noteGenerator.ts    ← secuencia aleatoria sin notas consecutivas
│   │   ├── keySignature.ts     ← posiciones de alteraciones en pentagrama
│   │   ├── audio.ts            ← sonidos Web Audio API
│   │   ├── leaderboard.ts      ← loadLeaderboard (async, API-first) + helpers localStorage
│   │   └── leaderboardApi.ts   ← fetch wrapper hacia localhost:3001 (timeout 2s)
│   │
│   ├── hooks/
│   │   ├── useGameEngine.ts    ← máquina de estados del juego (useReducer)
│   │   ├── useCountdown.ts     ← intervalo 100ms para modo contrarreloj
│   │   ├── useKeyboard.ts      ← captura de teclas A-G + Escape sobre window
│   │   └── useMetronome.ts     ← scheduler lookahead Web Audio (ritmo)
│   │
│   └── components/
│       ├── MainMenu.tsx
│       ├── GameScreen.tsx
│       ├── ResultScreen.tsx
│       ├── NameEntry.tsx
│       ├── Leaderboard.tsx
│       └── staff/
│           ├── staffConstants.ts   ← constantes de píxeles del SVG
│           ├── StaffSVG.tsx        ← componente raíz del pentagrama; acepta `noteStates` para modo resultado
│           ├── StaffLines.tsx      ← 5 líneas horizontales
│           ├── ClefSymbol.tsx      ← clave Sol / Fa (glifo Unicode)
│           ├── KeySignatureAccidentals.tsx
│           └── NoteHead.tsx        ← elipse + plica + ledger lines
```

---

## Modelo de datos

### `GameState` (estado central del reducer)

```ts
interface GameState {
  phase: 'menu' | 'playing' | 'result';
  settings: GameSettings;         // configuración seleccionada en menú
  noteSequence: NotePosition[];   // 16 notas generadas para la ronda
  currentIndex: number;           // nota activa (0-15)
  noteStartTime: number;          // performance.now() al mostrar la nota (en ritmo: beatWallTime)
  answered: AnsweredNote[];       // historial de todas las pulsaciones
  practicePoints: number;         // puntos acumulados (práctica)
  practiceGameStartTime: number;
  countdownSecondsLeft: number;   // segundos restantes (contrarreloj)
  countdownStartTime: number;
  countdownCorrect: number;       // aciertos totales en contrarreloj
  finalScore: number | null;      // score calculado al terminar la ronda
  // Enfoque ritmo (inactivos cuando settings.rhythmMode === false)
  ritmoBpmCurrent: number;         // BPM vivo (sube durante partida en countdown)
  ritmoBeatCount: number;          // beats disparados desde el inicio
  ritmoScore: number;              // score timing-weighted acumulado (Práctica + Ritmo)
  ritmoBpmJustIncreased: boolean;  // true durante 1 beat tras subida → flash UI
}
```

#### Campo `difficulty`

`GameSettings.difficulty` es un entero 0–9. Los valores se mapean mediante `difficultyToEspacios(d) = max(0, d − 3)`:

| `difficulty` | Notas disponibles | `espacios` SVG | Label |
|---|---|---|---|
| 0 | 3 (centro ±1) | 0 | "3 notas" |
| 1 | 5 (centro ±2) | 0 | "5 notas" |
| 2 | 7 (centro ±3) | 0 | "7 notas" |
| 3 | 9 (staff completo) | 0 | "Staff completo" |
| 4 | 11 | 1 | "+1 línea" |
| 5 | 13 | 2 | "+2 líneas" |
| 6 | 15 | 3 | "+3 líneas" |
| 7 | 17 | 4 | "+4 líneas" |
| 8 | 19 | 5 | "+5 líneas" |
| 9 | 21 | 6 | "+6 líneas" |

Los labels canónicos están en el array `DIFFICULTY_LABELS` de `constants.ts`. Los niveles 0–2 comparten `espacios=0` pero filtran el pool de notas al subconjunto central (`staffIndex` 3–5, 2–6 ó 1–7 respectivamente).

### `NotePosition`

```ts
interface NotePosition {
  staffIndex: number;  // 0 = posición más alta visible, crece hacia abajo
  letter: string;      // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
}
```

`staffIndex` es el sistema de coordenadas vertical compartido entre el motor del juego y el SVG. El valor 0 corresponde a la posición más alta del rango (con `espacios` líneas adicionales). El eje Y del SVG se deriva de él:

```
noteY = LINE5_Y + (staffIndex - espacios) * STEP
      = 60 + (staffIndex - difficulty) * 12   [px]
```

---

## Algoritmo de mapeo de notas

Puerto directo del script Python `random-penta.py`.

```
CIFRADO_BASS   = [A, G, F, E, D, C, B]   // clave de Fa, top→bottom
CIFRADO_TREBLE = [F, E, D, C, B, A, G]   // clave de Sol, top→bottom

espacios = difficultyToEspacios(difficulty)   // = max(0, difficulty − 3)

1. Rotar CIFRADO left por `espacios` posiciones (cambiarOrden)
2. Extender/repetir hasta cubrir totalPositions = 9 + 2×espacios
3. Zip (staffIndex, letter) → pool completo de NotePosition
4. Si difficulty < 3: filtrar pool a staffIndex ∈ [4 − halfWidth, 4 + halfWidth]
   donde halfWidth = difficulty + 1  (1, 2 ó 3)
```

Con `difficulty=3` (`espacios=0`), clave Sol: F5 E5 D5 C5 B4 A4 G4 F4 E4.  
Con `difficulty=0`: solo D5 C5 B4 (staffIndex 2–4 — los 3 del centro).  
Con `difficulty=4` (`espacios=1`): se añade G5 arriba y D4 abajo.

---

## Máquina de estados (`useGameEngine`)

Implementada con `useReducer`. Tres fases:

```
menu ──START_GAME──► playing ──(16 notas ó reloj=0)──► result
 ▲                                                        │
 └────────────────────RESET──────────────────────────────┘
```

### Acciones

| Acción | Efecto |
|---|---|
| `START_GAME` | Genera `noteSequence`, inicializa timers, `phase = 'playing'` |
| `KEY_PRESSED` | Compara tecla con nota activa; actualiza `answered`, `practicePoints`, `currentIndex`, o bien `countdownCorrect` + bonus de tiempo; reproduce la frecuencia real de la nota si es acierto |
| `TICK` | Decrementa `countdownSecondsLeft` en 0.1s; si ≤ 0 → `phase = 'result'` |
| `RESET` | Vuelve al estado inicial (`phase = 'menu'`) — también disparado por Escape |

### Fórmula de puntuación

```
delta = (900 + 100 × difficulty) / responseTimeSecs   // difficulty 0-9 → multiplicador 900–1800

Práctica:   acierto → points += delta  |  error → points -= delta
            finalScore = points / (totalSecs / 16)

Contrarreloj: acierto → correctCount++, timer += max(0, 3 - responseSecs)
              finalScore = correctCount
```

---

## `StaffSVG` — prop `noteStates` (modo resultado)

`StaffSVG` acepta un prop opcional `noteStates?: ('correct' | 'wrong' | 'idle' | 'active')[]`. Cuando se pasa, sobreescribe la lógica `getNoteState` basada en `currentIndex`/`wrongFlash` y aplica directamente el estado de cada nota. El indicador de posición activa (línea vertical azul punteada) se suprime automáticamente.

`ResultScreen` usa este prop para renderizar el pentagrama post-ronda: divide `answered` en bloques de `NOTES_PER_ROUND` y para cada bloque monta un `StaffSVG` con:
- `noteSequence`: `chunk.map(a => a.note)`
- `noteStates`: `chunk.map(a => a.correct ? 'correct' : 'wrong')`

El pentagrama de resultados se muestra a ancho completo (`max-w-5xl`) encima del score y las estadísticas, con la misma clave, armadura y dificultad de la ronda jugada.

---

## Coordenadas SVG del pentagrama

```
viewBox="0 0 920 240"

STEP     = 12 px   (distancia entre posiciones adyacentes línea↔espacio)
LINE5_Y  = 60      (y de la línea superior / línea 5)
LINE1_Y  = 156     (y de la línea inferior / línea 1 = 60 + 8×12)

Líneas del pentagrama en y: 60, 84, 108, 132, 156

Nota en staffIndex i, dificultad d:
  y = 60 + (i - d) × 12

Plica: sube cuando staffIndex ≥ d+4 (nota en o bajo línea media)
       baja cuando staffIndex < d+4 (nota sobre línea media)

Ledger lines: se dibujan en posiciones pares fuera del rango [d, d+8]
```

### Layout horizontal

```
x=10        STAFF_X_START (inicio de las 5 líneas)
x=20..70    ClefSymbol
x=72+       KeySignatureAccidentals (14 px entre alteraciones)
x≥160       Primera nota (NOTES_START_X mínimo, ajustado por armadura)
x+46        Cada nota siguiente (NOTE_SPACING = 46 px)
x=910       STAFF_X_END
```

Las 16 notas se centran horizontalmente en el espacio disponible entre el fin de la armadura y `STAFF_X_END`:

```
totalNotesWidth = 15 × 46 = 690 px
leftPad = max(0, (STAFF_X_END - notesStartX - totalNotesWidth) / 2)
firstNoteX = notesStartX + leftPad
```

### Posicionamiento de claves

| Clave | Línea de referencia | y SVG |
|---|---|---|
| Sol (𝄞) | G line — línea 2 desde abajo | y=132 |
| Fa (𝄢) | F line — línea 4 desde abajo | y=84 |

Los dos puntos de la clave Fa se centran en los espacios que flanquean la línea 4:
- Punto superior: `cy = line4Y - 12` = 72 (espacio entre líneas 4 y 5)
- Punto inferior: `cy = line4Y + 12` = 96 (espacio entre líneas 3 y 4)

---

## Posiciones de armadura en el pentagrama

Los arrays contienen `staffIndex` (0=arriba, 8=abajo) dentro del grid de 9 posiciones base (`espacios=0`). Son constantes musicalmente correctas:

| | Sostenidos | Bemoles |
|---|---|---|
| **Clave Fa** | [2, 5, 1, 4, 7] | [6, 3, 7, 4, 8, 5] |
| **Clave Sol** | [0, 3, 6, 2, 5, 1, 4] | [4, 1, 5, 2, 6, 3, 7] |

Fuente para clave Fa: arrays `sostenidos`/`bemoles` del script original `random-penta.py`.

---

## Persistencia

Los puntajes se guardan en un servidor Express local (puerto `3001`) respaldado por SQLite. El frontend también mantiene `localStorage` como caché y fallback para cuando el servidor no está disponible.

### Servidor local (`server/`)

| | |
|---|---|
| Puerto | `3001` |
| Base de datos | `server/leaderboard.db` (SQLite, archivo local) |
| `GET /api/leaderboard` | Devuelve top 5 para un conjunto `mode+clef+keySig+difficulty` |
| `POST /api/leaderboard` | Inserta una entrada nueva y poda a top 5 |

**Schema SQLite:**

```sql
CREATE TABLE leaderboard (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  mode       TEXT    NOT NULL,   -- 'practice' | 'countdown'
  clef       TEXT    NOT NULL,   -- 'treble' | 'bass'
  key_sig    TEXT    NOT NULL,   -- 'none' | 'random' | 'sharp2' | 'flat4' ...
  difficulty INTEGER NOT NULL,   -- 0, 1, 2 ...
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,
  date       TEXT    NOT NULL    -- ISO 8601
);
```

### Clave de leaderboard

Formato: `rmusic_lb_{mode}_{clef}_{keySig}_{difficulty}`

Ejemplos:
- `rmusic_lb_practice_treble_sharp3_1`
- `rmusic_lb_countdown_bass_none_0`
- `rmusic_lb_practice_treble_random_2`

### Flujo de carga y guardado

```
ResultScreen mount
  │
  └─► loadLeaderboard(key)
        ├─ GET /api/leaderboard  ──OK──► devuelve array, actualiza localStorage
        └─ fetch falla/timeout   ──────► devuelve array de localStorage

handleName(name)
  ├─ insertEntry + saveLeaderboardLocal (sync, inmediato)
  └─ apiSaveEntry(key, entry)  ← fire-and-forget, fallo silencioso
```

Solo se muestra el formulario de nombre si `score > 0` y supera el mínimo del Top 5 actual (y solo tras cargar el leaderboard para evitar falsos positivos).

### Desarrollo

```bash
npm run dev:full   # arranca Vite (:5173) y Express (:3001) en paralelo
npm run dev        # solo frontend (los puntajes caen a localStorage)
npm run dev:server # solo el servidor Express
```

---

## Audio (Web Audio API)

Sin ficheros externos. `AudioContext` se inicializa lazy en el primer click del usuario (política de autoplay del navegador).

| Evento | Función | Tipo oscilador | Detalle |
|---|---|---|---|
| Acierto | `playNoteFrequency` | sine | Frecuencia real de la nota identificada, 0.5 s |
| Error | `playWrong` | sawtooth | 160 Hz, 0.25 s |
| Fin de partida | `playGameOver` | sine | A4 → F4 → D4 en cascada |

### `playNoteFrequency(staffIndex, espacios, clef)`

Reproduce la frecuencia exacta de la nota en pantalla. Usa tablas de frecuencias precalculadas indexadas por `adjustedIndex = staffIndex - espacios`, que cubre el rango de `espacios` 0–3:

| `adjustedIndex` | Treble | Bass |
|---|---|---|
| 0 | F5 — 698 Hz | A3 — 220 Hz |
| 4 | B4 — 494 Hz | D3 — 147 Hz |
| 8 | E4 — 330 Hz | G2 — 98 Hz |

Rango de la tabla: –6 a +11 (cubre todas las posiciones posibles con `espacios` 0–3).

---

## Navegación y controles

| Acción | Input |
|---|---|
| Identificar nota | Teclas A-G (física) o botones virtuales |
| Volver al menú durante el juego | Tecla `Escape` o botón "← Menú" en el header |
| Iniciar nuevo juego desde resultado | `Enter` (botón "Jugar de nuevo" queda pre-enfocado) |
| Iniciar juego desde el menú | `Enter` (botón "Jugar" queda pre-enfocado al montar) |

`useKeyboard` acepta un tercer parámetro opcional `onEscape?: () => void` que dispara `RESET` en el engine.

### Foco automático de botones principales

`MainMenu` y `ResultScreen` enfocan su botón de acción principal mediante `useRef` + `useEffect` con un delay de 150 ms al montar el componente. El delay evita que el `keyup` de un Enter previo (p. ej., el que guardó el nombre en `NameEntry`) dispare inmediatamente el botón recién enfocado.

En `ResultScreen`, el foco se difiere hasta que `needsName` sea `false` y el leaderboard haya cargado; si el jugador hizo un récord, el foco se transfiere al botón solo después de que guarda su nombre.

---

## Leaderboard — formato de fecha

Las entradas se almacenan en ISO 8601 (`new Date().toISOString()`). La visualización usa `toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })` sin `timeZone` explícito, por lo que el navegador aplica automáticamente la zona horaria local del usuario.

---

## Enfoque Ritmo — extensión de la arquitectura

Ver spec completa en [`docs/rhythm-mode-spec.md`](./rhythm-mode-spec.md).

### Nuevos campos en `GameSettings`

```ts
rhythmMode: boolean;        // false = velocidad (sin cambios), true = ritmo
ritmoBpm: number;           // BPM inicial: 40–200, default 120 (= 500ms/nota)
ritmoAccelStep: number;     // BPM añadidos cada 16 notas en countdown (default 10)
```

`GameMode` no cambia (`'practice' | 'countdown'`). El enfoque ritmo es ortogonal al tipo de juego.

### Campo adicional en `AnsweredNote`

```ts
timingAccuracy: number | null;   // 0.0–1.0 en ritmo; null en velocidad
missed: boolean;                 // true si el beat avanzó sin respuesta correcta
```

### Nuevas acciones del reducer

| Acción | Efecto |
|---|---|
| `BEAT` | Avanza `currentIndex`; registra miss si sin acierto; actualiza `noteStartTime = beatWallTime`; limpia `ritmoBpmJustIncreased` |
| `BPM_INCREASE` | `ritmoBpmCurrent += ritmoAccelStep`; `ritmoBpmJustIncreased = true` |

En modo ritmo, `KEY_PRESSED` **no avanza `currentIndex`** — solo registra el intento con `timingAccuracy`. Solo `BEAT` avanza la nota.

### `useMetronome` — patrón lookahead Web Audio

```
SCHEDULE_AHEAD_S = 0.1s    ← pre-programar beats en AudioContext.currentTime
SCHEDULER_INTERVAL = 25ms  ← tick JS que rellena la ventana

Por cada beat en la ventana:
  1. scheduleMetronomeClick(beatAudioTime, isDownbeat) → click en AudioContext
  2. dispatch({ type: 'BEAT', beatAudioTime, beatWallTime })
  3. Si beatIndex % 16 === 0 → dispatch({ type: 'BPM_INCREASE' })

bpmRef sincronizado con ritmoBpmCurrent vía useEffect — cambio de BPM sin reiniciar el intervalo.
```

Conversión AudioContext → wall-clock (para comparar con `performance.now()` en `KEY_PRESSED`):
```
wallOffset   = performance.now() − ctx.currentTime × 1000
beatWallTime = beatAudioTime × 1000 + wallOffset
```

### Fórmula de scoring ritmo

```
beatWindowMs   = 60000 / bpm
timingOffset   = |pressWallTime − beatWallTime|
timingAccuracy = max(0, 1 − timingOffset / (beatWindowMs × 0.5))
baseDelta      = (900 + 100 × difficulty) × (bpm / 60)
noteScore      = baseDelta × timingAccuracy        // solo si correct === true
finalScore     = round(sum(noteScore))             // Práctica + Ritmo
```

En **Contrarreloj + Ritmo**: score = aciertos totales; bonus de tiempo = `timingAccuracy × 3s`.

### Nuevas constantes

```ts
RITMO_BPM_DEFAULT        = 120
RITMO_BPM_MIN            = 40
RITMO_BPM_MAX            = 200   // máximo configurable en menú
RITMO_BPM_MAX_GAMEPLAY   = 220   // techo durante aceleración
RITMO_BPM_STEP           = 10
RITMO_ACCEL_STEP_DEFAULT = 10
```

### Clave de leaderboard

```
Velocidad:  rmusic_lb_{mode}_{clef}_{keySig}_{difficulty}              (sin cambio)
Ritmo:      rmusic_lb_{mode}_rhythm_{clef}_{keySig}_{difficulty}_{bpm}bpm
```

Los leaderboards de velocidad no se tocan. Cero migración.

# Arquitectura técnica — PentaTrainer

## Stack

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS v4 (plugin `@tailwindcss/vite`) |
| Gráficos | SVG declarativo (JSX, sin librería de canvas) |
| Audio | Web Audio API nativa |
| Persistencia | `localStorage` |
| Fuentes musicales | Bravura / FreeSerif (CDN) vía `<text>` SVG con Unicode SMuFL |

No hay backend, ni dependencias de runtime más allá de React.

---

## Estructura de carpetas

```
penta-web/
├── docs/               ← documentación (este directorio)
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
│   │   └── leaderboard.ts      ← CRUD sobre localStorage
│   │
│   ├── hooks/
│   │   ├── useGameEngine.ts    ← máquina de estados del juego (useReducer)
│   │   ├── useCountdown.ts     ← intervalo 100ms para modo contrarreloj
│   │   └── useKeyboard.ts      ← captura de teclas A-G sobre window
│   │
│   └── components/
│       ├── MainMenu.tsx
│       ├── GameScreen.tsx
│       ├── ResultScreen.tsx
│       ├── NameEntry.tsx
│       ├── Leaderboard.tsx
│       └── staff/
│           ├── staffConstants.ts   ← constantes de píxeles del SVG
│           ├── StaffSVG.tsx        ← componente raíz del pentagrama
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
  noteStartTime: number;          // performance.now() al mostrar la nota
  answered: AnsweredNote[];       // historial de todas las pulsaciones
  practicePoints: number;         // puntos acumulados (práctica)
  practiceGameStartTime: number;
  countdownSecondsLeft: number;   // segundos restantes (contrarreloj)
  countdownStartTime: number;
  countdownCorrect: number;       // aciertos totales en contrarreloj
  finalScore: number | null;      // score calculado al terminar la ronda
}
```

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

1. Rotar CIFRADO left por `espacios` posiciones (cambiarOrden)
2. Extender/repetir hasta cubrir totalPositions = 9 + 2×espacios
3. Zip (staffIndex, letter) → pool de NotePosition
```

Con `espacios=0`, clave Sol: F5 E5 D5 C5 B4 A4 G4 F4 E4 (arriba→abajo).  
Con `espacios=1`: se añade G5 arriba y D4 abajo (rotación -1 = shift derecho).

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
| `KEY_PRESSED` | Compara tecla con nota activa; actualiza `answered`, `practicePoints`, `currentIndex`, o bien `countdownCorrect` + bonus de tiempo |
| `TICK` | Decrementa `countdownSecondsLeft` en 0.1s; si ≤ 0 → `phase = 'result'` |
| `RESET` | Vuelve al estado inicial (`phase = 'menu'`) |

### Fórmula de puntuación

```
delta = (900 + 100 × difficulty) / responseTimeSecs

Práctica:   acierto → points += delta  |  error → points -= delta
            finalScore = points / (totalSecs / 16)

Contrarreloj: acierto → correctCount++, timer += max(0, 3 - responseSecs)
              finalScore = correctCount
```

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
x≥160       Primera nota (ajustado por el ancho de la armadura)
x+46        Cada nota siguiente (NOTE_SPACING = 46 px)
x=910       STAFF_X_END
```

---

## Posiciones de armadura en el pentagrama

Los arrays contienen `staffIndex` (0=arriba, 8=abajo) dentro del grid de 9 posiciones base (`espacios=0`). Son constantes musicalmente correctas:

| | Sostenidos | Bemoles |
|---|---|---|
| **Clave Fa** | [2, 5, 1, 4, 7] | [6, 3, 7, 4, 8, 5] |
| **Clave Sol** | [0, 3, 6, 2, 5, 1, 4] | [4, 1, 5, 2, 6, 3, 7] |

Fuente para clave Fa: arrays `sostenidos`/`bemoles` del script original `random-penta.py`.

---

## Persistencia (localStorage)

Clave: `rmusic_lb_{mode}_{clef}_{keySig}_{difficulty}`

Ejemplos:
- `rmusic_lb_practice_treble_sharp3_1`
- `rmusic_lb_countdown_bass_none_0`
- `rmusic_lb_practice_treble_random_2`

Valor: array JSON de hasta 5 `LeaderboardEntry`, ordenado por score desc.

Solo se guarda una entrada si `score > 0` y supera la puntuación mínima del Top 5.

---

## Audio (Web Audio API)

Sin ficheros externos. `AudioContext` se inicializa lazy en el primer click del usuario (política de autoplay del navegador).

| Evento | Tipo oscilador | Frecuencias |
|---|---|---|
| Acierto | sine | C5 → G5 (0ms, 70ms) |
| Error | sawtooth | 160 Hz |
| Fin de partida | sine | A4 → F4 → D4 (cascada) |

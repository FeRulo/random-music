# UX — PentaTrainer

## Principios de diseño

1. **La música es el protagonista** — el pentagrama ocupa el espacio central; la UI se retira al fondo.
2. **Feedback inmediato** — cada pulsación produce respuesta visual y sonora en < 50ms.
3. **Sin fricción de entrada** — el jugador puede empezar a jugar con un solo clic desde el menú.
4. **Accesible desde teclado y táctil** — las teclas físicas (A-G) son el input principal; los botones virtuales cubren móvil y tablet.

---

## Flujo de pantallas

```
┌─────────────┐
│  Main Menu  │ ← configuración + Top 5 preview
└──────┬──────┘
       │ "Jugar"
       ▼
┌─────────────┐
│  GameScreen │ ← pentagrama + input + timer/score
└──────┬──────┘
       │ 16 notas completadas (práctica)
       │ reloj = 0 (contrarreloj)
       ▼
┌──────────────┐
│ ResultScreen │ ← stats + nombre si récord + leaderboard
└──────┬───────┘
       │ "Jugar de nuevo" → GameScreen (misma config)
       │ "Menú" → MainMenu
       └───────────────────────
```

---

## Pantalla: Menú principal

### Layout

```
        🎼
    PentaTrainer
  Entrenamiento de lectura musical

┌─────────────────────────────────┐
│  CLAVE                          │
│  [ 𝄞 Sol (Violín) ] [ 𝄢 Fa (Bajo) ] │
│                                 │
│  ARMADURA                       │
│  [ Aleatoria ▼ ]                │
│                                 │
│  DIFICULTAD — LÍNEAS ADICIONALES│
│  [ Básico ] [ +1 ] [ +2 ] [ +3 ]│
│                                 │
│  TIPO DE JUEGO                  │
│  [ 🎯 Práctica ] [ ⏱ Contrarreloj ] │
│                                 │
│  ENFOQUE                        │
│  [ ⚡ Velocidad ] [ 🎵 Ritmo ]  │
│                                 │
│  (solo si Ritmo activo:)        │
│  BPM INICIAL — ♩ = 120          │
│  [──────────●──────────]        │
│   40                  200       │
│  (si Contrarreloj + Ritmo:)     │
│  Acelera +10 BPM cada 16 notas  │
└─────────────────────────────────┘

        [ ▶ Jugar ]

   Top 5 — [tipo]·[enfoque] · Clave [X] · +N líneas
   #  Nombre    Puntos  Dificultad  Fecha
   1  ...
```

### Interacciones

- **Clave**: toggle binario; la selección activa resalta en azul.
- **Armadura**: dropdown con 14 opciones (Aleatoria, Do mayor, 1-6♯, 1-6♭).
- **Dificultad**: 4 botones; el activo resalta en púrpura.
- **Tipo de juego**: toggle binario; Práctica en verde, Contrarreloj en rojo. Sin cambios respecto a v1.
- **Enfoque**: toggle binario; Velocidad en azul neutro, Ritmo en naranja.
- Cuando Ritmo está activo, aparece el slider de BPM (rango 40–200, paso 10, default 120).
- La nota "Acelera +10 BPM cada 16 notas" solo se muestra en la combinación Contrarreloj + Ritmo.
- El leaderboard preview se actualiza en tiempo real al cambiar cualquier opción (incluido BPM).
- El botón "Jugar" inicializa el `AudioContext` (obligatorio por política de navegador).

---

## Pantalla: GameScreen

### Layout

```
┌─ header ────────────────────────────────────────┐
│ 𝄞 Sol  4♯  +0 líneas          Nota 3 / 16       │  ← práctica
│ 𝄞 Sol  2♭  +1 líneas   23.4s      12 correctas  │  ← contrarreloj
└─────────────────────────────────────────────────┘
▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░ ← barra de progreso

┌────────── SVG 920×240 ──────────────────────────┐
│ 𝄞  ♯♯♯♯  ○ ♩ ♩ ●  ♩ ♩  ○  ♩ ♩ ♩  ♩ ♩ ○  ♩ ♩ │
│         ─────────────────────────────────────── │
│           ·   ─── ─── ─── ─── ─── ─── ─── ───  │
└─────────────────────────────────────────────────┘

        Identifica la nota activa (azul)

┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
│A │ │B │ │C │ │D │ │E │ │F │ │G │
│La│ │Si│ │Do│ │Re│ │Mi│ │Fa│ │Sol│
└──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘

        ✔ Correcto · +3,241 pts
        ✘ Era E (Mi)
```

### Estados visuales de las notas

| Estado | Color | Cuándo |
|---|---|---|
| `idle` | Crema oscuro (`#1e1e2e`) | Nota aún no alcanzada |
| `active` | Azul (`#60a5fa`) + anillo pulsante | Nota actual a identificar |
| `wrong` (flash) | Rojo (`#f87171`) | 350ms al pulsar tecla incorrecta |
| `correct` | Verde (`#4ade80`) | Nota ya superada correctamente |

### Barra de estado superior

- **Práctica + Velocidad**: indicador `Nota N / 16` a la derecha; barra de progreso azul.
- **Contrarreloj + Velocidad**: temporizador `XX.Xs` en centro (verde → amarillo → rojo); contador de aciertos a la derecha; barra que refleja el tiempo restante.
- **Práctica + Ritmo**: BPM centrado `♩ = 120`; indicador de notas a la derecha; barra de progreso azul.
- **Contrarreloj + Ritmo**: timer a la izquierda + BPM en centro `♩ = 120`; aciertos a la derecha. El BPM hace flash amarillo durante 1 beat cuando sube.

### Beat progress bar (solo Enfoque Ritmo)

Una barra fina (2–3 px) en color ámbar, separada de la barra de progreso principal, que se rellena suavemente de izquierda a derecha dentro de cada ventana de beat usando `requestAnimationFrame`. Se reinicia en cada pulso. Sirve como guía visual del tempo — el jugador anticipa el beat antes de que llegue.

```
[████████████░░░░░░░░░░░░]  ← avanza, se reinicia cada beat
```

### Feedback en Enfoque Ritmo

Se añade la calificación de sincronización a la línea de feedback:
```
✔ Correcto · +2,847 pts · 🎯 Perfecto    (timingAccuracy > 0.85)
✔ Correcto · +1,923 pts · 👍 Bien         (0.50 – 0.85)
✔ Correcto · +891 pts  · ⏰ Tarde         (< 0.50)
✘ Miss — Era E (Mi)                       (beat avanzó sin respuesta correcta)
```

En Contrarreloj + Ritmo, en lugar de `+3,241 pts` se muestra el bono de tiempo: `+2.7s`.

### Input

- **Teclado físico**: teclas A-G capturadas globalmente (sin necesidad de focus); se ignoran repeticiones de tecla mantenida.
- **Botones virtuales**: fila fija al final de la pantalla; `onClick` llama al mismo handler.
- **Velocidad**: la tecla de acierto avanza la nota; los errores restan puntos pero no avanzan.
- **Ritmo**: la tecla de acierto registra el intento pero **no avanza la nota** — el beat lo hace. Los errores dentro de la ventana no penalizan y se puede reintentar hasta el siguiente beat.

---

## Pantalla: ResultScreen

### Layout

```
┌────────────── SVG 920×240 (ancho completo, max-w-5xl) ───────────────┐
│  RESUMEN DE NOTAS                                                     │
│  𝄞  ♯♯♯  ● ● ○ ● ● ○ ● ● ● ● ● ○ ● ● ● ●                           │
│        ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── │
│  (verde = acertada, rojo = fallada)                                   │
└───────────────────────────────────────────────────────────────────────┘
       (en contrarreloj: un pentagrama adicional por cada 16 notas)

        🎯   (o ⏱ en contrarreloj / 🎵 en ritmo)
    Ronda completada
    𝄞 Sol · Básico   (en ritmo: + "· ♩ = 120 → 150")

        -1,060,738    puntos
    ┌──────┐ ┌──────┐ ┌──────┐
    │  16  │ │  45  │ │ 0.2s │
    │Correct│ │Errores│ │T/nota│
    └──────┘ └──────┘ └──────┘

  (en Enfoque Ritmo: 4 stats, añade precisión)
    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
    │  38  │ │  10  │ │ 0.4s │ │  87% │
    │Aciert│ │Misses│ │T/nota│ │Precis│
    └──────┘ └──────┘ └──────┘ └──────┘
    Tempo máximo: 150 BPM

  ┌── Nuevo récord ────────────────┐
  │ 🏆 ¡Nuevo récord!              │
  │ 12,450 pts — ingresa tu nombre │
  │ [____________] [ Guardar ]     │
  └────────────────────────────────┘

  TOP 5 — PRÁCTICA                     (Velocidad)
  TOP 5 — CONTRARRELOJ · RITMO · ♩=120 (Ritmo, incluye BPM inicial)
  #  Nombre    Puntos     Dificultad  Fecha
  1  Fercho   12,450     +0 líneas   5/6/2026   ← resaltado en amarillo

  [ ▶ Jugar de nuevo ]   [ ← Menú ]
```

### Resumen de notas (pentagrama post-ronda)

- El pentagrama aparece **encima** del score y las estadísticas, a ancho completo (`max-w-5xl`), igual que durante el juego.
- Cada nota se muestra con su posición real en el pentagrama (misma clave, armadura y dificultad de la ronda).
- **Verde** (`correct`) = respondida correctamente. **Rojo** (`wrong`) = respondida incorrectamente (o miss en modo ritmo).
- En **práctica** (16 notas fijas): un solo pentagrama.
- En **contrarreloj** (secuencias ilimitadas): un pentagrama por cada bloque de 16 notas respondidas, apilados verticalmente.
- No se muestra el indicador azul de posición activa ni el anillo pulsante.

### Variaciones en Enfoque Ritmo

- **Emoji**: 🎵 en lugar de 🎯 / ⏱
- **Subtítulo**: `𝄞 Sol · Básico · ♩ = 120 → 150` (rango BPM recorrido)
- **Stats**: 4 cards — Aciertos | Misses | T/nota | Precisión rítmica %
- **Tempo máximo**: línea adicional debajo de los stats mostrando el BPM más alto alcanzado
- **Título leaderboard**: incluye BPM inicial — `TOP 5 — PRÁCTICA · RITMO · ♩ = 120`

### Detalles

- El formulario de nombre solo aparece si `score > 0` y el score entra en el Top 5.
- La entrada nueva en la tabla se resalta en amarillo dorado.
- `Enter` en el input de nombre equivale a "Guardar".
- `Jugar de nuevo` inicia una ronda nueva con la misma configuración (no vuelve al menú).

---

## Tema visual

### Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| Fondo página | `#0f0f1a` | Background general |
| Fondo carta | `#111827` (`gray-900`) | Tarjetas, paneles |
| Borde carta | `#1f2937` (`gray-800`) | Bordes sutiles |
| Fondo SVG | `#1a1625` | Interior del pentagrama |
| Líneas staff | `#d4c9a8` | 5 líneas y ledger lines |
| Clave / acord. | `#f0e8d0` | Símbolos musicales |
| Texto principal | `#f0f0f0` | Texto blanco suave |
| Texto secundario | `#9ca3af` (`gray-400`) | Labels y hints |
| Activo | `#3b82f6` (blue-500/600) | Selección, botón Jugar, nota activa |
| Dificultad | `#9333ea` (purple-600) | Selector de dificultad |
| Práctica | `#16a34a` (green-600) | Modo práctica |
| Contrarreloj | `#dc2626` (red-600) | Modo contrarreloj |
| Ritmo | `#ea580c` (orange-600) | Enfoque ritmo, beat progress bar, BPM display |
| Correcto | `#4ade80` (green-400) | Nota verde, feedback ok |
| Error | `#f87171` (red-400) | Nota roja, feedback error |
| Récord | `#d97706` (yellow-600) | Fila destacada en leaderboard |

### Tipografía

- UI: `system-ui, sans-serif` (herencia del OS).
- Símbolos musicales: `"Bravura", "Leland", "FreeSerif", serif` (SMuFL Unicode).
- Monoespaciado (puntuación, timer): `font-mono` de Tailwind.

### Jerarquía de elevación

1. Fondo de página — `#0f0f1a`
2. Cards/paneles — `#111827` con borde `#1f2937`
3. SVG pentagrama — `#1a1625` (ligeramente más claro que cards)
4. Botones activos — colores de acento con `shadow-lg` y `shadow-{color}/40`

---

## Responsive

| Breakpoint | Adaptación |
|---|---|
| `< sm` (< 640px) | Columnas Dificultad/Fecha del leaderboard ocultas (`hidden sm:table-cell`) |
| Móvil | Botones virtuales A-G como input principal; staff SVG escala con `width: 100%` |
| Desktop | Teclado físico; SVG con `maxWidth: 920px` |

El SVG usa `viewBox` fijo y `width="100%"` para escalar fluidamente en cualquier ancho de contenedor.

---

## Accesibilidad

- El SVG tiene `aria-label="Pentagrama musical"`.
- Los botones virtuales tienen texto visible (letra + solfeo).
- El input de nombre tiene `autoFocus` para facilitar la entrada inmediata.
- Los colores de estado (correcto/error) se acompañan de iconos (✔/✘) para no depender solo del color.

# Spec: Enfoque Ritmo — Metrónomo y sincronización temporal en PentaTrainer

## Problema que resuelve

El juego actual premia únicamente velocidad de reconocimiento: el jugador identifica notas lo más rápido posible sin ningún contexto temporal. Esto es útil, pero incompleto para un músico en formación: en la práctica real siempre se toca **a tempo**, con un pulso externo que impone una ventana de tiempo por nota.

El Enfoque Ritmo añade esa dimensión: un metrónomo dicta el pulso y el jugador debe identificar cada nota **dentro del beat**. Los puntos reflejan no solo si acertó la letra, sino qué tan sincronizado estuvo con el pulso.

---

## Diseño de alto nivel

### Dos dimensiones ortogonales

El menú pasa de un selector de modo (Práctica | Contrarreloj) a dos selectores independientes:

| | **Velocidad** | **Ritmo** |
|---|---|---|
| **Práctica** | Sin cambios | 16 notas, BPM fijo, score timing-weighted |
| **Contrarreloj** | Sin cambios | Timer + BPM acelera c/16 notas, bonus timing |

La dimensión **Enfoque = Velocidad** es idéntica al comportamiento actual — todo el código de ritmo queda inactivo.

### Cambio de mecánica central

| Aspecto | Velocidad | Ritmo |
|---|---|---|
| ¿Quién avanza la nota? | El jugador al acertar | El metrónomo en cada beat |
| Penalización por no responder | Solo puntos (práctica) | Miss automático: 0 pts |
| Velocidad relevante | Absoluta (ms desde que aparece) | Relativa al beat (ms desde el downbeat) |
| Progresión de dificultad | Fija por ronda | BPM sube +10 cada 16 notas (solo Contrarreloj) |

---

## Mecánica detallada

### Beat y ventana de nota

A cada beat del metrónomo corresponde exactamente una nota activa. La ventana de nota es el tiempo entre un beat y el siguiente:

```
beatWindowMs = 60000 / bpm

A 60 BPM  → 1000ms / nota
A 120 BPM →  500ms / nota
A 180 BPM →  333ms / nota
```

El jugador puede presionar la tecla correcta en cualquier momento dentro de la ventana. Si no lo hace antes del siguiente beat, la nota avanza como **miss** (0 puntos).

A diferencia del modo velocidad, presionar una tecla incorrecta **no penaliza puntos** — solo se registra como intento fallido. La nota no avanza hasta que el beat llega, independientemente de cuántos intentos haga el jugador.

### Cálculo de precisión rítmica

```
timingOffset    = |pressWallTime - beatWallTime|
timingAccuracy  = max(0, 1 − timingOffset / (beatWindowMs × 0.5))
```

`timingAccuracy` va de 1.0 (presionado exactamente en el beat) a 0.0 (presionado en el límite de la ventana o más tarde).

Zona de gracia: el primer 50% de la ventana devuelve `timingAccuracy = 1.0` (la tolerancia es generosa para que el juego sea jugable, no frustrante). Más allá del 50% decae linealmente.

### Scoring en Práctica + Ritmo

```
baseDelta  = (900 + 100 × difficulty) × (bpm / 60)
noteScore  = baseDelta × timingAccuracy   // solo si la tecla es correcta
finalScore = round(sum(noteScore))        // suma de todas las notas de la ronda
```

El multiplicador `bpm / 60` normaliza el score respecto al tempo: una nota a 120 BPM vale el doble que a 60 BPM porque el jugador tuvo la mitad de tiempo. Esto hace los leaderboards significativos — el BPM inicial es parte de la clave para que comparaciones sean justas.

Ejemplo a 120 BPM, difficulty 0, timing perfecto:
`baseDelta = 900 × 2 = 1800 pts/nota → 16 notas = 28,800 pts máximo`

### Scoring en Contrarreloj + Ritmo

- Score final = número de aciertos (mismo concepto que Contrarreloj + Velocidad)
- Bonus de tiempo por acierto: `bonusTime = timingAccuracy × 3s`
  - Perfecto (1.0) → +3s (igual que el bonus máximo actual)
  - Tardío (0.3) → +0.9s
  - Miss → 0s
- A mayor BPM, la ventana se contrae → menor bonus por nota → el tiempo se agota más rápido

### Aceleración BPM (solo Contrarreloj + Ritmo)

```
Trigger: cada 16 notas procesadas (con o sin acierto)
Efecto:  bpmActual += ritmoAccelStep (default 10)
Techo:   220 BPM (hardcoded)
Señal:   flash visual 1 beat + dos tonos ascendentes breves
```

Progresión ejemplo empezando en 120 BPM: 120 → 130 → 140 → 150 → … hasta 220.

La aceleración es imperceptible como cambio de intervalo (10 BPM de diferencia a 120 = 42ms más rápido por nota), pero se va acumulando. El jugador la siente como una presión creciente, no como saltos abruptos.

---

## Arquitectura técnica

### Nuevos campos en `GameSettings`

```typescript
rhythmMode: boolean;        // false = velocidad (sin cambios), true = ritmo
ritmoBpm: number;           // BPM inicial: 40–200, default 120 (= 500ms/nota)
ritmoAccelStep: number;     // BPM por bloque de 16 notas, default 10
```

`GameMode` no cambia (`'practice' | 'countdown'`). La dimensión ritmo es ortogonal.

### Nuevos campos en `GameState`

```typescript
ritmoBpmCurrent: number;         // BPM vivo (sube durante la partida en countdown)
ritmoBeatCount: number;          // beats disparados desde el inicio de la partida
ritmoScore: number;              // score acumulado (Práctica + Ritmo)
ritmoBpmJustIncreased: boolean;  // true durante un beat tras la subida → flash UI
```

### Campo adicional en `AnsweredNote`

```typescript
timingAccuracy: number | null;   // 0.0–1.0 en ritmo, null en velocidad
missed: boolean;                 // true = el beat avanzó sin respuesta correcta
```

### Nuevas acciones del reducer

```
BEAT { beatAudioTime, beatWallTime }
  → Si nota ya respondida correctamente: avanza currentIndex
  → Si no: registra miss, avanza currentIndex
  → Actualiza noteStartTime = beatWallTime
  → Limpia ritmoBpmJustIncreased

BPM_INCREASE
  → ritmoBpmCurrent += ritmoAccelStep
  → ritmoBpmJustIncreased = true
```

`KEY_PRESSED` en modo ritmo: registra el intento con `timingAccuracy` calculada, **no avanza el índice** (eso lo hace solo `BEAT`). Reproduce audio de feedback igual que hoy.

### Hook `useMetronome.ts` — patrón lookahead

El metrónomo usa el patrón estándar de Web Audio: programar clicks con antelación en `AudioContext.currentTime` y revisar la cola cada 25ms. Esto da precisión de ±3ms, mucho mejor que el `setInterval(100ms)` actual.

```
SCHEDULE_AHEAD_S = 0.1s    ← pre-programar hasta 100ms en el futuro
SCHEDULER_INTERVAL = 25ms  ← frecuencia de la revisión JS

tick():
  while nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S:
    scheduleMetronomeClick(nextBeatTime, isDownbeat)
    onBeat(nextBeatTime, wallClockEquivalent, beatIndex)
    if beatIndex % 16 === 0 and beatIndex > 0:
      onBpmIncrease()
    nextBeatTime += 60 / bpmRef.current
    beatIndex++
```

El `bpmRef` se mantiene sincronizado con `ritmoBpmCurrent` vía `useEffect`. Cuando sube el BPM, el próximo ciclo del tick aplica el nuevo intervalo sin reiniciar el metrónomo — no hay glitch de audio.

Conversión AudioContext → wall-clock (necesaria para comparar con `performance.now()` en `KEY_PRESSED`):
```
wallOffset = performance.now() - ctx.currentTime × 1000
beatWallTime = beatAudioTime × 1000 + wallOffset
```

### Cambios en `audio.ts`

- Exportar `getAudioContext()` (actualmente privado)
- `scheduleMetronomeClick(atTime, isDownbeat)`: ruido blanco 40ms, ganancia 0.45 (downbeat) / 0.22 (offbeat)
- `playBpmIncrease()`: dos tonos triángulo 880 Hz → 1108 Hz, 80ms cada uno

### Compatibilidad de leaderboard

Los modos de velocidad no cambian su formato de clave — cero migración:
```
Velocidad:  rmusic_lb_{mode}_{clef}_{keySig}_{difficulty}
Ritmo:      rmusic_lb_{mode}_rhythm_{clef}_{keySig}_{difficulty}_{bpm}bpm
```

Ejemplo: `rmusic_lb_countdown_rhythm_treble_sharp3_1_120bpm`

### Nuevas constantes

```typescript
RITMO_BPM_DEFAULT       = 120   // 500ms por nota, 2 beats/s
RITMO_BPM_MIN           = 40
RITMO_BPM_MAX           = 200   // máximo configurable en menú
RITMO_BPM_MAX_GAMEPLAY  = 220   // techo durante aceleración
RITMO_BPM_STEP          = 10
RITMO_ACCEL_STEP_DEFAULT = 10
```

---

## UX

### Menú principal

La sección "MODO DE JUEGO" se divide en dos secciones:

```
TIPO DE JUEGO
[ 🎯 Práctica ]    [ ⏱ Contrarreloj ]
    verde               rojo

ENFOQUE
[ ⚡ Velocidad ]   [ 🎵 Ritmo ]
    azul               naranja

(si Ritmo activo:)
BPM INICIAL — ♩ = 120
[──────────────●────────] 40 ─────── 200

(si Contrarreloj + Ritmo:)
  Acelera +10 BPM cada 16 notas
```

### GameScreen (modo ritmo)

**Header:** BPM centrado donde iría el timer (en countdown también se ve el timer a la izquierda del BPM).

**Beat progress bar:** Barra ámbar (2-3px) debajo del header que se rellena suavemente de izquierda a derecha dentro de cada ventana de beat usando `requestAnimationFrame`. Se reinicia en cada beat.

**Feedback:** La línea de feedback añade la calificación rítmica:
```
✔ Correcto · +2,847 pts · 🎯 Perfecto   (timingAccuracy > 0.85)
✔ Correcto · +1,923 pts · 👍 Bien        (0.50 – 0.85)
✔ Correcto · +891 pts  · ⏰ Tarde        (< 0.50)
✘ Miss — Era E (Mi)                      (beat llegó sin respuesta)
```

**Subida de BPM:** flash amarillo de 1 beat en el display de BPM + nota "♩ = 130" reemplaza al valor anterior.

### ResultScreen (modo ritmo)

```
🎵 Ritmo completado
𝄞 Sol · Básico · ♩ = 120 → 150

    47,320    puntos rítmicos

┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│  38  │  │  10  │  │ 0.4s │  │  87% │
│Aciert│  │Misses│  │T/nota│  │Precisión│
└──────┘  └──────┘  └──────┘  └──────┘

  Tempo máximo alcanzado: 150 BPM

TOP 5 — CONTRARRELOJ · RITMO · ♩ = 120
```

El subtítulo muestra el rango BPM recorrido. Se añade el stat "Precisión rítmica" como 4.º card.

---

## Preguntas abiertas

1. **¿Zona de gracia extendida?** El 50% del beat window como umbral de "timing perfecto" puede ajustarse. Con 120 BPM, 250ms de gracia parece razonable. ¿Reducirlo a 30% para jugadores avanzados?

2. **¿Feedback sonoro de miss?** Actualmente `playWrong()` suena en respuesta incorrecta. ¿Debería sonar también en miss automático? Podría ser un sonido distinto (más suave, como un clic seco).

3. **¿Contrarreloj + Ritmo sin Práctica + Ritmo primero?** Se podría lanzar Práctica + Ritmo primero para que los jugadores aprendan la mecánica, y añadir Contrarreloj + Ritmo después.

4. **¿Indicador visual del beat además de la barra?** Un punto pulsante en el header (como el anillo de la nota activa) podría ayudar en móvil donde la barra es muy delgada.

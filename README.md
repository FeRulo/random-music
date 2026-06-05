# random-music

Herramientas de entrenamiento musical para práctica de lectura de notas.

## Proyectos

### `penta-web/` — PentaTrainer (aplicación web)

Juego visual de lectura de notas en el pentagrama. React + SVG + TypeScript.

→ Ver [penta-web/README.md](penta-web/README.md) para instrucciones completas.

**Inicio rápido:**

```bash
cd penta-web
npm install
npm run dev
# Abrir http://localhost:5173
```

---

### `random-penta.py` — Juego de terminal (original)

Versión original del juego en línea de comandos. Renderiza el pentagrama en ASCII e identifica las notas mediante pulsaciones de teclado.

**Requisitos:** Python 3, `playsound`, `gi` (PyGObject)

```bash
pip install playsound

# Uso: python random-penta.py <espacios>
# <espacios> = número de líneas adicionales (0 = solo pentagrama)
python random-penta.py 0   # nivel básico
python random-penta.py 2   # nivel avanzado (+2 ledger lines)
```

Los récords se guardan en `random-penta.txt`.

---

### `random-notes.py` — Generador de notas aleatorias

Imprime N filas de 9 notas cromáticas aleatorias (incluyendo enarmónicos). Útil para ejercicios de dictado o improvisación.

```bash
# Uso: python random-notes.py <N>
python random-notes.py 10   # imprime 10 filas de notas
```

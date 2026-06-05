# PentaTrainer

Juego web de entrenamiento en lectura musical. Muestra notas aleatoriamente en un pentagrama SVG y el jugador las identifica tecleando la letra correspondiente (A-G / La-Sol). Basado en el script de terminal `random-penta.py` del mismo repositorio.

## Características

- **Dos claves**: Sol (violín) y Fa (bajo)
- **Armadura seleccionable**: Do mayor, 1-6 sostenidos, 1-6 bemoles, o aleatoria
- **Dificultad por líneas adicionales**: 0 (solo pentagrama) hasta +3 (ledger lines arriba y abajo)
- **Modo Práctica**: 16 notas, puntuación basada en velocidad de respuesta
- **Modo Contrarreloj**: empieza con 30 s; cada acierto rápido añade tiempo al reloj
- **Leaderboard Top 5** persistido en `localStorage`, con entrada de nombre si hay récord
- **Botones virtuales** A-G para dispositivos táctiles
- **Audio** generado con Web Audio API (sin ficheros externos)

## Requisitos

- Node.js ≥ 18
- npm ≥ 9

## Instalación y ejecución

```bash
# 1. Entrar a la carpeta del proyecto web
cd penta-web

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

## Otros comandos

```bash
# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview

# Verificar tipos TypeScript
npx tsc --noEmit
```

## Cómo se juega

1. En el **menú**, selecciona clave, armadura, dificultad y modo.
2. Pulsa **Jugar**.
3. El pentagrama muestra 16 notas. La nota activa aparece resaltada en azul.
4. Pulsa la tecla correspondiente (**A B C D E F G**) en tu teclado, o usa los botones en pantalla.
   - Acierto → la nota se pone verde, avanza a la siguiente.
   - Error → la nota parpadea en rojo, se resta puntaje, se reintenta.
5. En **modo Contrarreloj**: responde rápido — cada acierto en menos de 3 s añade tiempo al reloj. El juego termina cuando el reloj llega a 0.
6. Al terminar la ronda verás tu puntuación, estadísticas y el Top 5. Si bates el récord se te pedirá tu nombre.

### Equivalencias de teclas

| Tecla | Nota (anglosajón) | Solfeo |
|-------|-------------------|--------|
| A | La | La |
| B | Si | Si |
| C | Do | Do |
| D | Re | Re |
| E | Mi | Mi |
| F | Fa | Fa |
| G | Sol | Sol |

## Documentación técnica

| Documento | Contenido |
|-----------|-----------|
| [docs/prd.md](docs/prd.md) | Requisitos del producto |
| [docs/architecture.md](docs/architecture.md) | Arquitectura técnica, algoritmos, coordenadas SVG |
| [docs/ux.md](docs/ux.md) | Flujo de pantallas, layouts, paleta de colores |

## Stack

- React 19 + TypeScript — Vite 8
- Tailwind CSS v4
- SVG declarativo (sin librería de canvas)
- Web Audio API
- `localStorage` (sin backend)

# PRD — PentaTrainer

## Problema

Los músicos en formación necesitan practicar la lectura de notas en el pentagrama de forma frecuente y entretenida. El script de terminal `random-penta.py` cubría esa necesidad para un usuario técnico (línea de comandos, solo clave de Fa, sin interfaz visual), pero era inaccesible para la mayoría.

## Objetivo

Crear una aplicación web que convierta el ejercicio de lectura musical en un juego visual atractivo, jugable desde cualquier dispositivo con teclado o pantalla táctil, sin necesidad de instalación.

---

## Usuarios objetivo

| Perfil | Descripción |
|---|---|
| Estudiante de música | Practica lectura de notas a diario, nivel básico a intermedio |
| Músico autodidacta | Quiere reforzar teoría sin profesor; necesita feedback inmediato |
| Profesor | Puede recomendar o proyectar el juego como ejercicio de clase |

---

## Requisitos funcionales

### RF-01 · Menú de configuración
- El jugador selecciona **clave** (Sol / Fa) antes de empezar.
- El jugador selecciona **armadura**: Do mayor (sin alteraciones), 1-6 sostenidos, 1-6 bemoles, o aleatoria.
- El jugador selecciona **dificultad** por número de líneas adicionales fuera del pentagrama (0, +1, +2, +3). Mayor dificultad = más notas posibles = más puntos por acierto.
- El jugador elige **modo de juego**: Práctica o Contrarreloj.

### RF-02 · Pentagrama visual (SVG)
- Se muestran las 16 notas de la ronda dispuestas horizontalmente sobre el pentagrama.
- La nota activa a identificar se resalta en azul con un anillo pulsante.
- Las notas ya respondidas correctamente aparecen en verde; las respondidas incorrectamente (en esa posición) no avanzan.
- Al teclear una nota incorrecta, la nota activa parpadea brevemente en rojo.
- El pentagrama muestra clave (Sol o Fa) y armadura seleccionada.
- Se dibujan líneas adicionales (ledger lines) para notas fuera del pentagrama.

### RF-03 · Entrada de notas
- El jugador identifica cada nota pulsando la tecla correspondiente: **A B C D E F G** (convención anglosajona: A=La, B=Si, C=Do, D=Re, E=Mi, F=Fa, G=Sol).
- Se provee una fila de botones virtuales A-G con nombre en solfeo para dispositivos táctiles.
- La tecla incorrecta no avanza la posición; se puede reintentar.

### RF-04 · Puntuación — Modo Práctica
- **Fórmula**: `delta = (900 + 100 × dificultad) / tiempo_respuesta_segundos`
- Acierto: `puntos += delta`
- Error: `puntos -= delta`
- Score final: `puntos_totales / (tiempo_total_segundos / 16)` (normalizado por ritmo)
- La ronda termina cuando se identifican correctamente las 16 notas.

### RF-05 · Puntuación — Modo Contrarreloj
- El reloj arranca en **30 segundos**.
- Cada acierto con respuesta < 3s añade `(3 - tiempo_respuesta)` segundos al reloj.
- El reloj baja de color verde → amarillo → rojo conforme se agota.
- El juego termina cuando el reloj llega a 0.
- Al completar un ciclo de 16 notas se genera automáticamente un nuevo ciclo sin interrumpir el contador.
- Score = número total de notas correctas respondidas.

### RF-06 · Feedback de audio
- Acierto: chime ascendente (Web Audio API, sin ficheros externos).
- Error: buzz grave.
- Fin de partida: secuencia descendente de tres notas.

### RF-07 · Leaderboard
- Top 5 por configuración específica (modo + clave + armadura + dificultad).
- Persistencia en servidor SQLite local (puerto 3001) con `localStorage` como caché y fallback.
- Al terminar una ronda con puntuación positiva que entre en el Top 5, se solicita el nombre del jugador.
- La entrada nueva se resalta en la tabla de resultados.
- El menú principal muestra el Top 5 de la configuración actualmente seleccionada.

### RF-08 · Resumen visual post-ronda
- Al terminar una ronda (práctica o contrarreloj), la pantalla de resultados muestra el pentagrama con todas las notas de la partida coloreadas: **verde** para las respondidas correctamente, **rojo** para las falladas.
- El pentagrama de resumen ocupa el ancho completo de la pantalla (igual que durante el juego) y aparece encima del score y las estadísticas.
- Se usa la misma clave, armadura y dificultad de la ronda jugada, de modo que el jugador pueda identificar visualmente los patrones o regiones del pentagrama donde cometió errores.
- En modo contrarreloj (donde la secuencia se regenera cada 16 notas), se muestra un pentagrama por cada bloque de 16 notas respondidas, apilados verticalmente.

---

## Requisitos no funcionales

| Atributo | Requisito |
|---|---|
| Sin instalación | Accesible desde un navegador moderno; no requiere backend ni cuenta |
| Responsive | Usable en móvil (botones virtuales) y escritorio (teclado físico) |
| Sin ficheros externos | Sonidos generados con Web Audio API; fuentes musicales cargadas por CDN |
| Rendimiento | Tiempo de carga < 1s en red local; SVG fluido sin jank |
| Datos | Leaderboard en SQLite local vía API REST; `localStorage` como fallback; cero llamadas de red durante el juego activo |

---

## Fuera de alcance (v1)

- Reproducción del sonido de la nota (ear training auditivo).
- Modo multijugador o ranking global.
- Soporte para claves distintas a Sol y Fa (Do, etc.).
- Alteraciones individuales en las notas (distintas de la armadura).
- Cifrado americano completo con octava (C4, D5…).
- Backend / cuentas de usuario.

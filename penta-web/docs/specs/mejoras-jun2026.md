# Mejoras — junio 2026

## 1. Pentagrama centrado

Las 16 notas se distribuyen centradas horizontalmente en el espacio disponible del pentagrama, calculando el padding izquierdo dinámicamente según el ancho ocupado por la clave y la armadura.

**Archivos:** `src/components/staff/StaffSVG.tsx`, `src/components/staff/staffConstants.ts`

## 2. Posicionamiento correcto de claves

- **Clave de Fa:** los dos puntos del glifo 𝄢 se centraron en los espacios que flanquean la 4ª línea (y=72 y y=96), en lugar de pegados a la línea.
- **Clave de Sol:** ajuste de `fontSize` (108→90) y `y` para que la espiral del glifo 𝄞 quede sobre la 2ª línea (G line, y≈132).

**Archivo:** `src/components/staff/ClefSymbol.tsx`

## 3. Sonido de nota al acertar

Al identificar correctamente una nota, se reproduce la frecuencia real de esa nota (tono de sinusoide pura, 0.5s). Se añadió `playNoteFrequency(staffIndex, espacios, clef)` con tablas de frecuencias precalculadas para clave de Sol y Fa, cubriendo el rango con espacios 0–3.

**Archivos:** `src/utils/audio.ts`, `src/hooks/useGameEngine.ts`

## 4. Clave de Fa por defecto

El menú principal arranca con la clave de Fa (bajo) seleccionada.

**Archivo:** `src/components/MainMenu.tsx`

## 5. Top 5 visible desde el inicio

La sección del leaderboard se muestra siempre en el menú principal, incluso cuando no hay récords registrados (muestra el mensaje "Sin récords todavía. ¡Sé el primero!").

**Archivo:** `src/components/MainMenu.tsx`

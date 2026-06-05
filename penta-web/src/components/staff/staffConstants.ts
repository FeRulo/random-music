export const STEP = 12;           // px per staff step (line or space)
export const LINE5_Y = 60;        // y of top staff line (line 5)
export const LINE1_Y = LINE5_Y + 8 * STEP; // y of bottom line (line 1) = 156
export const SVG_HEIGHT = 240;
export const SVG_WIDTH = 920;

// Note head
export const NOTE_RX = 8;
export const NOTE_RY = 6;
export const NOTE_ROTATION = -18; // degrees tilt
export const STEM_LENGTH = 40;    // px
export const LEDGER_HALF = 14;    // half-width of ledger lines

// X layout
export const CLEF_X = 28;
export const KEYSIG_START_X = 100;
export const KEYSIG_SPACING = 8;
export const NOTES_START_X = 160; // minimum x where notes begin (adjusted per key sig)
export const NOTE_SPACING = 46;   // px between notes

export const STAFF_X_START = 10;
export const STAFF_X_END = SVG_WIDTH - 10;

// noteY: converts a staffIndex (0=top) to SVG y coordinate
// espacios shifts the coordinate frame so the staff lines stay in the same position
export function noteY(staffIndex: number, espacios: number): number {
  return LINE5_Y + (staffIndex - espacios) * STEP;
}

// notesStartX: compute the x where notes begin after clef + key signature
export function notesStartX(keyCount: number): number {
  return Math.max(NOTES_START_X, KEYSIG_START_X + keyCount * KEYSIG_SPACING + 24);
}

import type { Clef } from '../../types';
import { LINE5_Y, LINE1_Y, STEP } from './staffConstants';

interface Props { clef: Clef }

export default function ClefSymbol({ clef }: Props) {
  if (clef === 'treble') {
    // Treble clef: 𝄞 — curl sits on G line (line 2 from bottom = y=132)
    return (
      <text
        x={22}
        y={LINE1_Y}
        fontSize={90}
        fontFamily='"Bravura", "Leland", "FreeSerif", serif'
        fill="#f0e8d0"
        style={{ userSelect: 'none' }}
      >
        𝄞
      </text>
    );
  }

  // Bass (F) clef: 𝄢 — reference line F at line 4 (y=84); dots straddle line 4
  const line4Y = LINE5_Y + 2 * STEP; // y=84
  return (
    <g>
      <text
        x={10}
        y={line4Y + 62}
        fontSize={100}
        fontFamily='"Bravura", "Leland", "FreeSerif", serif'
        fill="#f0e8d0"
        style={{ userSelect: 'none' }}
      >
        𝄢
      </text>
      {/* Dots centered in spaces flanking line 4: space 4-5 at y=72, space 3-4 at y=96 */}
      <circle cx={58} cy={line4Y - 12} r={3} fill="#f0e8d0" />
      <circle cx={58} cy={line4Y + 12} r={3} fill="#f0e8d0" />
    </g>
  );
}

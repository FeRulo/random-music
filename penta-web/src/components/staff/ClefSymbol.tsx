import type { Clef } from '../../types';
import { LINE5_Y, LINE1_Y, STEP } from './staffConstants';

interface Props { clef: Clef }

export default function ClefSymbol({ clef }: Props) {
  if (clef === 'treble') {
    // Treble clef: 𝄞 — large glyph, baseline at line 1, curls up past line 5
    return (
      <text
        x={22}
        y={LINE1_Y + 18}
        fontSize={108}
        fontFamily='"Bravura", "Leland", "FreeSerif", serif'
        fill="#f0e8d0"
        style={{ userSelect: 'none' }}
      >
        𝄞
      </text>
    );
  }

  // Bass (F) clef: 𝄢 — glyph sits with its reference line (F) at line 4 (y = LINE5_Y + 2*STEP)
  const line4Y = LINE5_Y + 2 * STEP;
  return (
    <g>
      <text
        x={14}
        y={line4Y + 14}
        fontSize={52}
        fontFamily='"Bravura", "Leland", "FreeSerif", serif'
        fill="#f0e8d0"
        style={{ userSelect: 'none' }}
      >
        𝄢
      </text>
      {/* Two dots for the F clef */}
      <circle cx={58} cy={line4Y - 4} r={3} fill="#f0e8d0" />
      <circle cx={58} cy={line4Y + 8} r={3} fill="#f0e8d0" />
    </g>
  );
}

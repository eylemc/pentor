import { cn } from '@/lib/cn';

interface SecurityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

function scoreColor(score: number) {
  if (score >= 80) return { ring: 'text-accent-400', text: 'text-accent-300', stroke: '#06d17f', label: 'Strong' };
  if (score >= 60) return { ring: 'text-warn-400', text: 'text-warn-400', stroke: '#ffb84d', label: 'Elevated' };
  return { ring: 'text-danger-400', text: 'text-danger-400', stroke: '#ff3b3b', label: 'At risk' };
}

export function SecurityScore({ score, size = 'md', label }: SecurityScoreProps) {
  const c = scoreColor(score);
  const dims = {
    sm: { box: 80, stroke: 6, font: 'text-xl' },
    md: { box: 120, stroke: 8, font: 'text-3xl' },
    lg: { box: 160, stroke: 10, font: 'text-4xl' },
  }[size];
  const radius = (dims.box - dims.stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dims.box, height: dims.box }}>
        <svg width={dims.box} height={dims.box} className="-rotate-90">
          <circle
            cx={dims.box / 2}
            cy={dims.box / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={dims.stroke}
          />
          <circle
            cx={dims.box / 2}
            cy={dims.box / 2}
            r={radius}
            fill="none"
            stroke={c.stroke}
            strokeWidth={dims.stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-700"
            style={{ filter: `drop-shadow(0 0 6px ${c.stroke}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', dims.font, c.text)}>{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      {(label || c.label) && (
        <span className={cn('mt-2 text-sm font-medium', c.text)}>{label ?? c.label}</span>
      )}
    </div>
  );
}

'use client';

type GraphEdgeProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight?: number;
  highlighted?: boolean;
};

export default function GraphEdge({ x1, y1, x2, y2, weight, highlighted }: GraphEdgeProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`transition-all ${highlighted ? 'stroke-purple-500 stroke-[3]' : 'stroke-slate-700 stroke-2'}`}
        style={highlighted ? { filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' } : {}}
      />
      {weight !== undefined && (
        <text
          x={midX}
          y={midY}
          className="fill-slate-400 text-xs font-mono font-bold"
          textAnchor="middle"
          dy="-5"
        >
          {weight}
        </text>
      )}
    </g>
  );
}

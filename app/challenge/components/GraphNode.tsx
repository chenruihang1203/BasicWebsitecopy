'use client';

type GraphNodeProps = {
  id: string;
  label: string;
  x: number;
  y: number;
  selected?: boolean;
  onClick?: () => void;
};

export default function GraphNode({ id, label, x, y, selected, onClick }: GraphNodeProps) {
  return (
    <div
      onClick={onClick}
      className={`absolute w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer transition-all border-2 font-mono
        ${selected
          ? 'bg-purple-600 text-white border-purple-400 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
          : 'bg-slate-900 text-purple-400 border-slate-700 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        }`}
      style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
    >
      {label}
    </div>
  );
}

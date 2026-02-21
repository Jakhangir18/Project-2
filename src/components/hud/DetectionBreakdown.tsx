import { useMemo } from 'react';
import type { Detection } from '@/utils/nms';

interface DetectionBreakdownProps {
  detections: Detection[];
}

function classColor(classIndex: number): string {
  return `hsl(${classIndex * 30}, 80%, 60%)`;
}

const DetectionBreakdown = ({ detections }: DetectionBreakdownProps) => {
  const breakdown = useMemo(() => {
    const map = new Map<string, { count: number; classIndex: number }>();
    for (const det of detections) {
      const entry = map.get(det.className);
      if (entry) {
        entry.count++;
      } else {
        map.set(det.className, { count: 1, classIndex: det.classIndex });
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  }, [detections]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-syne font-extrabold text-3xl leading-none text-foreground">
          {detections.length}
        </span>
        <span className="stats-text text-[9px] leading-tight">OBJECTS<br />DETECTED</span>
      </div>
      {breakdown.map(([name, { count, classIndex }]) => (
        <div key={name} className="flex items-center gap-2 text-[10px] tracking-wider">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: classColor(classIndex) }}
          />
          <span className="text-foreground/70">{name}</span>
          <span className="text-foreground/40">×{count}</span>
        </div>
      ))}
    </div>
  );
};

export default DetectionBreakdown;

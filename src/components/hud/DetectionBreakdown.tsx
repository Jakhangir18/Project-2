import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Detection } from '@/utils/nms';

interface DetectionBreakdownProps {
  detections: Detection[];
}

function classColor(classIndex: number): string {
  // Use a bright, saturated palette for dark mode visibility
  return `hsl(${classIndex * 45}, 90%, 65%)`;
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
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-background/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[160px] relative overflow-hidden group">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-colors duration-500" />

      <div className="flex items-center gap-3 mb-2">
        <span className="font-syne font-extrabold text-4xl leading-none text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
          {detections.length}
        </span>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.2em] text-white/50 font-medium pt-1">OBJECTS</span>
          <span className="text-[11px] tracking-[0.1em] text-white/90 font-bold">DETECTED</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 relative">
        <AnimatePresence mode="popLayout">
          {breakdown.map(([name, { count, classIndex }]) => {
            const color = classColor(classIndex);
            return (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between group/item"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}`
                    }}
                  />
                  <span className="text-xs font-medium text-white/70 group-hover/item:text-white transition-colors duration-300 capitalize drop-shadow-md">
                    {name}
                  </span>
                </div>
                <div className="flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-xs font-bold text-white bg-white/5 border border-white/10 group-hover/item:bg-white/10 transition-colors duration-300">
                  {count}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {breakdown.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[10px] text-white/30 italic mt-1 font-mono tracking-wider"
          >
            AWAITING TARGETS...
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DetectionBreakdown;

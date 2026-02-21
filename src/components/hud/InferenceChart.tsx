import { motion } from 'framer-motion';

interface InferenceChartProps {
  inferenceMs: number;
  history: number[];
}

const InferenceChart = ({ inferenceMs, history }: InferenceChartProps) => {
  const maxVal = Math.max(...history, 1, 100);

  const getColor = (val: number) => {
    if (val < 25) return 'hsl(140, 100%, 65%)'; // Fast - Green
    if (val < 50) return 'hsl(40, 100%, 55%)';  // Medium - Yellow
    return 'hsl(0, 100%, 65%)';                // Slow - Red
  };

  const currentColor = getColor(inferenceMs);

  return (
    <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-background/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-colors duration-500" />

      {/* Label */}
      <span className="text-[9px] tracking-[0.2em] text-white/50 mb-4 w-full text-center">INFERENCE SYS</span>

      {/* Dynamic Bars */}
      <div className="flex items-end justify-center gap-[4px] h-12 w-full mb-4">
        {history.map((val, i) => {
          const barColor = getColor(val);
          const isLast = i === history.length - 1;
          return (
            <motion.div
              key={i}
              className="w-[6px] rounded-full relative"
              initial={false}
              animate={{
                height: `${Math.max(4, (val / maxVal) * 44)}px`,
                backgroundColor: barColor,
                opacity: 0.3 + (i / history.length) * 0.7,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                boxShadow: isLast ? `0 0 12px ${barColor}` : 'none'
              }}
            >
              {isLast && (
                <motion.div
                  layoutId="indicator"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Current reading */}
      <div className="flex items-baseline gap-1.5 border-t border-white/5 pt-3 w-full justify-center">
        <span
          className="font-syne font-extrabold text-3xl leading-none tracking-tight transition-colors duration-300"
          style={{
            color: currentColor,
            textShadow: `0 0 20px ${currentColor}60`
          }}
        >
          {inferenceMs}
        </span>
        <span className="text-xs font-mono font-medium text-white/40">ms</span>
      </div>
    </div>
  );
};

export default InferenceChart;

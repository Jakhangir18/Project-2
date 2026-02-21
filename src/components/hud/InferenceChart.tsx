import { useRef, useEffect } from 'react';

interface InferenceChartProps {
  inferenceMs: number;
  history: number[];
}

const InferenceChart = ({ inferenceMs, history }: InferenceChartProps) => {
  const maxVal = Math.max(...history, 1);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-[2px] h-6">
        {history.map((val, i) => (
          <div
            key={i}
            className="w-[4px] rounded-t-sm transition-all duration-150"
            style={{
              height: `${Math.max(2, (val / maxVal) * 24)}px`,
              backgroundColor: val < 20 ? 'hsl(160, 100%, 50%)' : val < 40 ? 'hsl(40, 100%, 55%)' : 'hsl(0, 100%, 55%)',
              opacity: 0.5 + (i / history.length) * 0.5,
            }}
          />
        ))}
      </div>
      <span className="font-syne font-bold text-lg leading-none" style={{
        color: inferenceMs < 20 ? 'hsl(160, 100%, 50%)' : inferenceMs < 40 ? 'hsl(40, 100%, 55%)' : 'hsl(0, 100%, 55%)',
      }}>
        {inferenceMs}<span className="text-[10px] ml-0.5 font-mono font-normal opacity-50">ms</span>
      </span>
      <span className="stats-text text-[9px]">INFERENCE</span>
    </div>
  );
};

export default InferenceChart;

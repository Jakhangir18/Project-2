interface FpsDisplayProps {
  fps: number;
}

const FpsDisplay = ({ fps }: FpsDisplayProps) => {
  const color = fps > 45 ? 'hsl(160, 100%, 50%)' : fps >= 30 ? 'hsl(40, 100%, 55%)' : 'hsl(0, 80%, 55%)';

  return (
    <div className="flex flex-col items-end">
      <span className="font-syne font-extrabold text-5xl leading-none tabular-nums" style={{ color }}>
        {fps}
      </span>
      <span className="stats-text text-[9px] mt-0.5">FPS</span>
    </div>
  );
};

export default FpsDisplay;

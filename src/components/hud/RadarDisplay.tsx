import { useEffect, useRef } from 'react';
import type { Detection } from '@/utils/nms';

interface RadarDisplayProps {
  detections: Detection[];
  videoWidth: number;
  videoHeight: number;
}

const RadarDisplay = ({ detections, videoWidth, videoHeight }: RadarDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 120;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Rings
    ctx.strokeStyle = 'hsl(140, 100%, 45%, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.strokeStyle = 'hsl(140, 100%, 45%, 0.1)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    // Detection dots
    if (videoWidth > 0 && videoHeight > 0) {
      for (const det of detections) {
        const dotX = cx + ((((det.x1 + det.x2) / 2) / videoWidth) - 0.5) * r * 2 * 0.8;
        const dotY = cy + ((((det.y1 + det.y2) / 2) / videoHeight) - 0.5) * r * 2 * 0.8;
        const color = `hsl(${det.classIndex * 30}, 80%, 60%)`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = color.replace('60%)', '60%, 0.3)');
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Border
    ctx.strokeStyle = 'hsl(140, 100%, 45%, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [detections, videoWidth, videoHeight]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-[120px] h-[120px]" />
      {/* Sweep line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[112px] h-[112px] rounded-full animate-radar-sweep" style={{ transformOrigin: 'center center' }}>
          <div
            className="absolute top-1/2 left-1/2 h-[1px] origin-left"
            style={{
              width: '52px',
              background: 'linear-gradient(90deg, hsl(140, 100%, 45%, 0.8), transparent)',
            }}
          />
        </div>
      </div>
      <span className="block text-center mt-1 stats-text text-[9px]">RADAR</span>
    </div>
  );
};

export default RadarDisplay;

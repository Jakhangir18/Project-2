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
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // Background inner disk
    ctx.fillStyle = 'rgba(0, 20, 10, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Rings
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'; // Tailwind emerald-500
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hash marks on outer ring
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (r - 4), cy + Math.sin(angle) * (r - 4));
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    // Crosshairs
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
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

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner Glow
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Outer Glow
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Target Box
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;
        const bs = 5;
        ctx.strokeRect(dotX - bs, dotY - bs, bs * 2, bs * 2);
      }
    }

    // Outer Border
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Thicker chunks on outer border
    ctx.strokeStyle = 'rgba(16, 185, 129, 1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 8, Math.PI / 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI - Math.PI / 8, Math.PI + Math.PI / 8);
    ctx.stroke();

  }, [detections, videoWidth, videoHeight]);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-background/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-colors duration-500" />

      <div className="flex justify-between w-full mb-3 px-1 items-center">
        <span className="text-[8px] tracking-[0.2em] text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">S-RADAR</span>
        <div className="flex gap-1">
          <div className="w-1 h-2 bg-emerald-500/30 rounded-sm" />
          <div className="w-1 h-2 bg-emerald-500/60 rounded-sm" />
          <div className="w-1 h-2 bg-emerald-500 rounded-sm animate-pulse" />
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} className="w-[160px] h-[160px]" />

        {/* Sweep line wrapper */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[140px] h-[140px] rounded-full animate-radar-sweep" style={{ transformOrigin: 'center center' }}>
            {/* The sweeping line */}
            <div
              className="absolute top-1/2 left-1/2 h-[2px] origin-left"
              style={{
                width: '70px',
                background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.9))',
                boxShadow: '0 0 12px rgba(16, 185, 129, 1)',
                marginTop: '-1px'
              }}
            />
            {/* Sector sweep glow */}
            <div
              className="absolute top-1/2 left-1/2 origin-bottom-left"
              style={{
                width: '70px',
                height: '70px',
                background: 'conic-gradient(from 90deg at bottom left, rgba(16, 185, 129, 0.15) 0deg, transparent 50deg)',
                transform: 'rotate(-90deg)',
                marginTop: '-70px'
              }}
            />
          </div>
        </div>

        {/* Decorative corner brackets - outside the canvas */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-500/60 rounded-tl" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-500/60 rounded-tr" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-500/60 rounded-bl" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-500/60 rounded-br" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
        <span className="stats-text text-[9px] text-emerald-400 font-bold m-0 pl-1 tracking-widest leading-none">SCANNING</span>
      </div>
    </div>
  );
};

export default RadarDisplay;

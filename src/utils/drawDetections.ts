import type { Detection } from './nms';

function classColor(classIndex: number): string {
  return `hsl(${classIndex * 30}, 80%, 60%)`;
}

const CORNER_LEN = 12;
const LINE_WIDTH = 2;

interface FlashEntry {
  detection: Detection;
  startTime: number;
}

let prevClassNames = new Set<string>();
let flashEntries: FlashEntry[] = [];

export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  width: number,
  height: number
) {
  const now = performance.now();
  ctx.clearRect(0, 0, width, height);

  // Track new objects for flash effect
  const currentClassNames = new Set(detections.map(d => d.className));
  for (const det of detections) {
    if (!prevClassNames.has(det.className)) {
      flashEntries.push({ detection: det, startTime: now });
    }
  }
  prevClassNames = currentClassNames;
  flashEntries = flashEntries.filter(f => now - f.startTime < 800);

  for (const det of detections) {
    const color = classColor(det.classIndex);
    const { x1, y1, x2, y2 } = det;
    const boxW = x2 - x1;
    const boxH = y2 - y1;

    ctx.strokeStyle = color;
    ctx.lineWidth = LINE_WIDTH;

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x1, y1 + CORNER_LEN);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 + CORNER_LEN, y1);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x2 - CORNER_LEN, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y1 + CORNER_LEN);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x1, y2 - CORNER_LEN);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x1 + CORNER_LEN, y2);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x2 - CORNER_LEN, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 - CORNER_LEN);
    ctx.stroke();

    // Scanning line animation (sweeps top to bottom, 1.5s loop)
    const scanProgress = ((now % 1500) / 1500);
    const scanY = y1 + scanProgress * boxH;
    ctx.strokeStyle = color.replace('60%)', '60%, 0.4)');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1 + 2, scanY);
    ctx.lineTo(x2 - 2, scanY);
    ctx.stroke();

    // Label pill with accent bar
    const label = `${det.className} ${Math.round(det.score * 100)}%`;
    ctx.font = '11px "DM Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pillW = textWidth + 24;
    const pillH = 20;
    const pillX = x1;
    const pillY = y1 - pillH - 4;

    // Pill background
    ctx.fillStyle = 'rgba(2, 4, 8, 0.85)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 4);
    ctx.fill();

    // Accent bar (left edge)
    ctx.fillStyle = color;
    ctx.fillRect(pillX, pillY, 3, pillH);

    // Class dot
    ctx.beginPath();
    ctx.arc(pillX + 12, pillY + pillH / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Label text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(label, pillX + 20, pillY + 14);
  }

  // Flash effects for new objects
  for (const flash of flashEntries) {
    const elapsed = now - flash.startTime;
    const det = flash.detection;

    // White flash border (200ms)
    if (elapsed < 200) {
      const alpha = 1 - elapsed / 200;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(det.x1, det.y1, det.x2 - det.x1, det.y2 - det.y1);
    }

    // +1 floating text (800ms)
    if (elapsed < 800) {
      const alpha = 1 - elapsed / 800;
      const floatY = det.y1 - 10 - (elapsed / 800) * 30;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = 'bold 14px "Syne", sans-serif';
      ctx.fillText('+1', (det.x1 + det.x2) / 2 - 8, floatY);
    }
  }
}

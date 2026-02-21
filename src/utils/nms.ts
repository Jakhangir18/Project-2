export interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
  classIndex: number;
  className: string;
}

function iou(a: Detection, b: Detection): number {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter);
}

export function nms(detections: Detection[], iouThreshold = 0.45): Detection[] {
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];

  for (const det of sorted) {
    let dominated = false;
    for (const k of kept) {
      if (k.classIndex === det.classIndex && iou(k, det) > iouThreshold) {
        dominated = true;
        break;
      }
    }
    if (!dominated) kept.push(det);
  }

  return kept;
}

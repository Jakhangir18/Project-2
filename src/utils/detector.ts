import * as ort from 'onnxruntime-web';
import { COCO_CLASSES } from './cocoClasses';
import { nms, type Detection } from './nms';

// Use wasm backend
ort.env.wasm.numThreads = 1;

let session: ort.InferenceSession | null = null;

export async function loadModel(
  onProgress?: (pct: number) => void
): Promise<void> {
  if (session) return;

  onProgress?.(10);

  // Fetch model with progress tracking
  const response = await fetch('/yolov8n.onnx');
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  let loaded = 0;
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (total > 0) {
        onProgress?.(Math.round((loaded / total) * 80) + 10);
      }
    }
  }

  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  onProgress?.(90);
  session = await ort.InferenceSession.create(buffer.buffer, {
    executionProviders: ['wasm'],
  });
  onProgress?.(100);
}

export function preprocess(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ort.Tensor {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Create a temporary canvas for resizing
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 640;
  tmpCanvas.height = 640;
  const tmpCtx = tmpCanvas.getContext('2d')!;

  // Draw resized
  const srcCanvas = ctx.canvas;
  tmpCtx.drawImage(srcCanvas, 0, 0, 640, 640);
  const resized = tmpCtx.getImageData(0, 0, 640, 640).data;

  // CHW format, normalized 0-1
  const float32 = new Float32Array(3 * 640 * 640);
  for (let i = 0; i < 640 * 640; i++) {
    float32[i] = resized[i * 4] / 255;                    // R
    float32[640 * 640 + i] = resized[i * 4 + 1] / 255;    // G
    float32[2 * 640 * 640 + i] = resized[i * 4 + 2] / 255; // B
  }

  return new ort.Tensor('float32', float32, [1, 3, 640, 640]);
}

export async function detect(
  tensor: ort.Tensor,
  videoWidth: number,
  videoHeight: number,
  confThreshold = 0.5
): Promise<{ detections: Detection[]; inferenceMs: number }> {
  if (!session) throw new Error('Model not loaded');

  const start = performance.now();
  const results = await session.run({ images: tensor });
  const inferenceMs = performance.now() - start;

  // Output shape: [1, 84, 8400]
  const output = results[Object.keys(results)[0]];
  const data = output.data as Float32Array;
  const numDetections = 8400;

  const detections: Detection[] = [];
  const scaleX = videoWidth / 640;
  const scaleY = videoHeight / 640;

  for (let i = 0; i < numDetections; i++) {
    // Find best class
    let maxScore = 0;
    let maxClass = 0;
    for (let c = 0; c < 80; c++) {
      const score = data[(4 + c) * numDetections + i];
      if (score > maxScore) {
        maxScore = score;
        maxClass = c;
      }
    }

    if (maxScore < confThreshold) continue;

    // cx, cy, w, h
    const cx = data[0 * numDetections + i];
    const cy = data[1 * numDetections + i];
    const w = data[2 * numDetections + i];
    const h = data[3 * numDetections + i];

    detections.push({
      x1: (cx - w / 2) * scaleX,
      y1: (cy - h / 2) * scaleY,
      x2: (cx + w / 2) * scaleX,
      y2: (cy + h / 2) * scaleY,
      score: maxScore,
      classIndex: maxClass,
      className: COCO_CLASSES[maxClass],
    });
  }

  return { detections: nms(detections), inferenceMs };
}

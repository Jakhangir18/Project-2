import { useRef, useState, useCallback, useEffect } from 'react';
import { loadModel, preprocess, detect } from '../utils/detector';
import { drawDetections } from '../utils/drawDetections';
import type { Detection } from '../utils/nms';
import FpsDisplay from '@/components/hud/FpsDisplay';
import DetectionBreakdown from '@/components/hud/DetectionBreakdown';
import RadarDisplay from '@/components/hud/RadarDisplay';
import InferenceChart from '@/components/hud/InferenceChart';
import StartupSequence from '@/components/hud/StartupSequence';

type AppState = 'idle' | 'loading' | 'startup' | 'running';

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [state, setState] = useState<AppState>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [fps, setFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [inferenceHistory, setInferenceHistory] = useState<number[]>([]);

  const fpsFrames = useRef<number[]>([]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setState('idle');
    setFps(0);
    setInferenceMs(0);
    setDetections([]);
    setInferenceHistory([]);
  }, []);

  const runDetectionLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;
    if (!video || !canvas || !offscreen || video.paused || video.ended) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;
    offscreen.width = vw;
    offscreen.height = vh;

    const offCtx = offscreen.getContext('2d')!;
    const drawCtx = canvas.getContext('2d')!;

    const loop = async () => {
      if (!streamRef.current) return;

      const frameStart = performance.now();
      offCtx.drawImage(video, 0, 0, vw, vh);

      try {
        const tensor = preprocess(offCtx, vw, vh);
        const result = await detect(tensor, vw, vh);
        drawDetections(drawCtx, result.detections, vw, vh);
        setInferenceMs(Math.round(result.inferenceMs));
        setDetections(result.detections);
        setInferenceHistory(prev => {
          const next = [...prev, Math.round(result.inferenceMs)];
          return next.slice(-10);
        });
      } catch (e) {
        console.error('Detection error:', e);
      }

      const frameTime = performance.now() - frameStart;
      fpsFrames.current.push(frameTime);
      if (fpsFrames.current.length > 30) fpsFrames.current.shift();
      const avgFrame = fpsFrames.current.reduce((a, b) => a + b, 0) / fpsFrames.current.length;
      setFps(Math.round(1000 / avgFrame));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(async () => {
    setState('loading');
    try {
      await loadModel((pct) => setLoadProgress(pct));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      setState('startup');
    } catch (e) {
      console.error('Start error:', e);
      setState('idle');
    }
  }, []);

  const onStartupComplete = useCallback(() => {
    setState('running');
    runDetectionLoop();
  }, [runDetectionLoop]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const videoWidth = videoRef.current?.videoWidth || 0;
  const videoHeight = videoRef.current?.videoHeight || 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono relative hud-perspective-grid hud-grid-bg overflow-hidden">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg">👁</span>
          <span className="text-foreground font-medium tracking-[0.2em] text-sm uppercase">SeeAI</span>
          {state === 'running' && (
            <span className="w-2 h-2 rounded-full bg-primary pulse-dot ml-2" />
          )}
        </div>
        <div className="flex items-center gap-4">
          {state === 'running' && (
            <>
              <FpsDisplay fps={fps} />
              <button
                onClick={stop}
                className="text-xs px-3 py-1.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors border border-destructive/20 tracking-wider uppercase"
              >
                Stop
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        {state === 'idle' && (
          <button
            onClick={start}
            className="animate-fade-in group flex items-center gap-3 px-8 py-4 rounded-lg bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 transition-all duration-300"
          >
            <span className="text-foreground text-sm tracking-wider uppercase">Start Detection</span>
            <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
          </button>
        )}

        {state === 'loading' && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin-slow" />
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Loading AI model (6MB)...</p>
            <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <span className="text-primary text-xs font-syne font-bold">{loadProgress}%</span>
          </div>
        )}

        {state === 'startup' && (
          <div className="animate-fade-in">
            <StartupSequence loadProgress={loadProgress} onComplete={onStartupComplete} />
          </div>
        )}

        {(state === 'running' || state === 'startup') && (
          <div className="flex gap-6 items-start max-w-4xl w-full">
            {state === 'running' && (
              <div className="hidden lg:flex flex-col gap-4 animate-fade-in min-w-[140px]">
                <DetectionBreakdown detections={detections} />
              </div>
            )}
            {state === 'running' && (
              <div className="hidden lg:flex flex-col gap-4 items-center animate-fade-in min-w-[130px]">
                <InferenceChart inferenceMs={inferenceMs} history={inferenceHistory} />
                <RadarDisplay detections={detections} videoWidth={videoWidth} videoHeight={videoHeight} />
              </div>
            )}
          </div>
        )}

        {/* Video always in DOM so ref is available */}
        <div
          className={`video-frame hud-glow relative w-full max-w-2xl ${
            state === 'running' ? 'animate-fade-in' :
            state === 'startup' ? 'opacity-0' : 'hidden'
          }`}
        >
          <video ref={videoRef} className="w-full block rounded-lg" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        </div>
      </main>

      {/* Offscreen canvas for preprocessing */}
      <canvas ref={offscreenRef} className="hidden" />

      {/* Bottom stats bar */}
      {state === 'running' && (
        <footer className="flex items-center justify-center gap-8 px-6 py-3 border-t border-border animate-fade-in relative z-10">
          {/* Mobile detection count */}
          <span className="stats-text lg:hidden">Objects: {detections.length}</span>
          <span className="stats-text">Inference: {inferenceMs}ms</span>
          <span className="stats-text">Model: YOLOv8n</span>
          <span className="stats-text hidden sm:inline">Backend: WASM</span>
        </footer>
      )}
    </div>
  );
};

export default Index;

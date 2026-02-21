import { useRef, useState, useCallback, useEffect } from 'react';
import { loadModel, preprocess, detect } from '../utils/detector';
import { drawDetections } from '../utils/drawDetections';
import type { Detection } from '../utils/nms';
import FpsDisplay from '@/components/hud/FpsDisplay';
import DetectionBreakdown from '@/components/hud/DetectionBreakdown';
import RadarDisplay from '@/components/hud/RadarDisplay';
import InferenceChart from '@/components/hud/InferenceChart';
import StartupSequence from '@/components/hud/StartupSequence';
import SystemMetrics from '@/components/hud/SystemMetrics';
import EventLog from '@/components/hud/EventLog';
import { WebGLShader } from '@/components/ui/web-gl-shader';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

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
    <div className={`min-h-screen text-foreground flex flex-col font-mono relative hud-perspective-grid hud-grid-bg overflow-hidden ${state === 'idle' ? 'bg-transparent' : 'bg-background'}`}>
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
      <main className={`flex-1 flex p-6 relative z-10 w-full max-w-[1920px] mx-auto overflow-hidden ${state === 'idle' ? 'items-center justify-center' : 'items-stretch gap-8'}`}>
        {state === 'idle' && (
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden animate-fade-in w-full h-full">
            <WebGLShader />
            <div className="relative border border-white/10 bg-background/20 backdrop-blur-sm p-2 w-full mx-auto max-w-3xl rounded-xl">
              <div className="relative border border-white/10 py-16 overflow-hidden rounded-lg">
                <h1 className="mb-3 text-white text-center text-6xl font-extrabold tracking-tighter md:text-[clamp(2rem,8vw,5rem)] font-syne uppercase">
                  SeeAI Vision
                </h1>
                <p className="text-white/60 px-6 text-center text-xs md:text-sm lg:text-lg mb-8 max-w-xl mx-auto">
                  Initializing neural network protocols for real-time objective tracking and environmental analysis. Standby for link start.
                </p>
                <div className="my-8 flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  <p className="text-xs text-primary uppercase tracking-wider font-bold">System Online & Ready</p>
                </div>

                <div className="flex justify-center mt-8">
                  <LiquidButton
                    className="text-white border-white/20 rounded-full bg-white/5 hover:bg-white/10 px-12 uppercase tracking-widest text-xs font-bold"
                    size={'xl'}
                    onClick={start}
                  >
                    Initiate Link
                  </LiquidButton>
                </div>
              </div>
            </div>
          </div>
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
          <div className="flex gap-6 items-start shrink-0">
            {state === 'running' && (
              <div className="hidden lg:flex flex-col gap-4 animate-fade-in w-[240px]">
                <DetectionBreakdown detections={detections} />
                <SystemMetrics videoWidth={videoWidth} videoHeight={videoHeight} fps={fps} />
                <EventLog detections={detections} />
              </div>
            )}
            {state === 'running' && (
              <div className="hidden lg:flex flex-col gap-4 items-center animate-fade-in w-[180px]">
                <InferenceChart inferenceMs={inferenceMs} history={inferenceHistory} />
                <RadarDisplay detections={detections} videoWidth={videoWidth} videoHeight={videoHeight} />
              </div>
            )}
          </div>
        )}

        {/* Video always in DOM so ref is available */}
        <div
          className={`video-frame hud-glow relative flex-1 h-full min-h-[500px] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-sm ${state === 'running' ? 'animate-fade-in flex items-center justify-center' :
            state === 'startup' ? 'opacity-0' : 'hidden'
            }`}
        >
          <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
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

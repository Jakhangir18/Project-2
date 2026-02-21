import { useState, useEffect } from 'react';

interface StartupSequenceProps {
  loadProgress: number;
  onComplete: () => void;
}

const LINES = [
  { text: 'INITIALIZING NEURAL ENGINE...', delay: 0 },
  { text: 'LOADING YOLOV8n WEIGHTS', delay: 400, progress: true },
  { text: 'CALIBRATING DETECTION THRESHOLD...', delay: 800 },
  { text: 'SYSTEM READY', delay: 1200, ready: true },
];

const StartupSequence = ({ loadProgress, onComplete }: StartupSequenceProps) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (loadProgress >= 100 && visibleLines >= LINES.length) {
      const t = setTimeout(() => {
        setFadingOut(true);
        setTimeout(onComplete, 600);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [loadProgress, visibleLines, onComplete]);

  const progressBarWidth = Math.min(loadProgress, 100);
  const blocks = Math.floor(progressBarWidth / 5);
  const progressBar = '█'.repeat(blocks) + '░'.repeat(20 - blocks);

  return (
    <div className={`flex flex-col gap-3 max-w-lg transition-opacity duration-500 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}>
      {LINES.slice(0, visibleLines).map((line, i) => (
        <div key={i} className="animate-fade-in flex items-center gap-2">
          <span className="text-primary text-xs">▸</span>
          <span className="text-xs tracking-wider text-foreground/80">
            {line.text}
            {line.progress && (
              <span className="text-primary ml-2">
                [{progressBar}] {loadProgress}%
              </span>
            )}
            {line.ready && (
              <span className="ml-2 text-primary animate-pulse">●</span>
            )}
          </span>
          {i === visibleLines - 1 && !line.ready && (
            <span className="typewriter-cursor text-xs" />
          )}
        </div>
      ))}
    </div>
  );
};

export default StartupSequence;

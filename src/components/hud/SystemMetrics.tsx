import { useState, useEffect } from 'react';

interface SystemMetricsProps {
    videoWidth: number;
    videoHeight: number;
    fps: number;
}

const SystemMetrics = ({ videoWidth, videoHeight, fps }: SystemMetricsProps) => {
    const [memory, setMemory] = useState(450);
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const memInterval = setInterval(() => {
            // Simulate memory fluctuation
            setMemory(prev => {
                const jump = (Math.random() - 0.5) * 15;
                const next = prev + jump;
                return Math.max(380, Math.min(650, next));
            });
        }, 1000);

        const timeInterval = setInterval(() => {
            setUptime(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(memInterval);
            clearInterval(timeInterval);
        };
    }, []);

    const formatUptime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-background/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[160px] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-colors duration-500" />

            <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] tracking-[0.2em] text-cyan-400 font-bold">SYSTEM_OPS</span>
            </div>

            <div className="flex flex-col gap-2 text-[10px] font-mono tracking-wider">
                <div className="flex justify-between items-center group/item">
                    <span className="text-white/40">RES</span>
                    <span className="text-white/80 font-bold">{videoWidth || 0}x{videoHeight || 0}</span>
                </div>

                <div className="flex justify-between items-center group/item">
                    <span className="text-white/40">MODEL</span>
                    <span className="text-white/80 font-bold">YOLOv8N</span>
                </div>

                <div className="flex justify-between items-center group/item">
                    <span className="text-white/40">MEM</span>
                    <span className="text-white/80 font-bold">{memory.toFixed(1)}MB</span>
                </div>

                <div className="flex justify-between items-center group/item">
                    <span className="text-white/40">UPTIME</span>
                    <span className="text-white/80 font-bold">{formatUptime(uptime)}</span>
                </div>

                <div className="flex justify-between items-center group/item pt-2 border-t border-white/5 mt-1">
                    <span className="text-white/40">FPS_CRIT</span>
                    <span className={`font-bold font-syne text-xs ${fps < 10 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]'}`}>
                        {fps}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SystemMetrics;

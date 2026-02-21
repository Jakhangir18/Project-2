import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Detection } from '@/utils/nms';

interface EventLogProps {
    detections: Detection[];
}

interface LogEntry {
    id: number;
    time: string;
    message: string;
    type: 'info' | 'warn' | 'detect';
}

const formatTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const EventLog = ({ detections }: EventLogProps) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const idCounter = useRef(0);
    const lastDetections = useRef<string[]>([]);

    useEffect(() => {
        // Check if there are new types of detections
        const currentClasses = Array.from(new Set(detections.map(d => d.className)));

        currentClasses.forEach(className => {
            // If we see a new class that wasn't there recently
            if (!lastDetections.current.includes(className)) {
                addLog(`Target acquired: [${className.toUpperCase()}]`, 'detect');
            }
        });

        // If suddenly all detections are gone
        if (detections.length === 0 && lastDetections.current.length > 0) {
            addLog('Targets lost. Standby.', 'warn');
        }

        lastDetections.current = currentClasses;
    }, [detections]);

    // Periodic random system logs to make it look alive
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const msgs = ['Calibrating...', 'Syncing tensor data', 'Buffer ok', 'Node active', 'Link stable'];
                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                addLog(msg, 'info');
            }
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (message: string, type: 'info' | 'warn' | 'detect') => {
        const newLog: LogEntry = {
            id: idCounter.current++,
            time: formatTime(),
            message,
            type
        };

        setLogs(prev => {
            const next = [newLog, ...prev];
            if (next.length > 6) return next.slice(0, 6);
            return next;
        });
    };

    const getColor = (type: string) => {
        if (type === 'detect') return 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]';
        if (type === 'warn') return 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]';
        return 'text-white/60';
    };

    return (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-background/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[200px] h-[160px] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-colors duration-500" />

            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                <div className="w-1.5 h-1.5 rounded-sm bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                <span className="text-[10px] tracking-[0.2em] text-purple-400 font-bold">TERMINAL_LOG</span>
            </div>

            <div className="flex flex-col gap-1 overflow-hidden font-mono text-[9px] tracking-wider relative flex-1">
                <AnimatePresence>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start gap-2 whitespace-nowrap"
                        >
                            <span className="text-white/30 shrink-0">[{log.time}]</span>
                            <span className={`truncate ${getColor(log.type)} uppercase font-bold`}>
                                {log.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Decorative fading bottom edge */}
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
        </div>
    );
};

export default EventLog;

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
    logs: string[];
};

function TypedLogLine({ text, className, isNew }: { text: string, className: string, isNew: boolean }) {
    const [displayedText, setDisplayedText] = useState(isNew ? "" : text);
    
    useEffect(() => {
        if (!isNew) return;
        
        let i = 0;
        const limit = text.length;
        // Fast typing speed for logs
        const interval = setInterval(() => {
            if (i < limit - 2) {
                 // type multiple chars at once to keep it snappy for long agent responses
                 i += 3;
            } else {
                 i++;
            }
            if (i > limit) i = limit;
            
            setDisplayedText(text.slice(0, i));
            
            if (i === limit) {
                clearInterval(interval);
            }
        }, 15); 
        
        return () => clearInterval(interval);
    }, [text, isNew]);

    return <p className={className}>{displayedText}</p>;
}

export default function ProtocolLogs({ logs }: Props) {
    const endRef = useRef<HTMLDivElement | null>(null);
    const [initialCount, setInitialCount] = useState(0);

    useEffect(() => {
        // Record how many logs existed at mount so we don't animate them
        setInitialCount(logs.length);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
        return () => clearTimeout(timer);
    }, [logs]);

    return (
        <AnimatePresence>
            {logs.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    className="absolute bottom-2 right-2 z-40 h-[30vh] w-[calc(100vw-1rem)] rounded-xl border border-white/15 bg-white/5 p-2 backdrop-blur-xl sm:bottom-auto sm:right-3 sm:top-3 sm:h-[45vh] sm:w-[16rem] sm:rounded-2xl sm:p-3 md:right-6 md:top-6 md:h-[65vh] md:w-[23rem]"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200">Protocol Logs</p>
                        <button
                            onClick={() => navigator.clipboard.writeText(logs.join('\n'))}
                            className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-300 hover:bg-white/10"
                        >
                            Copy
                        </button>
                    </div>
                    <div className="h-[calc(30vh-2.5rem)] overflow-y-auto rounded-lg border border-white/10 bg-black/40 p-1.5 text-[10px] text-slate-300 sm:h-[calc(45vh-2.5rem)] sm:p-2 sm:text-xs md:h-[calc(65vh-2.5rem)]">
                        {logs.map((line, i) => {
                            const isInfo = line.toLowerCase().includes("info") || line.toLowerCase().includes("ok");
                            const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("fail");
                            
                            let colorClass = "text-slate-300";
                            if (isInfo) colorClass = "bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] font-semibold";
                            if (isError) colorClass = "text-red-400 font-bold";
                            
                            return (
                                <TypedLogLine 
                                    key={`${i}-${line.slice(0, 12)}`} 
                                    text={line} 
                                    className={`mb-1 font-mono leading-relaxed tracking-wide ${colorClass}`} 
                                    isNew={i >= initialCount}
                                />
                            );
                        })}
                        <div ref={endRef} />
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    );
}

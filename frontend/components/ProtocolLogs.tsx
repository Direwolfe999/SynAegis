"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
    logs: string[];
};

export default function ProtocolLogs({ logs }: Props) {
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
                    <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200">Protocol Logs</p>
                    <div className="h-[calc(30vh-2.5rem)] overflow-y-auto rounded-lg border border-white/10 bg-black/40 p-1.5 text-[10px] text-slate-300 sm:h-[calc(45vh-2.5rem)] sm:p-2 sm:text-xs md:h-[calc(65vh-2.5rem)]">
                        {logs.map((line, i) => (
                            <p key={`${i}-${line.slice(0, 12)}`} className="mb-1 font-mono leading-relaxed">
                                {line}
                            </p>
                        ))}
                        <div ref={endRef} />
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    );
}

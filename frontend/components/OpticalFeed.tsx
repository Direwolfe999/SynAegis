"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
    active: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    inline?: boolean;
};

export default function OpticalFeed({ active, videoRef, inline = false }: Props) {
    return (
        <AnimatePresence>
            {active && (
                <motion.section
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    className={`pointer-events-none z-20 rounded-xl border border-white/15 bg-white/5 p-1.5 backdrop-blur-xl sm:rounded-2xl sm:p-2 ${inline ? "relative w-full shadow-lg pointer-events-auto mt-4" : "absolute left-2 top-28 w-[9rem] sm:left-3 sm:top-32 sm:w-[12rem] md:left-5 md:top-36 md:w-[18rem]"}`}
                >
                    <div className="relative overflow-hidden rounded-xl border border-white/10">
                        <video ref={videoRef} muted playsInline className={`w-full bg-black object-cover ${inline ? "h-[30vh] md:h-[40vh] rounded-xl" : "h-20 sm:h-28 md:h-40"}`} />
                        <div className="scanline absolute inset-0" />
                    </div>
                    <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-cyan-200/90 sm:mt-1 sm:text-[9px] md:text-[10px] md:tracking-[0.22em]">Optical Feed</p>
                </motion.section>
            )}
        </AnimatePresence>
    );
}

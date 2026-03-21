"use client";

import { AnimatePresence, motion } from "framer-motion";

type Metrics = {
    latency_ms?: number | null;
    cpu_percent?: number | null;
    ram_percent?: number | null;
    disk_percent?: number | null;
    billing_enabled?: boolean | null;
    net_cost_cents?: number | null;
};

type Props = {
    visible: boolean;
    metrics: Metrics;
};

export default function SystemDiagnostics({ visible, metrics }: Props) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.section
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute bottom-2 left-2 z-20 w-[calc(100vw-1rem)] rounded-xl border border-white/15 bg-white/5 dark:bg-black/50 p-2 backdrop-blur-xl sm:bottom-4 sm:left-3 sm:w-[14rem] sm:rounded-2xl sm:p-3 md:bottom-6 md:left-6 md:w-[19rem]"
                >
                    <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-violet-300 dark:text-violet-200">System Core</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-800 dark:text-slate-200">
                        <div className="rounded-lg border border-slate-300 dark:border-white/10 bg-white/40 dark:bg-black/30 p-2">
                            <span className="text-[9px] opacity-70 block">CPU</span>
                            {metrics.cpu_percent != null ? `${metrics.cpu_percent.toFixed(1)}%` : "--"}
                        </div>
                        <div className="rounded-lg border border-slate-300 dark:border-white/10 bg-white/40 dark:bg-black/30 p-2">
                            <span className="text-[9px] opacity-70 block">RAM</span>
                            {metrics.ram_percent != null ? `${metrics.ram_percent.toFixed(1)}%` : "--"}
                        </div>
                        <div className="rounded-lg border border-slate-300 dark:border-white/10 bg-white/40 dark:bg-black/30 p-2">
                            <span className="text-[9px] opacity-70 block">DISK</span>
                            {metrics.disk_percent != null ? `${metrics.disk_percent.toFixed(1)}%` : "--"}
                        </div>
                        <div className="rounded-lg border border-slate-300 dark:border-white/10 bg-white/40 dark:bg-black/30 p-2">
                            <span className="text-[9px] opacity-70 block">NET</span>
                            {metrics.latency_ms ?? 12}ms
                        </div>
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    );
}

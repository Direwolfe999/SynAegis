"use client";

import SynAegisOrb from "./components/SynAegisOrb";

export default function App() {
    return (
        <main className="relative min-h-screen overflow-hidden p-6 md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_84%_18%,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_50%_92%,rgba(59,130,246,0.16),transparent_45%)]" />

            <section className="relative mx-auto mb-6 max-w-7xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-slate-900/55 px-4 py-2 shadow-[0_0_40px_-15px_rgba(56,189,248,0.8)] backdrop-blur">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.95)]" />
                    <p className="bg-gradient-to-r from-cyan-200 via-sky-300 to-fuchsia-300 bg-clip-text text-sm font-semibold tracking-[0.22em] text-transparent md:text-base">
                        SynAegis
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-slate-300/90 md:text-xs">Autonomous Multimodal Lifeform</span>
                </div>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                    Project: SynAegis Command Interface
                </h1>
                <p className="mt-3 max-w-3xl text-slate-300">
                    Systems optimized. Full-duplex multimodal synthesis active. Neural throughput calibrated for
                    real-time observation, reasoning, and action.
                </p>
            </section>

            <section className="relative mx-auto max-w-7xl">
                <div className="flex justify-center">
                    <SynAegisOrb state="idle" userLevel={0.1} aiLevel={0.1} />
                </div>
            </section>
        </main>
    );
}

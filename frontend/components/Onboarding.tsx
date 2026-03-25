import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SynAegisOrb from './SynAegisOrb';
import { completeOnboarding } from '../lib/api';

const slides = [
    {
        heading: 'Welcome to SynAegis',
        sub: 'Autonomous Infrastructure Intelligence',
        content: 'Experience the next-gen orchestration for CI/CD, Cloud, and Security.'
    },
    {
        heading: 'AI War Room',
        sub: 'Live Collaboration',
        content: 'Coordinate, monitor, and act in real-time with your team and autonomous AI agents.'
    },
    {
        heading: 'Deep Observability',
        sub: 'Real-time Telemetry',
        content: 'Visualize and control your entire infrastructure stack with live cloud and security metrics.'
    },
    {
        heading: 'Autonomous Actions',
        sub: 'Auto-fix & Scaling',
        content: 'Let SynAegis auto-heal deployments, optimize node costs, and dynamically scale your resources.'
    },
    {
        heading: 'Ready to Command?',
        sub: 'Initiate System Core',
        content: 'Step into the orchestration plane and launch the future of DevOps.'
    }
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
    const [index, setIndex] = useState(0);
    const [typedText, setTypedText] = useState('');

    
    // Prevent scrolling behind onboarding
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    }, []);

    
    // Prevent scrolling behind onboarding
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    }, []);

    // Typewriter effect logic


    useEffect(() => {
        let currentText = '';
        let i = 0;
        const targetText = slides[index].heading;
        setTypedText('');

        const interval = setInterval(() => {
            if (i < targetText.length) {
                currentText += targetText.charAt(i);
                setTypedText(currentText);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [index]);

    const handleComplete = async () => {
        try {
            await completeOnboarding();
            onComplete(); // Move to main app in UI
        } catch {
            // Fallback
            localStorage.setItem("onboarding_bypass", "true");
            onComplete();
        }
    };

    const next = () => { if (index < slides.length - 1) setIndex(index + 1); };
    const prev = () => { if (index > 0) setIndex(index - 1); };

    // Handle touch/swipe gestures
    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = offset.x;
        if (swipe < -50) {
            next();
        } else if (swipe > 50) {
            prev();
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {/* Animated Deep Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-[#050505] to-blue-900/20 z-0"></div>
            <motion.div
                className="absolute inset-0 z-0 opacity-30"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.1) 0%, transparent 50%)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            />
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

            <div className="absolute top-6 right-8 z-50">
                <button onClick={handleComplete} className="text-slate-400 hover:text-white text-sm font-semibold px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">Skip Intro</button>
            </div>

            <div className="z-10 flex flex-col items-center justify-center w-full max-w-2xl px-6">
                <motion.div
                    className="mb-12 h-40 w-40 flex items-center justify-center relative touch-none"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                    <div className="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full"></div>
                    <SynAegisOrb state="thinking" userLevel={0} aiLevel={0.7} rippling={true} />
                </motion.div>

                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="h-48 flex flex-col items-center justify-start text-center w-full relative cursor-grab active:cursor-grabbing"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center"
                        >
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-3 h-14 select-none">
                                {typedText}
                                <span className="animate-pulse text-cyan-400">_</span>
                            </h1>
                            <h2 className="text-xl text-cyan-400 font-mono tracking-widest uppercase mb-4 opacity-90">{slides[index].sub}</h2>
                            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">{slides[index].content}</p>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                <div className="flex items-center gap-3 mt-12 mb-10">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'w-2 bg-white/20'}`}
                        ></div>
                    ))}
                </div>

                <div className="flex gap-4 w-full max-w-sm">
                    {index > 0 && (
                        <button
                            onClick={prev}
                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all shadow-lg backdrop-blur-md"
                        >
                            Back
                        </button>
                    )}
                    {index < slides.length - 1 ? (
                        <button
                            onClick={next}
                            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex justify-center items-center gap-2"
                        >
                            Continue <span className="text-xl">→</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all uppercase"
                        >
                            Enter Dashboard
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

export default function Intro() {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        setIsVisible(true);
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-75"></div>
            </div>

            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
                {/* Logo - Fade and scale in */}
                <div
                    className={`text-center transform transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                >
                    {/* Kinesis Logo */}
                    <div className="mb-12 flex justify-center">
                        <div className="relative w-64 h-64 md:w-80 md:h-80">
                            <Image
                                src="/images/kinesis-logo.svg"
                                alt="Kinesis Logo"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                                style={{
                                    filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))',
                                }}
                            />
                        </div>
                    </div>

                    {/* Tagline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                        KINESIS
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
                        The Living Multimodal Agent
                    </p>

                    <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                        Real-time perception. Instant action. Seamless adaptation.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-16">
                        {[
                            '🎵 Real-Time Audio',
                            '📹 Multimodal',
                            '⚡ Barge-In',
                            '🔄 Graceful Fallback',
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 text-sm text-blue-300 backdrop-blur-sm hover:border-blue-400/60 transition-all duration-300"
                            >
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={() => {
                            const page = document.querySelector('main');
                            page?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
                    >
                        Enter Kinesis
                    </button>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <ChevronDown className="w-8 h-8 text-blue-400/60" />
                    </div>
                </div>

                {/* Parallax effect on scroll */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        transform: `translateY(${scrollY * 0.5}px)`,
                    }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-slate-950/50" />
                </div>
            </div>

            {/* Features Section */}
            <div className="relative py-32 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Why Kinesis?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: '🔗 Real-Time Connection',
                                desc: 'Perceives audio, video, and context simultaneously. Not turn-based, not buffered—alive.',
                            },
                            {
                                title: '🛑 Barge-In Ready',
                                desc: 'Interrupt mid-response. System pivots instantly with zero latency frustration.',
                            },
                            {
                                title: '🔄 Quota Resilient',
                                desc: 'When API limits hit, gracefully fallback to secondary models. Experience never breaks.',
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="p-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105"
                            >
                                <h3 className="text-2xl font-bold mb-4 text-blue-300">{item.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tech Stack Section */}
            <div className="relative py-32 px-4 bg-gradient-to-b from-transparent to-blue-950/20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-gray-100">
                        Built on Innovation
                    </h2>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: '🤖', title: 'Gemini 2.5 Flash', desc: 'Next-gen LLM' },
                            { icon: '⚡', title: 'Live API', desc: 'Real-time streaming' },
                            { icon: '🔌', title: 'WebSocket', desc: 'Persistent connection' },
                            { icon: '🌐', title: 'Full Stack', desc: 'Next.js + FastAPI' },
                        ].map((tech, idx) => (
                            <div
                                key={idx}
                                className="p-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-center"
                            >
                                <div className="text-4xl mb-3">{tech.icon}</div>
                                <h3 className="font-bold text-blue-300 mb-2">{tech.title}</h3>
                                <p className="text-sm text-gray-400">{tech.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Footer */}
            <div className="relative py-16 px-4 text-center border-t border-white/10">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                        Ready to experience the future of AI?
                    </h3>
                    <button
                        onClick={() => {
                            const page = document.querySelector('main');
                            page?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 mb-6"
                    >
                        Launch Kinesis
                    </button>
                    <p className="text-gray-400 text-sm">
                        Built for the Gemini Live Agent Challenge
                    </p>
                </div>
            </div>
        </div>
    );
}

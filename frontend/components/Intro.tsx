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
                    className={`text-center transform transition-all duration-1000 ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                >
                    {/* Tagline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                        SynAegis
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
                        The Voice-Activated DevOps War Room
                    </p>

                    <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                        Orchestrating pipelines. Patching vulnerabilities. Real-time engineering.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-16">
                        {[
                            '🛡️ Automated Security',
                            '🌐 GitLab CI/CD Flows',
                            '⚡ Voice Rollbacks',
                            '🌿 Green Cloud Ops',
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
                        Enter War Room
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
                        Why SynAegis?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: '⚡ Voice Pipeline Control',
                                desc: 'Interrupt deployments via real-time voice commands when critical incidents occur.',
                            },
                            {
                                title: '🛡️ Zero-Touch Vulnerability Fixes',
                                desc: 'Listens to GitLab Security Webhooks, patches code autonomously, and opens MRs.',
                            },
                            {
                                title: '♻️ Green Agent Scans',
                                desc: 'Shuts down idle review apps, scales pipelines based on carbon intensity.',
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

            {/* CTA Footer */}
            <div className="relative py-16 px-4 text-center border-t border-white/10">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                        Built for the GitLab AI Hackathon
                    </h3>
                    <button
                        onClick={() => {
                            const page = document.querySelector('main');
                            page?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 mb-6"
                    >
                        Launch SynAegis
                    </button>
                    <p className="text-gray-400 text-sm">
                        You Orchestrate. AI Accelerates.
                    </p>
                </div>
            </div>
        </div>
    );
}

"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import WarRoom from "../components/WarRoom";
import { SettingsPanel } from "../components/SettingsPanel";
import { Sidebar } from "../components/Sidebar";
import { FloatingActions } from "../components/FloatingActions";
import { ToastContainer, Toast } from "../components/ToastProvider";
import { 
  StatCard, 
  PipelineMonitor, 
  AgentActivityFeed, 
  SecurityCenter, 
  CloudControlPanel, 
  SustainabilityPanel 
} from "../components/DashboardWidgets";

export default function DashboardPage() {
    const [activeView, setActiveView] = useState<string>("dashboard");
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const renderSecondaryView = () => {
        if (activeView === "warroom") {
            return (
                <div className="relative h-screen w-full">
                    <button
                        onClick={() => setActiveView("dashboard")}
                        className="absolute top-6 left-6 z-[100] rounded-lg border border-cyan-500/30 bg-black/50 px-4 py-2 text-xs uppercase tracking-widest text-cyan-300 backdrop-blur-md transition-all hover:bg-cyan-500/20"
                    >
                        ← Back to Control Plane
                    </button>
                    <WarRoom />
                </div>
            );
        }
        if (activeView === "settings") return <SettingsPanel />;
        if (activeView === "pipelines") return <div className="p-8"><PipelineMonitor /></div>;
        if (activeView === "security") return <div className="p-8"><SecurityCenter /></div>;
        if (activeView === "cloud") return <div className="p-8"><CloudControlPanel /></div>;
        return null;
    };

    return (
        <main className="relative min-h-screen bg-[#050505] text-slate-200 overflow-x-hidden font-sans flex">
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

            {/* Sidebar Navigation */}
            {(activeView !== "warroom") && <Sidebar activeView={activeView} setActiveView={setActiveView} />}
            
            {/* Floating Action Button */}
            {(activeView !== "warroom") && <FloatingActions addToast={addToast} />}

            {/* Main Content Area - padded left for sidebar */}
            <div className={`flex-1 transition-all duration-300 ${activeView !== 'warroom' ? 'ml-20' : ''}`}>
                
                {/* Background Effects */}
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />
                <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.05]">
                    <img src="/logos/full.png" alt="SynAegis Full Motif" className="w-[800px] h-[800px] object-contain grayscale blur-[2px]" />
                </div>
                <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                {activeView === "warroom" ? (
                    renderSecondaryView()
                ) : (
                    <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 mb-32 sm:px-8 flex flex-col gap-8">
                        
                        {/* Breadcrumbs for internal navigation */}
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tracking-widest pl-2">
                            <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => setActiveView('dashboard')}>SYNAEGIS</span>
                            <span>/</span>
                            <span className="text-cyan-300 uppercase">{activeView}</span>
                        </div>

                        {activeView !== "dashboard" ? renderSecondaryView() : (
                            <>
                                {/* 1. COMMAND CENTER HERO */}
                                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
                                    
                                    <div className="relative z-10 w-full xl:w-auto flex-1">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 mb-4 text-xs uppercase tracking-widest text-cyan-300">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span> SynAegis Core: ACTIVE
                                        </div>
                                        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-2">DevSecOps Control Plane</h1>
                                        <p className="text-slate-400 text-sm max-w-xl mb-6">Fully autonomous orchestrator managing CI/CD, cloud infrastructure, and security posture across your environments.</p>
                                        
                                        <div className="flex gap-4">
                                        <button 
                                            onClick={() => setActiveView("warroom")}
                                            className="pointer-events-auto z-[500] inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:from-cyan-500 hover:to-blue-500 hover:scale-105"
                                        >
                                            🎙️ Enter Live War Room
                                        </button>
                                        </div>
                                    </div>

                                    {/* Quick Stats Layout */}
                                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 gap-4 w-full xl:w-auto">
                                        <StatCard title="Pipeline Success" value="98.4%" trend="+1.2%" icon="🚀" colorClass="border-blue-500/30 text-blue-400" />
                                        <StatCard title="Active CVEs" value="2" trend="-4" icon="🛡️" colorClass="border-red-500/30 text-red-400" />
                                        <StatCard title="Daily Cloud Cost" value="$15.40" trend="-$4" icon="☁️" colorClass="border-purple-500/30 text-purple-400" />
                                        <StatCard title="Carbon Avoided" value="1.2kg" trend="Optimal" icon="🌿" colorClass="border-emerald-500/30 text-emerald-400" />
                                    </div>
                                </header>

                                {/* 2. MAIN DASHBOARD GRID */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                    
                                    {/* LEFT COLUMN: Infrastructure & Pipelines (Span 8) */}
                                    <div className="xl:col-span-8 flex flex-col gap-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <PipelineMonitor />
                                        <SecurityCenter />
                                    </div>
                                    <CloudControlPanel />
                                    </div>

                                    {/* RIGHT COLUMN: AI Brain & Analytics (Span 4) */}
                                    <div className="xl:col-span-4 flex flex-col gap-8">
                                    <AgentActivityFeed />
                                    <SustainabilityPanel />
                                    </div>

                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

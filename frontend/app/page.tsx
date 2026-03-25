"use client";

import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import WarRoom from "../components/WarRoom";
import SettingsDashboard from "../components/SettingsDashboard";
import { Sidebar } from "../components/Sidebar";
import { FloatingActions } from "../components/FloatingActions";
import { ToastProvider, useToast } from "../components/ToastProvider";
import CICDDashboard from "../components/CICDDashboard";
import SecurityDashboard from "../components/SecurityDashboard";
import CloudDashboard from "../components/CloudDashboard";
import GlobalCommandDashboard from "../components/GlobalCommandDashboard";
import DevOpsControlCenter from "../components/DevOpsControlCenter";
import Onboarding from "../components/Onboarding";
import { fetchOnboardingStatus } from "../lib/api";

function DashboardContent() {
    const [activeView, setActiveView] = useState<string>("dashboard");
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        async function checkOnboarding() {
            if (localStorage.getItem("onboarding_bypass")) {
                setShowOnboarding(false);
                return;
            }
            const status = await fetchOnboardingStatus();
            setShowOnboarding(!status?.completed);

            // Add personalized greeting if they already finished it
            if (status?.completed) {
                setTimeout(() => {
                    addToast?.("Welcome back, Commander.", "success");
                }, 1000);
            }
        }
        checkOnboarding();
    }, []);

    const renderSecondaryView = () => {
        if (activeView === "warroom") {
            return (
                <div className="relative min-h-screen w-full">
                    <button
                        onClick={() => setActiveView("dashboard")}
                        className="absolute top-24 left-6 z-[100] rounded-lg border border-cyan-500/30 bg-black/50 px-4 py-2 text-xs uppercase tracking-widest text-cyan-300 backdrop-blur-md transition-all hover:bg-cyan-500/20"
                    >
                        ← Back to Control Plane
                    </button>
                    <WarRoom />
                </div>
            );
        }
        if (activeView === "devops") return <div className="relative min-h-screen w-full"><DevOpsControlCenter onBack={() => setActiveView("dashboard")} /></div>;
        if (activeView === "pipelines") return <div className="relative min-h-screen w-full"><CICDDashboard onBack={() => setActiveView("dashboard")} /></div>;
        if (activeView === "security") return <div className="relative min-h-screen w-full"><SecurityDashboard onBack={() => setActiveView("dashboard")} /></div>;
        if (activeView === "settings") return <div className="relative min-h-screen w-full"><SettingsDashboard onBack={() => setActiveView("dashboard")} /></div>;
        if (activeView === "cloud") return <div className="relative min-h-screen w-full"><CloudDashboard onBack={() => setActiveView("dashboard")} /></div>;
        return null;
    };

    return (
        <>
            {showOnboarding === true && (
                <Onboarding onComplete={() => {
                    setShowOnboarding(false);
                    setTimeout(() => addToast?.("Welcome to the Command Center, Commander.", "success"), 500);
                }} />
            )}

            {showOnboarding !== null && (
                <main className="relative min-h-screen overflow-x-hidden font-sans flex">
                    {/* Sidebar Navigation */}
                    {(activeView !== "warroom" && activeView !== "pipelines" && activeView !== "security" && activeView !== "cloud" && activeView !== "settings" && activeView !== "devops") && <Sidebar activeView={activeView} setActiveView={setActiveView} />}

                    {/* Floating Action Button */}
                    {(activeView !== "warroom" && activeView !== "pipelines" && activeView !== "security" && activeView !== "cloud" && activeView !== "settings" && activeView !== "devops") && <FloatingActions addToast={addToast} />}

                    {/* Main Content Area - padded left for sidebar */}
                    <div className={`flex-1 min-w-0 transition-all duration-300 ${activeView !== 'warroom' && activeView !== 'pipelines' && activeView !== 'security' && activeView !== 'cloud' && activeView !== 'settings' && activeView !== 'devops' ? 'mb-20 md:ml-20 md:mb-0' : ''}`}>
                        {/* Background Effects */}
                        {activeView !== 'warroom' && (
                            <>
                                <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />
                        <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.05]">
                            <img src="/logos/full.png" alt="SynAegis Full Motif" className="w-[800px] h-[800px] object-contain grayscale blur-[2px]" />
                        </div>
                        <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                            </>
                        )}

                        <div className={`min-h-screen w-full ${activeView === 'warroom' ? 'bg-transparent' : 'bg-[#050505]'} text-white`}>
                            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-8 mb-32 flex flex-col gap-8">
                                {activeView !== "dashboard" && activeView !== "warroom" && (
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tracking-widest px-2">
                                        <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => setActiveView('dashboard')}>SYNAEGIS</span>
                                        <span>/</span>
                                        <span className="text-cyan-300 uppercase">{activeView}</span>
                                    </div>
                                )}

                                {activeView !== "dashboard" ? renderSecondaryView() : (
                                    <GlobalCommandDashboard setActiveView={setActiveView} />
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            )}
        </>
    );
}

export default function DashboardPage() {
    return (
        <ToastProvider>
            <DashboardContent />
        </ToastProvider>
    );
}

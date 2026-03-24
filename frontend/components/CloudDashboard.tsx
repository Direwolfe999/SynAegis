import React, { useState, useEffect } from "react";
import { useToast } from "./ToastProvider";
import { NotificationBell } from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import {
    Server, Cpu, Activity, DollarSign, Leaf, Bell, Sun, Moon,
    Search, Filter, ChevronDown, ChevronUp, Play, Square, RotateCcw,
    AlertCircle, Sparkles, Zap, HardDrive, Network, Database, ChevronRight, Share2, Layers
} from "lucide-react";
import { API_BASE } from "../lib/api";

// Mock Data
const MOCK_SERVICES = [
    { id: "srv-1", name: "SynAegis Core API", status: "running", region: "us-east-1", cpu: 45, memory: "2.4GB", cost: 120 },
    { id: "srv-2", name: "PostgreSQL Cluster", status: "running", region: "us-east-1", cpu: 82, memory: "16GB", cost: 450 },
    { id: "srv-3", name: "Redis Cache", status: "warning", region: "us-west-2", cpu: 95, memory: "4.1GB", cost: 80 },
    { id: "srv-4", name: "Data Ingestion Worker", status: "stopped", region: "eu-central-1", cpu: 0, memory: "0GB", cost: 0 },
];

const MOCK_ALERTS = [
    { id: "al-1", message: "Redis CPU > 90% in us-west-2", severity: "high", time: "2m ago" },
    { id: "al-2", message: "Postgres auto-scaling triggered (Node added)", severity: "info", time: "15m ago" },
    { id: "al-3", message: "Unusual outbound traffic on Core API", severity: "medium", time: "1h ago" },
];

export default function CloudDashboard({ onBack }: { onBack: () => void }) {
    const { addToast, showModal, closeModal } = useToast();
    const [darkMode, setDarkMode] = useState(true);
    const [services, setServices] = useState(MOCK_SERVICES);
    const [alerts] = useState(MOCK_ALERTS);
    const [aiOpen, setAiOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [expandedService, setExpandedService] = useState<string | null>(null);
    const [greenCarbon, setGreenCarbon] = useState<any>(null);
    const [reaping, setReaping] = useState(false);
    
    // AI Healing & Animation states
    const [aiMode, setAiMode] = useState<"Manual" | "Assisted" | "Auto">("Assisted");
    const [aiLogs, setAiLogs] = useState<{id: string, action: string, service: string, time: string}[]>([]);


    const fetchGreenCarbon = async () => {
        try {
            const res = await fetch(`${API_BASE.replace('/api', '')}/green/footprint`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) { console.error(e) }
        return null;
    };

    useEffect(() => {
        fetchGreenCarbon().then(res => {
            if (res) setGreenCarbon(res);
        });
    }, []);

    const reapGreenZombies = async (days: number) => {
        try {
            const res = await fetch(`${API_BASE.replace('/api', '')}/green/zombies?days_idle=${days}`, { method: 'POST' });
            return await res.json();
        } catch (e) { console.error(e) }
        return null;
    };
    const handleReapZombies = async () => {
        setReaping(true);
        addToast("Scanning for zombie environments...");
        const res = await reapGreenZombies(7);
        if (res && res.reaped) {
            addToast(JSON.stringify(res.reaped));
        } else {
            addToast("Environment is clean.");
        }
        setReaping(false);
    };

    // Simulate real-time metric fluctuations & AI Auto Healing
    useEffect(() => {
        const interval = setInterval(() => {
            setServices(prev => prev.map(s => {
                if (s.status === "running" || s.status === "warning") {
                    const fluctuation = Math.floor(Math.random() * 15) - 5; // more aggressive spikes
                    const newCpu = Math.max(5, Math.min(100, s.cpu + fluctuation));
                    let newStatus = s.status;
                    
                    if (newCpu > 95) newStatus = "warning";
                    else if (newCpu < 85 && s.status === "warning") newStatus = "running";
                    
                    // AI Self-Healing Trigger
                    if (newCpu > 95 && Math.random() > 0.7 && s.id !== activeAction?.split('-')[1]) {
                        // AI triggers scale automatically
                        setTimeout(() => handleAction('scale', s.id, true), 500);
                    }
                    
                    return { ...s, cpu: newCpu, status: newStatus };
                }
                return s;
            }));
        }, 4000);
        return () => clearInterval(interval);
    }, [aiMode, activeAction]);

    const handleAction = (action: string, id: string, autoTriggered = false) => {
        const service = services.find(s => s.id === id);
        
        const executeAction = () => {
            closeModal();
            setActiveAction(`${action}-${id}`);
            fetch(`${API_BASE}/services/${id}/${action}`, { method: 'POST' }).catch(() => {});
            setTimeout(() => {
                setServices(prev => prev.map(s => {
                    if (s.id === id) {
                        return { ...s, status: action === 'stop' ? 'stopped' : action === 'start' ? 'running' : 'running', cpu: action === 'stop' ? 0 : (action === 'scale' ? 45 : 50) };
                    }
                    return s;
                }));
                setActiveAction(null);
                addToast(`Service ${action}ed successfully`);
                if (autoTriggered || action === 'scale') {
                    setAiLogs(prev => [{id: Date.now().toString(), action: action.toUpperCase(), service: service?.name || id, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 10));
                }
            }, 1500);
        };

        if (aiMode === "Auto" && autoTriggered) {
             executeAction();
             return;
        }

        showModal({
            title: `Confirm ${action.toUpperCase()}`,
            content: (
                <div className="flex flex-col gap-5">
                    <div className="p-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-2">
                             <div className={`p-2 rounded-full ${action === 'stop' || action === 'decommission' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                 <AlertCircle className="w-5 h-5"/>
                             </div>
                             <div>
                                <h3 className="font-semibold text-slate-200">Action: {action.toUpperCase()}</h3>
                                <p className="text-xs text-slate-400">Target: {service?.name}</p>
                             </div>
                        </div>
                        {autoTriggered && <div className="mt-3 text-xs text-amber-400 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Confidence: 98% - High Risk Avoidance</div>}
                    </div>
                    
                    <p className="text-sm text-slate-300">Are you sure you want to {action} this service {autoTriggered ? 'as suggested by AI' : ''}?</p>
                    
                    <div className="flex items-center justify-end gap-3 mt-2">
                        <button className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors" onClick={() => closeModal()}>Cancel</button>
                        <button className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors relative overflow-hidden group ${action === 'stop' || action === 'decommission' ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-500 hover:bg-blue-400'}`} onClick={executeAction}>
                            <span className="relative z-10">Confirm Execution</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                    </div>
                </div>
            )
        });
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "running": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Activity className="w-3 h-3" /> Running</span>;
            case "stopped": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20"><Square className="w-3 h-3" /> Stopped</span>;
            case "warning": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"><AlertCircle className="w-3 h-3" /> Stressed</span>;
            default: return null;
        }
    };

    return (
        <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${darkMode ? "bg-[#050505] text-slate-200" : "bg-slate-50 text-slate-900"}`}>

            {/* Header */}
            <header className={`sticky top-0 z-50 px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl ${darkMode ? "border-white/10 bg-[#050505]/90" : "border-slate-200 bg-white/95"} shadow-sm`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Server className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">SynAegis Cloud</span>
                    </div>

                    <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <button onClick={onBack} className="hover:text-blue-400 transition-colors">Workspace</button>
                        <span>/</span>
                        <span className={darkMode ? "text-slate-200" : "text-slate-900"}>Infrastructure</span>
                    </nav>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto -mt-12 sm:mt-0">
                    <button className="p-2 rounded-full hover:bg-slate-500/10 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
                    </button>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors">
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 border-2 border-[#050505] cursor-pointer"></div>
                </div>
            </header>

            <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">

                {/* 1. Global Overview Stats Bar */}
                <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-5 sm:pb-0 sm:overflow-visible">
                    <div className={`px-5 py-4 rounded-xl border flex flex-col snap-center min-w-[280px] sm:min-w-0 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-2 font-medium text-xs uppercase tracking-wider">
                            <Layers className="w-4 h-4 text-blue-400" /> Active Services
                        </div>
                        <div className="text-3xl font-light text-slate-100">14<span className="text-sm text-slate-500 ml-1">/16</span></div>
                    </div>

                    <div className={`px-5 py-4 rounded-xl border flex flex-col snap-center min-w-[280px] sm:min-w-0 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-2 font-medium text-xs uppercase tracking-wider">
                            <HardDrive className="w-4 h-4 text-purple-400" /> Total Nodes
                        </div>
                        <div className="text-3xl font-light text-slate-100">8</div>
                    </div>

                    <div className={`px-5 py-4 rounded-xl border flex flex-col snap-center min-w-[280px] sm:min-w-0 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-2 font-medium text-xs uppercase tracking-wider">
                            <Cpu className="w-4 h-4 text-amber-400" /> Avg CPU Load
                        </div>
                        <div className="text-3xl font-light text-slate-100">62%<span className="text-sm text-amber-400 ml-2 font-medium">High</span></div>
                    </div>

                    <div className={`px-5 py-4 rounded-xl border flex flex-col snap-center min-w-[280px] sm:min-w-0 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-2 font-medium text-xs uppercase tracking-wider">
                            <DollarSign className="w-4 h-4 text-emerald-400" /> Monthly Cost
                        </div>
                        <div className="text-3xl font-light text-slate-100">$840<span className="text-sm text-red-400 ml-2 font-medium">+$45</span></div>
                    </div>

                    <div className={`px-5 py-4 rounded-xl border flex flex-col relative overflow-hidden snap-center min-w-[280px] sm:min-w-0 ${darkMode ? "bg-emerald-950/20 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" : "bg-emerald-50 border-emerald-200"}`}>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
                        <div className="flex items-center gap-2 text-emerald-500 mb-2 font-bold text-xs uppercase tracking-wider">
                            <Leaf className="w-4 h-4" /> GreenOps Impact
                        </div>
                        <div className="text-3xl font-light text-emerald-400">{greenCarbon ? (greenCarbon.total_carbon_g / 1000).toFixed(2) : '...'}<span className="text-sm ml-2 font-medium">kg CO₂e</span></div><div className="text-[10px] text-emerald-500/70 mt-1">{greenCarbon ? greenCarbon.verdict : 'Analyzing...'}</div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="flex flex-col xl:flex-row gap-6">

                    {/* LEFT COLUMN (Span 8) */}
                    <div className="flex-[2] flex flex-col gap-6 w-full min-w-0">

                        {/* Services List Panel */}
                        <section className={`rounded-xl border overflow-hidden flex flex-col ${darkMode ? "bg-white/5 border-white/10 shadow-lg shadow-black/20" : "bg-white border-slate-200 shadow-sm"}`}>
                            <div className="p-4 border-b border-inherit flex items-center justify-between bg-black/10">
                                <h2 className="text-base font-semibold flex items-center gap-2">
                                    <Server className="w-5 h-5 text-blue-400" /> Running Instances
                                </h2>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                                        <Search className="w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Search services..." className="bg-transparent border-none outline-none text-sm w-32 focus:ring-0" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                        <Play className="w-4 h-4" fill="currentColor" /> Deploy
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((service) => (
                                    <div key={service.id} className="group">
                                        <div
                                            className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4 transition-all duration-500 cursor-pointer 
                                                hover:-translate-y-0.5 hover:bg-white/[0.03]
                                                ${expandedService === service.id ? 'bg-white/[0.04]' : ''}
                                                ${service.status === 'warning' ? 'shadow-[inset_2px_0_0_rgba(251,191,36,0.5)] bg-amber-500/[0.02]' : ''}
                                                ${service.status === 'running' ? 'hover:shadow-[0_4px_20px_rgba(16,185,129,0.05)] shadow-[inset_2px_0_0_rgba(16,185,129,0.5)]' : ''}
                                                ${service.status === 'stopped' ? 'opacity-50 grayscale shadow-[inset_2px_0_0_rgba(100,116,139,0.5)]' : 'opacity-100'}
                                            `}
                                            onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                                        >
                                            <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1">
                                                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expandedService === service.id ? 'rotate-90' : ''}`} />
                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                    {service.name.includes("Data") ? <Database className="w-5 h-5" /> : service.name.includes("API") ? <Network className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{service.name}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{service.region}</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex items-center sm:justify-center gap-6 w-full sm:w-auto mt-2 sm:mt-0 pl-10 sm:pl-0">
                                                <div className="flex flex-col gap-1 w-32">
                                                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                                        <span>CPU</span>
                                                        <span className={service.cpu > 90 ? 'text-amber-400' : ''}>{service.cpu}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${
    service.cpu > 95 ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.9)]' : 
    service.cpu > 85 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]' : 
    'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'
}`} style={{ width: `${service.cpu}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-mono text-slate-400 w-16">{service.memory}</div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 w-full sm:w-48 pl-10 sm:pl-0 mt-2 sm:mt-0">
                                                <StatusBadge status={service.status} />
                                                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-0 justify-end opacity-100">
                                                    {service.status === 'stopped' ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleAction('start', service.id) }} className="px-3 py-2 sm:p-1.5 rounded bg-slate-800 sm:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-emerald-400"><Play className="w-4 h-4 " /></button>
                                                    ) : (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction('restart', service.id) }} className="px-3 py-2 sm:p-1.5 rounded bg-slate-800 sm:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-blue-400"><RotateCcw className={`w-4 h-4 ${activeAction === 'restart-' + service.id ? 'animate-spin' : ''}`} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction('stop', service.id) }} className="px-3 py-2 sm:p-1.5 rounded bg-slate-800 sm:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-red-400"><Square className="w-4 h-4" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expandable Details Area */}
                                        <AnimatePresence>
                                            {expandedService === service.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-white/5 bg-black/20 overflow-hidden"
                                                >
                                                    <div className="p-4 flex flex-col md:flex-row gap-4 md:gap-8 text-sm">
                                                        <div>
                                                            <span className="text-slate-500 text-xs block mb-1">Instance ID</span>
                                                            <span className="font-mono text-slate-300">i-0a2b4c6d8e</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 text-xs block mb-1">Uptime</span>
                                                            <span className="text-slate-300">14d 6h 22m</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 text-xs block mb-1">Est. Monthly Cost</span>
                                                            <span className="text-slate-300">${service.cost}.00</span>
                                                        </div>
                                                        <div className="md:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-0">
                                                            <button className="px-4 py-3 min-h-[44px] text-sm md:text-xs font-semibold border border-white/10 rounded-lg hover:bg-white/5 transition-colors">View Logs</button>
                                                            <button className="px-4 py-3 min-h-[44px] text-sm md:text-xs font-semibold border border-blue-500/30 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors" onClick={() => handleAction('scale', service.id)}>Scale Instance</button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Visula Architecture Map (Placeholder layout) */}
                        <section className={`rounded-xl border p-5 h-[300px] flex flex-col relative overflow-hidden ${darkMode ? "bg-slate-900 border-white/10" : "bg-slate-100 border-slate-200"}`}>
                            <div className="flex items-center justify-between mb-4 z-10 relative">
                                <h2 className="text-base font-semibold flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-purple-400" /> Topology Map
                                </h2>
                                <button className="text-xs text-blue-400 hover:text-blue-300">Expand full map ↗</button>
                            </div>

                            {/* Abstract Visual representation of infrastructure */}
                            <div className="flex-1 overflow-x-auto hide-scrollbar"><div className="min-w-[700px] h-full flex items-center justify-center relative opacity-80 pointer-events-none">
                                {/* Network Data Pulses */}
                                <div className="absolute top-[150px] left-[150px] w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] animate-[ping_3s_linear_infinite]"></div>
                                <div className="absolute top-[180px] left-[350px] w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] animate-[ping_4s_linear_infinite]"></div>

                                {/* Nodes */}
                                <div className="absolute left-10 top-1/2 -translate-y-1/2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl flex flex-col items-center gap-1 z-10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                    <Network className="w-6 h-6 text-blue-400" />
                                    <span className="text-[10px] font-mono text-blue-300">Load Balancer</span>
                                </div>

                                <div className="absolute left-1/2 top-10 -translate-x-1/2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex flex-col items-center gap-1 z-10">
                                    <Server className="w-6 h-6 text-emerald-400" />
                                    <span className="text-[10px] font-mono text-emerald-300">API Node 1</span>
                                </div>
                                <div className="absolute left-1/2 bottom-10 -translate-x-1/2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex flex-col items-center gap-1 z-10">
                                    <Server className="w-6 h-6 text-emerald-400" />
                                    <span className="text-[10px] font-mono text-emerald-300">API Node 2</span>
                                </div>

                                <div className="absolute right-10 top-1/2 -translate-y-1/2 p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl flex flex-col items-center gap-1 z-10">
                                    <Database className="w-6 h-6 text-purple-400" />
                                    <span className="text-[10px] font-mono text-purple-300">Primary DB</span>
                                </div>

                                {/* Connecting SVG Lines */}
                                <svg className="absolute inset-0 w-full h-full text-slate-700" style={{ zIndex: 0 }}>
                                    <path d="M 120 150 C 250 150, 250 80, 380 80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="animate-[pulse_4s_ease-in-out_infinite]" />
                                    <path d="M 120 150 C 250 150, 250 220, 380 220" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="animate-[pulse_3s_ease-in-out_infinite] opacity-50" />
                                    <path d="M 450 80 C 580 80, 580 150, 680 150" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="animate-[pulse_5s_ease-in-out_infinite]" />
                                    <path d="M 450 220 C 580 220, 580 150, 680 150" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="animate-[pulse_3.5s_ease-in-out_infinite] opacity-50" />
                                    <path d="M 120 150 C 250 150, 250 80, 380 80" fill="none" stroke="url(#blue-gradient)" strokeWidth="2" className="animate-[dash_3s_linear_infinite]" strokeDasharray="10 100" />
                                    <path d="M 450 80 C 580 80, 580 150, 680 150" fill="none" stroke="url(#green-gradient)" strokeWidth="2" className="animate-[dash_4s_linear_infinite]" strokeDasharray="10 100" />
                                    <defs>
                                        <linearGradient id="blue-gradient"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
                                        <linearGradient id="green-gradient"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#10b981"/></linearGradient>
                                    </defs>
                                </svg>
                                {/* Grid bg */}
                                <div className="absolute inset-0 z-[-1] opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            </div></div>
                        </section>

                    </div>

                    {/* RIGHT COLUMN (Span 4) */}
                    <div className="flex-1 flex flex-col gap-6 w-full min-w-0">

                        {/* AI Cloud Advisor */}
                        <section className={`rounded-xl border overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-indigo-900/10 to-blue-900/10 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                            <div className="p-4 border-b border-inherit flex items-center justify-between cursor-pointer" onClick={() => setAiOpen(!aiOpen)}>
                                <h2 className="text-base font-semibold flex items-center gap-2 text-blue-400">
                                    <Sparkles className="w-4 h-4" /> Cloud AI Advisor
                                </h2>
                                {aiOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>

                            <AnimatePresence>
                                {aiOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 space-y-4">
                                        {/* AI Operation Mode Toggle */}
                                        <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5 text-xs mb-2">
                                            <span className="text-slate-400 font-medium ml-2">Execution Mode:</span>
                                            <div className="flex bg-black/40 rounded-md p-1">
                                                {['Manual', 'Assisted', 'Auto'].map(mode => (
                                                    <button key={mode} onClick={() => setAiMode(mode as any)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${aiMode === mode ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>{mode}</button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Activity Log Map */}
                                        {aiLogs.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-2 flex items-center gap-2"><Activity className="w-3 h-3"/> Recent AI Actions</h4>
                                                <div className="space-y-1">
                                                    <AnimatePresence>
                                                    {aiLogs.slice(0, 2).map(log => (
                                                        <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} key={log.id} className="text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-300 py-1.5 px-3 rounded flex justify-between">
                                                            <span>[AI] {log.action} {log.service}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="opacity-50">{log.time}</span>
                                                                <button onClick={() => setAiLogs(prev => prev.filter(l => l.id !== log.id))} className="text-blue-400 hover:text-white underline text-[10px]">Undo</button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`p-4 md:p-3 rounded-xl border flex gap-4 md:gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${darkMode ? "bg-black/30 border-white/5 hover:border-emerald-500/30 hover:shadow-emerald-500/10" : "bg-white border-slate-200"}`}>
                                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-2">Cost Optimization <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">98% Match</span></h4>
                                                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">Data Ingestion Worker has been idle for 72 hours. Terminate to save $80/month.</p>
                                                <button className="mt-2 text-xs uppercase tracking-wider font-bold text-emerald-400 hover:text-emerald-300 transition-colors min-h-[36px] bg-emerald-500/10 px-3 rounded w-full flex items-center justify-center gap-2" onClick={() => handleAction('decommission', 'srv-4')}>Execute Action</button>
                                            </div>
                                        </div>
                                        <div className={`p-4 md:p-3 rounded-xl border flex gap-4 md:gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${darkMode ? "bg-black/30 border-white/5 hover:border-amber-500/30 hover:shadow-amber-500/10" : "bg-white border-slate-200"}`}>
                                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-2">Performance Risk <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">85% Match</span></h4>
                                                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">Redis Cache is consistently hitting 95% CPU during peak hours. Recommend horizontal scaling.</p>
                                                <button className="mt-2 text-xs uppercase tracking-wider font-bold text-amber-400 hover:text-amber-300 transition-colors min-h-[36px] bg-amber-500/10 px-3 rounded w-full flex items-center justify-center gap-2" onClick={() => handleAction('scale', 'srv-3')}>Auto-Scale Nodes</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Recent Alerts Feed */}
                        <section className={`rounded-xl border p-4 flex-1 flex flex-col ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                            <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                                <Bell className="w-4 h-4 text-slate-400" /> Infrastructure Events
                            </h2>
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="flex gap-3 text-sm">
                                        <div className="mt-0.5">
                                            {alert.severity === 'high' ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> :
                                                alert.severity === 'medium' ? <div className="w-2 h-2 rounded-full bg-amber-500"></div> :
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                        </div>
                                        <div>
                                            <p className="text-slate-300 text-xs mb-0.5">{alert.message}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{alert.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 w-full py-2 rounded border border-white/5 text-xs text-slate-400 hover:bg-white/5 transition-colors font-medium">View All Events</button>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
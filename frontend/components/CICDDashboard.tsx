import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastProvider";
import { NotificationBell } from "./NotificationBell";
import { 
    Activity, Clock, AlertCircle, CheckCircle, XCircle, Terminal, 
    Search, Play, Square, RotateCcw, Filter, ChevronDown, ChevronUp,
    Sun, Moon, Bell, Database, Server, Zap, Shield, Sparkles, Bot, Wrench, GitBranch, ExternalLink, X 
} from "lucide-react";
import { fetchPipelines, triggerPipeline, applyPatch, WS_BASE, triggerPipelineAction } from "../lib/api";

const MOCK_LOGS = [
    "[10:42:01] 🚀 Starting pipeline execution for Backend Deploy (Prod)",
    "[10:42:02] 📦 Fetching repository repository... done.",
    "[10:42:05] 🔍 Running security static analysis (SAST)...",
    "[10:42:15] ✅ No high-severity vulnerabilities found.",
    "[10:42:16] 🔨 Building Docker image backend:v2.4.1-rc...",
    "[10:43:01] 🐋 Step 1/8: FROM python:3.11-slim",
    "[10:43:22] 🐋 Step 4/8: RUN pip install -r requirements.txt",
    "[10:43:55] ⚠️ WARNING: Some dependencies are outdated. Consider updating 'pydantic'.",
    "[10:44:10] ✅ Image built successfully.",
    "[10:44:11] 🚀 Pushing to container registry...",
];

export default function CICDDashboard({ onBack }: { onBack: () => void }) {
    const { addToast, showModal } = useToast();
    const [darkMode, setDarkMode] = useState(true);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [logs, setLogs] = useState(MOCK_LOGS);
    const [aiOpen, setAiOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [patchState, setPatchState] = useState<'idle' | 'preview' | 'applying' | 'success' | 'failed'>('idle');
    const [patchResult, setPatchResult] = useState<any>(null);
    const [liveLogState, setLiveLogState] = useState<'idle' | 'running' | 'success'>('idle');
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [activeModule, setActiveModule] = useState('All Modules');
    const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        const load = async () => {
            const data = await fetchPipelines();
            if (data && data.length > 0) setPipelines(data);
            setLoading(false);
        };
        load();

        const socket = new WebSocket(`${WS_BASE}/pipeline`);
        socket.onmessage = (event) => {
            try {
                const wsData = JSON.parse(event.data);
                if (wsData.type === "pipeline_update") {
                    const status = wsData.status;
                    if (status === 'success' || status === 'failed') {
                        setLiveLogState(status);
                        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${status === 'success' ? '🎉 GitLab Runner completed successfully.' : '❌ GitLab Runner failed.'}`]);
                    }
                    setPipelines(prev => {
                        const exists = prev.find(p => String(p.id) === String(wsData.pipeline_id));
                        if (exists) {
                            return prev.map(p => String(p.id) === String(wsData.pipeline_id) ? { ...p, status: wsData.status } : p);
                        } else {
                            load();
                            return prev;
                        }
                    });
                }
            } catch (err) {}
        };
        return () => socket.close();
    }, []);

    useEffect(() => {
        if (liveLogState !== 'running') return;
        const tasks = [
            "🤖 AI Agent: Reviewing failure logs...",
            "🤖 AI Agent: Applying optimization strategy...",
            "📦 Synchronizing branch structure with origin/main...",
            "⚙️ Injecting AI architectural patches..."
        ];
        let step = 0;
        const initInterval = setInterval(() => {
            if (step < tasks.length) {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${tasks[step]}`]);
                step++;
            } else {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏳ Waiting for GitLab Runner execution & webhook confirmation...`]);
                clearInterval(initInterval);
            }
        }, 2000);
        return () => clearInterval(initInterval);
    }, [liveLogState]);

    const handleAction = async (action: string, id: string) => {
        showModal({
            title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            content: `Are you sure you want to ${action} pipeline ${id}? This action will execute remotely.`,
            onConfirm: async () => {
                setActiveAction(`${action}-${id}`);
                try {
                    await triggerPipelineAction(id, action);
                    addToast(`Pipeline ${id} ${action} operation successful.`, 'success');
                    
                    setPipelines(prev => prev.map(p => {
                        if (p.id === id) {
                            if (action === 'cancel') return { ...p, status: 'failed' };
                            if (action === 'trigger' || action === 'retry') return { ...p, status: 'running' };
                        }
                        return p;
                    }));
                } catch (e) {
                    addToast(`Pipeline action failed.`, 'error');
                } finally {
                    setActiveAction(null);
                }
            }
        });
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "success": return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-100 text-emerald-700 border-emerald-300"}`}><CheckCircle className="w-3.5 h-3.5" /> Success</span>;
            case "running": return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-100 text-blue-800 border-blue-300"}`}><Activity className="w-3.5 h-3.5 animate-pulse" /> Running</span>;
            case "failed": return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${darkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-100 text-red-700 border-red-300"}`}><XCircle className="w-3.5 h-3.5" /> Failed</span>;
            case "warning": return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-100 text-amber-800 border-amber-300"}`}><AlertCircle className="w-3.5 h-3.5" /> Warning</span>;
            default: return null;
        }
    };

    return (
        <div className={`min-h-screen w-full flex flex-col font-sans transition-all duration-500 ease-in-out ${darkMode ? "bg-[#050505] text-slate-200" : "bg-slate-50 text-black font-medium"}`}>
            <header className={`sticky top-0 z-50 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md ${darkMode ? "border-white/10 bg-[#050505]/80" : "border-slate-200 bg-white/80"}`}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight hidden sm:block">SynAegis</span>
                    </div>
                    <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <button onClick={onBack} className="hover:text-cyan-400 transition-colors">Workspace</button>
                        <span>/</span>
                        <span className={darkMode ? "text-slate-200" : "text-black"}>CI/CD Pipeline</span>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell darkMode={darkMode} />
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors">
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row gap-6 mb-2">
                    <div className="flex-1">
                        <h1 className="text-3xl font-light tracking-tight mb-2">Pipeline Integrity</h1>
                        <p className={darkMode ? "text-slate-400" : "text-slate-600 font-medium"}>Monitor, manage, and optimize your deployment workflows.</p>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        <div className={`shrink-0 px-5 py-3 rounded-2xl border flex flex-col justify-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Success Rate</span>
                            <div className="flex items-end gap-2 text-2xl font-light">
                                94.2% <span className="text-sm text-emerald-400 font-medium mb-1">+secondary</span>
                            </div>
                        </div>
                        <div className={`shrink-0 px-5 py-3 rounded-2xl border flex flex-col justify-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Carbon Impact</span>
                            <div className="flex items-end gap-2 text-2xl font-light">
                                1.4kg <span className="text-sm text-emerald-400 font-medium mb-1">Optimal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8 flex flex-col gap-6 w-full">
                        <section className={`rounded-2xl border flex flex-col ${darkMode ? "bg-white/5 border-white/10 shadow-lg shadow-black/20" : "bg-white border-slate-200 shadow-sm"}`}>
                            <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-lg font-medium flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-cyan-500" /> Active Pipelines
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div
                                            onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border cursor-pointer select-none transition-colors ${darkMode ? "bg-black/50 border-white/10 hover:bg-white/5" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                                        >
                                            <Filter className="w-4 h-4 text-slate-500" />
                                            <span className="text-slate-500">{activeModule}</span>
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <AnimatePresence>
                                            {moduleDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className={`absolute top-full right-0 sm:left-0 mt-2 w-40 py-1 rounded-xl border shadow-xl z-50 ${darkMode ? "bg-[#111] border-white/10" : "bg-white border-slate-200"}`}
                                                >
                                                    {['All Modules', 'Frontend', 'Backend', 'Data Pipeline'].map(mod => (
                                                        <div
                                                            key={mod}
                                                            onClick={() => { setActiveModule(mod); setModuleDropdownOpen(false); }}
                                                            className={`px-4 py-2 text-sm cursor-pointer transition-colors ${activeModule === mod ? "text-cyan-400 bg-cyan-500/10" : darkMode ? "text-slate-400 hover:bg-white/5 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50"}`}
                                                        >
                                                            {mod}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <button onClick={async () => {
                                        addToast?.("Pipeline successfully triggered on GitLab!", "success");
                                        setLiveLogState('running');
                                        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚀 Initiating Manual Pipeline Trigger...`]);
                                        await triggerPipelineAction('manual', 'run');
                                    }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-500/20 whitespace-nowrap">
                                        Run Pipeline
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 flex flex-col gap-4">
                                {loading ? (
                                    <div className="text-center text-slate-500 animate-pulse py-8">Syncing Pipeline Data with GitLab...</div>
                                ) : pipelines.length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">No pipelines running or available.</div>
                                ) : pipelines.filter(p => activeModule === 'All Modules' || (p.name && p.name.includes(activeModule))).map((pipe: any) => (
                                    <div key={pipe.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${darkMode ? "bg-black/20 border-white/5 hover:bg-white/5" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1">
                                            <div className="flex flex-col gap-1 min-w-[200px]">
                                                <div className="font-medium text-base">{pipe.name || `Pipeline #${pipe.id}`}</div>
                                                <div className={`text-xs flex items-center gap-1 ${darkMode ? "text-slate-500" : "text-slate-500/80 font-medium"}`}>
                                                    <Clock className="w-3 h-3" /> {pipe.triggeredBy || "Auto-Trigger"}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className={`font-mono text-xs ${darkMode ? "text-slate-400" : "text-slate-600 font-semibold"}`}>{pipe.commit || pipe.ref || "HEAD"}</div>
                                                <StatusBadge status={pipe.status} />
                                                <div className={`font-medium text-sm hidden md:block ${darkMode ? "text-slate-400" : "text-slate-900 font-medium"}`}>{pipe.duration || "N/A"}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-inherit">
                                            {pipe.status === "failed" || pipe.status === "warning" ? (
                                                <button onClick={() => handleAction("retry", pipe.id)} className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-2 ${darkMode ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"}`}>
                                                    <RotateCcw className={`w-4 h-4 ${activeAction === `retry-${pipe.id}` ? "animate-spin text-cyan-500" : "text-cyan-500"}`} />
                                                    <span className="text-xs font-medium">Retry</span>
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAction("trigger", pipe.id)} className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-2 ${darkMode ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"}`}>
                                                    <Play className={`w-4 h-4 ${activeAction === `trigger-${pipe.id}` ? "text-emerald-500 fill-emerald-500" : "text-emerald-500"}`} />
                                                    <span className="text-xs font-medium">Trigger</span>
                                                </button>
                                            )}
                                            <button onClick={() => handleAction("cancel", pipe.id)} className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-2 ${darkMode ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"}`}>
                                                <Square className={`w-4 h-4 ${activeAction === `cancel-${pipe.id}` ? "text-red-500 fill-red-500" : "text-red-500"}`} />
                                                <span className="text-xs font-medium">Stop</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={`rounded-2xl border flex flex-col overflow-hidden h-[400px] ${darkMode ? "bg-black/40 border-slate-800 shadow-inner" : "bg-slate-900 border-slate-800"}`}>
                            <div className="p-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-400 bg-slate-950">
                                <div className="flex items-center gap-3">
                                    <Terminal className="w-4 h-4" />
                                    <span className="text-sm font-mono tracking-wider">LIVE LOGS: Backend Deploy (Prod)</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-slate-800 w-full sm:w-auto">
                                    <Search className="w-3.5 h-3.5" />
                                    <input
                                        type="text"
                                        placeholder="Filter logs..."
                                        className="bg-transparent border-none outline-none text-xs w-full sm:w-32 font-mono"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed hide-scrollbar">
                                {logs.filter(l => l.toLowerCase().includes(searchQuery.toLowerCase())).map((log, i) => {
                                    const isWarning = log.includes("WARNING");
                                    const isError = log.includes("ERROR");
                                    const isSuccess = log.includes("✅");
                                    return (
                                        <div key={i} className={`mb-1 hover:bg-white/[0.02] px-1 rounded transition-colors break-words ${isWarning ? "text-amber-400" : isError ? "text-red-400" : isSuccess ? "text-emerald-400" : "text-slate-300"}`}>
                                            {log}
                                        </div>
                                    )
                                })}
                                <div ref={logsEndRef} className="h-4"></div>
                            </div>
                        </section>
                    </div>

                    <div className="xl:col-span-4 flex flex-col gap-6 w-full">
                        <section className={`rounded-2xl border overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-b from-blue-900/10 to-indigo-900/5 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                            <div className="p-5 border-b border-inherit flex items-center justify-between cursor-pointer" onClick={() => setAiOpen(!aiOpen)}>
                                <h2 className="text-lg font-medium flex items-center gap-2 text-cyan-500">
                                    <Sparkles className="w-5 h-5" /> AI Pipeline Optimizations
                                </h2>
                                {aiOpen ? <ChevronUp className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-900 font-medium"}`} /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>
                            <AnimatePresence>
                                {aiOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 pt-0 mt-5">
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 mt-0.5"><Zap className="w-4 h-4" /></div>
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Caching Optimization</h4>
                                                        <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                                                            Your Node modules step takes 45% of time. A persistent cache layer will reduce build times by ~2m.
                                                        </p>
                                                        <button onClick={() => setPatchState('preview')} className="mt-3 text-xs font-medium text-cyan-500 hover:text-cyan-400 transition-colors flex items-center gap-1">Apply Patch →</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5"><CheckCircle className="w-4 h-4" /></div>
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Image Size Reduction</h4>
                                                        <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                                                            Use Distroless images for prod to reduce container attack surface and save 120MB per build.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        <section className={`rounded-2xl border p-5 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-400" /> Infrastructure Runners
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={darkMode ? "text-slate-400" : "text-slate-600 font-medium"}>linux-amd64-large (Auto)</span>
                                        <span className="font-medium">4/10 active</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div className="h-full bg-cyan-400 rounded-full w-[40%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={darkMode ? "text-slate-400" : "text-slate-600 font-medium"}>linux-arm64-standard</span>
                                        <span className="font-medium">8/10 active</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full w-[80%]"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <AnimatePresence>
                            {patchState !== 'idle' && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col ${darkMode ? "bg-[#0B0F19] border-white/10" : "bg-white border-slate-200"} my-auto`}>
                                        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-cyan-400" /> AI Semantic Patch Action
                                            </h3>
                                            {patchState !== 'applying' && (
                                                <button onClick={() => setPatchState('idle')} className={`text-slate-400 transition-colors ${darkMode ? "hover:text-white" : "hover:text-slate-800"}`}><X className="w-5 h-5" /></button>
                                            )}
                                        </div>

                                        <div className="p-4 sm:p-6">
                                            {patchState === 'preview' && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Bot className="w-6 h-6" /></div>
                                                            <div>
                                                                <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Root Cause Identified</div>
                                                                <div className={`font-medium text-lg ${darkMode ? "text-white" : "text-black"}`}>Cache Miss / Dependency Conflict</div>
                                                            </div>
                                                        </div>
                                                        <div className="sm:text-right">
                                                            <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>AI Confidence Score</div>
                                                            <div className="font-medium text-xl text-emerald-400 font-mono">92%</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h4 className={`font-medium mb-1 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${darkMode ? "text-white" : "text-black"}`}>
                                                            <span>Proposed Fix Context</span>
                                                            <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 w-fit">Auto-Apply Recommended</span>
                                                        </h4>
                                                        <p className={`text-sm leading-relaxed p-3 rounded-lg border ${darkMode ? "text-slate-400 bg-white/5 border-white/5" : "text-slate-600 bg-slate-50 border-slate-200"}`}>
                                                            The persistent layer ignores <code className="text-cyan-300">node_modules</code>. By explicitly caching this trajectory and using <code className="text-cyan-300">npm ci</code>, you reduce overhead blocktime.
                                                        </p>
                                                    </div>

                                                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                                                        <h4 className={`font-medium mb-2 text-sm ${darkMode ? "text-white" : "text-black"}`}>Code Diff Generated</h4>
                                                        <pre className="text-xs font-mono p-3 rounded-lg bg-[#0d1117] text-slate-300 overflow-x-auto border border-white/10 shadow-inner">
                                                            <code className="text-red-400">- RUN npm install</code><br />
                                                            <code className="text-emerald-400">+ RUN npm ci --omit=dev --legacy-peer-deps</code><br />
                                                            <code className="text-emerald-400">+ ENV NODE_OPTIONS="--max-old-space-size=4096"</code><br />
                                                            <code className="text-slate-400">  cache:</code><br/>
                                                            <code className="text-slate-400">    paths:</code><br/>
                                                            <code className="text-slate-400">      - node_modules/</code>
                                                        </pre>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-4">
                                                        <label className={`flex items-center gap-2 cursor-pointer text-sm w-full sm:w-auto ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-800"}`}>
                                                            <input type="checkbox" className="rounded bg-black/50 border-slate-600 text-cyan-500 focus:ring-cyan-500" defaultChecked />
                                                            <span>Set as Rule for future errors</span>
                                                        </label>
                                                        <div className="flex justify-end gap-3 w-full sm:w-auto">
                                                            <button onClick={() => setPatchState('idle')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${darkMode ? "hover:bg-white/5 text-white" : "hover:bg-slate-100 text-slate-700"}`}>Cancel</button>
                                                            <button onClick={async () => {
                                                                setPatchState('applying');
                                                                try {
                                                                    const res = await applyPatch("pipe-ai", "Cache Miss", "main", "feature/ai-patch");
                                                                    setPatchResult(res);
                                                                    setLiveLogState('running');
                                                                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🧠 Triggering SynAegis GitOps workflow...`]);
                                                                    setTimeout(() => setPatchState('success'), 3500);
                                                                } catch (e) { setPatchState('failed'); }
                                                            }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 w-full sm:w-auto">
                                                                <Wrench className="w-4 h-4" /> Apply Fix
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {patchState === 'applying' && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center justify-center space-y-6">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center"><GitBranch className="w-6 h-6 text-cyan-400 animate-pulse" /></div>
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        <h4 className={`text-lg font-medium ${darkMode ? "text-white" : "text-black"}`}>Executing GitOps Sequence</h4>
                                                        <div className="text-sm text-slate-400 h-6 overflow-hidden relative w-64 mx-auto border border-white/5 bg-black/20 rounded-md">
                                                            <motion.div animate={{ y: [0, -24, -48, -72, -72] }} transition={{ duration: 3.5, times: [0, 0.25, 0.5, 0.8, 1], ease: "easeInOut" }} className="flex flex-col space-y-0 text-center">
                                                                <span className="h-6 leading-6">Creating fix branch...</span>
                                                                <span className="h-6 leading-6 text-cyan-400">Committing generated patch...</span>
                                                                <span className="h-6 leading-6 text-blue-400">Opening Merge Request...</span>
                                                                <span className="h-6 leading-6 text-emerald-400">Triggering GitLab Runner...</span>
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {patchState === 'success' && (
                                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6 flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                        <CheckCircle className="w-8 h-8" />
                                                    </div>
                                                    <h4 className={`text-xl font-medium text-center ${darkMode ? "text-white" : "text-black"}`}>Patch Successfully Deployed</h4>
                                                    <p className={`text-center text-sm max-w-md ${darkMode ? "text-slate-400" : "text-slate-900 font-medium"}`}>
                                                        The AI infrastructure fix was committed to a new branch, manually reviewed, and a Merge Request has been seamlessly integrated.
                                                    </p>
                                                    <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
                                                        {patchResult?.mr_url && (
                                                            <a href={patchResult.mr_url} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-5 py-2.5 border border-slate-700 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                                                <ExternalLink className="w-4 h-4" /> View PR
                                                            </a>
                                                        )}
                                                        <button onClick={() => { setPatchState('idle'); addToast?.("Streaming live status of the patched pipeline.", "success"); }} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                                            Return to Dashboard
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

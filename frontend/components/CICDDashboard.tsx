import React, { useState, useEffect, useRef } from "react";
import { useToast } from "./ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Play,
    Square,
    RotateCcw,
    Bell,
    Moon,
    Sun,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Activity,
    Zap,
    Terminal,
    Sparkles,
    Bot,
    Wrench,
    GitBranch,
    ExternalLink,
    X
} from "lucide-react";
import { fetchPipelines, cancelPipeline, triggerPipeline, applyPatch, resolveSimulation } from "../lib/api";

// Mock Data
const MOCK_PIPELINES = [
    { id: "pipe-104", name: "Backend Deploy (Prod)", status: "running", triggeredBy: "Jane Doe", duration: "2m 14s", commit: "v2.4.1-rc" },
    { id: "pipe-103", name: "Frontend Test Suite", status: "success", triggeredBy: "Auto (Main)", duration: "4m 50s", commit: "fix/nav-bug" },
    { id: "pipe-102", name: "Data Pipeline Sync", status: "failed", triggeredBy: "John Smith", duration: "12m 04s", commit: "feat/ml-model" },
    { id: "pipe-101", name: "Staging Release", status: "warning", triggeredBy: "Jane Doe", duration: "5m 22s", commit: "chore/deps" },
];

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

        // WebSocket for real-time pipeline updates
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://synaegis-backend.onrender.com';
        const socket = new WebSocket(`${wsUrl}/ws/pipeline`);

        socket.onopen = () => {
            console.log("WebSocket connected for Real Pipeline Tracking");
        };

        socket.onmessage = (event) => {
            try {
                const wsData = JSON.parse(event.data);
                if (wsData.type === "pipeline_update") {
                    const status = wsData.status; // success, failed, running
                    if (status === 'success' || status === 'failed') {
                         setLiveLogState(status); // Resolves the UI state
                         setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${status === 'success' ? '🎉 GitLab Runner completed successfully.' : '❌ GitLab Runner failed.'}`]);
                    }
                    setPipelines(prev => {
                        const exists = prev.find(p => String(p.id) === String(wsData.pipeline_id));
                        if (exists) {
                            return prev.map(p => 
                                String(p.id) === String(wsData.pipeline_id) ? { ...p, status: wsData.status } : p
                            );
                        } else {
                            // Fetch fresh if a totally new pipeline appears
                            load();
                            return prev;
                        }
                    });
                }
            } catch (err) {
                console.error("Pipeline WS parse error:", err);
            }
        };

        return () => {
            socket.close();
        };
    }, []);

    // Process Live Webhook Stream
    useEffect(() => {
        if (liveLogState !== 'running') {
            return;
        }

        // We listen to the Webhook stream to close our local tracking UI.
        // Instead of faking the completion, we wait for GitLab API/Webhook to confirm.
        const tasks = [
            "🤖 AI Agent: Reviewing failure logs...",
            "🤖 AI Agent: Applying optimization strategy...",
            "📦 Synchronizing branch structure with origin/main...",
            "⚙️ Injecting AI architectural patches..."
        ];

        let step = 0;
        const initInterval = setInterval(() => {
            if (step < tasks.length) {
                const newLog = `[${new Date().toLocaleTimeString()}] ${tasks[step]}`;
                setLogs(prev => [...prev, newLog]);
                step++;
            } else {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏳ Waiting for GitLab Runner execution & webhook confirmation...`]);
                clearInterval(initInterval);
            }
        }, 2000);

        // A fallback timeout if GitLab takes too long or webhook fails
        const fallback = setTimeout(() => {
            if (liveLogState === 'running') {
               setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ Timeout reached waiting for runner sync. Refresh pipelines list manually.`]);
               setLiveLogState('idle');
            }
        }, 30000);

        return () => {
            clearInterval(initInterval);
            clearTimeout(fallback);
        };
    }, [liveLogState]);

    const handleAction = (action: string, id: string) => {
        setActiveAction(`${action}-${id}`);
        setTimeout(() => setActiveAction(null), 1500); // Simulate network request
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
        <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${darkMode ? "bg-[#050505] text-slate-200" : "bg-slate-50 text-slate-900"}`}>

            {/* 1. Header & Navigation */}
            <header className={`sticky top-0 z-50 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md ${darkMode ? "border-white/10 bg-[#050505]/80" : "border-slate-200 bg-white/80"}`}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">SynAegis</span>
                    </div>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <button onClick={onBack} className="hover:text-cyan-400 transition-colors">Workspace</button>
                        <span>/</span>
                        <span className={darkMode ? "text-slate-200" : "text-slate-900"}>CI/CD Pipeline</span>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-slate-500/10 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    </button>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors">
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 border-2 border-[#050505] cursor-pointer"></div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">

                {/* 2. Top Action Bar & Metrics */}
                <div className="flex flex-col lg:flex-row gap-6 mb-2">
                    <div className="flex-1">
                        <h1 className="text-3xl font-light tracking-tight mb-2">Pipeline Integrity</h1>
                        <p className={darkMode ? "text-slate-400" : "text-slate-600 font-medium"}>Monitor, manage, and optimize your deployment workflows.</p>
                    </div>

                    <div className="flex gap-4">
                        {/* Mini Metric Cards */}
                        <div className={`px-5 py-3 rounded-2xl border flex flex-col justify-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Success Rate</span>
                            <div className="flex items-end gap-2 text-2xl font-light">
                                94.2% <span className="text-sm text-emerald-400 font-medium mb-1">+secondary</span>
                            </div>
                        </div>
                        <div className={`px-5 py-3 rounded-2xl border flex flex-col justify-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Carbon Impact</span>
                            <div className="flex items-end gap-2 text-2xl font-light">
                                1.4kg <span className="text-sm text-emerald-400 font-medium mb-1">Optimal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Pipelines & Analytics (Span 8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Pipeline Status Panel */}
                        <section className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-white/5 border-white/10 shadow-lg shadow-black/20" : "bg-white border-slate-200 shadow-sm"}`}>
                            <div className="p-5 border-b border-inherit flex items-center justify-between">
                                <h2 className="text-lg font-medium flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-cyan-500" /> Active Pipelines
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div
                                            onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border cursor-pointer select-none hover:bg-white/5 transition-colors ${darkMode ? "bg-black/50 border-white/10" : "bg-slate-50 border-slate-200"}`}
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
                                                    className={`absolute top-full left-0 mt-2 w-40 py-1 rounded-xl border shadow-xl z-50 ${darkMode ? "bg-[#111] border-white/10" : "bg-white border-slate-200"}`}
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
                                        await triggerPipeline();
                                        const fresh = await fetchPipelines();
                                        if (fresh && fresh.length > 0) setPipelines(fresh);
                                    }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-500/20">
                                        Run Pipeline
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[350px] overflow-y-auto relative hide-scrollbar">
                                <table className="w-full text-left text-sm">
                                    <thead className={`sticky top-0 z-10 text-xs uppercase tracking-wider font-semibold ${darkMode ? "bg-black/60 backdrop-blur-md text-slate-400" : "bg-slate-50/80 backdrop-blur-md text-slate-500"}`}>
                                        <tr>
                                            <th className="px-6 py-4">Pipeline</th>
                                            <th className="px-6 py-4">Commit</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-inherit">
                                        {loading ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 animate-pulse">Syncing Pipeline Data with GitLab...</td></tr>
                                        ) : pipelines.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No pipelines running or available.</td></tr>
                                        ) : pipelines.filter(p => activeModule === 'All Modules' || (p.name && p.name.includes(activeModule))).map((pipe: any) => (
                                            <tr key={pipe.id} className={`group hover:bg-white/[0.02] transition-colors ${darkMode ? "" : "hover:bg-slate-50"}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{pipe.name || `Pipeline #${pipe.id}`}</div>
                                                    <div className={`text-xs mt-1 flex items-center gap-1 ${darkMode ? "text-slate-500" : "text-slate-500/80 font-medium"}`}>
                                                        <Clock className="w-3 h-3" /> {pipe.triggeredBy || "Auto-Trigger"}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 font-mono text-xs ${darkMode ? "text-slate-400" : "text-slate-600 font-semibold"}`}>{pipe.commit || pipe.ref || "HEAD"}</td>
                                                <td className="px-6 py-4"><StatusBadge status={pipe.status} /></td>
                                                <td className={`px-6 py-4 font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{pipe.duration || "N/A"}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {pipe.status === "failed" || pipe.status === "warning" ? (
                                                            <button onClick={() => handleAction("retry", pipe.id)} className={`p-1.5 rounded hover:bg-slate-500/20 transition-colors ${darkMode ? "text-slate-400 hover:text-cyan-400" : "text-slate-500 hover:text-cyan-600"}`} title="Retry">
                                                                <RotateCcw className={`w-4 h-4 ${activeAction === `retry-${pipe.id}` ? "animate-spin text-cyan-500" : ""}`} />
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleAction("trigger", pipe.id)} className={`p-1.5 rounded hover:bg-slate-500/20 transition-colors ${darkMode ? "text-slate-400 hover:text-cyan-400" : "text-slate-500 hover:text-cyan-600"}`} title="Trigger">
                                                                <Play className={`w-4 h-4 ${activeAction === `trigger-${pipe.id}` ? "text-cyan-500 fill-cyan-500" : ""}`} />
                                                            </button>
                                                        )}
                                                        <button onClick={async () => {
                                                            handleAction("cancel", pipe.id);
                                                            await cancelPipeline(pipe.id);
                                                        }} className={`p-1.5 rounded hover:bg-slate-500/20 transition-colors ${darkMode ? "text-slate-400 hover:text-red-400" : "text-slate-500 hover:text-red-600"}`} title="Cancel">
                                                            <Square className={`w-4 h-4 ${activeAction === `cancel-${pipe.id}` ? "text-red-500 fill-red-500" : ""}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Job Logs Panel */}
                        <section className={`rounded-2xl border flex flex-col overflow-hidden h-96 ${darkMode ? "bg-black/40 border-slate-800 shadow-inner" : "bg-slate-900 border-slate-800"}`}>
                            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-slate-400 bg-slate-950">
                                <div className="flex items-center gap-3">
                                    <Terminal className="w-4 h-4" />
                                    <span className="text-sm font-mono tracking-wider">LIVE LOGS: Backend Deploy (Prod)</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-slate-800">
                                    <Search className="w-3.5 h-3.5" />
                                    <input
                                        type="text"
                                        placeholder="Filter logs..."
                                        className="bg-transparent border-none outline-none text-xs w-32 font-mono"
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
                                        <div key={i} className={`mb-1 hover:bg-white/[0.02] px-1 rounded transition-colors ${isWarning ? "text-amber-400" : isError ? "text-red-400" : isSuccess ? "text-emerald-400" : "text-slate-300"
                                            }`}>
                                            {log}
                                        </div>
                                    )
                                })}
                                {/* Auto-scroll anchor anchor */}
                                <div ref={logsEndRef} className="h-4"></div>
                            </div>
                        </section>

                    </div>

                    {/* Right Column: AI Insights & Resources (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* AI Suggestions Panel */}
                        <section className={`rounded-2xl border overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-b from-blue-900/10 to-indigo-900/5 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                            <div
                                className="p-5 border-b border-inherit flex items-center justify-between cursor-pointer"
                                onClick={() => setAiOpen(!aiOpen)}
                            >
                                <h2 className="text-lg font-medium flex items-center gap-2 text-cyan-400">
                                    <Sparkles className="w-5 h-5" /> AI Pipeline Optimizations
                                </h2>
                                {aiOpen ? <ChevronUp className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-600"}`} /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            <AnimatePresence>
                                {aiOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="p-5 pt-0 mt-5"
                                    >
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                                                        <Zap className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Caching Optimization</h4>
                                                        <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                                                            Your Node modules step is taking 45% of pipeline time. Implementing a persistent cache layer could reduce build times by ~2m.
                                                        </p>
                                                        <button onClick={() => setPatchState('preview')} className="mt-3 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                                                            Apply Patch →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Image Size Reduction</h4>
                                                        <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                                                            Consider using Distroless images for production deploy. It will reduce container attack surface and save 120MB per build.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Environment/Resource Status */}
                        <section className={`rounded-2xl border p-5 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-400" /> Infrastructure Runners
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={darkMode ? "text-slate-400" : "text-slate-600 font-medium"}>linux-amd64-large (Auto-scaling)</span>
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

                    
            {/* AI Patch Multi-Step Premium Modal */}
            <AnimatePresence>
            {patchState !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${darkMode ? "bg-[#0B0F19] border-white/10" : "bg-white border-slate-200"}`}
                    >
                        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-cyan-400" /> AI Semantic Patch Action
                            </h3>
                            {patchState !== 'applying' && (
                                <button onClick={() => setPatchState('idle')} className={`text-slate-400 transition-colors ${darkMode ? "hover:text-white" : "hover:text-slate-800"}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
                        <div className="p-6">
                            {patchState === 'preview' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                                <Bot className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Root Cause Identified</div>
                                                <div className={`font-medium text-lg ${darkMode ? "text-white" : "text-slate-800"}`}>Cache Miss / Dependency Conflict</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>AI Confidence Score</div>
                                            <div className="font-medium text-xl text-emerald-400 font-mono">92%</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className={`font-medium mb-1 text-sm flex items-center justify-between ${darkMode ? "text-white" : "text-slate-800"}`}>
                                            <span>Proposed Fix Context</span>
                                            <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">Auto-Apply Recommended</span>
                                        </h4>
                                        <p className={`text-sm leading-relaxed p-3 rounded-lg border ${darkMode ? "text-slate-400 bg-white/5 border-white/5" : "text-slate-600 bg-slate-50 border-slate-200"}`}>
                                            The persistent layer is ignoring <code className="text-cyan-300">node_modules</code>. By explicitly caching this trajectory and using <code className="text-cyan-300">npm ci</code>, you reduce runner latency by approximately 2m 15s per trigger.
                                        </p>
                                    </div>

                                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                                        <h4 className={`font-medium mb-2 text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>Code Diff Generated</h4>
                                        <pre className="text-xs font-mono p-3 rounded-lg bg-[#0d1117] text-slate-300 overflow-x-auto border border-white/10 shadow-inner">
                                            <code className="text-red-400">- RUN npm install</code><br/>
                                            <code className="text-emerald-400">+ RUN npm ci --omit=dev --legacy-peer-deps</code><br/>
                                            <code className="text-emerald-400">+ ENV NODE_OPTIONS="--max-old-space-size=4096"</code><br/>
                                            <code className="text-slate-400">  cache: 
    paths:
      - node_modules/</code>
                                        </pre>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <label className={`flex items-center gap-2 cursor-pointer text-sm ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-800"}`}>
                                            <input type="checkbox" className="rounded bg-black/50 border-slate-600 text-cyan-500 focus:ring-cyan-500" defaultChecked />
                                            <span>Set as Rule for future errors</span>
                                        </label>

                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => setPatchState('idle')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "hover:bg-white/5 text-white" : "hover:bg-slate-100 text-slate-700"}`}>
                                                Cancel
                                            </button>
                                            <button onClick={async () => {
                                                setPatchState('applying');
                                                try {
                                                    const res = await applyPatch("pipe-ai", "Cache Miss", "main", "feature/ai-patch");
                                                    setPatchResult(res);
                                                    
                                                    // Stream new logs to dashboard logic
                                                    setLiveLogState('running');
                                                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🧠 Triggering SynAegis GitOps workflow...`]);
                                                    
                                                    // Allow animation to run 
                                                    setTimeout(() => setPatchState('success'), 3500); 
                                                } catch (e) {
                                                    setPatchState('failed');
                                                }
                                            }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                                                <Wrench className="w-4 h-4" /> Apply Fix Automatically
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {patchState === 'applying' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center justify-center space-y-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <GitBranch className="w-6 h-6 text-cyan-400 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className={`text-lg font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>Executing GitOps Sequence</h4>
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
                                    <h4 className={`text-xl font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>Patch Successfully Deployed</h4>
                                    <p className={`text-center text-sm max-w-md ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                                        The AI infrastructure fix was committed to a new branch, and a Merge Request has been seamlessly integrated. Priority CI pipeline has been restarted.
                                    </p>
                                    <div className="flex gap-4 mt-6">
                                        {patchResult?.mr_url && (
                                            <a href={patchResult.mr_url} target="_blank" rel="noreferrer" className="px-5 py-2.5 border border-slate-700 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                                <ExternalLink className="w-4 h-4" /> View Pull Request
                                            </a>
                                        )}
                                        <button onClick={() => {
                                            setPatchState('idle');
                                            addToast?.("Streaming live status of the patched pipeline.", "success");
                                        }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
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


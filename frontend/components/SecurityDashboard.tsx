import React, { useState, useEffect } from "react";

import { API_BASE, WS_BASE } from "../lib/api";
import { useToast } from "./ToastProvider";
import { NotificationBell } from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, ShieldAlert, ShieldCheck, Activity, Bell, Sun, Moon,
    Search, AlertTriangle, ChevronDown, ChevronUp,
    Lock, Terminal, Zap, Fingerprint, Play, Loader2,
    Crosshair, UserX, Key, Server, Scan
} from "lucide-react";

// Mock Data
const MOCK_THREATS = [
    { id: "th-1", type: "SQL Injection Attempt", source: "192.168.1.45", severity: "critical", time: "2 min ago", status: "blocked" },
    { id: "th-2", type: "Brute Force Login", source: "10.0.0.88", severity: "high", time: "15 min ago", status: "active" },
    { id: "th-3", type: "Suspicious API Activity", source: "172.16.0.5", severity: "medium", time: "1 hour ago", status: "investigating" },
    { id: "th-4", type: "Port Scan Detected", source: "114.119.10.2", severity: "low", time: "3 hours ago", status: "logged" },
];

const MOCK_VULNS = [
    { id: "vuln-1", cve: "CVE-2023-4863", component: "urllib3", severity: "critical", status: "unpatched" },
    { id: "vuln-2", cve: "CVE-2024-21626", component: "react-dom", severity: "high", status: "patched" },
    { id: "vuln-3", cve: "CVE-2023-38545", component: "runc", severity: "medium", status: "unpatched" },
];

const MOCK_LOGS = [
    "[10:45:01] 🔒 Authentication failed for user 'admin' (IP: 10.0.0.88)",
    "[10:45:05] 🔒 Authentication failed for user 'admin' (IP: 10.0.0.88)",
    "[10:46:12] 🛡️ WAF blocked payload containing SQLi pattern (IP: 192.168.1.45)",
    "[10:47:00] 🌐 New admin session started from IP: 10.0.0.5",
    "[10:48:33] 📡 Unusual spike in traffic to /api/graphql",
    "[10:50:11] 🛑 Rate limit exceeded for API key ending in '...a7f2'",
];


function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        let start = display;
        if (start === value) return;

        const duration = 500;
        let startTime = performance.now();

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            setDisplay(Math.floor(start + (value - start) * progress));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [value]);

    return <>{display.toLocaleString()}</>;
}

function getColorClass(type: string, value: number, darkMode: boolean) {
    if (type === 'score') {
        if (value >= 80) return darkMode ? 'text-emerald-500' : 'text-emerald-600';
        if (value >= 50) return darkMode ? 'text-yellow-500' : 'text-yellow-600';
        return darkMode ? 'text-red-500' : 'text-red-600';
    }
    if (type === 'vulns') {
        if (value === 0) return darkMode ? 'text-emerald-500' : 'text-emerald-600';
        if (value < 10) return darkMode ? 'text-yellow-500' : 'text-yellow-600';
        return darkMode ? 'text-red-500' : 'text-red-600';
    }
    if (type === 'incidents') {
        if (value === 0) return darkMode ? 'text-emerald-500' : 'text-emerald-600';
        if (value < 2) return darkMode ? 'text-yellow-500' : 'text-yellow-600';
        return darkMode ? 'text-red-500' : 'text-red-600';
    }
    // threats
    return darkMode ? 'text-red-500' : 'text-red-600';
}

export default function SecurityDashboard({ onBack }: { onBack: () => void }) {
    const { addToast, showModal } = useToast();
    const [darkMode, setDarkMode] = useState(true);
    const [threats, setThreats] = useState(MOCK_THREATS);
    const [vulns, setVulns] = useState(MOCK_VULNS);
    const [logs, setLogs] = useState(MOCK_LOGS);
    const [aiOpen, setAiOpen] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const [metrics, setMetrics] = useState({
        total_threats: 1248,
        active_incidents: 3,
        vulnerabilities: 14,
        security_score: 82
    });

    useEffect(() => {
        let isMounted = true;
        fetch(`${API_BASE}/security/metrics`).then(r => r.json()).then(data => {
            if (isMounted && data) setMetrics(data);
        }).catch(err => console.error("Metrics fetch error:", err));

        const ws = new WebSocket(`${WS_BASE}/security`);
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'metrics_update' && isMounted) {
                    setMetrics(payload.data);
                }
            } catch (e) { }
        };

        return () => {
            isMounted = false;
            ws.close();
        };
    }, []);


    // Simulate logs stream
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.8) {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🔍 Routine security beat check completed.`, ...prev].slice(0, 50));
            }
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Simulate scan
    useEffect(() => {
        if (isScanning) {
            const interval = setInterval(() => {
                setScanProgress(p => {
                    if (p >= 100) {
                        setIsScanning(false);
                        clearInterval(interval);
                        return 100;
                    }
                    return p + 5;
                });
            }, 200);
            return () => clearInterval(interval);
        }
    }, [isScanning]);

    const blockIp = async () => {
        setActiveAction("block-ip");
        try {
            await fetch(`${API_BASE}/security/block-ip`, { method: "POST" });
            addToast("IP successfully blocked across all nodes.", "success");
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🛡️ [SECURITY ACTION] IP blocked successfully.`, ...prev]);
        } catch (e) {
            addToast("Failed to block IP", "error");
        } finally {
            setActiveAction(null);
        }
    };

    const revokeToken = async () => {
        setActiveAction("revoke");
        try {
            await fetch(`${API_BASE}/security/revoke-token`, { method: "POST" });
            addToast("Active API tokens revoked.", "success");
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🔑 [SECURITY ACTION] Tokens revoked globally.`, ...prev]);
        } catch (e) {
            addToast("Failed to revoke keys", "error");
        } finally {
            setActiveAction(null);
        }
    };

    const lockAccount = async () => {
        setActiveAction("lock");
        try {
            await fetch(`${API_BASE}/security/lock-account`, { method: "POST" });
            addToast("Suspicious account locked.", "success");
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🔒 [SECURITY ACTION] Administrator account locked.`, ...prev]);
        } catch (e) {
            addToast("Failed to lock account", "error");
        } finally {
            setActiveAction(null);
        }
    };

    const isolateNode = async () => {
        setActiveAction("isolate");
        try {
            await fetch(`${API_BASE}/security/isolate-node`, { method: "POST" });
            addToast("Node isolated from the cluster network.", "success");
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🛑 [SECURITY ACTION] Node isolation sequence complete.`, ...prev]);
        } catch (e) {
            addToast("Failed to isolate node", "error");
        } finally {
            setActiveAction(null);
        }
    };

    const handleAction = (action: string) => {
        const actionMap: Record<string, { label: string, flow: () => Promise<void>, riskLevel: any, impact: string }> = {
            'block-ip': { label: "Block IP Address", flow: blockIp, riskLevel: "high", impact: "This will permanently drop all ingress/egress network traffic from this IP pattern across the entire global CDN." },
            'revoke': { label: "Revoke Tokens", flow: revokeToken, riskLevel: "critical", impact: "All current active session tokens for the affected user pool will be immediately invalidated. Users will be forcefully logged out." },
            'lock': { label: "Lock Account", flow: lockAccount, riskLevel: "medium", impact: "The compromised account will be locked. Identity re-verification will be required to unlock." },
            'isolate': { label: "Isolate Node", flow: isolateNode, riskLevel: "critical", impact: "The impacted worker node will be completely severed from the cluster overlay network, breaking all internal service meshes temporarily." }
        };
        const cfg = actionMap[action];
        if (!cfg) return;

        showModal({
            title: `Confirm Security Action: ${cfg.label}`,
            description: `Are you sure you want to execute this global security action?`,
            riskLevel: cfg.riskLevel as "low" | "medium" | "high" | "critical",
            impact: cfg.impact,
            confirmText: `Execute ${cfg.label}`,
            onConfirm: cfg.flow
        });
    };

    const executeAiAction = async (type: string) => {
        setActiveAction(`ai-${type}`);
        try {
            await fetch(`${API_BASE}/security/action/ai-${type}`, { method: "POST" });
            addToast(`AI Auto-Action Executed successfully.`, "success");
            if (type === 'block') {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🤖 [AI ACTION] Blocked IP 10.0.0.88 (confidence 94%)`, ...prev]);
            } else {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🤖 [AI ACTION] Auto-fix MR for CVE-2023-4863 created (confidence 98%)`, ...prev]);
            }
        } catch (e) {
            addToast("Failed to run AI action", "error");
        } finally {
            setActiveAction(null);
        }
    };

    const triggerAiAction = (type: string) => {
        showModal({
            title: `AI Autonomous Intervention Validated`,
            description: type === 'block' ? `AI recommends an immediate block on IP 10.0.0.88 based on persistent behavioral trajectory profiling.` : `AI has generated a verified patch for CVE-2023-4863 bounding 'urllib3'.`,
            riskLevel: "medium",
            impact: type === 'block' ? "The IP address block rule will be propagated immediately via Cloud NAT." : "A Merge Request will be opened against the main protected branch with auto-test pipeline triggered.",
            confirmText: "Authorize AI Protocol",
            onConfirm: () => executeAiAction(type)
        });
    };

    const startScan = async () => {
        setIsScanning(true);
        setScanProgress(0);
        addToast("Zero-Day scan initiated", "info");
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] 🔎 [VULNERABILITY SCAN] System deep scan running...`, ...prev]);
    }


    const SeverityBadge = ({ level }: { level: string }) => {
        const styles = {
            critical: "bg-red-500/10 text-red-500 border-red-500/20",
            high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            low: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        }[level] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles}`}>{level}</span>;
    };

    return (
        <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${darkMode ? "bg-[#050505] text-slate-200" : "bg-slate-50 text-slate-900"}`}>

            {/* Header */}
            <header className={`sticky top-0 z-50 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md ${darkMode ? "border-white/10 bg-[#050505]/80" : "border-slate-200 bg-white/80"}`}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">SynAegis SOC</span>
                    </div>

                    <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <button onClick={onBack} className="hover:text-red-400 transition-colors">Workspace</button>
                        <span>/</span>
                        <span className={darkMode ? "text-slate-200" : "text-slate-900"}>Security Core</span>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-slate-500/10 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    </button>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors">
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 border-2 border-[#050505] cursor-pointer"></div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">

                {/* Sticky Threat Overview Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sticky top-20 z-40">
                    <div className={`px-6 py-4 rounded-2xl border flex flex-col justify-center relative overflow-hidden ${darkMode ? "bg-red-950/20 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-red-50 border-red-200 shadow-sm"}`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl"></div>
                        <span className="text-xs text-red-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Total Threats Today</span>
                        <div className={`text-3xl font-light mt-1 ${getColorClass('threats', metrics.total_threats, darkMode)}`}><AnimatedNumber value={metrics.total_threats} /></div>
                    </div>

                    <div className={`px-6 py-4 rounded-2xl border flex flex-col justify-center relative overflow-hidden ${darkMode ? "bg-orange-950/20 border-orange-500/20" : "bg-orange-50 border-orange-200 shadow-sm"}`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
                        <span className="text-xs text-orange-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Active Incidents</span>
                        <div className={`text-3xl font-light mt-1 ${getColorClass('incidents', metrics.active_incidents, darkMode)}`}><AnimatedNumber value={metrics.active_incidents} /></div>
                    </div>

                    <div className={`px-6 py-4 rounded-2xl border flex flex-col justify-center relative overflow-hidden ${darkMode ? "bg-amber-950/20 border-amber-500/20" : "bg-amber-50 border-amber-200 shadow-sm"}`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
                        <span className="text-xs text-amber-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" /> Vulnerabilities</span>
                        <div className={`text-3xl font-light mt-1 ${getColorClass('vulns', metrics.vulnerabilities, darkMode)}`}><AnimatedNumber value={metrics.vulnerabilities} /></div>
                    </div>

                    <div className={`px-6 py-4 rounded-2xl border flex flex-col justify-center relative overflow-hidden ${darkMode ? "bg-emerald-950/20 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" : "bg-emerald-50 border-emerald-200 shadow-sm"}`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
                        <span className="text-xs text-emerald-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Security Score</span>
                        <div className={`text-3xl font-light mt-1 ${getColorClass('score', metrics.security_score, darkMode)}`}><AnimatedNumber value={metrics.security_score} /><span className="text-sm opacity-50">/100</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

                    {/* LEFT COLUMN (Span 8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Threat Feed */}
                        <section className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                            <div className="p-4 border-b border-inherit flex items-center justify-between">
                                <h2 className="text-lg font-medium flex items-center gap-2">
                                    <Crosshair className="w-5 h-5 text-red-500" /> Live Threat Feed
                                </h2>
                                <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                                    <button className="px-3 py-1 rounded bg-white/10 text-xs font-medium backdrop-blur-md">All</button>
                                    <button className="px-3 py-1 rounded text-slate-500 hover:text-slate-300 text-xs font-medium">Critical</button>
                                </div>
                            </div>
                            <div className="divide-y divide-inherit">
                                {threats.map((threat) => (
                                    <div key={threat.id} className={`p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors gap-4`}>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-2 rounded-full bg-red-500/10 text-red-500 shrink-0">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm mb-0.5">{threat.type}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                                    <span>{threat.source}</span>
                                                    <span>•</span>
                                                    <span>{threat.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <SeverityBadge level={threat.severity} />
                                            <span className={`text-[11px] uppercase tracking-wider font-bold ${threat.status === 'blocked' ? 'text-emerald-500' : threat.status === 'active' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                                {threat.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Scanner & Actions (Split into two columns) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Scanner Panel */}
                            <section className={`rounded-2xl border p-5 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-medium flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-cyan-400" /> Vulnerability Scanner
                                    </h2>
                                    <button
                                        onClick={startScan}
                                        disabled={isScanning}
                                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                        {isScanning ? 'Scanning...' : 'Run Scan'}
                                    </button>
                                </div>

                                {isScanning && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs mb-2 text-cyan-400">
                                            <span>Analyzing dependencies...</span>
                                            <span>{scanProgress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                            <div className="h-full bg-cyan-400 rounded-full transition-all duration-200" style={{ width: `${scanProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {vulns.map((v) => (
                                        <div key={v.id} className={`p-3 rounded-lg border flex flex-col gap-2 ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-sm font-medium text-red-400">{v.cve}</span>
                                                <SeverityBadge level={v.severity} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">Component: <span className="text-slate-200 font-mono">{v.component}</span></span>
                                                <span className={`${v.status === 'patched' ? 'text-emerald-400' : 'text-amber-400'}`}>{v.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Rapid Actions */}
                            <section className={`rounded-2xl border p-5 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                                <h2 className="text-base font-medium flex items-center gap-2 mb-4">
                                    <Zap className="w-4 h-4 text-purple-400" /> Security Actions
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleAction('block-ip')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${activeAction === 'block-ip' ? 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : darkMode ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'}`}
                                    >
                                        <UserX className="w-5 h-5" />
                                        Block IP
                                    </button>
                                    <button
                                        onClick={() => handleAction('revoke')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${activeAction === 'revoke' ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' : darkMode ? 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-600'}`}
                                    >
                                        <Key className="w-5 h-5" />
                                        Revoke Token
                                    </button>
                                    <button
                                        onClick={() => handleAction('lock')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${activeAction === 'lock' ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : darkMode ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600'}`}
                                    >
                                        <Lock className="w-5 h-5" />
                                        Lock Account
                                    </button>
                                    <button
                                        onClick={() => handleAction('isolate')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${activeAction === 'isolate' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : darkMode ? 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600'}`}
                                    >
                                        <Server className="w-5 h-5" />
                                        Isolate Node
                                    </button>
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* RIGHT COLUMN (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* AI Advisor Panel */}
                        <section className={`rounded-2xl border overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-b from-indigo-950/30 to-purple-950/20 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                            <div
                                className="p-5 border-b border-inherit flex items-center justify-between cursor-pointer"
                                onClick={() => setAiOpen(!aiOpen)}
                            >
                                <h2 className="text-lg font-medium flex items-center gap-2 text-indigo-400">
                                    <Shield className="w-5 h-5" /> AI Threat Advisor
                                </h2>
                                {aiOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
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
                                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-black/40 border-white/5" : "bg-white border-slate-200"}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                                                        <Activity className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1 text-slate-200">Anomaly Detected</h4>
                                                        <p className="text-xs text-slate-400 leading-relaxed">
                                                            High frequency of failed logins originating from the `10.0.x.x` subnet. Recommending immediate temporary block on IP `10.0.0.88`.
                                                        </p>
                                                        <button className="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                                                            Auto-Apply Block →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-black/40 border-white/5" : "bg-white border-slate-200"}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 mt-0.5">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1 text-slate-200">Outdated Library</h4>
                                                        <p className="text-xs text-slate-400 leading-relaxed">
                                                            `urllib3` is affected by CVE-2023-4863 in your staging environment. Generate an auto-fix MR?
                                                        </p>
                                                        <button className="mt-3 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
                                                            Create Auto-Fix MR →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Telemetry/Logs Panel */}
                        <section className={`rounded-2xl border flex flex-col overflow-hidden h-80 ${darkMode ? "bg-[#0a0a0a] border-slate-800" : "bg-slate-900 border-slate-800"}`}>
                            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-slate-400 bg-slate-950">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4" />
                                    <span className="text-xs font-mono tracking-widest uppercase">Security Event Stream</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-slate-800">
                                    <Search className="w-3.5 h-3.5" />
                                    <input
                                        type="text"
                                        placeholder="Grep logs..."
                                        className="bg-transparent border-none outline-none text-xs w-24 font-mono focus:ring-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed hide-scrollbar break-all">
                                {logs.filter(l => l.toLowerCase().includes(searchQuery.toLowerCase())).map((log, i) => {
                                    const isFail = log.includes("failed") || log.includes("blocked") || log.includes("exceeded");
                                    return (
                                        <div key={i} className={`mb-1.5 hover:bg-white/[0.02] px-1 rounded transition-colors ${isFail ? "text-red-400" : "text-slate-400"
                                            }`}>
                                            {log}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
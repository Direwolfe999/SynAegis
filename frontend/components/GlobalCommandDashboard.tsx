import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Zap, Shield, Cloud, Server, Cpu, AlertTriangle,
  Terminal, GitCommit, CheckCircle, Clock, ChevronRight, ServerCrash
} from 'lucide-react';
import { fetchFullDashboard, fetchCloudHistory, fetchSecurityHistory, WS_BASE } from '../lib/api';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, sub, icon: Icon, colorClass, delay, loading }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.05] transition-all group ${colorClass}`}
  >
    <div className="flex justify-between items-start mb-2 sm:mb-4">
      <span className="text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium tracking-wide truncate pr-2">{title}</span>
      <span className={`p-1.5 sm:p-2 rounded-lg bg-white/5 opacity-80 group-hover:opacity-100 transition-opacity`}><Icon className="w-4 h-4 sm:w-5 sm:h-5" /></span>
    </div>
    <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
      {loading ? (
        <div className="w-12 sm:w-16 h-6 sm:h-8 bg-white/10 animate-pulse rounded-md"></div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      )}
      <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full bg-white/5 whitespace-nowrap`}>
        {sub}
      </span>
    </div>
  </motion.div>
);

export default function GlobalCommandDashboard({ setActiveView }: { setActiveView: (view: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [cloudHist, setCloudHist] = useState<any[]>([]);
  const [secHist, setSecHist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const url = `${WS_BASE}/dashboard`;
      ws = new WebSocket(url);

      ws.onmessage = (event) => {
        const updatedData = JSON.parse(event.data);
        setData(updatedData);
        setLoading(false);

        // Simulate appending to history for charts based on live data
        setCloudHist(prev => [...prev.slice(-9), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), cpu_usage: Number(updatedData.cloud.cpu_usage) || 0, memory_usage: Number(updatedData.cloud.memory_usage) || 0 }]);
        setSecHist(prev => [...prev.slice(-9), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), threats: Number(updatedData.security.threats) || 0, vulnerabilities: Number(updatedData.security.vulnerabilities) || 0 }]);
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    const initialFetch = async () => {
      try {
        const [dash, cHist, sHist] = await Promise.all([
          fetchFullDashboard(),
          fetchCloudHistory(),
          fetchSecurityHistory()
        ]);
        if (dash) setData(dash);
        if (cHist) setCloudHist(cHist);
        if (sHist) setSecHist(sHist);
        setLoading(false);
        connect();
      } catch (e) {
        console.error("Fetch err:", e);
        connect();
      }
    };

    initialFetch();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
      {/* 1. GLOBAL COMMAND HERO */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 sm:gap-6 md:gap-8 bg-white/5 border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-cyan-500/10 blur-[60px] md:blur-[100px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
        <div className="relative z-10 w-full xl:w-auto flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 sm:px-3 py-1 mb-3 sm:mb-4 text-[10px] sm:text-xs uppercase tracking-widest text-cyan-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 shrink-0 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span> System Core: ONLINE & AUTONOMOUS
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white mb-2 leading-tight">SynAegis Central Intelligence</h1>
          <p className="text-slate-400 text-[11px] sm:text-xs md:text-sm max-w-xl mb-4 sm:mb-6 leading-relaxed">Enterprise orchestration plane aggregating real-time telemetry from Multi-Agent Ops, CI/CD pipelines, Cloud Infrastructure, and Security Posture.</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setActiveView("warroom")}
              className="z-[100] w-full sm:w-auto min-h-[44px] inline-flex justify-center items-center gap-2 md:gap-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 md:px-6 py-2.5 sm:py-3 font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:from-cyan-500 hover:to-blue-500 hover:scale-[1.02] sm:hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <Zap size={18} /> Enter Live War Room
            </button>
            <button
              onClick={() => setActiveView("settings")}
              className="z-[100] w-full sm:w-auto min-h-[44px] inline-flex justify-center items-center gap-2 md:gap-3 rounded-xl bg-white/5 border border-white/10 px-4 md:px-6 py-2.5 sm:py-3 font-semibold text-white hover:bg-white/10 transition-all active:scale-95 text-sm sm:text-base"
            >
              Control Panel
            </button>
          </div>
        </div>
      </header>

      {/* 2. 6-CARD GLOBAL STATUS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard loading={loading} delay={0.1} title="Health Score" value={data?.health_score || 0} sub="Overall" icon={Activity} colorClass="hover:border-emerald-500/50 text-emerald-400" />
        <StatCard loading={loading} delay={0.2} title="Active Pipelines" value={data?.pipelines?.running || 0} sub={`${data?.pipelines?.total || 0} Total`} icon={GitCommit} colorClass="hover:border-blue-500/50 text-blue-400" />
        <StatCard loading={loading} delay={0.3} title="Security Alerts" value={data?.security?.active_incidents || 0} sub="Critical" icon={Shield} colorClass="hover:border-red-500/50 text-red-400" />
        <StatCard loading={loading} delay={0.4} title="Cloud Nodes" value={data?.cloud?.services || 0} sub="Running" icon={Server} colorClass="hover:border-cyan-500/50 text-cyan-400" />
        <StatCard loading={loading} delay={0.5} title="System Load" value={`${data?.cloud?.cpu_usage || 0}%`} sub="Avg" icon={Cpu} colorClass="hover:border-purple-500/50 text-purple-400" />
        <StatCard loading={loading} delay={0.6} title="Carbon Usage" value={`${data?.cloud?.carbon || 0} kg`} sub="Today" icon={Cloud} colorClass="hover:border-emerald-500/50 text-emerald-400" />
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-4 sm:gap-6">

        {/* LEFT COLUMN: Deep Observability (Span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-4 sm:gap-6 w-full max-w-full">

          <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
                <Cloud className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" /> Live Telemetry
              </h3>
              <div className="flex items-center gap-2 sm:gap-4 self-start sm:self-auto">
                <span className="text-[10px] sm:text-xs text-emerald-400 font-mono flex items-center"><span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse mr-1.5 sm:mr-2"></span>Polling</span>
                <button onClick={() => setActiveView("cloud")} className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium min-h-[32px] sm:min-h-0 whitespace-nowrap">Open Cloud UI</button>
              </div>
            </div>

            <div className="h-40 sm:h-52 md:h-64 mt-2 sm:mt-4 w-full">
              {cloudHist.length > 0 ? (
                <div className="w-full h-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cloudHist} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="#ffffff50" fontSize={10} tickFormatter={(t) => t?.toString()?.split('T')[1]?.substring(0, 5) || t} />
                      <YAxis stroke="#ffffff50" fontSize={10} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: '#000000dd', border: '1px solid #333', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="cpu_usage" stroke="#22d3ee" fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage %" />
                      <Area type="monotone" dataKey="memory_usage" stroke="#818cf8" fillOpacity={1} fill="url(#colorMem)" name="Memory Usage %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                  <Activity className="animate-spin mr-2 w-4 h-4" /> Syncing...
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-6 w-full">
            <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md w-full overflow-hidden">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-base font-medium text-white flex items-center gap-2">
                  <Shield className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" /> Security Vectors
                </h3>
              </div>
              <div className="h-32 sm:h-40 mt-2 w-full">
                {secHist.length > 0 ? (
                  <div className="w-full h-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={secHist} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="#ffffff50" fontSize={10} tickFormatter={(t) => t?.toString()?.split('T')[1]?.substring(0, 5) || t} />
                        <YAxis stroke="#ffffff50" fontSize={10} width={40} />
                        <Tooltip contentStyle={{ backgroundColor: '#000000dd', border: '1px solid #333', fontSize: '12px' }} cursor={{ fill: '#ffffff10' }} />
                        <Bar dataKey="threats" fill="#ef4444" name="Threats" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="incidents" fill="#f59e0b" name="Incidents" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs sm:text-sm">
                    <Shield className="animate-pulse mr-2 text-red-500/50 w-4 h-4" /> Syncing...
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md w-full">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-medium text-white flex items-center gap-2">
                  <GitCommit className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5" /> CI/CD Deployments
                </h3>
              </div>
              <div className="flex flex-col gap-2 sm:gap-3">
                {['frontend-ui', 'auth-service', 'cloud-agent'].map((name, i) => {
                  const runs = data?.pipelines?.running || 0;
                  const isRunning = i < runs;
                  return (
                    <div key={i} className="flex gap-2 justify-between items-center p-2 sm:p-3 rounded-lg bg-white/5 border border-white/5 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className={isRunning ? "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse" : "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"} />
                        <span className="text-slate-300 font-mono truncate max-w-[100px] sm:max-w-none">{name}</span>
                      </div>
                      <span className={`flex items-center gap-1 sm:gap-2 ${isRunning ? 'text-blue-400' : 'text-emerald-400'} whitespace-nowrap`}>
                        {isRunning ? <Clock size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        <span className="inline">{isRunning ? 'Deploying...' : 'Success'}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Insights & Feed (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-4 sm:gap-6 w-full max-w-full">
          <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-cyan-900/20 to-transparent border border-cyan-500/20 backdrop-blur-md flex-1 w-full">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Zap className="text-cyan-400 w-4 h-4 sm:w-5 sm:h-5" />
              <h3 className="text-base sm:text-lg font-medium text-white">AI Ops Insights</h3>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              {loading ? (
                <div className="animate-pulse space-y-3 sm:space-y-4">
                  <div className="h-20 sm:h-24 bg-white/5 rounded-xl border border-white/10 w-full"></div>
                  <div className="h-20 sm:h-24 bg-white/5 rounded-xl border border-white/10 w-full"></div>
                </div>
              ) : (data?.insights || []).map((desc: string, idx: number) => (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.2 }} key={idx} className={`p-3 sm:p-4 rounded-xl border bg-white/5 border-white/10 w-full`}>
                  <h4 className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-cyan-300`}>
                    <Activity size={12} className="sm:w-3.5 sm:h-3.5" /> Automated Discovery
                  </h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs md:text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0a0a] border border-white/5 backdrop-blur-md h-48 sm:h-56 md:h-64 overflow-hidden relative w-full">
            <h3 className="text-xs sm:text-sm font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Terminal size={14} className="text-slate-400 sm:w-4 sm:h-4" /> Security Feed
            </h3>
            <div className="absolute inset-0 top-12 sm:top-14 bottom-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] z-10 pointer-events-none" />
            <div className="flex flex-col gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs text-slate-400 z-0 h-full overflow-y-auto pb-4 custom-scrollbar">
              {loading ? (
                <div className="animate-pulse space-y-2 sm:space-y-3">
                  <div className="h-3 sm:h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-3 sm:h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-3 sm:h-4 bg-white/10 rounded w-4/6"></div>
                </div>
              ) : secHist.map((log: any, idx: number) => {
                const color = log.threats > 0 ? 'text-red-400' : 'text-emerald-400';
                return (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="break-words sm:truncate w-full pr-2 leading-relaxed">
                    <span className={color}>[{log.timestamp?.toString()?.split('T')[1]?.substring(0, 8) || log.timestamp}]</span> SEC_BOT: {log.threats > 0 ? `Identified ${log.threats} threats.` : `System secure, ${log.vulnerabilities || 0} vulns patched`}
                  </motion.p>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

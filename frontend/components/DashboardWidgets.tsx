import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, trend, icon, colorClass }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${(colorClass || '').replace('text-', 'hover:border-').split(' ')[0]}`}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-slate-400 text-sm font-medium tracking-wide">{title}</span>
      <span className={`text-xl opacity-80 ${colorClass}`}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-3">
      <span className="text-3xl font-semibold text-white tracking-tight">{value}</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.startsWith('+') || trend === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {trend}
      </span>
    </div>
  </motion.div>
);

export const PipelineMonitor = () => {
    const pipelines = [
        { id: "backend-api-v2", status: "running", progress: 65, time: "2m 14s", branch: "main" },
        { id: "frontend-dashboard", status: "success", progress: 100, time: "4m 20s", branch: "feat/ui-update" },
        { id: "auth-service", status: "failed", progress: 32, time: "1m 10s", branch: "fix/jwt-token" }
    ];

    return (
        <div className="flex flex-col gap-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <span className="text-blue-400">🚀</span> Active Pipelines
                </h3>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full font-medium">View All</button>
            </div>
            
            <div className="flex flex-col gap-3 z-10 w-full">
                {pipelines.map((pipe, i) => (
                    <motion.div key={pipe.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                        <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-2">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {pipe.status === 'running' && <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />}
                                {pipe.status === 'success' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
                                {pipe.status === 'failed' && <span className="w-2.5 h-2.5 rounded-full bg-red-400" />}
                                <span className="font-mono text-sm text-slate-200 truncate">{pipe.id}</span>
                                <span className="text-xs text-slate-500 px-2 py-0.5 rounded-md bg-white/5 hidden sm:inline-block">{pipe.branch}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400 self-end sm:self-auto">{pipe.time}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-1 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${pipe.progress}%` }} 
                                className={`h-full rounded-full ${pipe.status === 'failed' ? 'bg-red-400' : pipe.status === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export const SecurityCenter = () => (
    <div className="flex flex-col gap-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] pointer-events-none" />
        <div className="flex items-center justify-between z-10 w-full">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-red-400">🛡️</span> Security Interventions
            </h3>
            <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full font-medium">2 Critical</span>
        </div>
        <div className="flex flex-col gap-3 z-10 w-full">
            <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col gap-3 hover:bg-red-500/10 transition-colors">
                <div className="flex justify-between items-start w-full">
                    <div>
                        <div className="text-sm font-semibold text-red-300">CVE-2023-4863</div>
                        <div className="text-xs text-slate-400 mt-1">Found in package.json (Lodash v4.17.20)</div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-400 px-2 py-1 rounded">Critical</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-500/10 w-full">
                    <span className="text-xs text-slate-300 flex items-center gap-2"><span className="text-emerald-400 animate-pulse">●</span> Agent drafted PR #42</span>
                    <button className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors shadow-lg">Review Sync</button>
                </div>
            </div>
            <div className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl flex items-center justify-between w-full hover:bg-orange-500/10 transition-colors">
                <div>
                   <div className="text-sm font-semibold text-orange-300">Secret Scanning (AWS Keys)</div>
                   <div className="text-xs text-slate-400 mt-1">Detected in commit a8f9b2</div>
                </div>
                <button className="text-xs bg-black text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 px-3 py-1.5 rounded-md transition-colors">Revert</button>
            </div>
        </div>
    </div>
);

export const CloudControlPanel = () => (
    <div className="flex flex-col gap-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-xl w-full">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <span className="text-cyan-400">☁️</span> Cloud Infrastructure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="p-4 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-between w-full hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">eks</div>
                    <div>
                        <div className="text-sm font-medium text-white">Production Cluster</div>
                        <div className="text-xs text-slate-400">us-east-1</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-cyan-400">Healthy</div>
                    <div className="text-xs text-slate-500">12 Nodes</div>
                </div>
            </div>
            <div className="p-4 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-between w-full hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">rds</div>
                    <div>
                        <div className="text-sm font-medium text-white">Main Database</div>
                        <div className="text-xs text-slate-400">PostgreSQL 14</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-purple-400">65% Load</div>
                    <div className="text-xs text-slate-500">Auto-scaling</div>
                </div>
            </div>
            <div className="p-4 border border-white/5 bg-white/[0.02] rounded-xl flex flex-col justify-center gap-2 w-full hover:bg-white/[0.04] transition-colors">
               <div className="flex justify-between items-end w-full">
                   <span className="text-sm text-slate-300">Daily Burn Rate</span>
                   <span className="text-lg font-medium text-white">$142.50</span>
               </div>
               <div className="w-full bg-white/5 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-[45%]" />
               </div>
            </div>
        </div>
    </div>
);

export const AgentActivityFeed = () => {
    const logs = [
        { time: "Just now", agent: "Security-01", action: "Patched numpy vulnerability via PR #104", type: "fix" },
        { time: "2m ago", agent: "Ops-04", action: "Scaled up RDS instance due to latency spike", type: "scale" },
        { time: "15m ago", agent: "Cloud-02", action: "Terminated orphaned dev cluster (Saved $4/hr)", type: "cost" },
        { time: "1h ago", agent: "CI-01", action: "Optimized Docker build cache layer", type: "perf" },
    ];

    return (
        <div className="flex flex-col gap-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-xl h-full w-full">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <span className="text-purple-400 w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span> Agent Execution Feed
            </h3>
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 w-full">
                {logs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4 group w-full">
                        <div className="flex flex-col items-center mt-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${log.type === 'fix' ? 'bg-red-400' : log.type === 'scale' ? 'bg-blue-400' : log.type === 'cost' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                            {i !== logs.length - 1 && <div className="w-[1px] h-full bg-white/10 my-1 group-hover:bg-white/20 transition-colors" />}
                        </div>
                        <div className="flex flex-col pb-4 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-white/80 font-semibold">{log.agent}</span>
                                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">{log.time}</span>
                            </div>
                            <span className="text-sm text-slate-400 mt-1 leading-relaxed">{log.action}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export const SustainabilityPanel = () => (
    <div className="flex flex-col gap-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0a0a0d] to-[#041a12] border border-emerald-500/10 shadow-xl overflow-hidden relative w-full h-full">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
        <h3 className="text-lg font-medium text-white flex items-center gap-2 z-10 w-full">
            <span className="text-emerald-400">🌿</span> Green IT Metrics
        </h3>
        <div className="flex flex-col gap-4 z-10 isolate h-full justify-center w-full">
            <div className="flex items-center justify-between p-4 bg-black/40 border border-emerald-500/10 rounded-xl backdrop-blur-sm w-full">
                <div className="flex flex-col">
                    <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">Carbon Saved Today</span>
                    <span className="text-2xl font-light text-white mt-1">4.2 kg</span>
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    📉
                </div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 w-full">
                <span className="text-white font-medium">SynAegis</span> dynamically schedules high-intensity pipelines during off-peak regional power grids, utilizing 62% renewable energy sources this week.
            </div>
        </div>
    </div>
);

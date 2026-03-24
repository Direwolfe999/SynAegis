import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, GitMerge, GitCommit, Play, RotateCcw, XCircle, 
  Terminal, Activity, Shield, Cloud, Server, LayoutDashboard,
  CheckCircle, X, ChevronRight, AlertCircle, Cpu, Zap, FolderDot,
  Send
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.04] transition-all group ${colorClass}`}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-slate-400 text-sm font-medium tracking-wide">{title}</span>
      <span className="p-2 rounded-lg bg-white/5 opacity-80 group-hover:opacity-100 transition-opacity"><Icon size={18} /></span>
    </div>
    <div className="text-3xl font-semibold text-white tracking-tight">{value}</div>
  </motion.div>
);

export default function DevOpsControlCenter({ onBack }: { onBack: () => void }) {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<{time: string, text: string, type: string}[]>([
    { time: '10:45:00', text: 'System initialized. Automation engine ready.', type: 'info' },
    { time: '10:45:02', text: 'Synced with GitLab. Found 34 active projects.', type: 'success' },
  ]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
      text: `> ${command}`,
      type: 'command'
    }, {
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
      text: `Executing automation routine for: "${command}"...`,
      type: 'processing'
    }]);
    setCommand('');
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            ←
          </button>
          <div>
            <div className="text-xs font-mono text-slate-500 mb-1">HOME / <span className="text-cyan-400">DEVOPS CONTROL CENTER</span></div>
            <h1 className="text-2xl font-semibold text-white">GitLab Automation Hub</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Agent Connected
            </span>
        </div>
      </div>

      {/* Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Projects" value="34" icon={FolderDot} colorClass="hover:border-blue-500/50 text-blue-400" />
        <StatCard title="Active Pipelines" value="8" icon={Play} colorClass="hover:border-emerald-500/50 text-emerald-400" />
        <StatCard title="Open MRs" value="12" icon={GitMerge} colorClass="hover:border-purple-500/50 text-purple-400" />
        <StatCard title="Failed Jobs" value="2" icon={XCircle} colorClass="hover:border-red-500/50 text-red-400" />
        <StatCard title="Active Automations" value="5" icon={Zap} colorClass="hover:border-yellow-500/50 text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Spans 2): Projects, Pipelines, MRs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Projects & Pipelines Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <FolderDot size={18} className="text-blue-400" /> Monitored Repositories
              </h3>
              <div className="space-y-3">
                {['backend-api', 'frontend-dashboard', 'auth-service'].map((repo) => (
                  <div key={repo} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-mono text-sm">{repo}</span>
                    <button className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20">Manage</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Play size={18} className="text-emerald-400" /> Live Pipelines
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono">backend-api / main</span>
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14}/> Success</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button className="text-[10px] bg-white/10 px-2 py-1 rounded flex items-center gap-1"><RotateCcw size={10} /> Retry</button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono text-red-200">auth-service / fix-jwt</span>
                    <span className="text-red-400 flex items-center gap-1"><XCircle size={14}/> Failed</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded flex items-center gap-1"><Zap size={10} /> Auto-Fix (AI)</button>
                    <button className="text-[10px] bg-white/10 px-2 py-1 rounded">View Logs</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Merge Requests */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <GitMerge size={18} className="text-purple-400" /> Merge Requests
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white">Update OIDC login flow</h4>
                    <p className="text-xs text-slate-400 mt-1">auth-service !42 • created by dev-team</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">Needs Review</span>
                </div>
                <div className="flex gap-2 border-t border-white/10 pt-3 mt-1">
                  <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                    <Activity size={14} /> AI Code Review
                  </button>
                  <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors">
                    Approve & Merge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Spans 1): Automation Hub & Activity */}
        <div className="flex flex-col gap-6">
          
          {/* Automation Hub */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-cyan-900/20 to-[#0a0a0a] border border-cyan-500/30 backdrop-blur-md flex-1 flex flex-col">
            <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
              <Terminal size={18} className="text-cyan-400" /> AI Automation Hub
            </h3>
            <p className="text-xs text-slate-400 mb-4">Execute complex DevOps routines via natural language.</p>
            
            <div className="flex-1 min-h-[200px] mb-4 bg-black/50 border border-white/5 rounded-xl p-3 font-mono text-xs overflow-y-auto flex flex-col gap-2">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-2 ${log.type === 'command' ? 'text-cyan-300' : log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <span className="opacity-50">[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCommand} className="relative mt-auto">
              <input 
                type="text" 
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., 'Fix the failing pipeline in auth-service'" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/40 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setCommand("Review open MR in auth-service")} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10">Review MR</button>
              <button onClick={() => setCommand("Scaffold new Node.js microservice")} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10">Scaffold Repo</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

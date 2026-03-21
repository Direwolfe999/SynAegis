"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

// --- MOCK DATA ---
export const MOCK_PIPELINES = [
  { id: "#8492", branch: "main", status: "running", duration: "2m 14s", stage: "Deploy" },
  { id: "#8491", branch: "feat/ai-agents", status: "success", duration: "4m 02s", stage: "Complete" },
  { id: "#8490", branch: "hotfix/auth", status: "failed", duration: "1m 45s", stage: "Test" },
];

export const MOCK_LOGS = [
  { id: 1, time: "10:42:01", text: "[GITLAB] Webhook Push: Target Branch Main", color: "text-blue-400" },
  { id: 2, time: "10:42:05", text: "[AGENT] Scanning diff... High severity vulnerability found (CVE-2024).", color: "text-red-400" },
  { id: 3, time: "10:42:12", text: "[AGENT] Generating patch via Gemini...", color: "text-purple-400" },
  { id: 4, time: "10:42:15", text: "[GREEN] Pipeline carbon footprint calculated: 0.04kg CO2e", color: "text-emerald-400" },
  { id: 5, time: "10:42:22", text: "[GITLAB] Auto-fix MR #42 opened successfully.", color: "text-cyan-400" },
];

export const MOCK_VULNS = [
  { id: "CVE-2024-342", package: "lodash", severity: "Critical", status: "Auto-Fixing..." },
  { id: "SAST-992", package: "auth.ts", severity: "High", status: "Open" },
  { id: "DAST-112", package: "api/users", severity: "Medium", status: "Patched" },
];

export const MOCK_CLOUD = [
  { service: "synaegis-core-api", type: "Cloud Run", status: "Active", cost: "$0.12/hr" },
  { service: "postgres-main", type: "Cloud SQL", status: "Active", cost: "$0.45/hr" },
  { service: "staging-vm-04", type: "Compute Engine", status: "Idle", cost: "$0.08/hr (Zombie)" },
];

// --- REUSABLE COMPONENTS ---

export const StatCard = ({ title, value, trend, icon, colorClass }: { title: string, value: string, trend: string, icon: string, colorClass: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`relative overflow-hidden rounded-2xl border bg-black/40 p-6 backdrop-blur-md transition-all ${colorClass}`}
  >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
    <div className="flex justify-between items-start mb-4">
      <div className="text-2xl">{icon}</div>
      <div className="text-xs font-mono px-2 py-1 rounded border border-white/10 bg-white/5">{trend}</div>
    </div>
    <div className="text-3xl font-light tracking-tight text-white mb-1">{value}</div>
    <div className="text-sm text-slate-400 uppercase tracking-widest">{title}</div>
  </motion.div>
);

export const PipelineMonitor = () => (
  <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6 backdrop-blur-md flex flex-col h-full">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-light tracking-wide text-cyan-50">CI/CD Pipelines</h3>
      <span className="text-xs text-cyan-400 animate-pulse flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400" /> Live Sync
      </span>
    </div>
    <div className="space-y-4">
      {MOCK_PIPELINES.map((pipe) => (
        <div key={pipe.id} className="group relative p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${pipe.status === 'running' ? 'bg-blue-400 animate-ping' : pipe.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <div>
              <div className="font-mono text-sm text-white">{pipe.id} <span className="text-slate-400">({pipe.branch})</span></div>
              <div className="text-xs text-slate-500 mt-1">Stage: {pipe.stage} • {pipe.duration}</div>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="px-2 py-1 text-xs rounded border border-white/10 bg-white/5 hover:bg-cyan-500/20 text-cyan-300">Retry</button>
            {pipe.status === 'running' && <button className="px-2 py-1 text-xs rounded border border-white/10 bg-white/5 hover:bg-red-500/20 text-red-300">Stop</button>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SecurityCenter = () => (
  <div className="rounded-2xl border border-red-500/20 bg-black/40 p-6 backdrop-blur-md flex flex-col h-full">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-light tracking-wide text-red-50">Security Auditor</h3>
      <span className="text-xs border border-red-500/30 bg-red-500/10 text-red-300 px-2 py-1 rounded">2 Actionable</span>
    </div>
    <div className="space-y-4">
      {MOCK_VULNS.map((vuln) => (
        <div key={vuln.id} className="p-3 rounded border border-white/5 bg-gradient-to-r from-transparent hover:from-white/5 transition-colors flex justify-between items-center">
          <div>
            <div className="font-mono text-sm text-red-200">{vuln.id}</div>
            <div className="text-xs text-slate-400">Package: {vuln.package}</div>
          </div>
          <div className="text-right">
            <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${vuln.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : vuln.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {vuln.severity}
            </div>
            <div className={`text-[10px] mt-1 ${vuln.status.includes('Fixing') ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>{vuln.status}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AgentActivityFeed = () => (
  <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6 backdrop-blur-md flex flex-col h-[400px]">
    <h3 className="text-xl font-light tracking-wide text-purple-50 mb-6">SynAegis Orchestrator Feed</h3>
    <div className="flex-1 overflow-y-auto space-y-3 pr-2 font-mono text-xs custom-scrollbar">
      {MOCK_LOGS.map((log) => (
        <motion.div 
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
          key={log.id} 
          className="flex gap-3 bg-black/50 p-2 rounded border border-white/5 items-start"
        >
          <span className="text-slate-500 shrink-0">{log.time}</span>
          <span className={`${log.color}`}>{log.text}</span>
        </motion.div>
      ))}
      <div className="flex gap-3 items-center opacity-70 p-2">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
        <span className="text-purple-300">Agent idle, awaiting events...</span>
      </div>
    </div>
  </div>
);

export const CloudControlPanel = () => (
  <div className="rounded-2xl border border-blue-500/20 bg-black/40 p-6 backdrop-blur-md flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-light tracking-wide text-blue-50">Cloud Orchestration</h3>
      <div className="text-xs text-slate-400">Total: $0.65/hr</div>
    </div>
    <div className="space-y-3">
      {MOCK_CLOUD.map((res, i) => (
        <div key={i} className="flex justify-between items-center p-3 rounded border border-white/5 bg-white/5">
          <div>
            <div className="text-sm font-medium text-blue-100">{res.service}</div>
            <div className="text-xs text-slate-400">{res.type}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-slate-400">{res.cost}</span>
            {res.status === 'Idle' ? (
               <button className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40">Reap Zombie</button>
            ) : (
               <div className="px-3 py-1 text-xs rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Active</div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SustainabilityPanel = () => (
  <div className="rounded-2xl border border-emerald-500/20 bg-black/40 p-6 backdrop-blur-md flex flex-col relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-50" />
    <h3 className="text-xl font-light tracking-wide text-emerald-50 mb-6 relative z-10">Green IT Impact</h3>
    
    <div className="flex justify-between items-end relative z-10">
      <div>
        <div className="text-sm text-slate-400 mb-1">Carbon Prevented Today</div>
        <div className="text-4xl font-light text-emerald-400 tracking-tight">1.2<span className="text-xl text-emerald-600"> kg</span></div>
      </div>
      <div className="text-right">
        <div className="text-sm text-slate-400 mb-1">Energy Grid Status</div>
        <div className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs inline-block">Low Intensity</div>
      </div>
    </div>
    
    <div className="mt-6 flex gap-1 h-12 items-end relative z-10">
      {[12, 18, 10, 24, 8, 14, 2].map((val, i) => (
         <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(val/24)*100}%` }} transition={{ delay: i * 0.1 }} className="flex-1 bg-gradient-to-t from-emerald-600/40 to-emerald-400/80 rounded-t-sm" />
      ))}
    </div>
  </div>
);

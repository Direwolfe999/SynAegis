import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('agent');

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-2xl font-light text-white flex items-center gap-3">
          <span className="text-cyan-400">⚙️</span> Control Plane Settings
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Settings Sidebar */}
        <div className="md:col-span-3 flex flex-col gap-2">
          {['agent', 'integrations', 'security', 'cloud', 'notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                activeTab === tab 
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' 
                  : 'border-white/5 bg-black/20 text-slate-400 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <span className="capitalize">{tab}</span> Configuration
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-9 bg-black/40 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
          {activeTab === 'agent' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
              <h3 className="text-lg text-cyan-400 font-mono uppercase tracking-widest border-b border-cyan-500/20 pb-2">AI Agent Tuning</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300">Autonomy Level</label>
                <select className="bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50">
                  <option>Level 1: Suggest Only (Manual Approval Required)</option>
                  <option>Level 2: Auto-fix Non-breaking Changes</option>
                  <option selected>Level 3: Full Autonomy (Auto-deploy & Rollback)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Determines how much action the agent can take without human intervention.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300">Model Routing</label>
                <select className="bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50">
                  <option>Gemini 1.5 Pro (Default - Complex Reasoning)</option>
                  <option>Gemini 1.5 Flash (Fast Execution)</option>
                  <option>Anthropic Claude 3.5 Sonnet (Code specialized)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300">API Key Override</label>
                <input type="password" placeholder="sk-..." className="bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50" />
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
              <h3 className="text-lg text-emerald-400 font-mono uppercase tracking-widest border-b border-emerald-500/20 pb-2">Platform Integrations</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 bg-black/50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl">🦊</div>
                    <div>
                      <div className="text-sm text-white">GitLab</div>
                      <div className="text-xs text-emerald-400">Connected</div>
                    </div>
                  </div>
                  <button className="text-xs border border-white/10 px-3 py-1 rounded bg-black/40 hover:bg-white/10">Configure</button>
                </div>

                <div className="border border-white/10 bg-black/50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl">☁️</div>
                    <div>
                      <div className="text-sm text-white">GCP / AWS</div>
                      <div className="text-xs text-emerald-400">Connected</div>
                    </div>
                  </div>
                  <button className="text-xs border border-white/10 px-3 py-1 rounded bg-black/40 hover:bg-white/10">Configure</button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <label className="text-sm text-slate-300">Webhook Base URL</label>
                <input type="text" defaultValue="https://synaegis.ngrok.app/webhook" className="bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50" />
                <p className="text-xs text-slate-500 mt-1">Endpoint used for Gitlab push/merge event routing.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
              <h3 className="text-lg text-red-400 font-mono uppercase tracking-widest border-b border-red-500/20 pb-2">Security Enforcement</h3>
              <p className="text-sm text-slate-400">Configure how SynAegis handles vulnerabilities and compliance violations.</p>
              
              <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-white">Auto-Patch Dependencies</div>
                  <div className="text-xs text-slate-500">Automatically bump versions and create PRs when CVEs are detected</div>
                </div>
                <div className="w-12 h-6 bg-cyan-600 rounded-full flex items-center p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full translate-x-6 transition-transform"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-white">Block Critical Vulnerability Deployments</div>
                  <div className="text-xs text-slate-500">Prevent pipelines from progressing if Severity is High/Critical</div>
                </div>
                <div className="w-12 h-6 bg-cyan-600 rounded-full flex items-center p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full translate-x-6 transition-transform"></div>
                </div>
              </div>
            </motion.div>
          )}
          
          {(activeTab === 'cloud' || activeTab === 'notifications') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 h-48 items-center justify-center">
               <span className="text-4xl">🚧</span>
               <p className="text-slate-400">Configuration module under active development.</p>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4">
            <button className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">Cancel</button>
            <button className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)]">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

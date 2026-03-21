import React from 'react';
import { motion } from 'framer-motion';

export function Sidebar({ activeView, setActiveView }: { activeView: string, setActiveView: (v: any) => void }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'warroom', icon: '🎙️', label: 'War Room' },
    { id: 'pipelines', icon: '🚀', label: 'Pipelines' },
    { id: 'security', icon: '🛡️', label: 'Security' },
    { id: 'cloud', icon: '☁️', label: 'Cloud' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 bg-black/40 border-r border-white/10 backdrop-blur-xl z-[100] transition-all duration-300 hover:w-64 group overflow-hidden">
      <div className="w-12 h-12 mb-8 flex-shrink-0">
        <img src="/logos/wording.png" alt="Logo" className="w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 w-48" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' }} />
        <img src="/logos/logo.png" alt="Icon" className="w-10 h-10 object-contain group-hover:opacity-0 transition-opacity" />
      </div>

      <div className="flex flex-col gap-4 w-full px-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all relative group/btn ${
              activeView === item.id 
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-transparent border border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <span className="text-xl w-6 text-center">{item.icon}</span>
            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity font-medium tracking-wide">{item.label}</span>
            
            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-4 px-2 py-1 bg-black/90 border border-white/10 rounded text-xs opacity-0 group-hover/btn:opacity-100 group-hover:hidden transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

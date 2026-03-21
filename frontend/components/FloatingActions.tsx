import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingActions({ addToast }: { addToast: (msg: string, type: 'success'|'error'|'info') => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.8 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3"
          >
            <button onClick={() => { addToast('Pipeline triggered successfully', 'success'); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 bg-black/80 border border-blue-500/30 hover:bg-blue-900/40 hover:border-blue-500 rounded-full text-blue-300 text-sm backdrop-blur-md shadow-lg transition-all group">
              <span className="font-mono tracking-wider">Run Pipeline</span>
              <span className="p-1 bg-blue-500/20 rounded-full group-hover:scale-110 transition-transform">🚀</span>
            </button>
            <button onClick={() => { addToast('Security scan initiated', 'info'); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 bg-black/80 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500 rounded-full text-red-300 text-sm backdrop-blur-md shadow-lg transition-all group">
              <span className="font-mono tracking-wider">Audit Security</span>
              <span className="p-1 bg-red-500/20 rounded-full group-hover:scale-110 transition-transform">🛡️</span>
            </button>
            <button onClick={() => { addToast('Auto-fix agent deployed', 'success'); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 bg-black/80 border border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-500 rounded-full text-emerald-300 text-sm backdrop-blur-md shadow-lg transition-all group">
              <span className="font-mono tracking-wider">Ask Agent</span>
              <span className="p-1 bg-emerald-500/20 rounded-full group-hover:scale-110 transition-transform">🤖</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/50 backdrop-blur-lg transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-cyan-600' : 'bg-cyan-900/50'}`}
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          {isOpen ? '✕' : '⚡'}
        </motion.div>
      </button>
    </div>
  );
}

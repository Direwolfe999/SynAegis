import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Toast = { id: string, message: string, type: 'success' | 'error' | 'info' };

export function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[250px] rounded-xl border backdrop-blur-md shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200' :
              toast.type === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-200' :
              'bg-cyan-900/40 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

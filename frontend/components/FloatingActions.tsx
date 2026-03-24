import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FloatingActions = ({ addToast }: any) => {
    const [open, setOpen] = useState(false);

    const actions = [
        { id: 'deploy', icon: '🚀', label: 'Force Deploy', color: 'bg-blue-500' },
        { id: 'restart', icon: '🔄', label: 'Restart Kernel', color: 'bg-orange-500' },
        { id: 'lockdown', icon: '🔒', label: 'Emergency Lockdown', color: 'bg-red-500' }
    ];

    const executeAction = (action: any) => {
        setOpen(false);
        addToast(`Executing: ${action.label}...`, 'info');
        setTimeout(() => addToast(`${action.label} completed successfully.`, 'success'), 2000);
    };

    return (
        <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[200] flex flex-col items-end gap-4">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className="flex flex-col gap-3 items-end"
                    >
                        {actions.map((act, i) => (
                            <motion.button
                                key={act.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => executeAction(act)}
                                className="flex items-center gap-3 group"
                            >
                                <span className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg text-sm text-white font-medium border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">{act.label}</span>
                                <div className={`w-12 h-12 rounded-full ${act.color} text-white flex items-center justify-center text-xl shadow-lg border-2 border-black/50 hover:scale-110 transition-transform`}>
                                    {act.icon}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(!open)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all duration-300 z-50 border-2 ${open ? 'bg-white text-black border-white/20 rotate-45' : 'bg-gradient-to-tr from-blue-600 to-cyan-400 text-white border-blue-400/50'
                    }`}
            >
                {open ? '➕' : '⚡'}
            </motion.button>
        </div>
    );
};

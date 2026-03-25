import { useTheme } from "./ThemeProvider";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


const navConfig = {
  default: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'warroom', icon: '🎙️', label: 'War Room' },
    { id: 'pipelines', icon: '🚀', label: 'Pipelines' },
    { id: 'security', icon: '🛡️', label: 'Security' },
    { id: 'cloud', icon: '☁️', label: 'Cloud' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ],
  warroom: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'warroom', icon: '🎙️', label: 'War Room' },
    { id: 'pipelines', icon: '🚀', label: 'Pipelines' },
    { id: 'security', icon: '🛡️', label: 'Security' },
    { id: 'cloud', icon: '☁️', label: 'Cloud' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ]
};

export function HamburgerMenu({
  isOpen,
  setIsOpen,
  navItems,
  activeView,
  setActiveView
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  navItems: any[];
  activeView: string;
  setActiveView: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 pointer-events-auto"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="flex flex-col gap-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setActiveView(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-6 w-full py-4 px-6 rounded-2xl transition-all ${
                  activeView === item.id 
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-lg font-medium tracking-widest uppercase">{item.label}</span>
              </motion.button>
            ))}
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 p-4 text-slate-400 hover:text-white min-h-[56px] min-w-[56px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10"
          >
            <span className="text-2xl">✕</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Sidebar({ activeView, setActiveView }: { activeView: string, setActiveView: (v: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  
  // Context-aware structure
  const navItems = navConfig[activeView as keyof typeof navConfig] || navConfig.default;

  // Auto-collapse feature
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      if (expanded) {
        timeout = setTimeout(() => setExpanded(false), 5000);
      }
    };

    const events = ['mousemove', 'touchstart', 'keydown'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [expanded]);

  // Swipe detection for gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;

    if (Math.abs(deltaX) > 50) {
      const currentIndex = navItems.findIndex(i => i.id === activeView);
      if (deltaX > 0 && currentIndex < navItems.length - 1) {
        // Swipe Left -> Next
        setActiveView(navItems[currentIndex + 1].id);
      } else if (deltaX < 0 && currentIndex > 0) {
        // Swipe Right -> Previous
        setActiveView(navItems[currentIndex - 1].id);
      }
    }
    touchStartX.current = null;
  };

  return (
    <>
      <div 
        className={`group fixed bottom-0 left-0 w-full bg-black/90 border-t border-white/10 backdrop-blur-xl z-[100] transition-all duration-300 md:bottom-auto md:left-0 md:top-0 md:h-[100dvh] md:flex-col md:items-start md:py-8 md:bg-black/40 md:border-r md:border-t-0 md:overflow-visible flex flex-row items-center sm:px-2 md:px-0 md:hover:w-64 ${
          expanded ? "md:w-64" : "md:w-20"
        }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Toggle support for touch/desktop expansion */}
        <div 
          className="hidden md:flex w-full items-center justify-center h-16 pt-4 mb-4 flex-shrink-0 relative cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* SMALL LOGO: Visible only when sidebar is collapsed */}
          <img 
            src="/logos/logo.png" 
            alt="SynAegis Icon" 
            className={`absolute w-10 h-10 object-contain transition-opacity duration-300 ${expanded ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
          />
          
          {/* WIDE LOGO: Fades in and stays centered when sidebar expands */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <img 
                src="/logos/wording.png" 
                alt="SynAegis Text Logo" 
                className="w-48 h-auto object-contain pl-4" 
                style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }}
            />
          </div>
        </div>

        {/* CONTAINER: overflow visible for desktop tooltips, flex-nowrap + overflow-x-auto for tablet */}
        <div className="flex flex-row md:flex-col justify-between max-[340px]:justify-evenly sm:justify-center md:justify-start gap-2 md:gap-4 w-full h-auto px-2 md:px-4 items-center md:items-stretch overflow-x-auto md:overflow-visible flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {navItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col md:flex-row items-center justify-center gap-1 w-auto rounded-xl transition-all relative group/btn min-w-[56px] min-h-[56px] flex-shrink-0 ${expanded ? 'md:w-full md:justify-start md:px-4 md:py-3 md:gap-4 md:min-h-[48px]' : 'md:w-12 md:h-12 md:min-w-0 md:min-h-0 md:p-0 md:justify-center md:mx-auto'} ${
                activeView === item.id 
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-transparent border border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10'
              } ${
                idx >= 4 ? "hidden sm:flex md:flex" : "flex"
              } ${
                (item.id !== activeView && item.id !== 'settings') ? 'max-[340px]:hidden' : ''
              }`}
            >
              <span className="text-lg md:text-xl w-6 text-center flex-shrink-0">{item.icon}</span>
              <span className={`text-[10px] md:text-base whitespace-nowrap font-medium tracking-wide flex-shrink-0 transition-all duration-300 overflow-hidden ${expanded ? 'md:w-auto md:opacity-100' : 'md:w-0 md:opacity-0 group-hover:md:w-auto group-hover:md:opacity-100'}`}>
                {item.label}
              </span>
              
              {/* Tooltip for collapsed state (Desktop only) -> now properly visible since overflow is visible */}
              <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-black/90 border border-white/10 rounded text-xs opacity-0 group-hover/btn:opacity-100 group-hover:hidden transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}

          {/* Premium "More" Hamburger Button for very small screens */}
          <button
            onClick={() => setHamburgerOpen(true)}
            className="flex sm:hidden flex-col items-center justify-center gap-1 w-auto p-2 rounded-xl transition-all relative min-w-[56px] min-h-[56px] flex-shrink-0 bg-transparent border border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl w-6 text-center">☰</span>
            <span className="text-[10px] whitespace-nowrap font-medium tracking-wide">More</span>
          </button>
        </div>
      </div>

      <HamburgerMenu 
        isOpen={hamburgerOpen} 
        setIsOpen={setHamburgerOpen} 
        navItems={navItems} 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
    </>
  );
}

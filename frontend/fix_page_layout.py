import re

with open("app/page.tsx", "r") as f:
    content = f.read()

# Make the outer container have `flex-1 min-w-0`
content = content.replace("flex-1 transition-all", "flex-1 min-w-0 transition-all")

# Fix secondary render layout so they all share the common constraints except for dashboard which has its own
old_render = """                        {activeView === "warroom" || activeView === "pipelines" || activeView === "security" ? (
                            renderSecondaryView()
                        ) : (
                            <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 mb-32 sm:px-8 flex flex-col gap-8">
                                {/* Breadcrumbs for internal navigation */}
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tracking-widest pl-2">
                                    <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => setActiveView('dashboard')}>SYNAEGIS</span>
                                    <span>/</span>
                                    <span className="text-cyan-300 uppercase">{activeView}</span>
                                </div>

                                {activeView !== "dashboard" ? renderSecondaryView() : (
                                    <GlobalCommandDashboard setActiveView={setActiveView} />
                                )}
                            </div>
                        )}"""

new_render = """                        <div className="min-h-screen w-full bg-transparent text-white">
                            <div className={`mx-auto w-full flex flex-col gap-8 ${activeView === "dashboard" ? "max-w-[1500px] px-4 py-8 mb-32 sm:px-8" : activeView !== "warroom" ? "max-w-[1400px] px-4 sm:px-6 lg:px-10" : ""}`}>
                                {activeView !== "dashboard" && activeView !== "warroom" && (
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tracking-widest px-2 pt-8">
                                        <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => setActiveView('dashboard')}>SYNAEGIS</span>
                                        <span>/</span>
                                        <span className="text-cyan-300 uppercase">{activeView}</span>
                                    </div>
                                )}
                                
                                {activeView !== "dashboard" ? renderSecondaryView() : (
                                    <GlobalCommandDashboard setActiveView={setActiveView} />
                                )}
                            </div>
                        </div>"""

if old_render in content:
    content = content.replace(old_render, new_render)
else:
    print("WARNING: Could not find old_render in page.tsx")

with open("app/page.tsx", "w") as f:
    f.write(content)

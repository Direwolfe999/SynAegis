const fs = require('fs');

let content = fs.readFileSync('components/PWAInstallButton.tsx', 'utf8');
content = content.replace(
    /if \(!isInstallable\) return null;/g,
    `if (!isInstallable) {
        return (
            <button
                disabled
                className="flex items-center gap-2 rounded-lg bg-slate-500/10 px-4 py-2 text-sm font-medium text-slate-500 border border-slate-500/20 cursor-not-allowed"
                title="PWA already installed or not supported by this browser"
            >
                <Download className="h-4 w-4" />
                <span>Install App</span>
            </button>
        );
    }`
);
fs.writeFileSync('components/PWAInstallButton.tsx', content);

let settings = fs.readFileSync('components/SettingsDashboard.tsx', 'utf8');

// The script inserted it into ProfileSettings, let's leave it and maybe also put it in System Settings.
if (!settings.includes('<PWAInstallButton />') || settings.match(/<PWAInstallButton \/>/g).length === 1) {
    // Add to system settings
    const sysMatch = '<div className="space-y-6 md:space-y-8">\n    <div>\n      <h2 className="text-xl font-semibold mb-1">Core Architecture Parameters</h2>';
    const replaceSys = `<div className="space-y-6 md:space-y-8">
    <div className={\`p-4 mb-4 rounded-xl border flex items-center justify-between \${darkMode ? "bg-cyan-950/20 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"}\`}>
      <div>
        <h3 className={\`text-sm font-semibold mb-1 \${darkMode ? "text-cyan-400" : "text-cyan-700"}\`}>Install Desktop App</h3>
        <p className={\`text-xs \${darkMode ? "text-cyan-200/60" : "text-cyan-600/80"}\`}>Get the native offline experience with push notifications.</p>
      </div>
      <PWAInstallButton />
    </div>
    <div>
      <h2 className="text-xl font-semibold mb-1">Core Architecture Parameters</h2>`;
      
    settings = settings.replace(sysMatch, replaceSys);
    fs.writeFileSync('components/SettingsDashboard.tsx', settings);
}

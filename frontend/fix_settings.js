const fs = require('fs');

let fileStr = fs.readFileSync('components/SettingsDashboard.tsx', 'utf8');

// Layout constraints part 1
fileStr = fileStr.replace(
  /className=\{`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 \$\{darkMode \? "bg-\[#050505\] text-slate-200" : "bg-slate-50 text-slate-900"\}`\}/,
  'className={`w-full flex flex-col font-sans transition-colors duration-300 bg-transparent`}'
);

// Layout constraints part 2
fileStr = fileStr.replace(
  /<div className="flex-1 max-w-\[1400px\] mx-auto w-full flex flex-col md:flex-row p-4 sm:p-6 lg:p-10 gap-6 lg:gap-12 pb-24">/,
  '<div className="flex-1 w-full flex flex-col md:flex-row gap-6 lg:gap-12 pb-24 pt-6">'
);

// Layout constraints part 3
fileStr = fileStr.replace(
  /<header className=\{`sticky top-0 z-50 px-4 md:px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl \$\{darkMode \? "border-white\/10 bg-\[#050505\]\/70" : "border-slate-200 bg-white\/80"\}`\}>/,
  '<header className={`sticky top-0 z-50 py-4 flex items-center justify-between border-b backdrop-blur-xl -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 ${darkMode ? "border-white/10 bg-[#050505]/70" : "border-slate-200 bg-white/80"}`}>'
);

// Menu scroll
fileStr = fileStr.replace(
  /nav className="flex flex-row md:flex-col gap-2 sticky top-24 overflow-x-auto pb-2 md:pb-0 scrollbar-hide"/,
  'nav className="flex flex-row md:flex-col gap-2 sticky top-24 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide whitespace-nowrap"'
);

// 2FA Security additions
const secSettingsTarget = `    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Security</h2>
        <p className={\`text-sm \$\{darkMode \? "text-slate-400" : "text-slate-500"\}\`}>Manage your account access and credentials.</p>
      </div>
      <div className={\`p-4 md:p-6 rounded-2xl border \$\{darkMode \? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"\}\`}>
        <h3 className={\`text-sm font-semibold mb-4 flex items-center gap-2 \$\{darkMode \? "text-slate-200" : "text-slate-800"\}\`}>
          <Lock className="w-4 h-4" /> Change Password
        </h3>
        <div className="space-y-4 max-w-sm">
          <InputField label="Current Password" type="password" placeholder="••••••••" value={currentPass} onChange={setCurrentPass} darkMode={darkMode} />
          <InputField label="New Password" type="password" placeholder="••••••••" value={newPass} onChange={setNewPass} darkMode={darkMode} />
          <button onClick={handleUpdate} disabled={isSav} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {isSav ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>`;

const newSecSettings = `    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Security</h2>
        <p className={\`text-sm \$\{darkMode ? "text-slate-400" : "text-slate-500"\}\`}>Manage your account access and credentials.</p>
      </div>
      <div className={\`p-4 md:p-6 rounded-2xl border \$\{darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"\}\`}>
        <h3 className={\`text-sm font-semibold mb-4 flex items-center gap-2 \$\{darkMode ? "text-slate-200" : "text-slate-800"\}\`}>
          <Lock className="w-4 h-4" /> Change Password
        </h3>
        <div className="space-y-4 max-w-sm">
          <InputField label="Current Password" type="password" placeholder="••••••••" value={currentPass} onChange={setCurrentPass} darkMode={darkMode} />
          <InputField label="New Password" type="password" placeholder="••••••••" value={newPass} onChange={setNewPass} darkMode={darkMode} />
          <button onClick={handleUpdate} disabled={isSav} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {isSav ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      <div className={\`p-4 md:p-6 rounded-2xl border \$\{darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"\}\`}>
        <h3 className={\`text-sm font-semibold mb-1 flex items-center gap-2 \$\{darkMode ? "text-slate-200" : "text-slate-800"\}\`}>
          <Shield className="w-4 h-4" /> Multi-Factor Authentication (MFA)
        </h3>
        <p className={\`text-xs mb-4 \$\{darkMode ? "text-slate-400" : "text-slate-500"\}\`}>Secure your account with an additional layer of defense.</p>
        
        <div className="space-y-4">
            <div className={\`p-4 rounded-xl border flex items-center justify-between \$\{darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"\}\`}>
                <div className="flex items-center gap-3">
                    <Smartphone className={\`w-5 h-5 \$\{darkMode ? "text-indigo-400" : "text-indigo-600"\}\`} />
                    <div>
                        <p className={\`text-sm font-medium \$\{darkMode ? "text-slate-200" : "text-slate-800"\}\`}>Authenticator App</p>
                        <p className={\`text-xs \$\{darkMode ? "text-slate-400" : "text-slate-500"\}\`}>Use Google Authenticator or Authy</p>
                    </div>
                </div>
                <button className={\`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors \$\{darkMode ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"\}\`}>Setup</button>
            </div>
            <div className={\`p-4 rounded-xl border flex items-center justify-between \$\{darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"\}\`}>
                <div className="flex items-center gap-3">
                    <Mail className={\`w-5 h-5 \$\{darkMode ? "text-indigo-400" : "text-indigo-600"\}\`} />
                    <div>
                        <p className={\`text-sm font-medium \$\{darkMode ? "text-slate-200" : "text-slate-800"\}\`}>Email OTP</p>
                        <p className={\`text-xs \$\{darkMode ? "text-slate-400" : "text-slate-500"\}\`}>Receive one-time passcodes via email</p>
                    </div>
                </div>
                <button className={\`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors \$\{darkMode ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"\}\`}>Enable</button>
            </div>
        </div>
      </div>
      
      <div className={\`p-4 md:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 \$\{darkMode ? "border-red-500/20 bg-red-500/5" : "border-red-200 bg-red-50"\}\`}>
        <div>
            <h3 className={\`text-sm font-semibold mb-1 text-red-500\`}>Active Sessions</h3>
            <p className={\`text-xs \$\{darkMode ? "text-red-400/80" : "text-red-600/80"\}\`}>Log out of all devices to revoke active tokens immediately.</p>
        </div>
        <button className="px-4 py-2 text-xs font-medium rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">Revoke All Sessions</button>
      </div>
    </div>`;

fileStr = fileStr.replace(secSettingsTarget, newSecSettings);

// Integrations
const intsTarget = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProviderCard name="GitLab" provider="gitlab" desc="Sync CI/CD pipelines and vulnerability automated PR patching." icon={<Globe className="w-6 h-6 text-[#E24329]" />} />
          <ProviderCard name="Google Gemini" provider="gemini" desc="Enable advanced AI analysis and live audio capabilities." icon={<span className="font-bold text-blue-500 text-xl font-serif">G</span>} />
          <ProviderCard name="Slack" provider="slack" desc="Push critical error streams to designated team channels." icon={<span className="font-bold text-[#4A154B] dark:text-[#E01E5A] text-xl font-serif">#</span>} />
        </div>`;
const newInts = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProviderCard name="GitLab" provider="gitlab" desc="Sync CI/CD pipelines and PR patching." icon={<Globe className="w-6 h-6 text-[#E24329]" />} />
          <ProviderCard name="Google Gemini" provider="gemini" desc="Enable advanced AI analysis and voice." icon={<span className="font-bold text-blue-500 text-xl font-serif">G</span>} />
          <ProviderCard name="Slack" provider="slack" desc="Push critical error streams to channels." icon={<span className="font-bold text-[#4A154B] dark:text-[#E01E5A] text-xl font-serif">#</span>} />
          <ProviderCard name="GitHub" provider="github" desc="Code scanning and repository triggers." icon={<span className="font-bold text-slate-800 dark:text-slate-200 text-xl font-serif">GH</span>} />
          <ProviderCard name="AWS" provider="aws" desc="Cloud threat insights and EBS monitoring." icon={<span className="font-bold text-[#FF9900] text-xl font-serif">AWS</span>} />
          <ProviderCard name="Sentry" provider="sentry" desc="Error stream aggregation and real-time capture." icon={<span className="font-bold text-[#362D59] dark:text-[#E01E5A] text-xl font-serif">S</span>} />
        </div>`;

fileStr = fileStr.replace(intsTarget, newInts);

fs.writeFileSync('components/SettingsDashboard.tsx', fileStr);

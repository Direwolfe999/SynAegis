import re

with open("frontend/components/SettingsDashboard.tsx", "r") as f:
    text = f.read()

# Replace the specific SecuritySettings component fully
start_marker = "/* --- Security Settings --- */"
end_marker = "/* --- Integrations Settings --- */"

if start_marker in text and end_marker in text:
    before = text.split(start_marker)[0]
    after = text.split(end_marker)[1]
    
    new_comp = """/* --- Security Settings --- */
const SecuritySettings = ({ darkMode, addToast }: any) => {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isSav, setIsSav] = useState(false);

  const handleUpdate = async () => {
    if (!currentPass || !newPass) { addToast("Password fields cannot be empty.", "error"); return; }
    if (newPass.length < 8) { addToast("New password must be at least 8 characters.", "error"); return; }
    setIsSav(true);
    try {
      // simulate delay
      await new Promise(r => setTimeout(r, 1000));
      addToast("Password changed successfully", "success");
      setCurrentPass(""); setNewPass("");
    } catch {
      addToast("Failed to update password. Check current credentials.", "error");
    } finally {
      setIsSav(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Security</h2>
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Manage your account access and credentials.</p>
      </div>
      <div className={`p-4 md:p-6 rounded-2xl border ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
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

      <div className={`p-4 md:p-6 rounded-2xl border ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
        <h3 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
          <Shield className="w-4 h-4" /> Multi-Factor Authentication (MFA)
        </h3>
        <p className={`text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Secure your account with an additional layer of defense.</p>
        
        <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-3">
                    <Smartphone className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Authenticator App</p>
                        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Use Google Authenticator or Authy</p>
                    </div>
                </div>
                <button className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"}`}>Setup</button>
            </div>
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-3">
                    <Mail className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Email OTP</p>
                        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Receive one-time passcodes via email</p>
                    </div>
                </div>
                <button className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"}`}>Enable</button>
            </div>
        </div>
      </div>
      
      <div className={`p-4 md:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${darkMode ? "border-red-500/20 bg-red-500/5" : "border-red-200 bg-red-50"}`}>
        <div>
            <h3 className={`text-sm font-semibold mb-1 text-red-500`}>Active Sessions</h3>
            <p className={`text-xs ${darkMode ? "text-red-400/80" : "text-red-600/80"}`}>Log out of all devices to revoke active tokens immediately.</p>
        </div>
        <button onClick={() => addToast("Revoked all active sessions across devices.", "success")} className="px-4 py-2 text-xs font-medium rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">Revoke All Sessions</button>
      </div>
    </div>
  );
};

/* --- Integrations Settings --- */
"""
    
    with open("frontend/components/SettingsDashboard.tsx", "w") as f:
        f.write(before + new_comp + after)


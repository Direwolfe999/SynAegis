import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Link as LinkIcon, Key, Bell, Palette, Settings2,
  Moon, Sun, Camera, Shield, Smartphone, Globe, Copy, Check,
  Eye, EyeOff, ChevronRight, Save, LogOut, Laptop, Plus, Trash2, Mail
} from "lucide-react";
import { useToast } from "./ToastProvider";
import {
  fetchProfile, updateProfile, fetchApiKeys, createApiKey, revokeApiKey,
  fetchIntegrations, addIntegration, rmdIntegration, fetchPreferences, updatePreferences, updateSecurity
} from "../lib/api";

type Profile = { first_name: string; last_name: string; email: string; bio: string };
type Prefs = { theme: string; ui_density: string; default_ai_model: string; log_retention: string; notifications: Record<string, boolean> };

export default function SettingsDashboard({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { addToast, showModal } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({ first_name: '', last_name: '', email: '', bio: '' });
  const [originalProfile, setOriginalProfile] = useState<Profile>({ first_name: '', last_name: '', email: '', bio: '' });
  
  const [prefs, setPrefs] = useState<Prefs>({ theme: 'dark', ui_density: 'Comfortable', default_ai_model: 'Gemini 1.5 Pro', log_retention: '30 Days', notifications: {} });
  const [originalPrefs, setOriginalPrefs] = useState<Prefs>({ theme: 'dark', ui_density: 'Comfortable', default_ai_model: 'Gemini 1.5 Pro', log_retention: '30 Days', notifications: {} });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prof, p] = await Promise.all([fetchProfile(), fetchPreferences()]);
      if (prof) { setProfile(prof); setOriginalProfile(prof); }
      if (p) { 
        setPrefs(p); setOriginalPrefs(p); 
        setDarkMode(p.theme === 'dark'); 
      }
      const a = localStorage.getItem("avatar");
      if (a) setAvatarPreview(a);
    } catch (e) {
      addToast("Failed to load settings data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hasChanges = useMemo(() => {
    if (activeTab === "profile") return JSON.stringify(profile) !== JSON.stringify(originalProfile);
    if (["appearance", "system", "notifications"].includes(activeTab)) return JSON.stringify(prefs) !== JSON.stringify(originalPrefs);
    return false;
  }, [profile, originalProfile, prefs, originalPrefs, activeTab]);

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const handleSave = async () => {
    if (activeTab === "profile" && profile.email && !validateEmail(profile.email)) {
      addToast("Please enter a valid email address.", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (activeTab === "profile") {
        await updateProfile(profile);
        setOriginalProfile(profile);
      } else if (["appearance", "system", "notifications"].includes(activeTab)) {
        await updatePreferences({ ...prefs, theme: darkMode ? 'dark' : 'light' });
        setOriginalPrefs(prefs);
      }
      addToast("Settings updated successfully.", "success");
    } catch (e) {
      addToast("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "integrations", label: "Integrations", icon: <LinkIcon className="w-4 h-4" /> },
    { id: "apikeys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "system", label: "System", icon: <Settings2 className="w-4 h-4" /> }
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${darkMode ? "bg-[#050505]" : "bg-slate-50"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${darkMode ? "bg-[#050505] text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      <header className={`sticky top-0 z-50 px-4 md:px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl ${darkMode ? "border-white/10 bg-[#050505]/70" : "border-slate-200 bg-white/80"}`}>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight hidden sm:block">Platform Settings</span>
          </div>
          <nav className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500">
            <button onClick={onBack} className="hover:text-indigo-400 transition-colors">Workspace</button>
            <span>/</span>
            <span className={darkMode ? "text-slate-200" : "text-slate-900"}>Settings</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              setPrefs({...prefs, theme: newMode ? 'dark' : 'light'});
              updatePreferences({ ...prefs, theme: newMode ? 'dark' : 'light' });
            }} 
            className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 border-2 border-[#050505] shadow-sm flex items-center justify-center overflow-hidden">
             {avatarPreview && <img src={avatarPreview} className="w-full h-full object-cover" />}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] mx-auto w-full flex flex-col md:flex-row p-4 sm:p-6 lg:p-10 gap-6 lg:gap-12 pb-24">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 sticky top-24 overflow-x-auto pb-2 md:pb-0 scrollbar-hide" aria-label="Settings Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 md:w-full flex items-center justify-start gap-2.5 px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? (darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")
                    : (darkMode ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50 hidden md:block" />}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className={`p-4 md:p-8 rounded-2xl border shadow-sm transition-colors duration-300 ${darkMode ? "bg-[#0a0a0a] border-white/10 shadow-black/20" : "bg-white border-slate-200"}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {activeTab === "profile" && <ProfileSettings darkMode={darkMode} profile={profile} setProfile={setProfile} avatarPreview={avatarPreview} setAvatarPreview={setAvatarPreview} fileInputRef={fileInputRef} addToast={addToast} />}
                {activeTab === "security" && <SecuritySettings darkMode={darkMode} addToast={addToast} />}
                {activeTab === "integrations" && <IntegrationsSettings darkMode={darkMode} showModal={showModal} addToast={addToast} />}
                {activeTab === "apikeys" && <APIKeysSettings darkMode={darkMode} showModal={showModal} addToast={addToast} />}
                {activeTab === "notifications" && <NotificationSettings darkMode={darkMode} prefs={prefs} setPrefs={setPrefs} />}
                {activeTab === "appearance" && <AppearanceSettings darkMode={darkMode} setDarkMode={setDarkMode} prefs={prefs} setPrefs={setPrefs} />}
                {activeTab === "system" && <SystemSettings darkMode={darkMode} prefs={prefs} setPrefs={setPrefs} />}
              </motion.div>
            </AnimatePresence>

            {["profile", "appearance", "system", "notifications"].includes(activeTab) && (
              <div className={`mt-10 pt-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                <button 
                  onClick={() => {
                    setProfile(originalProfile);
                    setPrefs(originalPrefs);
                  }}
                  disabled={!hasChanges || isSaving}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${darkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const InputField = ({ label, type = "text", placeholder, value, onChange, darkMode, icon }: any) => (
  <div className="space-y-1.5 w-full">
    <label className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{label}</label>
    <div className="relative">
      {icon && <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{icon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2.5 rounded-xl border text-sm transition-colors outline-none ${darkMode ? "bg-black/50 border-white/10 text-white focus:border-indigo-500 focus:bg-white/5" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"}`}
      />
    </div>
  </div>
);

const ToggleSwitch = ({ label, description, checked, onChange, darkMode }: any) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1 pr-6">
      <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{label}</p>
      {description && <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkMode ? "focus:ring-offset-[#0a0a0a]" : ""} ${checked ? "bg-indigo-500" : darkMode ? "bg-white/10" : "bg-slate-200"}`}
    >
      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  </div>
);

/* --- Profile Settings --- */
const ProfileSettings = ({ darkMode, profile, setProfile, avatarPreview, setAvatarPreview, fileInputRef, addToast }: any) => (
  <div className="space-y-6 md:space-y-8">
    <div>
      <h2 className="text-xl font-semibold mb-1">Personal Information</h2>
      <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Update your photo and platform identity.</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start">
      <div className="flex flex-col items-center gap-3">
        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex items-center justify-center relative group overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
          {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" /> : <User className={`w-8 h-8 md:w-10 md:h-10 ${darkMode ? "text-slate-600" : "text-slate-300"}`} />}
          <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const r = new FileReader();
            r.onloadend = () => {
              setAvatarPreview(r.result as string);
              localStorage.setItem('avatar', r.result as string);
              window.dispatchEvent(new Event('avatarChanged'));
              addToast("Avatar saved locally.", "success");
            };
            r.readAsDataURL(file);
          }
        }} />
        <button onClick={() => fileInputRef.current?.click()} className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          Upload Photo
        </button>
      </div>
      <div className="flex-1 w-full space-y-4 md:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          <InputField label="First Name" value={profile.first_name} onChange={(v: string) => setProfile({ ...profile, first_name: v })} darkMode={darkMode} />
          <InputField label="Last Name" value={profile.last_name} onChange={(v: string) => setProfile({ ...profile, last_name: v })} darkMode={darkMode} />
        </div>
        <InputField label="Email Address" type="email" icon={<Mail className="w-4 h-4" />} value={profile.email} onChange={(v: string) => setProfile({ ...profile, email: v })} darkMode={darkMode} />
        <div className="space-y-1.5">
          <label className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Bio</label>
          <textarea rows={3} value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none resize-none ${darkMode ? "bg-black/50 border-white/10 text-white focus:border-indigo-500 focus:bg-white/5" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"}`} placeholder="Tell us about yourself..." />
        </div>
      </div>
    </div>
  </div>
);

/* --- Security Settings --- */
const SecuritySettings = ({ darkMode, addToast }: any) => {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isSav, setIsSav] = useState(false);

  const handleUpdate = async () => {
    if (!currentPass || !newPass) { addToast("Password fields cannot be empty.", "error"); return; }
    if (newPass.length < 8) { addToast("New password must be at least 8 characters.", "error"); return; }
    setIsSav(true);
    try {
      await updateSecurity({ current_password: currentPass, new_password: newPass });
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
    </div>
  );
};

/* --- Integrations Settings --- */
const IntegrationsSettings = ({ darkMode, showModal, addToast }: any) => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInts = async () => {
    try {
      const res = await fetchIntegrations();
      if (res) setIntegrations(res);
    } finally { setIsLoading(false); }
  };
  
  useEffect(() => { fetchInts(); }, []);

  const handleAdd = async (provider: string) => {
    // In a real app, this redirects to OAuth flow. Here we simulate.
    try {
      await addIntegration(provider, `token-${Date.now()}`);
      addToast(`Successfully connected to ${provider}`, "success");
      fetchInts();
    } catch {
      addToast(`Failed to connect to ${provider}`, "error");
    }
  };

  const confirmRemove = (provider: string) => {
    showModal({
      title: `Disconnect ${provider}?`,
      description: `Disconneting ${provider} may impact automated workflows and break CI/CD telemetry.`,
      riskLevel: "medium",
      impact: "Authentication tokens will be explicitly revoked from the backend store.",
      confirmText: "Yes, Disconnect",
      onConfirm: async () => {
        try {
           await rmdIntegration(provider);
           addToast(`Disconnected ${provider}`, "info");
           fetchInts();
        } catch {
           addToast(`Error disconnecting ${provider}`, "error");
        }
      }
    });
  };

  const isConnected = (p: string) => integrations.some(i => i.provider === p.toLowerCase());

  const ProviderCard = ({ name, provider, desc, icon }: any) => (
    <div className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-colors ${darkMode ? "border-white/10 bg-white/5 hover:bg-white/[0.07]" : "border-slate-200 bg-white hover:border-indigo-200"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
            {icon}
          </div>
          <div>
            <p className={`font-semibold text-sm ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{name}</p>
            <p className={`text-xs mt-1 max-w-[200px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-transparent" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {isConnected(provider) ? (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500"><Check className="w-4 h-4" /> Active</span>
            <button onClick={() => confirmRemove(provider)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${darkMode ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"}`}>Disconnect</button>
          </>
        ) : (
          <>
            <span className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Not connected</span>
            <button onClick={() => handleAdd(provider)} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition-colors">Connect</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Integrations</h2>
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Link your platform with critical third-party resources.</p>
      </div>
      {isLoading ? (
        <div className="animate-pulse flex gap-4"><div className="w-full h-32 bg-white/5 rounded-2xl"></div><div className="w-full h-32 bg-white/5 rounded-2xl hidden md:block"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProviderCard name="GitLab" provider="gitlab" desc="Sync CI/CD pipelines and vulnerability automated PR patching." icon={<Globe className="w-6 h-6 text-[#E24329]" />} />
          <ProviderCard name="Google Gemini" provider="gemini" desc="Enable advanced AI analysis and live audio capabilities." icon={<span className="font-bold text-blue-500 text-xl font-serif">G</span>} />
          <ProviderCard name="Slack" provider="slack" desc="Push critical error streams to designated team channels." icon={<span className="font-bold text-[#4A154B] dark:text-[#E01E5A] text-xl font-serif">#</span>} />
        </div>
      )}
    </div>
  );
};

/* --- API Keys Settings --- */
const APIKeysSettings = ({ darkMode, showModal, addToast }: any) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadKeys = async () => { 
    try {
      const data = await fetchApiKeys(); 
      if (data) setKeys(data); 
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const res = await createApiKey(newKeyName);
      // Wait for modal or toast to show full key
      showModal({
        title: "API Key Generated",
        description: `Your API key for '${newKeyName}' has been generated. Copy it now, it will not be shown again.`,
        riskLevel: "low",
        impact: res.token_full,
        confirmText: "Acknowledge",
        onConfirm: () => {}
      });
      setNewKeyName("");
      loadKeys();
    } catch {
      addToast("Failed to create key", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmRevoke = (id: string, name: string) => {
    showModal({
      title: "Revoke API Key",
      description: `Are you sure you want to revoke the key '${name}'?`,
      riskLevel: "high",
      impact: "Any integrations using this specific token will immediately fail and receive 401 Unauthorized responses.",
      confirmText: "Yes, Revoke Route",
      onConfirm: async () => {
        try {
          await revokeApiKey(id);
          addToast("Key revoked successfully.", "success");
          loadKeys();
        } catch {
          addToast("Error revoking key.", "error");
        }
      }
    });
  };

  const copyToClip = (txt: string) => {
    navigator.clipboard.writeText(txt);
    addToast("Prefix copied to clipboard.", "info");
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">API Access Keys</h2>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Generate programmatic tokens to execute external REST triggers.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            value={newKeyName} 
            onChange={e => setNewKeyName(e.target.value)} 
            placeholder="e.g. CI/CD Runner" 
            className={`w-full sm:w-48 px-3 py-2 text-sm rounded-xl border outline-none focus:border-indigo-500 transition-colors ${darkMode ? "bg-black/50 border-white/10 text-white" : "bg-white border-slate-300"}`} 
          />
          <button 
            onClick={handleCreate} 
            disabled={isCreating || !newKeyName.trim()}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isCreating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>
      
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"}`}>
        <div className={`p-4 border-b text-xs font-semibold uppercase tracking-wider flex ${darkMode ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
          <div className="w-5/12 sm:w-1/3">Name</div>
          <div className="w-5/12 sm:w-1/3 text-center sm:text-left">Prefix</div>
          <div className="w-2/12 sm:w-1/3 text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Key className={`w-8 h-8 ${darkMode ? "text-slate-600" : "text-slate-300"}`} />
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No active API keys found.</p>
          </div>
        ) : (
          keys.map(k => (
            <div key={k.id} className={`p-4 flex items-center text-sm border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors ${darkMode ? "text-slate-300 border-white/5" : "text-slate-700 border-slate-100"}`}>
              <div className="w-5/12 sm:w-1/3 font-medium flex items-center gap-2">
                <Laptop className={`w-4 h-4 hidden sm:block ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                <span className="truncate">{k.name}</span>
              </div>
              <div className="w-5/12 sm:w-1/3 font-mono text-xs text-center sm:text-left flex items-center sm:justify-start justify-center gap-2">
                <span className={`px-2 py-1 rounded bg-black/5 dark:bg-white/10`}>{k.token_prefix}••••</span>
                <button onClick={() => copyToClip(k.token_prefix)} className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/20`}><Copy className="w-3 h-3" /></button>
              </div>
              <div className="w-2/12 sm:w-1/3 text-right flex justify-end">
                <button onClick={() => confirmRevoke(k.id, k.name)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" aria-label="Revoke Key">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* --- Notifications Settings --- */
const NotificationSettings = ({ darkMode, prefs, setPrefs }: any) => {
  const toggle = (key: string) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, [key]: !prefs.notifications[key] } });
  
  return (
    <div className="space-y-6 md:space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold mb-1">Event Notifications</h2>
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Selectively tune the noise ratio of your active command center alerts.</p>
      </div>
      <div className={`p-2 rounded-2xl border ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
        <div className="px-4 py-2">
          <ToggleSwitch label="Critical Pipeline Failures" description="Receive immediate webhook triggers if master branch builds fail." checked={prefs.notifications?.pipeline_failures ?? true} onChange={() => toggle('pipeline_failures')} darkMode={darkMode} />
          <div className={`h-px w-full my-1 ${darkMode ? "bg-white/5" : "bg-slate-100"}`}></div>
          <ToggleSwitch label="High Severity Security Threats" description="Push alerts when DDOS or brute force attempts hit node perimeters." checked={prefs.notifications?.security_threats ?? true} onChange={() => toggle('security_threats')} darkMode={darkMode} />
          <div className={`h-px w-full my-1 ${darkMode ? "bg-white/5" : "bg-slate-100"}`}></div>
          <ToggleSwitch label="Cloud Capacity Warnings" description="Alerts when node CPU loads exceed configured thresholds continuously." checked={prefs.notifications?.cloud_warnings ?? false} onChange={() => toggle('cloud_warnings')} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

/* --- Appearance Settings --- */
const AppearanceSettings = ({ darkMode, setDarkMode, prefs, setPrefs }: any) => (
  <div className="space-y-6 md:space-y-8">
    <div>
      <h2 className="text-xl font-semibold mb-1">Appearance</h2>
      <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Customize how the platform command center looks on your physical monitors.</p>
    </div>
    
    <div className="space-y-4">
      <h3 className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Theme Toggle</h3>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <button onClick={() => { setDarkMode(false); setPrefs({...prefs, theme: 'light'}); }} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${!darkMode ? "border-indigo-500 bg-indigo-500/5 text-indigo-600" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"}`}>
          <Sun className={`w-6 h-6 md:w-8 md:h-8 ${!darkMode ? 'text-indigo-500' : ''}`} />
          <span className="font-medium text-xs md:text-sm">Light Interface</span>
        </button>
        <button onClick={() => { setDarkMode(true); setPrefs({...prefs, theme: 'dark'}); }} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${darkMode ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-white/10 bg-white/5 text-slate-400 hover:border-indigo-500/50"}`}>
          <Moon className={`w-6 h-6 md:w-8 md:h-8 ${darkMode ? 'text-indigo-400' : ''}`} />
          <span className="font-medium text-xs md:text-sm">Dark Environment</span>
        </button>
      </div>
    </div>

    <div className="space-y-4 pt-6">
      <h3 className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Information Density</h3>
      <select value={prefs.ui_density || "Comfortable"} onChange={(e) => setPrefs({ ...prefs, ui_density: e.target.value })} className={`w-full max-w-sm px-4 py-3 rounded-xl border text-sm transition-colors outline-none cursor-pointer ${darkMode ? "bg-black/50 border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"}`}>
        <option>Compact (Maximized Data)</option>
        <option>Comfortable (Recommended)</option>
        <option>Spacious (Touch Targets)</option>
      </select>
    </div>
  </div>
);

/* --- System Settings --- */
const SystemSettings = ({ darkMode, prefs, setPrefs }: any) => (
  <div className="space-y-6 md:space-y-8">
    <div>
      <h2 className="text-xl font-semibold mb-1">Core Architecture Parameters</h2>
      <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Control internal logical systems and AI behavioral deployments.</p>
    </div>
    
    <div className="space-y-6 max-w-sm">
      <div className="space-y-2">
        <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Primary Reasoning AI Model</label>
        <select value={prefs.default_ai_model || "Gemini 1.5 Pro"} onChange={(e) => setPrefs({ ...prefs, default_ai_model: e.target.value })} className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none cursor-pointer ${darkMode ? "bg-black/50 border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"}`}>
          <option>Gemini 1.5 Pro (Balanced Logic)</option>
          <option>Gemini 1.5 Flash (Low Latency Voice)</option>
          <option>Claude 3.5 Sonnet (Advanced Coding)</option>
        </select>
        <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Affects complex reasoning fallbacks when processing PR diffs.</p>
      </div>
      
      <div className="space-y-2">
        <label className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Global Log Retention Period</label>
        <select value={prefs.log_retention || "30 Days"} onChange={(e) => setPrefs({ ...prefs, log_retention: e.target.value })} className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none cursor-pointer ${darkMode ? "bg-black/50 border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"}`}>
          <option>7 Days (Compliance)</option>
          <option>30 Days (Standard Context)</option>
          <option>90 Days (Deep Forensics)</option>
          <option>Indefinite (High AWS EBS Cost)</option>
        </select>
      </div>
    </div>
  </div>
);

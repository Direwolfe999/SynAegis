import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Link as LinkIcon, Key, Bell, Palette, Settings2,
  Moon, Sun, Camera, Shield, Smartphone, Globe, Copy, Check,
  Eye, EyeOff, ChevronRight, Save, LogOut, Laptop, Plus, Trash2, Mail
} from "lucide-react";
import { useToast } from "./ToastProvider";
import PWAInstallButton from "./PWAInstallButton";
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
    <div className={`w-full flex flex-col font-sans transition-all duration-500 ease-in-out bg-transparent`}>
      <header className={`sticky top-0 z-50 py-4 flex items-center justify-between border-b backdrop-blur-xl -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 ${darkMode ? "border-white/10 bg-[#050505]/70" : "border-slate-200 bg-white/80"}`}>
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
            <span className={darkMode ? "text-slate-200" : "text-black"}>Settings</span>
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

      <div className="flex-1 w-full flex flex-col md:flex-row gap-6 lg:gap-12 pb-24 pt-6">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 sticky top-24 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide whitespace-nowrap" aria-label="Settings Tabs">
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
          <div className={`p-4 md:p-8 rounded-2xl border shadow-sm transition-all duration-500 ease-in-out ${darkMode ? "bg-[#0a0a0a] border-white/10 shadow-black/20" : "bg-white border-slate-200"}`}>
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
    <label className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-black font-semibold"}`}>{label}</label>
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
      <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-black"}`}>{label}</p>
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
    <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-cyan-950/20 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"}`}>
      <div>
        <h3 className={`text-sm font-semibold mb-1 ${darkMode ? "text-cyan-400" : "text-cyan-700"}`}>Install Desktop App</h3>
        <p className={`text-xs ${darkMode ? "text-cyan-200/60" : "text-cyan-600/80"}`}>Get the native offline experience with push notifications.</p>
      </div>
      <PWAInstallButton />
    </div>

    <div>
      <h2 className="text-xl font-semibold mb-1">Personal Information</h2>
      <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Update your photo and platform identity.</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start">
      <div className="flex flex-col items-center gap-3">
        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex items-center justify-center relative group overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
          {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" /> : <User className={`w-8 h-8 md:w-10 md:h-10 ${darkMode ? "text-slate-900 font-medium" : "text-slate-300"}`} />}
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
          <label className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-black font-semibold"}`}>Bio</label>
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
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-black"}`}>
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
        <h3 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-black"}`}>
          <Shield className="w-4 h-4" /> Multi-Factor Authentication (MFA)
        </h3>
        <p className={`text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Secure your account with an additional layer of defense.</p>
        
        <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-3">
                    <Smartphone className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-black"}`}>Authenticator App</p>
                        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Use Google Authenticator or Authy</p>
                    </div>
                </div>
                <button className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"}`}>Setup</button>
            </div>
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-3">
                    <Mail className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-black"}`}>Email OTP</p>
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
        <button className="px-4 py-2 text-xs font-medium rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">Revoke All Sessions</button>
      </div>
    </div>
  );
};

/* --- Integrations Settings --- */


const IntegrationsSettings = ({ darkMode, showModal, addToast }: any) => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInts = async () => {
    try {
      const res = await fetchIntegrations();
      if (res) setIntegrations(res);
    } finally { setIsLoading(false); }
  };
  
  useEffect(() => { fetchInts(); }, []);

  const confirmRemove = (provider: string) => {
    showModal({
      title: `Disconnect ${provider}?`,
      description: `Disconnecting ${provider} may impact automated workflows and break CI/CD telemetry.`,
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
          <div className={`p-2.5 rounded-xl ${darkMode ? "bg-[#1A1A1A] border border-white/5 shadow-inner" : "bg-white border border-slate-100 shadow-sm"}`}>
            {icon}
          </div>
          <div>
            <p className={`font-semibold text-sm ${darkMode ? "text-slate-200" : "text-black"}`}>{name}</p>
            <p className={`text-xs mt-1 max-w-[200px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-transparent" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {isConnected(provider) ? (
          <>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <Check className="w-4 h-4" /> Connected
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => confirmRemove(provider)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${darkMode ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"}`}
                title="Disconnect"
              >
                Disconnect
              </button>
              <button 
                disabled 
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-not-allowed ${darkMode ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-400"}`}
              >
                Connect
              </button>
            </div>
          </>
        ) : (
          <>
            <span className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Not connected</span>
            <button 
              onClick={() => { setActiveProvider(provider); setModalOpen(true); }} 
              className="px-5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition-colors"
            >
              Connect
            </button>
          </>
        )}
      </div>
    </div>
  );

  const icons = {
    github: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={darkMode ? "text-white" : "text-slate-900"}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
    gitlab: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.84.84 0 0 1 6.32 1.9c.47.05.85.42.92.89L9.69 10.3h4.63l2.45-7.51a.84.84 0 0 1 .91-.89c.48-.05.86.32.93.79l2.43 7.51 1.22 3.78c.15.5.02 1.04-.32 1.4z" fill="#E24329"/>
      </svg>
    ),
    slack: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#E01E5A]">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52H15.165z"/>
      </svg>
    ),
    gemini: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="url(#gemini-grad)"/>
        <defs>
          <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22">
            <stop stopColor="#4185f4"/><stop offset="1" stopColor="#ea4335"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    aws: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF9900">
        <path d="M12.923 18.258c-1.341.344-2.813.529-4.22.529-1.921 0-3.69-.328-5.26-.94-.356-.129-.533-.081-.66.082-.016.035-1.52 2.115-1.545 2.155-.164.218-.112.433.09.529C3.197 21.6 6.35 22.5 9.774 22.5c2.474 0 5.23-.427 7.749-1.258.118-.035.155-.078.204-.216l.896-2.502c.045-.213.06-.328-.158-.458-.871-.52-1.905-.724-2.903-.724a6.621 6.621 0 0 0-2.639.529l-.001-.005.001-.008zm10.748-1.53c-.114-.15-.296-.289-.597-.33-4.32-.473-8.868-2.316-12.72-5.187C6.015 7.973 2.85 4.195.938 1.439c-.198-.288-.415-.365-.678-.36l-1.42.062c-.328.016-.48.202-.303.454a39.183 39.183 0 0 0 5.176 5.86 37.957 37.957 0 0 0 9.176 6.275c3.21 1.488 6.45 2.457 9.873 3.037.382.046.592.016.711-.19.041-.059.882-1.42.923-1.478.136-.202.041-.33-.046-.431h-.001.001v.001zm-5.467-2.66h.001V14.07h-.001c-.139 0-.251-.08-.284-.217z"/>
      </svg>
    ),
    sentry: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={darkMode ? "text-[#E01E5A]" : "text-[#362D59]"}>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.12 17.532c-.173.344-.569.497-.93.363l-1.92-.663c-.156-.051-.318-.08-.475-.08-.755 0-1.4.385-1.787.973-.086.13-.23.216-.39.216s-.304-.085-.39-.216c-.387-.588-1.032-.973-1.787-.973-.157 0-.319.029-.475.08l-1.92.663c-.361.134-.757-.019-.93-.363-.16-.32-.016-.713.313-.889l1.83-1.077c.306-.188.5-.515.5-.863v-3.32h4.595v3.32c0 .348.194.675.5.863l1.83 1.077c.329.176.474.568.314.889zM12 6.002c-1.39 0-2.52 1.127-2.52 2.51v3.29h5.04V8.512c0-1.383-1.13-2.51-2.52-2.51z"/>
      </svg>
    )
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Integrations</h2>
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Link your platform with critical third-party resources.</p>
      </div>
      {isLoading ? (
        <div className="animate-pulse flex gap-4"><div className="w-full h-32 bg-white/5 rounded-2xl"></div><div className="w-full h-32 bg-white/5 rounded-2xl hidden md:block"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProviderCard name="GitLab" provider="gitlab" desc="Sync CI/CD pipelines and PR patching." icon={icons.gitlab} />
          <ProviderCard name="Google Gemini" provider="gemini" desc="Enable advanced AI analysis and voice." icon={icons.gemini} />
          <ProviderCard name="Slack" provider="slack" desc="Push critical error streams to channels." icon={icons.slack} />
          <ProviderCard name="GitHub" provider="github" desc="Code scanning and repository triggers." icon={icons.github} />
          <ProviderCard name="AWS" provider="aws" desc="Cloud threat insights and EBS monitoring." icon={icons.aws} />
          <ProviderCard name="Sentry" provider="sentry" desc="Error stream aggregation and real-time capture." icon={icons.sentry} />
        </div>
      )}
      <AnimatePresence>
        {modalOpen && activeProvider && (
           <IntegrationModal 
              provider={activeProvider} 
              darkMode={darkMode} 
              onClose={() => { setModalOpen(false); setActiveProvider(null); }} 
              onSuccess={() => { setModalOpen(false); setActiveProvider(null); fetchInts(); addToast(`Successfully connected to ${activeProvider}`, "success"); }}
           />
        )}
      </AnimatePresence>
    </div>
  );
};

const IntegrationModal = ({ provider, darkMode, onClose, onSuccess }: any) => {
  const [step, setStep] = useState(0); 
  const [apiKey, setApiKey] = useState("");
  const [awsKeyId, setAwsKeyId] = useState("");
  const [awsSecret, setAwsSecret] = useState("");
  const [error, setError] = useState("");

  const isOAuth = ["github", "gitlab", "slack"].includes(provider);
  const isAWS = provider === "aws";

  const handleConnect = async () => {
    setError("");
    setStep(1);
    try {
       let token = "";
       if (isOAuth) {
          await new Promise(r => setTimeout(r, 1500));
          token = `oauth-token-${Date.now()}`;
       } else if (isAWS) {
          if (!awsKeyId || !awsSecret) throw new Error("AWS credentials required");
          await new Promise(r => setTimeout(r, 1000));
          token = `aws-${awsKeyId}`;
       } else {
          if (!apiKey) throw new Error("API Key mapping required");
          await new Promise(r => setTimeout(r, 1000));
          token = apiKey;
       }
       await addIntegration(provider, token);
       setStep(2);
       setTimeout(() => onSuccess(), 1000);
    } catch (e: any) {
       setError(e.message || "Connection failed. Please check credentials.");
       setStep(0);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }} className={`w-full max-w-md rounded-2xl border shadow-xl overflow-hidden ${darkMode ? "bg-[#111] border-white/10" : "bg-white border-slate-200"}`}>
        <div className={`p-4 border-b flex justify-between items-center ${darkMode ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
           <h3 className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>Connect {provider.toUpperCase()}</h3>
           <button onClick={onClose} className={`p-1 rounded-md ${darkMode ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-200 text-slate-500"}`}>✕</button>
        </div>
        
        <div className="p-6">
           {step === 0 && (
             <div className="space-y-4">
                <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Authenticate with {provider} to enable automated workflows and real-time telemetry syncing.</p>
                
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">{error}</div>}

                {isOAuth ? (
                   <div className={`p-4 rounded-xl border text-center text-sm font-medium ${darkMode ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                      Requires OAuth redirect authorization
                   </div>
                ) : isAWS ? (
                   <div className="space-y-3">
                      <input type="text" placeholder="AWS Access Key ID" value={awsKeyId} onChange={e => setAwsKeyId(e.target.value)} className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${darkMode ? "bg-black/50 border-white/10 text-white" : "bg-white border-slate-300"}`} />
                      <input type="password" placeholder="AWS Secret Access Key" value={awsSecret} onChange={e => setAwsSecret(e.target.value)} className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${darkMode ? "bg-black/50 border-white/10 text-white" : "bg-white border-slate-300"}`} />
                   </div>
                ) : (
                   <input type="password" placeholder="API Key Token" value={apiKey} onChange={e => setApiKey(e.target.value)} className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${darkMode ? "bg-black/50 border-white/10 text-white" : "bg-white border-slate-300"}`} />
                )}

                <div className="pt-4 flex justify-end gap-3">
                   <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>Cancel</button>
                   <button onClick={handleConnect} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Authorize Access</button>
                </div>
             </div>
           )}

           {step === 1 && (
             <div className="py-8 flex flex-col items-center justify-center gap-4">
               <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
               <p className={`text-sm font-medium animate-pulse ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Establishing secure handshake...</p>
             </div>
           )}

           {step === 2 && (
             <div className="py-8 flex flex-col items-center justify-center gap-4">
               <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Check className="w-6 h-6" />
               </div>
               <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Connection Successful</p>
             </div>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
};

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
            <Key className={`w-8 h-8 ${darkMode ? "text-slate-900 font-medium" : "text-slate-300"}`} />
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
    <div className={`p-4 mb-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-cyan-950/20 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"}`}>
      <div>
        <h3 className={`text-sm font-semibold mb-1 ${darkMode ? "text-cyan-400" : "text-cyan-700"}`}>Install Desktop App</h3>
        <p className={`text-xs ${darkMode ? "text-cyan-200/60" : "text-cyan-600/80"}`}>Get the native offline experience with push notifications.</p>
      </div>
      <PWAInstallButton />
    </div>
    <div>
      <h2 className="text-xl font-semibold mb-1">Core Architecture Parameters</h2>
      <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Control internal logical systems and AI behavioral deployments.</p>
    </div>
    
    <div className="space-y-6 max-w-sm">
      <div className="space-y-2">
        <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-black font-semibold"}`}>Primary Reasoning AI Model</label>
        <select value={prefs.default_ai_model || "Gemini 1.5 Pro"} onChange={(e) => setPrefs({ ...prefs, default_ai_model: e.target.value })} className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none cursor-pointer ${darkMode ? "bg-black/50 border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"}`}>
          <option>Gemini 1.5 Pro (Balanced Logic)</option>
          <option>Gemini 1.5 Flash (Low Latency Voice)</option>
          <option>Claude 3.5 Sonnet (Advanced Coding)</option>
        </select>
        <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Affects complex reasoning fallbacks when processing PR diffs.</p>
      </div>
      
      <div className="space-y-2">
        <label className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-black font-semibold"}`}>Global Log Retention Period</label>
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

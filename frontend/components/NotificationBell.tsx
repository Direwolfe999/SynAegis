import React, { useState, useEffect, useRef } from "react";
import { Bell, ShieldAlert, CheckCircle, Info, Activity } from "lucide-react";
import { useToast } from "./ToastProvider";
import { API_BASE } from "../lib/api";

export function NotificationBell({ darkMode }: { darkMode?: boolean }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        // Poll for notifications
        const fetchNotifications = async () => {
            try {
                // In a real app we fetch from /api/notifications
                // Assuming we use our generic fetcher or mock it for now since backend might not have the route yet
                const res = await fetch(`${API_BASE}/notifications/recent`).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                } else {
                    // Mock data if backend fails
                    setNotifications([
                        { id: 1, type: "threat", message: "High severity threat detected on Node API-1", created_at: new Date().toISOString(), read: false },
                        { id: 2, type: "success", message: "GitLab integration synchronized successfully", created_at: new Date(Date.now() - 3600000).toISOString(), read: true },
                        { id: 3, type: "patch", message: "Automated patch applied to authentication service", created_at: new Date(Date.now() - 7200000).toISOString(), read: true },
                        { id: 4, type: "warning", message: "CPU utilization spike at edge origin", created_at: new Date(Date.now() - 86400000).toISOString(), read: true }
                    ]);
                    setUnreadCount(1);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // 10s poll
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async () => {
        setUnreadCount(0);
        setNotifications(notifications.map(n => ({...n, read: true})));
        // Call backend to mark read
        try {
            await fetch(`${API_BASE}/notifications/mark_read`, { method: 'POST' }).catch(() => null);
        } catch (e) {}
    };

    const latestType = notifications.length > 0 ? notifications[0].type : "none";
    
    // Color coded based on latest type or unread state
    let bellColorClass = darkMode ? "text-slate-400" : "text-slate-500";
    let badgeColorClass = "bg-indigo-500";
    
    if (unreadCount > 0) {
        if (latestType === "threat") {
            bellColorClass = "text-red-500";
            badgeColorClass = "bg-red-500";
        } else if (latestType === "success") {
            bellColorClass = "text-emerald-500";
            badgeColorClass = "bg-emerald-500";
        } else if (latestType === "patch") {
            bellColorClass = "text-blue-500";
            badgeColorClass = "bg-blue-500";
        } else if (latestType === "warning") {
            bellColorClass = "text-amber-500";
            badgeColorClass = "bg-amber-500";
        }
    }

    const getIcon = (type: string) => {
         switch(type) {
             case 'threat': return <ShieldAlert className="w-4 h-4 text-red-500" />;
             case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
             case 'patch': return <Activity className="w-4 h-4 text-blue-500" />;
             case 'warning': return <Info className="w-4 h-4 text-amber-500" />;
             default: return <Bell className="w-4 h-4 text-slate-400" />;
         }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen && unreadCount > 0) markAsRead();
                }}
                className={`relative p-2 rounded-full transition-all ${darkMode ? "hover:bg-slate-500/10" : "hover:bg-slate-100"}`}
            >
                <Bell className={`w-5 h-5 ${bellColorClass} transition-colors`} />
                {unreadCount > 0 && (
                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${badgeColorClass} border-2 border-transparent animate-pulse`} />
                )}
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-xl z-[100] overflow-hidden ${
                    darkMode ? "bg-[#111] border-white/10 shadow-black/50" : "bg-white border-slate-200 shadow-slate-200/50"
                }`}>
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${darkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                        <h3 className={`text-sm font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs font-medium text-indigo-500">{unreadCount} New</span>}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                All clear. No recent alerts.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(n => (
                                    <div key={n.id} className={`flex items-start gap-3 p-4 border-b last:border-0 transition-colors ${
                                        darkMode ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"
                                    } ${!n.read ? (darkMode ? "bg-indigo-500/5" : "bg-indigo-50") : ""}`}>
                                        <div className={`p-2 rounded-xl mt-0.5 shadow-sm ${darkMode ? "bg-black" : "bg-white border border-slate-100"}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                                                {n.message}
                                            </p>
                                            <p className={`text-xs mt-1 font-mono ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                                {new Date(n.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className={`p-2 border-t text-center ${darkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                        <button className={`text-xs font-medium ${darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                            View All Events
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

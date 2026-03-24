"use client";
import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        window.addEventListener("appinstalled", () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    if (!isInstallable) {
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
    }

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-500/30 border border-cyan-500/30"
        >
            <Download className="h-4 w-4" />
            <span>Install App</span>
        </button>
    );
}

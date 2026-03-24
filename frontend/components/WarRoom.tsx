"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SynAegisOrb, { type OrbState } from "../components/SynAegisOrb";
import LiveTranscription from "../components/LiveTranscription";
import OpticalFeed from "../components/OpticalFeed";
import ProtocolLogs from "../components/ProtocolLogs";
import SystemDiagnostics from "../components/SystemDiagnostics";

type WsEvent =
    | { type: "ready"; sessionId: string; startup?: Record<string, unknown> }
    | { type: "agent_text"; text: string }
    | { type: "event"; event: string; tool?: string; state?: string; }
    | { type: "agent_audio"; mimeType: string; data: string }
    | { type: "agent_hint"; hints: string[] }
    | { type: "session_summary"; summary: string }
    | { type: "fallback_mode"; enabled: boolean; reason?: string }
    | { type: "heartbeat"; ts: string }
    | { type: "connection_stats"; uptime_s: number; messages: number; media_kb: number; fallback_mode: boolean }
    | { type: "audio_frequency"; value: number }
    | { type: "brain_log"; level: string; message: string }
    | { type: "system_metrics"; metrics: Record<string, unknown> }
    | { type: "barge_in_ack" }
    | { type: "error"; message: string };

type Metrics = {
    latency_ms?: number | null;
    billing_enabled?: boolean | null;
    monitoring_series?: number | null;
    capabilities_ok?: boolean | null;
    net_cost_cents?: number | null;
};

const FRAME_INTERVAL_MS = 1200;
const RECONNECT_MIN_MS = 2500;
const DEFAULT_SEND_VIDEO_TO_AGENT = process.env.NEXT_PUBLIC_SEND_VIDEO_TO_AGENT === "true";

function toBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const stride = 0x8000;
    for (let i = 0; i < bytes.length; i += stride) {
        binary += String.fromCharCode(...bytes.subarray(i, i + stride));
    }
    return btoa(binary);
}

function base64ToBlob(data: string, mimeType: string): Blob {
    const raw = atob(data);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type: mimeType });
}

function floatToPcm16(float32: Float32Array): Int16Array {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function cancelSpeechSafely() {
    if (typeof window === "undefined") return;
    const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (synth && typeof synth.cancel === "function") {
        synth.cancel();
    }
}

function speakTextSafely(text: string) {
    if (!text || typeof window === "undefined" || typeof SpeechSynthesisUtterance === "undefined") return;
    const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (!synth || typeof synth.speak !== "function") return;

    cancelSpeechSafely();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;
    synth.speak(utterance);
}

function getSpeechRecognitionCtor(): (new () => any) | null {
    if (typeof window === "undefined") return null;
    const w = window as Window & {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function WarRoom() {
    const { showModal } = useToast();
    const [orbState, setOrbState] = useState<OrbState>("idle");
    const [rippling, setRippling] = useState(false);
    const [userLevel, setUserLevel] = useState(0.1);
    const [aiLevel, setAiLevel] = useState(0.08);
    const [logs, setLogs] = useState<string[]>([
        "=== SYNAEGIS WAR ROOM READY ===",
        "[GUIDE] Speak naturally to command the AI.",
        "[GUIDE] Type commands below, or try these:",
        " -> 'Deploy cloud diagnostics'",
        " -> 'Show latest pipeline status'",
        " -> 'Run security scan'",
        " -> 'Check system health'",
    ]);
    const [transcript, setTranscript] = useState("");
    const [metrics, setMetrics] = useState<Metrics>({});
    const [cameraActive, setCameraActive] = useState(false);
    const [showDiag, setShowDiag] = useState(true);
    const [hovering, setHovering] = useState(false);
    const [visionEnabled, setVisionEnabled] = useState(DEFAULT_SEND_VIDEO_TO_AGENT);
    const [micMuted, setMicMuted] = useState(false);
    const [backendMode, setBackendMode] = useState<"live" | "fallback">("live");
    const [lastPingMs, setLastPingMs] = useState<number | null>(null);
    const [promptText, setPromptText] = useState("");
    const [isEntered, setIsEntered] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const nextPlayTimeRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const frameTimerRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const manualDisconnectRef = useRef(false);
    const transcriptionTimerRef = useRef<number | null>(null);
    const visionEnabledRef = useRef(visionEnabled);
    const micMutedRef = useRef(micMuted);
    const backendModeRef = useRef<"live" | "fallback">("live");
    const speechRecRef = useRef<any>(null);
    const speechRecRunningRef = useRef(false);

    useEffect(() => {
        visionEnabledRef.current = visionEnabled;
    }, [visionEnabled]);

    useEffect(() => {
        micMutedRef.current = micMuted;
    }, [micMuted]);

    useEffect(() => {
        backendModeRef.current = backendMode;
    }, [backendMode]);

    const wsUrl = useMemo(() => {
        const fallback = "wss://synaegis-backend.onrender.com/ws/warroom";
        return process.env.NEXT_PUBLIC_BACKEND_WS_URL || fallback;
    }, []);

    const pushLog = useCallback((line: string) => {
        const msg = `${new Date().toLocaleTimeString()} [INFO] ${line}`;
        setLogs((prev) => [...prev.slice(-100), msg]);
    }, []);

    const sendJson = useCallback((payload: unknown) => {
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    }, []);

    const clearTranscription = useCallback(() => {
        if (transcriptionTimerRef.current) {
            window.clearTimeout(transcriptionTimerRef.current);
            transcriptionTimerRef.current = null;
        }
    }, []);

    const showTransientTranscript = useCallback(
        (text: string) => {
            if (!text) return;
            setTranscript(text);
            clearTranscription();
            transcriptionTimerRef.current = window.setTimeout(() => {
                setTranscript("");
            }, 3000);
        },
        [clearTranscription],
    );

    const sendPrompt = useCallback(
        (text: string) => {
            const cleaned = text.trim();
            if (!cleaned) return;
            sendJson({ type: "user_text", text: cleaned });
            pushLog(`You: ${cleaned}`);
        },
        [pushLog, sendJson],
    );

    const stopLocalStt = useCallback(() => {
        const rec = speechRecRef.current;
        if (!rec) return;
        try {
            rec.onresult = null;
            rec.onerror = null;
            rec.onend = null;
            rec.stop?.();
        } catch {
            // ignore
        }
        speechRecRef.current = null;
        speechRecRunningRef.current = false;
    }, []);

    const startLocalStt = useCallback(() => {
        if (speechRecRunningRef.current) return;
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) return;

        try {
            const rec = new Ctor();
            rec.lang = "en-US";
            rec.continuous = true;
            rec.interimResults = false;

            rec.onresult = (event: any) => {
                const results = event?.results;
                if (!results || !results.length) return;
                const result = results[results.length - 1];
                const transcript = result?.[0]?.transcript?.trim?.();
                if (transcript) {
                    sendPrompt(transcript);
                }
            };

            rec.onerror = () => {
                speechRecRunningRef.current = false;
            };

            rec.onend = () => {
                speechRecRunningRef.current = false;
                if (backendModeRef.current === "fallback" && orbState !== "idle") {
                    window.setTimeout(() => {
                        startLocalStt();
                    }, 450);
                }
            };

            rec.start();
            speechRecRef.current = rec;
            speechRecRunningRef.current = true;
        } catch {
            speechRecRunningRef.current = false;
        }
    }, [orbState, sendPrompt]);

    const teardownMedia = useCallback(async () => {
        if (frameTimerRef.current) {
            window.clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
        }
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        processorRef.current = null;
        sourceRef.current = null;

        if (audioCtxRef.current) {
            try {
                await audioCtxRef.current.close();
            } catch {
                // ignore
            }
        }
        audioCtxRef.current = null;

        mediaRef.current?.getTracks().forEach((t) => t.stop());
        mediaRef.current = null;
        setCameraActive(false);
    }, []);

    const startMedia = useCallback(async () => {
        try {
            await teardownMedia(); // Prevent duplicate streams if called twice
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, noiseSuppression: true, echoCancellation: true },
                video: { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 20, max: 24 } },
            });

            mediaRef.current = stream;
            setCameraActive(true);

            const audioCtx = new AudioContext({ sampleRate: 16000 });
            const source = audioCtx.createMediaStreamSource(stream);
            // Suppress Chrome deprecation warning about ScriptProcessorNode if possible
            const processor = audioCtx.createScriptProcessor(2048, 1, 1);
            source.connect(processor);
            processor.connect(audioCtx.destination);

            audioCtxRef.current = audioCtx;
            sourceRef.current = source;
            processorRef.current = processor;

            processor.onaudioprocess = (event) => {
                const pcm = floatToPcm16(event.inputBuffer.getChannelData(0));
                const level = Math.min(1, Math.max(0.08, Math.sqrt(pcm.reduce((a, b) => a + b * b, 0) / pcm.length) / 9000));
                setUserLevel(level);
                setOrbState((prev) => (prev === "thinking" || prev === "speaking" ? prev : "listening"));
                if (micMutedRef.current) return;
                sendJson({ type: "media", mimeType: "audio/pcm", sampleRate: 16000, data: toBase64(pcm.buffer) });
            };

            audioCtxRef.current = audioCtx;
            sourceRef.current = source;
            processorRef.current = processor;

            frameTimerRef.current = window.setInterval(() => {
                if (!visionEnabledRef.current) return;
                const video = videoRef.current;
                if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
                const canvas = document.createElement("canvas");
                canvas.width = 320;
                canvas.height = 180;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const b64 = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
                sendJson({ type: "media", mimeType: "image/jpeg", data: b64 });
            }, FRAME_INTERVAL_MS);
        } catch (err) {
            console.error("Media Error:", err);
            setCameraActive(false);
        }
    }, [sendJson, teardownMedia]);

    const connect = useCallback(async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

        // Prevent duplicate overlapping websockets
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }

        manualDisconnectRef.current = false;
        setOrbState("reconnecting");
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
            reconnectAttemptsRef.current = 0;
            pushLog("Realtime link established.");
            await startMedia();
            setOrbState("listening");
        };

        ws.onmessage = async (event) => {
            let msg: WsEvent;
            try {
                msg = JSON.parse(event.data) as WsEvent;
            } catch {
                return;
            }

            if (msg.type === "ready") {
                pushLog("System identity synchronized.");
                if (msg.startup && typeof msg.startup === "object") {
                    const startup = msg.startup as Record<string, unknown>;
                    setMetrics({
                        latency_ms: Number(startup.latency_ms ?? 0) || null,
                        billing_enabled: Boolean((startup.billing as Record<string, unknown> | undefined)?.enabled),
                        monitoring_series: Number((startup.monitoring as Record<string, unknown> | undefined)?.series_seen ?? 0),
                        capabilities_ok: Boolean(startup.ok),
                    });
                }
            } else if (msg.type === "event") {
                if (msg.event === "tool_call" && msg.tool) {
                    showModal({ title: "System Tool Executed", content: <p>{`AI deployed tool: ${msg.tool}`}</p> });
                }
            } else if (msg.type === "agent_text") {
                setOrbState("thinking");
                showTransientTranscript(msg.text);
                pushLog(`SynAegis: ${msg.text}`);

                if (backendModeRef.current === "fallback") {
                    speakTextSafely(msg.text);
                }

                window.setTimeout(() => setOrbState("listening"), 320);
            } else if (msg.type === "agent_audio") {
                // Decode incoming PCM chunks dynamically to prevent cut-offs
                try {
                    if (!playbackCtxRef.current) {
                        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
                        nextPlayTimeRef.current = playbackCtxRef.current.currentTime;
                    }
                    const ctx = playbackCtxRef.current;
                    const raw = atob(msg.data);
                    const pcm16 = new Int16Array(raw.length / 2);
                    const dataView = new DataView(new ArrayBuffer(raw.length));
                    for (let i = 0; i < raw.length; i++) dataView.setUint8(i, raw.charCodeAt(i));
                    for (let i = 0; i < pcm16.length; i++) pcm16[i] = dataView.getInt16(i * 2, true);

                    const buffer = ctx.createBuffer(1, pcm16.length, 24000);
                    const channelData = buffer.getChannelData(0);
                    for (let i = 0; i < pcm16.length; i++) channelData[i] = pcm16[i] / 32768.0;

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);

                    const startTime = Math.max(nextPlayTimeRef.current, ctx.currentTime);
                    source.start(startTime);
                    nextPlayTimeRef.current = startTime + buffer.duration;

                    setOrbState("speaking");
                    setAiLevel(0.72);
                    const stopDiff = Math.max(420, (startTime - ctx.currentTime + buffer.duration) * 1000);
                    window.setTimeout(() => setAiLevel(0.14), stopDiff);
                } catch(e) {
                    console.error("Audio playback error:", e);
                }
            } else if (msg.type === "audio_frequency") {
                setUserLevel(Math.max(0.08, Math.min(1, msg.value)));
            } else if (msg.type === "heartbeat") {
                const ping = Date.now() - new Date(msg.ts).getTime();
                setLastPingMs(Number.isFinite(ping) ? Math.max(0, ping) : null);
            } else if (msg.type === "connection_stats") {
                setMetrics((prev) => ({
                    ...prev,
                    latency_ms: msg.uptime_s,
                    net_cost_cents: msg.media_kb,
                }));
            } else if (msg.type === "fallback_mode") {
                setBackendMode(msg.enabled ? "fallback" : "live");
            } else if (msg.type === "agent_hint") {
                for (const hint of msg.hints ?? []) {
                    pushLog(`[HINT] ${hint}`);
                }
            } else if (msg.type === "session_summary") {
                pushLog(`[SUMMARY] ${msg.summary}`);
            } else if (msg.type === "brain_log") {
                setShowDiag(true);
                pushLog(`[${msg.level.toUpperCase()}] ${msg.message}`);
            } else if (msg.type === "system_metrics") {
                setMetrics((prev) => ({ ...prev, ...(msg.metrics as Metrics) }));
                setShowDiag(true);
            } else if (msg.type === "barge_in_ack") {
                if (playbackCtxRef.current) {
                    playbackCtxRef.current.suspend();
                    nextPlayTimeRef.current = 0;
                    setTimeout(() => playbackCtxRef.current?.resume(), 100);
                }
                setRippling(true);
                cancelSpeechSafely();
                window.setTimeout(() => setRippling(false), 280);
            } else if (msg.type === "error") {
                setOrbState("error");
                pushLog(`[ERROR] ${msg.message || (msg as any).content || "Unknown error"}`);
                if (/quota|exceeded|resource_exhausted|429/i.test(msg.message)) {
                    manualDisconnectRef.current = true;
                    pushLog("Quota limit reached. Reconnect paused to avoid repeated failures.");
                    ws.close();
                }
            }
        };

        ws.onerror = () => {
            setOrbState("error");
            pushLog("Transport error detected.");
        };

        ws.onclose = async () => {
            await teardownMedia();
            if (manualDisconnectRef.current) {
                setOrbState("idle");
                return;
            }
            const attempt = reconnectAttemptsRef.current + 1;
            reconnectAttemptsRef.current = attempt;
            const wait = Math.min(15000, RECONNECT_MIN_MS * attempt * 2);
            setOrbState("reconnecting");
            pushLog(`Realtime link dropped. Retry in ${wait}ms.`);
            window.setTimeout(() => void connect(), wait);
        };
    }, [pushLog, showTransientTranscript, startMedia, teardownMedia, wsUrl]);

    const disconnect = useCallback(async () => {
        manualDisconnectRef.current = true;
        wsRef.current?.close();
        wsRef.current = null;
        cancelSpeechSafely();
        stopLocalStt();
        await teardownMedia();
        clearTranscription();
        setTranscript("");
        setOrbState("idle");
    }, [clearTranscription, stopLocalStt, teardownMedia]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onEnded = () => {
            setAiLevel(0.1);
            setOrbState((prev) => (prev === "speaking" ? "listening" : prev));
        };
        audio.addEventListener("ended", onEnded);
        return () => audio.removeEventListener("ended", onEnded);
    }, []);

    useEffect(() => {
        if (cameraActive && videoRef.current && mediaRef.current) {
            videoRef.current.srcObject = mediaRef.current;
            videoRef.current.play().catch(() => undefined);
        }
    }, [cameraActive]);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowDiag(false), 9000);
        return () => window.clearTimeout(timer);
    }, [metrics, logs.length]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

            if (e.altKey && e.key.toLowerCase() === "v") {
                setVisionEnabled((prev) => {
                    const next = !prev;
                    pushLog(`Vision uplink ${next ? "enabled" : "disabled"}.`);
                    return next;
                });
            }
            if (e.altKey && e.key.toLowerCase() === "m") {
                setMicMuted((prev) => {
                    const next = !prev;
                    pushLog(`Mic uplink ${next ? "muted" : "live"}.`);
                    return next;
                });
            }
            if (e.altKey && e.key.toLowerCase() === "t") {
                sendPrompt("Give me a 1-line realtime status and next best action.");
            }
            if (e.key.toLowerCase() === "x" && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Press 'x' to halt
                if (playbackCtxRef.current) {
                    playbackCtxRef.current.suspend();
                    nextPlayTimeRef.current = 0;
                    setTimeout(() => playbackCtxRef.current?.resume(), 100); // clear playing
                }
                sendJson({ type: "barge_in" });
                pushLog("[ACTION] Execution halted by operator.");
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [pushLog, sendPrompt]);

    useEffect(() => {
        if (backendMode === "fallback" && orbState !== "idle") {
            startLocalStt();
        } else {
            stopLocalStt();
        }

        return () => {
            stopLocalStt();
        };
    }, [backendMode, orbState, startLocalStt, stopLocalStt]);

    useEffect(() => {
        return () => {
            void disconnect();
        };
    }, [disconnect]);

    return (
        <>
            {/* Intro Screen */}
            <AnimatePresence>
                {!isEntered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)] text-slate-200"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-8"
                            >
                                <img src="/logos/wording.png" alt="SynAegis" className="h-24 md:h-32 xl:h-40 w-auto mx-auto opacity-80" />
                                <div className="mt-6 text-sm md:text-base xl:text-lg tracking-[0.3em] text-cyan-400/60 uppercase">
                                    Secure Connection Protocol
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                onClick={() => setIsEntered(true)}
                                className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-12 py-4 backdrop-blur-md transition-all hover:bg-cyan-900/40 hover:border-cyan-400"
                            >
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                <span className="relative text-base md:text-xl xl:text-2xl tracking-[0.2em] font-medium text-cyan-100">
                                    INITIALIZE WAR ROOM
                                </span>
                            </motion.button>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-slate-500 uppercase tracking-widest"
                            >
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Audio Live</span>
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Vision Ready</span>
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Gemini Attached</span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Interface */}
            {isEntered && (
                <main className="relative min-h-screen overflow-hidden bg-[#050505] text-slate-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(30,41,59,0.35),transparent_58%)]" />

                    {/* Subtle immersive logo background */}
                    <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                        <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                    </div>
                    {/* Subtle immersive logo background */}
                    <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                        <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                    </div>
                    <AnimatePresence>
                        {orbState === "reconnecting" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
                            >
                                <div className="reconnect-grid rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-xl sm:px-6 sm:py-4">
                                    <p className="text-sm tracking-wide text-slate-200 sm:text-lg">SynAegis // Realigning Neural Pathways...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <OpticalFeed active={cameraActive} videoRef={videoRef} />
                    <SystemDiagnostics visible={showDiag} metrics={metrics} />
                    <ProtocolLogs logs={logs} />
                    <LiveTranscription text={transcript} />

                    <section className="relative z-10 flex min-h-screen items-center justify-center px-4">
                        <div className="text-center">
                            <div className="relative z-40 mb-3 flex flex-wrap items-center justify-center gap-2 text-[9px] uppercase tracking-[0.16em] sm:text-[10px]">
                                <span className={`rounded-full border px-2 py-1 ${backendMode === "fallback" ? "border-amber-300/40 bg-amber-500/10 text-amber-200" : "border-emerald-300/40 bg-emerald-500/10 text-emerald-200"}`}>
                                    {backendMode === "fallback" ? "fallback mode" : "live mode"}
                                </span>
                                <button
                                    onClick={() => {
                                        setVisionEnabled((prev) => {
                                            const next = !prev;
                                            pushLog(`Vision uplink ${next ? "enabled" : "disabled"}.`);
                                            return next;
                                        });
                                    }}
                                    className={`rounded-full border px-2 py-1 transition-colors hover:bg-white/10 ${visionEnabled ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-200" : "border-slate-500/40 bg-slate-700/20 text-slate-300"}`}>
                                    vision {visionEnabled ? "on" : "off"}
                                </button>
                                <button
                                    onClick={() => {
                                        setMicMuted((prev) => {
                                            const next = !prev;
                                            pushLog(`Mic uplink ${next ? "muted" : "live"}.`);
                                            return next;
                                        });
                                    }}
                                    className={`rounded-full border px-2 py-1 transition-colors hover:bg-white/10 ${micMuted ? "border-rose-300/40 bg-rose-500/10 text-rose-200" : "border-cyan-300/40 bg-cyan-500/10 text-cyan-200"}`}>
                                    mic {micMuted ? "muted" : "live"}
                                </button>
                                {lastPingMs !== null && (
                                    <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-slate-200">ping {lastPingMs}ms</span>
                                )}
                            </div>
                            <h1 className="mb-1 bg-gradient-to-r from-cyan-300 via-white to-cyan-300 bg-clip-text text-[13px] font-extralight uppercase tracking-[0.45em] text-transparent drop-shadow-[0_0_12px_rgba(103,232,249,0.35)] sm:mb-2 sm:text-base sm:tracking-[0.5em] md:text-lg">
                                SynAegis
                            </h1>
                            <div className="mx-auto mb-3 h-px w-10 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent sm:mb-4 sm:w-14" />
                            <SynAegisOrb state={orbState} userLevel={userLevel} aiLevel={aiLevel} rippling={rippling} />
                            <p className="mt-3 text-[9px] font-light uppercase tracking-[0.25em] text-slate-400/90 sm:mt-4 sm:text-[11px] sm:tracking-[0.3em]">
                                {orbState === "idle" ? "awaiting signal" : orbState}
                            </p>
                        </div>
                    </section>

                    <audio ref={audioRef} className="hidden" />

                    <div
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHovering(true)}
                        onMouseLeave={() => setHovering(false)}
                        onClick={() => {
                            if (orbState === "idle") {
                                void connect();
                            } else {
                                sendJson({ type: "barge_in" });
                                setRippling(true);
                                window.setTimeout(() => setRippling(false), 280);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (orbState === "idle") {
                                    void connect();
                                } else {
                                    sendJson({ type: "barge_in" });
                                }
                            }
                            if (e.key.toLowerCase() === "x") {
                                void disconnect();
                            }
                        }}
                        className="absolute inset-0 z-30 cursor-pointer"
                        aria-label="Toggle voice presence"
                    />

                    {true && (
                        <div className="pointer-events-auto absolute bottom-16 left-1/2 z-[40] w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-white/15 bg-black/40 p-2 backdrop-blur-xl sm:bottom-20 sm:p-3">
                            <div className="flex gap-2">
                                <input
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            sendPrompt(promptText);
                                            setPromptText("");
                                        }
                                    }}
                                    placeholder="Type prompt · Enter to send · Alt+V vision · Alt+M mute · Alt+T test"
                                    className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/50 focus:outline-none"
                                />
                                <button
                                    onClick={() => {
                                        sendPrompt(promptText);
                                        setPromptText("");
                                    }}
                                    className="rounded-md border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-xs uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-500/20"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Subtle immersive logo background */}
                    <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                        <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                    </div>
                    {/* Subtle immersive logo background */}
                    <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                        <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                    </div>
                    <AnimatePresence>
                        {hovering && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                className="pointer-events-none absolute bottom-3 left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-200 backdrop-blur sm:bottom-6 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
                            >
                                {orbState === "idle" ? "Tap to Initialize Mic/Camera" : "Tap to Barge-In · Press X to Halt"}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            )}
        </>
    );
}

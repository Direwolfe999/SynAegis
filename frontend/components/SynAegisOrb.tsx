"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ─────────────────────── Types ─────────────────────── */
export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "reconnecting" | "error";

type Props = {
    state: OrbState;
    userLevel: number;
    aiLevel: number;
    rippling?: boolean;
};

/* ─────────────── Perlin-style 2D noise ──────────────── */
function createNoise2D(): (x: number, y: number) => number {
    const perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    const grad2 = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
        [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    function dot2(gi: number, x: number, y: number): number {
        const g = grad2[gi % 8];
        return g[0] * x + g[1] * y;
    }

    function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a: number, b: number, t: number): number { return a + t * (b - a); }

    return (x: number, y: number): number => {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = fade(xf);
        const v = fade(yf);
        const aa = perm[perm[X] + Y];
        const ab = perm[perm[X] + Y + 1];
        const ba = perm[perm[X + 1] + Y];
        const bb = perm[perm[X + 1] + Y + 1];
        return lerp(
            lerp(dot2(aa, xf, yf), dot2(ba, xf - 1, yf), u),
            lerp(dot2(ab, xf, yf - 1), dot2(bb, xf - 1, yf - 1), u),
            v,
        );
    };
}

/* ──────────────── Color Palettes ──────────────── */
const PALETTES: Record<OrbState, { inner: string[]; glow: string }> = {
    idle: {
        inner: ["#a78bfa", "#7c3aed", "#6366f1", "#818cf8"],
        glow: "rgba(139,92,246,0.35)",
    },
    listening: {
        inner: ["#22d3ee", "#06b6d4", "#0ea5e9", "#38bdf8"],
        glow: "rgba(34,211,238,0.4)",
    },
    thinking: {
        inner: ["#c084fc", "#a855f7", "#8b5cf6", "#d946ef"],
        glow: "rgba(168,85,247,0.45)",
    },
    speaking: {
        inner: ["#60a5fa", "#3b82f6", "#818cf8", "#a78bfa"],
        glow: "rgba(96,165,250,0.5)",
    },
    reconnecting: {
        inner: ["#fbbf24", "#f59e0b", "#fb923c", "#f97316"],
        glow: "rgba(251,191,36,0.35)",
    },
    error: {
        inner: ["#f87171", "#ef4444", "#dc2626", "#fb7185"],
        glow: "rgba(248,113,113,0.45)",
    },
};

/* ─────────── Helpers ─────────── */
function hexToRgb(hex: string): [number, number, number] {
    const h = hex.startsWith("#") ? hex.slice(1) : hex;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lerpVal(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(1, t);
}

function lerpColorHex(a: string, b: string, t: number): string {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg, bb] = hexToRgb(b);
    const r = Math.round(lerpVal(ar, br, t));
    const g = Math.round(lerpVal(ag, bg, t));
    const bl = Math.round(lerpVal(ab, bb, t));
    return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/* ═══════════════════════════════════════════════════════
   SynAegisOrb — Canvas-rendered Siri-like AI orb
   60fps Perlin noise waveform distortion + glow + particles
   ═══════════════════════════════════════════════════════ */
export default function SynAegisOrb({ state, userLevel, aiLevel, rippling = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const noiseRef = useRef<((x: number, y: number) => number) | null>(null);
    const stateRef = useRef(state);
    const userRef = useRef(userLevel);
    const aiRef = useRef(aiLevel);
    const rippleRef = useRef(rippling);
    const rippleTimeRef = useRef(0);
    const [canvasSize, setCanvasSize] = useState(320);

    const smoothLevel = useRef(0.1);
    const smoothInner = useRef([...PALETTES.idle.inner]);

    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { userRef.current = userLevel; }, [userLevel]);
    useEffect(() => { aiRef.current = aiLevel; }, [aiLevel]);
    useEffect(() => {
        rippleRef.current = rippling;
        if (rippling) rippleTimeRef.current = performance.now();
    }, [rippling]);

    /* Responsive sizing */
    useEffect(() => {
        const measure = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const minDim = Math.min(vw, vh);
            if (vw < 480) setCanvasSize(Math.min(260, minDim * 0.7));
            else if (vw < 768) setCanvasSize(Math.min(340, minDim * 0.55));
            else if (vw < 1200) setCanvasSize(Math.min(420, minDim * 0.48));
            else setCanvasSize(Math.min(500, minDim * 0.44));
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    /* ───────── Main 60fps render loop ───────── */
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) { animRef.current = requestAnimationFrame(render); return; }
        const ctx = canvas.getContext("2d");
        if (!ctx) { animRef.current = requestAnimationFrame(render); return; }
        if (!noiseRef.current) noiseRef.current = createNoise2D();
        const noise = noiseRef.current;

        const dpr = window.devicePixelRatio || 1;
        const size = canvasSize;
        if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
            canvas.width = size * dpr;
            canvas.height = size * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cx = size / 2;
        const cy = size / 2;
        const baseRadius = size * 0.26;
        const now = performance.now() / 1000;
        const st = stateRef.current;
        const palette = PALETTES[st];

        /* Smooth level */
        const rawLevel = Math.max(0.08, Math.min(1, Math.max(userRef.current, aiRef.current)));
        smoothLevel.current = lerpVal(smoothLevel.current, rawLevel, 0.06);
        const level = smoothLevel.current;

        /* Smooth colors */
        const si = smoothInner.current;
        for (let i = 0; i < si.length && i < palette.inner.length; i++) {
            si[i] = lerpColorHex(si[i], palette.inner[i], 0.035);
        }

        ctx.clearRect(0, 0, size, size);

        /* ─── State parameters ─── */
        let noiseScale = 2.5, noiseAmp = 0.12, breathSpeed = 0.8, breathAmp = 0.03;
        let waveCount = 5, rotationSpeed = 0, pulseFreq = 0;

        switch (st) {
            case "idle":
                noiseAmp = 0.07 + level * 0.05; breathSpeed = 0.6; breathAmp = 0.04; break;
            case "listening":
                noiseAmp = 0.1 + level * 0.28; noiseScale = 3 + level * 2; breathSpeed = 1.2; waveCount = 6; break;
            case "thinking":
                noiseAmp = 0.1 + level * 0.1; rotationSpeed = 0.4; breathSpeed = 0.5; waveCount = 4; break;
            case "speaking":
                noiseAmp = 0.15 + level * 0.38; noiseScale = 2 + level * 3; breathSpeed = 2; breathAmp = 0.06; pulseFreq = 3; waveCount = 7; break;
            case "reconnecting":
                noiseAmp = 0.06; breathSpeed = 1.5; breathAmp = 0.08; break;
            case "error":
                noiseAmp = 0.22; noiseScale = 4; breathSpeed = 3; breathAmp = 0.05; break;
        }

        const breath = Math.sin(now * breathSpeed * Math.PI) * breathAmp;
        const pulse = pulseFreq > 0 ? Math.sin(now * pulseFreq * Math.PI) * 0.04 * level : 0;
        const dynamicRadius = baseRadius * (1 + breath + pulse + level * 0.1);
        const rotation = now * rotationSpeed;

        /* ─── 1. Deep outer glow ─── */
        for (let g = 4; g >= 0; g--) {
            const glowR = dynamicRadius * (1.8 + g * 0.3);
            const alpha = (0.05 - g * 0.008) * (0.5 + level * 0.6);
            const grad = ctx.createRadialGradient(cx, cy, dynamicRadius * 0.2, cx, cy, glowR);
            const [r0, g0, b0] = hexToRgb(si[0]);
            const [r1, g1, b1] = hexToRgb(si[1]);
            grad.addColorStop(0, `rgba(${r0},${g0},${b0},${alpha * 2})`);
            grad.addColorStop(0.4, `rgba(${r1},${g1},${b1},${alpha})`);
            grad.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        /* ─── 2. Waveform blob layers ─── */
        const POINTS = 140;
        for (let layer = waveCount - 1; layer >= 0; layer--) {
            const layerRatio = layer / Math.max(waveCount - 1, 1);
            const layerRadius = dynamicRadius * (0.65 + layerRatio * 0.4);
            const layerNoiseAmp = noiseAmp * (0.35 + layerRatio * 0.75);
            const timeOffset = layer * 1.4;
            const layerAlpha = 0.06 + (1 - layerRatio) * 0.28;

            const pts: [number, number][] = [];
            for (let i = 0; i <= POINTS; i++) {
                const angle = (i / POINTS) * Math.PI * 2 + rotation;
                const nx = Math.cos(angle) * noiseScale + now * 0.5 + timeOffset;
                const ny = Math.sin(angle) * noiseScale + now * 0.3 + timeOffset;
                const n = noise(nx, ny);
                const r = layerRadius * (1 + n * layerNoiseAmp);
                pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
            }

            /* Catmull-Rom spline smoothing */
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i === 0 ? pts.length - 2 : i - 1];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[i + 2 >= pts.length ? 1 : i + 2];
                ctx.bezierCurveTo(
                    p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
                    p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
                    p2[0], p2[1],
                );
            }
            ctx.closePath();

            const colorIdx = layer % si.length;
            const [cr, cg, cb] = hexToRgb(si[colorIdx]);
            ctx.fillStyle = `rgba(${cr},${cg},${cb},${layerAlpha})`;
            ctx.fill();

            if (layer <= 1) {
                ctx.strokeStyle = `rgba(255,255,255,${0.06 + (1 - layerRatio) * 0.1})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }

        /* ─── 3. Bright core ─── */
        const coreR = dynamicRadius * 0.32;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        coreGrad.addColorStop(0, `rgba(255,255,255,${0.88 + level * 0.12})`);
        coreGrad.addColorStop(0.25, `rgba(255,255,255,${0.45 + level * 0.25})`);
        const [ir, ig, ib] = hexToRgb(si[0]);
        coreGrad.addColorStop(0.65, `rgba(${ir},${ig},${ib},0.4)`);
        coreGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        /* ─── 4. Specular highlight ─── */
        const specX = cx - dynamicRadius * 0.14;
        const specY = cy - dynamicRadius * 0.18;
        const specR = dynamicRadius * 0.18;
        const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, specR);
        specGrad.addColorStop(0, "rgba(255,255,255,0.22)");
        specGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(specX, specY, specR, 0, Math.PI * 2);
        ctx.fillStyle = specGrad;
        ctx.fill();

        /* ─── 5. Orbital rings ─── */
        if (st === "thinking" || st === "speaking") {
            const ringCount = st === "speaking" ? 2 : 1;
            for (let ri = 0; ri < ringCount; ri++) {
                const ringR = dynamicRadius * (1.18 + ri * 0.16);
                const ringRot = now * (0.5 + ri * 0.3) * (ri % 2 === 0 ? 1 : -1);
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(ringRot);
                ctx.beginPath();
                ctx.ellipse(0, 0, ringR, ringR * 0.32, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,255,255,${0.1 + level * 0.08})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.restore();
            }
        }

        /* ─── 6. Floating particles ─── */
        const particleCount = st === "speaking" ? 18 : st === "listening" ? 12 : 6;
        for (let pi = 0; pi < particleCount; pi++) {
            const pAngle = (pi / particleCount) * Math.PI * 2 + now * 0.25;
            const pDist = dynamicRadius * (1.15 + noise(pi * 3.7 + now * 0.35, pi * 2.1) * 0.45 * (0.4 + level));
            const px = cx + Math.cos(pAngle) * pDist;
            const py = cy + Math.sin(pAngle) * pDist;
            const pSize = Math.max(0.1, 0.8 + noise(pi * 5.1, now) * 1.8);
            const pAlpha = Math.max(0, 0.25 + noise(pi * 7.3, now * 0.5) * 0.55);
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${pAlpha})`;
            ctx.fill();
        }

        /* ─── 7. Ripple on barge-in ─── */
        if (rippleRef.current) {
            const rippleAge = (performance.now() - rippleTimeRef.current) / 1000;
            if (rippleAge < 0.7) {
                const p1 = rippleAge / 0.7;
                const rr1 = dynamicRadius * (0.5 + p1 * 1.8);
                ctx.beginPath();
                ctx.arc(cx, cy, rr1, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(34,211,238,${(1 - p1) * 0.5})`;
                ctx.lineWidth = 2.5 * (1 - p1);
                ctx.stroke();

                if (rippleAge > 0.1) {
                    const p2 = Math.min(1, (rippleAge - 0.1) / 0.6);
                    const rr2 = dynamicRadius * (0.3 + p2 * 1.5);
                    ctx.beginPath();
                    ctx.arc(cx, cy, rr2, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(168,85,247,${(1 - p2) * 0.35})`;
                    ctx.lineWidth = 1.5 * (1 - p2);
                    ctx.stroke();
                }
            }
        }

        animRef.current = requestAnimationFrame(render);
    }, [canvasSize]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animRef.current);
    }, [render]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: canvasSize, height: canvasSize }}>
            <canvas
                ref={canvasRef}
                className="pointer-events-none"
                style={{
                    width: canvasSize,
                    height: canvasSize,
                    filter: `drop-shadow(0 0 ${18 + smoothLevel.current * 35}px ${PALETTES[state].glow})`,
                }}
            />
        </div>
    );
}

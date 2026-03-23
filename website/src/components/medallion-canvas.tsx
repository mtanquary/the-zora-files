"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";

/** Palette per level. Index = level number. */
const PALETTES = [
  // 0 - Scout (pewter, no gems)
  { rim: ["#C0C0C8","#9898A0","#686870","#3A3A42","#1A1A20"], face: ["#B8B8C0","#9898A4","#787880","#585860","#3A3A42","#222228"], gemFill: [], gemGlow: "", text: "rgba(180,180,195,0.88)", dark: "#0E0E10", edge: "rgba(200,200,210,0.32)", title: "SCOUT", motto: "THE PATH AWAITS" },
  // 1 - Trailhead (copper, rose quartz)
  { rim: ["#E8A070","#C87040","#8A4020","#3A1808","#150703"], face: ["#E8B080","#D09060","#B06830","#8A4820","#5A2810","#301208"], gemFill: ["#FFF0F0","#FFB0C0","#E87090","#8A2040","#3A0818"], gemGlow: "rgba(255,176,192,", text: "rgba(200,130,70,0.88)", dark: "#150703", edge: "rgba(232,160,112,0.42)", title: "TRAILHEAD", motto: "EVERY SUMMIT STARTS HERE" },
  // 2 - Desert Fox (warm bronze, amber topaz)
  { rim: ["#D8A060","#B88040","#805020","#3A2008","#180C03"], face: ["#D0A070","#C08850","#A06830","#7A4818","#4A2808","#281004"], gemFill: ["#FFFAE0","#FFD060","#E8A020","#8A5A10","#3A2008"], gemGlow: "rgba(255,208,96,", text: "rgba(200,140,60,0.88)", dark: "#180C03", edge: "rgba(216,160,96,0.42)", title: "DESERT FOX", motto: "INSTINCT OVER INSTRUCTION" },
  // 3 - Dawnchaser (antique gold, citrine)
  { rim: ["#E8C868","#C8A848","#8A7028","#3A2C08","#181003"], face: ["#D8B860","#C0A048","#A08030","#7A6018","#4A3808","#281C04"], gemFill: ["#FFFFF0","#FFE860","#E8C020","#8A7010","#3A2C08"], gemGlow: "rgba(255,232,96,", text: "rgba(200,160,40,0.88)", dark: "#181003", edge: "rgba(232,200,104,0.42)", title: "DAWNCHASER", motto: "CHASE THE LIGHT" },
  // 4 - First Light (rose gold, fire opal)
  { rim: ["#E8A898","#C88070","#8A4838","#3A1810","#180803"], face: ["#E0A090","#D08870","#B06848","#8A4828","#5A2818","#301008"], gemFill: ["#FFF0E8","#FFB090","#E87048","#8A3018","#3A1008"], gemGlow: "rgba(255,176,144,", text: "rgba(200,120,90,0.88)", dark: "#180803", edge: "rgba(232,168,152,0.42)", title: "FIRST LIGHT", motto: "THE FIRST RAY IS YOURS" },
  // 5 - Horizon Hunter (brushed silver, aquamarine)
  { rim: ["#C0D0D8","#98A8B0","#687880","#3A4248","#1A2028"], face: ["#B8C8D0","#98A8B4","#788890","#586870","#3A4A52","#223038"], gemFill: ["#F0FFFF","#90E8E0","#40C0B8","#1A7068","#083830"], gemGlow: "rgba(144,232,224,", text: "rgba(160,190,200,0.88)", dark: "#1A2028", edge: "rgba(192,208,216,0.32)", title: "HORIZON HUNTER", motto: "BEYOND THE EDGE" },
  // 6 - Zora Seeker (cool platinum, amethyst)
  { rim: ["#D0D0D8","#A8A8B8","#787888","#404050","#1A1A28"], face: ["#C8C8D0","#A8A8B4","#888890","#686870","#484852","#282830"], gemFill: ["#F8F0FF","#D0A0F0","#A060D0","#602090","#280840"], gemGlow: "rgba(208,160,240,", text: "rgba(180,170,200,0.88)", dark: "#1A1A28", edge: "rgba(208,208,216,0.32)", title: "ZORA SEEKER", motto: "SEEK THE UNSEEN" },
  // 7 - Dawn Keeper (dark oxidized gold, deep ruby)
  { rim: ["#C8A048","#A88030","#705018","#302008","#180C03"], face: ["#B89040","#A07830","#886020","#604010","#382008","#201004"], gemFill: ["#FFE8E8","#FF6060","#D02020","#700808","#300004"], gemGlow: "rgba(255,96,96,", text: "rgba(180,140,50,0.88)", dark: "#180C03", edge: "rgba(200,160,72,0.42)", title: "DAWN KEEPER", motto: "GUARD THE GOLDEN HOUR" },
  // 8 - Eos Adept (verdigris bronze, teal tourmaline)
  { rim: ["#80B8A0","#609880","#387858","#183828","#081810"], face: ["#78A890","#609078","#487860","#306048","#184030","#082818"], gemFill: ["#E8FFFA","#60E8C8","#20B890","#087850","#043828"], gemGlow: "rgba(96,232,200,", text: "rgba(120,170,150,0.88)", dark: "#081810", edge: "rgba(128,184,160,0.42)", title: "EOS ADEPT", motto: "MASTER OF THE DAWN" },
  // 9 - Zora Master (blackened silver, moonstone)
  { rim: ["#A0A0A8","#787880","#505058","#282830","#101018"], face: ["#909098","#787880","#606068","#484850","#303038","#181820"], gemFill: ["#FFFFFF","#E8E8F0","#C0C0D0","#808090","#404050"], gemGlow: "rgba(224,224,240,", text: "rgba(160,160,170,0.88)", dark: "#101018", edge: "rgba(160,160,168,0.32)", title: "ZORA MASTER", motto: "THE DAWN ANSWERS" },
  // 10 - Finding Zora (polished white gold, diamond)
  { rim: ["#F0E8D8","#D8D0C0","#A8A098","#585048","#282420"], face: ["#E8E0D0","#D8D0C0","#C0B8A8","#A89888","#887868","#584838"], gemFill: ["#FFFFFF","#F0F8FF","#D0E0F0","#90A8C0","#506070"], gemGlow: "rgba(240,248,255,", text: "rgba(220,210,200,0.88)", dark: "#282420", edge: "rgba(240,232,216,0.42)", title: "FINDING ZORA", motto: "THE PERFECT DAWN" },
];

export interface MedallionHandle {
  placeGem: () => Promise<void>;
  applyStreak: () => Promise<void>;
}

interface Props {
  level: number;
  gems: number;       // how many gems already placed (0-6)
  streak?: boolean;
  size?: number;       // display size in px
  animated?: boolean;  // if false, render static
}

export const MedallionCanvas = forwardRef<MedallionHandle, Props>(
  function MedallionCanvas({ level, gems, streak = false, size = 200, animated = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
      g: gems, done: gems >= 6, streak, etch: gems >= 6 ? 1 : 0,
      emblA: gems >= 6 ? 1 : 0.07, sg: 0, gl: 0, fg: -1, ft: 0, singIdx: -1, singT: 0,
    });
    const aidRef = useRef<number | null>(null);
    const actxRef = useRef<AudioContext | null>(null);
    const palette = PALETTES[Math.min(level, 10)];
    const isScout = level === 0;

    const getAudio = useCallback(() => {
      if (!actxRef.current) actxRef.current = new AudioContext();
      return actxRef.current;
    }, []);

    // Sound effects
    const sfxClick = useCallback(() => {
      const a = getAudio(), now = a.currentTime;
      const o1 = a.createOscillator(), g1 = a.createGain();
      o1.type = "sine"; o1.frequency.setValueAtTime(1800, now); o1.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      g1.gain.setValueAtTime(0.35, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      o1.connect(g1); g1.connect(a.destination); o1.start(now); o1.stop(now + 0.1);
      const o2 = a.createOscillator(), g2 = a.createGain();
      o2.type = "sine"; o2.frequency.setValueAtTime(4200, now); o2.frequency.exponentialRampToValueAtTime(2800, now + 0.06);
      g2.gain.setValueAtTime(0.15, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o2.connect(g2); g2.connect(a.destination); o2.start(now); o2.stop(now + 0.08);
    }, [getAudio]);

    const sfxChime = useCallback((idx: number) => {
      const a = getAudio(), now = a.currentTime;
      const notes = [329.63, 349.23, 369.99, 392.0, 415.3, 440.0];
      const freq = notes[Math.min(idx, 5)];
      const o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.2, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      o.connect(g); g.connect(a.destination); o.start(now); o.stop(now + 0.8);
    }, [getAudio]);

    const sfxWhoosh = useCallback(() => {
      const a = getAudio(), now = a.currentTime, dur = 0.85;
      const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(); src.buffer = buf;
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.Q.setValueAtTime(0.7, now);
      lp.frequency.setValueAtTime(200, now); lp.frequency.linearRampToValueAtTime(800, now + 0.3);
      lp.frequency.exponentialRampToValueAtTime(150, now + dur);
      const g = a.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.22, now + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(lp); lp.connect(g); g.connect(a.destination); src.start(now); src.stop(now + dur);
    }, [getAudio]);

    // Canvas rendering
    const render = useCallback(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      const c = cv.getContext("2d");
      if (!c) return;
      const S = 520, CX = 260, CY = 260, CR = 210, FR = 190;
      const GemR = 196, GL = 19, GW = 12;
      const ORg = 174, BOr = 163, BIn = 148, IRg = 144;
      const st = stateRef.current;
      const p = palette;

      c.clearRect(0, 0, S, S);

      // Streak crown
      if (st.streak) {
        const innerR = CR + 6, outerLong = CR + 36, outerShort = CR + 20, N = 36;
        c.save();
        c.beginPath(); c.arc(CX, CY, innerR, 0, Math.PI * 2);
        c.strokeStyle = `rgba(200,112,64,${0.55 + st.sg * 0.4})`; c.lineWidth = 2.2; c.stroke();
        for (let i = 0; i < N; i++) {
          const a = i / N * Math.PI * 2, big = i % 3 === 0, tip = big ? outerLong : outerShort;
          c.beginPath(); c.moveTo(CX + Math.cos(a) * innerR, CY + Math.sin(a) * innerR);
          c.lineTo(CX + Math.cos(a) * tip, CY + Math.sin(a) * tip);
          c.strokeStyle = `rgba(200,112,64,${(big ? 0.9 : 0.54) + st.sg * 0.3})`; c.lineWidth = big ? 1.8 : 0.9; c.stroke();
        }
        for (let i = 0; i < N; i += 3) {
          const a = i / N * Math.PI * 2, tx = CX + Math.cos(a) * outerLong, ty = CY + Math.sin(a) * outerLong;
          const pa = -Math.sin(a), pb = Math.cos(a);
          c.beginPath(); c.moveTo(tx + Math.cos(a) * 5, ty + Math.sin(a) * 5);
          c.lineTo(tx + pa * 2.5, ty + pb * 2.5); c.lineTo(tx - Math.cos(a) * 3, ty - Math.sin(a) * 3);
          c.lineTo(tx - pa * 2.5, ty - pb * 2.5); c.closePath();
          c.fillStyle = `rgba(232,160,112,${0.82 + st.sg * 0.18})`; c.fill();
        }
        c.restore();
      }

      // Shadow
      c.save(); c.beginPath(); c.ellipse(CX + 10, CY + 13, CR + 6, CR + 4, 0, 0, Math.PI * 2);
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fill(); c.restore();

      // Rim
      c.beginPath(); c.arc(CX, CY, CR, 0, Math.PI * 2); c.fillStyle = p.dark; c.fill();
      const rg = c.createLinearGradient(CX - CR * 0.76, CY - CR * 0.76, CX + CR * 0.76, CY + CR * 0.76);
      p.rim.forEach((col, i) => rg.addColorStop(i / (p.rim.length - 1), col));
      c.save(); c.beginPath(); c.arc(CX, CY, CR, 0, Math.PI * 2); c.arc(CX, CY, FR, 0, Math.PI * 2, true);
      c.clip(); c.fillStyle = rg; c.fillRect(0, 0, S, S); c.restore();

      // Face
      const fg = c.createRadialGradient(CX - 65, CY - 65, 0, CX, CY, FR * 1.1);
      p.face.forEach((col, i) => fg.addColorStop(i / (p.face.length - 1), col));
      c.beginPath(); c.arc(CX, CY, FR, 0, Math.PI * 2); c.fillStyle = fg; c.fill();

      // Rings
      [ORg, IRg].forEach(r => {
        c.beginPath(); c.arc(CX, CY, r, 0, Math.PI * 2); c.strokeStyle = "rgba(18,8,2,0.92)"; c.lineWidth = 1.5; c.stroke();
      });

      // Band
      if (isScout) {
        const midR = (BOr + BIn) / 2, h = (BOr - BIn) / 2;
        for (let strand = 0; strand < 2; strand++) {
          const phase = strand * Math.PI;
          for (let i = 0; i < 180; i++) {
            const a = i / 180 * Math.PI * 2;
            const wave = Math.sin(a * 8 + phase) * h * 0.7;
            const r = midR + wave;
            const base = strand === 0 ? 80 : 68;
            c.beginPath(); c.arc(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 2.2, 0, Math.PI * 2);
            c.fillStyle = `rgb(${base + 60},${base + 60},${base + 68})`; c.fill();
          }
        }
      } else {
        const rows = [{ r: (BOr + BIn) / 2 + 4, h: 6 }, { r: (BOr + BIn) / 2 - 4, h: 6 }];
        rows.forEach((row, ri) => {
          for (let i = 0; i < 20; i++) {
            const a1 = i / 20 * Math.PI * 2 + ri * Math.PI / 20;
            const a2 = (i + 0.85) / 20 * Math.PI * 2 + ri * Math.PI / 20;
            c.beginPath(); c.arc(CX, CY, row.r + row.h / 2, a1, a2);
            c.arc(CX, CY, row.r - row.h / 2, a2, a1, true); c.closePath();
            const rv = 160 + 60, gv = 88 + 40, bv = 48 + 20;
            c.fillStyle = `rgb(${rv},${gv},${bv})`; c.fill();
          }
        });
      }

      // Gem slots (levels 1+)
      if (!isScout) {
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2 - Math.PI / 2;
          const gx = CX + Math.cos(a) * GemR, gy = CY + Math.sin(a) * GemR;
          const co = Math.cos(a), si = Math.sin(a), px = -si, py = co;
          c.beginPath();
          c.moveTo(gx + co * (GL + 3), gy + si * (GL + 3));
          c.quadraticCurveTo(gx + px * (GW + 4), gy + py * (GW + 4), gx - co * (GL * 0.5 + 2), gy - si * (GL * 0.5 + 2));
          c.quadraticCurveTo(gx - px * (GW + 4), gy - py * (GW + 4), gx + co * (GL + 3), gy + si * (GL + 3));
          c.closePath();
          c.fillStyle = "#0A0301"; c.fill();
        }
      }

      // Emblem placeholder: simple circle with level initial
      const emblAlpha = st.done ? st.emblA : Math.max(0.07, st.emblA);
      c.save(); c.globalAlpha = emblAlpha;
      const eg = c.createRadialGradient(CX - 10, CY - 14, 0, CX, CY, 60);
      eg.addColorStop(0, p.face[0]); eg.addColorStop(1, p.face[3]);
      c.beginPath(); c.arc(CX, CY - 4, 55, 0, Math.PI * 2); c.fillStyle = eg; c.fill();
      c.font = "bold 28px monospace"; c.fillStyle = p.text; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(p.title.charAt(0), CX, CY - 2);
      c.restore();

      // Etched text
      if (st.etch > 0 || st.done) {
        const al = st.done ? 1 : st.etch;
        c.save(); c.globalAlpha = al * 0.95;
        c.font = "600 17px monospace"; c.fillStyle = p.text; c.textBaseline = "middle"; c.textAlign = "center";
        const chars = `\u00B7 ${p.title} \u00B7`.split("");
        const ar = IRg - 10, ca = 0.15, tot = chars.length * ca, sa = -Math.PI / 2 - tot / 2;
        chars.forEach((ch, i) => {
          const a = sa + i * ca;
          c.save(); c.translate(CX + Math.cos(a) * ar, CY + Math.sin(a) * ar);
          c.rotate(a + Math.PI / 2); c.fillText(ch, 0, 0); c.restore();
        });
        // Bottom motto
        c.font = "500 13px monospace";
        const mchars = p.motto.split("");
        const mca = 0.105, mtot = mchars.length * mca, msa = Math.PI / 2 + mtot / 2;
        mchars.forEach((ch, i) => {
          const a = msa - i * mca;
          c.save(); c.translate(CX + Math.cos(a) * (IRg - 10), CY + Math.sin(a) * (IRg - 10));
          c.rotate(a - Math.PI / 2); c.fillText(ch, 0, 0); c.restore();
        });
        c.restore();
      }

      // Gems (levels 1+)
      if (!isScout && p.gemFill.length > 0) {
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2 - Math.PI / 2;
          const gx = CX + Math.cos(a) * GemR, gy = CY + Math.sin(a) * GemR;
          const co = Math.cos(a), si = Math.sin(a), ppx = -si, ppy = co;
          const filled = i < st.g || (i === st.fg && st.ft > 0.1);

          let sc = 1;
          if (i === st.fg && st.ft > 0) {
            const t = st.ft;
            sc = t < 0.35 ? (t / 0.35) * 1.28 : 1 + (1 - t) * 0.28;
          }

          c.save(); c.translate(gx, gy); c.scale(sc, sc); c.translate(-gx, -gy);

          // Draw gem shape
          c.beginPath();
          c.moveTo(gx + co * GL, gy + si * GL);
          c.quadraticCurveTo(gx + ppx * (GW + 2), gy + ppy * (GW + 2), gx - co * (GL * 0.5), gy - si * (GL * 0.5));
          c.quadraticCurveTo(gx - ppx * (GW + 2), gy - ppy * (GW + 2), gx + co * GL, gy + si * GL);
          c.closePath();

          if (filled) {
            const hx = gx - co * 4 - si * 2.5, hy = gy - si * 4 + co * 2.5;
            const gr = c.createRadialGradient(hx, hy, 0.5, gx, gy, GL * 1.4);
            p.gemFill.forEach((col, j) => gr.addColorStop(j / (p.gemFill.length - 1), col));
            c.fillStyle = gr; c.fill();
            c.strokeStyle = `${p.gemGlow}0.75)`; c.lineWidth = 0.8; c.stroke();
          } else {
            c.fillStyle = "#0A0301"; c.fill();
          }

          // Snap glow
          if (i === st.fg && st.ft > 0.05 && filled) {
            const ga = Math.sin(st.ft * Math.PI) * 0.55;
            const gr = c.createRadialGradient(gx, gy, 0, gx, gy, 28);
            gr.addColorStop(0, `${p.gemGlow}${ga})`); gr.addColorStop(1, `${p.gemGlow}0)`);
            c.beginPath(); c.arc(gx, gy, 28, 0, Math.PI * 2); c.fillStyle = gr; c.fill();
          }

          // Singing glow
          if (i === st.singIdx && st.singT > 0) {
            const sa2 = Math.sin(st.singT * Math.PI) * 0.7;
            const sg = c.createRadialGradient(gx, gy, 0, gx, gy, 32);
            sg.addColorStop(0, `${p.gemGlow}${sa2})`); sg.addColorStop(1, `${p.gemGlow}0)`);
            c.beginPath(); c.arc(gx, gy, 32, 0, Math.PI * 2); c.fillStyle = sg; c.fill();
          }

          c.restore();
        }
      }

      // Glisten
      if (st.gl > 0) {
        const x = CX + (st.gl - 0.5) * FR * 2.2, y = CY + (st.gl - 0.5) * FR * 2.2;
        c.save(); c.beginPath(); c.arc(CX, CY, FR, 0, Math.PI * 2); c.clip();
        const al = Math.sin(st.gl * Math.PI) * 0.32;
        const gr = c.createRadialGradient(x, y, 0, x, y, 130);
        gr.addColorStop(0, `rgba(255,220,210,${al})`); gr.addColorStop(1, "rgba(200,112,64,0)");
        c.fillStyle = gr; c.fillRect(0, 0, S, S); c.restore();
      }

      // Edge highlights
      c.beginPath(); c.arc(CX, CY, CR, Math.PI * 0.94, Math.PI * 1.73);
      c.strokeStyle = p.edge; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); c.arc(CX, CY, CR, -0.08, Math.PI * 0.88);
      c.strokeStyle = "rgba(5,2,0,0.65)"; c.lineWidth = 1.6; c.stroke();
    }, [palette, isScout]);

    // Animation helper
    const anim = useCallback((dur: number, fn: (t: number) => void): Promise<void> => {
      return new Promise(res => {
        if (aidRef.current) cancelAnimationFrame(aidRef.current);
        const t0 = performance.now();
        function tick(now: number) {
          const t = Math.min((now - t0) / (dur * 1000), 1);
          fn(t);
          render();
          if (t < 1) { aidRef.current = requestAnimationFrame(tick); }
          else { aidRef.current = null; res(); }
        }
        aidRef.current = requestAnimationFrame(tick);
      });
    }, [render]);

    const pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    // Sing all placed gems
    const singGems = useCallback(async () => {
      const st = stateRef.current;
      for (let i = 0; i < st.g; i++) {
        st.singIdx = i;
        sfxChime(i);
        await anim(0.38, t => { st.singT = t; });
        st.singT = 0;
        await pause(80);
      }
      st.singIdx = -1; st.singT = 0; render();
    }, [anim, sfxChime, render]);

    // Place a single gem with animation
    const placeGem = useCallback(async () => {
      const st = stateRef.current;
      if (aidRef.current) return;
      if (st.g >= 6) return;

      const idx = st.g;
      st.fg = idx;

      sfxClick();
      await anim(0.52, t => { st.ft = t; });
      st.g = idx + 1; st.fg = -1; st.ft = 0;

      sfxWhoosh();
      await anim(0.65, t => { st.gl = t; });
      st.gl = 0; render();

      await pause(200);
      await singGems();
    }, [anim, sfxClick, sfxWhoosh, singGems, render]);

    // Streak crown sound: ascending 7-note arpeggio
    const sfxStreak = useCallback(() => {
      const a = getAudio(), now = a.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        const o = a.createOscillator(), g = a.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.6);
      });
      [523.25, 783.99, 1046.5].forEach(freq => {
        const t = now + 0.5;
        const o = a.createOscillator(), g = a.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.4);
        g.gain.setValueAtTime(0.07, t + 1.2); g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 2.2);
      });
    }, [getAudio]);

    // Apply streak crown animation
    const applyStreak = useCallback(async () => {
      const st = stateRef.current;
      if (aidRef.current) return;
      if (st.streak) return;

      st.streak = true;
      sfxStreak();
      await anim(1.8, t => {
        st.sg = t < 0.42 ? t / 0.42 : Math.max(0, 1 - (t - 0.42) / 0.58);
      });
      st.sg = 0;
      render();
    }, [anim, sfxStreak, render]);

    useImperativeHandle(ref, () => ({ placeGem, applyStreak }), [placeGem, applyStreak]);

    // Initial render
    useEffect(() => {
      stateRef.current = {
        g: gems, done: gems >= 6, streak, etch: gems >= 6 ? 1 : 0,
        emblA: gems >= 6 ? 1 : 0.07, sg: 0, gl: 0, fg: -1, ft: 0, singIdx: -1, singT: 0,
      };
      render();
    }, [gems, streak, render]);

    return (
      <canvas
        ref={canvasRef}
        width={520}
        height={520}
        style={{ width: size, height: size, display: "block" }}
      />
    );
  }
);

import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  cream: "#FAF8F4",
  warm: "#F2EDE4",
  navy: "#1E2D3D",
  navyLight: "#2C4159",
  teal: "#2A9D8F",
  tealLight: "#52B5A8",
  tealBg: "#E8F5F3",
  coral: "#E76F51",
  coralBg: "#FDF0EC",
  gold: "#E9C46A",
  goldBg: "#FDF6E3",
  lavender: "#9B8EC4",
  lavBg: "#F0EDF8",
  sage: "#6BAB90",
  sageBg: "#EAF4EF",
  mint: "#A8D8C8",
  blush: "#F2B5A0",
  muted: "#8A8A8A",
  border: "#E8E2D8",
  white: "#FFFFFF",
  text: "#1E2D3D",
};

const DOMAIN_META = {
  finemotor: { label: "Fine Motor", icon: "✏️", color: C.teal, bg: C.tealBg },
  selfcare: { label: "Self-Care", icon: "🪥", color: C.coral, bg: C.coralBg },
  attention: {
    label: "Attention & Regulation",
    icon: "🧘",
    color: C.lavender,
    bg: C.lavBg,
  },
};

const ALL_TOOLS = [
  {
    id: "lettertracing",
    label: "Letter Tracing",
    icon: "✏️",
    domain: "finemotor",
    ages: "4–10",
    configFields: ["letters"],
  },
  {
    id: "shapetracing",
    label: "Shape Tracing",
    icon: "⬟",
    domain: "finemotor",
    ages: "3–8",
    configFields: [],
  },
  {
    id: "dottodot",
    label: "Dot-to-Dot",
    icon: "🔢",
    domain: "finemotor",
    ages: "4–9",
    configFields: ["level"],
  },
  {
    id: "toothtimer",
    label: "Tooth Brushing",
    icon: "🪥",
    domain: "selfcare",
    ages: "3–10",
    configFields: [],
  },
  {
    id: "handwash",
    label: "Hand Washing",
    icon: "🤲",
    domain: "selfcare",
    ages: "3–10",
    configFields: [],
  },
  {
    id: "dressingsequence",
    label: "Dressing Steps",
    icon: "👕",
    domain: "selfcare",
    ages: "3–8",
    configFields: [],
  },
  {
    id: "visualtimer",
    label: "Visual Timer",
    icon: "⏱️",
    domain: "attention",
    ages: "3–12",
    configFields: ["duration"],
  },
  {
    id: "firstthen",
    label: "First–Then Board",
    icon: "➡️",
    domain: "attention",
    ages: "3–10",
    configFields: [],
  },
  {
    id: "tokenboard",
    label: "Token Board",
    icon: "⭐",
    domain: "attention",
    ages: "4–12",
    configFields: ["tokenGoal", "reward"],
  },
  {
    id: "breathing",
    label: "Breathing",
    icon: "🌬️",
    domain: "attention",
    ages: "4–12",
    configFields: ["exercise"],
  },
];

// ─── QR CODE (pure JS, no library) ───────────────────────────────────────────
// Minimal QR renderer using qrcode-svg approach via a CDN-free data matrix visual
// We'll use a tiny inline QR via the Google Charts API encoded as img src
function QRCode({ value, size = 180 }) {
  const encoded = encodeURIComponent(value);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=1E2D3D&margin=2`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 12, border: `2px solid ${C.border}` }}
    />
  );
}

// ─── ENCODE/DECODE client config into URL ─────────────────────────────────────
function encodeClientConfig(client) {
  const payload = {
    n: client.nickname,
    t: client.tools.map((t) => ({ id: t.id, cfg: t.config })),
  };
  return btoa(JSON.stringify(payload));
}
function decodeClientConfig(str) {
  try {
    return JSON.parse(atob(str));
  } catch {
    return null;
  }
}
function getToolURL(toolId) {
  const base = "https://ot-app-sigma.vercel.app";
  return `${base}?tool=${toolId}`;
}

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : init;
    } catch {
      return init;
    }
  });
  function save(v) {
    setVal(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  }
  return [val, save];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── TOOLS (same as v1, trimmed for space) ────────────────────────────────────

function LetterTracing({ config = {} }) {
  const canvasRef = useRef(null);
  const letters = (config.letters || "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    .split("")
    .filter(Boolean);
  const [letter, setLetter] = useState(letters[0] || "A");
  const [isDrawing, setIsDrawing] = useState(false);
  useEffect(() => {
    drawGuide();
  }, [letter]);
  function drawGuide() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width,
      h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFEF9";
    ctx.fillRect(0, 0, w, h);
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#D4C9B0";
    ctx.lineWidth = 1.5;
    [0.25, 0.5, 0.75].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(20, h * y);
      ctx.lineTo(w - 20, h * y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.font = `bold ${h * 0.7}px Georgia`;
    ctx.fillStyle = "rgba(42,157,143,0.08)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, w / 2, h / 2);
    ctx.font = `${h * 0.07}px Georgia`;
    ctx.fillStyle = C.teal;
    ctx.fillText("trace →", w / 2, h * 0.9);
  }
  function gp(e, canvas) {
    const r = canvas.getBoundingClientRect(),
      sx = canvas.width / r.width,
      sy = canvas.height / r.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX,
      cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * sx, y: (cy - r.top) * sy };
  }
  function sd(e) {
    e.preventDefault();
    const c = canvasRef.current,
      ctx = c.getContext("2d"),
      p = gp(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setIsDrawing(true);
  }
  function dr(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const c = canvasRef.current,
      ctx = c.getContext("2d"),
      p = gp(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  function clear() {
    drawGuide();
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          justifyContent: "center",
          maxWidth: 380,
        }}
      >
        {letters.map((l) => (
          <button
            key={l}
            onClick={() => setLetter(l)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "none",
              background: letter === l ? C.teal : "#E8F5F3",
              color: letter === l ? "white" : C.navy,
              fontWeight: "bold",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Georgia",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={260}
        onMouseDown={sd}
        onMouseMove={dr}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onTouchStart={sd}
        onTouchMove={dr}
        onTouchEnd={() => setIsDrawing(false)}
        style={{
          borderRadius: 16,
          border: `2px solid ${C.teal}30`,
          cursor: "crosshair",
          width: "100%",
          maxWidth: 360,
          touchAction: "none",
        }}
      />
      <Btn onClick={clear} color={C.teal}>
        Clear
      </Btn>
    </div>
  );
}

function ShapeTracing() {
  const canvasRef = useRef(null);
  const [shape, setShape] = useState("circle");
  const [isDrawing, setIsDrawing] = useState(false);
  const shapes = [
    { id: "circle", label: "○" },
    { id: "square", label: "□" },
    { id: "triangle", label: "△" },
    { id: "star", label: "☆" },
    { id: "zigzag", label: "⌇" },
  ];
  useEffect(() => {
    drawShape();
  }, [shape]);
  function drawShape() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFEF9";
    ctx.fillRect(0, 0, w, h);
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = "rgba(42,157,143,0.35)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    const cx = w / 2,
      cy = h / 2;
    ctx.beginPath();
    if (shape === "circle") ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    else if (shape === "square") ctx.rect(cx - 90, cy - 90, 180, 180);
    else if (shape === "triangle") {
      ctx.moveTo(cx, cy - 100);
      ctx.lineTo(cx + 100, cy + 80);
      ctx.lineTo(cx - 100, cy + 80);
      ctx.closePath();
    } else if (shape === "star") {
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2,
          b = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + 100 * Math.cos(a), cy + 100 * Math.sin(a));
        else ctx.lineTo(cx + 100 * Math.cos(a), cy + 100 * Math.sin(a));
        ctx.lineTo(cx + 40 * Math.cos(b), cy + 40 * Math.sin(b));
      }
      ctx.closePath();
    } else if (shape === "zigzag") {
      const pts = [
        [30, cy + 50],
        [90, cy - 50],
        [150, cy + 50],
        [210, cy - 50],
        [270, cy + 50],
        [330, cy - 50],
      ];
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function gp(e, c) {
    const r = c.getBoundingClientRect(),
      sx = c.width / r.width,
      sy = c.height / r.height,
      cx = e.touches ? e.touches[0].clientX : e.clientX,
      cy2 = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * sx, y: (cy2 - r.top) * sy };
  }
  function sd(e) {
    e.preventDefault();
    const c = canvasRef.current,
      ctx = c.getContext("2d"),
      p = gp(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setIsDrawing(true);
  }
  function dr(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const c = canvasRef.current,
      ctx = c.getContext("2d"),
      p = gp(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.setLineDash([]);
    ctx.stroke();
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {shapes.map((s) => (
          <button
            key={s.id}
            onClick={() => setShape(s.id)}
            style={{
              padding: "7px 16px",
              borderRadius: 18,
              border: "none",
              background: shape === s.id ? C.teal : "#E8F5F3",
              color: shape === s.id ? "white" : C.navy,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={260}
        onMouseDown={sd}
        onMouseMove={dr}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onTouchStart={sd}
        onTouchMove={dr}
        onTouchEnd={() => setIsDrawing(false)}
        style={{
          borderRadius: 16,
          border: `2px solid ${C.teal}30`,
          cursor: "crosshair",
          width: "100%",
          maxWidth: 360,
          touchAction: "none",
        }}
      />
      <Btn onClick={drawShape} color={C.teal}>
        Clear
      </Btn>
    </div>
  );
}

function DotToDot({ config = {} }) {
  const canvasRef = useRef(null);
  const [next, setNext] = useState(1);
  const [done, setDone] = useState(false);
  const initLevel = config.level || "easy";
  const [level, setLevel] = useState(initLevel);
  const levels = {
    easy: [
      { x: 190, y: 40 },
      { x: 300, y: 120 },
      { x: 260, y: 240 },
      { x: 120, y: 240 },
      { x: 80, y: 120 },
    ],
    medium: [
      { x: 190, y: 30 },
      { x: 280, y: 90 },
      { x: 320, y: 200 },
      { x: 240, y: 270 },
      { x: 140, y: 270 },
      { x: 60, y: 200 },
      { x: 100, y: 90 },
    ],
    hard: [
      { x: 190, y: 20 },
      { x: 255, y: 60 },
      { x: 320, y: 70 },
      { x: 290, y: 140 },
      { x: 310, y: 210 },
      { x: 240, y: 250 },
      { x: 190, y: 220 },
      { x: 140, y: 250 },
      { x: 70, y: 210 },
      { x: 90, y: 140 },
      { x: 60, y: 70 },
      { x: 125, y: 60 },
    ],
  };
  const dots = levels[level];
  const lines = useRef([]);
  useEffect(() => {
    lines.current = [];
    setNext(1);
    setDone(false);
    drawAll([], dots);
  }, [level]);
  function drawAll(dl, ds) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFEF9";
    ctx.fillRect(0, 0, w, h);
    dl.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(ds[a].x, ds[a].y);
      ctx.lineTo(ds[b].x, ds[b].y);
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    ds.forEach((d, i) => {
      const isN = i + 1 === next;
      ctx.beginPath();
      ctx.arc(d.x, d.y, isN ? 14 : 10, 0, Math.PI * 2);
      ctx.fillStyle = i < next - 1 ? C.mint : isN ? C.gold : "#E8F5F3";
      ctx.fill();
      ctx.strokeStyle = isN ? C.coral : C.teal;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = C.navy;
      ctx.font = `bold ${isN ? 13 : 11}px Georgia`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i + 1, d.x, d.y);
    });
  }
  function tap(e) {
    if (done) return;
    const canvas = canvasRef.current,
      r = canvas.getBoundingClientRect(),
      sx = canvas.width / r.width,
      sy = canvas.height / r.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX,
      cy = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (cx - r.left) * sx,
      y = (cy - r.top) * sy,
      t = dots[next - 1],
      d = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
    if (d < 40) {
      const nl = [...lines.current];
      if (next > 1) nl.push([next - 2, next - 1]);
      if (next === dots.length) {
        nl.push([next - 1, 0]);
        lines.current = nl;
        setDone(true);
        drawAll(nl, dots);
      } else {
        lines.current = nl;
        setNext(next + 1);
        drawAll(nl, dots);
      }
    }
  }
  useEffect(() => {
    drawAll(lines.current, dots);
  }, [next, done]);
  function reset() {
    lines.current = [];
    setNext(1);
    setDone(false);
    drawAll([], dots);
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {["easy", "medium", "hard"].map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            style={{
              padding: "7px 16px",
              borderRadius: 18,
              border: "none",
              background: level === l ? C.teal : "#E8F5F3",
              color: level === l ? "white" : C.navy,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {done && (
        <div
          style={{
            background: C.gold,
            borderRadius: 14,
            padding: "8px 20px",
            fontWeight: "bold",
            color: C.navy,
          }}
        >
          🌟 Well done!
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={380}
        height={300}
        onClick={tap}
        onTouchEnd={tap}
        style={{
          borderRadius: 16,
          border: `2px solid ${C.teal}30`,
          cursor: "pointer",
          width: "100%",
          maxWidth: 380,
          touchAction: "none",
        }}
      />
      <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
        {done ? "Complete!" : ` Tap dot ${next} of ${dots.length}`}
      </p>
      <Btn onClick={reset} color={C.teal}>
        Reset
      </Btn>
    </div>
  );
}

function ToothTimer() {
  const zones = [
    { id: "tl", label: "Top Left", icon: "🦷" },
    { id: "tr", label: "Top Right", icon: "🦷" },
    { id: "bl", label: "Bot Left", icon: "🦷" },
    { id: "br", label: "Bot Right", icon: "🦷" },
    { id: "tf", label: "Top Front", icon: "😁" },
    { id: "bf", label: "Bot Front", icon: "😁" },
  ];
  const ZT = 30;
  const [running, setRunning] = useState(false);
  const [cz, setCz] = useState(0);
  const [tl, setTl] = useState(ZT);
  const [done, setDone] = useState(false);
  const ir = useRef(null);
  useEffect(() => {
    if (running) {
      ir.current = setInterval(() => {
        setTl((t) => {
          if (t <= 1) {
            if (cz < zones.length - 1) {
              setCz((z) => z + 1);
              return ZT;
            } else {
              clearInterval(ir.current);
              setRunning(false);
              setDone(true);
              return 0;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ir.current);
  }, [running, cz]);
  function start() {
    setRunning(true);
    setDone(false);
    setCz(0);
    setTl(ZT);
  }
  function reset() {
    clearInterval(ir.current);
    setRunning(false);
    setDone(false);
    setCz(0);
    setTl(ZT);
  }
  const prog = ((ZT - tl) / ZT) * 100;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
      }}
    >
      {done ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: 20,
              color: C.teal,
              fontFamily: "Lora,Georgia,serif",
            }}
          >
            Amazing brushing!
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>{zones[cz].icon}</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 18,
                color: C.navy,
                fontFamily: "Lora,Georgia,serif",
              }}
            >
              {zones[cz].label}
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: "bold",
                color: C.coral,
                fontFamily: "Georgia",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {tl}s
            </div>
          </div>
          <ProgressBar pct={prog} color={C.teal} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              width: "100%",
              maxWidth: 320,
            }}
          >
            {zones.map((z, i) => (
              <div
                key={z.id}
                style={{
                  borderRadius: 10,
                  padding: "8px 4px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: "bold",
                  background:
                    i < cz ? C.mint : i === cz && running ? C.gold : "#F0F0F0",
                  color: i <= cz ? C.navy : C.muted,
                  transition: "all 0.3s",
                }}
              >
                {i < cz ? "✓" : z.icon} {z.label}
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        {!running && !done && (
          <Btn onClick={start} color={C.coral}>
            Start 🪥
          </Btn>
        )}
        {(running || done) && (
          <Btn onClick={reset} color={C.muted}>
            Reset
          </Btn>
        )}
      </div>
    </div>
  );
}

function HandWash() {
  const steps = [
    { l: "Wet hands", i: "💧", d: 5 },
    { l: "Apply soap", i: "🧴", d: 5 },
    { l: "Scrub palms", i: "🤲", d: 8 },
    { l: "Scrub back", i: "👐", d: 8 },
    { l: "Scrub fingers", i: "🖐️", d: 8 },
    { l: "Rinse", i: "🚿", d: 10 },
    { l: "Dry hands", i: "🏻", d: 6 },
  ];
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [tl, setTl] = useState(steps[0].d);
  const [done, setDone] = useState(false);
  const ir = useRef(null);
  useEffect(() => {
    if (running) {
      ir.current = setInterval(() => {
        setTl((t) => {
          if (t <= 1) {
            if (step < steps.length - 1) {
              const n = step + 1;
              setStep(n);
              return steps[n].d;
            } else {
              clearInterval(ir.current);
              setRunning(false);
              setDone(true);
              return 0;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ir.current);
  }, [running, step]);
  function start() {
    setRunning(true);
    setDone(false);
    setStep(0);
    setTl(steps[0].d);
  }
  function reset() {
    clearInterval(ir.current);
    setRunning(false);
    setDone(false);
    setStep(0);
    setTl(steps[0].d);
  }
  const prog = ((steps[step].d - tl) / steps[step].d) * 100;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
      }}
    >
      {done ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>✨</div>
          <div style={{ fontWeight: "bold", fontSize: 20, color: C.teal }}>
            Clean hands!
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52 }}>{steps[step].i}</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 18,
                color: C.navy,
                fontFamily: "Lora,Georgia,serif",
              }}
            >
              {steps[step].l}
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: "bold",
                color: C.coral,
                fontFamily: "Georgia",
              }}
            >
              {tl}s
            </div>
          </div>
          <ProgressBar pct={prog} color={C.coral} />
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  background:
                    i < step
                      ? C.blush
                      : i === step && running
                        ? C.gold
                        : "#F0F0F0",
                  transition: "all 0.3s",
                }}
              >
                {i < step ? "✓" : s.i}
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        {!running && !done && (
          <Btn onClick={start} color={C.coral}>
            Start 🚿
          </Btn>
        )}
        {(running || done) && (
          <Btn onClick={reset} color={C.muted}>
            Reset
          </Btn>
        )}
      </div>
    </div>
  );
}

function DressingSequence() {
  const steps = [
    { icon: "🩲", label: "Underwear first" },
    { icon: "🧦", label: "Socks on" },
    { icon: "👕", label: "Shirt / top" },
    { icon: "👖", label: "Pants / bottoms" },
    { icon: "👟", label: "Shoes" },
  ];
  const [completed, setCompleted] = useState([]);
  const allDone = completed.length === steps.length;
  function toggle(i) {
    setCompleted((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div style={{ color: C.muted, fontSize: 13 }}>
        Tap each step when done
      </div>
      {steps.map((s, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          style={{
            width: "100%",
            maxWidth: 340,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "13px 18px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background: completed.includes(i) ? C.mint : "#F5F5F5",
            transition: "all 0.25s",
          }}
        >
          <span style={{ fontSize: 32 }}>{s.icon}</span>
          <span
            style={{
              fontWeight: "bold",
              fontSize: 16,
              color: C.navy,
              fontFamily: "Lora,Georgia,serif",
              flex: 1,
              textAlign: "left",
            }}
          >
            {s.label}
          </span>
          <span
            style={{
              fontSize: 20,
              color: completed.includes(i) ? C.teal : "#CCC",
            }}
          >
            {completed.includes(i) ? "✅" : "○"}
          </span>
        </button>
      ))}
      {allDone && (
        <div
          style={{
            background: C.gold,
            borderRadius: 14,
            padding: "10px 24px",
            fontWeight: "bold",
            color: C.navy,
          }}
        >
          🌟 All dressed!
        </div>
      )}
      <Btn onClick={() => setCompleted([])} color={C.muted} small>
        Reset
      </Btn>
    </div>
  );
}

function VisualTimer({ config = {} }) {
  const initDur = config.duration || 5;
  const [duration, setDuration] = useState(initDur);
  const [tl, setTl] = useState(initDur * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ir = useRef(null);
  const total = duration * 60;
  const presets = [1, 2, 3, 5, 10, 15, 20];
  useEffect(() => {
    if (running) {
      ir.current = setInterval(() => {
        setTl((t) => {
          if (t <= 1) {
            clearInterval(ir.current);
            setRunning(false);
            setDone(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ir.current);
  }, [running]);
  function setP(m) {
    clearInterval(ir.current);
    setRunning(false);
    setDone(false);
    setDuration(m);
    setTl(m * 60);
  }
  function reset() {
    clearInterval(ir.current);
    setRunning(false);
    setDone(false);
    setTl(duration * 60);
  }
  const pct = tl / total;
  const angle = pct * 360;
  const r = 100;
  const cx = 130,
    cy = 130;
  function arc() {
    if (pct >= 1)
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
    if (pct <= 0) return "";
    const rad = ((angle - 90) * Math.PI) / 180;
    const ex = cx + r * Math.cos(rad),
      ey = cy + r * Math.sin(rad);
    return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${ex} ${ey} Z`;
  }
  const mins = Math.floor(tl / 60),
    secs = tl % 60;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 7,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setP(p)}
            style={{
              padding: "6px 13px",
              borderRadius: 16,
              border: "none",
              background: duration === p ? C.lavender : "#F0ECF8",
              color: duration === p ? "white" : C.navy,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {p}m
          </button>
        ))}
      </div>
      <svg
        width={260}
        height={260}
        style={{ filter: "drop-shadow(0 4px 16px rgba(155,142,196,0.3))" }}
      >
        <circle cx={cx} cy={cy} r={r + 8} fill="#F3EFFA" />
        <circle cx={cx} cy={cy} r={r} fill="#EDE6F8" />
        {!done && pct > 0 && (
          <path d={arc()} fill={C.lavender} opacity={0.85} />
        )}
        {done && <circle cx={cx} cy={cy} r={r} fill={C.gold} opacity={0.7} />}
        <circle cx={cx} cy={cy} r={r - 26} fill="white" />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: done ? 32 : 34,
            fontWeight: "bold",
            fontFamily: "Georgia",
            fill: done ? C.coral : C.navy,
          }}
        >
          {done ? "🎉" : `${mins}:${String(secs).padStart(2, "0")}`}
        </text>
        {!done && (
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            style={{ fontSize: 12, fill: C.muted, fontFamily: "Georgia" }}
          >
            {running ? "in progress" : "paused"}
          </text>
        )}
      </svg>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => !done && setRunning(!running)}
          style={{
            padding: "11px 28px",
            borderRadius: 22,
            border: "none",
            background: done ? "#E0E0E0" : running ? C.muted : C.lavender,
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <Btn onClick={reset} color={C.muted} small>
          Reset
        </Btn>
      </div>
    </div>
  );
}

function FirstThen() {
  const fo = [
    "🧮 Maths work",
    "🖊️ Writing task",
    "🧹 Tidy up",
    "🍽️ Eat lunch",
    "🪥 Brush teeth",
    "👕 Get dressed",
  ];
  const to = [
    "🎮 Free play",
    "📱 Tablet time",
    "🍪 Snack",
    "⭐ Sticker",
    "🎨 Drawing",
    "🎵 Music time",
  ];
  const [first, setFirst] = useState(null);
  const [then, setThen] = useState(null);
  const [step, setStep] = useState("first");
  const [fd, setFd] = useState(false);
  function reset() {
    setFirst(null);
    setThen(null);
    setStep("first");
    setFd(false);
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
      }}
    >
      {step === "ready" ? (
        <>
          <div
            style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}
          >
            <button
              onClick={() => setFd(!fd)}
              style={{
                flex: 1,
                padding: "18px 10px",
                borderRadius: 18,
                border: "none",
                cursor: "pointer",
                background: fd ? C.mint : C.coral,
                color: "white",
                textAlign: "center",
                transition: "all 0.3s",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  opacity: 0.8,
                  marginBottom: 4,
                }}
              >
                FIRST
              </div>
              <div style={{ fontSize: 26 }}>{first.split(" ")[0]}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  fontFamily: "Lora,serif",
                  marginTop: 3,
                }}
              >
                {first.split(" ").slice(1).join(" ")}
              </div>
              {fd && <div style={{ marginTop: 6, fontSize: 18 }}>✓</div>}
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 24,
                color: C.muted,
              }}
            >
              →
            </div>
            <div
              style={{
                flex: 1,
                padding: "18px 10px",
                borderRadius: 18,
                background: fd ? C.gold : "#E8E8E8",
                color: fd ? C.navy : C.muted,
                textAlign: "center",
                transition: "all 0.3s",
                boxShadow: fd ? `0 4px 16px ${C.gold}60` : "none",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  opacity: 0.7,
                  marginBottom: 4,
                }}
              >
                THEN
              </div>
              <div style={{ fontSize: 26 }}>{then.split(" ")[0]}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  fontFamily: "Lora,serif",
                  marginTop: 3,
                }}
              >
                {then.split(" ").slice(1).join(" ")}
              </div>
            </div>
          </div>
          {!fd && (
            <div style={{ color: C.muted, fontSize: 13 }}>
              Tap "First" when done ✓
            </div>
          )}
          <Btn onClick={reset} color={C.muted} small>
            Change
          </Btn>
        </>
      ) : (
        <>
          <div
            style={{
              fontWeight: "bold",
              fontSize: 16,
              color: C.navy,
              fontFamily: "Lora,serif",
            }}
          >
            {step === "first"
              ? "Choose the FIRST activity:"
              : "Choose the THEN reward:"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 9,
              width: "100%",
              maxWidth: 340,
            }}
          >
            {(step === "first" ? fo : to).map((o) => (
              <button
                key={o}
                onClick={() =>
                  step === "first"
                    ? (setFirst(o), setStep("then"))
                    : (setThen(o), setStep("ready"))
                }
                style={{
                  padding: "13px 8px",
                  borderRadius: 14,
                  border: "none",
                  background: step === "first" ? "#FDF0EC" : "#FFF8E8",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 13,
                  color: C.navy,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24 }}>{o.split(" ")[0]}</div>
                <div style={{ marginTop: 3, fontSize: 11 }}>
                  {o.split(" ").slice(1).join(" ")}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TokenBoard({ config = {} }) {
  const initGoal = parseInt(config.tokenGoal) || 5;
  const initReward = config.reward || "🎮 Free play";
  const [tokens, setTokens] = useState(0);
  const [goal] = useState(initGoal);
  const [reward] = useState(initReward);
  const [cel, setCel] = useState(false);
  function add() {
    if (tokens >= goal) return;
    const n = tokens + 1;
    setTokens(n);
    if (n >= goal) {
      setCel(true);
      setTimeout(() => setCel(false), 3000);
    }
  }
  function reset() {
    setTokens(0);
    setCel(false);
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#FFF8E8",
          borderRadius: 18,
          padding: "10px 20px",
          textAlign: "center",
          border: `2px dashed ${C.gold}`,
        }}
      >
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>
          REWARD
        </div>
        <div style={{ fontSize: 18, fontWeight: "bold", color: C.navy }}>
          {reward}
        </div>
      </div>
      {cel && (
        <div
          style={{
            background: C.gold,
            borderRadius: 14,
            padding: "10px 24px",
            fontWeight: "bold",
            color: C.navy,
            fontSize: 16,
            animation: "popIn 0.4s ease",
          }}
        >
          🎉 You earned it!
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 340,
        }}
      >
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            onClick={add}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: i < tokens ? C.gold : "#E8E8E8",
              border: `3px solid ${i < tokens ? C.coral : "#D0D0D0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              cursor: "pointer",
              transition: "all 0.25s",
              boxShadow: i < tokens ? `0 4px 14px ${C.gold}60` : "none",
              transform: i < tokens ? "scale(1.1)" : "scale(1)",
            }}
          >
            {i < tokens ? "⭐" : ""}
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 13 }}>
        {tokens} / {goal} tokens
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={add}
          disabled={tokens >= goal}
          style={{
            padding: "11px 24px",
            borderRadius: 22,
            border: "none",
            background: tokens >= goal ? "#E0E0E0" : C.gold,
            color: tokens >= goal ? C.muted : C.navy,
            fontWeight: "bold",
            cursor: tokens >= goal ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          + Token
        </button>
        <Btn onClick={reset} color={C.muted} small>
          Reset
        </Btn>
      </div>
    </div>
  );
}

function Breathing({ config = {} }) {
  const exercises = [
    {
      id: "bubble",
      label: "🫧 Bubble",
      inhale: 3,
      hold: 0,
      exhale: 5,
      color: C.teal,
      desc: "Breathe in, blow slow bubbles out",
    },
    {
      id: "box",
      label: "📦 Box",
      inhale: 4,
      hold: 4,
      exhale: 4,
      color: C.lavender,
      desc: "In 4, hold 4, out 4",
    },
    {
      id: "dragon",
      label: "🐉 Dragon",
      inhale: 3,
      hold: 1,
      exhale: 6,
      color: C.coral,
      desc: "Deep breath in, breathe fire out!",
    },
    {
      id: "star",
      label: "⭐ Star",
      inhale: 5,
      hold: 0,
      exhale: 5,
      color: C.gold,
      desc: "Slow and steady, like a star shining",
    },
  ];
  const initEx =
    exercises.find((e) => e.id === config.exercise) || exercises[0];
  const [ex, setEx] = useState(initEx);
  const [phase, setPhase] = useState("ready");
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const tr = useRef(null);
  const pr = useRef("ready");
  const cr = useRef(0);
  function stop() {
    clearInterval(tr.current);
    setPhase("ready");
    setCount(0);
    pr.current = "ready";
  }
  function start() {
    stop();
    pr.current = "inhale";
    cr.current = ex.inhale;
    setPhase("inhale");
    setCount(ex.inhale);
    tr.current = setInterval(() => {
      cr.current -= 1;
      setCount(cr.current);
      if (cr.current <= 0) {
        const cur = pr.current;
        if (cur === "inhale") {
          if (ex.hold > 0) {
            pr.current = "hold";
            cr.current = ex.hold;
            setPhase("hold");
            setCount(ex.hold);
          } else {
            pr.current = "exhale";
            cr.current = ex.exhale;
            setPhase("exhale");
            setCount(ex.exhale);
          }
        } else if (cur === "hold") {
          pr.current = "exhale";
          cr.current = ex.exhale;
          setPhase("exhale");
          setCount(ex.exhale);
        } else {
          setCycles((c) => c + 1);
          pr.current = "inhale";
          cr.current = ex.inhale;
          setPhase("inhale");
          setCount(ex.inhale);
        }
      }
    }, 1000);
  }
  useEffect(() => {
    stop();
    setCycles(0);
  }, [ex]);
  const pl = {
    ready: "Ready",
    inhale: "Breathe IN 🌬️",
    hold: "Hold...",
    exhale: "Breathe OUT 💨",
  };
  const scale = phase === "inhale" ? 1.25 : phase === "exhale" ? 0.75 : 1;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 7,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {exercises.map((e) => (
          <button
            key={e.id}
            onClick={() => setEx(e)}
            style={{
              padding: "7px 14px",
              borderRadius: 18,
              border: "none",
              background: ex.id === e.id ? e.color : "#F0F0F0",
              color: ex.id === e.id ? "white" : C.navy,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {e.label}
          </button>
        ))}
      </div>
      <div
        style={{
          color: C.muted,
          fontSize: 12,
          textAlign: "center",
          maxWidth: 260,
        }}
      >
        {ex.desc}
      </div>
      <div
        style={{
          position: "relative",
          width: 160,
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: ex.color + "22",
            border: `3px solid ${ex.color}44`,
          }}
        />
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: phase === "ready" ? "#F0F0F0" : ex.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
            fontWeight: "bold",
            transform: `scale(${scale})`,
            transition: `transform ${phase === "inhale" ? ex.inhale : phase === "exhale" ? ex.exhale : 0.3}s ease`,
            boxShadow: phase !== "ready" ? `0 0 28px ${ex.color}60` : "none",
          }}
        >
          {phase !== "ready" ? (
            <>
              <div style={{ fontSize: 24, fontVariantNumeric: "tabular-nums" }}>
                {count}
              </div>
              <div style={{ fontSize: 10, opacity: 0.9 }}>{phase}</div>
            </>
          ) : (
            <div style={{ fontSize: 28, color: C.muted }}>😌</div>
          )}
        </div>
      </div>
      <div
        style={{
          fontWeight: "bold",
          fontSize: 15,
          color: C.navy,
          fontFamily: "Lora,serif",
          minHeight: 24,
        }}
      >
        {pl[phase]}
      </div>
      {cycles > 0 && (
        <div style={{ color: C.muted, fontSize: 12 }}>
          🔄 {cycles} cycle{cycles > 1 ? "s" : ""}
        </div>
      )}
      {phase === "ready" ? (
        <Btn onClick={start} color={ex.color}>
          Begin ▶
        </Btn>
      ) : (
        <Btn onClick={stop} color={C.muted}>
          Stop
        </Btn>
      )}
    </div>
  );
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
function Btn({ onClick, color, children, small, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "8px 20px" : "11px 28px",
        borderRadius: 22,
        border: "none",
        background: disabled ? "#E0E0E0" : color,
        color: disabled ? C.muted : "white",
        fontWeight: "bold",
        cursor: disabled ? "default" : "pointer",
        fontSize: small ? 13 : 15,
        transition: "opacity 0.2s",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
function ProgressBar({ pct, color }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        background: "#E8E8E8",
        borderRadius: 12,
        height: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 12,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

// ─── TOOL REGISTRY ────────────────────────────────────────────────────────────
const TOOL_COMPONENTS = {
  lettertracing: LetterTracing,
  shapetracing: ShapeTracing,
  dottodot: DotToDot,
  toothtimer: ToothTimer,
  handwash: HandWash,
  dressingsequence: DressingSequence,
  visualtimer: VisualTimer,
  firstthen: FirstThen,
  tokenboard: TokenBoard,
  breathing: Breathing,
};

// ─── VIEWS ────────────────────────────────────────────────────────────────────

// Config editor for a tool assignment
function ToolConfigEditor({ toolId, config, onChange }) {
  const tool = ALL_TOOLS.find((t) => t.id === toolId);
  if (!tool || tool.configFields.length === 0)
    return (
      <div style={{ color: C.muted, fontSize: 12, padding: "8px 0" }}>
        No configurable options for this tool.
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {tool.configFields.includes("letters") && (
        <div>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Letters to practice (e.g. ABCDE)
          </label>
          <input
            value={config.letters || ""}
            onChange={(e) =>
              onChange({ ...config, letters: e.target.value.toUpperCase() })
            }
            placeholder="Leave blank for all letters"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              fontSize: 14,
              fontFamily: "Georgia",
              outline: "none",
            }}
          />
        </div>
      )}
      {tool.configFields.includes("level") && (
        <div>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Difficulty level
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {["easy", "medium", "hard"].map((l) => (
              <button
                key={l}
                onClick={() => onChange({ ...config, level: l })}
                style={{
                  flex: 1,
                  padding: "7px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    (config.level || "easy") === l ? C.teal : "#E8F5F3",
                  color: (config.level || "easy") === l ? "white" : C.navy,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      {tool.configFields.includes("duration") && (
        <div>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Default duration (minutes)
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[1, 2, 3, 5, 10, 15, 20].map((m) => (
              <button
                key={m}
                onClick={() => onChange({ ...config, duration: m })}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    (config.duration || 5) === m ? C.lavender : "#F0ECF8",
                  color: (config.duration || 5) === m ? "white" : C.navy,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      )}
      {tool.configFields.includes("tokenGoal") && (
        <div>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Token goal
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => onChange({ ...config, tokenGoal: n })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  background:
                    (config.tokenGoal || 5) === n ? C.gold : "#F5F5F5",
                  color: C.navy,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      {tool.configFields.includes("reward") && (
        <div>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Reward
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              "🎮 Free play",
              "🍪 Snack",
              "⭐ Sticker",
              "🎨 Drawing",
              "📱 Tablet time",
            ].map((r) => (
              <button
                key={r}
                onClick={() => onChange({ ...config, reward: r })}
                style={{
                  padding: "5px 10px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    (config.reward || "🎮 Free play") === r
                      ? C.gold
                      : "#F5F5F5",
                  color: C.navy,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {tool.configFields.includes("exercise") && (
        <div>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Breathing exercise
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "bubble", l: "🫧 Bubble" },
              { id: "box", l: "📦 Box" },
              { id: "dragon", l: "🐉 Dragon" },
              { id: "star", l: "⭐ Star" },
            ].map((e) => (
              <button
                key={e.id}
                onClick={() => onChange({ ...config, exercise: e.id })}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    (config.exercise || "bubble") === e.id
                      ? C.coral
                      : "#F5F5F5",
                  color:
                    (config.exercise || "bubble") === e.id ? "white" : C.navy,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {e.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Client / Group detail — tool assignment + QR
function ClientDetail({ entity, isGroup, onUpdate, groups, onApplyGroup }) {
  const [view, setView] = useState("tools"); // tools | qr
  const [expandedTool, setExpandedTool] = useState(null);
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [applyGroupId, setApplyGroupId] = useState("");

  function toggleTool(toolId) {
    const exists = entity.tools.find((t) => t.id === toolId);
    if (exists)
      onUpdate({
        ...entity,
        tools: entity.tools.filter((t) => t.id !== toolId),
      });
    else
      onUpdate({
        ...entity,
        tools: [...entity.tools, { id: toolId, config: {} }],
      });
  }
  function updateConfig(toolId, config) {
    onUpdate({
      ...entity,
      tools: entity.tools.map((t) => (t.id === toolId ? { ...t, config } : t)),
    });
  }
  function moveTool(idx, dir) {
    const tools = [...entity.tools];
    const swap = idx + dir;
    if (swap < 0 || swap >= tools.length) return;
    [tools[idx], tools[swap]] = [tools[swap], tools[idx]];
    onUpdate({ ...entity, tools });
  }
  function applyGroup() {
    const g = groups.find((g) => g.id === applyGroupId);
    if (!g) return;
    const merged = [...entity.tools];
    g.tools.forEach((gt) => {
      if (!merged.find((t) => t.id === gt.id)) merged.push({ ...gt });
    });
    onUpdate({ ...entity, tools: merged });
    setApplyGroupId("");
  }

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 20,
          background: "#F0EDE8",
          borderRadius: 14,
          padding: 4,
        }}
      >
        {[
          ["tools", "🛠 Tools"],
          ["qr", isGroup ? "📤 Share" : "📱 QR Code"],
        ].map(([t, l]) => (
          <button
            key={t}
            onClick={() => setView(t)}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: 10,
              border: "none",
              background: view === t ? "white" : "transparent",
              color: view === t ? C.navy : C.muted,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
              boxShadow: view === t ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {view === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Apply group preset */}
          {!isGroup && groups.length > 0 && (
            <div
              style={{
                background: "#F8F5FF",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>
                Apply preset:
              </span>
              <select
                value={applyGroupId}
                onChange={(e) => setApplyGroupId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.lavender}40`,
                  fontSize: 13,
                  outline: "none",
                  background: "white",
                  minWidth: 120,
                }}
              >
                <option value="">Choose preset…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Btn
                onClick={applyGroup}
                color={C.lavender}
                small
                disabled={!applyGroupId}
              >
                Apply
              </Btn>
            </div>
          )}

          {entity.tools.length === 0 && (
            <div
              style={{
                color: C.muted,
                fontSize: 14,
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              No tools assigned yet.
            </div>
          )}

          {entity.tools.map((t, idx) => {
            const meta = ALL_TOOLS.find((a) => a.id === t.id);
            const dm = DOMAIN_META[meta?.domain];
            const isExpanded = expandedTool === t.id;
            return (
              <div
                key={t.id}
                style={{
                  background: "white",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedTool(isExpanded ? null : t.id)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: dm?.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {meta?.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 14, color: C.navy }}
                    >
                      {meta?.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                      {dm?.label} · Ages {meta?.ages}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTool(idx, -1);
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: "none",
                        background: "#F0F0F0",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTool(idx, 1);
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: "none",
                        background: "#F0F0F0",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTool(t.id);
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: "none",
                        background: "#FDF0EC",
                        color: C.coral,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <span style={{ color: C.muted, fontSize: 14, marginLeft: 2 }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
                {isExpanded && (
                  <div
                    style={{
                      borderTop: `1px solid ${C.border}`,
                      padding: "12px 14px",
                      background: "#FAFAF8",
                    }}
                  >
                    <ToolConfigEditor
                      toolId={t.id}
                      config={t.config}
                      onChange={(cfg) => updateConfig(t.id, cfg)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {showToolPicker ? (
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 14,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: 14,
                  color: C.navy,
                  marginBottom: 12,
                }}
              >
                Add a tool:
              </div>
              {Object.entries(DOMAIN_META).map(([domId, dm]) => (
                <div key={domId} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: dm.color,
                      marginBottom: 6,
                    }}
                  >
                    {dm.icon} {dm.label}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {ALL_TOOLS.filter((t) => t.domain === domId).map((t) => {
                      const assigned = entity.tools.find(
                        (et) => et.id === t.id,
                      );
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTool(t.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: `1.5px solid ${assigned ? dm.color : C.border}`,
                            background: assigned ? dm.bg : "white",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{t.icon}</span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: "bold",
                              color: assigned ? dm.color : C.navy,
                            }}
                          >
                            {t.label}
                          </span>
                          <span
                            style={{
                              fontSize: 16,
                              color: assigned ? dm.color : "#CCC",
                            }}
                          >
                            {assigned ? "✓" : "+"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Btn
                onClick={() => setShowToolPicker(false)}
                color={C.muted}
                small
              >
                Done
              </Btn>
            </div>
          ) : (
            <button
              onClick={() => setShowToolPicker(true)}
              style={{
                padding: "13px",
                borderRadius: 14,
                border: `2px dashed ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              + Add Tool
            </button>
          )}
        </div>
      )}

      {view === "qr" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            alignItems: "center",
          }}
        >
          {isGroup ? (
            <div
              style={{
                color: C.muted,
                fontSize: 14,
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              Group presets can be applied to clients. Open a client to generate
              their QR codes.
            </div>
          ) : entity.tools.length === 0 ? (
            <div
              style={{
                color: C.muted,
                fontSize: 14,
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              Assign at least one tool to generate QR codes.
            </div>
          ) : (
            <>
              <div
                style={{
                  background: C.tealBg,
                  borderRadius: 14,
                  padding: "11px 15px",
                  width: "100%",
                  fontSize: 12,
                  color: C.navyLight,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: C.teal }}>📱 How to use:</strong> Show
                the QR to the parent. They scan it with their camera and the
                tool opens instantly in their browser.
              </div>
              {entity.tools.map((t) => {
                const meta = ALL_TOOLS.find((a) => a.id === t.id);
                const dm = DOMAIN_META[meta?.domain];
                const url = getToolURL(t.id);
                return (
                  <div
                    key={t.id}
                    style={{
                      background: "white",
                      borderRadius: 20,
                      padding: 20,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: dm?.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        {meta?.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: C.navy,
                            fontFamily: "Lora,serif",
                          }}
                        >
                          {meta?.label}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {dm?.label} · Ages {meta?.ages}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <QRCode value={url} size={180} />
                    </div>
                    <div
                      style={{
                        background: "#F4F4F4",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 10,
                        color: C.muted,
                        wordBreak: "break-all",
                        fontFamily: "monospace",
                        textAlign: "left",
                        marginBottom: 10,
                      }}
                    >
                      {url}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(url);
                      }}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 18,
                        border: "none",
                        background: dm?.color || C.teal,
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Patient web view (from QR code)
function PatientView({ clientData }) {
  const [activeTool, setActiveTool] = useState(null);
  const tools = clientData.t || [];
  const name = clientData.n || "My Tools";
  const tool = activeTool ? tools.find((t) => t.id === activeTool) : null;
  const ToolComp = tool ? TOOL_COMPONENTS[tool.id] : null;
  const toolMeta = tool ? ALL_TOOLS.find((t2) => t2.id === tool.id) : null;
  const domMeta = toolMeta ? DOMAIN_META[toolMeta.domain] : null;

  return (
    <div
      style={{
        fontFamily: "'Nunito','Segoe UI',sans-serif",
        minHeight: "100vh",
        background: activeTool ? domMeta?.bg || C.cream : C.cream,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Lora:wght@600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes popIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}@keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,248,244,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {activeTool && (
          <button
            onClick={() => setActiveTool(null)}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: C.navy + "12",
              color: C.navy,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ←
          </button>
        )}
        <div>
          <div
            style={{
              fontFamily: "Lora,Georgia,serif",
              fontWeight: 700,
              fontSize: 18,
              color: C.navy,
            }}
          >
            {activeTool ? toolMeta?.label : name}
          </div>
          {!activeTool && (
            <div style={{ fontSize: 11, color: C.muted }}>
              Your activity tools
            </div>
          )}
        </div>
      </div>
      <div
        style={{ padding: "18px 18px 48px", maxWidth: 480, margin: "0 auto" }}
      >
        {!activeTool && (
          <>
            <div
              style={{
                background: "white",
                borderRadius: 18,
                padding: "14px 18px",
                marginBottom: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
                boxShadow: "0 2px 12px rgba(42,157,143,0.08)",
              }}
            >
              <span style={{ fontSize: 28 }}>👋</span>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: C.navy,
                    fontFamily: "Lora,serif",
                  }}
                >
                  Hi {name}!
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                  Your OT has set up {tools.length} tool
                  {tools.length !== 1 ? "s" : ""} for you.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tools.map((t, i) => {
                const meta = ALL_TOOLS.find((a) => a.id === t.id);
                const dm = DOMAIN_META[meta?.domain];
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 18px",
                      borderRadius: 18,
                      border: "none",
                      background: "white",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: `0 3px 14px ${dm?.color || C.teal}14`,
                      animation: `fadeUp 0.35s ease ${i * 0.07}s both`,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: dm?.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {meta?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          color: C.navy,
                          fontFamily: "Lora,serif",
                        }}
                      >
                        {meta?.label}
                      </div>
                      <div
                        style={{ fontSize: 11, color: C.muted, marginTop: 2 }}
                      >
                        {dm?.label}
                      </div>
                    </div>
                    <div
                      style={{ color: dm?.color, fontSize: 20, opacity: 0.5 }}
                    >
                      ›
                    </div>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                marginTop: 24,
                padding: "14px",
                borderRadius: 14,
                background: "white",
                border: `1.5px dashed ${C.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: C.muted }}>
                Want all OT tools?
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: 13,
                  color: C.teal,
                  marginTop: 3,
                }}
              >
                Download the full app →
              </div>
            </div>
          </>
        )}
        {activeTool && ToolComp && (
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 22,
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <ToolComp config={tool.config || {}} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DOMAINS config for home screen ──────────────────────────────────────────
const DOMAINS = [
  {
    id: "finemotor",
    label: "Fine Motor",
    icon: "✏️",
    color: C.teal,
    bg: C.tealBg,
    tools: ["lettertracing", "shapetracing", "dottodot"],
  },
  {
    id: "selfcare",
    label: "Self-Care",
    icon: "🪥",
    color: C.coral,
    bg: C.coralBg,
    tools: ["toothtimer", "handwash", "dressingsequence"],
  },
  {
    id: "attention",
    label: "Attention & Regulation",
    icon: "🧘",
    color: C.lavender,
    bg: C.lavBg,
    tools: ["visualtimer", "firstthen", "tokenboard", "breathing"],
  },
];

// ─── HAMBURGER DRAWER ─────────────────────────────────────────────────────────
function Drawer({ open, onClose, clients, setClients, groups, setGroups }) {
  const [panel, setPanel] = useState("menu"); // menu | clients | groups | clientdetail | groupdetail
  const [activeId, setActiveId] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  function updateClient(updated) {
    setClients(clients.map((c) => (c.id === updated.id ? updated : c)));
  }
  function updateGroup(updated) {
    setGroups(groups.map((g) => (g.id === updated.id ? updated : g)));
  }

  function addClient() {
    if (!newNickname.trim()) return;
    setClients([
      ...clients,
      { id: uid(), nickname: newNickname.trim(), tools: [] },
    ]);
    setNewNickname("");
    setShowNewClient(false);
  }
  function addGroup() {
    if (!newGroupName.trim()) return;
    setGroups([...groups, { id: uid(), name: newGroupName.trim(), tools: [] }]);
    setNewGroupName("");
    setShowNewGroup(false);
  }

  const activeEntity = isGroup
    ? groups.find((g) => g.id === activeId)
    : clients.find((c) => c.id === activeId);

  function goBack() {
    if (panel === "clientdetail" || panel === "groupdetail")
      setPanel(isGroup ? "groups" : "clients");
    else setPanel("menu");
  }

  const drawerTitle =
    {
      menu: "Menu",
      clients: "Clients",
      groups: "Group Presets",
      clientdetail: activeEntity?.nickname || "Client",
      groupdetail: activeEntity?.name || "Preset",
    }[panel] || "Menu";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.25s",
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          maxWidth: "90vw",
          background: C.cream,
          zIndex: 201,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {panel !== "menu" && (
            <button
              onClick={goBack}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: C.navy + "12",
                color: C.navy,
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
          )}
          <div
            style={{
              flex: 1,
              fontFamily: "Lora,Georgia,serif",
              fontWeight: 700,
              fontSize: 17,
              color: C.navy,
            }}
          >
            {drawerTitle}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: C.navy + "12",
              color: C.navy,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 32px" }}>
          {panel === "menu" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["clients", "👤", "Clients", "Manage client programs"],
                ["groups", "📋", "Group Presets", "Saved tool configurations"],
              ].map(([p, icon, label, sub]) => (
                <button
                  key={p}
                  onClick={() => setPanel(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ fontSize: 24 }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: C.navy,
                        fontFamily: "Lora,serif",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                      {sub}
                    </div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 16 }}>›</div>
                </button>
              ))}
            </div>
          )}

          {panel === "clients" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {clients.length === 0 && (
                <div
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No clients yet.
                </div>
              )}
              {clients.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.tealBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    👤
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 13, color: C.navy }}
                    >
                      {c.nickname}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {c.tools.length} tool{c.tools.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveId(c.id);
                      setIsGroup(false);
                      setPanel("clientdetail");
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: C.tealBg,
                      color: C.teal,
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Open
                  </button>
                  <button
                    onClick={() =>
                      setClients(clients.filter((x) => x.id !== c.id))
                    }
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: "none",
                      background: "#FDF0EC",
                      color: C.coral,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {showNewClient ? (
                <div
                  style={{ background: "white", borderRadius: 14, padding: 14 }}
                >
                  <div
                    style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}
                  >
                    Nickname or code (no real names)
                  </div>
                  <input
                    autoFocus
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addClient()}
                    placeholder="e.g. Blue Star, Client 7…"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 9,
                      border: `1.5px solid ${C.teal}`,
                      fontSize: 13,
                      outline: "none",
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", gap: 7 }}>
                    <Btn onClick={addClient} color={C.teal} small>
                      Add
                    </Btn>
                    <Btn
                      onClick={() => {
                        setShowNewClient(false);
                        setNewNickname("");
                      }}
                      color={C.muted}
                      small
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewClient(true)}
                  style={{
                    padding: "11px",
                    borderRadius: 12,
                    border: `2px dashed ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  + Add Client
                </button>
              )}
            </div>
          )}

          {panel === "groups" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>
                Save tool sets to quickly apply to clients.
              </div>
              {groups.length === 0 && (
                <div
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No presets yet.
                </div>
              )}
              {groups.map((g) => (
                <div
                  key={g.id}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.lavBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    📋
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 13, color: C.navy }}
                    >
                      {g.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {g.tools.length} tool{g.tools.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveId(g.id);
                      setIsGroup(true);
                      setPanel("groupdetail");
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: C.lavBg,
                      color: C.lavender,
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setGroups(groups.filter((x) => x.id !== g.id))
                    }
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: "none",
                      background: "#FDF0EC",
                      color: C.coral,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {showNewGroup ? (
                <div
                  style={{ background: "white", borderRadius: 14, padding: 14 }}
                >
                  <input
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addGroup()}
                    placeholder="e.g. Sensory Kids AM…"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 9,
                      border: `1.5px solid ${C.lavender}`,
                      fontSize: 13,
                      outline: "none",
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", gap: 7 }}>
                    <Btn onClick={addGroup} color={C.lavender} small>
                      Add
                    </Btn>
                    <Btn
                      onClick={() => {
                        setShowNewGroup(false);
                        setNewGroupName("");
                      }}
                      color={C.muted}
                      small
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewGroup(true)}
                  style={{
                    padding: "11px",
                    borderRadius: 12,
                    border: `2px dashed ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  + New Preset
                </button>
              )}
            </div>
          )}

          {(panel === "clientdetail" || panel === "groupdetail") &&
            activeEntity && (
              <ClientDetail
                entity={activeEntity}
                isGroup={isGroup}
                onUpdate={isGroup ? updateGroup : updateClient}
                groups={groups}
              />
            )}
        </div>
      </div>
    </>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const clientParam = params.get("client");
  const toolParam = params.get("tool");
  const clientData = clientParam ? decodeClientConfig(clientParam) : null;

  const [clients, setClients] = useLocalStorage("ot_clients", []);
  const [groups, setGroups] = useLocalStorage("ot_groups", []);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Home nav state — jump straight to tool if ?tool= param present
  const initTool = toolParam && TOOL_COMPONENTS[toolParam] ? toolParam : null;
  const initDomain = initTool
    ? ALL_TOOLS.find((t) => t.id === initTool)?.domain || null
    : null;
  const [activeDomain, setActiveDomain] = useState(initDomain);
  const [activeTool, setActiveTool] = useState(initTool);

  function back() {
    if (activeTool) setActiveTool(null);
    else setActiveDomain(null);
  }

  const domain = DOMAINS.find((d) => d.id === activeDomain);
  const toolMeta = activeTool
    ? ALL_TOOLS.find((t) => t.id === activeTool)
    : null;
  const ToolComp = toolMeta ? TOOL_COMPONENTS[activeTool] : null;
  const domMeta = toolMeta ? DOMAIN_META[toolMeta.domain] : null;

  if (clientData) return <PatientView clientData={clientData} />;

  const bgColor = activeTool
    ? domMeta?.bg || C.cream
    : activeDomain
      ? domain.bg
      : C.cream;

  return (
    <div
      style={{
        fontFamily: "'Nunito','Segoe UI',sans-serif",
        minHeight: "100vh",
        background: bgColor,
        transition: "background 0.35s",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Lora:wght@500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes popIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        input:focus,select:focus{border-color:${C.teal}!important;}
        button:hover{opacity:0.88;}
      `}</style>

      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,248,244,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {activeDomain || activeTool ? (
          <button
            onClick={back}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: C.navy + "12",
              color: C.navy,
              cursor: "pointer",
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ←
          </button>
        ) : null}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Lora,Georgia,serif",
              fontWeight: 700,
              fontSize: 19,
              color: C.navy,
              letterSpacing: "-0.3px",
            }}
          >
            {activeTool
              ? toolMeta.label
              : activeDomain
                ? domain.label
                : "OT Toolkit"}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
            {activeTool
              ? `Ages ${toolMeta.ages}`
              : activeDomain
                ? `${domain.tools.length} tools`
                : "Paediatric Session Tools"}
          </div>
        </div>
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: C.navy + "12",
            color: C.navy,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 2,
                background: C.navy,
                borderRadius: 2,
              }}
            />
          ))}
        </button>
      </div>

      {/* Main content */}
      <div
        style={{ padding: "20px 20px 48px", maxWidth: 480, margin: "0 auto" }}
      >
        {/* Home — domain cards */}
        {!activeDomain && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontFamily: "Lora,Georgia,serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: C.navy,
                  lineHeight: 1.2,
                }}
              >
                What are we working on today?
              </div>
              <div style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>
                Choose a goal area to get started
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {DOMAINS.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDomain(d.id)}
                  style={{
                    width: "100%",
                    padding: "20px 22px",
                    borderRadius: 20,
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    boxShadow: `0 4px 20px ${d.color}18`,
                    animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: d.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    {d.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 17,
                        color: C.navy,
                        fontFamily: "Lora,Georgia,serif",
                      }}
                    >
                      {d.label}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                      {d.tools.length} tools
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: d.color, opacity: 0.6 }}>
                    ›
                  </div>
                </button>
              ))}
            </div>
            <div
              style={{
                marginTop: 28,
                padding: "14px 18px",
                borderRadius: 16,
                background: "white",
                border: `1.5px dashed ${C.gold}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20 }}>💡</div>
              <div
                style={{
                  fontWeight: 700,
                  color: C.navy,
                  fontSize: 13,
                  marginTop: 4,
                  fontFamily: "Lora,serif",
                }}
              >
                Beta v0.2
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                10 tools · 3 domains · Client programs via ☰
              </div>
            </div>
          </div>
        )}

        {/* Domain — tool grid */}
        {activeDomain && !activeTool && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
              Tap a tool to open it
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {domain.tools.map((tid, i) => {
                const t = ALL_TOOLS.find((a) => a.id === tid);
                return (
                  <button
                    key={tid}
                    onClick={() => setActiveTool(tid)}
                    style={{
                      padding: "20px 14px",
                      borderRadius: 20,
                      border: "none",
                      background: "white",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: `0 4px 16px ${domain.color}18`,
                      animation: `fadeUp 0.35s ease ${i * 0.07}s both`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 36 }}>{t.icon}</div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: C.navy,
                        fontFamily: "Lora,Georgia,serif",
                        lineHeight: 1.2,
                      }}
                    >
                      {t.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      Ages {t.ages}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tool view */}
        {activeTool && ToolComp && (
          <div
            style={{
              animation: "fadeUp 0.3s ease",
              background: "white",
              borderRadius: 24,
              padding: 22,
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <ToolComp config={{}} />
          </div>
        )}
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        clients={clients}
        setClients={setClients}
        groups={groups}
        setGroups={setGroups}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: "#0A0E1A",
  surface: "#111827",
  card: "#141E30",
  cardBorder: "#1F2D47",
  crimson: "#E63946",
  crimsonDeep: "#9B1D24",
  pulse: "#FF4D6D",
  teal: "#00C2CB",
  tealDim: "#007A80",
  gold: "#F4A261",
  white: "#F0F4FF",
  muted: "#64748B",
  success: "#22C55E",
  warning: "#FBBF24",
  danger: "#EF4444",
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  purple: "#A855F7",
};

// ─── Static Data ─────────────────────────────────────────────────────────────
const HOSPITALS = [
  { id: "1", name: "Apollo Hospital", area: "Greams Road", beds: 23, eta: "4 min", status: "available", distance: "1.2 km", phone: "044-2829-3333", lat: 13.0580, lng: 80.2510, specialties: ["Cardiology", "Neurology", "Trauma"] },
  { id: "2", name: "Fortis Malar", area: "Adyar", beds: 8, eta: "7 min", status: "limited", distance: "2.8 km", phone: "044-4289-2222", lat: 13.0012, lng: 80.2565, specialties: ["Oncology", "Orthopedics"] },
  { id: "3", name: "MIOT International", area: "Manapakkam", beds: 0, eta: "11 min", status: "full", distance: "4.1 km", phone: "044-2249-2288", lat: 13.0139, lng: 80.1725, specialties: ["Orthopedics", "Spine"] },
  { id: "4", name: "Kauvery Hospital", area: "Alwarpet", beds: 15, eta: "6 min", status: "available", distance: "3.0 km", phone: "044-4000-6000", lat: 13.0358, lng: 80.2520, specialties: ["Cardiology", "Emergency"] },
  { id: "5", name: "Billroth Hospital", area: "Shenoy Nagar", beds: 5, eta: "8 min", status: "limited", distance: "3.5 km", phone: "044-2644-3000", lat: 13.0825, lng: 80.2151, specialties: ["General", "Pediatrics"] },
];

const BLOOD_TYPES = [
  { type: "A+", level: "HIGH", pct: 85, units: 42 },
  { type: "B+", level: "MEDIUM", pct: 55, units: 28 },
  { type: "O+", level: "HIGH", pct: 90, units: 55 },
  { type: "AB-", level: "CRITICAL", pct: 20, units: 8 },
  { type: "A-", level: "MEDIUM", pct: 48, units: 19 },
  { type: "B-", level: "CRITICAL", pct: 15, units: 6 },
  { type: "O-", level: "LOW", pct: 30, units: 12 },
  { type: "AB+", level: "HIGH", pct: 72, units: 35 },
];

const AMBULANCES = [
  { id: "AMB-01", driver: "Rajan K.", eta: "4 min", status: "enroute", type: "ALS", lat: 13.0620, lng: 80.2480 },
  { id: "AMB-04", driver: "Selvam R.", eta: "6 min", status: "standby", type: "BLS", lat: 13.0450, lng: 80.2600 },
  { id: "AMB-07", driver: "Priya M.", eta: "9 min", status: "standby", type: "ALS", lat: 13.0700, lng: 80.2350 },
  { id: "AMB-12", driver: "Kumar S.", eta: "12 min", status: "standby", type: "BLS", lat: 13.0280, lng: 80.2700 },
];

const EMERGENCY_TIPS = [
  { icon: "🫀", title: "Heart Attack", steps: ["Call 108 immediately", "Have patient sit or lie comfortably", "Loosen tight clothing", "Give aspirin if not allergic", "Begin CPR if unconscious"] },
  { icon: "🧠", title: "Stroke (FAST)", steps: ["F – Face drooping?", "A – Arm weakness?", "S – Speech difficulty?", "T – Time to call 108!", "Note the time symptoms started"] },
  { icon: "🩸", title: "Severe Bleeding", steps: ["Apply firm pressure with cloth", "Elevate injured limb", "Don't remove the cloth", "Add more cloth if soaked", "Keep patient warm and still"] },
  { icon: "🫁", title: "Choking", steps: ["Ask if they can cough/speak", "Encourage forceful coughing", "Give 5 back blows", "Perform abdominal thrusts", "Call 108 if not cleared"] },
];

// ─── Pulse Hook ───────────────────────────────────────────────────────────────
function usePulse(speed = 1000) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    let direction = 1;
    let current = 1;
    const interval = setInterval(() => {
      current += direction * 0.008;
      if (current >= 1.15) direction = -1;
      if (current <= 1) direction = 1;
      setScale(current);
    }, 16);
    return () => clearInterval(interval);
  }, [speed]);
  return scale;
}

// ─── Interactive Map Component ────────────────────────────────────────────────
function LiveMap({ selectedHospital, setSelectedHospital }) {
  const canvasRef = useRef(null);
  const [pingAnim, setPingAnim] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Chennai center
  const center = { lat: 13.0500, lng: 80.2450 };
  const mapW = 700, mapH = 320;

  const latToY = (lat) => mapH / 2 - (lat - center.lat) * 2800;
  const lngToX = (lng) => mapW / 2 + (lng - center.lng) * 2800;

  useEffect(() => {
    const interval = setInterval(() => {
      setPingAnim(p => (p + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, mapW, mapH);

    // Background
    ctx.fillStyle = "#0D1520";
    ctx.fillRect(0, 0, mapW, mapH);

    // Grid lines
    ctx.strokeStyle = "#1a2640";
    ctx.lineWidth = 1;
    for (let x = 0; x < mapW; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapH); ctx.stroke();
    }
    for (let y = 0; y < mapH; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapW, y); ctx.stroke();
    }

    // Simulated roads
    const roads = [
      [[0, 140], [700, 160]], [[0, 80], [700, 200]], [[0, 220], [700, 250]],
      [[200, 0], [210, 320]], [[400, 0], [420, 320]], [[100, 0], [150, 320]],
      [[550, 0], [560, 320]],
    ];
    roads.forEach(([from, to]) => {
      ctx.strokeStyle = "#1E3050";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();
    });

    // Main roads
    ctx.strokeStyle = "#263d5c";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 160); ctx.lineTo(700, 160); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(350, 0); ctx.lineTo(350, 320); ctx.stroke();

    // User location ping
    const ux = mapW / 2, uy = mapH / 2;
    const pingR = (pingAnim / 60) * 35;
    const alpha = 1 - pingAnim / 60;
    ctx.strokeStyle = `rgba(230, 57, 70, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ux, uy, pingR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = C.crimson;
    ctx.shadowColor = C.crimson;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ux, uy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU", ux, uy + 3);

    // Ambulances
    AMBULANCES.forEach(amb => {
      const ax = lngToX(amb.lng), ay = latToY(amb.lat);
      ctx.fillStyle = C.pulse;
      ctx.shadowColor = C.pulse;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ax, ay, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🚑", ax, ay + 3);

      ctx.fillStyle = C.textSecondary;
      ctx.font = "9px monospace";
      ctx.fillText(amb.id, ax, ay - 10);
    });

    // Hospitals
    HOSPITALS.forEach(h => {
      const hx = lngToX(h.lng), hy = latToY(h.lat);
      const isSelected = selectedHospital?.id === h.id;
      const color = h.status === "available" ? C.success : h.status === "limited" ? C.warning : C.danger;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected ? 20 : 8;
      ctx.beginPath();
      ctx.roundRect(hx - 10, hy - 10, 20, 20, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏥", hx, hy + 4);

      if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(hx - 14, hy - 14, 28, 28, 6);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.roundRect(hx - 50, hy - 46, 100, 28, 6);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(h.name.slice(0, 14), hx, hy - 36);
        ctx.fillStyle = C.teal;
        ctx.font = "8px monospace";
        ctx.fillText(`${h.beds} beds · ${h.eta}`, hx, hy - 24);
      }
    });

    // Legend
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.roundRect(10, mapH - 60, 180, 50, 8);
    ctx.fill();
    [[C.success, "Available"], [C.warning, "Limited"], [C.danger, "Full"]].forEach(([col, label], i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(24, mapH - 46 + i * 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.textSecondary;
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(label, 33, mapH - 43 + i * 14);
    });

  }, [pingAnim, selectedHospital]);

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = mapW / rect.width;
    const scaleY = mapH / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const h of HOSPITALS) {
      const hx = lngToX(h.lng), hy = latToY(h.lat);
      if (Math.abs(mx - hx) < 15 && Math.abs(my - hy) < 15) {
        setSelectedHospital(h.id === selectedHospital?.id ? null : h);
        return;
      }
    }
    setSelectedHospital(null);
  }, [selectedHospital, setSelectedHospital]);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.cardBorder}` }}>
      <canvas
        ref={canvasRef}
        width={mapW}
        height={mapH}
        style={{ width: "100%", display: "block", cursor: "crosshair" }}
        onClick={handleClick}
      />
      <div style={{
        position: "absolute", top: 10, right: 10,
        background: "rgba(0,0,0,0.7)", borderRadius: 8,
        padding: "4px 10px", border: `1px solid ${C.teal}40`,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
        <span style={{ color: C.teal, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>LIVE · Chennai 10km</span>
      </div>
      <div style={{ position: "absolute", bottom: 10, right: 10, color: C.muted, fontSize: 9, fontFamily: "monospace" }}>
        Click 🏥 to select
      </div>
    </div>
  );
}

// ─── AI Chat Assistant ────────────────────────────────────────────────────────
const QUICK_PROMPT_CATEGORIES = [
  { label: "🫀 Heart Attack", prompt: "What are the signs of a heart attack and what should I do right now?" },
  { label: "🧠 Stroke", prompt: "How do I identify a stroke? What are the FAST signs?" },
  { label: "🏥 Nearest Hospital", prompt: "Which hospital nearby has available beds right now?" },
  { label: "🩸 Blood Bank", prompt: "What blood types are critically low right now?" },
  { label: "🚑 Ambulance ETA", prompt: "How long will the nearest ambulance take to reach me?" },
  { label: "🫁 Choking", prompt: "Someone is choking! What do I do immediately?" },
  { label: "🩹 Severe Bleeding", prompt: "There is severe bleeding. What do I do right now?" },
  { label: "💊 Overdose", prompt: "What do I do if someone has taken an overdose of medication?" },
];

function AIChatAssistant({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm EMERGIX AI 🚨\n\nI'm your real-time emergency health assistant for Chennai. I can help with:\n\n• First aid step-by-step guidance\n• Nearest hospital & bed availability\n• Symptom triage & assessment\n• Blood bank availability\n• Ambulance dispatch info\n\nTap a quick action below or type your emergency now.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
    setLoading(true);

    const systemPrompt = `You are EMERGIX AI, a calm and expert emergency health assistant embedded in a real-time medical emergency app for Chennai, India.

PERSONALITY: Calm under pressure, clear, empathetic, direct. Never panic. Always prioritize safety.

YOUR CAPABILITIES:
- Step-by-step first aid instructions for any emergency
- Triage guidance and symptom assessment
- Information about nearby hospitals: Apollo (Greams Rd, 23 beds, 4 min ETA), Kauvery (Alwarpet, 15 beds, 6 min ETA), Fortis Malar (Adyar, 8 beds LIMITED, 7 min), MIOT (Manapakkam, FULL)
- Blood bank status: O+ HIGH (55 units), A+ HIGH (42 units), AB- CRITICAL (8 units), B- CRITICAL (6 units)
- Emergency numbers: 108 (Ambulance), 104 (Health Helpline), 112 (Police/Fire/Emergency)
- Ambulances available: AMB-01 (4 min, ALS), AMB-04 (6 min, BLS), AMB-07 (9 min, ALS)

RESPONSE RULES:
- For life-threatening emergencies: ALWAYS start with "🚨 CALL 108 NOW" in bold on its own line
- Use numbered steps for procedures
- Keep responses focused and scannable — no walls of text
- Use relevant emojis to make steps visually distinct
- If unsure, always err on the side of caution and recommend calling 108
- Never diagnose — guide to act

Context: User is in Chennai, Tamil Nadu, India. This is a live emergency dashboard.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...messages, { role: "user", content: userMsg }]
            .filter(m => m.role === "user" || m.role === "assistant")
            .map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. For emergencies, call 108 immediately.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection issue.\n\nFor emergencies, call 108 immediately.", timestamp: new Date() }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const formatTime = (date) => date ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared. How can I help you with your emergency?",
      timestamp: new Date()
    }]);
    setShowSuggestions(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: C.card, borderRadius: "24px 24px 0 0",
        border: `1px solid ${C.teal}40`, borderBottom: "none",
        display: "flex", flexDirection: "column",
        height: "90vh", maxHeight: 720,
        boxShadow: `0 -20px 60px rgba(0,194,203,0.15)`
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${C.cardBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `linear-gradient(135deg, ${C.teal}15, ${C.purple}10)`,
          borderRadius: "24px 24px 0 0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.teal}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: `0 0 16px ${C.teal}50`
            }}>🤖</div>
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 15, fontFamily: "monospace" }}>EMERGIX AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
                <span style={{ color: C.success, fontSize: 10, fontFamily: "monospace" }}>Online · Emergency AI</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={clearChat} style={{
              background: `${C.muted}20`, border: `1px solid ${C.cardBorder}`,
              borderRadius: 8, color: C.muted, padding: "6px 10px",
              cursor: "pointer", fontSize: 11, fontFamily: "monospace"
            }} title="Clear chat">🗑</button>
            <button onClick={onClose} style={{
              background: C.surface, border: `1px solid ${C.cardBorder}`,
              borderRadius: 8, color: C.muted, padding: "6px 12px",
              cursor: "pointer", fontSize: 11, fontFamily: "monospace"
            }}>✕</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: m.role === "user" ? "flex-end" : "flex-start"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: m.role === "user" ? 0 : 4, paddingRight: m.role === "user" ? 4 : 0 }}>
                {m.role === "assistant" && <span style={{ fontSize: 12 }}>🤖</span>}
                <div style={{ fontSize: 9, color: m.role === "user" ? C.muted : C.teal, fontFamily: "monospace" }}>
                  {m.role === "assistant" ? "EMERGIX AI" : "YOU"} · {formatTime(m.timestamp)}
                </div>
              </div>
              <div style={{
                maxWidth: "88%", padding: "11px 15px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background: m.role === "user"
                  ? `linear-gradient(135deg, ${C.crimson}, ${C.crimsonDeep})`
                  : C.surface,
                border: m.role === "user" ? "none" : `1px solid ${C.cardBorder}`,
                color: C.textPrimary, fontSize: 13, lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                boxShadow: m.role === "user" ? `0 4px 14px ${C.crimson}40` : `0 2px 8px rgba(0,0,0,0.2)`
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px" }}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <div style={{ display: "flex", gap: 5, background: C.surface, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "8px 14px" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.teal,
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Action Grid — shown only before first user message */}
        {showSuggestions && (
          <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.cardBorder}`, flexShrink: 0 }}>
            <div style={{ color: C.muted, fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginBottom: 8 }}>QUICK ACTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {QUICK_PROMPT_CATEGORIES.map(({ label, prompt }) => (
                <button key={label} onClick={() => sendMessage(prompt)} style={{
                  background: `${C.teal}12`, border: `1px solid ${C.teal}30`,
                  borderRadius: 10, color: C.textSecondary, padding: "8px 10px",
                  fontSize: 11, cursor: "pointer", textAlign: "left",
                  fontFamily: "monospace", lineHeight: 1.3,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.target.style.background = `${C.teal}25`; e.target.style.color = C.white; }}
                onMouseLeave={e => { e.target.style.background = `${C.teal}12`; e.target.style.color = C.textSecondary; }}
                >{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div style={{
          padding: "10px 14px 20px", borderTop: showSuggestions ? "none" : `1px solid ${C.cardBorder}`,
          display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0,
        }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Describe the emergency..."
              disabled={loading}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${input ? C.teal + "60" : C.cardBorder}`,
                borderRadius: 14, padding: "11px 42px 11px 14px", color: C.textPrimary,
                fontSize: 13, outline: "none", fontFamily: "monospace",
                transition: "border-color 0.2s", boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
            {input && (
              <button onClick={() => setInput("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", color: C.muted,
                cursor: "pointer", fontSize: 14, padding: 2
              }}>✕</button>
            )}
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim()
                ? C.cardBorder
                : `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
              border: "none", borderRadius: 14, padding: "11px 16px",
              color: loading || !input.trim() ? C.muted : "#fff",
              fontWeight: 900, cursor: loading || !input.trim() ? "default" : "pointer",
              fontSize: 16, boxShadow: loading || !input.trim() ? "none" : `0 4px 14px ${C.teal}50`,
              transition: "all 0.2s", flexShrink: 0,
            }}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ─── SOS Button ──────────────────────────────────────────────────────────────
function SOSButton({ onPress }) {
  const scale = usePulse(900);
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, position: "relative" }}>
      {[180, 155, 130].map((size, i) => (
        <div key={i} style={{
          position: "absolute", width: size, height: size, borderRadius: "50%",
          background: C.crimson,
          transform: `scale(${scale})`,
          opacity: [0.12, 0.2, 0.3][i],
          transition: "transform 0.05s linear",
        }} />
      ))}
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => { setPressed(false); onPress(); }}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => { setPressed(false); onPress(); }}
        style={{
          width: 110, height: 110, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${C.pulse}, ${C.crimson})`,
          border: `3px solid ${C.pulse}80`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: `0 0 40px ${C.crimson}80`,
          transform: pressed ? "scale(0.94)" : "scale(1)",
          transition: "transform 0.1s",
          position: "relative", zIndex: 2,
        }}
      >
        <span style={{ color: "#fff", fontSize: 30, fontWeight: 900, fontFamily: "monospace", letterSpacing: 3 }}>SOS</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: 700, fontFamily: "monospace", letterSpacing: 2, marginTop: 2 }}>TAP TO CALL</span>
      </button>
    </div>
  );
}

// ─── SOS Modal ────────────────────────────────────────────────────────────────
function SOSModal({ visible, onClose }) {
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    if (!visible) { setCountdown(10); return; }
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [visible]);
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 999
    }}>
      <div style={{
        background: C.card, borderRadius: 24, border: `1px solid ${C.crimson}50`,
        padding: 28, width: "100%", maxWidth: 360, textAlign: "center",
        boxShadow: `0 0 60px ${C.crimson}30`
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `${C.crimson}25`, border: `1px solid ${C.crimson}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: 30
        }}>🚨</div>
        <div style={{ color: C.crimson, fontSize: 22, fontWeight: 900, fontFamily: "monospace", letterSpacing: 1, marginBottom: 8 }}>SOS ACTIVATED</div>
        <div style={{ color: C.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
          Nearest ambulance alerted.<br />
          GPS location shared.<br />
          Family notified via SMS.
        </div>
        <div style={{
          background: C.bg, borderRadius: 12, padding: "14px 28px",
          border: `1px solid ${C.teal}40`, marginBottom: 20
        }}>
          <div style={{ color: C.muted, fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>AMB-01 · ETA</div>
          <div style={{ color: C.teal, fontSize: 36, fontWeight: 900, fontFamily: "monospace", letterSpacing: 2 }}>4 MIN</div>
        </div>
        <div style={{ color: C.muted, fontSize: 11, fontFamily: "monospace", marginBottom: 14 }}>
          Auto-cancels in <span style={{ color: C.warning }}>{countdown}s</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, background: C.surface, border: `1px solid ${C.cardBorder}`,
            borderRadius: 10, padding: "12px", color: C.muted,
            fontSize: 12, fontWeight: 800, fontFamily: "monospace", cursor: "pointer", letterSpacing: 1
          }}>CANCEL SOS</button>
          <button style={{
            flex: 1, background: C.crimson, border: "none",
            borderRadius: 10, padding: "12px", color: "#fff",
            fontSize: 12, fontWeight: 800, fontFamily: "monospace", cursor: "pointer", letterSpacing: 1,
            boxShadow: `0 4px 12px ${C.crimson}50`
          }}>📞 CALL 108</button>
        </div>
      </div>
    </div>
  );
}

// ─── Hospital Card ────────────────────────────────────────────────────────────
function HospitalCard({ item, isSelected, onSelect }) {
  const statusColor = item.status === "available" ? C.success : item.status === "limited" ? C.warning : C.danger;
  const statusLabel = item.status === "available" ? "AVAILABLE" : item.status === "limited" ? "LIMITED" : "FULL";
  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        display: "flex", background: C.card, borderRadius: 14,
        border: `1px solid ${isSelected ? statusColor + "80" : C.cardBorder}`,
        marginBottom: 12, overflow: "hidden", cursor: "pointer",
        boxShadow: isSelected ? `0 0 20px ${statusColor}20` : "none",
        transition: "all 0.2s"
      }}
    >
      <div style={{ width: 4, background: statusColor, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, fontFamily: "monospace" }}>{item.name}</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>📍 {item.area} · {item.distance}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {item.specialties.map(s => (
                <span key={s} style={{
                  background: `${C.teal}15`, border: `1px solid ${C.teal}30`,
                  borderRadius: 4, color: C.teal, fontSize: 9, padding: "1px 6px",
                  fontFamily: "monospace"
                }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{
            background: `${statusColor}20`, border: `1px solid ${statusColor}60`,
            borderRadius: 8, padding: "3px 8px"
          }}>
            <span style={{ color: statusColor, fontSize: 9, fontWeight: 800, fontFamily: "monospace", letterSpacing: 1 }}>{statusLabel}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.white, fontSize: 20, fontWeight: 900, fontFamily: "monospace" }}>{item.beds}</div>
            <div style={{ color: C.muted, fontSize: 9 }}>Beds Free</div>
          </div>
          <div style={{ width: 1, height: 30, background: C.cardBorder }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.teal, fontSize: 20, fontWeight: 900, fontFamily: "monospace" }}>{item.eta}</div>
            <div style={{ color: C.muted, fontSize: 9 }}>Ambulance ETA</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <a href={`tel:${item.phone}`} style={{
              background: `${C.teal}20`, border: `1px solid ${C.teal}50`,
              borderRadius: 8, padding: "6px 10px", textDecoration: "none",
              color: C.teal, fontSize: 11, fontWeight: 800, fontFamily: "monospace"
            }}>📞</a>
            <button style={{
              background: `${C.crimson}20`, border: `1px solid ${C.crimson}60`,
              borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              color: C.crimson, fontSize: 11, fontWeight: 800, fontFamily: "monospace"
            }}>🚑 BOOK</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Blood Bar ────────────────────────────────────────────────────────────────
function BloodBar({ type, level, pct, units }) {
  const color = pct > 60 ? C.success : pct > 30 ? C.warning : C.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 10 }}>
      <div style={{ color: C.white, fontSize: 13, fontWeight: 800, fontFamily: "monospace", width: 30 }}>{type}</div>
      <div style={{ flex: 1, height: 8, background: C.surface, borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: 8, width: `${pct}%`, background: color, borderRadius: 4,
          boxShadow: `0 0 6px ${color}60`,
          transition: "width 1s ease"
        }} />
      </div>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: "monospace", width: 50, textAlign: "right" }}>{units} units</div>
      <div style={{ color, fontSize: 9, fontWeight: 700, fontFamily: "monospace", width: 52, letterSpacing: 0.5 }}>{level}</div>
    </div>
  );
}

// ─── First Aid Tips ───────────────────────────────────────────────────────────
function FirstAidSection() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>🩺</span>
        <span style={{ color: C.white, fontSize: 16, fontWeight: 800, fontFamily: "monospace" }}>First Aid Guide</span>
      </div>
      {EMERGENCY_TIPS.map(tip => (
        <div key={tip.title} style={{
          background: C.card, borderRadius: 12, border: `1px solid ${C.cardBorder}`,
          marginBottom: 8, overflow: "hidden"
        }}>
          <button
            onClick={() => setOpen(open === tip.title ? null : tip.title)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span style={{ fontSize: 22 }}>{tip.icon}</span>
            <span style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700, fontFamily: "monospace", flex: 1 }}>{tip.title}</span>
            <span style={{ color: C.muted, fontSize: 12 }}>{open === tip.title ? "▲" : "▼"}</span>
          </button>
          {open === tip.title && (
            <div style={{ padding: "0 14px 14px 14px" }}>
              {tip.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: `${C.crimson}25`, border: `1px solid ${C.crimson}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span style={{ color: C.crimson, fontSize: 10, fontWeight: 900, fontFamily: "monospace" }}>{i + 1}</span>
                  </div>
                  <span style={{ color: C.textSecondary, fontSize: 13, paddingTop: 3, lineHeight: 1.4 }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onSOS, selectedHospital, setSelectedHospital }) {
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.crimson, fontWeight: 700, fontFamily: "monospace" }}>HEALTH EMERGENCY</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: C.white, letterSpacing: 2, fontFamily: "monospace", marginTop: 2 }}>EMERGIX</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
            <span style={{ color: C.textSecondary, fontSize: 12 }}>Chennai, Tamil Nadu · Live</span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: `${C.crimson}20`, border: `1px solid ${C.crimson}50`,
          borderRadius: 20, padding: "4px 10px", marginTop: 6
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.crimson, boxShadow: `0 0 6px ${C.crimson}` }} />
          <span style={{ color: C.crimson, fontSize: 10, fontWeight: 800, fontFamily: "monospace", letterSpacing: 1 }}>LIVE</span>
        </div>
      </div>

      <SOSButton onPress={onSOS} />

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { value: "4", label: "Ambulances", color: C.teal },
          { value: "50+", label: "Hospitals", color: C.gold },
          { value: "3 min", label: "Avg Response", color: C.pulse },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: C.card, borderRadius: 12,
            border: `1px solid ${s.color}30`, padding: "12px 0", textAlign: "center"
          }}>
            <div style={{ color: s.color, fontSize: 20, fontWeight: 900, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🗺️</span>
          <span style={{ color: C.white, fontSize: 16, fontWeight: 800, fontFamily: "monospace" }}>Live Map</span>
          <span style={{ color: C.muted, fontSize: 11, marginLeft: 4 }}>Click a hospital to select</span>
        </div>
        <LiveMap selectedHospital={selectedHospital} setSelectedHospital={setSelectedHospital} />
      </div>

      {/* Emergency Numbers */}
      <div style={{
        background: `linear-gradient(135deg, ${C.crimson}15, ${C.crimsonDeep}10)`,
        border: `1px solid ${C.crimson}30`, borderRadius: 14, padding: 14, marginBottom: 20
      }}>
        <div style={{ color: C.crimson, fontSize: 12, fontWeight: 800, fontFamily: "monospace", marginBottom: 10, letterSpacing: 1 }}>⚡ EMERGENCY NUMBERS</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["108", "Ambulance"], ["104", "Health"], ["112", "Police"]].map(([num, label]) => (
            <a key={num} href={`tel:${num}`} style={{
              flex: 1, background: C.crimson, borderRadius: 10, padding: "10px 0", textAlign: "center",
              textDecoration: "none", display: "block",
              boxShadow: `0 4px 12px ${C.crimson}30`
            }}>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "monospace" }}>{num}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, marginTop: 1 }}>{label}</div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>🏥</span>
        <span style={{ color: C.white, fontSize: 16, fontWeight: 800, fontFamily: "monospace" }}>Nearby Hospitals</span>
      </div>
      {HOSPITALS.map(h => (
        <HospitalCard
          key={h.id} item={h}
          isSelected={selectedHospital?.id === h.id}
          onSelect={setSelectedHospital}
        />
      ))}

      <FirstAidSection />
    </div>
  );
}

// ─── Blood Screen ─────────────────────────────────────────────────────────────
function BloodScreen() {
  const [filter, setFilter] = useState("ALL");
  const criticalTypes = BLOOD_TYPES.filter(b => b.pct < 30).map(b => b.type);

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.white, fontSize: 26, fontWeight: 900, fontFamily: "monospace" }}>Blood Bank</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Chennai Metro · Updated just now</div>
      </div>

      {criticalTypes.length > 0 && (
        <div style={{
          background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
          borderRadius: 12, padding: "10px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ color: C.danger, fontSize: 12, fontWeight: 800, fontFamily: "monospace" }}>CRITICAL SHORTAGE</div>
            <div style={{ color: C.textSecondary, fontSize: 11, marginTop: 2 }}>
              {criticalTypes.join(", ")} — Urgent donors needed
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["ALL", "CRITICAL", "LOW", "MEDIUM", "HIGH"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? C.teal : C.card,
            border: `1px solid ${filter === f ? C.teal : C.cardBorder}`,
            borderRadius: 20, padding: "4px 12px", cursor: "pointer",
            color: filter === f ? C.bg : C.muted,
            fontSize: 10, fontWeight: 700, fontFamily: "monospace"
          }}>{f}</button>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🩸</span>
          <span style={{ color: C.white, fontSize: 16, fontWeight: 800, fontFamily: "monospace" }}>Blood Availability</span>
        </div>
        {BLOOD_TYPES.filter(b => filter === "ALL" || b.level === filter).map(b => (
          <BloodBar key={b.type} {...b} />
        ))}
      </div>

      {/* Donate CTA */}
      <div style={{
        background: `linear-gradient(135deg, ${C.crimson}20, ${C.pulse}10)`,
        border: `1px solid ${C.crimson}40`, borderRadius: 14, padding: 16, marginBottom: 16, textAlign: "center"
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>❤️</div>
        <div style={{ color: C.white, fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>Donate Blood · Save Lives</div>
        <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
          Walk-ins accepted at all centres · No appointment needed
        </div>
        <button style={{
          background: C.crimson, border: "none", borderRadius: 10,
          padding: "10px 28px", color: "#fff", fontSize: 13, fontWeight: 800,
          fontFamily: "monospace", cursor: "pointer", letterSpacing: 1
        }}>REGISTER AS DONOR</button>
      </div>

      {[
        { name: "🏦 Chennai Blood Bank", addr: "18, Gandhi Irwin Road, Egmore", phone: "044-2530-5000" },
        { name: "🏦 Apollo Blood Centre", addr: "21, Greams Lane, Thousand Lights", phone: "044-2829-3333" },
        { name: "🏦 Govt Royapettah Hospital", addr: "497, Pycroft Road, Royapettah", phone: "044-2811-5731" },
      ].map(bank => (
        <div key={bank.name} style={{
          background: C.card, borderRadius: 14, border: `1px solid ${C.cardBorder}`,
          padding: 14, marginBottom: 12
        }}>
          <div style={{ color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "monospace", marginBottom: 4 }}>{bank.name}</div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>{bank.addr}</div>
          <a href={`tel:${bank.phone}`} style={{
            display: "block", background: `${C.teal}20`, border: `1px solid ${C.teal}50`,
            borderRadius: 8, padding: 8, textAlign: "center", textDecoration: "none",
            color: C.teal, fontSize: 12, fontWeight: 800, fontFamily: "monospace"
          }}>📞 {bank.phone}</a>
        </div>
      ))}
    </div>
  );
}

// ─── Ambulance Screen ─────────────────────────────────────────────────────────
function AmbulanceScreen() {
  const [tracking, setTracking] = useState(null);

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.white, fontSize: 26, fontWeight: 900, fontFamily: "monospace" }}>Ambulance Units</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>4 units available nearby</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { val: "4", label: "Available", color: C.teal },
          { val: "4–7", label: "Min ETA", color: C.gold },
          { val: "24/7", label: "Active", color: C.pulse },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: C.card, borderRadius: 12,
            border: `1px solid ${s.color}30`, padding: "14px 0", textAlign: "center"
          }}>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 900, fontFamily: "monospace" }}>{s.val}</div>
            <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {AMBULANCES.map((a, i) => (
        <div key={a.id} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: tracking === a.id ? `${C.teal}10` : C.card,
          borderRadius: 14, border: `1px solid ${tracking === a.id ? C.teal + "60" : C.cardBorder}`,
          padding: 14, marginBottom: 12, transition: "all 0.2s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `${C.crimson}20`, border: `1px solid ${C.crimson}40`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
            }}>🚑</div>
            <div>
              <div style={{ color: C.white, fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>{a.id}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{a.driver} · {a.type}</div>
              <div style={{
                display: "inline-block", marginTop: 4,
                background: a.status === "enroute" ? `${C.pulse}20` : `${C.success}20`,
                border: `1px solid ${a.status === "enroute" ? C.pulse : C.success}40`,
                borderRadius: 4, padding: "1px 6px",
                color: a.status === "enroute" ? C.pulse : C.success,
                fontSize: 9, fontFamily: "monospace", fontWeight: 700
              }}>{a.status.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: i === 0 ? C.pulse : C.teal, fontSize: 22, fontWeight: 900, fontFamily: "monospace" }}>{a.eta}</div>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>ETA</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setTracking(tracking === a.id ? null : a.id)}
                style={{
                  background: tracking === a.id ? C.teal : `${C.teal}20`,
                  border: `1px solid ${C.teal}60`, borderRadius: 8,
                  padding: "5px 8px", cursor: "pointer",
                  color: tracking === a.id ? C.bg : C.teal,
                  fontSize: 9, fontWeight: 900, fontFamily: "monospace"
                }}>TRACK</button>
              <button style={{
                background: C.crimson, border: "none", borderRadius: 8,
                padding: "5px 8px", cursor: "pointer",
                color: "#fff", fontSize: 9, fontWeight: 900, fontFamily: "monospace"
              }}>DISPATCH</button>
            </div>
          </div>
        </div>
      ))}

      {tracking && (
        <div style={{
          background: `${C.teal}10`, border: `1px solid ${C.teal}40`,
          borderRadius: 14, padding: 14, marginBottom: 16
        }}>
          <div style={{ color: C.teal, fontSize: 12, fontWeight: 800, fontFamily: "monospace", marginBottom: 8 }}>📡 TRACKING {tracking}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {["En Route", "1.2 km away", "ETA 4 min"].map(s => (
              <div key={s} style={{
                flex: 1, background: C.card, borderRadius: 8,
                padding: "8px 0", textAlign: "center",
                border: `1px solid ${C.cardBorder}`
              }}>
                <div style={{ color: C.teal, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0D1520", borderRadius: 10, height: 80, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", color: C.muted, fontSize: 10, fontFamily: "monospace" }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            <div style={{ position: "absolute", left: "30%", top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>🚑</div>
            <div style={{ position: "absolute", right: "10%", top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>📍</div>
          </div>
        </div>
      )}

      <div style={{
        background: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`,
        padding: 16, marginTop: 4
      }}>
        <div style={{ color: C.white, fontSize: 15, fontWeight: 800, fontFamily: "monospace", marginBottom: 14 }}>⚡ How it works</div>
        {[
          "GPS auto-detects your location",
          "App queries nearest ambulances",
          "One tap — call + SMS sent instantly",
          "Hospital dashboard updated in real-time",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: `${C.teal}30`, border: `1px solid ${C.teal}`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: C.teal, fontSize: 11, fontWeight: 900, fontFamily: "monospace" }}>{i + 1}</span>
            </div>
            <span style={{ color: C.textSecondary, fontSize: 13, flex: 1 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { key: "home", icon: "🏥", label: "Hospitals" },
    { key: "blood", icon: "🩸", label: "Blood" },
    { key: "amb", icon: "🚑", label: "Ambulance" },
  ];
  return (
    <div style={{
      display: "flex", background: C.surface,
      borderTop: `1px solid ${C.cardBorder}`,
      paddingBottom: 16, paddingTop: 10,
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            background: "transparent", border: "none", cursor: "pointer",
            position: "relative", paddingBottom: 4
          }}
        >
          {active === t.key && (
            <div style={{
              position: "absolute", top: 0, width: 24, height: 2,
              background: C.crimson, borderRadius: 2
            }} />
          )}
          <span style={{ fontSize: 22, opacity: active === t.key ? 1 : 0.4 }}>{t.icon}</span>
          <span style={{
            fontSize: 10, marginTop: 2, fontFamily: "monospace",
            color: active === t.key ? C.white : C.muted,
            fontWeight: active === t.key ? 800 : 600
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Chat FAB ─────────────────────────────────────────────────────────────────
function ChatFAB({ onClick }) {
  const scale = usePulse(1200);
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed", bottom: 90, right: 20,
        width: 56, height: 56, borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.teal}, ${C.purple})`,
        border: "none", cursor: "pointer",
        boxShadow: `0 4px 20px ${C.teal}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, zIndex: 100,
        transform: `scale(${scale})`,
        transition: "transform 0.05s linear"
      }}
    >
      🤖
    </button>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [sosVisible, setSosVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: C.bg, display: "flex", flexDirection: "column",
      position: "relative", fontFamily: "system-ui, sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.cardBorder}; border-radius: 4px; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        input::placeholder { color: ${C.muted}; }
        button:active { opacity: 0.85; }
        a { color: inherit; }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "52px 16px 0" }}>
        {tab === "home" && (
          <HomeScreen
            onSOS={() => setSosVisible(true)}
            selectedHospital={selectedHospital}
            setSelectedHospital={setSelectedHospital}
          />
        )}
        {tab === "blood" && <BloodScreen />}
        {tab === "amb" && <AmbulanceScreen />}
      </div>

      <TabBar active={tab} onChange={setTab} />
      <ChatFAB onClick={() => setChatVisible(true)} />
      <SOSModal visible={sosVisible} onClose={() => setSosVisible(false)} />
      {chatVisible && <AIChatAssistant onClose={() => setChatVisible(false)} />}
    </div>
  );
}

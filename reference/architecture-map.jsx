import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#080B12", bg2: "#0D1117",
  accent: "#58A6FF", green: "#3FB950", purple: "#D2A8FF",
  orange: "#F0883E", red: "#F85149", yellow: "#E3B341",
  text: "#E6EDF3", text2: "#7D8590", text3: "#484F58",
  bdr: "rgba(230,237,243,0.06)",
  sf: "Georgia,'Times New Roman',serif",
  ss: "system-ui,-apple-system,sans-serif",
};

const NODES = {
  user:       { x: 110, y: 50,  icon: "👤", name: "User Browser",     color: C.text,   desc: "Marketplace SPA + sandboxed app iframes", tier: "client" },
  extension:  { x: 110, y: 160, icon: "🧩", name: "Chrome Extension",  color: C.purple, desc: "Key Vault — chrome.storage (Level 2)", tier: "client" },
  cloudflare: { x: 370, y: 50,  icon: "🛡️", name: "Cloudflare",       color: C.orange, desc: "DNS, WAF, DDoS, SSL, edge rate limiting", tier: "security" },
  vercel:     { x: 370, y: 180, icon: "▲",  name: "Vercel",           color: C.text,   desc: "Hosts React SPA + /apps/ HTML files + serverless fns", tier: "core" },
  github:     { x: 630, y: 50,  icon: "🐙", name: "GitHub",           color: C.text,   desc: "Monorepo — app source, tools, workflows", tier: "core" },
  actions:    { x: 630, y: 160, icon: "⚙️", name: "GitHub Actions",   color: C.accent, desc: "CI/CD, security scans, deploy triggers", tier: "ops" },
  firebase:   { x: 150, y: 310, icon: "🔥", name: "Firebase Auth",    color: C.yellow, desc: "Email/password, Google OAuth, SAML, 2FA", tier: "core" },
  supabase:   { x: 370, y: 340, icon: "⚡", name: "Supabase",         color: C.green,  desc: "Postgres DB — users, apps, reviews, transactions", tier: "core" },
  stripe:     { x: 590, y: 310, icon: "💳", name: "Stripe Connect",   color: C.purple, desc: "Payments, 80/20 splits, developer payouts", tier: "core" },
  sentry:     { x: 630, y: 440, icon: "🐛", name: "Sentry",           color: "#362D59",desc: "Error tracking, performance, session replay", tier: "ops" },
  resend:     { x: 370, y: 460, icon: "📧", name: "Resend",           color: C.text,   desc: "Transactional emails — receipts, approvals, alerts", tier: "ops" },
  betterstack:{ x: 140, y: 440, icon: "📊", name: "BetterStack",      color: "#48E5C2",desc: "Uptime monitoring, status page, alerting", tier: "ops" },
  openai:     { x: 20,  y: 220, icon: "🤖", name: "OpenAI API",       color: C.text,   desc: "GPT-4o — direct from browser, never proxied", tier: "external" },
  anthropic:  { x: 20,  y: 120, icon: "🧠", name: "Anthropic API",    color: C.text,   desc: "Claude — direct from browser, never proxied", tier: "external" },
};

const EDGES = [
  // User connections
  { from: "user", to: "cloudflare", data: ["HTTPS requests", "HTML/JS/CSS responses"], color: C.orange, type: "solid" },
  { from: "user", to: "extension", data: ["postMessage bridge", "Encrypted API keys"], color: C.purple, type: "dashed" },
  { from: "user", to: "openai", data: ["API calls (direct)", "AI responses"], color: C.green, type: "solid", important: true },
  { from: "user", to: "anthropic", data: ["API calls (direct)", "AI responses"], color: C.green, type: "solid", important: true },
  { from: "user", to: "firebase", data: ["Auth tokens (JWT)", "Login/signup requests"], color: C.yellow, type: "solid" },

  // Cloudflare → Vercel
  { from: "cloudflare", to: "vercel", data: ["Proxied requests (WAF filtered)", "Cached static assets"], color: C.orange, type: "solid" },

  // GitHub → Vercel / Actions
  { from: "github", to: "vercel", data: ["git push → auto-deploy", "Source code"], color: C.accent, type: "solid" },
  { from: "github", to: "actions", data: ["Push/PR triggers", "Workflow configs"], color: C.accent, type: "solid" },
  { from: "actions", to: "vercel", data: ["Deploy trigger", "Build artifacts"], color: C.accent, type: "dashed" },
  { from: "actions", to: "sentry", data: ["Source maps upload"], color: C.orange, type: "dashed" },

  // Vercel → backends
  { from: "vercel", to: "supabase", data: ["DB queries (REST/GraphQL)", "User data, app listings", "Audit log writes"], color: C.green, type: "solid" },
  { from: "vercel", to: "stripe", data: ["Checkout sessions", "Webhook events", "Connect payouts"], color: C.purple, type: "solid" },
  { from: "vercel", to: "sentry", data: ["Error reports", "Performance traces"], color: C.orange, type: "dashed" },
  { from: "vercel", to: "resend", data: ["Transactional emails", "Template renders"], color: C.text2, type: "dashed" },
  { from: "vercel", to: "betterstack", data: ["Health check pings", "Status updates"], color: "#48E5C2", type: "dashed" },

  // Firebase ↔ Supabase
  { from: "firebase", to: "supabase", data: ["User ID sync", "Auth state → RLS policies"], color: C.yellow, type: "solid" },

  // Stripe → Supabase
  { from: "stripe", to: "supabase", data: ["Payment records", "Subscription status", "Payout history"], color: C.purple, type: "solid" },
];

const TIERS = {
  client: { label: "Client", color: C.text },
  core: { label: "Core", color: C.accent },
  security: { label: "Security", color: C.orange },
  ops: { label: "Operations", color: C.green },
  external: { label: "External API", color: C.purple },
};

const W = 780;
const H = 520;
const NODE_W = 130;
const NODE_H = 50;

function getCenter(id) {
  const n = NODES[id];
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

function getEdgePath(from, to) {
  const a = getCenter(from);
  const b = getCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  const startX = a.x + nx * (NODE_W / 2 + 4);
  const startY = a.y + ny * (NODE_H / 2 + 4);
  const endX = b.x - nx * (NODE_W / 2 + 4);
  const endY = b.y - ny * (NODE_H / 2 + 4);
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  // slight curve
  const perpX = -ny * 20;
  const perpY = nx * 20;
  return { startX, startY, endX, endY, midX: midX + perpX, midY: midY + perpY, cx: midX + perpX * 0.5, cy: midY + perpY * 0.5 };
}

export default function ArchMap() {
  const [sel, setSel] = useState(null);
  const [hovEdge, setHovEdge] = useState(null);
  const [showData, setShowData] = useState(true);

  const isNodeActive = (id) => {
    if (!sel) return true;
    if (id === sel) return true;
    return EDGES.some(e => (e.from === sel && e.to === id) || (e.to === sel && e.from === id));
  };

  const isEdgeActive = (edge) => {
    if (!sel) return true;
    return edge.from === sel || edge.to === sel;
  };

  const selNode = sel ? NODES[sel] : null;
  const selEdges = sel ? EDGES.filter(e => e.from === sel || e.to === sel) : [];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: C.ss }}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}::selection{background:rgba(88,166,255,.25)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(230,237,243,.08);border-radius:3px}@keyframes flowDash{to{stroke-dashoffset:-20}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      <div style={{ position: "fixed", inset: 0, opacity: 0.025, pointerEvents: "none", zIndex: 50, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* Header */}
      <div style={{ padding: "28px 40px 0", maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, border: "1.5px solid " + C.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.sf, fontSize: 15, color: C.accent }}>S</div>
          <span style={{ fontFamily: C.sf, fontSize: 16, letterSpacing: "-0.5px" }}>SalesAI</span>
        </div>
        <h1 style={{ fontFamily: C.sf, fontSize: "clamp(26px,3.5vw,36px)", fontWeight: 400, letterSpacing: -1.5, marginBottom: 6 }}>
          Platform Architecture <em style={{ color: C.accent, fontStyle: "italic" }}>Map</em>
        </h1>
        <p style={{ fontSize: 13, color: C.text2, marginBottom: 16 }}>Click any node to see its connections and data flow. Lines show what data moves between each service.</p>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(TIERS).map(([id, t]) => (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: t.color }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color + "33", border: "1px solid " + t.color + "55" }} />
                {t.label}
              </span>
            ))}
          </div>
          <span style={{ width: 1, height: 14, background: C.bdr }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text2, cursor: "pointer" }}>
            <input type="checkbox" checked={showData} onChange={e => setShowData(e.target.checked)} style={{ accentColor: C.accent }} />
            Show data labels
          </label>
          {sel && <button onClick={() => setSel(null)} style={{ fontSize: 11, color: C.accent, background: C.accent + "14", border: "none", padding: "3px 10px", borderRadius: 4, cursor: "pointer", marginLeft: "auto" }}>Clear selection ×</button>}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ padding: "0 40px 40px", maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: sel ? "1fr 340px" : "1fr", gap: 20 }}>

        {/* SVG Canvas */}
        <div style={{ background: C.bg2, border: "1px solid " + C.bdr, borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              {EDGES.map((e, i) => (
                <marker key={i} id={"arrow-" + i} viewBox="0 0 10 6" refX="9" refY="3" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 3 L 0 6 z" fill={isEdgeActive(e) ? e.color : C.text3 + "33"} />
                </marker>
              ))}
            </defs>

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const p = getEdgePath(edge.from, edge.to);
              const active = isEdgeActive(edge);
              const hovered = hovEdge === i;
              return (
                <g key={i}
                  onMouseEnter={() => setHovEdge(i)}
                  onMouseLeave={() => setHovEdge(null)}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSel(edge.from === sel ? edge.to : edge.from)}>
                  {/* Hover hitbox (wider invisible line) */}
                  <path
                    d={`M ${p.startX} ${p.startY} Q ${p.midX} ${p.midY} ${p.endX} ${p.endY}`}
                    fill="none" stroke="transparent" strokeWidth={16}
                  />
                  {/* Visible line */}
                  <path
                    d={`M ${p.startX} ${p.startY} Q ${p.midX} ${p.midY} ${p.endX} ${p.endY}`}
                    fill="none"
                    stroke={active ? edge.color : C.text3 + "22"}
                    strokeWidth={hovered ? 2.5 : edge.important ? 2 : 1.5}
                    strokeDasharray={edge.type === "dashed" ? "6 4" : "none"}
                    opacity={active ? (hovered ? 1 : 0.6) : 0.15}
                    markerEnd={"url(#arrow-" + i + ")"}
                    style={active ? { animation: "flowDash 1.5s linear infinite" } : {}}
                  />
                  {/* Data label on line */}
                  {showData && active && (
                    <g>
                      <rect x={p.cx - 60} y={p.cy - (hovered ? edge.data.length * 7 : 7)} width={120} height={hovered ? edge.data.length * 14 + 4 : 14} rx={4} fill={C.bg2} stroke={hovered ? edge.color + "44" : C.bdr} strokeWidth={0.5} opacity={hovered ? 1 : 0.85} />
                      {hovered ? edge.data.map((d, di) => (
                        <text key={di} x={p.cx} y={p.cy - (edge.data.length * 7) + 10 + di * 14} textAnchor="middle" fontSize={8.5} fill={edge.color} fontFamily={C.ss}>{d}</text>
                      )) : (
                        <text x={p.cx} y={p.cy + 3.5} textAnchor="middle" fontSize={8} fill={C.text2} fontFamily={C.ss}>{edge.data[0]}</text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {Object.entries(NODES).map(([id, node]) => {
              const active = isNodeActive(id);
              const isSel = sel === id;
              const tierColor = TIERS[node.tier]?.color || C.text;
              return (
                <g key={id} onClick={() => setSel(isSel ? null : id)} style={{ cursor: "pointer" }}>
                  {/* Glow behind selected node */}
                  {isSel && <rect x={node.x - 6} y={node.y - 6} width={NODE_W + 12} height={NODE_H + 12} rx={16} fill={node.color + "08"} stroke={node.color + "22"} strokeWidth={1} />}
                  {/* Node body */}
                  <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={10}
                    fill={isSel ? node.color + "12" : C.bg2}
                    stroke={isSel ? node.color + "66" : active ? C.bdr : C.bdr}
                    strokeWidth={isSel ? 1.5 : 1}
                    opacity={active ? 1 : 0.25}
                  />
                  {/* Tier indicator */}
                  <rect x={node.x} y={node.y} width={3} height={NODE_H} rx={1.5} fill={tierColor} opacity={active ? 0.6 : 0.15} />
                  {/* Icon */}
                  <text x={node.x + 18} y={node.y + NODE_H / 2 + 1} textAnchor="middle" fontSize={16} dominantBaseline="central" opacity={active ? 1 : 0.3}>{node.icon}</text>
                  {/* Name */}
                  <text x={node.x + 34} y={node.y + 19} fontSize={10} fontWeight="600" fill={active ? C.text : C.text3} fontFamily={C.ss}>{node.name}</text>
                  {/* Subtitle */}
                  <text x={node.x + 34} y={node.y + 33} fontSize={7.5} fill={active ? C.text3 : C.text3 + "66"} fontFamily={C.ss}>{node.desc.length > 30 ? node.desc.slice(0, 30) + "…" : node.desc}</text>
                </g>
              );
            })}
          </svg>
          {/* Legend */}
          <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", gap: 12, fontSize: 10, color: C.text3 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 16, height: 0, borderTop: "2px solid " + C.accent }}/> Direct connection</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 16, height: 0, borderTop: "2px dashed " + C.accent }}/> Async / periodic</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: C.green + "44", border: "1px solid " + C.green, borderRadius: 2 }}/> Hover lines for full data</span>
          </div>
        </div>

        {/* Detail panel */}
        {sel && selNode && (
          <div style={{ background: C.bg2, border: "1px solid " + C.bdr, borderRadius: 16, alignSelf: "start", position: "sticky", top: 20, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid " + C.bdr, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{selNode.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selNode.name}</div>
                  <span style={{ fontSize: 9, color: TIERS[selNode.tier]?.color, background: (TIERS[selNode.tier]?.color || C.text) + "14", padding: "1px 6px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase" }}>{selNode.tier}</span>
                </div>
              </div>
              <button onClick={() => setSel(null)} style={{ background: "rgba(230,237,243,0.04)", border: "none", color: C.text3, width: 24, height: 24, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>×</button>
            </div>

            <div style={{ padding: 20, maxHeight: "calc(100vh - 140px)", overflow: "auto" }}>
              <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>{selNode.desc}</p>

              {/* Connections with data */}
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>
                Connections ({selEdges.length})
              </div>
              {selEdges.map((edge, i) => {
                const otherId = edge.from === sel ? edge.to : edge.from;
                const other = NODES[otherId];
                const isOutbound = edge.from === sel;
                return (
                  <div key={i} onClick={() => setSel(otherId)}
                    style={{ background: "rgba(230,237,243,0.02)", border: "1px solid " + C.bdr, borderRadius: 10, padding: 14, marginBottom: 8, cursor: "pointer", borderLeft: "3px solid " + edge.color }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{other.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{other.name}</span>
                      </div>
                      <span style={{ fontSize: 9, color: edge.color, background: edge.color + "14", padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>{isOutbound ? "SENDS →" : "← RECEIVES"}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {edge.data.map((d, di) => (
                        <div key={di} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text2 }}>
                          <span style={{ color: edge.color, fontSize: 8 }}>●</span>
                          {d}
                        </div>
                      ))}
                    </div>
                    {edge.important && (
                      <div style={{ marginTop: 8, fontSize: 10, color: C.green, background: C.green + "14", padding: "3px 8px", borderRadius: 4, display: "inline-block" }}>
                        🔒 Direct browser → API (bypasses server)
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Key security note for User Browser */}
              {sel === "user" && (
                <div style={{ marginTop: 12, padding: 14, background: "rgba(63,185,80,0.04)", border: "1px solid rgba(63,185,80,0.12)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: C.green, fontWeight: 600, marginBottom: 6 }}>🔐 ZERO-KNOWLEDGE ARCHITECTURE</div>
                  <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>
                    API keys are encrypted (AES-256) and stored on the user's device. AI API calls go directly from the browser to OpenAI/Anthropic. The marketplace server never sees keys, prompts, or AI responses.
                  </div>
                </div>
              )}

              {/* Payment flow for Stripe */}
              {sel === "stripe" && (
                <div style={{ marginTop: 12, padding: 14, background: "rgba(99,91,255,0.04)", border: "1px solid rgba(99,91,255,0.12)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: C.purple, fontWeight: 600, marginBottom: 8 }}>💳 PAYMENT FLOW</div>
                  {["1. Buyer clicks 'Add to workspace'", "2. Stripe Checkout session created", "3. Payment processed (2.9% + $0.30)", "4. 80% routed to dev's Connect account", "5. 20% retained by platform", "6. Webhook → Supabase → grant access", "7. Monthly payout to developer bank"].map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.text2, padding: "2px 0", display: "flex", gap: 6 }}>
                      <span style={{ color: C.purple, fontFamily: "monospace", fontSize: 10, minWidth: 14 }}>{i + 1}.</span>{s.split(". ")[1]}
                    </div>
                  ))}
                </div>
              )}

              {/* DB schema for Supabase */}
              {sel === "supabase" && (
                <div style={{ marginTop: 12, padding: 14, background: "rgba(62,207,142,0.04)", border: "1px solid rgba(62,207,142,0.12)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: C.green, fontWeight: 600, marginBottom: 8 }}>📦 DATABASE TABLES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {["users", "developer_profiles", "apps", "app_versions", "app_reviews", "purchases", "transactions", "payouts", "audit_logs", "review_queue"].map(t => (
                      <code key={t} style={{ fontSize: 10, color: C.green, background: C.green + "14", padding: "2px 8px", borderRadius: 4 }}>{t}</code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ padding: "24px 40px 40px", maxWidth: 1300, margin: "0 auto", borderTop: "1px solid " + C.bdr }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {[
            [String(Object.keys(NODES).length), "Platforms", C.accent],
            [String(EDGES.length), "Connections", C.green],
            [String(EDGES.reduce((s, e) => s + e.data.length, 0)), "Data flows", C.purple],
            [String(Object.values(NODES).filter(n => n.tier === "core").length), "Required to launch", C.red],
            [String(Object.values(NODES).filter(n => n.tier === "ops").length), "Operations", C.orange]
          ].map(([v, l, col]) => (
            <div key={l} style={{ background: C.bg2, border: "1px solid " + C.bdr, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: C.sf, fontSize: 24, letterSpacing: -1, color: col }}>{v}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

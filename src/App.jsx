import { useState, useRef, useCallback, useEffect } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          "#0d1117",
  surface:     "#161b27",
  surfaceHigh: "#1e2535",
  border:      "#2a3347",
  accent:      "#4f8ef7",
  accentDim:   "rgba(79,142,247,0.15)",
  gold:        "#f5c842",
  rose:        "#f76b8a",
  green:       "#4fcf8e",
  purple:      "#a78bfa",
  text:        "#e8edf5",
  muted:       "#7a8ba8",
  dim:         "#3f4f68",
};

const GEN_COLORS = ["#4f8ef7", "#4fcf8e", "#f5c842", "#f76b8a", "#a78bfa", "#f09650"];

const RELATIONSHIPS = [
  "Father","Mother","Grandfather","Grandmother",
  "Self","Spouse","Brother","Sister",
  "Son","Daughter","Uncle","Aunt","Cousin","Other",
];

// ─── Utility: localStorage helpers ───────────────────────────────────────────
const LS = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  tree:     "M17 12h-5V7h3L12 2 9 7h3v5H7v-3l-5 3 5 3v-3h5v5h-3l3 5 3-5h-3v-5h5v3l5-3-5-3v3z",
  user:     "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z",
  home:     "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a6.97 6.97 0 00-1.62-.94l-.36-2.54A.484.484 0 0016 6h-3.84c-.24 0-.43.17-.47.41l-.36 2.54a7.39 7.39 0 00-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L4.81 12.47a.49.49 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.35 1.04.66 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54a7.39 7.39 0 001.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  search:   "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  logout:   "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  plus:     "M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z",
  edit:     "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trash:    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  camera:   "M12 15.2A3.2 3.2 0 018.8 12 3.2 3.2 0 0112 8.8 3.2 3.2 0 0115.2 12 3.2 3.2 0 0112 15.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  upload:   "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  lock:     "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  mail:     "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  phone:    "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  map:      "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z",
  chevron:  "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  back:     "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  check:    "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  info:     "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  note:     "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  birthday: "M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.89 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 17.09 5.88 17.5 5 17.5V19c1.32 0 2.57-.51 3.54-1.43 1.95 1.86 5.02 1.86 6.96 0C16.43 18.49 17.68 19 19 19v-1.5c-.88 0-1.75-.41-2.4-1.01zM5 14.5c0 .28.06.54.11.8L4 14.22V9H2v6l3.07 1.97C5.03 16.65 5 16.08 5 14.5zm14 0c0 1.58-.03 2.15-.07 3.47L22 16V9h-2v5.22l-1.11 1.08c.05-.26.11-.52.11-.8z",
};

const Ic = ({ n, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={ICON_PATHS[n] || ICON_PATHS.info} />
  </svg>
);

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 18, ...style,
    cursor: onClick ? "pointer" : undefined,
  }}>{children}</div>
);

const Badge = ({ label, color = C.accent }) => (
  <span style={{
    background: color + "22", color, fontSize: 10, fontWeight: 700,
    padding: "3px 9px", borderRadius: 99, letterSpacing: "0.07em",
    textTransform: "uppercase", border: `1px solid ${color}44`,
  }}>{label}</span>
);

const Btn = ({ label, icon, onClick, variant = "primary", full, small, disabled, style }) => {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 7, borderRadius: 11, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? 12 : 14, padding: small ? "7px 13px" : "11px 22px",
    transition: "opacity .15s, transform .1s", border: "none",
    fontFamily: "inherit", width: full ? "100%" : undefined,
    opacity: disabled ? 0.5 : 1, ...style,
  };
  const v = {
    primary: { background: C.accent, color: "#fff" },
    ghost:   { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger:  { background: C.rose + "22", color: C.rose, border: `1px solid ${C.rose}44` },
    success: { background: C.green + "22", color: C.green, border: `1px solid ${C.green}44` },
    gold:    { background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}44` },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...v[variant] }}>
      {icon && <Ic n={icon} size={small ? 13 : 15} />}{label}
    </button>
  );
};

const Field = ({ label, placeholder, type = "text", icon, value, onChange, optional }) => (
  <div style={{ marginBottom: 15 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5, display: "flex", gap: 5 }}>
      {label}{optional && <span style={{ color: C.dim, fontWeight: 400 }}>(optional)</span>}
    </div>
    <div style={{ position: "relative" }}>
      {icon && <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.dim, pointerEvents: "none" }}><Ic n={icon} size={15} /></div>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: icon ? "11px 12px 11px 38px" : "11px 14px", color: C.text,
          fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
        }} />
    </div>
  </div>
);

const Textarea = ({ label, placeholder, value, onChange }) => (
  <div style={{ marginBottom: 15 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}</div>
    <textarea placeholder={placeholder} value={value} onChange={onChange}
      rows={3}
      style={{
        width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "11px 14px", color: C.text, fontSize: 14, fontFamily: "inherit",
        outline: "none", boxSizing: "border-box", resize: "vertical",
      }} />
  </div>
);

const Toast = ({ msg, type = "success" }) => (
  <div style={{
    position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
    background: type === "success" ? C.green : C.rose,
    color: "#fff", padding: "10px 20px", borderRadius: 99, fontSize: 13,
    fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  }}>{type === "success" ? "✓ " : "⚠ "}{msg}</div>
);

const Modal = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    display: "flex", alignItems: "flex-end", zIndex: 200,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: C.surface, borderRadius: "22px 22px 0 0",
      width: "100%", maxWidth: 480, margin: "0 auto",
      padding: 24, border: `1px solid ${C.border}`,
      maxHeight: "85vh", overflowY: "auto",
    }}>{children}</div>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16,
  }}>{children}</div>
);

// ─── Default Data ──────────────────────────────────────────────────────────────
const DEFAULT_MEMBERS = [
  { id: 1, firstName: "Ramesh",  lastName: "Patel", relation: "Grandfather", gen: 0, x: 80,  y: 60,  dob: "1935-03-10", birthPlace: "Vadodara", notes: "Retired teacher",    color: GEN_COLORS[0] },
  { id: 2, firstName: "Sunita",  lastName: "Patel", relation: "Grandmother", gen: 0, x: 220, y: 60,  dob: "1938-07-22", birthPlace: "Surat",    notes: "Homemaker",         color: GEN_COLORS[0] },
  { id: 3, firstName: "Vijay",   lastName: "Patel", relation: "Father",      gen: 1, x: 80,  y: 200, dob: "1960-06-12", birthPlace: "Ahmedabad",notes: "Business Owner",   color: GEN_COLORS[1] },
  { id: 4, firstName: "Meena",   lastName: "Patel", relation: "Mother",      gen: 1, x: 220, y: 200, dob: "1963-11-03", birthPlace: "Rajkot",   notes: "Teacher",           color: GEN_COLORS[1] },
  { id: 5, firstName: "Arjun",   lastName: "Patel", relation: "Self",        gen: 2, x: 80,  y: 340, dob: "1985-06-12", birthPlace: "Bengaluru",notes: "Software Engineer", color: GEN_COLORS[2] },
  { id: 6, firstName: "Priya",   lastName: "Patel", relation: "Spouse",      gen: 2, x: 220, y: 340, dob: "1987-11-03", birthPlace: "Rajkot",   notes: "Doctor",            color: GEN_COLORS[2] },
  { id: 7, firstName: "Vivaan",  lastName: "Patel", relation: "Son",         gen: 3, x: 80,  y: 480, dob: "2012-02-14", birthPlace: "Bengaluru",notes: "Student",           color: GEN_COLORS[3] },
  { id: 8, firstName: "Anaya",   lastName: "Patel", relation: "Daughter",    gen: 3, x: 220, y: 480, dob: "2015-09-08", birthPlace: "Bengaluru",notes: "Student",           color: GEN_COLORS[3] },
];

const DEFAULT_CONNECTIONS = [
  { from: 1, to: 3 }, { from: 2, to: 3 },
  { from: 3, to: 5 }, { from: 3, to: 6 },
  { from: 1, to: 2, type: "couple" },
  { from: 3, to: 4, type: "couple" },
];

const DEFAULT_PROFILE = {
  firstName: "", middleName: "", lastName: "",
  dob: "", birthPlace: "", mobile: "", email: "", photo: "",
};

// ─── Helper: initials ─────────────────────────────────────────────────────────
const initials = (m) =>
  ((m.firstName || "")[0] || "") + ((m.lastName || "")[0] || "");

const fullName = (m) =>
  [m.firstName, m.lastName].filter(Boolean).join(" ") || "Unnamed";

// ─── Screen: Auth ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode]       = useState("splash"); // splash | login | register | forgot
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [name, setName]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [toast, setToast]     = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleLogin = () => {
    if (!email || !pass) return showToast("Please fill in all fields", "error");
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ email }); }, 900);
  };

  const handleRegister = () => {
    if (!name || !email || !pass) return showToast("Please fill in all fields", "error");
    if (pass !== confirm) return showToast("Passwords don't match", "error");
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ email, name }); }, 900);
  };

  const handleForgot = () => {
    if (!email) return showToast("Enter your email first", "error");
    showToast("Reset link sent to " + email);
    setTimeout(() => setMode("login"), 1800);
  };

  if (mode === "splash") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 32, textAlign: "center", background: C.bg }}>
      <div style={{ width: 96, height: 96, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: `0 0 60px ${C.accentDim}` }}>
        <Ic n="tree" size={52} color="#fff" />
      </div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 44, fontWeight: 900, color: C.text, letterSpacing: "-1px", marginBottom: 6 }}>My Life</div>
      <div style={{ color: C.muted, fontSize: 15, marginBottom: 52 }}>Your family tree, beautifully preserved</div>
      <Btn label="Sign In" onClick={() => setMode("login")} full style={{ marginBottom: 12 }} />
      <Btn label="Create Account" variant="ghost" onClick={() => setMode("register")} full />
      <div style={{ marginTop: 48, color: C.dim, fontSize: 11 }}>Powered by Firebase · Flutter Ready · iOS & Android</div>
      {toast && <Toast {...toast} />}
    </div>
  );

  if (mode === "forgot") return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: 28, paddingTop: 60 }}>
      <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit", marginBottom: 28 }}>
        <Ic n="back" size={16} /> Back to Sign In
      </button>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8 }}>Forgot Password</div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>Enter your email and we'll send a reset link.</div>
      <Field label="Email Address" placeholder="you@example.com" icon="mail" value={email} onChange={e => setEmail(e.target.value)} />
      <Btn label="Send Reset Link" onClick={handleForgot} full style={{ marginTop: 8 }} />
      {toast && <Toast {...toast} />}
    </div>
  );

  if (mode === "register") return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: 28, paddingTop: 60, overflowY: "auto" }}>
      <button onClick={() => setMode("splash")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit", marginBottom: 28 }}>
        <Ic n="back" size={16} /> Back
      </button>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8 }}>Create Account</div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Join My Life and start building your family tree.</div>
      <Field label="Full Name" placeholder="Your full name" icon="user" value={name} onChange={e => setName(e.target.value)} />
      <Field label="Email Address" placeholder="you@example.com" icon="mail" value={email} onChange={e => setEmail(e.target.value)} />
      <Field label="Password" type="password" placeholder="Create a strong password" icon="lock" value={pass} onChange={e => setPass(e.target.value)} />
      <Field label="Confirm Password" type="password" placeholder="Repeat your password" icon="lock" value={confirm} onChange={e => setConfirm(e.target.value)} />
      <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6, marginBottom: 20 }}>
        By creating an account you agree to our Terms of Service and Privacy Policy. Your data is secured via Firebase Authentication.
      </div>
      <Btn label={loading ? "Creating Account…" : "Create Account"} onClick={handleRegister} full disabled={loading} />
      <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.muted }}>
        Already have an account?{" "}
        <span onClick={() => setMode("login")} style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }}>Sign In</span>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );

  // login
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: 28, paddingTop: 80 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${C.accent},${C.purple})`, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic n="tree" size={32} color="#fff" />
        </div>
      </div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 800, color: C.text, textAlign: "center", marginBottom: 6 }}>Welcome Back</div>
      <div style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 30 }}>Sign in to your family tree</div>
      <Field label="Email Address" placeholder="you@example.com" icon="mail" value={email} onChange={e => setEmail(e.target.value)} />
      <Field label="Password" type="password" placeholder="••••••••" icon="lock" value={pass} onChange={e => setPass(e.target.value)} />
      <div style={{ textAlign: "right", marginTop: -8, marginBottom: 22 }}>
        <span onClick={() => setMode("forgot")} style={{ fontSize: 12, color: C.accent, cursor: "pointer" }}>Forgot Password?</span>
      </div>
      <Btn label={loading ? "Signing In…" : "Sign In"} onClick={handleLogin} full disabled={loading} />
      <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.muted }}>
        No account?{" "}
        <span onClick={() => setMode("register")} style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }}>Create one free</span>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ─── Screen: Dashboard (Cloud Storage Style) ─────────────────────────────────
const DC = {
  bg:        "#eef2f8",
  sidebar:   "#1a2a4a",
  sidebarTx: "#ffffff",
  sidebarMuted: "rgba(255,255,255,0.55)",
  sidebarActive: "rgba(255,255,255,0.13)",
  card:      "#ffffff",
  border:    "#dde4ef",
  text:      "#1a2a4a",
  muted:     "#7a8ba8",
  accent:    "#4f8ef7",
  purple:    "#c084fc",
  pink:      "#f472b6",
  teal:      "#2dd4bf",
  gold:      "#fbbf24",
  green:     "#34d399",
};

// Category color gradients matching the image
const CAT_STYLES = [
  { label: "Members",     icon: "user",     gradient: "linear-gradient(135deg,#c084fc,#818cf8)", count: null },
  { label: "Documents",   icon: "note",     gradient: "linear-gradient(135deg,#38bdf8,#06b6d4)", count: null },
  { label: "Birthdays",   icon: "birthday", gradient: "linear-gradient(135deg,#fb7185,#f43f5e)", count: null },
  { label: "Notes",       icon: "edit",     gradient: "linear-gradient(135deg,#4f8ef7,#6366f1)", count: null },
];

function Dashboard({ profile, members, onNav }) {
  const displayName = profile.firstName || "User";
  const [activeNav, setActiveNav] = useState("dashboard");

  const gens = [...new Set(members.map(m => m.gen))].length;
  const membersWithBdays = members.filter(m => m.dob);
  const membersWithNotes = members.filter(m => m.notes);

  const catCounts = [members.length, gens, membersWithBdays.length, membersWithNotes.length];

  // Upcoming birthdays as "recent files"
  const today = new Date();
  const recentMembers = [...members].slice(0, 5);

  // Shared folders (generations)
  const genGroups = [...new Set(members.map(m => m.gen))].sort().map(g => ({
    gen: g,
    members: members.filter(m => m.gen === g),
  }));

  const sideNavItems = [
    { id: "dashboard", icon: "home",     label: "My cloud"      },
    { id: "search",    icon: "search",   label: "Shared files"  },
    { id: "tree",      icon: "tree",     label: "Favourites"    },
    { id: "profile",   icon: "upload",   label: "Upload files"  },
  ];

  const navTo = (id) => { setActiveNav(id); onNav(id); };

  // Avatar colours for "shared folder" member dots
  const DOT_COLORS = ["#4f8ef7","#f472b6","#34d399","#fbbf24","#c084fc"];

  return (
    <div style={{ display: "flex", height: "100%", background: DC.bg, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 190, background: DC.sidebar, display: "flex", flexDirection: "column", padding: "20px 0 16px", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 16px 20px" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4f8ef7,#c084fc)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic n="tree" size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 900, color: DC.sidebarTx }}>My Life</span>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
          {sideNavItems.map(item => (
            <button key={item.id} onClick={() => navTo(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                borderRadius: 10, background: activeNav === item.id ? DC.sidebarActive : "transparent",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                color: activeNav === item.id ? DC.sidebarTx : DC.sidebarMuted,
                fontSize: 13, fontWeight: activeNav === item.id ? 600 : 400,
                transition: "background .15s",
              }}>
              <Ic n={item.icon} size={17} color={activeNav === item.id ? DC.sidebarTx : DC.sidebarMuted} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          <button onClick={() => navTo("settings")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", color: DC.sidebarMuted, fontSize: 13 }}>
            <Ic n="settings" size={17} color={DC.sidebarMuted} /> Settings
          </button>
          <button onClick={() => navTo("profile")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", color: DC.sidebarMuted, fontSize: 13 }}>
            <Ic n="logout" size={17} color={DC.sidebarMuted} /> Log out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>

        {/* Search bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: DC.card, border: `1px solid ${DC.border}`, borderRadius: 12, padding: "9px 14px", marginBottom: 22 }}>
          <Ic n="search" size={16} color={DC.muted} />
          <span style={{ fontSize: 13, color: DC.muted }}>Search members, notes, dates…</span>
        </div>

        {/* Categories */}
        <div style={{ fontSize: 13, fontWeight: 700, color: DC.text, marginBottom: 12 }}>Categories</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
          {CAT_STYLES.map((cat, i) => (
            <div key={cat.label} style={{ background: cat.gradient, borderRadius: 14, padding: "14px 12px", cursor: "pointer", position: "relative" }}
              onClick={() => navTo(["tree","search","tree","tree"][i])}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ width: 30, height: 30, background: "rgba(255,255,255,0.25)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n={cat.icon} size={15} color="#fff" />
                </div>
                {i === 0 && <span style={{ fontSize: 16 }}>⭐</span>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{cat.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{catCounts[i]} {i === 1 ? "generations" : "entries"}</div>
            </div>
          ))}
        </div>

        {/* Files / Generation Groups */}
        <div style={{ fontSize: 13, fontWeight: 700, color: DC.text, marginBottom: 12 }}>Generations</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
          {genGroups.map(g => (
            <div key={g.gen} onClick={() => navTo("tree")}
              style={{ background: DC.card, border: `1px solid ${DC.border}`, borderRadius: 13, padding: "14px 14px", cursor: "pointer", flexShrink: 0, minWidth: 100 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${GEN_COLORS[g.gen % GEN_COLORS.length]}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Ic n="tree" size={16} color={GEN_COLORS[g.gen % GEN_COLORS.length]} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: DC.text }}>Gen {g.gen + 1}</div>
              <div style={{ fontSize: 10, color: DC.muted, marginTop: 2 }}>{g.members.length} members</div>
            </div>
          ))}
          {/* Add new */}
          <div onClick={() => navTo("tree")}
            style={{ background: DC.card, border: `1.5px dashed ${DC.border}`, borderRadius: 13, padding: "14px 14px", cursor: "pointer", flexShrink: 0, minWidth: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="plus" size={20} color={DC.muted} />
          </div>
        </div>

        {/* Recent Members */}
        <div style={{ fontSize: 13, fontWeight: 700, color: DC.text, marginBottom: 12 }}>Recent Members</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recentMembers.map((m, i) => (
            <div key={m.id} onClick={() => navTo("search")}
              style={{ background: DC.card, border: `1px solid ${DC.border}`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: m.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic n="user" size={15} color={m.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DC.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fullName(m)}</div>
                <div style={{ fontSize: 10, color: DC.muted }}>{m.relation} · {m.birthPlace || "—"}</div>
              </div>
              <div style={{ fontSize: 10, color: DC.muted, flexShrink: 0 }}>Gen {m.gen + 1}</div>
              <Ic n="chevron" size={14} color={DC.muted} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ width: 170, background: DC.card, borderLeft: `1px solid ${DC.border}`, padding: "20px 14px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#4f8ef7,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
            {(displayName[0] || "U").toUpperCase()}
          </div>
        </div>

        {/* Add new files button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", borderRadius: 14, border: `1.5px dashed ${DC.border}`, cursor: "pointer", gap: 8 }}
          onClick={() => navTo("tree")}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="upload" size={18} color={DC.accent} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: DC.text, textAlign: "center" }}>Add new member</div>
        </div>

        {/* Storage */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: DC.text }}>Your storage</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: DC.accent }}>{Math.round((members.length / 50) * 100)}% used</span>
          </div>
          <div style={{ height: 6, background: DC.border, borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${Math.min((members.length / 50) * 100, 100)}%`, background: DC.accent, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: DC.muted }}>{members.length} of 50 members used</div>
        </div>

        {/* Shared generations */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: DC.text, marginBottom: 10 }}>Your generations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {genGroups.slice(0, 3).map(g => (
              <div key={g.gen} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", background: ["#f0f4ff","#fff0f8","#f0fff8"][g.gen % 3], borderRadius: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: DC.text }}>Gen {g.gen + 1}</span>
                <div style={{ display: "flex" }}>
                  {g.members.slice(0, 3).map((m, i) => (
                    <div key={m.id} style={{ width: 18, height: 18, borderRadius: "50%", background: DOT_COLORS[i % DOT_COLORS.length], marginLeft: i === 0 ? 0 : -5, border: "2px solid #fff", fontSize: 7, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {initials(m)[0]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => navTo("tree")} style={{ fontSize: 11, color: DC.accent, background: "none", border: "none", cursor: "pointer", textAlign: "center", fontFamily: "inherit", padding: "4px 0" }}>+ Add more</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────
function ProfileScreen({ profile, onSave }) {
  const [form, setForm]   = useState({ ...DEFAULT_PROFILE, ...profile });
  const [toast, setToast] = useState(null);
  const fileRef           = useRef();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePhotoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.dob || !form.birthPlace || !form.mobile || !form.email) {
      setToast({ msg: "Please fill all required fields", type: "error" });
      setTimeout(() => setToast(null), 2500);
      return;
    }
    onSave(form);
    setToast({ msg: "Profile saved!" });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div style={{ padding: "0 18px 32px" }}>
      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 20px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", border: `3px solid ${C.border}`, overflow: "hidden" }}>
            {form.photo
              ? <img src={form.photo} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : ((form.firstName[0] || "") + (form.lastName[0] || "")) || "?"}
          </div>
          <div onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${C.bg}` }}>
            <Ic n="camera" size={14} color="#fff" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoFile} />
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Tap camera icon to change photo</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn label="Camera" icon="camera" variant="ghost" small onClick={() => fileRef.current.click()} />
          <Btn label="Gallery" icon="upload" variant="ghost" small onClick={() => fileRef.current.click()} />
        </div>
      </div>

      <SectionTitle>Personal Details</SectionTitle>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="First Name *" placeholder="First" value={form.firstName} onChange={set("firstName")} /></div>
        <div style={{ flex: 1 }}><Field label="Middle Name" placeholder="Middle" value={form.middleName} onChange={set("middleName")} optional /></div>
      </div>
      <Field label="Family Name *" placeholder="Last / Family name" value={form.lastName} onChange={set("lastName")} />
      <Field label="Date of Birth *" type="date" value={form.dob} onChange={set("dob")} />
      <Field label="Birth Place *" placeholder="City, State, Country" icon="map" value={form.birthPlace} onChange={set("birthPlace")} />
      <Field label="Mobile Number *" placeholder="+91 XXXXX XXXXX" icon="phone" value={form.mobile} onChange={set("mobile")} />
      <Field label="Email Address *" placeholder="you@example.com" icon="mail" value={form.email} onChange={set("email")} />
      <div style={{ fontSize: 11, color: C.dim, marginBottom: 18 }}>* Required fields</div>
      <Btn label="Save Profile" onClick={handleSave} full />
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ─── Screen: Family Tree (Hierarchical Layout) ───────────────────────────────
//
// Layout rules (matching reference image):
//   Row 0 (top)    : Grandparents  — faint/light color, small nodes
//   Row 1          : Parents + Aunts/Uncles
//   Row 2 (center) : Self (highlighted) + Spouse — prominent gold cards
//   Row 3          : Brothers/Sisters
//   Row 4          : Sons/Daughters
//   Row 5 (bottom) : Grandchildren (if any)
//
// Couple connections draw a short horizontal bracket.
// Parent→child lines drop from midpoint of couple bracket to child node top.

const TREE_ROW = {
  Grandfather: 0, Grandmother: 0,
  Father: 1, Mother: 1, Uncle: 1, Aunt: 1,
  Self: 2, Spouse: 2,
  Brother: 3, Sister: 3, Cousin: 3,
  Son: 4, Daughter: 4,
  Other: 4,
};
const ROW_Y    = [60, 200, 340, 480, 620, 760];
const NODE_W   = 110;
const NODE_H   = 52;
const COL_GAP  = 24;

// Assign pixel positions based on relationship group, centering within each row
function computeLayout(members) {
  const rows = {};
  members.forEach(m => {
    const row = TREE_ROW[m.relation] ?? 4;
    if (!rows[row]) rows[row] = [];
    rows[row].push(m);
  });

  // Sort rows: Self first in row 2, couple pairs together
  const COUPLE_ORDER = ["Grandfather","Grandmother","Father","Mother","Uncle","Aunt","Self","Spouse","Brother","Sister","Cousin","Son","Daughter","Other"];
  Object.keys(rows).forEach(r => {
    rows[r].sort((a, b) => COUPLE_ORDER.indexOf(a.relation) - COUPLE_ORDER.indexOf(b.relation));
  });

  const positions = {};
  const CANVAS_W = 600; // virtual canvas, we'll center to screen

  Object.entries(rows).forEach(([row, mems]) => {
    const totalW = mems.length * NODE_W + (mems.length - 1) * COL_GAP;
    const startX = (CANVAS_W - totalW) / 2;
    mems.forEach((m, i) => {
      positions[m.id] = {
        x: startX + i * (NODE_W + COL_GAP),
        y: ROW_Y[row] || (parseInt(row) * 140 + 60),
        row: parseInt(row),
      };
    });
  });

  return positions;
}

// Draw connector lines between nodes
function TreeConnectors({ members, positions }) {
  const PINK  = "#f472b6";
  const GRAY  = "#c8cfe0";
  const lines = [];

  // Couple brackets (horizontal line between couple nodes)
  const coupleRelPairs = [
    ["Grandfather","Grandmother"],
    ["Father","Mother"],
    ["Self","Spouse"],
  ];
  coupleRelPairs.forEach(([relA, relB]) => {
    const a = members.find(m => m.relation === relA);
    const b = members.find(m => m.relation === relB);
    if (!a || !b || !positions[a.id] || !positions[b.id]) return;
    const pa = positions[a.id], pb = positions[b.id];
    const ax = pa.x + NODE_W / 2, ay = pa.y + NODE_H / 2;
    const bx = pb.x + NODE_W / 2, by = pb.y + NODE_H / 2;
    lines.push(<line key={`couple-${relA}`} x1={ax} y1={ay} x2={bx} y2={by} stroke={PINK} strokeWidth={2.5} strokeDasharray="5,3" />);
  });

  // Parent → child lines
  // Grandparents → Father (midpoint of gp couple → top of Father)
  const drawParentChild = (parentRelA, parentRelB, childRels, key) => {
    const pA = members.find(m => m.relation === parentRelA);
    const pB = members.find(m => m.relation === parentRelB);
    const children = members.filter(m => childRels.includes(m.relation));
    if (!children.length) return;

    let originX, originY;
    if (pA && pB && positions[pA.id] && positions[pB.id]) {
      originX = (positions[pA.id].x + NODE_W / 2 + positions[pB.id].x + NODE_W / 2) / 2;
      originY = positions[pA.id].y + NODE_H;
    } else if (pA && positions[pA.id]) {
      originX = positions[pA.id].x + NODE_W / 2;
      originY = positions[pA.id].y + NODE_H;
    } else if (pB && positions[pB.id]) {
      originX = positions[pB.id].x + NODE_W / 2;
      originY = positions[pB.id].y + NODE_H;
    } else return;

    if (children.length === 1) {
      const c = children[0];
      if (!positions[c.id]) return;
      const cx = positions[c.id].x + NODE_W / 2;
      const cy = positions[c.id].y;
      const midY = (originY + cy) / 2;
      lines.push(
        <path key={`pc-${key}-${c.id}`}
          d={`M${originX},${originY} L${originX},${midY} L${cx},${midY} L${cx},${cy}`}
          fill="none" stroke={PINK} strokeWidth={2} />
      );
    } else {
      // horizontal bus line, then verticals to each child
      const firstC = children[0], lastC = children[children.length - 1];
      if (!positions[firstC.id] || !positions[lastC.id]) return;
      const childrenY = positions[firstC.id].y;
      const midY = (originY + childrenY) / 2;
      const busX1 = positions[firstC.id].x + NODE_W / 2;
      const busX2 = positions[lastC.id].x + NODE_W / 2;

      lines.push(<line key={`bus-down-${key}`} x1={originX} y1={originY} x2={originX} y2={midY} stroke={PINK} strokeWidth={2} />);
      lines.push(<line key={`bus-h-${key}`} x1={busX1} y1={midY} x2={busX2} y2={midY} stroke={PINK} strokeWidth={2} />);
      children.forEach(c => {
        if (!positions[c.id]) return;
        const cx = positions[c.id].x + NODE_W / 2;
        lines.push(<line key={`pc-${key}-${c.id}`} x1={cx} y1={midY} x2={cx} y2={positions[c.id].y} stroke={PINK} strokeWidth={2} />);
      });
    }
  };

  drawParentChild("Grandfather","Grandmother", ["Father","Mother","Uncle","Aunt"], "gp");
  drawParentChild("Father","Mother", ["Self","Brother","Sister"], "parents");
  drawParentChild("Uncle","Aunt",   ["Cousin"], "uncle");
  drawParentChild("Self","Spouse",  ["Son","Daughter"], "self");

  return <>{lines}</>;
}

function FamilyTreeScreen({ members, setMembers, connections, setConnections }) {
  const [zoom,       setZoom]       = useState(0.85);
  const [panOffset,  setPanOffset]  = useState({ x: 0, y: 40 });
  const [isPanning,  setIsPanning]  = useState(false);
  const [panStart,   setPanStart]   = useState({ x: 0, y: 0 });
  const [showAdd,    setShowAdd]    = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit,   setShowEdit]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const svgRef = useRef();

  const doToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2000); };

  const positions = computeLayout(members);

  // ── Pan canvas ──
  const onSvgMouseDown = (e) => {
    if (e.target.closest && e.target.closest("[data-node]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  const onMouseMove = useCallback((e) => {
    if (isPanning) setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);
  const onMouseUp = () => setIsPanning(false);

  // Touch pan
  const touchPanStart = useRef(null);
  const onTouchStartSvg = (e) => {
    if (e.touches.length === 1) {
      touchPanStart.current = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y };
    }
  };
  const onTouchMoveSvg = (e) => {
    if (e.touches.length === 1 && touchPanStart.current) {
      setPanOffset({ x: e.touches[0].clientX - touchPanStart.current.x, y: e.touches[0].clientY - touchPanStart.current.y });
    }
  };

  // ── Node style by relation ──
  const nodeStyle = (m) => {
    const isSelf   = m.relation === "Self";
    const isSpouse = m.relation === "Spouse";
    const isGP     = m.relation === "Grandfather" || m.relation === "Grandmother";
    const isParent = m.relation === "Father" || m.relation === "Mother";

    if (isSelf)   return { fill: "#fbbf24", stroke: "#f59e0b", strokeW: 3, textColor: "#1a2a4a", subColor: "#92400e", labelSize: 11, nameSize: 13 };
    if (isSpouse) return { fill: "#fde68a", stroke: "#fbbf24", strokeW: 2, textColor: "#1a2a4a", subColor: "#78350f", labelSize: 10, nameSize: 11 };
    if (isGP)     return { fill: "#fef9ee", stroke: "#fde68a", strokeW: 1.5, textColor: "#6b7280", subColor: "#9ca3af", labelSize: 9,  nameSize: 10 };
    if (isParent) return { fill: "#fffbeb", stroke: "#fcd34d", strokeW: 1.5, textColor: "#374151", subColor: "#6b7280", labelSize: 9,  nameSize: 11 };
    // siblings, children etc.
    return { fill: "#fef3c7", stroke: "#fbbf24", strokeW: 1.5, textColor: "#1a2a4a", subColor: "#6b7280", labelSize: 9, nameSize: 11 };
  };

  // ── Add member ──
  const AddModal = () => {
    const [form, setForm] = useState({ firstName: "", lastName: "", relation: "Son", dob: "", birthPlace: "", notes: "" });
    const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    const add = () => {
      if (!form.firstName) return;
      const row = TREE_ROW[form.relation] ?? 4;
      setMembers(ms => [...ms, {
        id: Date.now(), ...form,
        gen: row,
        x: 80 + Math.random() * 200, y: ROW_Y[row] || 400,
        color: GEN_COLORS[row % GEN_COLORS.length],
      }]);
      setShowAdd(false); doToast("Member added");
    };
    return (
      <Modal onClose={() => setShowAdd(false)}>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 18 }}>Add Family Member</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="First Name *" placeholder="First" value={form.firstName} onChange={f("firstName")} /></div>
          <div style={{ flex: 1 }}><Field label="Last Name" placeholder="Last" value={form.lastName} onChange={f("lastName")} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7 }}>Relationship *</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {RELATIONSHIPS.map(r => (
              <button key={r} onClick={() => setForm(p => ({ ...p, relation: r }))}
                style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: form.relation === r ? C.accent : "transparent", color: form.relation === r ? "#fff" : C.muted, border: `1px solid ${form.relation === r ? C.accent : C.border}` }}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <Field label="Date of Birth" type="date" value={form.dob} onChange={f("dob")} />
        <Field label="Birth Place" placeholder="City, Country" icon="map" value={form.birthPlace} onChange={f("birthPlace")} />
        <Textarea label="Notes" placeholder="Any notes about this person…" value={form.notes} onChange={f("notes")} />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn label="Cancel" variant="ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }} />
          <Btn label="Add Member" onClick={add} style={{ flex: 2 }} />
        </div>
      </Modal>
    );
  };

  // ── Edit member ──
  const EditModal = ({ member }) => {
    const [form, setForm] = useState({ ...member });
    const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    const save = () => {
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, ...form } : m));
      setShowEdit(null); doToast("Member updated");
    };
    return (
      <Modal onClose={() => setShowEdit(null)}>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 18 }}>Edit Member</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="First Name" value={form.firstName} onChange={f("firstName")} /></div>
          <div style={{ flex: 1 }}><Field label="Last Name" value={form.lastName} onChange={f("lastName")} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7 }}>Relationship</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {RELATIONSHIPS.map(r => (
              <button key={r} onClick={() => setForm(p => ({ ...p, relation: r }))}
                style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: form.relation === r ? C.accent : "transparent", color: form.relation === r ? "#fff" : C.muted, border: `1px solid ${form.relation === r ? C.accent : C.border}` }}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <Field label="Date of Birth" type="date" value={form.dob} onChange={f("dob")} />
        <Field label="Birth Place" placeholder="City, Country" icon="map" value={form.birthPlace} onChange={f("birthPlace")} />
        <Textarea label="Notes" placeholder="Any notes…" value={form.notes} onChange={f("notes")} />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn label="Cancel" variant="ghost" onClick={() => setShowEdit(null)} style={{ flex: 1 }} />
          <Btn label="Save Changes" onClick={save} style={{ flex: 2 }} />
        </div>
      </Modal>
    );
  };

  const detail = showDetail ? members.find(m => m.id === showDetail) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 800, color: C.text, flex: 1 }}>Family Tree</div>
        <button onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))} style={{ width: 30, height: 30, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.text, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        <span style={{ fontSize: 11, color: C.dim, minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.15).toFixed(2)))} style={{ width: 30, height: 30, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.text, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <button onClick={() => { setZoom(0.85); setPanOffset({ x: 0, y: 40 }); }} style={{ width: 30, height: 30, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>⌂</button>
        <Btn label="Add" icon="plus" small onClick={() => setShowAdd(true)} />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, padding: "6px 14px", borderBottom: `1px solid ${C.border}`, overflowX: "auto", flexShrink: 0, background: C.bg }}>
        {[
          { label: "Grandparents", fill: "#fef9ee", stroke: "#fde68a" },
          { label: "Parents",      fill: "#fffbeb", stroke: "#fcd34d" },
          { label: "Self / Spouse",fill: "#fbbf24", stroke: "#f59e0b" },
          { label: "Children",     fill: "#fef3c7", stroke: "#fbbf24" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ width: 16, height: 10, borderRadius: 3, background: l.fill, border: `1.5px solid ${l.stroke}` }} />
            <span style={{ fontSize: 10, color: C.muted }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 10, color: C.dim, flexShrink: 0 }}>Drag to pan</div>
      </div>

      {/* SVG Canvas */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", background: "#f7f9fc" }}>
        <svg
          ref={svgRef} width="100%" height="100%"
          style={{ cursor: isPanning ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }}
          onMouseDown={onSvgMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStartSvg}
          onTouchMove={onTouchMoveSvg}
          onTouchEnd={() => { touchPanStart.current = null; }}
        >
          <defs>
            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.2" fill="#c8cfe0" opacity="0.5" />
            </pattern>
            {members.map(m => (
              <clipPath key={m.id} id={`clip-${m.id}`}>
                <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={10} />
              </clipPath>
            ))}
          </defs>

          {/* Dotted background */}
          <rect x="-5000" y="-5000" width="12000" height="12000" fill="url(#dots)" />

          <g transform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom})`}>

            {/* Connector lines */}
            <TreeConnectors members={members} positions={positions} />

            {/* Member nodes */}
            {members.map(m => {
              const pos = positions[m.id];
              if (!pos) return null;
              const s = nodeStyle(m);
              const isSelf = m.relation === "Self";
              const name = fullName(m);
              const shortName = name.length > 14 ? name.slice(0, 13) + "…" : name;

              return (
                <g key={m.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  data-node="1"
                  onClick={() => setShowDetail(m.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Shadow for Self */}
                  {isSelf && <rect x={3} y={4} width={NODE_W} height={NODE_H} rx={10} fill="#f59e0b" opacity={0.25} />}

                  {/* Card rect */}
                  <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={10}
                    fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeW}
                  />

                  {/* Name */}
                  <text x={NODE_W / 2} y={isSelf ? 22 : 20}
                    textAnchor="middle"
                    fill={s.textColor}
                    fontSize={s.nameSize}
                    fontWeight={isSelf ? 900 : 700}
                    fontFamily="'DM Sans', sans-serif"
                    letterSpacing={isSelf ? "0.04em" : "0"}
                  >
                    {shortName.toUpperCase()}
                  </text>

                  {/* Relation label */}
                  <text x={NODE_W / 2} y={isSelf ? 38 : 35}
                    textAnchor="middle"
                    fill={s.subColor}
                    fontSize={s.labelSize}
                    fontFamily="'DM Sans', sans-serif"
                  >
                    {m.relation}
                  </text>

                  {/* DOB if Self */}
                  {isSelf && m.dob && (
                    <text x={NODE_W / 2} y={48} textAnchor="middle" fill="#92400e" fontSize={8} fontFamily="'DM Sans',sans-serif">
                      {m.dob}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Member detail sheet */}
      {detail && (
        <Modal onClose={() => setShowDetail(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "#fef3c7", border: "2px solid #fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#92400e", flexShrink: 0 }}>
              {detail.photo
                ? <img src={detail.photo} alt="" style={{ width: "100%", height: "100%", borderRadius: 10, objectFit: "cover" }} />
                : initials(detail)}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: 17 }}>{fullName(detail)}</div>
              <Badge label={detail.relation} color="#f59e0b" />
            </div>
            <button onClick={() => setShowDetail(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
          {detail.dob && <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>🎂 {detail.dob}</div>}
          {detail.birthPlace && <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>📍 {detail.birthPlace}</div>}
          {detail.notes && <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, padding: "10px 12px", background: C.bg, borderRadius: 8 }}>📝 {detail.notes}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn label="Edit" icon="edit" variant="ghost" onClick={() => { setShowEdit(detail); setShowDetail(null); }} style={{ flex: 1 }} />
            <Btn label="Delete" icon="trash" variant="danger" onClick={() => {
              setMembers(ms => ms.filter(m => m.id !== detail.id));
              setConnections(cs => cs.filter(c => c.from !== detail.id && c.to !== detail.id));
              setShowDetail(null); doToast("Member removed");
            }} style={{ flex: 1 }} />
          </div>
        </Modal>
      )}

      {showAdd && <AddModal />}
      {showEdit && <EditModal member={showEdit} />}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ─── Screen: Search ────────────────────────────────────────────────────────────
function SearchScreen({ members, onViewMember }) {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState("Name");

  const results = members.filter(m => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if (filter === "Name")         return fullName(m).toLowerCase().includes(q);
    if (filter === "Birth Place")  return (m.birthPlace || "").toLowerCase().includes(q);
    if (filter === "Relationship") return m.relation.toLowerCase().includes(q);
    return false;
  });

  return (
    <div style={{ padding: "0 18px 32px" }}>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 800, color: C.text, padding: "22px 0 16px" }}>Search</div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.dim, pointerEvents: "none" }}><Ic n="search" size={15} /></div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search family members…"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: "12px 14px 12px 38px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["Name", "Birth Place", "Relationship"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 99, fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: filter === f ? C.accent : "transparent", color: filter === f ? "#fff" : C.muted, border: `1px solid ${filter === f ? C.accent : C.border}` }}>
            {f}
          </button>
        ))}
      </div>
      {query && <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{results.length} result{results.length !== 1 ? "s" : ""} found</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map(m => (
          <Card key={m.id} onClick={() => onViewMember && onViewMember(m)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: m.color + "33", border: `2px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: m.color, fontSize: 14, flexShrink: 0 }}>
              {initials(m)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{fullName(m)}</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {m.relation}{m.birthPlace ? ` · ${m.birthPlace}` : ""}{m.dob ? ` · Born ${m.dob}` : ""}
              </div>
            </div>
            <Badge label={`Gen ${m.gen + 1}`} color={m.color} />
          </Card>
        ))}
        {results.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14 }}>No members found</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Settings ─────────────────────────────────────────────────────────
function SettingsScreen({ onLogout, members, profile }) {
  const [lang,  setLang]  = useState("English");
  const [toast, setToast] = useState(null);

  const doToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const exportCSV = () => {
    const header = "ID,First Name,Last Name,Relation,Generation,DOB,Birth Place,Notes";
    const rows = members.map(m =>
      [m.id, m.firstName, m.lastName, m.relation, m.gen + 1, m.dob, m.birthPlace, `"${(m.notes||"").replace(/"/g,'""')}"`].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "family-tree.csv"; a.click();
    URL.revokeObjectURL(url);
    doToast("CSV exported!");
  };

  const exportJSON = () => {
    const json = JSON.stringify({ profile, members }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "my-life-backup.json"; a.click();
    URL.revokeObjectURL(url);
    doToast("JSON backup exported!");
  };

  const Sec = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{title}</div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>{children}</div>
    </div>
  );

  const Row = ({ icon, label, sub, right, onClick, danger, last }) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: last ? "none" : `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: danger ? C.rose + "22" : C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Ic n={icon} size={15} color={danger ? C.rose : C.accent} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? C.rose : C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.dim }}>{sub}</div>}
      </div>
      {right && <div style={{ fontSize: 13, color: C.muted }}>{right}</div>}
      {onClick && !danger && <Ic n="chevron" size={14} color={C.dim} />}
    </div>
  );

  return (
    <div style={{ padding: "0 18px 32px", overflowY: "auto" }}>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 800, color: C.text, padding: "22px 0 20px" }}>Settings</div>

      {/* Profile summary */}
      <Card style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16, overflow: "hidden", flexShrink: 0 }}>
          {profile.photo
            ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : ((profile.firstName || "")[0] || "") + ((profile.lastName || "")[0] || "") || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: C.text }}>{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Complete your profile"}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{profile.email || "No email set"}</div>
        </div>
        <Badge label={`${members.length} members`} />
      </Card>

      <Sec title="Generation Colors">
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Colors assigned by generation level</div>
          <div style={{ display: "flex", gap: 14 }}>
            {GEN_COLORS.slice(0, 5).map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: c, border: `2px solid ${c}88` }} />
                <span style={{ fontSize: 9, color: C.muted }}>Gen {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </Sec>

      <Sec title="Export Data">
        <Row icon="download" label="Export as CSV" sub="All members with details" onClick={exportCSV} />
        <Row icon="download" label="Export JSON Backup" sub="Full app backup" onClick={exportJSON} last />
      </Sec>

      <Sec title="Language">
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[["English",""], ["Hindi","(Coming soon)"], ["Gujarati","(Coming soon)"]].map(([l, note]) => (
              <button key={l} onClick={() => l === "English" && setLang(l)}
                style={{ padding: "7px 14px", borderRadius: 99, fontSize: 13, cursor: l === "English" ? "pointer" : "default", fontFamily: "inherit", background: lang === l ? C.accent : "transparent", color: lang === l ? "#fff" : l === "English" ? C.muted : C.dim, border: `1px solid ${lang === l ? C.accent : C.border}` }}>
                {l} <span style={{ fontSize: 10 }}>{note}</span>
              </button>
            ))}
          </div>
        </div>
      </Sec>

      <Sec title="Security">
        <Row icon="lock" label="Change Password" sub="Update your Firebase password" onClick={() => doToast("Open Firebase settings to change password")} />
        <Row icon="mail" label="Linked Email" sub="Authentication email" right={profile.email || "Not set"} last />
      </Sec>

      <Sec title="App Info">
        <Row icon="info" label="Version" right="1.0.0" />
        <Row icon="tree" label="Platform" right="iOS · Android (soon)" />
        <Row icon="lock" label="Backend" right="Firebase" last />
      </Sec>

      <Sec title="Account">
        <Row icon="logout" label="Sign Out" danger onClick={onLogout} last />
      </Sec>

      <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: C.dim }}>
        My Life © 2026 · aibrif.com · Built with Flutter + Firebase
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ active, onNav }) {
  const tabs = [
    { id: "dashboard", icon: "home",     label: "Home"    },
    { id: "tree",      icon: "tree",     label: "Tree"    },
    { id: "search",    icon: "search",   label: "Search"  },
    { id: "profile",   icon: "user",     label: "Profile" },
    { id: "settings",  icon: "settings", label: "More"    },
  ];
  return (
    <div style={{ display: "flex", background: C.surface, borderTop: `1px solid ${C.border}`, paddingBottom: "env(safe-area-inset-bottom, 4px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onNav(t.id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", position: "relative" }}>
          {active === t.id && (
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 2, borderRadius: 1, background: C.accent }} />
          )}
          <Ic n={t.icon} size={21} color={active === t.id ? C.accent : C.dim} />
          <span style={{ fontSize: 9.5, fontWeight: active === t.id ? 700 : 500, color: active === t.id ? C.accent : C.dim }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed,  setAuthed]  = useState(() => LS.get("ml_authed", false));
  const [tab,     setTab]     = useState("dashboard");
  const [profile, setProfile] = useState(() => LS.get("ml_profile", DEFAULT_PROFILE));
  const [members, setMembersRaw] = useState(() => LS.get("ml_members", DEFAULT_MEMBERS));
  const [conns,   setConnsRaw]   = useState(() => LS.get("ml_conns",   DEFAULT_CONNECTIONS));

  const setMembers = (v) => { const next = typeof v === "function" ? v(members) : v; setMembersRaw(next); LS.set("ml_members", next); };
  const setConns   = (v) => { const next = typeof v === "function" ? v(conns)   : v; setConnsRaw(next);   LS.set("ml_conns",   next); };

  const handleLogin  = (u) => { LS.set("ml_authed", true); setAuthed(true); };
  const handleLogout = () => { LS.set("ml_authed", false); setAuthed(false); setTab("dashboard"); };
  const saveProfile  = (p) => { setProfile(p); LS.set("ml_profile", p); };

  if (!authed) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <AuthScreen onLogin={handleLogin} />
    </>
  );

  const renderTab = () => {
    if (tab === "dashboard") return <Dashboard profile={profile} members={members} onNav={setTab} />;
    if (tab === "tree")      return <FamilyTreeScreen members={members} setMembers={setMembers} connections={conns} setConnections={setConns} />;
    if (tab === "profile")   return <ProfileScreen profile={profile} onSave={saveProfile} />;
    if (tab === "search")    return <SearchScreen members={members} />;
    if (tab === "settings")  return <SettingsScreen onLogout={handleLogout} members={members} profile={profile} />;
  };

  // Dashboard gets a full-width, no-chrome layout
  if (tab === "dashboard") return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ height: "100dvh", background: DC.bg, maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {renderTab()}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, maxWidth: 480, margin: "0 auto", position: "relative" }}>
        {/* App header */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 18px", height: 52, borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.bg, paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${C.accent},${C.purple})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic n="tree" size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 900, color: C.text, marginLeft: 9 }}>My Life</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 11, color: C.muted }}>Synced</span>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: tab === "tree" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>
          {renderTab()}
        </div>

        {/* Bottom nav */}
        <BottomNav active={tab} onNav={setTab} />
      </div>
    </>
  );
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: #eef2f8; }
  body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; }
  input, textarea, button { font-family: inherit; }
  input::placeholder, textarea::placeholder { color: #3f4f68; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a3347; border-radius: 2px; }
  button { -webkit-tap-highlight-color: transparent; }
  button:active { opacity: 0.8; }
`;

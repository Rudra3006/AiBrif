import { useState, useEffect, useRef } from "react";

// ── Font & colour palette options ──────────────────────────────────────────
const FONTS = [
  { label: "Playfair Display", value: "'Playfair Display', serif", import: "Playfair+Display:wght@400;600;700" },
  { label: "Josefin Sans",     value: "'Josefin Sans', sans-serif",  import: "Josefin+Sans:wght@300;400;600" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif",   import: "DM+Serif+Display" },
  { label: "Raleway",          value: "'Raleway', sans-serif",        import: "Raleway:wght@300;400;600;700" },
  { label: "Cormorant Garamond",value:"'Cormorant Garamond', serif", import: "Cormorant+Garamond:wght@400;600;700" },
];

const PALETTES = [
  { label: "Midnight Ink",   bg: "#0d0d14", card: "#16161f", accent: "#c8a96e", text: "#f0ece4", sub: "#7a7690" },
  { label: "Rose Quartz",    bg: "#1a0a10", card: "#250f18", accent: "#e8748a", text: "#fdeef2", sub: "#b07080" },
  { label: "Forest Mist",    bg: "#071410", card: "#0d1f18", accent: "#4ecb8c", text: "#e8f5f0", sub: "#527a68" },
  { label: "Ocean Deep",     bg: "#030d1a", card: "#081527", accent: "#3ba8d8", text: "#e8f4fb", sub: "#3a6080" },
  { label: "Lavender Dusk",  bg: "#100a1a", card: "#180f28", accent: "#a07de8", text: "#f0ecfa", sub: "#7060a0" },
];

function evaluatePassword(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 11) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score: 1, label: "Weak",   color: "#e85555" };
  if (score <= 4) return { score: 2, label: "Fair",   color: "#e8a430" };
  if (score <= 5) return { score: 3, label: "Strong", color: "#4ecb8c" };
  return             { score: 4, label: "Very Strong", color: "#3ba8d8" };
}

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 8)  errors.push("At least 8 characters");
  if (pw.length > 14) errors.push("No more than 14 characters");
  if (!/[A-Za-z]/.test(pw))   errors.push("At least one letter");
  if (!/[0-9]/.test(pw))      errors.push("At least one number");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("At least one special character (!@#$%^&*…)");
  return errors;
}

function useRipple() {
  const [ripples, setRipples] = useState([]);
  const add = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  };
  return [ripples, add];
}

// ── Main Login Component ──────────────────────────────────────────────────
// onLoginSuccess(userInfo) is called after successful 2FA verification
export default function MySelfLogin({ onLoginSuccess }) {
  const [fontIdx,    setFontIdx]    = useState(0);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [tab,        setTab]        = useState("login");
  const [showCustom, setShowCustom] = useState(false);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [name,     setName]     = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showCpw,  setShowCpw]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [shake,    setShake]    = useState(false);

  const [step, setStep] = useState(1);
  const [otp,  setOtp]  = useState(["","","","","",""]);
  const otpRefs = useRef([]);

  const font    = FONTS[fontIdx];
  const palette = PALETTES[paletteIdx];
  const strength = evaluatePassword(password);
  const [ripples, addRipple] = useRipple();

  useEffect(() => {
    const id = "gf-link";
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("link"); el.id = id; el.rel = "stylesheet"; document.head.appendChild(el); }
    el.href = `https://fonts.googleapis.com/css2?family=${font.import}&display=swap`;
  }, [font]);

  function validate() {
    const e = {};
    if (!name && tab === "register") e.name = "Name is required";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    const pwErrors = validatePassword(password);
    if (pwErrors.length) e.password = pwErrors[0];
    if (tab === "register" && password !== confirm) e.confirm = "Passwords do not match";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) { setShake(true); setTimeout(()=>setShake(false),500); return; }
    setStep(2);
  }

  function handleOtp(val, idx) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx+1]?.focus();
  }

  function handleOtpKey(e, idx) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx-1]?.focus();
  }

  function handleVerify(e) {
    e.preventDefault();
    if (otp.join("").length === 6) {
      // Call the parent's callback to switch to the front page
      onLoginSuccess({ email, name: name || email.split("@")[0] });
    }
  }

  const vars = {
    "--bg":     palette.bg,
    "--card":   palette.card,
    "--accent": palette.accent,
    "--text":   palette.text,
    "--sub":    palette.sub,
    "--font":   font.value,
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        body { background: var(--bg); }

        .ms-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          font-family: var(--font);
          color: var(--text);
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }

        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: .18;
          animation: drift 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .blob1 { width:420px; height:420px; background:var(--accent); top:-100px; left:-120px; animation-delay:0s; }
        .blob2 { width:300px; height:300px; background:var(--sub);    bottom:-80px; right:-80px; animation-delay:-4s; }
        .blob3 { width:200px; height:200px; background:var(--accent); bottom:30%; left:10%;    animation-delay:-8s; opacity:.10; }
        @keyframes drift { from{transform:translate(0,0) scale(1);} to{transform:translate(40px,30px) scale(1.08);} }

        .card {
          background: var(--card);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 24px;
          padding: 44px 40px 36px;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          box-shadow: 0 32px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04);
          transition: transform .3s;
        }
        @media(max-width:480px){ .card{ padding:32px 22px 28px; } }

        .card.shake { animation: shake .4s ease; }
        @keyframes shake {
          0%,100%{ transform:translateX(0); }
          20%{ transform:translateX(-8px); }
          40%{ transform:translateX(8px); }
          60%{ transform:translateX(-6px); }
          80%{ transform:translateX(6px); }
        }

        .logo-wrap { text-align:center; margin-bottom:28px; }
        .logo-mark {
          display:inline-flex; align-items:center; justify-content:center;
          width:56px; height:56px; border-radius:16px;
          background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, var(--sub)) 100%);
          font-size:24px; font-weight:700; color:#fff;
          margin-bottom:12px;
          box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent);
        }
        .logo-title { font-size:1.7rem; font-weight:700; letter-spacing:-.02em; }
        .logo-title span { color:var(--accent); }
        .logo-sub { font-size:.8rem; color:var(--sub); margin-top:4px; letter-spacing:.08em; text-transform:uppercase; }

        .tabs {
          display:flex; background:rgba(255,255,255,.05); border-radius:12px;
          padding:4px; margin-bottom:28px;
        }
        .tab-btn {
          flex:1; padding:9px 0; border:none; background:transparent;
          color:var(--sub); font-family:var(--font); font-size:.85rem;
          font-weight:600; letter-spacing:.04em; cursor:pointer;
          border-radius:9px; transition:all .25s; text-transform:uppercase;
        }
        .tab-btn.active {
          background:var(--accent); color:var(--bg);
          box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent);
        }

        .field { margin-bottom:18px; position:relative; }
        .field label { display:block; font-size:.75rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--sub); margin-bottom:7px; }
        .input-wrap { position:relative; }
        .field input {
          width:100%; padding:13px 44px 13px 16px;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
          border-radius:12px; color:var(--text); font-family:var(--font); font-size:.95rem;
          outline:none; transition:border-color .2s, box-shadow .2s;
          -webkit-appearance:none;
        }
        .field input:focus {
          border-color:var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .field input.err { border-color:#e85555; }
        .eye-btn {
          position:absolute; right:13px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:var(--sub);
          font-size:16px; line-height:1; padding:2px;
          transition:color .2s;
        }
        .eye-btn:hover { color:var(--text); }
        .err-msg { font-size:.73rem; color:#e85555; margin-top:5px; padding-left:2px; }

        .strength-row { display:flex; align-items:center; gap:8px; margin-top:8px; }
        .strength-bars { display:flex; gap:4px; flex:1; }
        .sbar { flex:1; height:4px; border-radius:4px; background:rgba(255,255,255,.1); transition:background .3s; }
        .strength-label { font-size:.7rem; font-weight:600; min-width:64px; text-align:right; }

        .pw-rules { margin-top:10px; display:flex; flex-wrap:wrap; gap:6px; }
        .pw-rule { font-size:.68rem; padding:3px 8px; border-radius:20px; background:rgba(255,255,255,.06); color:var(--sub); transition:all .2s; }
        .pw-rule.ok { background:color-mix(in srgb,var(--accent) 18%,transparent); color:var(--accent); }

        .submit-btn {
          width:100%; padding:15px; margin-top:6px;
          background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--sub)) 100%);
          border:none; border-radius:14px; color:var(--bg);
          font-family:var(--font); font-size:1rem; font-weight:700;
          letter-spacing:.04em; cursor:pointer;
          box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 30%, transparent);
          transition:transform .15s, box-shadow .15s;
        }
        .submit-btn:hover { transform:translateY(-1px); box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 40%, transparent); }
        .submit-btn:active { transform:translateY(1px); }
        .ripple { position:absolute; border-radius:50%; background:rgba(255,255,255,.3); width:8px; height:8px; transform:scale(0); animation:rippleAnim .6s ease-out forwards; pointer-events:none; }
        @keyframes rippleAnim { to { transform:scale(60); opacity:0; } }

        .divider { display:flex; align-items:center; gap:12px; margin:18px 0; }
        .divider::before,.divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.08); }
        .divider span { font-size:.72rem; color:var(--sub); text-transform:uppercase; letter-spacing:.08em; }

        .social-row { display:flex; gap:10px; }
        .social-btn {
          flex:1; padding:11px; border-radius:12px;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
          color:var(--text); font-family:var(--font); font-size:.82rem;
          font-weight:600; cursor:pointer; transition:all .2s; text-align:center;
        }
        .social-btn:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.2); }

        .custom-toggle {
          position:fixed; top:20px; right:20px; z-index:100;
          background:var(--card); border:1px solid rgba(255,255,255,.12);
          border-radius:12px; padding:10px 16px;
          color:var(--text); font-family:var(--font); font-size:.78rem;
          font-weight:600; cursor:pointer; letter-spacing:.04em;
          box-shadow:0 4px 16px rgba(0,0,0,.3);
          display:flex; align-items:center; gap:7px;
          transition:all .2s;
        }
        .custom-toggle:hover { border-color:var(--accent); }

        .custom-panel {
          position:fixed; top:68px; right:20px; z-index:99;
          background:var(--card); border:1px solid rgba(255,255,255,.1);
          border-radius:16px; padding:20px; width:220px;
          box-shadow:0 16px 40px rgba(0,0,0,.4);
          animation: slideIn .2s ease;
        }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
        .cp-title { font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; color:var(--sub); margin-bottom:12px; font-weight:600; }
        .swatch-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
        .swatch { width:28px; height:28px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:all .15s; box-shadow:0 2px 8px rgba(0,0,0,.3); }
        .swatch.active { border-color:#fff; transform:scale(1.15); }
        .font-option { padding:7px 10px; border-radius:8px; cursor:pointer; font-size:.8rem; margin-bottom:4px; transition:all .15s; border:1px solid transparent; color:var(--text); }
        .font-option:hover { background:rgba(255,255,255,.08); }
        .font-option.active { background:color-mix(in srgb,var(--accent) 20%,transparent); border-color:var(--accent); color:var(--accent); }

        .otp-title { text-align:center; font-size:1.1rem; font-weight:700; margin-bottom:6px; }
        .otp-sub { text-align:center; font-size:.8rem; color:var(--sub); margin-bottom:24px; line-height:1.5; }
        .otp-row { display:flex; gap:10px; justify-content:center; margin-bottom:22px; }
        .otp-box {
          width:46px; height:56px; border-radius:12px;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
          text-align:center; font-family:var(--font); font-size:1.4rem;
          font-weight:700; color:var(--text); outline:none;
          transition:border-color .2s, box-shadow .2s;
          -webkit-appearance:none;
        }
        .otp-box:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 20%,transparent); }

        .sec-badges { display:flex; justify-content:center; gap:14px; margin-top:22px; flex-wrap:wrap; }
        .sec-badge { display:flex; align-items:center; gap:5px; font-size:.68rem; color:var(--sub); }
        .sec-badge span { font-size:13px; }

        .demo-hint {
          text-align:center; font-size:.7rem; color:var(--sub);
          background:rgba(255,255,255,.04); border-radius:10px;
          padding:8px 12px; margin-top:14px; line-height:1.5;
        }
      `}</style>

      <div className="ms-root" style={vars}>
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />

        {/* Customiser toggle */}
        <button className="custom-toggle" onClick={() => setShowCustom(p => !p)}>
          🎨 Customise
        </button>

        {/* Customiser panel */}
        {showCustom && (
          <div className="custom-panel" style={vars}>
            <div className="cp-title">Colour Palette</div>
            <div className="swatch-row">
              {PALETTES.map((p, i) => (
                <div
                  key={p.label}
                  className={`swatch${paletteIdx === i ? " active" : ""}`}
                  title={p.label}
                  style={{ background: p.accent }}
                  onClick={() => setPaletteIdx(i)}
                />
              ))}
            </div>
            <div className="cp-title">Font Style</div>
            {FONTS.map((f, i) => (
              <div
                key={f.label}
                className={`font-option${fontIdx === i ? " active" : ""}`}
                style={{ fontFamily: f.value }}
                onClick={() => setFontIdx(i)}
              >
                {f.label}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className={`card${shake ? " shake" : ""}`} style={vars}>
          {step === 2 ? (
            <>
              <div className="logo-wrap">
                <div className="logo-mark">M</div>
              </div>
              <div className="otp-title">Two-Factor Verification</div>
              <div className="otp-sub">Enter the 6-digit code sent to<br/><strong style={{color:"var(--text)"}}>{email}</strong></div>
              <form onSubmit={handleVerify}>
                <div className="otp-row">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      className="otp-box"
                      maxLength={1}
                      inputMode="numeric"
                      value={d}
                      onChange={e => handleOtp(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                    />
                  ))}
                </div>
                <button type="submit" className="submit-btn" style={{position:"relative",overflow:"hidden"}}>
                  Verify & Enter →
                </button>
              </form>
              <div className="demo-hint">💡 Demo: enter any 6 digits to proceed</div>
              <div className="sec-badges">
                <div className="sec-badge"><span>🔐</span> End-to-End Encrypted</div>
                <div className="sec-badge"><span>⏱️</span> Code expires in 5 min</div>
              </div>
            </>
          ) : (
            <>
              <div className="logo-wrap">
                <div className="logo-mark">M</div>
                <div className="logo-title">My <span>Self</span></div>
                <div className="logo-sub">Your personal space</div>
              </div>

              <div className="tabs">
                <button className={`tab-btn${tab==="login"?" active":""}`} onClick={()=>{setTab("login");setErrors({});}}>Sign In</button>
                <button className={`tab-btn${tab==="register"?" active":""}`} onClick={()=>{setTab("register");setErrors({});}}>Register</button>
              </div>

              <form onSubmit={handleSubmit} autoComplete="off" noValidate>
                {tab === "register" && (
                  <div className="field">
                    <label>Full Name</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className={errors.name ? "err" : ""}
                        autoComplete="off"
                      />
                    </div>
                    {errors.name && <div className="err-msg">⚠ {errors.name}</div>}
                  </div>
                )}

                <div className="field">
                  <label>Email Address</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={errors.email ? "err" : ""}
                      autoComplete="username"
                    />
                  </div>
                  {errors.email && <div className="err-msg">⚠ {errors.email}</div>}
                </div>

                <div className="field">
                  <label>Password <span style={{color:"var(--sub)",fontWeight:400,textTransform:"none",fontSize:".7rem"}}>(8–14 chars, letters + numbers + symbol)</span></label>
                  <div className="input-wrap">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      maxLength={14}
                      onChange={e => setPassword(e.target.value)}
                      className={errors.password ? "err" : ""}
                      autoComplete="new-password"
                    />
                    <button type="button" className="eye-btn" onClick={()=>setShowPw(p=>!p)}>{showPw?"🙈":"👁"}</button>
                  </div>
                  {errors.password && <div className="err-msg">⚠ {errors.password}</div>}

                  {password && (
                    <div className="strength-row">
                      <div className="strength-bars">
                        {[1,2,3,4].map(n => (
                          <div key={n} className="sbar" style={{background: n <= strength.score ? strength.color : undefined}} />
                        ))}
                      </div>
                      <div className="strength-label" style={{color: strength.color}}>{strength.label}</div>
                    </div>
                  )}

                  <div className="pw-rules">
                    {[
                      { label:"8–14 chars",  ok: password.length>=8 && password.length<=14 },
                      { label:"Letter",       ok: /[A-Za-z]/.test(password) },
                      { label:"Number",       ok: /[0-9]/.test(password) },
                      { label:"Symbol",       ok: /[^A-Za-z0-9]/.test(password) },
                    ].map(r => (
                      <div key={r.label} className={`pw-rule${r.ok?" ok":""}`}>{r.ok?"✓ ":""}{r.label}</div>
                    ))}
                  </div>
                </div>

                {tab === "register" && (
                  <div className="field">
                    <label>Confirm Password</label>
                    <div className="input-wrap">
                      <input
                        type={showCpw ? "text" : "password"}
                        placeholder="••••••••••"
                        value={confirm}
                        maxLength={14}
                        onChange={e => setConfirm(e.target.value)}
                        className={errors.confirm ? "err" : ""}
                        autoComplete="new-password"
                      />
                      <button type="button" className="eye-btn" onClick={()=>setShowCpw(p=>!p)}>{showCpw?"🙈":"👁"}</button>
                    </div>
                    {errors.confirm && <div className="err-msg">⚠ {errors.confirm}</div>}
                  </div>
                )}

                <button type="submit" className="submit-btn" onClick={addRipple} style={{position:"relative",overflow:"hidden"}}>
                  {ripples.map(r => (
                    <span key={r.id} className="ripple" style={{left:r.x-4, top:r.y-4}} />
                  ))}
                  {tab === "login" ? "Sign In →" : "Create Account →"}
                </button>
              </form>

              <div className="divider"><span>or continue with</span></div>
              <div className="social-row">
                <button className="social-btn">🌐 Google</button>
                <button className="social-btn"> Apple</button>
                <button className="social-btn">📘 Facebook</button>
              </div>

              <div className="sec-badges">
                <div className="sec-badge"><span>🔒</span> SSL Secured</div>
                <div className="sec-badge"><span>🛡️</span> 2FA Enabled</div>
                <div className="sec-badge"><span>🔐</span> AES-256</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

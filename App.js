import { useState, useEffect, useRef } from "react";

const FONTS = [
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif",  import: "Cormorant+Garamond:wght@400;500;600;700" },
  { label: "Playfair Display",   value: "'Playfair Display', serif",    import: "Playfair+Display:wght@400;600;700" },
  { label: "Josefin Sans",       value: "'Josefin Sans', sans-serif",   import: "Josefin+Sans:wght@300;400;600;700" },
  { label: "Raleway",            value: "'Raleway', sans-serif",         import: "Raleway:wght@300;400;600;700" },
  { label: "DM Serif Display",   value: "'DM Serif Display', serif",    import: "DM+Serif+Display" },
];

const PALETTES = [
  { label:"Obsidian Gold",  bg:"#080810", surface:"#10101e", card:"#161628", accent:"#c8a96e", accent2:"#e8c98e", text:"#f0ece4", sub:"#7a7690", border:"rgba(200,169,110,0.18)" },
  { label:"Crimson Noir",   bg:"#0c0608", surface:"#160a0d", card:"#1f0f14", accent:"#d4607a", accent2:"#f08096", text:"#fdeef2", sub:"#9a6878", border:"rgba(212,96,122,0.18)" },
  { label:"Emerald Depth",  bg:"#050f0c", surface:"#081510", card:"#0e1f18", accent:"#3ecb8c", accent2:"#70e8ac", text:"#e8f8f2", sub:"#427860", border:"rgba(62,203,140,0.18)" },
  { label:"Sapphire Abyss", bg:"#03080f", surface:"#060f1a", card:"#0b1628", accent:"#4aa8e0", accent2:"#78c4f8", text:"#e8f4fc", sub:"#3a6080", border:"rgba(74,168,224,0.18)" },
  { label:"Amethyst Haze",  bg:"#090610", surface:"#0e0918", card:"#160f24", accent:"#9b6ee8", accent2:"#c0a0f8", text:"#f0ecfc", sub:"#60489a", border:"rgba(155,110,232,0.18)" },
];

const COUNTRIES = ["Australia","United States","United Kingdom","Canada","New Zealand","India","Germany","France","Japan","China","Brazil","South Africa","Other"];

const NAV_ITEMS = [
  { icon:"🏠", label:"Home",        id:"home" },
  { icon:"📖", label:"My Story",    id:"story" },
  { icon:"📸", label:"Memories",    id:"memories" },
  { icon:"🗺️", label:"Journey",     id:"journey" },
  { icon:"💭", label:"Reflections", id:"reflections" },
  { icon:"🏆", label:"Milestones",  id:"milestones" },
  { icon:"👥", label:"People",      id:"people" },
  { icon:"⚙️", label:"Settings",    id:"settings" },
];

const PROFILE_STEPS = [
  {
    title: "Who Are You?",
    subtitle: "Let's start with your name — the first chapter of your story.",
    fields: [
      { id:"firstName",  label:"First Name",   placeholder:"e.g. James",        required:true,  type:"text" },
      { id:"middleName", label:"Middle Name",   placeholder:"e.g. Robert",       required:false, type:"text" },
      { id:"lastName",   label:"Surname",       placeholder:"e.g. Mitchell",     required:true,  type:"text" },
      { id:"preferredName",label:"Preferred / Nickname", placeholder:"What friends call you", required:false, type:"text" },
    ]
  },
  {
    title: "Your Origins",
    subtitle: "Where and when your journey began.",
    fields: [
      { id:"dob",        label:"Date of Birth", placeholder:"",                  required:true,  type:"date" },
      { id:"birthPlace", label:"Birth City / Town", placeholder:"e.g. Sydney",  required:false, type:"text" },
      { id:"birthCountry",label:"Birth Country", placeholder:"",                required:false, type:"select", options:COUNTRIES },
      { id:"nationality",label:"Nationality",    placeholder:"e.g. Australian", required:false, type:"text" },
      { id:"gender",     label:"Gender",         placeholder:"",                required:false, type:"select", options:["Prefer not to say","Male","Female","Non-binary","Other"] },
      { id:"pronouns",   label:"Pronouns",       placeholder:"e.g. he/him",     required:false, type:"text" },
    ]
  },
  {
    title: "Where You Live",
    subtitle: "Your current home base.",
    fields: [
      { id:"addressLine1",label:"Street Address",  placeholder:"123 Example St", required:false, type:"text" },
      { id:"addressLine2",label:"Suburb / Unit",   placeholder:"",               required:false, type:"text" },
      { id:"city",        label:"City",             placeholder:"e.g. Melbourne", required:false, type:"text" },
      { id:"state",       label:"State / Province", placeholder:"e.g. VIC",       required:false, type:"text" },
      { id:"postcode",    label:"Postcode / ZIP",   placeholder:"",               required:false, type:"text" },
      { id:"country",     label:"Country",          placeholder:"",               required:false, type:"select", options:COUNTRIES },
    ]
  },
  {
    title: "About You",
    subtitle: "A little more colour — all optional.",
    fields: [
      { id:"occupation",  label:"Occupation / Role",  placeholder:"e.g. Teacher, Engineer…", required:false, type:"text" },
      { id:"education",   label:"Highest Education",   placeholder:"",                        required:false, type:"select", options:["Primary","Secondary","Certificate","Diploma","Bachelor","Master","PhD","Other"] },
      { id:"maritalStatus",label:"Marital Status",    placeholder:"",                        required:false, type:"select", options:["Single","In a relationship","Married","Divorced","Widowed","Prefer not to say"] },
      { id:"religion",    label:"Religion / Belief",  placeholder:"e.g. Buddhist, Agnostic", required:false, type:"text" },
      { id:"languages",   label:"Languages Spoken",   placeholder:"e.g. English, Hindi",    required:false, type:"text" },
      { id:"bio",         label:"A sentence about you",placeholder:"Write anything…",        required:false, type:"textarea" },
    ]
  },
];

// ── Main FrontPage Component ──────────────────────────────────────────────
// onLogout() is called when the user clicks Sign Out — returns to login screen
export default function MySelfFrontPage({ onLogout, loggedInUser }) {
  const [fontIdx,      setFontIdx]      = useState(0);
  const [paletteIdx,   setPaletteIdx]   = useState(0);
  const [showCustom,   setShowCustom]   = useState(false);
  const [profileDone,  setProfileDone]  = useState(false);
  const [activeNav,    setActiveNav]    = useState("home");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [profileStep,  setProfileStep]  = useState(0);
  const [formData,     setFormData]     = useState({});
  const [photoSrc,     setPhotoSrc]     = useState(null);
  const [errors,       setErrors]       = useState({});
  const [saveAnim,     setSaveAnim]     = useState(false);
  const [writingText,  setWritingText]  = useState("");
  const [wordCount,    setWordCount]    = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fileRef  = useRef();
  const videoRef = useRef();
  const canvasRef= useRef();
  const [cameraOn,setCameraOn] = useState(false);

  const font    = FONTS[fontIdx];
  const palette = PALETTES[paletteIdx];

  useEffect(() => {
    const id = "gf-ms2";
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("link"); el.id = id; el.rel="stylesheet"; document.head.appendChild(el); }
    el.href = `https://fonts.googleapis.com/css2?family=${font.import}&display=swap`;
  }, [font]);

  useEffect(() => {
    setWordCount(writingText.trim() ? writingText.trim().split(/\s+/).length : 0);
  }, [writingText]);

  const vars = {
    "--bg":      palette.bg,
    "--surface": palette.surface,
    "--card":    palette.card,
    "--accent":  palette.accent,
    "--accent2": palette.accent2,
    "--text":    palette.text,
    "--sub":     palette.sub,
    "--border":  palette.border,
    "--font":    font.value,
  };

  function handleFilePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoSrc(ev.target.result);
    reader.readAsDataURL(f);
    setCameraOn(false);
  }

  async function startCamera() {
    setCameraOn(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCameraOn(false); }
  }

  function snapPhoto() {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v,0,0);
    setPhotoSrc(c.toDataURL("image/jpeg"));
    v.srcObject?.getTracks().forEach(t=>t.stop());
    setCameraOn(false);
  }

  function setField(id, val) { setFormData(p=>({...p,[id]:val})); }

  function validateStep() {
    const step = PROFILE_STEPS[profileStep];
    const errs = {};
    step.fields.filter(f=>f.required).forEach(f => {
      if (!formData[f.id]?.trim()) errs[f.id] = `${f.label} is required`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (!validateStep()) return;
    if (profileStep < PROFILE_STEPS.length) setProfileStep(p=>p+1);
  }

  function finishProfile() {
    setSaveAnim(true);
    setTimeout(() => { setSaveAnim(false); setProfileDone(true); }, 1800);
  }

  function handleLogout() {
    setShowLogoutConfirm(false);
    onLogout();
  }

  // ── PROFILE SETUP WIZARD ─────────────────────────────────────────────────
  if (!profileDone) {
    const isPhotoStep = profileStep === PROFILE_STEPS.length;
    const currentStep = PROFILE_STEPS[profileStep];
    const progress = ((profileStep) / (PROFILE_STEPS.length)) * 100;

    return (
      <>
        <style>{globalStyles(palette, font)}</style>
        <div className="ms-root" style={vars}>
          <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>
          <CustomPanel show={showCustom} toggle={()=>setShowCustom(p=>!p)} fontIdx={fontIdx} setFontIdx={setFontIdx} paletteIdx={paletteIdx} setPaletteIdx={setPaletteIdx} vars={vars}/>

          <div className="wizard-wrap">
            <div className="wizard-header">
              <div className="wiz-logo">
                <span className="wiz-mark">M</span>
                <span className="wiz-name">My <em>Self</em></span>
              </div>
              <div className="wiz-tagline">Your life, beautifully documented.</div>
            </div>

            <div className="progress-track">
              {[...PROFILE_STEPS, {title:"Photo"}].map((s,i)=>(
                <div key={i} className={`prog-step ${i<profileStep?"done":""} ${i===profileStep?"active":""}`}>
                  <div className="prog-dot">{i<profileStep?"✓":(i+1)}</div>
                  <div className="prog-label">{s.title.split(" ")[0]}</div>
                </div>
              ))}
              <div className="prog-bar-track">
                <div className="prog-bar-fill" style={{width:`${isPhotoStep?100:progress}%`}}/>
              </div>
            </div>

            <div className="wizard-card card3d">
              {saveAnim ? (
                <div className="save-anim">
                  <div className="save-ring"/>
                  <div className="save-check">✓</div>
                  <div className="save-text">Saving your profile…</div>
                </div>
              ) : isPhotoStep ? (
                <>
                  <div className="step-title">Your Profile Photo</div>
                  <div className="step-sub">A face to your story — optional but personal.</div>
                  <div className="photo-center">
                    <div className="photo-preview card3d">
                      {photoSrc
                        ? <img src={photoSrc} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                        : <div className="photo-placeholder">👤</div>
                      }
                    </div>
                    {cameraOn
                      ? <div className="camera-box">
                          <video ref={videoRef} autoPlay playsInline className="camera-feed"/>
                          <canvas ref={canvasRef} style={{display:"none"}}/>
                          <button className="btn-3d accent" onClick={snapPhoto}>📸 Snap</button>
                          <button className="btn-3d ghost" onClick={()=>setCameraOn(false)}>Cancel</button>
                        </div>
                      : <div className="photo-btns">
                          <button className="btn-3d accent" onClick={()=>fileRef.current.click()}>⬆ Upload Photo</button>
                          <button className="btn-3d ghost"  onClick={startCamera}>📷 Take Photo</button>
                          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFilePhoto}/>
                        </div>
                    }
                  </div>
                  <div className="wiz-footer">
                    <button className="btn-3d ghost" onClick={()=>setProfileStep(p=>p-1)}>← Back</button>
                    <button className="btn-3d accent" onClick={finishProfile}>
                      {photoSrc ? "Complete Profile →" : "Skip & Finish →"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="step-title">{currentStep.title}</div>
                  <div className="step-sub">{currentStep.subtitle}</div>
                  <div className="fields-grid">
                    {currentStep.fields.map(f => (
                      <div key={f.id} className={`wiz-field ${f.type==="textarea"?"full":""}`}>
                        <label className="wiz-label">
                          {f.label}
                          {f.required && <span className="req-dot"> *</span>}
                          {!f.required && <span className="opt-tag"> optional</span>}
                        </label>
                        {f.type==="select" ? (
                          <select
                            className={`wiz-input card3d ${errors[f.id]?"inp-err":""}`}
                            value={formData[f.id]||""}
                            onChange={e=>setField(f.id,e.target.value)}
                          >
                            <option value="">— select —</option>
                            {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : f.type==="textarea" ? (
                          <textarea
                            className={`wiz-input wiz-textarea card3d ${errors[f.id]?"inp-err":""}`}
                            placeholder={f.placeholder}
                            value={formData[f.id]||""}
                            onChange={e=>setField(f.id,e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <input
                            className={`wiz-input card3d ${errors[f.id]?"inp-err":""}`}
                            type={f.type}
                            placeholder={f.placeholder}
                            value={formData[f.id]||""}
                            onChange={e=>setField(f.id,e.target.value)}
                          />
                        )}
                        {errors[f.id] && <div className="inp-err-msg">⚠ {errors[f.id]}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="wiz-footer">
                    {profileStep > 0 && <button className="btn-3d ghost" onClick={()=>{setProfileStep(p=>p-1);setErrors({});}}>← Back</button>}
                    <button className="btn-3d accent" onClick={nextStep}>
                      {profileStep < PROFILE_STEPS.length-1 ? "Continue →" : "Next: Photo →"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="wiz-step-label">Step {Math.min(profileStep+1, PROFILE_STEPS.length+1)} of {PROFILE_STEPS.length+1}</div>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN FRONT PAGE ──────────────────────────────────────────────────────
  const displayName = `${formData.firstName||loggedInUser?.name||"Friend"} ${formData.lastName||""}`.trim();
  const initials = `${(formData.firstName||loggedInUser?.name||"M")[0]}${(formData.lastName||"S")[0]}`.toUpperCase();

  return (
    <>
      <style>{globalStyles(palette, font)}</style>
      <div className="ms-root" style={vars}>
        <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>

        <CustomPanel show={showCustom} toggle={()=>setShowCustom(p=>!p)} fontIdx={fontIdx} setFontIdx={setFontIdx} paletteIdx={paletteIdx} setPaletteIdx={setPaletteIdx} vars={vars}/>

        {/* ── Logout Confirmation Modal ── */}
        {showLogoutConfirm && (
          <div className="logout-overlay" onClick={()=>setShowLogoutConfirm(false)}>
            <div className="logout-modal card3d" style={vars} onClick={e=>e.stopPropagation()}>
              <div className="logout-icon">👋</div>
              <div className="logout-title">Sign Out?</div>
              <div className="logout-sub">You'll be returned to the login screen. Your data is safe.</div>
              <div className="logout-btns">
                <button className="btn-3d ghost" onClick={()=>setShowLogoutConfirm(false)}>Cancel</button>
                <button className="btn-3d logout-confirm-btn" onClick={handleLogout}>Yes, Sign Out</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen?"open":"closed"}`}>
          <div className="sidebar-logo">
            <span className="wiz-mark sm">M</span>
            {sidebarOpen && <span className="wiz-name">My <em>Self</em></span>}
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(n=>(
              <button
                key={n.id}
                className={`nav-item card3d ${activeNav===n.id?"nav-active":""}`}
                onClick={()=>setActiveNav(n.id)}
              >
                <span className="nav-icon">{n.icon}</span>
                {sidebarOpen && <span className="nav-label">{n.label}</span>}
              </button>
            ))}
          </nav>

          {/* ── Sign Out button in sidebar ── */}
          <button
            className="nav-item signout-btn card3d"
            onClick={()=>setShowLogoutConfirm(true)}
            title="Sign Out"
          >
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Sign Out</span>}
          </button>

          <button className="sidebar-toggle card3d" onClick={()=>setSidebarOpen(p=>!p)}>
            {sidebarOpen?"◀":"▶"}
          </button>
        </aside>

        {/* ── Main ── */}
        <main className="main-content">

          {/* Top bar */}
          <header className="topbar card3d">
            <div className="topbar-left">
              <div className="page-title">{NAV_ITEMS.find(n=>n.id===activeNav)?.icon} {NAV_ITEMS.find(n=>n.id===activeNav)?.label}</div>
              <div className="page-date">{new Date().toLocaleDateString("en-AU",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
            <div className="topbar-right">
              <button className="topbar-btn card3d" title="Search">🔍</button>
              <button className="topbar-btn card3d" title="Notifications">🔔<span className="notif-dot"/></button>
              {/* Logout button in topbar */}
              <button
                className="topbar-btn card3d topbar-logout"
                title="Sign Out"
                onClick={()=>setShowLogoutConfirm(true)}
              >
                🚪
              </button>
              <div className="avatar-wrap card3d">
                {photoSrc
                  ? <img src={photoSrc} alt="" className="topbar-avatar-img"/>
                  : <div className="topbar-avatar-initials">{initials}</div>
                }
              </div>
            </div>
          </header>

          {/* ── HOME content ── */}
          {activeNav==="home" && (
            <div className="home-content">
              <div className="hero-banner card3d">
                <div className="hero-bg-text">MY SELF</div>
                <div className="hero-inner">
                  <div className="hero-avatar card3d">
                    {photoSrc
                      ? <img src={photoSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                      : <div style={{fontSize:"2.5rem"}}>{initials}</div>
                    }
                  </div>
                  <div className="hero-text">
                    <div className="hero-greeting">Welcome back,</div>
                    <div className="hero-name">{displayName}</div>
                    {formData.bio && <div className="hero-bio">"{formData.bio}"</div>}
                    <div className="hero-chips">
                      {formData.birthPlace && <span className="chip card3d">📍 {formData.birthPlace}</span>}
                      {formData.occupation && <span className="chip card3d">💼 {formData.occupation}</span>}
                      {formData.dob && <span className="chip card3d">🎂 {new Date(formData.dob).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-row">
                {[
                  { icon:"📖", val:"0",  label:"Stories",     color:palette.accent },
                  { icon:"📸", val:"0",  label:"Memories",    color:"#d4607a" },
                  { icon:"🏆", val:"0",  label:"Milestones",  color:"#4ecb8c" },
                  { icon:"👥", val:"0",  label:"People",      color:"#4aa8e0" },
                ].map(s=>(
                  <div key={s.label} className="stat-card card3d">
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-val" style={{color:s.color}}>{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="lower-grid">
                <div className="writing-panel card3d">
                  <div className="panel-header">
                    <div className="panel-title">✍️ Write Your Story</div>
                    <div className="panel-sub">What's on your mind today?</div>
                  </div>
                  <div className="writing-toolbar card3d">
                    {["B","I","U","H1","H2","≡","—","🔗","📷"].map(t=>(
                      <button key={t} className="toolbar-btn card3d" title={t}>{t}</button>
                    ))}
                  </div>
                  <textarea
                    className="writing-area card3d"
                    placeholder="Begin your story here… Every word is a piece of who you are."
                    value={writingText}
                    onChange={e=>setWritingText(e.target.value)}
                  />
                  <div className="writing-footer">
                    <span className="word-count">{wordCount} words</span>
                    <div className="writing-actions">
                      <button className="btn-3d ghost sm">💾 Save Draft</button>
                      <button className="btn-3d accent sm">✓ Publish Entry</button>
                    </div>
                  </div>
                </div>

                <div className="quick-col">
                  <div className="quick-title">Quick Actions</div>
                  {[
                    { icon:"📸", label:"Add Memory",      desc:"Photo or video moment" },
                    { icon:"🏆", label:"Add Milestone",   desc:"Life achievement" },
                    { icon:"🗺️", label:"Add Journey",     desc:"Travel or move" },
                    { icon:"👤", label:"Add Person",      desc:"Someone special" },
                    { icon:"💭", label:"Daily Reflection",desc:"Today's thoughts" },
                  ].map(a=>(
                    <button key={a.label} className="quick-card card3d">
                      <span className="quick-icon">{a.icon}</span>
                      <div className="quick-text">
                        <div className="quick-label">{a.label}</div>
                        <div className="quick-desc">{a.desc}</div>
                      </div>
                      <span className="quick-arrow">→</span>
                    </button>
                  ))}

                  <div className="complete-card card3d">
                    <div className="complete-title">Profile Complete</div>
                    <div className="complete-bar-track">
                      <div className="complete-bar-fill" style={{width:`${Math.min(100,Object.keys(formData).length*8)}%`}}/>
                    </div>
                    <div className="complete-pct">{Math.min(100,Object.keys(formData).length*8)}%</div>
                    <button className="btn-3d ghost sm" style={{marginTop:10,width:"100%"}} onClick={()=>setProfileDone(false)}>
                      ✏️ Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav!=="home" && (
            <div className="placeholder-page card3d">
              <div className="ph-icon">{NAV_ITEMS.find(n=>n.id===activeNav)?.icon}</div>
              <div className="ph-title">{NAV_ITEMS.find(n=>n.id===activeNav)?.label}</div>
              <div className="ph-sub">This section is coming in the next stage. Your {NAV_ITEMS.find(n=>n.id===activeNav)?.label.toLowerCase()} will live here.</div>
              <button className="btn-3d accent" onClick={()=>setActiveNav("home")}>← Back to Home</button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ── Customiser Panel ──────────────────────────────────────────────────────
function CustomPanel({show, toggle, fontIdx, setFontIdx, paletteIdx, setPaletteIdx, vars}) {
  return (
    <>
      <button className="custom-toggle card3d" onClick={toggle} style={vars}>🎨 Theme</button>
      {show && (
        <div className="custom-panel card3d" style={vars}>
          <div className="cp-section-title">Colour Palette</div>
          <div className="swatch-row">
            {PALETTES.map((p,i)=>(
              <div key={p.label} className={`swatch ${paletteIdx===i?"active":""}`}
                title={p.label} style={{background:p.accent}}
                onClick={()=>setPaletteIdx(i)}/>
            ))}
          </div>
          <div className="cp-section-title">Font Style</div>
          {FONTS.map((f,i)=>(
            <div key={f.label} className={`font-option ${fontIdx===i?"active":""}`}
              style={{fontFamily:f.value}} onClick={()=>setFontIdx(i)}>
              {f.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Global Styles ─────────────────────────────────────────────────────────
function globalStyles(palette, font) {
  return `
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

    .ms-root {
      min-height:100vh; display:flex;
      background:var(--bg); font-family:var(--font); color:var(--text);
      overflow-x:hidden; position:relative;
    }

    .blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; }
    .b1 { width:500px;height:500px;background:var(--accent);top:-160px;left:-160px;opacity:.12;animation:drift1 14s ease-in-out infinite alternate; }
    .b2 { width:350px;height:350px;background:var(--sub);bottom:-100px;right:-100px;opacity:.10;animation:drift2 18s ease-in-out infinite alternate; }
    .b3 { width:250px;height:250px;background:var(--accent2);top:40%;left:40%;opacity:.06;animation:drift1 22s ease-in-out infinite alternate-reverse; }
    @keyframes drift1 { from{transform:translate(0,0) scale(1);} to{transform:translate(50px,40px) scale(1.1);} }
    @keyframes drift2 { from{transform:translate(0,0) scale(1);} to{transform:translate(-40px,50px) scale(1.08);} }

    .card3d {
      box-shadow: 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 -1px 0 0 rgba(0,0,0,0.4) inset, 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25);
      transform-style: preserve-3d;
      transition: box-shadow .2s, transform .15s;
    }
    .card3d:hover {
      box-shadow: 0 1px 0 0 rgba(255,255,255,0.09) inset, 0 -1px 0 0 rgba(0,0,0,0.5) inset, 0 16px 48px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px var(--border);
      transform: translateY(-2px);
    }

    .btn-3d {
      display:inline-flex; align-items:center; gap:8px;
      padding:13px 24px; border:none; border-radius:14px;
      font-family:var(--font); font-size:.9rem; font-weight:600;
      cursor:pointer; letter-spacing:.03em; position:relative;
      transition:all .18s; white-space:nowrap;
    }
    .btn-3d.accent {
      background:linear-gradient(160deg,var(--accent2) 0%,var(--accent) 100%);
      color:var(--bg);
      box-shadow: 0 4px 0 color-mix(in srgb,var(--accent) 40%,black), 0 8px 20px color-mix(in srgb,var(--accent) 30%,transparent), 0 1px 0 rgba(255,255,255,.2) inset;
    }
    .btn-3d.accent:hover { transform:translateY(-2px); box-shadow:0 6px 0 color-mix(in srgb,var(--accent) 40%,black),0 12px 28px color-mix(in srgb,var(--accent) 40%,transparent); }
    .btn-3d.accent:active { transform:translateY(2px); box-shadow:0 2px 0 color-mix(in srgb,var(--accent) 40%,black); }
    .btn-3d.ghost {
      background:rgba(255,255,255,.06); color:var(--text);
      border:1px solid rgba(255,255,255,.12);
      box-shadow:0 4px 0 rgba(0,0,0,.3),0 8px 20px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset;
    }
    .btn-3d.ghost:hover { background:rgba(255,255,255,.1); transform:translateY(-2px); }
    .btn-3d.ghost:active { transform:translateY(2px); }
    .btn-3d.sm { padding:9px 16px; font-size:.8rem; border-radius:10px; }

    /* Logout confirm button */
    .btn-3d.logout-confirm-btn {
      background:linear-gradient(160deg,#e85555,#c83030);
      color:#fff;
      box-shadow:0 4px 0 rgba(200,48,48,0.5),0 8px 20px rgba(232,85,85,0.3);
    }
    .btn-3d.logout-confirm-btn:hover { transform:translateY(-2px); }

    /* Logout overlay & modal */
    .logout-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.65);
      display:flex; align-items:center; justify-content:center;
      z-index:999; backdrop-filter:blur(6px);
      animation:fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
    .logout-modal {
      background:var(--card); border:1px solid var(--border);
      border-radius:24px; padding:40px 36px; max-width:360px; width:90%;
      text-align:center; display:flex; flex-direction:column; align-items:center; gap:14px;
      animation:slideUp .25s ease;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
    .logout-icon { font-size:3rem; }
    .logout-title { font-size:1.4rem; font-weight:700; }
    .logout-sub { font-size:.85rem; color:var(--sub); line-height:1.5; }
    .logout-btns { display:flex; gap:12px; margin-top:8px; }

    /* Topbar logout hint */
    .topbar-logout { color:#e88585 !important; }
    .topbar-logout:hover { background:rgba(232,85,85,.15) !important; }

    /* Customiser */
    .custom-toggle {
      position:fixed; top:20px; right:20px; z-index:200;
      background:var(--card); border:1px solid var(--border);
      border-radius:14px; padding:10px 18px;
      color:var(--text); font-family:var(--font); font-size:.78rem; font-weight:600;
      cursor:pointer; letter-spacing:.04em; display:flex; align-items:center; gap:8px;
      transition:all .2s;
    }
    .custom-toggle:hover { border-color:var(--accent); }
    .custom-panel {
      position:fixed; top:68px; right:20px; z-index:199;
      background:var(--card); border:1px solid var(--border);
      border-radius:18px; padding:22px; width:230px;
      animation:slideIn .2s ease;
    }
    @keyframes slideIn { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
    .cp-section-title { font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; color:var(--sub); margin-bottom:10px; font-weight:700; margin-top:14px; }
    .cp-section-title:first-child { margin-top:0; }
    .swatch-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:4px; }
    .swatch { width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,.3); }
    .swatch.active { border-color:#fff; transform:scale(1.18); }
    .font-option { padding:8px 10px;border-radius:9px;cursor:pointer;font-size:.8rem;margin-bottom:4px;transition:all .15s;border:1px solid transparent;color:var(--text); }
    .font-option:hover { background:rgba(255,255,255,.08); }
    .font-option.active { background:color-mix(in srgb,var(--accent) 18%,transparent);border-color:var(--accent);color:var(--accent); }

    /* ══ WIZARD ══ */
    .wizard-wrap { width:100%;max-width:700px;margin:0 auto;padding:30px 20px 60px;z-index:1;position:relative; }
    .wizard-header { text-align:center; margin-bottom:32px; }
    .wiz-logo { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:8px; }
    .wiz-mark {
      width:48px;height:48px;border-radius:14px;
      background:linear-gradient(135deg,var(--accent2),var(--accent));
      display:flex;align-items:center;justify-content:center;
      font-size:22px;font-weight:800;color:var(--bg);
      box-shadow:0 4px 0 color-mix(in srgb,var(--accent) 40%,black),0 8px 20px color-mix(in srgb,var(--accent) 30%,transparent);
    }
    .wiz-mark.sm { width:36px;height:36px;border-radius:10px;font-size:16px; }
    .wiz-name { font-size:1.8rem; font-weight:700; letter-spacing:-.02em; }
    .wiz-name em { color:var(--accent); font-style:normal; }
    .wiz-tagline { font-size:.82rem; color:var(--sub); letter-spacing:.1em; text-transform:uppercase; }

    .progress-track { display:flex; align-items:flex-start; justify-content:center; gap:0; margin-bottom:28px; position:relative; }
    .prog-bar-track { position:absolute;top:14px;left:50px;right:50px;height:2px;background:rgba(255,255,255,.08);z-index:0; }
    .prog-bar-fill { height:100%;background:var(--accent);transition:width .4s ease; }
    .prog-step { display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;position:relative;z-index:1; }
    .prog-dot {
      width:30px;height:30px;border-radius:50%;
      background:var(--surface);border:2px solid rgba(255,255,255,.12);
      display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;
      transition:all .3s;
    }
    .prog-step.active .prog-dot { border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent); }
    .prog-step.done .prog-dot { background:var(--accent);border-color:var(--accent);color:var(--bg); }
    .prog-label { font-size:.65rem;color:var(--sub);font-weight:600;letter-spacing:.04em;text-transform:uppercase; }
    .prog-step.active .prog-label { color:var(--accent); }

    .wizard-card { background:var(--card);border:1px solid var(--border);border-radius:24px;padding:36px 40px; }
    @media(max-width:560px){ .wizard-card{ padding:24px 18px; } }
    .step-title { font-size:1.6rem;font-weight:700;margin-bottom:6px; }
    .step-sub { font-size:.85rem;color:var(--sub);margin-bottom:28px;line-height:1.5; }
    .wiz-step-label { text-align:center;font-size:.75rem;color:var(--sub);margin-top:16px; }

    .fields-grid { display:grid;grid-template-columns:1fr 1fr;gap:18px 20px;margin-bottom:28px; }
    @media(max-width:560px){ .fields-grid{ grid-template-columns:1fr; } }
    .wiz-field { display:flex;flex-direction:column; }
    .wiz-field.full { grid-column:1/-1; }
    .wiz-label { font-size:.72rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--sub);margin-bottom:7px; }
    .req-dot { color:var(--accent); }
    .opt-tag { font-size:.65rem;font-weight:400;letter-spacing:.03em;text-transform:none;color:color-mix(in srgb,var(--sub) 70%,transparent); }
    .wiz-input {
      background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
      border-radius:12px;padding:12px 14px;
      color:var(--text);font-family:var(--font);font-size:.92rem;
      outline:none;transition:border-color .2s,box-shadow .2s;
      -webkit-appearance:none; appearance:none;
    }
    .wiz-input:focus { border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent); }
    .wiz-input.inp-err { border-color:#e85555; }
    .wiz-textarea { resize:vertical;min-height:80px; }
    .inp-err-msg { font-size:.7rem;color:#e85555;margin-top:4px; }
    .wiz-footer { display:flex;justify-content:space-between;align-items:center;gap:12px; }

    .photo-center { display:flex;flex-direction:column;align-items:center;gap:20px;margin:24px 0; }
    .photo-preview { width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.06);border:3px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:3rem;overflow:hidden; }
    .photo-placeholder { opacity:.4; }
    .photo-btns { display:flex;gap:12px;flex-wrap:wrap;justify-content:center; }
    .camera-box { display:flex;flex-direction:column;align-items:center;gap:12px; }
    .camera-feed { width:280px;border-radius:16px;border:2px solid var(--border); }

    .save-anim { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;gap:18px; }
    .save-ring { width:70px;height:70px;border-radius:50%;border:3px solid rgba(255,255,255,.1);border-top-color:var(--accent);animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg);} }
    .save-check { font-size:2.5rem;animation:pop .4s cubic-bezier(.36,1.3,.4,1); }
    @keyframes pop { from{transform:scale(0);} to{transform:scale(1);} }
    .save-text { font-size:.9rem;color:var(--sub); }

    /* ══ MAIN LAYOUT ══ */
    .sidebar {
      position:fixed;left:0;top:0;bottom:0;z-index:100;
      background:var(--surface);border-right:1px solid var(--border);
      display:flex;flex-direction:column;gap:0;
      transition:width .25s ease;padding:20px 12px;
    }
    .sidebar.open  { width:220px; }
    .sidebar.closed{ width:68px; }
    .sidebar-logo { display:flex;align-items:center;gap:10px;margin-bottom:28px;padding:0 4px; }
    .sidebar-nav { flex:1;display:flex;flex-direction:column;gap:6px; }
    .nav-item {
      display:flex;align-items:center;gap:12px;
      background:transparent;border:1px solid transparent;border-radius:12px;
      padding:11px 10px;cursor:pointer;color:var(--sub);
      font-family:var(--font);font-size:.85rem;font-weight:600;
      transition:all .18s;white-space:nowrap;overflow:hidden;
    }
    .nav-item:hover { background:rgba(255,255,255,.06);color:var(--text); }
    .nav-active {
      background:color-mix(in srgb,var(--accent) 14%,transparent) !important;
      border-color:var(--border) !important; color:var(--accent) !important;
      box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 12%,transparent),0 2px 0 rgba(0,0,0,.3);
    }
    .nav-icon { font-size:1.1rem; min-width:20px; text-align:center; }
    .nav-label { flex:1;text-align:left; }

    /* Sign out nav item */
    .signout-btn { color:#e88585 !important; margin-top:8px; }
    .signout-btn:hover { background:rgba(232,85,85,.12) !important; color:#ff9999 !important; }

    .sidebar-toggle {
      background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
      border-radius:10px;padding:10px;color:var(--sub);cursor:pointer;
      font-size:.75rem;margin-top:10px;transition:all .2s;
    }
    .sidebar-toggle:hover { color:var(--text); }

    .main-content {
      flex:1;display:flex;flex-direction:column;min-height:100vh;
      transition:margin-left .25s;
      position:relative;z-index:1;
    }
    .sidebar.open  ~ .main-content { margin-left:220px; }
    .sidebar.closed~ .main-content { margin-left:68px; }
    @media(max-width:640px){ .sidebar{ display:none; } .main-content{ margin-left:0 !important; } }

    .topbar {
      background:var(--surface);border-bottom:1px solid var(--border);
      padding:14px 28px;display:flex;align-items:center;justify-content:space-between;
      gap:16px;position:sticky;top:0;z-index:50;border-radius:0;
    }
    .topbar-left { display:flex;flex-direction:column;gap:2px; }
    .page-title { font-size:1.15rem;font-weight:700;letter-spacing:-.01em; }
    .page-date { font-size:.72rem;color:var(--sub); }
    .topbar-right { display:flex;align-items:center;gap:10px; }
    .topbar-btn {
      width:38px;height:38px;border-radius:10px;border:none;
      background:rgba(255,255,255,.06);color:var(--text);
      cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;
      position:relative;transition:all .15s;
    }
    .topbar-btn:hover { background:rgba(255,255,255,.1); }
    .notif-dot { position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent); }
    .avatar-wrap {
      width:38px;height:38px;border-radius:50%;overflow:hidden;
      background:linear-gradient(135deg,var(--accent2),var(--accent));
      display:flex;align-items:center;justify-content:center;
      font-size:.8rem;font-weight:800;color:var(--bg);cursor:pointer;
    }
    .topbar-avatar-img { width:100%;height:100%;object-fit:cover; }
    .topbar-avatar-initials { font-size:.78rem;font-weight:800;color:var(--bg); }

    .home-content { padding:24px 28px;display:flex;flex-direction:column;gap:22px; }
    @media(max-width:640px){ .home-content{ padding:16px; } }

    .hero-banner { background:var(--card);border:1px solid var(--border);border-radius:22px;padding:32px 36px;position:relative;overflow:hidden; }
    .hero-bg-text { position:absolute;right:-20px;top:50%;transform:translateY(-50%);font-size:7rem;font-weight:900;letter-spacing:.2em;color:rgba(255,255,255,.03);pointer-events:none;white-space:nowrap;font-style:italic; }
    .hero-inner { display:flex;align-items:center;gap:26px;position:relative;z-index:1; }
    @media(max-width:560px){ .hero-inner{ flex-direction:column;text-align:center; } }
    .hero-avatar { width:90px;height:90px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;align-items:center;justify-content:center;font-size:2rem;border:3px solid var(--border);overflow:hidden; }
    .hero-greeting { font-size:.82rem;color:var(--sub);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px; }
    .hero-name { font-size:2rem;font-weight:700;letter-spacing:-.02em;line-height:1.1;margin-bottom:10px; }
    .hero-bio { font-size:.88rem;color:var(--sub);font-style:italic;margin-bottom:12px;line-height:1.5; }
    .hero-chips { display:flex;flex-wrap:wrap;gap:8px; }
    .chip { background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:20px;padding:5px 12px;font-size:.75rem;color:var(--sub); }

    .stat-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
    @media(max-width:700px){ .stat-row{ grid-template-columns:repeat(2,1fr); } }
    .stat-card { background:var(--card);border:1px solid var(--border);border-radius:18px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:6px; }
    .stat-icon { font-size:1.6rem; }
    .stat-val { font-size:1.8rem;font-weight:800; }
    .stat-label { font-size:.72rem;color:var(--sub);text-transform:uppercase;letter-spacing:.07em; }

    .lower-grid { display:grid;grid-template-columns:1fr 300px;gap:20px; }
    @media(max-width:900px){ .lower-grid{ grid-template-columns:1fr; } }

    .writing-panel { background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:14px; }
    .panel-header { display:flex;flex-direction:column;gap:4px; }
    .panel-title { font-size:1.05rem;font-weight:700; }
    .panel-sub { font-size:.78rem;color:var(--sub); }
    .writing-toolbar { display:flex;gap:6px;flex-wrap:wrap;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 10px; }
    .toolbar-btn { width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:var(--text);cursor:pointer;font-family:var(--font);font-size:.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .15s; }
    .toolbar-btn:hover { background:var(--accent);color:var(--bg); }
    .writing-area { flex:1;min-height:200px;resize:vertical;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;color:var(--text);font-family:var(--font);font-size:.95rem;line-height:1.75;outline:none;transition:border-color .2s,box-shadow .2s; }
    .writing-area:focus { border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent); }
    .writing-area::placeholder { color:var(--sub);opacity:.7; }
    .writing-footer { display:flex;align-items:center;justify-content:space-between;gap:10px; }
    .word-count { font-size:.75rem;color:var(--sub); }
    .writing-actions { display:flex;gap:10px; }

    .quick-col { display:flex;flex-direction:column;gap:10px; }
    .quick-title { font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sub);padding:0 2px; }
    .quick-card { background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;color:var(--text);font-family:var(--font);text-align:left;transition:all .18s; }
    .quick-card:hover { border-color:var(--accent);transform:translateX(4px); }
    .quick-icon { font-size:1.3rem;min-width:26px;text-align:center; }
    .quick-text { flex:1; }
    .quick-label { font-size:.87rem;font-weight:700;margin-bottom:2px; }
    .quick-desc { font-size:.72rem;color:var(--sub); }
    .quick-arrow { font-size:.8rem;color:var(--sub); }

    .complete-card { background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-top:4px; }
    .complete-title { font-size:.78rem;font-weight:700;color:var(--sub);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px; }
    .complete-bar-track { height:6px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin-bottom:6px; }
    .complete-bar-fill { height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:6px;transition:width .6s ease; }
    .complete-pct { font-size:1.1rem;font-weight:800;color:var(--accent); }

    .placeholder-page { margin:40px 28px;background:var(--card);border:1px solid var(--border);border-radius:24px;padding:60px 40px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center; }
    .ph-icon { font-size:3.5rem;margin-bottom:8px; }
    .ph-title { font-size:1.8rem;font-weight:700; }
    .ph-sub { font-size:.9rem;color:var(--sub);max-width:380px;line-height:1.6;margin-bottom:8px; }
  `;
}

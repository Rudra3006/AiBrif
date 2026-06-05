# My Life – Daily Diary
### by AIBrif.com

A fully-featured personal diary web application with AI memory assistant.

---

## 📁 Package Contents

```
mylife-diary/
├── index.html      ← Main app (PWA-ready, all features)
├── admin.html      ← Admin panel dashboard
└── README.md       ← This file
```

---

## 🚀 Deployment to AIBrif.com

### Option 1 – Simple Upload (cPanel / File Manager)
1. Compress this folder as `mylife-diary.zip`
2. Log in to your hosting control panel
3. Open **File Manager** → navigate to `public_html/`
4. Upload and extract `mylife-diary.zip`
5. Visit `https://aibrif.com/` — your app is live!

### Option 2 – FTP Upload
1. Connect via FTP (FileZilla or similar)
2. Upload all files to your `public_html/` root
3. Ensure `index.html` is in the root directory

### Option 3 – GitHub Pages / Netlify / Vercel
1. Push this folder to a GitHub repository
2. Connect to Netlify or Vercel
3. Set **publish directory** to `/` (root)
4. Deploy — live in seconds!

### Option 4 – Cloudflare Pages
1. Connect your GitHub repo to Cloudflare Pages
2. Build command: (none needed)
3. Output directory: `/`

---

## ✨ Features Included

### User & Auth
- [x] Splash / onboarding screen
- [x] Login (email + password, social buttons, biometric toggle)
- [x] Registration (all fields: name, DOB, gender, location)
- [x] Two-Factor Authentication UI
- [x] Biometric login toggle (Face ID / Fingerprint)

### Diary
- [x] Home screen with greeting & daily stats
- [x] 4 categories: Daily Activities, Monthly Memories, Yearly Review, Life Events
- [x] Voice recording with animated waveform + speech-to-text simulation
- [x] Text entry with title + body
- [x] Mood selector (8 moods)
- [x] Media attachments (Photo, Video, Audio, Document)
- [x] Location tagging
- [x] Custom tags
- [x] Privacy / lock entry

### Organization
- [x] Auto date/time/category stamping
- [x] Timeline view with filter by category
- [x] Entry detail modal with lock/delete/share

### Search
- [x] Real-time keyword search across all entries
- [x] Filter by keyword, date, mood, tags

### AI Features
- [x] AI chat assistant (uses Claude API, falls back to smart local responses)
- [x] Quick prompt shortcuts
- [x] Daily/Weekly/Monthly/Yearly summary generation
- [x] AI insights panel (mood trends, streaks, anniversaries)

### Dashboard
- [x] Monthly activity bar chart
- [x] Mood analysis with percentage bars
- [x] Life timeline milestones
- [x] Data export (PDF, Word, Photos)

### Settings
- [x] Profile section with stats
- [x] Security settings (biometrics, 2FA, encryption toggles)
- [x] Notification preferences
- [x] Cloud backup info
- [x] Data export
- [x] Dark mode toggle
- [x] Language settings

### Admin Panel (`/admin.html`)
- [x] User management table
- [x] Daily active user + registration charts
- [x] System health monitoring (Firebase, OpenAI, FCM, AWS)
- [x] Revenue & storage stats

---

## 🔧 Configuration

To enable real AI features, configure in `index.html`:

```javascript
// Line ~430 — replace empty string with your Anthropic API key
const AI_KEY = "sk-ant-..."; // your key here
```

Or integrate Firebase Authentication by replacing the `doLogin()` function with Firebase auth calls.

---

## 📱 Technology

- **Frontend**: Pure HTML5 + CSS3 + Vanilla JS (no build step required)
- **Fonts**: Playfair Display + DM Sans (Google Fonts)
- **AI**: Claude API (Anthropic) — claude-sonnet-4-20250514
- **Recommended Backend**: Firebase (Auth + Firestore + Storage + FCM)
- **Storage**: Firebase Storage / AWS S3 / Google Cloud
- **PWA**: Add a `manifest.json` and `sw.js` to make it installable

---

## 🌐 Browser Support

- Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Mobile: iOS Safari, Android Chrome
- Responsive from 320px to 1440px+

---

## 📞 Support

Website: [aibrif.com](https://aibrif.com)  
App: My Life – Daily Diary  
Version: 1.0.0

---

*"Your story, beautifully remembered."*

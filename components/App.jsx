'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

/* ── TOKENS ─────────────────────────────────────────────────────── */
const C = {
  bg:      "#141414",
  bgCard:  "#1a1a1a",
  bgDeep:  "#111111",
  border:  "#232323",
  borderHi:"#2e2e2e",
  lineNum: "#2c2c2c",
  comment: "#383838",
  gutter:  "#0f0f0f",
  white:   "#f2f2f0",
  gray1:   "#a8a8a4",
  gray2:   "#5c5c58",
  gray3:   "#2e2e2e",
  string:  "#b5a07a",
  fn:      "#7a9a7a",
  kw:      "#7088a0",
  gold:    "#C9933A",
  mono:    "'IBM Plex Mono','Fira Code','Courier New',monospace",
  display: "'Syne','DM Sans',sans-serif",
};

const GUTTER = 52;
const LINE_H = 22;

/* ── WM → dots / bg / accent defaults ───────────────────────────── */
const WM_THEME = {
  hyprland: { dots:["#cba6f7","#89b4fa","#a6e3a1","#f38ba8"], accent:"#cba6f7", bg:"#1e1e2e" },
  sway:     { dots:["#7aa2f7","#bb9af7","#9ece6a","#f7768e"], accent:"#7aa2f7", bg:"#1a1b26" },
  i3wm:     { dots:["#d4be98","#a9b665","#e78a4e","#d3869b"], accent:"#d4be98", bg:"#1d2021" },
  bspwm:    { dots:["#88c0d0","#81a1c1","#a3be8c","#bf616a"], accent:"#88c0d0", bg:"#2e3440" },
  openbox:  { dots:["#bd93f9","#ff79c6","#50fa7b","#ffb86c"], accent:"#bd93f9", bg:"#282a36" },
  dwm:      { dots:["#ebbcba","#c4a7e7","#9ccfd8","#f6c177"], accent:"#ebbcba", bg:"#191724" },
  gnome:    { dots:["#3584e4","#e66100","#2ec27e","#e01b24"], accent:"#3584e4", bg:"#1c1c1c" },
  kde:      { dots:["#1d99f3","#fcbc30","#1cdc9a","#da4453"], accent:"#1d99f3", bg:"#1b1e2b" },
  default:  { dots:["#a8a8a4","#7088a0","#7a9a7a","#b5a07a"], accent:"#a8a8a4", bg:"#1a1a1a" },
};
const wmTheme = wm => WM_THEME[wm] || WM_THEME.default;

/* ── MOCK DATA (fallback se Supabase è vuoto) ────────────────────── */
const RICES_MOCK = [
  { id:1, slug:"catppuccin-mocha-hypr", title:"catppuccin-mocha",  author:"velvet_void",   wm:"hyprland", distro:"arch",        terminal:"kitty",     shell:"zsh",    likes:847,  installs:2341, featured:true  },
  { id:2, slug:"gruvbox-material-i3",   title:"gruvbox-material",  author:"thermal_noise", wm:"i3wm",     distro:"void",        terminal:"alacritty", shell:"fish",   likes:612,  installs:1890, featured:false },
  { id:3, slug:"tokyo-night-sway",      title:"tokyo-night",       author:"neonpulse",     wm:"sway",     distro:"nixos",       terminal:"foot",      shell:"nushell",likes:1203, installs:3102, featured:true  },
  { id:4, slug:"nord-bspwm",            title:"nord-minimal",      author:"arctic_fox",    wm:"bspwm",    distro:"debian",      terminal:"wezterm",   shell:"zsh",    likes:489,  installs:1240, featured:false },
  { id:5, slug:"rose-pine-hypr",        title:"rose-pine",         author:"petal_arch",    wm:"hyprland", distro:"endeavouros", terminal:"kitty",     shell:"fish",   likes:934,  installs:2780, featured:false },
  { id:6, slug:"dracula-openbox",       title:"dracula-classic",   author:"vlad_wm",       wm:"openbox",  distro:"ubuntu",      terminal:"alacritty", shell:"bash",   likes:376,  installs:980,  featured:false },
];

/*
 * normalizeRice — aggiunge dots/bg/accent dal WM e risolve author
 * Funziona sia su record Supabase (con join users) che su mock.
 */
const normalizeRice = r => {
  const theme = wmTheme(r.wm);
  return {
    ...theme,
    ...r,
    author: r.users?.username || r.author || r.author_id || 'unknown',
    // Se il rice ha dots campionati dal DB, usali; altrimenti fallback WM theme
    dots:   (r.dots && r.dots.length >= 4) ? r.dots : theme.dots,
    accent: (r.dots && r.dots.length >= 1) ? r.dots[0] : theme.accent,
  };
};

const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n);
const PKG_MAP = {
  "ttf-ibm-plex":  { apt:"fonts-ibm-plex",             dnf:"ibm-plex-fonts",  pacman:"ttf-ibm-plex"  },
  "nerd-fonts":    { apt:"fonts-nerd-fonts-complete",   dnf:"nerd-fonts",      pacman:"nerd-fonts"    },
  "hyprpaper":     { apt:"hyprpaper",                   dnf:"hyprpaper",       pacman:"hyprpaper"     },
  "grim":          { apt:"grim",                        dnf:"grim",            pacman:"grim"          },
  "slurp":         { apt:"slurp",                       dnf:"slurp",           pacman:"slurp"         },
  "waybar":        { apt:"waybar",                      dnf:"waybar",          pacman:"waybar"        },
  "wofi":          { apt:"wofi",                        dnf:"wofi",            pacman:"wofi"          },
  "rofi":          { apt:"rofi",                        dnf:"rofi",            pacman:"rofi"          },
  "dunst":         { apt:"dunst",                       dnf:"dunst",           pacman:"dunst"         },
  "kitty":         { apt:"kitty",                       dnf:"kitty",           pacman:"kitty"         },
  "alacritty":     { apt:"alacritty",                   dnf:"alacritty",       pacman:"alacritty"     },
  "hyprland":      { apt:"hyprland",                    dnf:"hyprland",        pacman:"hyprland"      },
  "sway":          { apt:"sway",                        dnf:"sway",            pacman:"sway"          },
  "i3":            { apt:"i3",                          dnf:"i3",              pacman:"i3-wm"         },
  "bspwm":         { apt:"bspwm",                       dnf:"bspwm",           pacman:"bspwm"         },
  "neovim":        { apt:"neovim",                      dnf:"neovim",          pacman:"neovim"        },
  "tmux":          { apt:"tmux",                        dnf:"tmux",            pacman:"tmux"          },
  "fzf":           { apt:"fzf",                         dnf:"fzf",             pacman:"fzf"           },
  "starship":      { apt:"starship",                    dnf:"starship",        pacman:"starship"      },
  "swww":          { apt:"swww",                        dnf:"swww",            pacman:"swww"          },
  "zoxide":        { apt:"zoxide",                      dnf:"zoxide",          pacman:"zoxide"        },
  "eza":           { apt:"eza",                         dnf:"eza",             pacman:"eza"           },
  "bat":           { apt:"bat",                         dnf:"bat",             pacman:"bat"           },
  "foot":          { apt:"foot",                        dnf:"foot",            pacman:"foot"          },
  "wezterm":       { apt:"wezterm",                     dnf:"wezterm",         pacman:"wezterm"       },
  "picom":         { apt:"picom",                       dnf:"picom",           pacman:"picom"         },
  "polybar":       { apt:"polybar",                     dnf:"polybar",         pacman:"polybar"       },
  "feh":           { apt:"feh",                         dnf:"feh",             pacman:"feh"           },
};

const generateUniversalScript = (deps, riceAuthor, riceSlug) => {
  const pkgFor = (pm) => deps.map(d => PKG_MAP[d]?.[pm] || d).join(" ");
  return `#!/usr/bin/env bash
# // riceshare — ${riceAuthor}/${riceSlug}
# // auto-generated universal install script

set -euo pipefail
GREEN='\\033[0;32m'; DIM='\\033[2m'; NC='\\033[0m'
echo -e "\\n\${GREEN}// riceshare installer\${NC}"
echo -e "\${DIM}// ${riceAuthor}/${riceSlug}\\n\${NC}"

# // detect package manager
if   command -v pacman &>/dev/null; then
  echo -e "\${DIM}// arch-based distro detected\${NC}"
  command -v yay &>/dev/null && AUR=yay || AUR=pacman
  \$AUR -S --needed --noconfirm ${pkgFor("pacman")}
elif command -v apt &>/dev/null; then
  echo -e "\${DIM}// debian/ubuntu detected\${NC}"
  sudo apt update -qq && sudo apt install -y ${pkgFor("apt")}
elif command -v dnf &>/dev/null; then
  echo -e "\${DIM}// fedora detected\${NC}"
  sudo dnf install -y ${pkgFor("dnf")}
elif command -v zypper &>/dev/null; then
  echo -e "\${DIM}// opensuse detected\${NC}"
  sudo zypper install -y ${pkgFor("pacman")}
elif command -v xbps-install &>/dev/null; then
  echo -e "\${DIM}// void linux detected\${NC}"
  sudo xbps-install -y ${pkgFor("pacman")}
else
  echo "// error: unsupported package manager"; exit 1
fi

# // backup existing config
BACKUP=~/.rice-backup-\$(date +%s)
mkdir -p "\$BACKUP"
cp -r ~/.config "\$BACKUP/" 2>/dev/null || true
echo -e "\${DIM}// backup saved to \$BACKUP\${NC}"

# // download and apply dotfiles
TMP=\$(mktemp -d)
curl -fsSL "https://rice-share.vercel.app/api/v1/rice/${riceAuthor}/${riceSlug}/download" -o "\$TMP/rice.zip"
unzip -q "\$TMP/rice.zip" -d "\$TMP"
[ -d "\$TMP/dotfiles" ] && cp -r "\$TMP/dotfiles/." ~/.config/ 2>/dev/null || true
[ -f "\$TMP/dotfiles/.zshrc" ]        && cp "\$TMP/dotfiles/.zshrc" ~/
[ -f "\$TMP/dotfiles/wallpaper.png" ] && cp "\$TMP/dotfiles/wallpaper.png" ~/
rm -rf "\$TMP"

echo -e "\\n\${GREEN}// done! restart your session to apply the rice.\${NC}\\n"`;
};

/* ── GLOBAL CSS ─────────────────────────────────────────────────── */
const GS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#141414;color:#a8a8a4;font-family:'IBM Plex Mono',monospace;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:#141414;}
::-webkit-scrollbar-thumb{background:#232323;}
::selection{background:#b5a07a22;color:#f2f2f0;}
@keyframes fadeUp {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn {from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.badge-founder {
  background: linear-gradient(90deg, #7a5a1a, #C9933A, #f0d080, #C9933A, #7a5a1a);
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border: 1px solid #C9933A55 !important;
  box-shadow: 0 0 8px #C9933A18;
}
.card:hover{background:#1e1e1e!important;border-color:#2a2a2a!important;}
.card:hover .ct{color:#f2f2f0!important;}
.row:hover{background:#181818!important;}
.row:hover .ct{color:#e8e8e4!important;}
.bs:hover{background:#f2f2f0!important;color:#111!important;}
.bg:hover{border-color:#444!important;color:#a0a09c!important;}
.tb:hover{color:#d0d0cc!important;}
input::placeholder{color:#282828;} textarea::placeholder{color:#2e2e2e;}
/* ── Mobile ── */
@media (max-width:640px){
  .rs-hide-mobile{display:none!important;}
  .rs-grid-1{grid-template-columns:1fr!important;}
  .rs-pad-mobile{padding:16px!important;}
  .rs-font-sm{font-size:11px!important;}
  .content-area{bottom:100px!important;}
}
`;

/* ── FOUNDER BADGE ───────────────────────────────────────────────── */
function FounderBadge() {
  return (
    <span className="badge-founder" style={{ fontSize:9, padding:"2px 9px", fontFamily:C.mono, letterSpacing:"0.08em", display:"inline-block", textTransform:"lowercase", userSelect:"none" }}>
      founder
    </span>
  );
}

/* ── PAGE SHELL ──────────────────────────────────────────────────── */
function PageShell({ children }) {
  const contentRef = useRef(null);
  const [lines, setLines] = useState(40);
  const mobile = useMobile();

  useEffect(() => {
    if (!contentRef.current) return;
    const measure = () => {
      if (!contentRef.current) return;
      setLines(Math.max(20, Math.ceil(contentRef.current.offsetHeight / LINE_H)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => { ro.disconnect(); };
  }, [children]);

  return (
    <div style={{ display:"flex" }}>
      {!mobile && (
        <div style={{ width:GUTTER, flexShrink:0, background:C.gutter, borderRight:`1px solid ${C.border}`, alignSelf:"flex-start" }}>
          {Array.from({ length:lines }, (_,i) => (
            <div key={i} style={{ height:LINE_H, display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:12 }}>
              <span style={{ fontSize:11, color:C.lineNum, fontFamily:C.mono, userSelect:"none" }}>{i+1}</span>
            </div>
          ))}
        </div>
      )}
      <div ref={contentRef} style={{ flex:1, minWidth:0 }}>{children}</div>
    </div>
  );
}

/* ── DESKTOP THUMB ───────────────────────────────────────────────── */
function Thumb({ rice, h=130 }) {
  // Se c'è una cover_url reale, showla in aspect-ratio 16:9 senza crop
  if (rice.cover_url) {
    return (
      <div style={{ width:"100%", position:"relative", paddingTop:"56.25%", background:"#0a0a0a", flexShrink:0 }}>
        <img
          src={rice.cover_url}
          alt={rice.title}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e=>{ e.currentTarget.style.display="none"; }}
        />
        {/* Overlay basso con info minime */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"6px 10px", background:"linear-gradient(transparent,rgba(0,0,0,0.7))", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:8, fontFamily:C.mono, color:"rgba(255,255,255,0.5)" }}>{rice.wm}</span>
          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:8 }}>·</span>
          <span style={{ fontSize:8, fontFamily:C.mono, color:"rgba(255,255,255,0.35)" }}>{rice.distro}</span>
          <div style={{ flex:1 }}/>
          <div style={{ display:"flex", gap:2 }}>
            {rice.dots.map((d,i)=><div key={i} style={{ width:7, height:7, background:d, borderRadius:1, opacity:.7 }}/>)}
          </div>
        </div>
      </div>
    );
  }
  // Fallback: thumb generata dal WM theme
  return (
    <div style={{ width:"100%", height:h, background:rice.bg, position:"relative", overflow:"hidden", flexShrink:0 }}>
      <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 3px)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:18, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", padding:"0 10px", gap:5 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,0.12)" }}/>)}
        <span style={{ flex:1, textAlign:"center", fontSize:7, fontFamily:C.mono, color:"rgba(255,255,255,0.15)" }}>{rice.wm} — {rice.shell}</span>
      </div>
      <div style={{ position:"absolute", top:22, left:10, right:10, bottom:8, display:"flex", gap:8 }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
          <span style={{ fontSize:7, fontFamily:C.mono, color:rice.accent, opacity:.6 }}>{rice.author}@{rice.distro}</span>
          {[["os",rice.distro],["wm",rice.wm],["sh",rice.shell]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", gap:5, fontSize:6.5, fontFamily:C.mono }}>
              <span style={{ color:rice.accent, opacity:.4 }}>{k}</span>
              <span style={{ color:"rgba(255,255,255,0.3)" }}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex", gap:3, marginTop:4 }}>
            {rice.dots.map((d,i)=><div key={i} style={{ width:9, height:9, background:d, borderRadius:1, opacity:.65 }}/>)}
          </div>
        </div>
        <div style={{ width:55, background:"rgba(0,0,0,0.18)", borderRadius:2, padding:5, display:"flex", flexDirection:"column", gap:3 }}>
          {[65,45,75,38,58].map((w,i)=><div key={i} style={{ height:3, width:w+"%", background:i===0?rice.accent:"rgba(255,255,255,0.07)", borderRadius:1, opacity:i===0?.5:1 }}/>)}
        </div>
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:rice.accent, opacity:.2 }}/>
    </div>
  );
}

/* ── RICE CARD ───────────────────────────────────────────────────── */
function RiceCard({ rice, onClick, delay=0 }) {
  return (
    <div className="card" onClick={()=>onClick(rice)} style={{ border:`1px solid ${C.border}`, background:C.bgCard, cursor:"pointer", overflow:"hidden", transition:"all .2s", animation:`fadeUp .3s ease ${delay}s both` }}>
      <Thumb rice={rice} h={190}/>
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div style={{ minWidth:0 }}>
            <div className="ct" style={{ fontSize:13, color:C.white, fontWeight:600, marginBottom:5, transition:"color .15s", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              <span style={{ color:C.fn }}>{rice.author}</span>
              <span style={{ color:C.gray2 }}>/</span>
              <span>{rice.title}</span>
            </div>
            <div style={{ fontSize:11, color:C.gray2, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ color:C.kw }}>{rice.wm}</span>
              <span style={{ color:C.gray3 }}>·</span>
              <span>{rice.distro}</span>
              {rice.terminal && <><span style={{ color:C.gray3 }}>·</span><span style={{ color:C.gray3 }}>{rice.terminal}</span></>}
            </div>
          </div>
          {rice.featured && <span style={{ fontSize:9, color:C.string, border:`1px solid ${C.string}40`, padding:"2px 8px", flexShrink:0 }}>★ top</span>}
        </div>
        <div style={{ display:"flex", gap:16, paddingTop:10, borderTop:`1px solid ${C.border}`, fontSize:11, color:C.gray2, alignItems:"center" }}>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}>♥ <span style={{ color:C.white, fontWeight:500 }}>{fmt(rice.likes||0)}</span></span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}>↓ <span style={{ color:C.white, fontWeight:500 }}>{fmt(rice.installs||0)}</span></span>
          <div style={{ flex:1 }}/>
          <div style={{ display:"flex", gap:3 }}>
            {(rice.dots||[]).slice(0,4).map((d,i)=><div key={i} style={{ width:8, height:8, background:d, borderRadius:1 }}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TABLE VIEW ─────────────────────────────────────────────────── */
function TableView({ rices, onClick }) {
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr 70px 80px", padding:"6px 0 10px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.1em" }}>
        {["NAME","WM","DISTRO","SHELL","LIKES","↓"].map(h=><span key={h}>{h}</span>)}
      </div>
      {rices.map((r,i)=>(
        <div key={r.id} className="row" onClick={()=>onClick(r)} style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr 70px 80px", padding:"11px 0", cursor:"pointer", borderBottom:`1px solid ${C.border}`, fontSize:11, color:C.gray2, transition:"background .15s", animation:`fadeUp .2s ease ${i*.03}s both` }}>
          <span className="ct" style={{ color:C.white, transition:"color .15s" }}>
            <span style={{ color:C.fn }}>{r.author}</span><span style={{ color:C.gray3 }}>/</span>{r.title}
          </span>
          <span style={{ color:C.kw }}>{r.wm}</span>
          <span>{r.distro}</span>
          <span>{r.shell}</span>
          <span>{fmt(r.likes||0)}</span>
          <span>{fmt(r.installs||0)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── IMAGE GALLERY ──────────────────────────────────────────────── */
function ImageGallery({ images }) {
  const imgs = (images || []).filter(Boolean);
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed]     = useState(false);

  if (imgs.length === 0) return null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, border:`1px solid ${C.border}`, overflow:"hidden" }}>

      {/* Immagine principale */}
      <div
        onClick={()=>setZoomed(true)}
        style={{ position:"relative", background:"#0a0a0a", cursor:"zoom-in", overflow:"hidden" }}
      >
        <img
          key={selected}
          src={imgs[selected]}
          alt={`screenshot ${selected+1}`}
          style={{ width:"100%", maxHeight:420, objectFit:"contain", display:"block", animation:"fadeIn .2s ease" }}
          onError={e=>{ e.currentTarget.style.opacity="0.2"; e.currentTarget.alt="immagine non disponibile"; }}
        />
        {/* Badge contatore */}
        <div style={{ position:"absolute", bottom:10, right:12, fontSize:9, fontFamily:C.mono, color:"rgba(255,255,255,0.4)", background:"rgba(0,0,0,0.5)", padding:"2px 8px" }}>
          {selected+1} / {imgs.length}
        </div>
        {/* Frecce navigazione */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={e=>{ e.stopPropagation(); setSelected(s=>(s-1+imgs.length)%imgs.length); }}
              style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.6)", border:`1px solid ${C.border}`, color:C.gray1, cursor:"pointer", fontSize:16, lineHeight:1, padding:"6px 10px", fontFamily:C.mono, transition:"all .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.9)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.6)"}
            >‹</button>
            <button
              onClick={e=>{ e.stopPropagation(); setSelected(s=>(s+1)%imgs.length); }}
              style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.6)", border:`1px solid ${C.border}`, color:C.gray1, cursor:"pointer", fontSize:16, lineHeight:1, padding:"6px 10px", fontFamily:C.mono, transition:"all .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.9)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.6)"}
            >›</button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div style={{ display:"flex", gap:0, borderTop:`1px solid ${C.border}`, background:C.bgDeep, overflowX:"auto", padding:"8px 8px" }}>
          {imgs.map((img,i)=>(
            <div
              key={i}
              onClick={()=>setSelected(i)}
              style={{
                flexShrink:0, width:72, height:48, cursor:"pointer", overflow:"hidden",
                border:`1px solid ${i===selected ? C.white : C.border}`,
                marginRight:6, opacity: i===selected ? 1 : 0.5,
                transition:"all .15s", position:"relative",
              }}
              onMouseEnter={e=>{ if(i!==selected) e.currentTarget.style.opacity="0.8"; }}
              onMouseLeave={e=>{ if(i!==selected) e.currentTarget.style.opacity="0.5"; }}
            >
              <img src={img} alt={`thumb ${i+1}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                onError={e=>{ e.currentTarget.parentElement.style.background=C.border; e.currentTarget.style.display="none"; }}/>
              {i===selected && (
                <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:C.white }}/>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {zoomed && (
        <div
          onClick={()=>setZoomed(false)}
          style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}
        >
          <img
            src={imgs[selected]}
            alt={`screenshot ${selected+1}`}
            style={{ maxWidth:"92vw", maxHeight:"88vh", objectFit:"contain", border:`1px solid ${C.border}` }}
            onClick={e=>e.stopPropagation()}
          />
          <button
            onClick={()=>setZoomed(false)}
            style={{ position:"absolute", top:20, right:24, background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:22, fontFamily:C.mono, lineHeight:1 }}
          >✕</button>
          {imgs.length > 1 && (
            <>
              <button onClick={e=>{ e.stopPropagation(); setSelected(s=>(s-1+imgs.length)%imgs.length); }}
                style={{ position:"absolute", left:20, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.7)", border:`1px solid ${C.border}`, color:C.gray1, cursor:"pointer", fontSize:22, lineHeight:1, padding:"8px 14px", fontFamily:C.mono }}>‹</button>
              <button onClick={e=>{ e.stopPropagation(); setSelected(s=>(s+1)%imgs.length); }}
                style={{ position:"absolute", right:20, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.7)", border:`1px solid ${C.border}`, color:C.gray1, cursor:"pointer", fontSize:22, lineHeight:1, padding:"8px 14px", fontFamily:C.mono }}>›</button>
            </>
          )}
          <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", fontSize:10, fontFamily:C.mono, color:C.gray3 }}>{selected+1} / {imgs.length}</div>
        </div>
      )}
    </div>
  );
}

/* ── LIKE BUTTON ─────────────────────────────────────────────────── */
function LikeButton({ rice }) {
  const { user } = useUser();
  const [liked, setLiked]     = useState(false);
  const [count, setCount]     = useState(rice.likes || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Carica stato like corrente
  useEffect(() => {
    if (!user || !rice.id) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('rice_likes')
        .select('id')
        .eq('rice_id', rice.id)
        .eq('user_id', user.id)
        .maybeSingle()   // non crasha se non trovato
        .then(({ data, error: e }) => {
          if (e) console.warn('like check:', e.message);
          else setLiked(!!data);
        });
    });
  }, [user, rice.id]);

  const toggle = async () => {
    if (!user) { window.location.href = '/sign-in'; return; }
    if (loading) return;
    setLoading(true);
    setError(null);
    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);
    setLiked(newLiked);
    setCount(newCount);
    try {
      const { supabase } = await import('../lib/supabase');
      if (!newLiked) {
        const { error: e1 } = await supabase.from('rice_likes')
          .delete().eq('rice_id', rice.id).eq('user_id', user.id);
        if (e1) throw new Error(e1.message);
      } else {
        const { error: e2 } = await supabase.from('rice_likes')
          .insert({ rice_id: rice.id, user_id: user.id });
        if (e2) throw new Error(e2.message);
      }
      // Aggiorna contatore — ignora errori RLS silenziosamente
      await supabase.from('rice').update({ likes: newCount }).eq('id', rice.id);
      // Notifica al creatore (solo su like, non su unlike, non su sé stesso)
      if (newLiked && rice.author_id && rice.author_id !== user.id) {
        supabase.from('notifications').insert({
          user_id:   rice.author_id,
          type:      'like',
          rice_name: rice.title,
          message:   `@${user.username || user.firstName} liked your rice`,
        }).then(()=>{}).catch(()=>{});
      }
    } catch(e) {
      console.error('like error:', e.message);
      setError(e.message);
      // Rollback optimistic update
      setLiked(liked);
      setCount(count);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <button onClick={toggle} disabled={loading} style={{
        padding:"9px", border:`1px solid ${liked ? C.string+"88" : C.borderHi}`,
        background: liked ? C.string+"14" : "transparent",
        color: liked ? C.string : C.gray1,
        cursor: loading ? "default" : "pointer",
        fontSize:11, fontFamily:C.mono, transition:"all .2s",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        opacity: loading ? 0.6 : 1,
      }}>
        <span style={{ fontSize:13, transition:"transform .2s", transform: liked ? "scale(1.25)" : "scale(1)" }}>♥</span>
        {fmt(count)}
        {!user && <span style={{ fontSize:9, color:C.gray3, marginLeft:2 }}>· login</span>}
      </button>
      {error && (
        <div style={{ fontSize:9, color:"#c07070", fontFamily:C.mono, fontStyle:"italic", textAlign:"center" }}>
          // {error.includes("rice_likes") ? "add INSERT policy on rice_likes in Supabase" : error}
        </div>
      )}
    </div>
  );
}

/* ── SHARE BUTTON ────────────────────────────────────────────────── */
function ShareButton({ rice }) {
  const mobile = useMobile();
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef(null);

  const url     = `https://rice-share.vercel.app/rice/${rice.author}/${rice.slug}`;
  const cmdText = `curl -fsSL rice-share.vercel.app/install/${rice.author}/${rice.slug} | bash`;

  // Chiudi cliccando fuori
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copyText = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
  };

  const options = [
    {
      icon: "⎘",
      label: "copy link",
      sub: url,
      action: () => copyText(url),
    },
    {
      icon: "$",
      label: "copy install command",
      sub: "curl ... | bash",
      action: () => copyText(cmdText),
    },
    {
      icon: "𝕏",
      label: "share on X/Twitter",
      sub: null,
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${rice.title} by @${rice.author} on Riceshare`)}&url=${encodeURIComponent(url)}`, "_blank"),
    },
    {
      icon: "⇧",
      label: "share on Reddit",
      sub: null,
      action: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${rice.title} — ${rice.wm} rice by ${rice.author}`)}`, "_blank"),
    },
  ];

  return (
    <div ref={btnRef} style={{ position:"relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:"100%", padding:"9px",
          border:`1px solid ${open ? C.borderHi : C.border}`,
          background: open ? C.bgCard : "transparent",
          color: open ? C.white : C.gray2,
          cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .2s",
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
        }}
        onMouseEnter={e=>{ if(!open){ e.currentTarget.style.borderColor=C.borderHi; e.currentTarget.style.color=C.gray1; } }}
        onMouseLeave={e=>{ if(!open){ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.gray2; } }}
      >
        {copied ? (
          <><span style={{ color:C.fn }}>✓</span><span style={{ color:C.fn }}>copyto</span></>
        ) : (
          <><span style={{ fontSize:12 }}>↗</span>share</>
        )}
      </button>

      {open && !copied && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", right:0, left:mobile?0:"auto", zIndex:300,
          background:C.bgDeep, border:`1px solid ${C.borderHi}`,
          minWidth:240, boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
          animation:"fadeUp .15s ease",
        }}>
          <div style={{ padding:"7px 14px 6px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>
            // share this rice
          </div>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%",
                padding:"11px 14px", background:"transparent", border:"none",
                borderBottom: i < options.length-1 ? `1px solid ${C.border}` : "none",
                cursor:"pointer", textAlign:"left", transition:"background .12s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <span style={{ fontSize:14, color:C.gray2, width:18, textAlign:"center", flexShrink:0 }}>{opt.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:C.white, fontFamily:C.mono }}>{opt.label}</div>
                {opt.sub && <div style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{opt.sub}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DETAIL PAGE ─────────────────────────────────────────────────── */

const ACHIEVEMENT_BADGES = [
  { id:"popular",      label:"popular",      color:"#fb923c", desc:"rice with 1000+ installs" },
  { id:"viral",        label:"viral",        color:"#f43f5e", desc:"500+ installs within 7 days of upload" },
  { id:"perfectionist",label:"perfectionist",color:"#a3e635", desc:"rice with every field filled in" },
  { id:"photographer", label:"photographer", color:"#38bdf8", desc:"5+ screenshots on a single rice" },
  { id:"veteran",      label:"veteran",      color:"#34d399", desc:"account older than 1 year" },
  { id:"consistent",   label:"consistent",   color:"#f472b6", desc:"published at least 1 rice/month for 3 consecutive months" },
  { id:"collector",    label:"collector",    color:"#818cf8", desc:"10 approved rice" },
];

function BadgeChip({ badge }) {
  return (
    <span style={{ display:"inline-block", fontSize:9,
      border:`1px solid ${badge.color}55`,
      color:badge.color, padding:"2px 9px", fontFamily:"monospace",
      cursor:"default", userSelect:"none"
    }}>
      {badge.label}
    </span>
  );
}

async function computeBadges(userId, rices, userCreatedAt, supabase) {
  const earned = new Set();
  const approved = rices.filter(r => r.status === 'approved');

  // veteran — account older than 1 year
  if (userCreatedAt && (Date.now() - new Date(userCreatedAt).getTime()) > 365 * 24 * 60 * 60 * 1000)
    earned.add('veteran');

  // collector — 10+ approved rices
  if (approved.length >= 10) earned.add('collector');

  // popular — any rice with 1000+ installs
  if (approved.some(r => (r.installs || 0) >= 1000)) earned.add('popular');

  // viral — 500+ installs within 7 days of upload
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (approved.some(r => (r.installs || 0) >= 500 && r.created_at &&
      (Date.now() - new Date(r.created_at).getTime()) <= sevenDaysMs))
    earned.add('viral');

  // perfectionist — rice with all fields filled
  if (approved.some(r =>
    r.description && r.description.trim() &&
    r.images && r.images.length > 0 &&
    r.deps && r.deps.length > 0 &&
    r.tags && r.tags.length > 0 &&
    r.components && Object.values(r.components).some(Boolean)
  )) earned.add('perfectionist');

  // photographer — 5+ screenshots
  if (approved.some(r => r.images && r.images.length >= 5)) earned.add('photographer');

  // consistent — 1 rice/month for 3 consecutive months
  if (approved.length >= 3) {
    const months = approved.map(r => {
      const d = new Date(r.created_at);
      return d.getFullYear() * 12 + d.getMonth();
    }).sort((a,b) => a-b);
    const uniqueMonths = [...new Set(months)];
    for (let i = 0; i <= uniqueMonths.length - 3; i++) {
      if (uniqueMonths[i+1] === uniqueMonths[i]+1 && uniqueMonths[i+2] === uniqueMonths[i]+2) {
        earned.add('consistent'); break;
      }
    }
  }

  try {
    const { data: allRices } = await supabase
      .from('rice').select('id,author_id,wm,created_at').eq('status','approved')
      .order('created_at', { ascending: true });
    if (allRices && allRices.length > 0) {
      const wmFirst = {};
      for (const r of allRices) {
        if (!wmFirst[r.wm]) wmFirst[r.wm] = r.author_id;
      }
    }
  } catch(e) { /* skip if fails */ }

  // Sync to user_badges table
  try {
    const { data: existing } = await supabase.from('user_badges').select('badge').eq('user_id', userId);
    const existingSet = new Set((existing||[]).map(b => b.badge));
    const toInsert = [...earned].filter(b => !existingSet.has(b)).map(b => ({ user_id: userId, badge: b }));
    if (toInsert.length > 0) await supabase.from('user_badges').insert(toInsert);
    return [...new Set([...existingSet, ...earned])];
  } catch(e) { return [...earned]; }
}

/* ── COMMENTS SECTION ─────────────────────────────────────── */
function CommentsSection({ rice, currentUser }) {
  const [comments, setComments] = useState([]);
  const [type, setType]         = useState("comment");
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    import('../lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('rice_id', rice.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setComments(data || []);
    });
  }, [rice.id]);

  const submit = async () => {
    if (!text.trim() || !currentUser) return;
    setSending(true);
    import('../lib/supabase').then(async ({ supabase }) => {
      const { data, error } = await supabase.from('comments').insert({
        rice_id:  rice.id,
        user_id:  currentUser.id,
        username: currentUser.username || currentUser.firstName,
        content:  text.trim(),
        type,
      }).select().single();
      if (!error && data) {
        setComments(prev => [data, ...prev]); setText("");
        // Notifica al creatore (non su sé stesso)
        if (rice.author_id && rice.author_id !== currentUser.id) {
          supabase.from('notifications').insert({
            user_id:   rice.author_id,
            type:      type === 'issue' ? 'issue' : 'comment',
            rice_name: rice.title,
            message:   `@${currentUser.username || currentUser.firstName} ${type === 'issue' ? 'reported an issue on' : 'commented on'} your rice`,
          }).then(()=>{}).catch(()=>{});
        }
      }
      setSending(false);
    });
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 9, color: C.gray3, letterSpacing: "0.08em", fontFamily: C.mono, marginBottom: 12 }}>// COMMENTS</div>

      {currentUser && (
        <div style={{ background: C.bgDeep, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[["comment","💬 comment"],["issue","⚠️ report issue"]].map(([v,label]) => (
              <button key={v} onClick={() => setType(v)} className="tb" style={{
                padding: "4px 12px", border: `1px solid ${type===v ? C.borderHi : C.border}`,
                background: type===v ? C.borderHi+"33" : "transparent",
                color: type===v ? C.white : C.gray2,
                cursor: "pointer", fontSize: 10, fontFamily: C.mono, transition: "all .15s"
              }}>{label}</button>
            ))}
          </div>
          {type === "issue" && (
            <div style={{ fontSize: 10, color: C.string, fontFamily: C.mono, marginBottom: 8, fontStyle: "italic" }}>
              // visible to everyone · creator can delete once resolved
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={type === "comment" ? "// leave a comment..." : "// describe the issue..."}
            style={{
              width: "100%", minHeight: 72, background: C.bg, border: `1px solid ${C.border}`,
              color: C.white, fontFamily: C.mono, fontSize: 11, padding: "8px 10px",
              resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={submit} disabled={sending || !text.trim()} className="bs" style={{
              padding: "6px 18px", border: `1px solid ${C.borderHi}`,
              background: "transparent", color: C.white, cursor: "pointer",
              fontSize: 10, fontFamily: C.mono,
              opacity: (!text.trim() || sending) ? 0.4 : 1, transition: "all .15s"
            }}>{sending ? "sending..." : "send →"}</button>
          </div>
        </div>
      )}

      {!currentUser && (
        <div style={{ fontSize: 11, color: C.gray3, fontFamily: C.mono, fontStyle: "italic", marginBottom: 16 }}>
          // sign in to leave a comment
        </div>
      )}

      {comments.length === 0 && (
        <div style={{ fontSize: 11, color: C.gray3, fontFamily: C.mono, fontStyle: "italic", padding: "16px 0" }}>
          // no comments yet
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {comments.map(c => (
          <div key={c.id} style={{
            border: c.type==="issue" ? "1px solid #ef444466" : `1px solid ${C.border}`,
            borderLeft: c.type==="issue" ? "3px solid #ef4444" : `1px solid ${C.border}`,
            background: c.type==="issue" ? "#ef444408" : C.bgDeep,
            padding: "12px 14px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: C.mono, color: C.fn }}>@{c.username}</span>
                {c.type === "issue" && (
                  <span style={{ fontSize: 9, color: "#fff", background: "#ef4444", padding: "2px 7px", fontFamily: C.mono, fontWeight: 600, letterSpacing: "0.05em" }}>⚠ issue</span>
                )}
              </div>
              <span style={{ fontSize: 9, color: C.gray3, fontFamily: C.mono }}>
                {new Date(c.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
              </span>
            </div>
            <p style={{ fontSize: 12, color: C.gray1, fontFamily: C.mono, margin: 0, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditRiceModal({ rice, onClose }) {
  const [title, setTitle]   = useState(rice.title||"");
  const [desc,  setDesc]    = useState(rice.description||"");
  const [tags,  setTags]    = useState((rice.tags||[]).join(", "));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");

  // image editing
  const [coverUrl,  setCoverUrl]  = useState(rice.cover_url||"");
  const [images,    setImages]    = useState(rice.images||[]);
  const [newImgFiles, setNewImgFiles] = useState([]);   // File objects to upload
  const [newImgPreviews, setNewImgPreviews] = useState([]); // preview URLs
  const [uploadingImgs, setUploadingImgs] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    setNewImgFiles(prev => [...prev, ...files]);
    setNewImgPreviews(prev => [...prev, ...previews]);
  };

  const removeExistingImg = (url) => {
    setImages(prev => prev.filter(u => u !== url));
    if (coverUrl === url) setCoverUrl(images.filter(u => u !== url)[0] || "");
  };

  const removeNewImg = (idx) => {
    setNewImgFiles(prev => prev.filter((_,i)=>i!==idx));
    setNewImgPreviews(prev => prev.filter((_,i)=>i!==idx));
  };

  const save = async () => {
    setSaving(true);
    const { supabase } = await import('../lib/supabase');
    const newTags = tags.split(",").map(t=>t.trim().toLowerCase().replace(/^#+/,"")).filter(Boolean);

    // Upload new images if any
    setUploadingImgs(true);
    const uploadedUrls = [...images];
    for (const file of newImgFiles) {
      const path = `${rice.author_id}/${rice.id}/edit/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('rice-files').upload(path, file, { upsert:true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from('rice-files').getPublicUrl(path);
        if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
      }
    }
    setUploadingImgs(false);

    // Determine cover: if current coverUrl is still valid use it, else first image
    const finalCover = uploadedUrls.includes(coverUrl) ? coverUrl : (uploadedUrls[0] || null);

    const { error } = await supabase.from('rice').update({
      title:       title.trim(),
      description: desc.trim(),
      tags:        newTags,
      images:      uploadedUrls,
      cover_url:   finalCover,
    }).eq('id', rice.id);
    setSaving(false);
    if (error) { setMsg("✗ error — check console"); return; }
    setMsg("✓ saved! reload to see changes.");
    setTimeout(onClose, 1800);
  };

  const allPreviews = [
    ...images.map(url=>({ url, isNew:false })),
    ...newImgPreviews.map((url,i)=>({ url, isNew:true, idx:i })),
  ];

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.bgDeep, border:`1px solid ${C.borderHi}`, padding:28, maxWidth:560, width:"100%", fontFamily:C.mono, animation:"fadeUp .2s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:13, color:C.fn, fontWeight:600 }}>✏ edit rice</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:18, lineHeight:1, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* ── IMAGES SECTION */}
          <div>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", marginBottom:8 }}>// IMAGES & COVER</div>
            {allPreviews.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                {allPreviews.map((item, i) => (
                  <div key={i} style={{ position:"relative", width:90, flexShrink:0 }}>
                    <img
                      src={item.url}
                      alt=""
                      onClick={()=>{ if(!item.isNew) setCoverUrl(item.url); }}
                      style={{
                        width:90, height:56, objectFit:"cover", display:"block",
                        border: (!item.isNew && coverUrl===item.url)
                          ? `2px solid ${C.fn}` : `1px solid ${C.border}`,
                        cursor: item.isNew ? "default" : "pointer",
                        opacity: item.isNew ? 0.7 : 1,
                        transition:"border-color .15s",
                      }}
                    />
                    {!item.isNew && coverUrl===item.url && (
                      <div style={{ position:"absolute", top:2, left:2, fontSize:8, background:C.fn, color:"#000", padding:"1px 4px", fontWeight:700 }}>COVER</div>
                    )}
                    {item.isNew && (
                      <div style={{ position:"absolute", top:2, left:2, fontSize:8, background:C.kw, color:"#fff", padding:"1px 4px" }}>NEW</div>
                    )}
                    <button
                      onClick={()=> item.isNew ? removeNewImg(item.idx) : removeExistingImg(item.url)}
                      style={{ position:"absolute", top:2, right:2, background:"rgba(0,0,0,0.7)", border:"none", color:"#f87171", cursor:"pointer", fontSize:11, lineHeight:1, padding:"1px 4px", borderRadius:2 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button
                onClick={()=>fileInputRef.current?.click()}
                style={{ padding:"6px 14px", border:`1px solid ${C.border}`, background:C.bg, color:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, display:"flex", alignItems:"center", gap:5 }}>
                ＋ add screenshots
              </button>
              {allPreviews.length > 0 && (
                <span style={{ fontSize:9, color:C.gray3 }}>click an image to set as cover</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display:"none" }}/>
          </div>

          {/* ── TITLE */}
          <div>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", marginBottom:6 }}>// TITLE</div>
            <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={80}
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, color:C.white, fontFamily:C.mono, fontSize:12, padding:"8px 10px", outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* ── DESCRIPTION */}
          <div>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", marginBottom:6 }}>// DESCRIPTION</div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} maxLength={1000} rows={5}
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, color:C.white, fontFamily:C.mono, fontSize:11, padding:"8px 10px", resize:"vertical", outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* ── TAGS */}
          <div>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", marginBottom:6 }}>// TAGS (comma separated)</div>
            <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="minimal, catppuccin, bar..."
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, color:C.white, fontFamily:C.mono, fontSize:11, padding:"8px 10px", outline:"none", boxSizing:"border-box" }}/>
          </div>
        </div>

        {msg && <div style={{ marginTop:12, fontSize:11, color:msg.includes("✓")?C.fn:"#f87171", fontFamily:C.mono }}>{msg}</div>}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ padding:"7px 18px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono }}>cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:"7px 18px", border:`1px solid ${C.fn}66`, background:`${C.fn}11`, color:C.fn, cursor:"pointer", fontSize:10, fontFamily:C.mono, fontWeight:600, opacity:saving?0.6:1 }}>
            {saving ? (uploadingImgs ? "uploading..." : "saving...") : "save changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailPage({ rice, onBack, onProfiles, currentUser, userBadge, onTagClick }) {
  const mobile = useMobile();
  const [tab, setTab]       = useState("description");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deps = rice.deps && rice.deps.length > 0 ? rice.deps : [];
  const cmd = deps.length > 0
  ? `bash <(curl -fsSL rice-share.vercel.app/install/${rice.author}/${rice.slug})`
  : `# no deps listed for this rice`;
const scriptText = generateUniversalScript(deps, rice.author, rice.slug);
  const copy = () => {
    navigator.clipboard?.writeText(cmd).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('rice').update({ installs:(rice.installs||0)+1 }).eq('id',rice.id);
    }).catch(()=>{});
  };

  const script = [
    {k:"comment",v:`#!/usr/bin/env bash`},
    {k:"comment",v:`# ${rice.title} — @${rice.author}`},
    {k:"blank",  v:``},
    {k:"kw",     v:`set -euo pipefail`},
    {k:"blank",  v:``},
    {k:"comment",v:`# detect package manager`},
    {k:"kw",     v:`if   command -v pacman &>/dev/null; then PKG=arch`},
    {k:"kw",     v:`elif command -v apt    &>/dev/null; then PKG=debian`},
    {k:"kw",     v:`fi`},
    {k:"blank",  v:``},
    {k:"comment",v:`# install deps`},
    {k:"code",   v:`sudo $PKG install ${rice.wm} ${rice.terminal} waybar`},
    {k:"blank",  v:``},
    {k:"comment",v:`# copy configs`},
    {k:"code",   v:`cp -r dotfiles/${rice.wm}/ ~/.config/`},
    {k:"blank",  v:``},
    {k:"string", v:`echo "✓ ${rice.title} ready"`},
  ];
  const lc = k => k==="comment"?C.gray2:k==="kw"?C.kw:k==="string"?C.string:k==="blank"?"transparent":C.gray1;

  const TabContent = () => (
    <div>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:14, overflowX:"auto" }}>
        {["description","script","files"].map(t=>(
          <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:"7px 16px", background:"none", borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:tab===t?`2px solid ${C.fn}`:"2px solid transparent", color:tab===t?C.fn:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:-1, transition:"color .15s", flexShrink:0, fontWeight:tab===t?700:400 }}>{t}</button>
        ))}
      </div>
      {tab==="description" && (
        <div style={{ background:C.bgDeep, border:`1px solid ${C.border}`, padding:"18px 20px", animation:"fadeIn .2s ease" }}>
          <p style={{ fontSize:13, color:C.gray1, fontFamily:C.mono, lineHeight:2, margin:0, whiteSpace:"pre-wrap" }}>{rice.description||"// no description provided."}</p>
        </div>
      )}
{tab==="script" && (
  <div style={{ background:C.bgDeep, border:`1px solid ${C.border}`, animation:"fadeIn .2s ease" }}>
    <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, display:"flex", justifyContent:"space-between" }}>
      <span>install.sh</span><span style={{ color:C.fn }}>bash · universal</span>
    </div>
    <div style={{ padding:"12px 16px", overflowX:"auto", maxHeight:320, overflowY:"auto" }}>
      {scriptText.split('\n').map((line,i)=>(
        <div key={i} style={{ display:"flex", gap:14, lineHeight:1.9 }}>
          <span style={{ fontSize:10, color:C.gray3, userSelect:"none", minWidth:18, textAlign:"right", flexShrink:0 }}>{i+1}</span>
          <span style={{ fontSize:11, fontFamily:C.mono, color:line.startsWith('#')?C.gray2:line.includes('echo')?C.string:C.gray1, whiteSpace:"pre" }}>{line||" "}</span>
        </div>
      ))}
    </div>
  </div>
)}
      {tab==="files" && (
        <div style={{ background:C.bgDeep, border:`1px solid ${C.border}`, padding:"14px 16px", animation:"fadeIn .2s ease" }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", marginBottom:12 }}>// tree ./{rice.slug}</div>
          {[
            {d:0,n:rice.slug+"/",hi:true},{d:1,n:"dotfiles/",hi:false},{d:2,n:rice.wm+"/",hi:true},
            {d:3,n:"config",hi:false},{d:2,n:"waybar/",hi:false},{d:2,n:(rice.terminal||"terminal")+"/",hi:true},
            {d:1,n:"wallpaper.png",hi:false},{d:1,n:"."+(rice.shell||"shell")+"rc",hi:false},
            {d:1,n:"install.sh",hi:true},{d:1,n:"meta.json",hi:false},
          ].map((f,i)=>(
            <div key={i} style={{ fontFamily:C.mono, fontSize:11, lineHeight:2, paddingLeft:f.d*14, color:f.hi?C.fn:C.gray2 }}>
              {f.d>0&&<span style={{color:C.gray3}}>└── </span>}{f.n}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const InstallBar = () => (
    <div style={{ background:C.bgDeep, border:`1px solid ${C.borderHi}`, marginBottom:16 }}>
      <div style={{ padding:"5px 12px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>$ one-line install</div>
      <div style={{ padding:"10px 12px", display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ color:C.gray3, fontSize:13, flexShrink:0 }}>$</span>
        <code style={{ fontFamily:C.mono, fontSize:mobile?10:12, color:C.white, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{cmd}</code>
        <button className="bs" onClick={copy} style={{ padding:"5px 12px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:10, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>{copied?"✓":"copy"}</button>
      </div>
    </div>
  );

  /* ── DEPS COPY CARD (sidebar) ── */
  const DepsCopyCard = ({ deps, distro }) => {
    const [copied, setCopied] = useState(false);
    const mgr = distro && distro.toLowerCase().includes("arch") ? "paru -S" :
                 distro && distro.toLowerCase().includes("ubuntu") ? "apt install" :
                 distro && distro.toLowerCase().includes("fedora") ? "dnf install" :
                 "paru -S";
    const cmd = `${mgr} ${deps.join(" ")}`;
    const doCopy = () => {
      navigator.clipboard?.writeText(cmd).catch(()=>{});
      setCopied(true); setTimeout(()=>setCopied(false), 2000);
    };
    return (
      <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep }}>
        <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// DEPS</span>
          <button onClick={doCopy} style={{ padding:"2px 10px", border:`1px solid ${C.fn}55`, background:"transparent", color:copied?C.fn:C.gray2, cursor:"pointer", fontSize:9, fontFamily:C.mono, transition:"all .15s" }}>
            {copied ? "✓ copied" : "copy all"}
          </button>
        </div>
        <div style={{ padding:"10px 14px", display:"flex", flexWrap:"wrap", gap:5 }}>
          {deps.map(d=>(
            <span key={d} style={{ fontSize:10, fontFamily:C.mono, color:C.fn, border:`1px solid ${C.fn}33`, padding:"2px 8px", background:`${C.fn}09` }}>{d}</span>
          ))}
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <LikeButton rice={rice}/>
        <ShareButton rice={rice}/>
      </div>
      {currentUser && (currentUser.username===rice.author||currentUser.firstName===rice.author) && (
        <button onClick={()=>setEditOpen(true)}
          style={{ width:"100%", padding:"7px", border:`1px solid ${C.fn}44`, background:"transparent", color:C.fn, cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"all .15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${C.fn}11`;e.currentTarget.style.borderColor=C.fn;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.fn}44`;}}>
          ✏ edit rice
        </button>
      )}
      <div style={{ border:`1px solid ${C.border}`, padding:"14px 16px", background:C.bgDeep }}>
        <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", marginBottom:10 }}>// AUTHOR</div>
        <div style={{ fontSize:13, color:C.fn, fontFamily:C.mono, marginBottom:10 }}>@{rice.author}</div>
        <button onClick={onProfiles} className="bs" style={{ width:"100%", padding:"7px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"all .15s" }}>view profile →</button>
      </div>
      <div style={{ border:`1px solid ${C.border}`, padding:"14px 16px", background:C.bgDeep }}>
        <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", marginBottom:10 }}>// STACK</div>
        {[{k:"wm",v:rice.wm},{k:"distro",v:rice.distro},{k:"terminal",v:rice.terminal},{k:"shell",v:rice.shell}].filter(r=>r.v).map(r=>(
          <div key={r.k} style={{ display:"flex", justifyContent:"space-between", marginBottom:7, fontSize:11 }}>
            <span style={{ color:C.gray3, fontFamily:C.mono }}>{r.k}</span>
            <span style={{ color:r.k==="wm"?C.kw:C.gray1, fontFamily:C.mono }}>{r.v}</span>
          </div>
        ))}
      </div>
      {rice.deps && rice.deps.length > 0 && (
        <DepsCopyCard deps={rice.deps} distro={rice.distro}/>
      )}
      <div style={{ padding:"10px 12px", border:`1px solid ${C.border}`, fontSize:10, color:C.gray3, fontFamily:C.mono, lineHeight:1.7 }}>
        <span style={{fontStyle:"italic"}}>// </span>auto backup in <code style={{color:C.fn}}>~/.rice-backup/</code>
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <ReportButton rice={rice} currentUser={currentUser}/>
      </div>
      {editOpen && <EditRiceModal rice={rice} onClose={()=>setEditOpen(false)}/>}
    </div>
  );

  /* ── MOBILE LAYOUT ─────────────────────────────────────────── */
  if (mobile) return (
    <div style={{ padding:"14px 14px 48px", animation:"slideR .2s ease" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize:11, color:C.gray2, marginBottom:14, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
        <span onClick={onBack} style={{ color:C.fn, cursor:"pointer" }}>gallery</span>
        <span style={{ color:C.gray3 }}>/</span>
        <span onClick={onProfiles} style={{ color:C.gray2, cursor:"pointer" }}>{rice.author}</span>
      </div>

      {/* Cover image full-width */}
      {(rice.cover_url || (rice.images && rice.images.length > 0)) && (
        <div style={{ marginBottom:14, marginLeft:-14, marginRight:-14 }}>
          <img src={rice.cover_url || rice.images[0]} alt={rice.title} style={{ width:"100%", display:"block", maxHeight:220, objectFit:"cover" }}/>
        </div>
      )}

      {/* Title + stats row */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
          <div style={{ fontFamily:C.display, fontSize:"clamp(20px,6vw,28px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", lineHeight:1.1, flex:1 }}>
            {rice.title}
            {rice.featured && <span style={{ fontSize:8, color:C.string, border:`1px solid ${C.string}44`, padding:"1px 6px", fontFamily:C.mono, marginLeft:8, verticalAlign:"middle" }}>★</span>}
          </div>
          <div style={{ display:"flex", gap:14, flexShrink:0 }}>
            {[{v:fmt(rice.likes||0),l:"♥"},{v:fmt(rice.installs||0),l:"↓"}].map(s=>(
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.white, fontFamily:C.mono, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:10, color:C.gray3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:11, fontFamily:C.mono, color:C.gray2 }}>
          <span style={{ color:C.gray3 }}>by </span>
          <span onClick={onProfiles} style={{ color:C.fn, cursor:"pointer" }}>@{rice.author}</span>
          <span style={{ color:C.gray3, margin:"0 6px" }}>·</span>
          <span style={{ color:C.kw }}>{rice.wm}</span>
          {rice.distro && <><span style={{ color:C.gray3, margin:"0 6px" }}>·</span><span>{rice.distro}</span></>}
        </div>
      </div>

      {/* Tags */}
      {rice.tags && rice.tags.length > 0 && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
          {rice.tags.map(t=><span key={t} onClick={onTagClick?()=>onTagClick(t):undefined} style={{ fontSize:10, fontFamily:C.mono, color:C.kw, border:`1px solid ${C.kw}33`, padding:"1px 8px", cursor:onTagClick?"pointer":"default", transition:"opacity .15s" }} onMouseEnter={e=>{if(onTagClick)e.currentTarget.style.opacity=".6";}} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>#{t}</span>)}
        </div>
      )}

      {/* Palette */}
      {rice.dots && rice.dots.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// palette</span>
          <div style={{ display:"flex", gap:5 }}>
            {rice.dots.map((d,i) => (
              <div key={i} title={d} style={{ width:16, height:16, background:d, borderRadius:2, border:`1px solid ${d}55` }}/>
            ))}
          </div>
          <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono }}>{rice.dots[0]}</span>
        </div>
      )}

      {/* Install bar */}
      <InstallBar/>

      {/* Like + Share */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
        <LikeButton rice={rice}/>
        <ShareButton rice={rice}/>
      </div>

      {/* Tabs + content */}
      <TabContent/>
      <CommentsSection rice={rice} currentUser={currentUser}/>
      <SimilarRice rice={rice} onSelect={onBack}/>

      {/* Stack compact inline */}
      <div style={{ marginTop:16, border:`1px solid ${C.border}`, background:C.bgDeep }}>
        <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// STACK</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
          {[{k:"wm",v:rice.wm},{k:"distro",v:rice.distro},{k:"terminal",v:rice.terminal},{k:"shell",v:rice.shell}].filter(r=>r.v).map((r,i,a)=>(
            <div key={r.k} style={{ padding:"10px 14px", borderBottom:i<a.length-2?`1px solid ${C.border}`:"none", borderRight:i%2===0?`1px solid ${C.border}`:"none" }}>
              <div style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginBottom:3 }}>{r.k}</div>
              <div style={{ fontSize:12, color:r.k==="wm"?C.kw:C.white, fontFamily:C.mono }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Author */}
      <div style={{ marginTop:10, border:`1px solid ${C.border}`, padding:"12px 14px", background:C.bgDeep, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:9, color:C.gray3, marginBottom:4 }}>// AUTHOR</div>
          <div style={{ fontSize:13, color:C.fn, fontFamily:C.mono }}>@{rice.author}</div>
        </div>
        <button onClick={onProfiles} className="bs" style={{ padding:"7px 14px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:10, fontFamily:C.mono }}>profile →</button>
      </div>
      <div style={{ marginTop:8, display:"flex", justifyContent:"flex-end" }}>
        <ReportButton rice={rice} currentUser={currentUser}/>
      </div>
      {currentUser && (currentUser.username===rice.author||currentUser.firstName===rice.author) && (
        <button onClick={()=>setEditOpen(true)}
          style={{ marginTop:8, width:"100%", padding:"10px", border:`1px solid ${C.fn}44`, background:"transparent", color:C.fn, cursor:"pointer", fontSize:11, fontFamily:C.mono }}>
          ✏ edit rice
        </button>
      )}
      {editOpen && <EditRiceModal rice={rice} onClose={()=>setEditOpen(false)}/>}
    </div>
  );

  /* ── DESKTOP LAYOUT ────────────────────────────────────────── */
  return (
    <div style={{ maxWidth:960, margin:"0 auto", padding:"28px 28px 60px", animation:"slideR .2s ease" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize:11, color:C.gray2, marginBottom:24, display:"flex", gap:6, alignItems:"center" }}>
        <span onClick={onBack} style={{ color:C.fn, cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".6"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >gallery</span>
        <span style={{ color:C.gray3 }}>/</span>
        <span onClick={onProfiles} style={{ color:C.gray2, cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.color=C.fn}
          onMouseLeave={e=>e.currentTarget.style.color=C.gray2}
        >{rice.author}</span>
        <span style={{ color:C.gray3 }}>/</span>
        <span style={{ color:C.white }}>{rice.slug}</span>
      </div>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20, marginBottom:20 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:C.display, fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", lineHeight:1 }}>{rice.title}</span>
            {rice.featured && <span style={{ fontSize:9, color:C.string, border:`1px solid ${C.string}44`, padding:"2px 8px", fontFamily:C.mono }}>★ featured</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:0, fontFamily:C.mono, fontSize:12, flexWrap:"wrap" }}>
            <span style={{ color:C.gray3, marginRight:6 }}>by</span>
            <span onClick={onProfiles} style={{ color:C.fn, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.fn+"33", marginRight:14 }}>@{rice.author}</span>
            {[rice.wm, rice.distro, rice.terminal, rice.shell].filter(Boolean).map((v,i)=>(
              <span key={i}><span style={{ color:i===0?C.kw:C.gray2 }}>{v}</span><span style={{ color:C.gray3, margin:"0 8px" }}>·</span></span>
            ))}
          </div>
          {rice.tags && rice.tags.length > 0 && (
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
              {rice.tags.map(t=><span key={t} onClick={onTagClick?()=>onTagClick(t):undefined} style={{ fontSize:9, fontFamily:C.mono, color:C.kw, border:`1px solid ${C.kw}33`, padding:"1px 8px", cursor:onTagClick?"pointer":"default", transition:"opacity .15s" }} onMouseEnter={e=>{if(onTagClick)e.currentTarget.style.opacity=".6";}} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>#{t}</span>)}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:24, flexShrink:0 }}>
          {[{v:fmt(rice.likes||0),l:"likes"},{v:fmt(rice.installs||0),l:"installs"}].map(s=>(
            <div key={s.l} style={{ textAlign:"right" }}>
              <div style={{ fontSize:24, fontWeight:700, color:C.white, fontFamily:C.mono, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:9, color:C.gray3, marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Install bar */}
      <InstallBar/>

      {/* Body: left + sidebar */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:20, alignItems:"start", marginTop:8 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <ImageGallery images={rice.images}/>
          <TabContent/>
          <CommentsSection rice={rice} currentUser={currentUser}/>
          <SimilarRice rice={rice} onSelect={onBack}/>
        </div>
        <SidebarContent/>
      </div>
    </div>
  );
}

/* ── LEGAL PAGE COMPONENTS ──────────────────────────────────────── */
function LegalLayout({ title, comment, onNav, children }) {
  const mobile = useMobile();
  const NAV_LINKS = [
    { id:"getting-started", label:"termini",  page:"terms"   },
    { id:"privacy",         label:"privacy",  page:"privacy" },
  ];
  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 40px 32px" }}>
        <div style={{ fontSize:11, color:C.gray2, marginBottom:28, display:"flex", gap:6, alignItems:"center", fontFamily:C.mono }}>
          <span onClick={()=>onNav("home")} style={{ color:C.fn, cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".6"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          >home</span>
          <span style={{ color:C.gray3 }}>/</span>
          <span style={{ color:C.white }}>{comment}</span>
        </div>
        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// legal</div>
        <div style={{ fontFamily:C.display, fontSize:"clamp(28px,4vw,42px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", marginBottom:32, lineHeight:1 }}>{title}</div>
        {/* Link tra le due pagine */}
        <div style={{ display:"flex", gap:10, marginBottom:40, paddingBottom:24, borderBottom:`1px solid ${C.border}` }}>
          {[["terms","Terms of Service"],["privacy","Privacy Policy"]].map(([p,label])=>(
            <button key={p} onClick={()=>onNav(p)} style={{ padding:"6px 16px", border:`1px solid ${comment===p?C.white:C.border}`, background:"transparent", color:comment===p?C.white:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}
              onMouseEnter={e=>{ if(comment!==p){e.currentTarget.style.borderColor=C.borderHi;e.currentTarget.style.color=C.gray1;} }}
              onMouseLeave={e=>{ if(comment!==p){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.gray2;} }}
            >{label}</button>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

function LegalSec({ n, title, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8 }}>// {n}</div>
      <div style={{ fontFamily:C.display, fontSize:"clamp(16px,2vw,22px)", fontWeight:800, color:C.white, letterSpacing:"-0.02em", marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>{title}</div>
      {children}
    </div>
  );
}
function LegalP({ children }) {
  return <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:12 }}><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>{children}</p>;
}
function LegalLi({ children }) {
  return (
    <div style={{ display:"flex", gap:10, marginBottom:8, fontSize:12, fontFamily:C.mono, color:C.gray2, lineHeight:1.8 }}>
      <span style={{ color:C.gray3, flexShrink:0 }}>→</span><span>{children}</span>
    </div>
  );
}
function LegalNote({ children }) {
  return (
    <div style={{ padding:"10px 14px", border:`1px solid ${C.string}44`, background:`${C.string}08`, marginBottom:14, fontSize:11, fontFamily:C.mono, color:C.string, lineHeight:1.8 }}>
      <span style={{fontStyle:"italic"}}>// </span>{children}
    </div>
  );
}

/* ── TERMS PAGE ──────────────────────────────────────────────────── */
function TermsPage({ onNav }) {
  return (
    <LegalLayout title="Terms of Service" comment="terms" onNav={onNav}>
      <LegalSec n="01 — acceptance" title="Acceptance of terms">
        <LegalP>By using Riceshare you declare that you have read, understood and accepted these Terms of Service.</LegalP>
        <LegalNote>If you do not accept these Terms, please do not use the service.</LegalNote>
      </LegalSec>
      <LegalSec n="02 — service" title="Service description">
        <LegalP>Riceshare is an open source platform for sharing Linux desktop configurations ("rice"), dotfiles and installation scripts.</LegalP>
        <LegalLi>Upload and share desktop configurations</LegalLi>
        <LegalLi>Browse and install rice via bash script with a single command</LegalLi>
        <LegalLi>Interact with the community through likes, comments and public profiles</LegalLi>
        <LegalLi>Access the public API to integrate content into other projects</LegalLi>
      </LegalSec>
      <LegalSec n="03 — accounts" title="User accounts">
        <LegalP>To upload content you need to create an account. You are responsible for keeping your credentials confidential.</LegalP>
        <LegalLi>You must be at least 13 years old to create an account</LegalLi>
        <LegalLi>You may create only one account per person</LegalLi>
        <LegalLi>Information provided must be accurate and up to date</LegalLi>
        <LegalLi>You are responsible for all activities that occur through your account</LegalLi>
      </LegalSec>
      <LegalSec n="04 — content" title="Uploaded content">
        <LegalP>By uploading content to Riceshare, you declare that you own the content or have the right to distribute it, that it does not violate third-party rights and does not contain malware or malicious code.</LegalP>
        <LegalNote>Riceshare reserves the right to remove any content that violates these terms, at its sole discretion.</LegalNote>
      </LegalSec>
      <LegalSec n="05 — conduct" title="Acceptable conduct">
        <LegalP>By using Riceshare you agree not to:</LegalP>
        <LegalLi>Upload scripts containing malicious code, backdoors or software designed to harm systems</LegalLi>
        <LegalLi>Impersonate other users, people or organizations</LegalLi>
        <LegalLi>Attempt to access unauthorized parts of the service</LegalLi>
        <LegalLi>Use the service for illegal activities or those that violate third-party rights</LegalLi>
        <LegalLi>Send spam or abuse platform features</LegalLi>
      </LegalSec>
      <LegalSec n="06 — ip" title="Intellectual property">
        <LegalP>The name "Riceshare", the logo and design are owned by Riceshare. Content uploaded by users remains their property.</LegalP>
        <LegalP>Content uploaded by users remains the property of their respective authors. Riceshare does not claim ownership of uploaded rice or dotfiles.</LegalP>
      </LegalSec>
      <LegalSec n="07 — disclaimer" title="Limitation of liability">
        <LegalNote>Installing rice from Riceshare modifies system configuration files. Always back up before installing any configuration. Riceshare is not responsible for system damage resulting from use of installation scripts.</LegalNote>
        <LegalP>Riceshare is provided "as is", without warranties of any kind. We are not responsible for direct or indirect damages, data loss or service interruptions.</LegalP>
      </LegalSec>
      <LegalSec n="08 — changes" title="Changes to terms">
        <LegalP>Riceshare reserves the right to modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.</LegalP>
      </LegalSec>
      <LegalSec n="09 — contact" title="Contact">
        <LegalLi>Discord: <span style={{color:C.kw}}>discord.gg/riceshare</span></LegalLi>
        <div style={{ marginTop:20, padding:"12px 16px", border:`1px solid ${C.border}`, background:C.bgDeep, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:2 }}>
          <div style={{color:C.gray3,fontStyle:"italic",marginBottom:6}}>// document</div>
          <div>version <span style={{color:C.white}}>1.0.0</span></div>
          <div>last updated <span style={{color:C.white}}>march 2026</span></div>
        </div>
      </LegalSec>
    </LegalLayout>
  );
}

/* ── PRIVACY PAGE ────────────────────────────────────────────────── */
function PrivacyPage({ onNav }) {
  return (
    <LegalLayout title="Privacy Policy" comment="privacy" onNav={onNav}>
      <LegalSec n="01 — intro" title="Introduction">
        <LegalP>Riceshare is an open source platform for sharing Linux desktop configurations. This Privacy Policy describes what data we collect, how we use it and what rights you have as a user.</LegalP>
        <LegalNote>We do not sell, rent or transfer your personal data to third parties for commercial purposes.</LegalNote>
      </LegalSec>
      <LegalSec n="02 — data" title="Data collected">
        <LegalP>We collect only data necessary for the service to function:</LegalP>
        <div style={{ border:`1px solid ${C.border}`, marginBottom:16, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:C.bgDeep, borderBottom:`1px solid ${C.border}`, padding:"7px 14px", fontSize:9, color:C.gray3, letterSpacing:"0.1em" }}>
            <span>DATA</span><span>PURPOSE</span><span>LEGAL BASIS</span>
          </div>
          {[
            ["Email",           "Account authentication",       "Contract"],
            ["Username",        "Public identification",     "Contract"],
            ["Password (hash)", "Account security",            "Contract"],
            ["Uploaded rice",   "Service operation",   "Contract"],
            ["Likes & installs", "Statistics",                  "Legitimate interest"],
            ["IP address",      "Security and anti-abuse",       "Legitimate interest"],
          ].map((row,i,arr)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"9px 14px", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", fontSize:11, fontFamily:C.mono }}>
              <span style={{color:C.white}}>{row[0]}</span>
              <span style={{color:C.gray2}}>{row[1]}</span>
              <span style={{color:C.kw}}>{row[2]}</span>
            </div>
          ))}
        </div>
        <LegalP>We do not collect precise geolocation data, private communication contents or financial information.</LegalP>
      </LegalSec>
      <LegalSec n="03 — usage" title="How we use data">
        <LegalLi>Provide and maintain the Riceshare service</LegalLi>
        <LegalLi>Authenticate users and protect accounts</LegalLi>
        <LegalLi>Display public profiles and rice statistics</LegalLi>
        <LegalLi>Send service notifications (email verification, password reset)</LegalLi>
        <LegalLi>Prevent abuse, spam and fraudulent activity</LegalLi>
        <LegalP>We do not use your data for advertising profiling. Riceshare is a completely ad-free platform.</LegalP>
      </LegalSec>
      <LegalSec n="04 — storage" title="Storage and security">
        <LegalP>Data is stored on Supabase (PostgreSQL database, SOC 2 certified) and Vercel (hosting). Passwords are never stored in plain text — we use secure hashing via Clerk.</LegalP>
        <LegalNote>In case of a data breach, we will notify affected parties within 72 hours as required by GDPR.</LegalNote>
      </LegalSec>
      <LegalSec n="05 — third-parties" title="Third-party services">
        <LegalLi><span style={{color:C.white}}>Clerk</span> — authentication and account management (<span style={{color:C.kw}}>clerk.com/privacy</span>)</LegalLi>
        <LegalLi><span style={{color:C.white}}>Supabase</span> — database and storage (<span style={{color:C.kw}}>supabase.com/privacy</span>)</LegalLi>
        <LegalLi><span style={{color:C.white}}>Vercel</span> — hosting and CDN (<span style={{color:C.kw}}>vercel.com/legal/privacy-policy</span>)</LegalLi>
        <LegalP>We do not share data with any parties other than the listed providers.</LegalP>
      </LegalSec>
      <LegalSec n="06 — cookies" title="Cookies and tracking">
        <LegalLi><span style={{color:C.white}}>Session cookies</span> — required to keep the user authenticated</LegalLi>
        <LegalLi><span style={{color:C.white}}>Preference cookies</span> — to remember local settings</LegalLi>
        <LegalNote>We do not use tracking cookies, Google Analytics or behavioral profiling tools. No advertising cookies.</LegalNote>
      </LegalSec>
      <LegalSec n="07 — rights" title="Your rights (GDPR)">
        <LegalLi><span style={{color:C.white}}>Access</span> — request a copy of all your personal data</LegalLi>
        <LegalLi><span style={{color:C.white}}>Rectification</span> — correct inaccurate or incomplete data</LegalLi>
        <LegalLi><span style={{color:C.white}}>Erasure</span> — request removal of your account and all data</LegalLi>
        <LegalLi><span style={{color:C.white}}>Portability</span> — receive data in a structured, readable format</LegalLi>
        <LegalLi><span style={{color:C.white}}>Objection</span> — object to processing based on legitimate interest</LegalLi>
        <LegalP>To exercise these rights contact us through the channels listed below. We will respond within 30 days.</LegalP>
      </LegalSec>
      <LegalSec n="08 — retention" title="Data retention">
        <LegalLi>Account data — retained while the account is active</LegalLi>
        <LegalLi>Uploaded content — retained until deleted by the user</LegalLi>
        <LegalLi>Security logs — retained for a maximum of 90 days</LegalLi>
        <LegalP>Upon account closure, personal data is deleted within 30 days.</LegalP>
      </LegalSec>
      <LegalSec n="09 — minors" title="Minors">
        <LegalP>Riceshare is not intended for users under 13 years of age. We do not knowingly collect data from minors. If you become aware that a minor has created an account, please contact us immediately.</LegalP>
      </LegalSec>
      <LegalSec n="10 — changes" title="Changes to this policy">
        <LegalP>Riceshare reserves the right to update this Privacy Policy. Significant changes will be communicated via site notice or email. Continued use of the service constitutes acceptance of the new policy.</LegalP>
      </LegalSec>
      <LegalSec n="11 — contact" title="Contact">
        <LegalLi>Discord: <span style={{color:C.kw}}>discord.gg/riceshare</span></LegalLi>
        <LegalP>For urgent data security requests, specify "DATA PRIVACY" in the subject.</LegalP>
        <div style={{ marginTop:20, padding:"12px 16px", border:`1px solid ${C.border}`, background:C.bgDeep, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:2 }}>
          <div style={{color:C.gray3,fontStyle:"italic",marginBottom:6}}>// document</div>
          <div>version <span style={{color:C.white}}>1.0.0</span></div>
          <div>last updated <span style={{color:C.white}}>march 2026</span></div>
          <div>compliance <span style={{color:C.white}}>GDPR · CCPA</span></div>
        </div>
      </LegalSec>
    </LegalLayout>
  );
}

/* ── REPORT BUTTON ──────────────────────────────────────────────── */
function ReportButton({ rice, currentUser }) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState("");
  const [custom, setCustom]   = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const btnRef                = useRef(null);

  const REASONS = [
    "malicious script / malware",
    "stolen config — not the author's work",
    "inappropriate content",
    "spam or self-promotion",
    "broken / incomplete rice",
    "other",
  ];

  useEffect(() => {
    if (!open) return;
    const h = e => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('reports').insert({
        rice_id:    rice.id,
        reporter_id: currentUser?.id || null,
        reason:     reason,
        notes:      reason === "other" ? custom : "",
        status:     "open",
      });
      setSent(true);
      setTimeout(() => { setSent(false); setOpen(false); setReason(""); setCustom(""); }, 2500);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (!currentUser) return null;

  return (
    <div ref={btnRef} style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        background:"none", border:`1px solid ${C.border}`, color:C.gray3,
        cursor:"pointer", fontSize:10, fontFamily:C.mono, padding:"5px 10px",
        transition:"all .15s", display:"flex", alignItems:"center", gap:5,
      }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#a0585866"; e.currentTarget.style.color="#c07070"; }}
        onMouseLeave={e=>{ if(!open){ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.gray3; } }}
      >
        ⚑ report
      </button>

      {open && !sent && (
        <div style={{
          position:"absolute", bottom:"calc(100% + 6px)", right:0, zIndex:400,
          background:C.bgDeep, border:`1px solid ${C.borderHi}`,
          minWidth:260, boxShadow:"0 8px 24px rgba(0,0,0,0.6)",
          animation:"fadeUp .15s ease",
        }}>
          <div style={{ padding:"8px 14px 7px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>
            // report this rice
          </div>
          {REASONS.map(r=>(
            <button key={r} onClick={()=>setReason(r)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"9px 14px", background:reason===r?`${C.string}10`:"transparent",
              border:"none", borderBottom:`1px solid ${C.border}`,
              cursor:"pointer", textAlign:"left",
            }}
              onMouseEnter={e=>{ if(reason!==r) e.currentTarget.style.background=C.bgCard; }}
              onMouseLeave={e=>{ if(reason!==r) e.currentTarget.style.background="transparent"; }}
            >
              <span style={{ fontSize:9, color:reason===r?C.string:C.gray3, flexShrink:0 }}>{reason===r?"●":"○"}</span>
              <span style={{ fontSize:11, color:reason===r?C.white:C.gray2, fontFamily:C.mono }}>{r}</span>
            </button>
          ))}
          {reason==="other" && (
            <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}` }}>
              <input
                value={custom}
                onChange={e=>setCustom(e.target.value)}
                placeholder="describe the issue..."
                style={{ width:"100%", background:C.bgDeep, border:`1px solid ${C.border}`, color:C.white, padding:"6px 10px", fontSize:11, fontFamily:C.mono, outline:"none" }}
              />
            </div>
          )}
          <div style={{ padding:"10px 14px", display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button onClick={()=>setOpen(false)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.gray3, cursor:"pointer", fontSize:10, fontFamily:C.mono, padding:"5px 12px" }}>cancel</button>
            <button onClick={submit} disabled={!reason||loading} style={{
              background:"transparent", border:`1px solid ${reason?"#a0585866":C.border}`,
              color:reason?"#c07070":C.gray3, cursor:reason?"pointer":"default",
              fontSize:10, fontFamily:C.mono, padding:"5px 12px", transition:"all .15s",
            }}>
              {loading?"sending...":"send report"}
            </button>
          </div>
        </div>
      )}

      {sent && (
        <div style={{ position:"absolute", bottom:"calc(100% + 6px)", right:0, zIndex:400, background:C.bgDeep, border:`1px solid ${C.fn}44`, padding:"10px 16px", fontSize:11, fontFamily:C.mono, color:C.fn, whiteSpace:"nowrap" }}>
          ✓ report sent — thank you
        </div>
      )}
    </div>
  );
}

/* ── ADMIN PAGE ──────────────────────────────────────────────────── */
function AdminPage({ onNav, onSelectRice, onSelectUser }) {
  const mobile = useMobile();
  const { user: adminUser } = useUser();
  const [tab, setTab]           = useState("pending");
  const [reportTab, setReportTab] = useState("open");
  const [pending, setPending]   = useState([]);
  const [reports, setReports]   = useState([]);
  const [history, setHistory]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [msg, setMsg]           = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [histFilter, setHistFilter] = useState("all");
  const [adminBadge, setAdminBadge] = useState("staff");

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(""), 3000); };

  const load = async () => {
    setLoading(true);
    const { supabase } = await import('../lib/supabase');
    const [pend, reps, hist, usrs, allRice] = await Promise.all([
      supabase.from('rice').select('*, users(username)').eq('status','pending').order('created_at',{ascending:false}),
      supabase.from('reports').select('*, rice(*, users(username))').eq('status','open').order('created_at',{ascending:false}),
      supabase.from('reports').select('id,rice_id,reason,notes,action,status,resolved_at,resolved_by,reporter_id, rice(id,title,author_id)').neq('status','open').order('resolved_at',{ascending:false}).limit(100),
      supabase.from('users').select('*').order('created_at',{ascending:false}),
      supabase.from('rice').select('id,installs,status,created_at'),
    ]);
    setPending(pend.data||[]);
    setReports(reps.data||[]);
    setHistory(hist.data||[]);
    setUsers(usrs.data||[]);
    // ricava il badge dell'admin loggato
    const selfUser = (usrs.data||[]).find(u => u.id === adminUser?.id);
    setAdminBadge(selfUser?.badge || "staff");
    const rice = allRice.data||[];
    // weekly chart (last 8 weeks)
    const now8 = new Date();
    const weeks = Array.from({length:8},(_,i)=>{
      const start=new Date(now8); start.setDate(start.getDate()-7*(7-i)); start.setHours(0,0,0,0);
      const end=new Date(start); end.setDate(end.getDate()+7);
      const label=`w${8-i}`; return {start,end,label,total:0,approved:0};
    });
    rice.forEach(r=>{ if(!r.created_at) return; const d=new Date(r.created_at); const w=weeks.find(x=>d>=x.start&&d<x.end); if(w){w.total++;if(r.status==="approved")w.approved++;} });
    setStats({
      totalRice:    rice.length,
      approved:     rice.filter(r=>r.status==="approved").length,
      pendingCount: rice.filter(r=>r.status==="pending").length,
      totalInstalls: rice.reduce((a,r)=>a+(r.installs||0),0),
      totalUsers:   (usrs.data||[]).length,
      weeklyChart:  weeks,
    });
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const approve = async (riceId) => {
    const { supabase } = await import('../lib/supabase');
    await supabase.from('rice').update({ status:'approved' }).eq('id', riceId);
    // Auto-compute badges for the rice author
    try {
      const rice = pending.find(r => r.id === riceId);
      if (rice?.author_id) {
        const [{ data: authorRices }, { data: userData }] = await Promise.all([
          supabase.from('rice').select('*, users(username)').eq('author_id', rice.author_id),
          supabase.from('users').select('created_at').eq('id', rice.author_id).single(),
        ]);
        const updatedRices = (authorRices || []).map(r => r.id === riceId ? {...r, status:'approved'} : r);
        await computeBadges(rice.author_id, updatedRices, userData?.created_at, supabase);
      }
    } catch(e) { /* non-blocking */ }
    setPending(prev=>prev.filter(r=>r.id!==riceId));
    flash("✓ rice approved");
  };

  const reject = async (riceId) => {
    const { supabase } = await import('../lib/supabase');
    await supabase.from('rice').update({ status:'rejected' }).eq('id', riceId);
    setPending(prev=>prev.filter(r=>r.id!==riceId));
    flash("✓ rice rejected");
  };

  const deleteRice = async (riceId, reason, authorId, riceName) => {
    const { supabase } = await import('../lib/supabase');
    const now = new Date().toISOString();
    const adminId = adminUser?.id || null;
    const affected = reports.filter(r=>r.rice_id===riceId);
    if (affected.length > 0) {
      await supabase.from('reports')
        .update({ status:'resolved', action:'rice_deleted', resolved_at:now, resolved_by:adminId })
        .eq('rice_id', riceId).eq('status','open');
      setHistory(prev=>[...affected.map(r=>({...r,status:'resolved',action:'rice_deleted',resolved_at:now})),...prev]);
      setReports(prev=>prev.filter(r=>r.rice_id!==riceId));
    }
    await supabase.from('rice_likes').delete().eq('rice_id', riceId);
    await supabase.from('rice').delete().eq('id', riceId);
    if (authorId) {
      await supabase.from('notifications').insert({
        user_id: authorId,
        type: 'rice_deleted',
        rice_name: riceName || 'unknown',
        message: reason || '',
        read: false,
        created_at: now,
      });
    }
    setDeleteModal(null);
    setDeleteReason("");
    flash("✓ rice deleted");
  };

  const dismissReport = async (reportId) => {
    const { supabase } = await import('../lib/supabase');
    const now = new Date().toISOString();
    const adminId = adminUser?.id || null;
    await supabase.from('reports')
      .update({ status:'dismissed', action:'dismissed', resolved_at:now, resolved_by:adminId })
      .eq('id', reportId);
    const dismissed = reports.find(r=>r.id===reportId);
    if (dismissed) setHistory(prev=>[{...dismissed,status:'dismissed',action:'dismissed',resolved_at:now},...prev]);
    setReports(prev=>prev.filter(r=>r.id!==reportId));
    flash("✓ report dismissed");
  };

  const updateUser = async (userId, field, value) => {
    const { supabase } = await import('../lib/supabase');
    await supabase.from('users').update({ [field]: value }).eq('id', userId);
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,[field]:value}:u));
    flash(`✓ user updated`);
  };

  const banUser = async (userId) => {
    const { supabase } = await import('../lib/supabase');
    await supabase.from('users').update({ badge:'banned', trust_level:-1 }).eq('id', userId);
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,badge:'banned',trust_level:-1}:u));
    flash("✓ user banned");
  };

  const Row = ({ label, value, accent }) => (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 16px", borderBottom:`1px solid ${C.border}`, fontSize:11, fontFamily:C.mono }}>
      <span style={{ color:C.gray3 }}>{label}</span>
      <span style={{ color:accent||C.white, fontWeight:600 }}>{value}</span>
    </div>
  );

  const TABS = ["pending","reports","users","stats"];

  return (
    <div style={{ padding:mobile?"14px 14px 32px":"28px 32px 48px", animation:"fadeIn .2s ease" }}>
      {/* ── DELETE RICE MODAL ── */}
      {deleteModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.bgDeep, border:"1px solid #a0585866", padding:28, maxWidth:460, width:"100%", fontFamily:C.mono }}>
            <div style={{ fontSize:13, color:"#c07070", marginBottom:8, fontWeight:600 }}>🗑 delete rice</div>
            <div style={{ fontSize:11, color:C.gray2, marginBottom:16, lineHeight:1.6 }}>
              stai per eliminare <span style={{ color:C.white }}>"{deleteModal.riceName}"</span>.<br/>
              l'autore riceverà una notifica. aggiungi una motivazione (opzionale):
            </div>
            <textarea
              value={deleteReason}
              onChange={e=>setDeleteReason(e.target.value)}
              placeholder="motivazione dell'eliminazione..."
              maxLength={500}
              rows={4}
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, color:C.white, fontFamily:C.mono, fontSize:11, padding:"8px 10px", resize:"vertical", outline:"none", boxSizing:"border-box" }}
            />
            <div style={{ fontSize:9, color:C.gray3, marginTop:4, marginBottom:14 }}>{deleteReason.length}/500</div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>{ setDeleteModal(null); setDeleteReason(""); }}
                style={{ padding:"6px 18px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono }}>
                annulla
              </button>
              <button onClick={()=>deleteRice(deleteModal.riceId, deleteReason, deleteModal.authorId, deleteModal.riceName)}
                style={{ padding:"6px 18px", border:"1px solid #a0585866", background:"#a0585820", color:"#c07070", cursor:"pointer", fontSize:10, fontFamily:C.mono, fontWeight:600 }}>
                conferma eliminazione
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ maxWidth:960, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:C.string, fontStyle:"italic", fontFamily:C.mono, marginBottom:6 }}>// admin panel</div>
            <div style={{ fontFamily:C.display, fontSize:"clamp(20px,3vw,30px)", fontWeight:900, color:C.white, letterSpacing:"-0.02em" }}>Control Panel</div>
          </div>
          <button onClick={()=>onNav("home")} style={{ background:"none", border:`1px solid ${C.border}`, color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, padding:"6px 14px" }}>← home</button>
        </div>

        {/* Flash message */}
        {msg && (
          <div style={{ padding:"8px 14px", border:`1px solid ${C.fn}44`, background:`${C.fn}08`, fontSize:11, fontFamily:C.mono, color:C.fn, marginBottom:16, animation:"fadeIn .2s ease" }}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 20px", background:"none", borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:tab===t?`2px solid ${C.fn}`:"2px solid transparent", color:tab===t?C.fn:C.gray2, cursor:"pointer", fontSize:12, fontFamily:C.mono, marginBottom:-1, transition:"color .15s", fontWeight:tab===t?700:400 }}>
              {t}{t==="pending"&&pending.length>0?<span style={{ marginLeft:6, fontSize:9, background:C.string, color:"#111", padding:"1px 5px", borderRadius:8 }}>{pending.length}</span>:null}
              {t==="reports"&&reports.length>0?<span style={{ marginLeft:6, fontSize:9, background:"#c07070", color:"#111", padding:"1px 5px", borderRadius:8 }}>{reports.length}</span>:null}
            </button>
          ))}
        </div>

        {loading && <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// loading...</div>}

        {/* ── PENDING ── */}
        {!loading && tab==="pending" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {pending.length===0 ? (
              <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no pending rice — all clear ✓</div>
            ) : pending.map(r=>(
              <div key={r.id} style={{ border:`1px solid ${C.border}`, background:C.bgCard, display:"flex", gap:0, overflow:"hidden", animation:"fadeIn .2s ease" }}>
                {r.cover_url && <img src={r.cover_url} alt="" style={{ width:120, objectFit:"cover", flexShrink:0 }}/>}
                <div style={{ flex:1, padding:"14px 16px", minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, color:C.white, fontFamily:C.mono, fontWeight:500, marginBottom:3 }}>{r.title}</div>
                      <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono }}>
                        <span style={{ color:C.fn }}>@{r.users?.username||r.author_id}</span>
                        <span style={{ color:C.gray3, margin:"0 8px" }}>·</span>
                        <span style={{ color:C.kw }}>{r.wm}</span>
                        <span style={{ color:C.gray3, margin:"0 8px" }}>·</span>
                        {r.distro}
                      </div>
                    </div>
                    <div style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, flexShrink:0 }}>
                      {new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </div>
                  </div>
                  {r.description && (
                    <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.8, marginBottom:10, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                      {r.description}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button onClick={()=>approve(r.id)} style={{ padding:"6px 16px", border:`1px solid ${C.fn}66`, background:`${C.fn}10`, color:C.fn, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>✓ approve</button>
                    <button onClick={()=>reject(r.id)} style={{ padding:"6px 16px", border:`1px solid #a0585866`, background:"transparent", color:"#c07070", cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>✕ reject</button>
                    <button onClick={()=>onSelectRice(normalizeRice(r))} style={{ padding:"6px 14px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono }}>preview →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REPORTS ── */}
        {!loading && tab==="reports" && (
          <div>
            <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${C.border}` }}>
              {["open","history"].map(rt=>(
                <button key={rt} onClick={()=>setReportTab(rt)} style={{ padding:"6px 16px", background:"none", border:"none", borderBottom:reportTab===rt?`1px solid ${C.white}`:"1px solid transparent", color:reportTab===rt?C.white:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:-1, transition:"color .15s" }}>
                  {rt}
                  {rt==="open"&&reports.length>0?<span style={{ marginLeft:5, fontSize:9, background:"#c07070", color:"#111", padding:"1px 5px", borderRadius:8 }}>{reports.length}</span>:null}
                  {rt==="history"&&history.length>0?<span style={{ marginLeft:5, fontSize:9, background:C.border, color:C.gray2, padding:"1px 5px", borderRadius:8 }}>{history.length}</span>:null}
                </button>
              ))}
            </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {reportTab==="open" && (reports.length===0 ? (
              <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no open reports — all clear ✓</div>
            ) : reports.map(r=>(
              <div key={r.id} style={{ border:`1px solid #a0585844`, background:"#a0585806", padding:"14px 16px", animation:"fadeIn .2s ease" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:12, color:C.white, fontFamily:C.mono, marginBottom:4 }}>
                      <span style={{ color:"#c07070" }}>⚑</span>{" "}
                      {r.rice ? (
                        <span
                          onClick={()=>onSelectRice(normalizeRice(r.rice))}
                          style={{ cursor:"pointer", textDecoration:"underline", textDecorationColor:"#c0707066", textUnderlineOffset:3 }}
                        >{r.rice.title}</span>
                      ) : r.rice_id}
                    </div>
                    <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, marginBottom:4 }}>
                      <span style={{ color:C.string }}>reason: </span>{r.reason}
                      {r.notes && <span style={{ color:C.gray3 }}> — {r.notes}</span>}
                    </div>
                    <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>
                      reported by <span style={{ color:C.gray2 }}>@{r.users?.username||users.find(u=>u.id===r.reporter_id)?.username||"anon"}</span>
                      <span style={{ margin:"0 8px" }}>·</span>
                      {new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{ setDeleteModal({ riceId:r.rice_id, riceName:r.rice?.title||r.rice_id, authorId:r.rice?.author_id||null }); setDeleteReason(""); }} style={{ padding:"5px 14px", border:`1px solid #a0585866`, background:"transparent", color:"#c07070", cursor:"pointer", fontSize:10, fontFamily:C.mono }}>delete rice</button>
                  <button onClick={()=>dismissReport(r.id)} style={{ padding:"5px 14px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono }}>dismiss</button>
                </div>
              </div>
            )))}
            {reportTab==="history" && (() => {
              const ACTION_META = {
                rice_deleted: { label:"x rice deleted", color:"#c07070", bg:"#c0707010", border:"#c0707040" },
                dismissed:    { label:"/ dismissed",    color:C.gray2,   bg:C.bgCard,   border:C.border    },
                warning:      { label:"! warning sent", color:"#f59e0b", bg:"#f59e0b10", border:"#f59e0b40" },
                approved:     { label:"v approved",     color:"#34d399", bg:"#34d39910", border:"#34d39940" },
              };
              const actionCounts = history.reduce((acc,r)=>{ const a=r.action||"dismissed"; acc[a]=(acc[a]||0)+1; return acc; },{});
              const filtered = histFilter==="all" ? history : history.filter(r=>(r.action||"dismissed")===histFilter);
              return history.length===0 ? (
                <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no resolved reports yet</div>
              ) : (<>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:8, marginBottom:16 }}>
                  {Object.entries(ACTION_META).filter(([k])=>actionCounts[k]).map(([k,m])=>(
                    <div key={k} style={{ border:`1px solid ${m.border}`, background:m.bg, padding:"10px 14px" }}>
                      <div style={{ fontSize:20, fontWeight:700, color:m.color, fontFamily:C.mono }}>{actionCounts[k]||0}</div>
                      <div style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginTop:3 }}>{m.label}</div>
                    </div>
                  ))}
                  <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"10px 14px" }}>
                    <div style={{ fontSize:20, fontWeight:700, color:C.fn, fontFamily:C.mono }}>{history.length}</div>
                    <div style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginTop:3 }}>// total actions</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                  {[["all","// all","#fb923c"],...Object.entries(ACTION_META).filter(([k])=>actionCounts[k]).map(([k,m])=>[k,m.label,m.color])].map(([val,label,col])=>(
                    <button key={val} onClick={()=>setHistFilter(val)} style={{ padding:"3px 12px", border:`1px solid ${histFilter===val?col:C.border}`, background:histFilter===val?col+"22":"transparent", color:histFilter===val?col:C.gray3, fontSize:10, fontFamily:C.mono, cursor:"pointer" }}>
                      {label}{val!=="all"&&actionCounts[val]?<span style={{ marginLeft:5, opacity:.7 }}>{actionCounts[val]}</span>:null}
                    </button>
                  ))}
                </div>
                {filtered.length===0 ? (
                  <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no entries for this filter</div>
                ) : filtered.map(r=>{
                  const a = r.action||"dismissed";
                  const m = ACTION_META[a]||ACTION_META.dismissed;
                  return (
                    <div key={r.id} style={{ border:`1px solid ${m.border}`, background:m.bg, padding:"14px 16px", marginBottom:8, animation:"fadeIn .2s ease" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, color:m.color, fontFamily:C.mono, fontWeight:700, border:`1px solid ${m.border}`, padding:"2px 8px" }}>{m.label}</span>
                        {r.rice ? (
                          <span onClick={()=>r.rice.id&&onSelectRice&&onSelectRice({...r.rice})} style={{ fontSize:12, color:C.white, fontFamily:C.mono, cursor:"pointer", textDecoration:"underline", textDecorationColor:"#ffffff44", textUnderlineOffset:3 }}>{r.rice.title}</span>
                        ) : <span style={{ fontSize:12, color:C.gray3, fontFamily:C.mono }}>{r.rice_id||"_"}</span>}
                      </div>
                      <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, marginBottom:4 }}>
                        <span style={{ color:C.string }}>reason: </span>{r.reason||<span style={{ color:C.gray3, fontStyle:"italic" }}>none</span>}
                        {r.notes && <span style={{ color:C.gray3 }}> -- {r.notes}</span>}
                      </div>
                      <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:10, color:C.gray3, fontFamily:C.mono }}>
                        <span>reported by <span style={{ color:C.gray2 }}>@{users.find(u=>u.id===r.reporter_id)?.username||r.reporter_id?.slice(0,8)||"anon"}</span></span>
                        {r.resolved_at && <>
                          <span>|</span>
                          <span>resolved {new Date(r.resolved_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                          {r.resolved_by && <><span>|</span><span>by <span style={{ color:C.gray2 }}>@{users.find(u=>u.id===r.resolved_by)?.username||"admin"}</span></span></>}
                        </>}
                      </div>
                    </div>
                  );
                })}
              </>);
            })()}
          </div>
          </div>
        )}

        {/* ── USERS ── */}
        {!loading && tab==="users" && (
          <div>
            <div style={{ marginBottom:16, display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.border}`, padding:"7px 12px", background:C.bgDeep }}>
              <span style={{ color:C.gray3, fontSize:11 }}>{">"}</span>
              <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="search username or email..." style={{ background:"none", border:"none", outline:"none", color:C.white, fontSize:11, fontFamily:C.mono, width:"100%" }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {users.filter(u=>!userSearch||(u.username||"").includes(userSearch)||(u.email||"").includes(userSearch)).map(u=>(
                <div key={u.id} style={{ border:`1px solid ${u.badge==="banned"?"#a0585844":C.border}`, background:u.badge==="banned"?"#a0585806":C.bgCard, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:C.fn, fontFamily:C.mono, marginBottom:2, cursor:onSelectUser?"pointer":"default", textDecoration:onSelectUser?"underline":"none", textDecorationColor:"#ffffff33", textUnderlineOffset:3 }} onClick={()=>onSelectUser&&onSelectUser(u)}>@{u.username||"—"}</div>
                    <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>{u.email}</div>
                  </div>
                  {(() => {
                    const isFounder = adminBadge === "founder";
                    const targetIsProtected = u.badge === "founder" || u.badge === "staff";
                    const canEdit = isFounder || !targetIsProtected;
                    const badgeOptions = isFounder
                      ? ["member","trusted","senior","staff","founder","banned"]
                      : ["member","trusted","senior","banned"];
                    if (!canEdit) return (
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:12, color:C.gray3, fontFamily:C.mono }}>🔒</span>
                        <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, opacity:0.6 }}>protected</span>
                      </div>
                    );
                    return (
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        {/* Badge selector */}
                        <select value={u.badge||"member"} onChange={e=>updateUser(u.id,"badge",e.target.value)}
                          style={{ background:C.bgDeep, border:`1px solid ${C.border}`, color:C.gray1, padding:"3px 8px", fontSize:10, fontFamily:C.mono, cursor:"pointer", outline:"none" }}>
                          {badgeOptions.map(b=>(
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        {/* Trust level selector */}
                        <select value={u.trust_level||0} onChange={e=>updateUser(u.id,"trust_level",parseInt(e.target.value))}
                          style={{ background:C.bgDeep, border:`1px solid ${C.border}`, color:C.gray1, padding:"3px 8px", fontSize:10, fontFamily:C.mono, cursor:"pointer", outline:"none" }}>
                          {[-1,0,1,2,3].map(l=>(
                            <option key={l} value={l}>trust {l}</option>
                          ))}
                        </select>
                        {u.badge!=="banned" && (
                          <button onClick={()=>banUser(u.id)} style={{ padding:"3px 10px", border:`1px solid #a0585866`, background:"transparent", color:"#c07070", cursor:"pointer", fontSize:9, fontFamily:C.mono }}>ban</button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        {!loading && tab==="stats" && (
          <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:16 }}>
            {/* ── activity chart ── */}
            {stats.weeklyChart && (
              <div style={{ border:`1px solid ${C.border}`, background:C.bgCard, overflow:"hidden", gridColumn:"1/-1", marginBottom:4 }}>
                <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// UPLOAD ACTIVITY — last 8 weeks</div>
                <div style={{ padding:"16px 16px 10px", display:"flex", alignItems:"flex-end", gap:8, height:110 }}>
                  {stats.weeklyChart.map((w,i)=>{
                    const max=Math.max(...stats.weeklyChart.map(x=>x.total),1);
                    const pct=w.total/max;
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%" }}>
                        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", width:"100%" }}>
                          <div title={`${w.total} rice, ${w.approved} approved`}
                            style={{ height:`${Math.round(pct*72)}%`, minHeight:w.total>0?4:0, background:C.fn, opacity:0.75, width:"100%", transition:"height .4s ease", cursor:"default" }}/>
                        </div>
                        <div style={{ fontSize:8, color:C.gray3, fontFamily:C.mono }}>{w.label}</div>
                        <div style={{ fontSize:8, color:w.total>0?C.white:C.gray3, fontFamily:C.mono, fontWeight:600 }}>{w.total}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding:"4px 16px 8px", fontSize:8, color:C.gray3, fontFamily:C.mono }}>hover a bar for details · orange = total uploads</div>
              </div>
            )}
            <div style={{ border:`1px solid ${C.border}`, background:C.bgCard, overflow:"hidden" }}>
              <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// RICE</div>
              <Row label="total rice"    value={stats.totalRice}    />
              <Row label="approved"      value={stats.approved}     accent={C.fn}/>
              <Row label="pending"       value={stats.pendingCount} accent={stats.pendingCount>0?C.string:C.gray2}/>
              <Row label="total installs" value={fmt(stats.totalInstalls)} accent={C.kw}/>
            </div>
            <div style={{ border:`1px solid ${C.border}`, background:C.bgCard, overflow:"hidden" }}>
              <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// USERS</div>
              <Row label="total users"   value={stats.totalUsers}/>
              <Row label="open reports"  value={reports.length} accent={reports.length>0?"#c07070":C.gray2}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── HOMEPAGE ────────────────────────────────────────────────────── */
function HomePage({ onSelect, onUpload, tagClick, onTagClickConsumed }) {
  const [rices, setRices]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [netError, setNetError]     = useState(false);
  const [search, setSearch]         = useState("");
  const [wmFilter, setWmFilter]     = useState("all");
  useEffect(()=>{ if(tagClick){ setSearch(tagClick); if(onTagClickConsumed) onTagClickConsumed(); } },[tagClick]);
  const [view, setView]             = useState("grid");
  const [feedTab, setFeedTab]       = useState("explore");
  const [sortBy, setSortBy]         = useState("newest");
  const [forYouRices, setForYouRices] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [forYouLoaded, setForYouLoaded]   = useState(false);
  const { user } = useUser();

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('rice')
        .select('*, users(username)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) { setNetError(true); }
          else if (data) {
            const normalized = data.map(normalizeRice);
            setRices(normalized);
            // Calcola tag più frequenti
            const freq = {};
            normalized.forEach(r => (r.tags||[]).forEach(t => { freq[t] = (freq[t]||0)+1; }));
            const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([t])=>t);
            setPopularTags(top);
          }
          setLoading(false);
        });
    }).catch(() => { setNetError(true); setLoading(false); });
  }, []);

  const loadForYou = async () => {
    if (!user || forYouLoading) return;
    setForYouLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');

      // Recupera IDs visti da localStorage
      let viewedIds = [];
      try { viewedIds = JSON.parse(localStorage.getItem('rs_views') || '[]'); } catch(e) {}

      // 3-4 query in parallelo: storia completa dell'utente + tutti i rice approvati
      const baseQueries = [
        // like con dati completi del rice (non solo ID) — cattura preferenze anche se rice non in gallery
        supabase.from('rice_likes').select('rice_id, rice(id, wm, distro, tags, author_id)').eq('user_id', user.id),
        // follow
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        // tutti i rice approvati per lo scoring (non solo quelli caricati in gallery)
        supabase.from('rice').select('*, users(username)').eq('status', 'approved').order('created_at', { ascending: false }).limit(300),
      ];
      // rice visti: query al DB solo se abbiamo IDs, per estrarne wm/distro/tags
      if (viewedIds.length > 0) {
        baseQueries.push(
          supabase.from('rice').select('id, wm, distro, tags').in('id', viewedIds.slice(0, 20))
        );
      }

      const [likesRes, followsRes, allRiceRes, viewedRiceRes] = await Promise.all(baseQueries);

      // Estrai dati rice piaciuti (con dati completi grazie al join)
      const likedRiceData = (likesRes.data || []).map(l => l.rice).filter(Boolean);
      const followedIds   = new Set((followsRes.data || []).map(f => f.following_id));
      const allRice       = (allRiceRes.data || []).map(normalizeRice);
      const viewedRiceData = viewedIds.length > 0 ? (viewedRiceRes?.data || []) : [];

      const likedIds = new Set(likedRiceData.map(r => r.id));

      // Profilo preferenze costruito sull'intera storia (liked + viewed)
      const prefWms     = new Set([...likedRiceData, ...viewedRiceData].map(r => r.wm).filter(Boolean));
      const prefDistros = new Set([...likedRiceData, ...viewedRiceData].map(r => r.distro).filter(Boolean));

      // Peso per tag: quanti rice piaciuti condividono quel tag (più peso = più rilevante)
      const tagWeight = {};
      likedRiceData.forEach(r => (r.tags || []).forEach(t => { tagWeight[t] = (tagWeight[t] || 0) + 1; }));
      // Aggiungi anche i tag dai viewed (peso minore)
      viewedRiceData.forEach(r => (r.tags || []).forEach(t => { tagWeight[t] = (tagWeight[t] || 0) + 0.3; }));

      const recentViewed = new Set(viewedIds.slice(0, 5));

      // Scoring su TUTTI i rice approvati (non solo quelli in gallery)
      const scored = allRice
        .filter(r => !likedIds.has(r.id) && !recentViewed.has(r.id))
        .map(r => {
          let score = 0;
          if (followedIds.has(r.author_id)) score += 10;   // segui l'autore
          if (prefWms.has(r.wm))            score += 4;    // stesso WM
          if (prefDistros.has(r.distro))    score += 3;    // stessa distro
          (r.tags || []).forEach(t => { score += (tagWeight[t] || 0); }); // tag in comune
          return { ...r, _score: score };
        });

      const hasSignals = likedIds.size > 0 || followedIds.size > 0 || viewedIds.length > 0;
      let result = hasSignals
        ? scored.filter(r => r._score > 0).sort((a, b) => b._score - a._score)
        : [];
      // Se pochi risultati personalizzati, riempie con rice recenti non ancora visti
      if (result.length < 10) {
        const filler = scored.filter(r => r._score === 0);
        result = [...result, ...filler].slice(0, 40);
      }
      setForYouRices(result.slice(0, 40));
    } catch(e) { console.error('for you error:', e); }
    setForYouLoaded(true);
    setForYouLoading(false);
  };

  useEffect(() => {
    if (feedTab === 'for-you' && !loading) loadForYou();
  }, [feedTab, loading]);

  const wms = ["all","hyprland","sway","i3wm","bspwm","openbox","dwm","kde","gnome","xfce","awesome","qtile","mate","cinnamon","budgie","xmonad"];
  const mobile = useMobile();
  const filtered = (() => {
    const base = rices.filter(r => {
      const mf = wmFilter==="all" || r.wm===wmFilter;
      const q  = search.toLowerCase();
      const ms = !search
        || (r.title||"").toLowerCase().includes(q)
        || (r.author||"").toLowerCase().includes(q)
        || (r.description||"").toLowerCase().includes(q)
        || (r.tags||[]).some(t=>(t||"").toLowerCase().includes(q));
      return mf && ms;
    });
    if (sortBy === "popular")  return [...base].sort((a,b) => (b.likes||0) - (a.likes||0));
    if (sortBy === "trending") return [...base].sort((a,b) => (b.installs||0) - (a.installs||0));
    return base; // newest — already ordered by created_at desc from DB
  })();

  return (
    <div>
      <div style={{ borderBottom:`1px solid ${C.border}` }}>
        <div style={{ padding:"9px 32px", borderBottom:`1px solid ${C.border}`, background:C.bgDeep, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, fontFamily:C.mono, color:C.comment, fontStyle:"italic" }}>
            <span style={{ color:"#333" }}>// </span>linux rice gallery &amp; one-click installer
          </span>
          <span style={{ fontSize:10, fontFamily:C.mono, color:"#333" }}>v1.0.0</span>
        </div>
        {mobile ? (
          // Mobile hero — compact
          <div style={{ padding:"20px 14px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:C.display, fontSize:"clamp(28px,9vw,42px)", fontWeight:900, color:C.white, letterSpacing:"-0.04em", lineHeight:0.9, textTransform:"uppercase", marginBottom:10 }}>RICE<br/>SHARE</div>
            <div style={{ width:32, height:2, background:C.fn, marginBottom:12 }}/>
            <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.8, marginBottom:16 }}>
              find, share &amp; install linux rice<br/>
              <span style={{ color:C.gray3 }}>one command, one click.</span>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
              <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none", flex:1, display:"flex" }}>
                <button className="bs" style={{ width:"100%", padding:"10px 0", border:"none", background:C.fn, color:C.bg, cursor:"pointer", fontSize:11, fontFamily:C.mono, fontWeight:700, boxShadow:`0 0 14px ${C.fn}55` }}>discord →</button>
              </a>
              <button className="bg" onClick={onUpload} style={{ flex:1, padding:"10px 0", border:`2px solid ${C.borderHi}`, background:"rgba(255,255,255,0.04)", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, fontWeight:600 }}>upload</button>
            </div>
          </div>
        ) : (
          // Desktop hero
          <div style={{ padding:"36px 32px 32px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:24 }}>
            {/* Left: title + tagline + buttons */}
            <div style={{ maxWidth:480 }}>
              <div style={{ fontFamily:C.display, fontSize:"clamp(36px,5vw,64px)", fontWeight:900, color:C.white, letterSpacing:"-0.04em", lineHeight:0.9, textTransform:"uppercase", marginBottom:14 }}>RICESHARE</div>
              <div style={{ width:40, height:2, background:C.fn, marginBottom:18 }}/>
              <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:24, maxWidth:360 }}>
                find, share &amp; install linux rice — one command, one click.<br/>
                <span style={{ color:C.gray3 }}>your desktop. your rules.</span>
              </p>
              <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
                <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none", display:"inline-flex", alignItems:"stretch" }}>
                  <button className="bs"
                    style={{ padding:"11px 28px", border:"none", background:C.fn, color:C.bg, cursor:"pointer", fontSize:11, fontFamily:C.mono, fontWeight:700, letterSpacing:"0.04em", transition:"all .2s", boxShadow:`0 0 18px ${C.fn}66` }}
                    onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 0 28px ${C.fn}aa`; e.currentTarget.style.transform="translateY(-1px)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 0 18px ${C.fn}66`; e.currentTarget.style.transform="none"; }}
                  >join discord →</button>
                </a>
                <button className="bg" onClick={onUpload}
                  style={{ padding:"11px 28px", border:`2px solid ${C.borderHi}`, background:"rgba(255,255,255,0.04)", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, fontWeight:600, letterSpacing:"0.04em", transition:"all .2s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.09)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.transform="none"; }}
                >upload rice</button>
              </div>
            </div>
            {/* Right: stats card */}
            <div style={{ fontFamily:C.mono, border:`1px solid ${C.border}`, background:C.bgDeep, minWidth:220 }}>
              {/* header */}
              <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:C.fn, display:"inline-block", flexShrink:0 }}/>
                <span style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", textTransform:"uppercase" }}>// live stats</span>
              </div>
              {/* 2-col grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                {[
                  {v:loading?"—":String(rices.length),                                                            l:"rice shared"},
                  {v:loading?"—":String(new Set(rices.map(r=>r.author).filter(Boolean)).size),                    l:"authors"},
                  {v:loading?"—":fmt(rices.reduce((a,r)=>a+(r.installs||0),0)),                                   l:"installs"},
                  {v:loading?"—":fmt(rices.reduce((a,r)=>a+(r.likes||0),0)),                                      l:"total likes"},
                ].map((s,i)=>(
                  <div key={s.l} style={{
                    padding:"14px 16px",
                    borderBottom:i<2?`1px solid ${C.border}`:"none",
                    borderRight:i%2===0?`1px solid ${C.border}`:"none",
                  }}>
                    <div style={{ fontSize:22, fontWeight:800, color:C.fn, lineHeight:1, letterSpacing:"-0.03em" }}>{s.v}</div>
                    <div style={{ fontSize:8, color:C.gray3, marginTop:5, letterSpacing:"0.1em", textTransform:"uppercase" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── POPULAR TAGS ── */}
      {popularTags.length > 0 && (
        <div style={{ padding:mobile?"10px 14px":"10px 32px", borderBottom:`1px solid ${C.border}`, background:C.bgDeep, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", overflowX:"auto" }}>
          <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", flexShrink:0 }}>// trending</span>
          {popularTags.map(t=>(
            <button key={t} onClick={()=>{ setSearch(t); setFeedTab("explore"); }}
              style={{ padding:"2px 10px", border:`1px solid ${C.kw}44`, background:"transparent", color:C.kw, cursor:"pointer", fontSize:9, fontFamily:C.mono, transition:"all .15s", flexShrink:0 }}
              onMouseEnter={e=>{ e.currentTarget.style.background=C.kw+"22"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}
            >#{t}</button>
          ))}
        </div>
      )}

      {/* ── FEED TABS ── */}
      <div style={{ padding:mobile?"0 14px":"0 32px", borderBottom:`1px solid ${C.border}`, background:C.bgDeep, display:"flex", alignItems:"center" }}>
        {[["explore","// explore"],["for-you","// for you"]].map(([t,label])=>(
          <button key={t} className="tb" onClick={()=>setFeedTab(t)} style={{ padding:mobile?"10px 16px":"11px 22px", background:"none", borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:feedTab===t?`2px solid ${C.fn}`:"2px solid transparent", color:feedTab===t?C.fn:C.gray3, cursor:"pointer", fontSize:mobile?11:12, fontFamily:C.mono, fontWeight:feedTab===t?700:400, marginBottom:-1, transition:"color .15s, border-color .15s" }}>{label}</button>
        ))}
        {!user && feedTab==="for-you" && <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginLeft:"auto" }}>sign in to personalise</span>}
      </div>

      {/* ── SEARCH + VIEW TOGGLE ── */}
      {mobile ? (
        // Mobile: search + select dropdown
        feedTab === "explore" ? <div style={{ borderBottom:`1px solid ${C.border}`, background:C.bgDeep, padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          {/* Row 1: search + view toggle */}
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.border}`, padding:"8px 12px" }}>
              <span style={{ color:C.gray3, fontSize:11 }}>{">"}</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='search...' style={{ background:"none", border:"none", outline:"none", color:C.white, fontSize:12, fontFamily:C.mono, width:"100%" }}/>
              {search && <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>}
            </div>
            <div style={{ display:"flex", border:`1px solid ${C.border}`, overflow:"hidden", flexShrink:0 }}>
              {[["grid","▦"],["list","≡"]].map(([v,ic])=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:"8px 13px", border:"none", background:view===v?C.white:"transparent", color:view===v?"#111":C.gray3, cursor:"pointer", fontSize:13, transition:"all .15s" }}>{ic}</button>
              ))}
            </div>
          </div>
          {/* Row 2: WM dropdown + results count */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative", flex:1 }}>
              <select
                value={wmFilter}
                onChange={e=>setWmFilter(e.target.value)}
                style={{
                  width:"100%", appearance:"none", WebkitAppearance:"none",
                  background:C.bgDeep, border:`1px solid ${C.border}`,
                  color:wmFilter==="all"?C.gray2:C.white,
                  padding:"7px 32px 7px 12px",
                  fontSize:11, fontFamily:C.mono, cursor:"pointer", outline:"none",
                }}
              >
                {wms.map(f=>(
                  <option key={f} value={f} style={{ background:C.bgDeep, color:C.white }}>
                    {f==="all"?"*.all — show all":f}
                  </option>
                ))}
              </select>
              {/* Custom chevron */}
              <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:C.gray3, fontSize:10, pointerEvents:"none" }}>▾</span>
            </div>
            <select
              value={sortBy}
              onChange={e=>setSortBy(e.target.value)}
              style={{ appearance:"none", WebkitAppearance:"none", background:C.bgDeep, border:`1px solid ${C.border}`, color:C.gray2, padding:"7px 24px 7px 10px", fontSize:11, fontFamily:C.mono, cursor:"pointer", outline:"none", position:"relative" }}
            >
              <option value="newest" style={{ background:C.bgDeep }}>newest</option>
              <option value="popular" style={{ background:C.bgDeep }}>popular</option>
              <option value="trending" style={{ background:C.bgDeep }}>trending</option>
            </select>
            <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, flexShrink:0, whiteSpace:"nowrap" }}>{filtered.length} results</span>
          </div>
        </div> : <div style={{ borderBottom:`1px solid ${C.border}` }}/>
      ) : (
        // Desktop: unified filter bar
        feedTab === "explore" ? <>
          {/* Row 1: search + sort + view toggle */}
          <div style={{ padding:"8px 32px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center", background:C.bgDeep }}>
            {/* label */}
            <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, letterSpacing:"0.08em", flexShrink:0, userSelect:"none" }}>// filter</span>
            {/* search input */}
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.border}`, padding:"7px 12px" }}>
              <span style={{ color:C.gray3, fontSize:11 }}>{">"}</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='search("rice or author")' style={{ background:"none", border:"none", outline:"none", color:C.white, fontSize:11, fontFamily:C.mono, width:"100%" }}/>
              {search && <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>}
            </div>
            {/* sort buttons */}
            <div style={{ display:"flex", overflow:"hidden", border:`1px solid ${C.border}` }}>
              {[["newest","↓ newest"],["popular","♥ popular"],["trending","↑ trending"]].map(([v,l],i,a)=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{ padding:"7px 12px", border:"none", borderRight:i<a.length-1?`1px solid ${C.border}`:"none", background:sortBy===v?C.fn:"transparent", color:sortBy===v?"#111":C.gray3, cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"all .15s", fontWeight:sortBy===v?600:400 }}>{l}</button>
              ))}
            </div>
            {/* view toggle */}
            <div style={{ display:"flex", border:`1px solid ${C.border}`, overflow:"hidden" }}>
              {[["grid","▦"],["list","≡"]].map(([v,ic])=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:"7px 13px", border:"none", background:view===v?C.white:"transparent", color:view===v?"#111":C.gray3, cursor:"pointer", fontSize:12, transition:"all .15s" }}>{ic}</button>
              ))}
            </div>
            {/* results count */}
            <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, flexShrink:0, whiteSpace:"nowrap" }}>{filtered.length} results</span>
          </div>
          {/* Row 2: WM filter tabs with orange accent */}
          <div style={{ padding:"0 32px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", background:C.bg, overflowX:"auto", gap:0 }}>
            {wms.map(f=>(
              <button key={f} className="tb" onClick={()=>setWmFilter(f)} style={{
                padding:"8px 14px", background:"none",
                borderTop:"none", borderLeft:"none", borderRight:"none",
                borderBottom:wmFilter===f?`2px solid ${C.fn}`:"2px solid transparent",
                color:wmFilter===f?C.fn:C.gray2,
                cursor:"pointer", fontSize:11, fontFamily:C.mono,
                marginBottom:-1, transition:"color .15s, border-color .15s",
                fontWeight:wmFilter===f?700:400, whiteSpace:"nowrap", flexShrink:0
              }}>
                {f==="all"?"all":f}
              </button>
            ))}
          </div>
        </> : <div style={{ borderBottom:`1px solid ${C.border}` }}/>
      )}

      <div style={{ padding:mobile?"12px 14px 32px":"24px 32px 48px" }}>
        {feedTab === "for-you" ? (
          /* ── FOR YOU FEED ── */
          !user ? (
            <div style={{ paddingTop:80, fontFamily:C.mono, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ fontSize:12, color:C.gray3, fontStyle:"italic" }}>// not signed in</div>
              <div style={{ fontSize:11, color:C.gray2, lineHeight:1.8 }}>Sign in to get a personalised feed based on<br/>who you follow and what you like.</div>
            </div>
          ) : forYouLoading || loading ? (
            <div style={{ paddingTop:60, fontFamily:C.mono, fontSize:12, color:C.gray3, fontStyle:"italic" }}>// loading feed...</div>
          ) : forYouRices.length === 0 ? (
            <div style={{ paddingTop:60, display:"flex", flexDirection:"column", gap:12, fontFamily:C.mono }}>
              <div style={{ fontSize:12, color:C.gray3, fontStyle:"italic" }}>// nothing here yet</div>
              <div style={{ fontSize:11, color:C.gray2, lineHeight:1.8 }}>
                Like some rice, follow authors, or browse the gallery —<br/>your feed will fill up automatically.
              </div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(340px,1fr))", gap:mobile?12:20 }}>
              {forYouRices.map((r,i)=><RiceCard key={r.id} rice={r} onClick={onSelect} delay={i*.04}/>)}
            </div>
          )
        ) : (
          /* ── EXPLORE FEED ── */
          loading ? (
            <div style={{ paddingTop:60, fontFamily:C.mono, fontSize:12, color:C.gray3, fontStyle:"italic" }}>
              // loading...
            </div>
          ) : netError ? (
            <div style={{ paddingTop:60, display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontFamily:C.mono, fontSize:11, color:C.gray3, fontStyle:"italic" }}>// cms not connected</div>
              <div style={{ fontFamily:C.mono, fontSize:12, color:"#a05858" }}>unable to reach the database — check your connection or Supabase configuration.</div>
              <button onClick={()=>{ setNetError(false); setLoading(true); import('../lib/supabase').then(({supabase})=>{ supabase.from('rice').select('*, users(username)').eq('status','approved').order('created_at',{ascending:false}).then(({data,error})=>{ if(error) setNetError(true); else if(data) setRices(data.map(normalizeRice)); setLoading(false); }); }).catch(()=>{setNetError(true);setLoading(false);}); }}
                className="bg" style={{ alignSelf:"flex-start", padding:"7px 18px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>
                retry
              </button>
            </div>
          ) : (
            <>
              {view==="grid" ? (
                <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(340px,1fr))", gap:mobile?12:20 }}>
                  {filtered.map((r,i)=><RiceCard key={r.id} rice={r} onClick={onSelect} delay={i*.04}/>)}
                </div>
              ) : (
                <TableView rices={filtered} onClick={onSelect}/>
              )}
              {!loading && rices.length > 0 && filtered.length === 0 && (
                <div style={{ paddingTop:60, fontFamily:C.mono, fontSize:12, color:C.gray3, fontStyle:"italic" }}>
                  // no results for "{search||wmFilter}"
                </div>
              )}
              {!loading && rices.length === 0 && (
                <div style={{ paddingTop:60, fontFamily:C.mono, fontSize:12, color:C.gray3, fontStyle:"italic" }}>
                  // no rice yet — <span style={{color:C.fn,cursor:"pointer"}} onClick={onUpload}>upload the first one</span>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

/* ── NAVBAR ──────────────────────────────────────────────────────── */
function useContainerWidth(ref, breakpoint=700) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const check = () => { if (ref.current) setIsMobile(ref.current.offsetWidth < breakpoint); };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, breakpoint]);
  return isMobile;
}

function useMobile(breakpoint=640) {
  const [mobile, setMobile] = useState(false); // always false on SSR
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check(); // set correct value after mount
    window.addEventListener("resize", check, { passive:true });
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return mobile;
}

/* ── NavSearchBar with autocomplete ────────────────────────────── */
function NavSearchBar({ searchVal, setSearchVal, searchOpen, setSearchOpen, searchExpanded, onSearch }) {
  const [suggestions, setSuggestions]   = useState([]);
  const [sugIdx, setSugIdx]             = useState(-1);
  const [showSug, setShowSug]           = useState(false);
  const debounceRef                     = useRef(null);

  // Fetch suggestions with debounce
  useEffect(()=>{
    if (!searchVal.trim()) { setSuggestions([]); setShowSug(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async ()=>{
      try {
        const { supabase } = await import('../lib/supabase');
        const q = searchVal.trim().toLowerCase();
        const [{ data: riceData }, { data: userData }] = await Promise.all([
          supabase.from('rice').select('id, title, wm, tags').ilike('title', `%${q}%`).limit(5),
          supabase.from('users').select('id, username').ilike('username', `%${q}%`).limit(3),
        ]);
        const riceSugs = (riceData||[]).map(r=>({ type:'rice', label: r.title, sub: r.wm||'', id: r.id }));
        const userSugs = (userData||[]).map(u=>({ type:'user', label: u.username, sub:'user', id: u.id }));
        // Tag suggestions from rice tags
        const tagSet = new Set();
        (riceData||[]).forEach(r=>{ if(Array.isArray(r.tags)) r.tags.filter(t=>t.toLowerCase().includes(q)).forEach(t=>tagSet.add(t)); });
        const tagSugs = [...tagSet].slice(0,3).map(t=>({ type:'tag', label: t, sub:'tag', id: t }));
        setSuggestions([...riceSugs, ...userSugs, ...tagSugs]);
        setShowSug(true);
        setSugIdx(-1);
      } catch(e) { console.error('autocomplete error:', e); }
    }, 200);
    return ()=>clearTimeout(debounceRef.current);
  }, [searchVal]);

  const commit = (val) => {
    const q = val || searchVal.trim();
    if (!q) return;
    onSearch(q);
    setSearchOpen(false);
    setSearchVal("");
    setShowSug(false);
    setSugIdx(-1);
    document.getElementById("nb-search")?.blur();
  };

  const TypeIcon = ({ type }) => {
    if (type === 'rice') return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:.85}}>
        <ellipse cx="12" cy="12" rx="4" ry="7" fill="#c8a96e" transform="rotate(-30 12 12)"/>
        <ellipse cx="12" cy="12" rx="2.5" ry="5" fill="#e8c98e" transform="rotate(-30 12 12)"/>
        <path d="M12 5 Q14 2 17 3" stroke="#7a9a7a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    );
    if (type === 'user') return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:.85}}>
        <circle cx="12" cy="8" r="4" fill="#7a9a7a"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#7a9a7a" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    );
    if (type === 'tag') return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:.85}}>
        <path d="M3 7h18M3 12h12M3 17h8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
    return <span style={{fontSize:10,opacity:.6}}>·</span>;
  };

  return (
    <div style={{ display:"flex", alignItems:"center", marginRight:10, position:"relative" }}
      onClick={()=>{ if(!searchExpanded){ setSearchOpen(true); setTimeout(()=>document.getElementById("nb-search")?.focus(),50); } }}
    >
      {/* Input bar */}
      <div style={{
        display:"flex", alignItems:"center",
        height:32,
        width: searchExpanded ? 260 : 110,
        transition:"width 0.3s cubic-bezier(.4,0,.2,1), border-color 0.2s, box-shadow 0.2s, background 0.2s",
        background: searchExpanded ? "#1a1a1a" : C.bgDeep,
        border:`1px solid ${searchExpanded ? C.fn+"aa" : C.border}`,
        borderRadius: showSug && suggestions.length > 0 ? "6px 6px 0 0" : 6,
        boxShadow: searchExpanded ? `0 0 0 2px ${C.fn}22, 0 2px 12px #0008` : "none",
        overflow:"hidden",
        cursor: searchExpanded ? "text" : "pointer",
        position:"relative", zIndex:1001,
      }}>
        <span style={{
          fontSize:15, lineHeight:1,
          color: searchExpanded ? C.fn : C.gray3,
          paddingLeft:9, paddingRight:5,
          flexShrink:0, userSelect:"none",
          transition:"color .2s"
        }}>⌕</span>
        <input
          id="nb-search"
          value={searchVal}
          onChange={e=>setSearchVal(e.target.value)}
          onFocus={()=>{ setSearchOpen(true); if(searchVal) setShowSug(true); }}
          onBlur={()=>{ setTimeout(()=>{ setShowSug(false); if(!searchVal) setSearchOpen(false); }, 160); }}
          onKeyDown={e=>{
            if(e.key==="ArrowDown"){ e.preventDefault(); setSugIdx(i=>Math.min(i+1, suggestions.length-1)); }
            if(e.key==="ArrowUp"){ e.preventDefault(); setSugIdx(i=>Math.max(i-1,-1)); }
            if(e.key==="Enter"){
              e.preventDefault();
              if(sugIdx>=0 && suggestions[sugIdx]) commit(suggestions[sugIdx].label);
              else commit();
            }
            if(e.key==="Escape"){ setSearchOpen(false); setSearchVal(""); setShowSug(false); setSugIdx(-1); e.target.blur(); }
          }}
          placeholder={searchExpanded ? "rice, utenti, tag..." : ""}
          style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            color:C.white, fontFamily:C.mono, fontSize:11,
            padding:"0 6px 0 0", height:"100%",
            opacity: searchExpanded ? 1 : 0,
            transition:"opacity 0.25s",
            pointerEvents: searchExpanded ? "all" : "none",
          }}
        />
        {searchExpanded && searchVal && (
          <button
            onMouseDown={e=>e.preventDefault()}
            onClick={e=>{ e.stopPropagation(); setSearchVal(""); setSuggestions([]); setShowSug(false); document.getElementById("nb-search")?.focus(); }}
            style={{ background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:13, padding:"0 8px", lineHeight:1, flexShrink:0, transition:"color .15s" }}
            onMouseEnter={e=>e.target.style.color=C.white}
            onMouseLeave={e=>e.target.style.color=C.gray3}
          >✕</button>
        )}
        {!searchExpanded && (
          <span style={{
            fontSize:10, color:C.gray3, fontFamily:C.mono,
            whiteSpace:"nowrap", paddingRight:10,
            cursor:"pointer", userSelect:"none", letterSpacing:"0.04em"
          }}>search...</span>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showSug && suggestions.length > 0 && (
        <div style={{
          position:"absolute", top:32, left:0, width:260,
          background:"#1a1a1a",
          border:`1px solid ${C.fn}66`,
          borderTop:"none",
          borderRadius:"0 0 6px 6px",
          boxShadow:`0 8px 24px #0009`,
          zIndex:1000,
          overflow:"hidden",
        }}>
          {suggestions.map((s,i)=>(
            <div key={i}
              onMouseDown={e=>e.preventDefault()}
              onClick={()=>commit(s.label)}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"7px 12px",
                cursor:"pointer",
                background: i===sugIdx ? C.fn+"18" : "transparent",
                borderBottom: i<suggestions.length-1 ? `1px solid ${C.border}` : "none",
                transition:"background .1s",
              }}
              onMouseEnter={e=>{ setSugIdx(i); e.currentTarget.style.background=C.fn+"18"; }}
              onMouseLeave={e=>{ if(sugIdx!==i) e.currentTarget.style.background="transparent"; }}
            >
              <TypeIcon type={s.type} />
              <span style={{ fontSize:11, color:C.white, fontFamily:C.mono, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
              <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, flexShrink:0 }}>{s.sub}</span>
            </div>
          ))}
          <div style={{ padding:"5px 12px", fontSize:9, color:C.gray3, fontFamily:C.mono, borderTop:`1px solid ${C.border}`, textAlign:"center" }}>
            ↵ invio per cercare tutto
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar({ page, setPage, isAdmin, navUnread, onSearch }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const navRef = useRef(null);
  const isMobile = useContainerWidth(navRef, 680);
  const NAV_LINKS = [["home","home"],["upload","upload"],["leaderboard","ranks"],["docs","docs"],["about","about"]];

  const navBtn = (active) => ({
    padding:"0 16px", height:"100%", background:"none",
    borderTop:"none", borderLeft:"none", borderRight:"none",
    borderBottom: active ? `2px solid ${C.fn}` : "2px solid transparent",
    color: active ? C.white : C.gray3,
    cursor:"pointer", fontSize:12, fontFamily:C.mono,
    fontWeight: active ? 700 : 400,
    letterSpacing:"0.02em", transition:"color .15s, border-color .15s"
  });

  return (
    <>
      <nav ref={navRef} style={{ borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:200, background:"rgba(11,11,11,0.98)", backdropFilter:"blur(14px)" }}>
        <div style={{ display:"flex", alignItems:"center", height:52 }}>

          {/* ── Gutter dot */}
          {!isMobile && (
            <div style={{ width:GUTTER, flexShrink:0, height:"100%", background:C.gutter, borderRight:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:C.fn }}/>
            </div>
          )}

          {/* ── Logo */}
          <div style={{ paddingLeft: isMobile?14:20, paddingRight:20, borderRight:`1px solid ${C.border}`, height:"100%", display:"flex", alignItems:"center", flexShrink:0 }}>
            <button onClick={()=>{setPage("home");setMenuOpen(false);}} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:9, padding:0 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:C.fn, flexShrink:0 }}/>
              <span style={{ fontFamily:C.display, fontSize:15, fontWeight:800, color:C.white, letterSpacing:"-0.03em", textTransform:"uppercase" }}>Riceshare</span>
            </button>
          </div>

          {/* ── Nav links (desktop) */}
          {!isMobile && (
            <div style={{ display:"flex", alignItems:"center", height:"100%", paddingLeft:4 }}>
              {NAV_LINKS.map(([p,label])=>(
                <button key={p} onClick={()=>setPage(p)}
                  style={navBtn(page===p)}
                  onMouseEnter={e=>{ if(page!==p) e.currentTarget.style.color=C.gray2; }}
                  onMouseLeave={e=>{ if(page!==p) e.currentTarget.style.color=C.gray3; }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div style={{ flex:1 }}/>

          {/* ── Animated search bar with autocomplete (desktop) */}
          {!isMobile && (()=>{
            const searchExpanded = searchOpen || searchVal.length > 0;
            return (
              <NavSearchBar
                searchVal={searchVal} setSearchVal={setSearchVal}
                searchOpen={searchOpen} setSearchOpen={setSearchOpen}
                searchExpanded={searchExpanded}
                onSearch={onSearch}
              />
            );
          })()}

          {/* ── Right section (desktop) */}
          {!isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:16, paddingLeft:12, borderLeft:`1px solid ${C.border}`, height:"100%" }}>
              {user ? (<>
                {isAdmin && (
                  <button onClick={()=>setPage("admin")}
                    style={{ background:"none", border:`1px solid ${C.string}44`, color:C.string, cursor:"pointer", fontSize:9, fontFamily:C.mono, padding:"3px 9px", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:4, transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.string+"18"}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    <span>⚙</span> admin
                  </button>
                )}
                <button onClick={()=>setPage("profiles")}
                  style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:11, color:C.fn, padding:0, display:"inline-flex", alignItems:"center", gap:5, fontWeight:600, letterSpacing:"0.01em" }}>
                  <span style={{ fontSize:9, color:C.gray3, fontWeight:400 }}>@</span>
                  {user?.username || user?.firstName || "user"}
                  {navUnread > 0 && (
                    <span style={{ minWidth:17, height:17, borderRadius:9, background:"#f47244", color:"#000", fontSize:9, fontFamily:C.mono, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 4px", letterSpacing:0 }}>
                      {navUnread > 9 ? "9+" : navUnread}
                    </span>
                  )}
                </button>
                <button onClick={()=>signOut(()=>setPage("home"))}
                  style={{ background:"none", border:`1px solid ${C.border}`, color:C.gray3, cursor:"pointer", fontSize:10, fontFamily:C.mono, padding:"4px 11px", transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHi;e.currentTarget.style.color=C.white;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.gray3;}}>
                  ← exit
                </button>
              </>) : (
                <button onClick={()=>window.location.href='/sign-in'}
                  style={{ padding:"5px 16px", border:`1px solid ${C.fn}55`, background:`${C.fn}0f`, color:C.fn, cursor:"pointer", fontSize:10, fontFamily:C.mono, letterSpacing:"0.05em", transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.fn+"22";e.currentTarget.style.borderColor=C.fn+"99";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.fn+"0f";e.currentTarget.style.borderColor=C.fn+"55";}}>
                  login →
                </button>
              )}
            </div>
          )}

          {/* ── Mobile right */}
          {isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:12 }}>
              {user && navUnread > 0 && (
                <span style={{ minWidth:17, height:17, borderRadius:9, background:"#f47244", color:"#000", fontSize:9, fontFamily:C.mono, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
                  {navUnread > 9 ? "9+" : navUnread}
                </span>
              )}
              <button onClick={()=>setMenuOpen(o=>!o)}
                style={{ background:"none", border:`1px solid ${C.border}`, color:C.gray2, cursor:"pointer", padding:"5px 11px", fontFamily:C.mono, fontSize:14, lineHeight:1 }}>
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer */}
      {isMobile && menuOpen && (
        <div style={{ position:"fixed", top:52, left:0, right:0, zIndex:199, background:"rgba(9,9,9,0.99)", borderBottom:`1px solid ${C.border}`, display:"flex", flexDirection:"column", backdropFilter:"blur(14px)" }}>

          {/* Nav links */}
          <div style={{ padding:"6px 0" }}>
            {NAV_LINKS.map(([p,label])=>(
              <button key={p} onClick={()=>{setPage(p);setMenuOpen(false);}}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"13px 20px", background:"none", border:"none", borderLeft:page===p?`2px solid ${C.fn}`:"2px solid transparent", color:page===p?C.white:C.gray2, cursor:"pointer", fontSize:13, fontFamily:C.mono, textAlign:"left" }}>
                {page===p && <span style={{ width:4, height:4, borderRadius:"50%", background:C.fn, flexShrink:0 }}/>}
                {label}
              </button>
            ))}
          </div>

          <div style={{ height:1, background:C.border }}/>

          {/* Search */}
          <button onClick={()=>{setPage("search");setMenuOpen(false);}}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 20px", background:"none", border:"none", color:C.gray3, cursor:"pointer", fontFamily:C.mono, fontSize:12, textAlign:"left" }}>
            <span style={{ fontSize:15 }}>⌕</span> search rice & users
          </button>

          <div style={{ height:1, background:C.border }}/>

          {/* User section */}
          <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:10 }}>
            {user ? (<>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <button onClick={()=>{setPage("profiles");setMenuOpen(false);}}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:C.mono, color:C.fn, fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, padding:0 }}>
                  @{user?.username || user?.firstName || "user"}
                </button>
                {isAdmin && (
                  <button onClick={()=>{setPage("admin");setMenuOpen(false);}}
                    style={{ background:"none", border:`1px solid ${C.string}44`, color:C.string, cursor:"pointer", fontSize:10, fontFamily:C.mono, padding:"3px 9px", display:"flex", alignItems:"center", gap:3 }}>
                    <span>⚙</span> admin
                  </button>
                )}
              </div>
              <button onClick={()=>signOut(()=>setPage("home"))}
                style={{ alignSelf:"flex-start", padding:"8px 16px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", fontSize:12, fontFamily:C.mono }}>
                ← exit
              </button>
            </>) : (
              <button onClick={()=>{window.location.href='/sign-in';setMenuOpen(false);}}
                style={{ padding:"12px", border:`1px solid ${C.fn}55`, background:`${C.fn}0f`, color:C.fn, cursor:"pointer", fontSize:13, fontFamily:C.mono }}>
                login →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── DOCS PAGE ───────────────────────────────────────────────────── */
function DocsPage() {
  const mobile = useMobile();
  const NAV = [
    { id:"getting-started", label:"getting started", n:"01" },
    { id:"upload-guide",    label:"upload rice",     n:"02" },
    { id:"install-system",  label:"install system",  n:"03" },
    { id:"api",             label:"api reference",   n:"04" },
    { id:"community",       label:"community",       n:"05" },
  ];
  const [active, setActive] = useState("getting-started");
  const sectionRefs = { "getting-started":useRef(null),"upload-guide":useRef(null),"install-system":useRef(null),"api":useRef(null),"community":useRef(null) };
  const scrollTo = id => {
    const el = sectionRefs[id]?.current;
    const sc = document.querySelector(".content-area");
    if (!el || !sc) return;
    const top = el.getBoundingClientRect().top + sc.scrollTop - 44 - 16;
    sc.scrollTo({ top, behavior: "smooth" });
  };

  useEffect(() => {
    const ids = NAV.map(n=>n.id);
    const onScroll = () => {
      const sc = document.querySelector(".content-area"); if(!sc) return;
      let cur=ids[0];
      for(const id of ids){ const el=sectionRefs[id]?.current; if(el&&el.offsetTop<=sc.scrollTop+80) cur=id; }
      setActive(cur);
    };
    const t=setTimeout(()=>{
      const sc = document.querySelector(".content-area");
      if(sc){sc.addEventListener("scroll",onScroll,{passive:true});onScroll();}
    },100);
    return ()=>{ clearTimeout(t); const sc=document.querySelector(".content-area"); if(sc) sc.removeEventListener("scroll",onScroll); };
  }, []);

  const Block=({children})=><div style={{background:C.bgDeep,border:`1px solid ${C.border}`,padding:"14px 16px",marginBottom:12,fontFamily:C.mono,fontSize:11,lineHeight:1.9,color:C.gray2}}>{children}</div>;
  const Cmd=({children})=><div style={{background:"#090909",border:`1px solid ${C.border}`,padding:"10px 14px",marginBottom:8,display:"flex",gap:8,alignItems:"center"}}><span style={{color:C.gray3,flexShrink:0}}>$</span><code style={{fontFamily:C.mono,fontSize:11,color:C.gray1}}>{children}</code></div>;
  const Sec=({id,n,title,children})=><div ref={sectionRefs[id]} id={id} style={{marginBottom:48}}><div style={{fontSize:10,color:C.gray3,fontFamily:C.mono,fontStyle:"italic",marginBottom:8}}>// {String(n).padStart(2,"0")} — {id}</div><div style={{fontFamily:C.display,fontSize:"clamp(18px,2.5vw,26px)",fontWeight:800,color:C.white,letterSpacing:"-0.025em",marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>{title}</div>{children}</div>;
  const P=({children})=><p style={{fontSize:12,color:C.gray2,fontFamily:C.mono,lineHeight:2,marginBottom:14}}><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>{children}</p>;
  const KV=({k,v})=><div style={{display:"flex",gap:0,marginBottom:6}}><span style={{fontSize:11,fontFamily:C.mono,color:C.kw,minWidth:160}}>{k}</span><span style={{fontSize:11,fontFamily:C.mono,color:C.gray2}}>{v}</span></div>;
  const Badge=({label,color})=><span style={{fontSize:9,border:`1px solid ${color}55`,color,padding:"1px 8px",fontFamily:C.mono,marginRight:6}}>{label}</span>;
  const ApiRow=({method,path,desc})=><div style={{display:"flex",gap:16,alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:9,fontFamily:C.mono,padding:"2px 8px",border:`1px solid ${method==="GET"?C.fn+"55":C.kw+"55"}`,color:method==="GET"?C.fn:C.kw,flexShrink:0,minWidth:40,textAlign:"center"}}>{method}</span><code style={{fontSize:11,fontFamily:C.mono,color:C.white,flex:"0 0 260px"}}>{path}</code><span style={{fontSize:11,fontFamily:C.mono,color:C.gray2}}>{desc}</span></div>;

  return (
    <div style={{ display:"flex", alignItems:"flex-start" }}>
      {!mobile && (
        <div style={{ position:"sticky", top:0, alignSelf:"flex-start", width:200, flexShrink:0, borderRight:`1px solid ${C.border}`, padding:"28px 0", overflowY:"auto", background:C.bg, zIndex:10 }}>
          <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", padding:"0 20px", marginBottom:20 }}>// DOCS</div>
          {NAV.map(n=>{
            const isActive=active===n.id, isPast=NAV.findIndex(x=>x.id===active)>NAV.findIndex(x=>x.id===n.id);
            return <button key={n.id} onClick={()=>scrollTo(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 20px",background:"none",border:"none",borderLeft:isActive?`1px solid ${C.white}`:"1px solid transparent",cursor:"pointer",fontFamily:C.mono,transition:"border-color .2s"}}><span style={{fontSize:9,minWidth:16,color:isPast?C.fn:isActive?C.white:C.gray3,transition:"color .2s"}}>{isPast?"✓":n.n}</span><span style={{fontSize:11,color:isActive?C.white:isPast?C.gray2:C.gray3,transition:"color .2s"}}>{n.label}</span></button>;
          })}
          <div style={{ margin:"20px 20px 0", height:1, background:C.border }}/>
          <div style={{ padding:"14px 20px 0" }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8 }}>VERSION</div>
            <div style={{ fontSize:11, fontFamily:C.mono, color:C.string }}>v1.0.0</div>
            <div style={{ fontSize:10, fontFamily:C.mono, color:C.gray3, marginTop:4 }}>last updated<br/>march 2026</div>
          </div>
        </div>
      )}
      <div id="docs-scroll" style={{ flex:1, minWidth:0, padding:mobile?"16px 16px 32px":"32px 40px 60px" }}>
        <Sec id="getting-started" n={1} title="Getting started">
          <P>Riceshare is a platform for sharing and installing Linux desktop configurations. A rice is a set of dotfiless that defines the look and feel of your desktop.</P>
          <P>To install any rice from the gallery, copy the command from the rice page and paste it into your terminal.</P>
          <Cmd>curl -fsSL rice-share.vercel.app/install/author/rice-name | bash</Cmd>
          <P>The script automatically detects your distro, installs dependencies, backs up existing configs and copies filess to the correct locations.</P>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// minimum requirements</div>
            <KV k="curl"        v="≥ 7.0 — to download the script"/>
            <KV k="bash"        v="≥ 4.0 — to run it"/>
            <KV k="package mgr" v="pacman / apt / dnf / xbps"/>
            <KV k="connessione" v="active internet connection during install"/>
          </Block>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// trust system</div>
            <div style={{marginBottom:6}}><Badge label="member" color={C.gray2}/>new account — rice under review</div>
            <div style={{marginBottom:6}}><Badge label="trusted" color={C.kw}/>verified email + 1 approved rice</div>
            <div style={{marginBottom:6}}><Badge label="senior" color={C.fn}/>5 approved rice + 100 installs</div>
            <div style={{marginBottom:6}}><Badge label="staff" color={C.string}/>50 correct reports</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><FounderBadge/>founding member of the project</div>
          </Block>
        </Sec>
        <Sec id="upload-guide" n={2} title="Upload your rice">
          <P>To upload a rice you need an account with a verified email. Go to the upload page and follow the 5 guided steps.</P>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// recommended structure</div>
            {["dotfiless/","├── hypr/           ← window manager config","├── waybar/         ← status bar","│   ├── config","│   └── style.css","├── kitty/          ← terminal","wallpaper.png",".zshrc","install.sh          ← auto generated","meta.json           ← auto generated"].map((l,i)=>(
              <div key={i} style={{color:l.includes("←")?C.gray3:l.endsWith("/")?C.fn:C.gray2,fontStyle:l.includes("←")?"italic":"normal"}}>{l}</div>
            ))}
          </Block>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// limits by trust level</div>
            <KV k="member"  v="upload blocked — verify email"/>
            <KV k="trusted" v="max 2 uploads/day · under review"/>
            <KV k="senior"  v="unlimited · direct publishing"/>
          </Block>
        </Sec>
        <Sec id="install-system" n={3} title="How the install system works">
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// installation flow</div>
            {[
              {n:"01",c:C.kw,    v:"detect distro"},
              {n:"",  c:C.gray3, v:"    checks /etc/os-release and package managers"},
              {n:"02",c:C.kw,    v:"detect active WM / DE"},
              {n:"",  c:C.gray3, v:"    reads $XDG_CURRENT_DESKTOP"},
              {n:"03",c:C.fn,    v:"automatic backup"},
              {n:"",  c:C.gray3, v:"    copies ~/.config/[wm] to ~/.rice-backup/"},
              {n:"04",c:C.fn,    v:"install dependencies"},
              {n:"05",c:C.fn,    v:"copy configs to ~/.config/"},
              {n:"06",c:C.string,v:"post-install — reload WM"},
            ].map((l,i)=>(
              <div key={i} style={{display:"flex",gap:12,lineHeight:1.85}}>
                <span style={{color:C.lineNum,fontSize:10,minWidth:20,textAlign:"right",userSelect:"none"}}>{l.n}</span>
                <span style={{color:l.c}}>{l.v}</span>
              </div>
            ))}
          </Block>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// supported distros</div>
            <KV k="arch / endeavouros" v="pacman -S --noconfirm --needed"/>
            <KV k="debian / ubuntu"    v="apt install -y"/>
            <KV k="fedora"             v="dnf install -y"/>
            <KV k="void linux"         v="xbps-install -y"/>
            <KV k="nixos"              v="generates home.nix — manual install"/>
          </Block>
        </Sec>
        <Sec id="api" n={4} title="API reference">
          <P>Riceshare exposes a public REST API. All endpoints are read-only and require no authentication.</P>
          <Block><div style={{color:C.gray3,fontStyle:"italic",marginBottom:4}}>// base url</div><code style={{color:C.string}}>https://rice-share.vercel.app/api/v1</code></Block>
          <div style={{marginBottom:20}}>
            <ApiRow method="GET" path="/rice"                    desc="list all rice — params: sort, wm, distro, limit"/>
            <ApiRow method="GET" path="/rice/:author/:slug"      desc="single rice detail"/>
            <ApiRow method="GET" path="/rice/:author/:slug/meta" desc="meta.json del rice"/>
            <ApiRow method="GET" path="/install/:author/:slug"   desc="bash installation script"/>
            <ApiRow method="GET" path="/users/:username"         desc="public user profiles"/>
            <ApiRow method="GET" path="/trending"                desc="most installed rice this week"/>
          </div>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// esempio risposta</div>
            {[`{`,`  "slug":     "catppuccin-mocha-hypr",`,`  "author":   "velvet_void",`,`  "wm":       "hyprland",`,`  "likes":    847,`,`  "installs": 2341,`,`  "deps":     ["hyprland","waybar","kitty"]`,`}`].map((l,i)=>(
              <div key={i} style={{color:l.includes(":")?C.gray2:C.gray3}}>{l}</div>
            ))}
          </Block>
        </Sec>
        <Sec id="community" n={5} title="Community & contributions">
          <P>Riceshare is community driven — contributions, bug reports and suggestions are welcome on Discord.</P>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// useful links</div>
            <KV k="discord"  v="discord.gg/riceshare"/>
          </Block>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// special badges</div>
            <div style={{marginBottom:8}}><Badge label="early.adopter" color={C.string}/>first 100 users to sign up</div>
            <div style={{marginBottom:8}}><Badge label="core.dev" color={C.kw}/>code contributor</div>
            <div style={{marginBottom:8}}><Badge label="featured" color={C.fn}/>featured rice on homepage</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><FounderBadge/>founding member of the project</div>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8,marginTop:12}}>// achievement badges</div>
            {ACHIEVEMENT_BADGES.map(b=>(
              <div key={b.id} style={{marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                <Badge label={b.label} color={b.color}/>{b.desc}
              </div>
            ))}
          </Block>
        </Sec>
      </div>
    </div>
  );
}

/* ── UPLOAD GATE ─────────────────────────────────────────────────── */
function UploadGate({ onLogin }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"64px 32px" }}>
      <div style={{ maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// access required</div>
        <div style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:16 }}>You need to be registered</div>
        <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"20px", marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:2, textAlign:"left" }}>
            <div style={{ marginBottom:8 }}><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>to upload a rice on Riceshare you need an account.</div>
            <div style={{ marginBottom:8 }}><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>sign upon is free and only requires a valid email.</div>
            <div><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>after verification you receive the <span style={{fontSize:9,border:`1px solid ${C.gray2}55`,color:C.gray2,padding:"1px 7px",fontFamily:C.mono}}>member</span> e puoi iniziare.</div>
          </div>
        </div>
        <button className="bs" onClick={onLogin} style={{ padding:"10px 28px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}>sign in / register →</button>
        <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginTop:16 }}>// already have an account? click the button above</div>
      </div>
    </div>
  );
}

/* ── AUTH PAGE ───────────────────────────────────────────────────── */
function AuthPage({ onBack, onLogin }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signUp }                      = useSignUp();

  const [mode, setMode]         = useState("login"); // "login" | "signup" | "forgot"
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState({ email:"", password:"", confirm:"", username:"", code:"", newPwd:"" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:null})); setGlobalErr(""); };
  const switchMode = (m) => { setMode(m); setStep(0); setErrors({}); setGlobalErr(""); setForm({ email:"", password:"", confirm:"", username:"", code:"", newPwd:"" }); };

  const validateLogin = () => {
    const e={};
    if(!form.email)    e.email="required field";
    if(!form.password) e.password="required field";
    setErrors(e); return Object.keys(e).length===0;
  };
  const validateSignup = () => {
    const e={};
    if(!form.username||form.username.length<3)  e.username="minimum 3 characters";
    if(!/^[a-z0-9_]+$/.test(form.username))    e.username="lowercase letters, numbers and _ only";
    if(!form.email||!form.email.includes("@")) e.email="invalid email";
    if(!form.password||form.password.length<8) e.password="minimum 8 characters";
    if(form.confirm!==form.password)           e.confirm="passwords do not match";
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleLogin  = () => { if(!validateLogin())  return; setLoading(true); setTimeout(()=>{setLoading(false);onLogin();},1200); };
  const handleSignup = () => { if(!validateSignup()) return; setLoading(true); setTimeout(()=>{setLoading(false);setStep(1);},1200); };

  // ── Forgot password: step 0 → manda email, step 1 → inserisci codice + nuova pwd
  const handleForgotSend = async () => {
    if (!form.email) { setErrors({email:"enter your email"}); return; }
    setLoading(true); setGlobalErr("");
    try {
      await signIn.create({ strategy:"reset_password_email_code", identifier:form.email });
      setStep(1);
    } catch(e) {
      setGlobalErr(e.errors?.[0]?.longMessage || e.errors?.[0]?.message || "email non trovata");
    }
    setLoading(false);
  };

  const handleForgotReset = async () => {
    if (!form.code)   { setErrors({code:"enter the code"}); return; }
    if (!form.newPwd || form.newPwd.length < 8) { setErrors({newPwd:"minimum 8 characters"}); return; }
    setLoading(true); setGlobalErr("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code:     form.code,
        password: form.newPwd,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        onLogin();
      }
    } catch(e) {
      setGlobalErr(e.errors?.[0]?.longMessage || e.errors?.[0]?.message || "codice non valido");
    }
    setLoading(false);
  };

  const inputStyle = k => ({ width:"100%", background:C.bgDeep, border:`1px solid ${errors[k]?"#a05858":C.border}`, color:C.white, padding:"10px 14px", fontSize:12, fontFamily:C.mono, outline:"none", transition:"border-color .15s" });

  const pwdStrength=(()=>{const p=form.password;if(!p)return 0;let s=0;if(p.length>=8)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^a-zA-Z0-9]/.test(p))s++;return s;})();
  const strengthLabel=["","weak","medium","good","strong"][pwdStrength];
  const strengthColor=["",C.gray3,"#a07840",C.kw,C.fn][pwdStrength];

  const BackBtn = () => (
    <button onClick={onBack} style={{ background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:28, padding:0, display:"flex", alignItems:"center", gap:6 }}
      onMouseEnter={e=>e.currentTarget.style.color=C.white} onMouseLeave={e=>e.currentTarget.style.color=C.gray2}>← back to gallery</button>
  );

  const GlobalErr = () => globalErr ? (
    <div style={{ padding:"8px 12px", border:`1px solid #a0585844`, background:"#a0585808", fontSize:11, fontFamily:C.mono, color:"#c07070", marginBottom:14 }}>
      <span style={{fontStyle:"italic"}}>// </span>{globalErr}
    </div>
  ) : null;

  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px", overflow:"hidden" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <BackBtn/>

        {/* ── FORGOT: step 0 — inserisci email ── */}
        {mode==="forgot" && step===0 && (
          <div style={{ animation:"fadeIn .25s ease" }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// password recovery</div>
            <div style={{ fontFamily:C.display, fontSize:28, fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:8 }}>Forgot password</div>
            <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, marginBottom:24 }}>
              <span style={{color:C.gray3}}>// </span>enter your email — we'll send you a verification code.{" "}
              <span onClick={()=>switchMode("login")} style={{color:C.white,cursor:"pointer",textDecoration:"underline"}}>back to login</span>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:errors.email?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6}}>EMAIL</div>
              <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="name@example.com" type="email"
                style={inputStyle("email")}
                onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=errors.email?"#a05858":C.border}/>
              {errors.email && <div style={{fontSize:10,color:"#a05858",fontFamily:C.mono,fontStyle:"italic",marginTop:4}}>{errors.email}</div>}
            </div>
            <GlobalErr/>
            <button onClick={handleForgotSend} disabled={loading} className="bs"
              style={{width:"100%",padding:"11px",border:`1px solid ${C.borderHi}`,background:"transparent",color:C.white,cursor:loading?"default":"pointer",fontSize:12,fontFamily:C.mono,transition:"all .15s",opacity:loading?0.6:1}}>
              {loading ? "// sending..." : "send code →"}
            </button>
          </div>
        )}

        {/* ── FORGOT: step 1 — inserisci codice + nuova password ── */}
        {mode==="forgot" && step===1 && (
          <div style={{ animation:"fadeIn .25s ease" }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// password recovery</div>
            <div style={{ fontFamily:C.display, fontSize:28, fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:8 }}>Check your email</div>
            <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"14px 16px", marginBottom:20, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.8 }}>
              <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>codice inviato a <span style={{color:C.white}}>{form.email}</span>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:errors.code?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6}}>VERIFICATION CODE</div>
              <input value={form.code} onChange={e=>set("code",e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="123456"
                style={{...inputStyle("code"), letterSpacing:"0.2em", fontSize:16, textAlign:"center"}}
                onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=errors.code?"#a05858":C.border}/>
              {errors.code && <div style={{fontSize:10,color:"#a05858",fontFamily:C.mono,fontStyle:"italic",marginTop:4}}>{errors.code}</div>}
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:errors.newPwd?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6}}>NEW PASSWORD</div>
              <div style={{position:"relative"}}>
                <input value={form.newPwd} onChange={e=>set("newPwd",e.target.value)} placeholder="minimum 8 characters"
                  type={showPwd?"text":"password"}
                  style={{...inputStyle("newPwd"),paddingRight:44}}
                  onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=errors.newPwd?"#a05858":C.border}/>
                <button onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray3,cursor:"pointer",fontSize:10,fontFamily:C.mono,padding:0}}>{showPwd?"hide":"show"}</button>
              </div>
              {errors.newPwd && <div style={{fontSize:10,color:"#a05858",fontFamily:C.mono,fontStyle:"italic",marginTop:4}}>{errors.newPwd}</div>}
            </div>
            <GlobalErr/>
            <button onClick={handleForgotReset} disabled={loading} className="bs"
              style={{width:"100%",padding:"11px",border:`1px solid ${C.borderHi}`,background:"transparent",color:C.white,cursor:loading?"default":"pointer",fontSize:12,fontFamily:C.mono,transition:"all .15s",marginBottom:10,opacity:loading?0.6:1}}>
              {loading ? "// verifying..." : "reset password →"}
            </button>
            <button onClick={()=>setStep(0)} style={{width:"100%",padding:"8px",border:"none",background:"transparent",color:C.gray3,cursor:"pointer",fontSize:11,fontFamily:C.mono}}>← change email</button>
          </div>
        )}

        {/* ── SIGNUP: step 1 — email inviata ── */}
        {mode==="signup" && step===1 && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// email verification</div>
            <div style={{ fontFamily:C.display, fontSize:28, fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:20 }}>Check your email</div>
            <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"20px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:2 }}>
                <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>we sent a verification link to<br/><span style={{color:C.white}}>{form.email}</span>
              </div>
            </div>
            <button onClick={onBack} className="bs" style={{ width:"100%", padding:"11px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}>back to home →</button>
          </div>
        )}

        {/* ── LOGIN / SIGNUP form ── */}
        {!(mode==="forgot") && !(mode==="signup"&&step===1) && (
          <div style={{ animation:"fadeIn .25s ease" }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>{mode==="login"?"// sign in to your account":"// create your account"}</div>
            <div style={{ fontFamily:C.display, fontSize:28, fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:8 }}>{mode==="login"?"Login":"Sign up"}</div>
            <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, marginBottom:28 }}>
              {mode==="login"
                ?<><span style={{color:C.gray3}}>// </span>don't have an account? <span onClick={()=>switchMode("signup")} style={{color:C.white,cursor:"pointer",textDecoration:"underline"}}>sign up</span></>
                :<><span style={{color:C.gray3}}>// </span>already have an account? <span onClick={()=>switchMode("login")} style={{color:C.white,cursor:"pointer",textDecoration:"underline"}}>sign in</span></>
              }
            </div>

            {mode==="signup" && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,color:errors.username?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                  <span>USERNAME</span>{errors.username&&<span style={{fontStyle:"italic",textTransform:"none",letterSpacing:0}}>// {errors.username}</span>}
                </div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.gray3,fontSize:12,fontFamily:C.mono,pointerEvents:"none"}}>@</span>
                  <input value={form.username} onChange={e=>set("username",e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="your_username"
                    style={{...inputStyle("username"),paddingLeft:28}}
                    onFocus={e=>e.target.style.borderColor=errors.username?"#a05858":C.white}
                    onBlur={e=>e.target.style.borderColor=errors.username?"#a05858":C.border}/>
                </div>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:errors.email?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6}}><span>EMAIL</span></div>
              <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="name@example.com" type="email"
                style={inputStyle("email")}
                onFocus={e=>e.target.style.borderColor=errors.email?"#a05858":C.white}
                onBlur={e=>e.target.style.borderColor=errors.email?"#a05858":C.border}/>
            </div>

            <div style={{marginBottom:mode==="login"?6:14}}>
              <div style={{fontSize:9,color:errors.password?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6}}><span>PASSWORD</span></div>
              <div style={{position:"relative"}}>
                <input value={form.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>setCapsLock(e.getModifierState?.("CapsLock"))}
                  placeholder={mode==="signup"?"minimum 8 characters":"••••••••"} type={showPwd?"text":"password"}
                  style={{...inputStyle("password"),paddingRight:44}}
                  onFocus={e=>e.target.style.borderColor=errors.password?"#a05858":C.white}
                  onBlur={e=>e.target.style.borderColor=errors.password?"#a05858":C.border}/>
                <button onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray3,cursor:"pointer",fontSize:10,fontFamily:C.mono,padding:0}}>{showPwd?"hide":"show"}</button>
              </div>
              {mode==="signup"&&form.password&&(
                <div style={{marginTop:6}}>
                  <div style={{display:"flex",gap:3,marginBottom:4}}>{[1,2,3,4].map(i=><div key={i} style={{flex:1,height:2,background:i<=pwdStrength?strengthColor:C.border,transition:"background .2s"}}/>)}</div>
                  <div style={{fontSize:9,color:strengthColor,fontFamily:C.mono,fontStyle:"italic"}}>{strengthLabel&&`// password ${strengthLabel}`}</div>
                </div>
              )}
            </div>

            {/* Link password dimenticata — solo in login mode */}
            {mode==="login" && (
              <div style={{marginBottom:14,textAlign:"right"}}>
                <span onClick={()=>switchMode("forgot")} style={{fontSize:10,color:C.gray3,fontFamily:C.mono,cursor:"pointer",fontStyle:"italic",transition:"color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.gray1}
                  onMouseLeave={e=>e.currentTarget.style.color=C.gray3}
                >// forgot password?</span>
              </div>
            )}

            {mode==="signup" && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,color:errors.confirm?"#a05858":C.gray3,letterSpacing:"0.1em",marginBottom:6}}><span>CONFIRM PASSWORD</span></div>
                <input value={form.confirm} onChange={e=>set("confirm",e.target.value)} placeholder="repeat password" type={showPwd?"text":"password"}
                  style={inputStyle("confirm")}
                  onFocus={e=>e.target.style.borderColor=errors.confirm?"#a05858":C.white}
                  onBlur={e=>e.target.style.borderColor=errors.confirm?"#a05858":C.border}/>
              </div>
            )}

            {capsLock&&<div style={{fontSize:10,color:C.string,fontFamily:C.mono,fontStyle:"italic",marginBottom:14}}>// caps lock active</div>}
            <GlobalErr/>

            <button onClick={mode==="login"?handleLogin:handleSignup} className="bs"
              style={{width:"100%",padding:"11px",border:`1px solid ${C.borderHi}`,background:"transparent",color:C.white,cursor:loading?"default":"pointer",fontSize:12,fontFamily:C.mono,transition:"all .15s",marginBottom:14,opacity:loading?0.6:1}}>
              {loading?<span style={{fontStyle:"italic",color:C.gray2}}>// authenticating...</span>:mode==="login"?"sign in →":"create account →"}
            </button>

            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:10,color:C.gray3,fontFamily:C.mono}}>or</span><div style={{flex:1,height:1,background:C.border}}/>
            </div>
            <button className="bg" style={{width:"100%",padding:"11px",border:`1px solid ${C.border}`,background:"transparent",color:C.gray2,cursor:"pointer",fontSize:12,fontFamily:C.mono,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <span style={{fontSize:13}}>G</span>continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PUBLIC PROFILE PAGE ─────────────────────────────────────────── */
function PublicProfilesPage({ author, onBack, onSelectRice }) {
  const mobile = useMobile();
  const { user } = useUser();
  const [profiles, setProfiles] = useState(null);
  const [pubAchievements, setPubAchievements] = useState([]);
  const [rices, setRices]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      // Carica profilo utente
      supabase.from('users').select('*').eq('username', author).single()
        .then(({ data: u }) => {
          setProfiles(u || { username:author, badge:'member', trust_level:0 });
          if (!u) { setLoading(false); return; }
          // Upload rice approvati di questo autore
          supabase.from('user_badges').select('badge').eq('user_id', u.id)
            .then(({ data }) => setPubAchievements((data||[]).map(b=>b.badge)));
          supabase.from('rice').select('*, users(username)').eq('author_id', u.id).eq('status','approved')
            .then(({ data: r }) => { setRices((r||[]).map(normalizeRice)); setLoading(false); });
          // Fetch follower count + check if current user follows
          supabase.from('follows').select('follower_id', { count:'exact', head:true }).eq('following_id', u.id)
            .then(({ count }) => setFollowers(count || 0));
          if (user) {
            supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', u.id).maybeSingle()
              .then(({ data }) => setIsFollowing(!!data));
          }
        });
    }).catch(()=>setLoading(false));
  }, [author, user]);

  const toggleFollow = async () => {
    if (!user || !profiles?.id || followLoading) return;
    setFollowLoading(true);
    const { supabase } = await import('../lib/supabase');
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profiles.id);
      setIsFollowing(false);
      setFollowers(f => Math.max(0, f - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profiles.id });
      setIsFollowing(true);
      setFollowers(f => f + 1);
      // Notifica al seguito
      if (profiles.clerk_id && profiles.clerk_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: profiles.clerk_id,
          type:    'follow',
          message: `@${user.username || user.firstName} started following you`,
        }).then(()=>{}).catch(()=>{});
      }
    }
    setFollowLoading(false);
  };

  const isFounder  = profiles?.badge === 'founder';
  const badgeColor = { founder:C.gold, staff:C.string, senior:C.fn, trusted:C.kw, member:C.gray2 }[profiles?.badge] || C.gray2;

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:mobile?"16px 16px 32px":"32px 32px 48px" }}>
        <div style={{ fontSize:11, color:C.gray2, marginBottom:28, fontFamily:C.mono }}>
          <span onClick={onBack} style={{ color:C.fn, cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".6"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          >← back</span>
          <span style={{ color:C.gray3, margin:"0 8px" }}>/</span>
          <span style={{ color:C.gray2 }}>@{author}</span>
        </div>

        <div style={{ border:`1px solid ${isFounder?C.gold+"44":C.border}`, background:C.bgCard, padding:"24px 28px", marginBottom:24 }}>
          <div style={{ display:"flex", flexDirection:mobile?"column":"row", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:mobile?12:20 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em" }}>@{author}</span>
                {profiles?.badge && !isFounder && <span style={{ fontSize:9, border:`1px solid ${badgeColor}55`, color:badgeColor, padding:"2px 9px", fontFamily:C.mono }}>{profiles.badge}</span>}
                {isFounder && <FounderBadge/>}
              </div>
              {pubAchievements.length>0 && (
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
                  {ACHIEVEMENT_BADGES.filter(b=>pubAchievements.includes(b.id)).map(b=><BadgeChip key={b.id} badge={b}/>)}
                </div>
              )}
              {(profiles?.created_at || profiles?.joined) && (
                <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, marginBottom:8, fontStyle:"italic" }}>
                  // member since {new Date(profiles.created_at || profiles.joined).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
                </div>
              )}
              {profiles?.bio && <div style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, marginBottom:14, lineHeight:1.8 }}>{profiles.bio}</div>}
              {profiles?.website && (
                <div style={{ fontSize:11, fontFamily:C.mono }}>
                  <span style={{ color:C.gray3 }}>web    </span>
                  <a href={profiles.website} target="_blank" rel="noreferrer" style={{ color:C.kw, textDecoration:"none" }}>{profiles.website.replace("https://","")}</a>
                </div>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:16 }}>
              <div style={{ display:"flex", gap:24 }}>
                {[{v:rices.length,l:"rice"},{v:fmt(rices.reduce((a,r)=>a+(r.installs||0),0)),l:"installs"},{v:fmt(rices.reduce((a,r)=>a+(r.likes||0),0)),l:"likes"},{v:followers,l:"followers"}].map(s=>(
                  <div key={s.l} style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:600, color:C.white, fontFamily:C.mono }}>{s.v}</div>
                    <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {user && user.username !== author && (
                <button onClick={toggleFollow} disabled={followLoading} style={{
                  padding:"6px 18px", border:`1px solid ${isFollowing ? C.border : C.fn}`,
                  background: isFollowing ? "transparent" : C.fn+"14",
                  color: isFollowing ? C.gray2 : C.fn,
                  cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s"
                }}
                  onMouseEnter={e=>{ if(!isFollowing) e.currentTarget.style.background=C.fn+"28"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=isFollowing?"transparent":C.fn+"14"; }}
                >{followLoading ? "..." : isFollowing ? "following ✓" : "+ follow"}</button>
              )}

            </div>
          </div>
        </div>

        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// published rice — {rices.length}</div>
        {loading ? (
          <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// loading...</div>
        ) : rices.length===0 ? (
          <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no rice yet</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
            {rices.map((r,i)=><RiceCard key={r.id} rice={r} onClick={onSelectRice} delay={i*.06}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── DELETE RICE BUTTON ─────────────────────────────────────────── */
function DeleteRiceButton({ riceId, riceName, onDeleted }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const handleDelete = async () => {
    setLoading(true); setErr("");
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('rice_likes').delete().eq('rice_id', riceId);
      await supabase.from('comments').delete().eq('rice_id', riceId);
      const { error } = await supabase.from('rice').delete().eq('id', riceId);
      if (error) throw new Error(error.message);
      onDeleted();
    } catch(e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={()=>setConfirm(true)}
        style={{ fontSize:9, fontFamily:C.mono, padding:"2px 8px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", transition:"all .15s", borderRadius:3 }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#a0585866"; e.currentTarget.style.color="#c07070"; e.currentTarget.style.background="#c0707010"; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.gray3; e.currentTarget.style.background="transparent"; }}
      >🗑 delete</button>

      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e=>{ if(e.target===e.currentTarget) setConfirm(false); }}>
          <div style={{ background:C.bgCard, border:`1px solid #c0707044`, borderRadius:8, padding:"24px 28px", width:320, fontFamily:C.mono }}>
            <div style={{ fontSize:13, color:"#c07070", fontWeight:700, marginBottom:10 }}>🗑 delete rice</div>
            <div style={{ fontSize:11, color:C.gray2, marginBottom:18, lineHeight:1.6 }}>
              sei sicuro di voler eliminare<br/>
              <span style={{ color:C.white, fontWeight:600 }}>"{riceName || riceId}"</span>?<br/>
              <span style={{ fontSize:10, color:C.gray3 }}>questa azione è irreversibile.</span>
            </div>
            {err && <div style={{ fontSize:10, color:"#c07070", marginBottom:10 }}>⚠ {err}</div>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>{ setConfirm(false); setErr(""); }}
                style={{ fontSize:11, fontFamily:C.mono, padding:"6px 16px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", borderRadius:4 }}>
                annulla
              </button>
              <button onClick={handleDelete} disabled={loading}
                style={{ fontSize:11, fontFamily:C.mono, padding:"6px 16px", border:`1px solid #c0707066`, background:"#c0707020", color:"#c07070", cursor:loading?"wait":"pointer", borderRadius:4, fontWeight:600 }}>
                {loading ? "eliminazione..." : "elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── SETTINGS TAB ───────────────────────────────────────────────── */
function DeleteAccountButton({ user, signOut }) {
  const [confirm, setConfirm] = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleDelete = async () => {
    setLoading(true); setError("");
    try {
      // Elimina i rice dell'utente da Supabase
      const { supabase } = await import('../lib/supabase');
      await supabase.from('rice').delete().eq('author_id', user.id);
      await supabase.from('rice_likes').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
      // Elimina l'account Clerk
      await user.delete();
      await signOut();
    } catch(e) {
      setError(e.errors?.[0]?.message || e.message || "errore durante l'deletezione");
      setLoading(false);
    }
  };

  if (!confirm) return (
    <button
      onClick={()=>setConfirm(true)}
      style={{ padding:"8px 18px", border:`1px solid #a0585866`, background:"transparent", color:"#c07070", cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.background="#a0585814"; }}
      onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}
    >delete account</button>
  );

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.8, marginBottom:12 }}>
        <span style={{color:"#a05858",fontStyle:"italic"}}>// </span>
        type your username <span style={{color:C.white}}>@{user.username||user.firstName}</span> to confirm
      </div>
      <input
        value={input}
        onChange={e=>{ setInput(e.target.value); setError(""); }}
        placeholder={user.username||user.firstName||"username"}
        style={{ width:"100%", background:C.bgDeep, border:`1px solid #a0585866`, color:C.white, padding:"9px 12px", fontSize:12, fontFamily:C.mono, outline:"none", marginBottom:10 }}
        onFocus={e=>e.target.style.borderColor="#c07070"}
        onBlur={e=>e.target.style.borderColor="#a0585866"}
      />
      {error && <div style={{ fontSize:10, color:"#c07070", fontFamily:C.mono, fontStyle:"italic", marginBottom:10 }}>// {error}</div>}
      <div style={{ display:"flex", gap:8 }}>
        <button
          onClick={handleDelete}
          disabled={input!==(user.username||user.firstName)||loading}
          style={{
            padding:"8px 18px", border:`1px solid #a0585866`,
            background: input===(user.username||user.firstName)&&!loading ? "#a0585820" : "transparent",
            color: input===(user.username||user.firstName)&&!loading ? "#c07070" : "#5c5c58",
            cursor: input===(user.username||user.firstName)&&!loading ? "pointer" : "default",
            fontSize:11, fontFamily:C.mono, transition:"all .15s",
          }}
        >{loading ? "// deleting..." : "confirm deletion"}</button>
        <button
          onClick={()=>{ setConfirm(false); setInput(""); setError(""); }}
          style={{ padding:"8px 18px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", fontSize:11, fontFamily:C.mono }}
        >cancel</button>
      </div>
    </div>
  );
}

function NotificationsTab({ userId, onRead }) {
  const [notifs, setNotifs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('notifications').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => {
          setNotifs(data || []);
          setLoaded(true);
          // Segna tutte come lette
          supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false).then(()=>{});
          if (onRead) onRead();
        });
    });
  }, [userId]);

  const typeIcon  = { like:'♥', comment:'💬', issue:'⚠️', follow:'👤', rice_deleted:'🗑' };
  const typeColor = { like:'#f43f5e', comment:C.fn, issue:'#ef4444', follow:'#818cf8', rice_deleted:'#f87171' };
  const typeTitle = {
    like:         '♥ new like on your rice',
    comment:      '💬 new comment on your rice',
    issue:        '⚠️ issue reported on your rice',
    follow:       '👤 someone followed you',
    rice_deleted: '🗑 your rice was removed by an admin',
  };
  const typeSub = {
    like:         (n) => n.rice_name ? `someone liked "${n.rice_name}"` : 'someone liked your rice',
    comment:      (n) => n.rice_name ? `new comment on "${n.rice_name}"` : 'someone commented on your rice',
    issue:        (n) => n.rice_name ? `issue opened on "${n.rice_name}"` : 'an issue was reported on your rice',
    follow:       (_) => 'you have a new follower — check your profile!',
    rice_deleted: (n) => n.rice_name ? `"${n.rice_name}" was removed from the gallery` : 'one of your rice was removed from the gallery',
  };

  if (!loaded) return <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, padding:"20px 0" }}>loading...</div>;
  if (!notifs.length) return (
    <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, padding:"20px 0", fontStyle:"italic" }}>
      // no notifications yet
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:4 }}>// notifications</div>
      {notifs.map(n => {
        const col = typeColor[n.type] || C.gray3;
        const title = typeTitle[n.type] || '🔔 new notification';
        const sub   = typeSub[n.type] ? typeSub[n.type](n) : '';
        return (
        <div key={n.id} style={{
          border:`1px solid ${n.read ? C.border : col+'88'}`,
          borderLeft:`3px solid ${col}`,
          background: n.read ? C.bgDeep : col+'0d',
          padding:"12px 14px",
          opacity: n.read ? 0.6 : 1,
          transition:"opacity .2s"
        }}>
          {/* header row: title + date */}
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:11, fontFamily:C.mono, fontWeight:700, color: n.read ? C.gray3 : col, letterSpacing:"0.01em" }}>
              {title}
            </span>
            <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginLeft:"auto", whiteSpace:"nowrap" }}>
              {new Date(n.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
            </span>
          </div>
          {/* sub-line */}
          <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom: n.message ? 8 : 0 }}>
            {sub}
          </div>
          {/* admin message (only for rice_deleted) */}
          {n.message && (
            <div style={{ fontSize:11, color:C.white, fontFamily:C.mono, lineHeight:1.7,
              borderTop:`1px solid ${col}33`, paddingTop:8, marginTop:4 }}>
              <span style={{ color:col, fontSize:9, fontStyle:"italic" }}>// admin note: </span>{n.message}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

function SimilarRice({ rice, onSelect }) {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (!rice.id || !rice.wm) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('rice')
        .select('id, title, author_id, images, wm, distro, tags, likes, users(username)')
        .eq('status', 'approved')
        .eq('wm', rice.wm)
        .neq('id', rice.id)
        .order('likes', { ascending: false })
        .limit(8)
        .then(({ data }) => {
          if (!data || data.length === 0) return;
          const myTags = rice.tags || [];
          const scored = data.map(r => ({
            ...normalizeRice(r),
            _score: (r.tags || []).filter(t => myTags.includes(t)).length
          }));
          scored.sort((a, b) => b._score - a._score);
          setSimilar(scored.slice(0, 4));
        });
    });
  }, [rice.id]);

  if (!similar.length) return null;

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", fontFamily:C.mono, marginBottom:10 }}>// SIMILAR</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
        {similar.map(r => (
          <div key={r.id} onClick={()=>onSelect(r)}
            style={{ cursor:"pointer", border:`1px solid ${C.border}`, padding:"10px 12px", background:C.bgDeep, transition:"border-color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHi}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{ fontSize:11, color:C.white, fontFamily:C.mono, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
            <div style={{ fontSize:9, color:C.gray3, fontFamily:C.mono }}>@{r.author} · ♥ {r.likes||0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ user, signOut }) {
  const mobile = useMobile();
  const [pwdForm, setPwdForm]   = useState({ current:"", next:"", confirm:"" });
  const [showPwd, setShowPwd]   = useState(false);
  const [pwdState, setPwdState] = useState(null); // null | "loading" | "ok" | "error"
  const [pwdError, setPwdError] = useState("");
  const [bio, setBio]           = useState("");
  const [bioSaved, setBioSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('users').select('bio').eq('clerk_id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.bio) setBio(data.bio); });
    });
  }, [user?.id]);

  const saveBio = async () => {
    const { supabase } = await import('../lib/supabase');
    await supabase.from('users').update({ bio: bio.trim() }).eq('clerk_id', user.id);
    setBioSaved(true);
    setTimeout(() => setBioSaved(false), 2500);
  };

  const setPwd = (k,v) => setPwdForm(f=>({...f,[k]:v}));

  const pwdStrength = (() => {
    const p = pwdForm.next; if(!p) return 0;
    let s=0;
    if(p.length>=8)          s++;
    if(/[A-Z]/.test(p))      s++;
    if(/[0-9]/.test(p))      s++;
    if(/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["","weak","medium","good","strong"][pwdStrength];
  const strengthColor = ["",C.gray3,"#a07840",C.kw,C.fn][pwdStrength];

  const handleChangePwd = async () => {
    setPwdError("");
    if (!pwdForm.current)        { setPwdError("enter your current password"); return; }
    if (pwdForm.next.length < 8) { setPwdError("new password must be at least 8 characters"); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("passwords do not match"); return; }
    setPwdState("loading");
    try {
      await user.updatePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.next });
      setPwdState("ok");
      setPwdForm({ current:"", next:"", confirm:"" });
      setTimeout(() => setPwdState(null), 3000);
    } catch(e) {
      setPwdState("error");
      setPwdError(e.errors?.[0]?.message || e.message || "errore durante il cambio password");
    }
  };

  const inputStyle = (err) => ({
    width:"100%", background:C.bgDeep,
    border:`1px solid ${err ? "#a05858" : C.border}`,
    color:C.white, padding:"9px 12px", fontSize:12,
    fontFamily:C.mono, outline:"none", transition:"border-color .15s",
  });

  return (
    <div style={{ animation:"fadeIn .2s ease", maxWidth:480 }}>
      <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// settings account</div>

      {/* Campi read-only con lucchetto */}
      {[
        { label:"USERNAME", val:user.username||"" },
        { label:"EMAIL",    val:user.primaryEmailAddress?.emailAddress||"" },
      ].map(f=>(
        <div key={f.label} style={{ marginBottom:14 }}>
          <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span>{f.label}</span>
              <span title="read-only field" style={{ fontSize:10, opacity:.5, userSelect:"none" }}>🔒</span>
            </div>
            <span style={{ fontSize:9, fontStyle:"italic", textTransform:"none", letterSpacing:0, color:C.gray3 }}>// read only</span>
          </div>
          <div style={{ position:"relative" }}>
            <input
              defaultValue={f.val}
              disabled
              style={{...inputStyle(false), opacity:0.45, cursor:"not-allowed", paddingRight:36 }}
              onClick={e=>e.preventDefault()}
            />
            <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:11, opacity:.3, userSelect:"none", pointerEvents:"none" }}>🔒</span>
          </div>
        </div>
      ))}
      <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:4, lineHeight:1.8 }}>
        <span style={{color:"#2e2e2e"}}>// </span>username e email non sono modificabili da qui —<br/>
        <span style={{color:"#2e2e2e"}}>// </span>apri un ticket su{" "}
        <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ color:C.kw, textDecoration:"none" }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".7"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >discord</a>
        {" "}for support.
      </div>

      {/* Bio */}
      <div style={{ height:1, background:C.border, margin:"24px 0 20px" }}/>
      <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:10 }}>// bio</div>
      <textarea
        value={bio}
        onChange={e=>setBio(e.target.value)}
        maxLength={300}
        placeholder="tell people about yourself..."
        rows={3}
        style={{ width:"100%", background:C.bgDeep, border:`1px solid ${C.border}`, color:C.white, padding:"9px 12px", fontSize:12, fontFamily:C.mono, outline:"none", resize:"vertical", boxSizing:"border-box" }}
      />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6, marginBottom:4 }}>
        <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono }}>{bio.length}/300</span>
        <button onClick={saveBio} className="bg" style={{ padding:"5px 14px", border:`1px solid ${bioSaved?C.kw:C.border}`, background:"transparent", color:bioSaved?C.kw:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"all .2s" }}>{bioSaved?"saved ✓":"save bio"}</button>
      </div>

      {/* Sezione cambio password */}
      <div style={{ height:1, background:C.border, margin:"24px 0 20px" }}/>
      <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// change password</div>

      {/* Password attuale */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:6 }}>CURRENT PASSWORD</div>
        <div style={{ position:"relative" }}>
          <input
            type={showPwd?"text":"password"}
            value={pwdForm.current}
            onChange={e=>setPwd("current",e.target.value)}
            placeholder="••••••••"
            style={{...inputStyle(false), paddingRight:44}}
            onFocus={e=>e.target.style.borderColor=C.white}
            onBlur={e=>e.target.style.borderColor=C.border}
          />
          <button onClick={()=>setShowPwd(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:10, fontFamily:C.mono, padding:0 }}>
            {showPwd?"hide":"show"}
          </button>
        </div>
      </div>

      {/* Nuova password */}
      <div style={{ marginBottom:6 }}>
        <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:6 }}>NEW PASSWORD</div>
        <input
          type={showPwd?"text":"password"}
          value={pwdForm.next}
          onChange={e=>setPwd("next",e.target.value)}
          placeholder="minimum 8 characters"
          style={inputStyle(false)}
          onFocus={e=>e.target.style.borderColor=C.white}
          onBlur={e=>e.target.style.borderColor=C.border}
        />
        {pwdForm.next && (
          <div style={{ marginTop:6 }}>
            <div style={{ display:"flex", gap:3, marginBottom:3 }}>
              {[1,2,3,4].map(i=>(
                <div key={i} style={{ flex:1, height:2, background:i<=pwdStrength?strengthColor:C.border, transition:"background .2s" }}/>
              ))}
            </div>
            <div style={{ fontSize:9, color:strengthColor, fontFamily:C.mono, fontStyle:"italic" }}>
              {strengthLabel && `// password ${strengthLabel}`}
            </div>
          </div>
        )}
      </div>

      {/* Conferma nuova password */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:6, marginTop:14 }}>CONFERMA NEW PASSWORD</div>
        <input
          type={showPwd?"text":"password"}
          value={pwdForm.confirm}
          onChange={e=>setPwd("confirm",e.target.value)}
          placeholder="repeat new password"
          style={inputStyle(pwdForm.confirm && pwdForm.confirm !== pwdForm.next)}
          onFocus={e=>e.target.style.borderColor=C.white}
          onBlur={e=>e.target.style.borderColor=pwdForm.confirm&&pwdForm.confirm!==pwdForm.next?"#a05858":C.border}
        />
        {pwdForm.confirm && pwdForm.confirm !== pwdForm.next && (
          <div style={{ fontSize:10, color:"#a05858", fontFamily:C.mono, fontStyle:"italic", marginTop:4 }}>// passwords do not match</div>
        )}
      </div>

      {/* Errore */}
      {pwdError && pwdState==="error" && (
        <div style={{ padding:"8px 12px", border:`1px solid #a0585844`, background:"#a0585808", fontSize:11, fontFamily:C.mono, color:"#c07070", marginBottom:14 }}>
          <span style={{fontStyle:"italic"}}>// </span>{pwdError}
        </div>
      )}

      {/* Successo */}
      {pwdState==="ok" && (
        <div style={{ padding:"8px 12px", border:`1px solid ${C.fn}44`, background:`${C.fn}08`, fontSize:11, fontFamily:C.mono, color:C.fn, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <span>✓</span> password updated
        </div>
      )}

      {/* Bottone salva */}
      <button
        onClick={handleChangePwd}
        disabled={pwdState==="loading"}
        className={pwdForm.current&&pwdForm.next?"bs":""}
        style={{
          padding:"9px 20px", border:`1px solid ${pwdForm.current&&pwdForm.next?C.borderHi:C.border}`,
          background:"transparent", color:pwdForm.current&&pwdForm.next?C.white:C.gray3,
          cursor:pwdState==="loading"?"default":"pointer", fontSize:11, fontFamily:C.mono,
          transition:"all .15s", opacity:pwdState==="loading"?0.6:1, marginBottom:24,
        }}
      >
        {pwdState==="loading" ? "// updating..." : "update password"}
      </button>

      <div style={{ height:1, background:C.border, marginBottom:16 }}/>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <button onClick={()=>signOut()} style={{ padding:"9px 20px", border:`1px solid #a0585844`, background:"transparent", color:"#a05858", cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>logout</button>
      </div>

      {/* ── Elimina account ── */}
      <div style={{ marginTop:32, padding:"16px", border:`1px solid #a0585833`, background:"#a0585806" }}>
        <div style={{ fontSize:10, color:"#a05858", fontFamily:C.mono, letterSpacing:"0.08em", marginBottom:8 }}>// DANGER ZONE</div>
        <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.8, marginBottom:14 }}>
          <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>
          deleting your account permanently removes your profiles and all associated data. this action cannot be undone.
        </div>
        <DeleteAccountButton user={user} signOut={signOut}/>
      </div>
    </div>
  );
}

/* ── PROFILE PAGE ────────────────────────────────────────────────── */

function IssuesTab({ rices, mobile }) {
  const [issues, setIssues] = useState(null);
  useEffect(() => {
    import('../lib/supabase').then(async ({ supabase }) => {
      const riceIds = rices.map(r => r.id);
      if (!riceIds.length) { setIssues([]); return; }
      const { data } = await supabase
        .from('comments')
        .select('*')
        .in('rice_id', riceIds)
        .eq('type', 'issue')
        .order('created_at', { ascending: false });
      setIssues(data || []);
    });
  }, [rices]);

  const deleteIssue = async (id) => {
    import('../lib/supabase').then(async ({ supabase }) => {
      await supabase.from('comments').delete().eq('id', id);
      setIssues(prev => prev.filter(i => i.id !== id));
    });
  };

  if (!issues) return <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// loading...</div>;
  if (!issues.length) return <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no issues reported on your rice</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {issues.map(issue => {
        const riceTitle = rices.find(r => r.id === issue.rice_id)?.title || "rice";
        return (
          <div key={issue.id} style={{ border:"1px solid #ef444466", borderLeft:"3px solid #ef4444", background:"#ef444408", padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:9, color:"#fff", background:"#ef4444", padding:"2px 7px", fontFamily:C.mono, fontWeight:600, letterSpacing:"0.05em" }}>⚠ issue</span>
                  <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono }}>// {riceTitle}</span>
                </div>
                <div>
                  <span style={{ fontSize:11, fontFamily:C.mono, color:C.fn }}>@{issue.username}</span>
                  <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, marginLeft:8 }}>
                    {new Date(issue.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                  </span>
                </div>
              </div>
              <button onClick={() => deleteIssue(issue.id)} className="bs" style={{
                padding:"4px 10px", border:`1px solid ${C.string}55`,
                background:"transparent", color:C.string, cursor:"pointer",
                fontSize:9, fontFamily:C.mono, flexShrink:0, transition:"all .15s"
              }}>resolved ✓</button>
            </div>
            <p style={{ fontSize:12, color:C.gray1, fontFamily:C.mono, margin:0, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{issue.content}</p>
          </div>
        );
      })}
    </div>
  );
}

function ProfilesPage({ onNav, onSelectRice, onClearNotifs }) {
  const mobile = useMobile();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();
  const [rices, setRices]         = useState([]);
  const [likedRices, setLikedRices] = useState([]);
  const [tab, setTab]             = useState("rice");
  const [isFounder, setIsFounder] = useState(false);
  const [badge, setBadge]         = useState("member");
  const [achievements, setAchievements] = useState([]);
  const [ownFollowing, setOwnFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    import('../lib/supabase').then(async ({ supabase }) => {
      const [{ data: userData }, { data: riceData }, { data: likesData }, { count: followingCount }, { count: notifUnread }] = await Promise.all([
        supabase.from('users').select('badge,trust_level,created_at').eq('id', user.id).single(),
        supabase.from('rice').select('*, users(username)').eq('author_id', user.id),
        supabase.from('rice_likes').select('rice_id').eq('user_id', user.id),
        supabase.from('follows').select('following_id', { count:'exact', head:true }).eq('follower_id', user.id),
        supabase.from('notifications').select('id', { count:'exact', head:true }).eq('user_id', user.id).eq('read', false),
      ]);
      const myRices = riceData || [];
      const newBadge = userData?.badge || 'member';
      const earned = await computeBadges(user.id, myRices, userData?.created_at, supabase);
      let likedRiceData = [];
      if (likesData && likesData.length > 0) {
        const likedIds = likesData.map(l => l.rice_id);
        const { data: lr } = await supabase
          .from('rice')
          .select('*, users(username)')
          .in('id', likedIds)
          .eq('status', 'approved');
        likedRiceData = lr || [];
      }
      // Single batch update - one render only
      setBadge(newBadge);
      setIsFounder(newBadge === 'founder');
      setOwnFollowing(followingCount || 0);
      setRices(myRices);
      setAchievements(earned);
      setLikedRices(likedRiceData);
      setUnreadNotifCount(notifUnread || 0);
      setLoading(false);
    });
  }, [user?.id]);

  if (!user || !clerkLoaded) return null;
  if (loading) return (
    <div style={{ padding: mobile?"60px 16px":"80px 40px", textAlign:"center", fontSize:11, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>
      // loading profile...
    </div>
  );

  const badgeColor = { founder:C.gold, staff:C.string, senior:C.fn, trusted:C.kw, member:C.gray2 }[badge] || C.gray2;
  const earnedBadges = ACHIEVEMENT_BADGES.filter(b => achievements.includes(b.id));

  const stats = [
    {v:rices.length, l:"rice"},
    {v:rices.reduce((a,r)=>a+(r.installs||0),0), l:"installs"},
    {v:rices.reduce((a,r)=>a+(r.likes||0),0), l:"likes"},
    {v:ownFollowing, l:"following"},
  ];








  /* ── MOBILE LAYOUT ─────────────────────────────────────────── */
  if (mobile) return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      {/* Header card — avatar + name + stats */}
      <div style={{ background:C.bgDeep, borderBottom:`1px solid ${C.border}`, padding:"20px 16px 16px" }}>
        {/* Name + badge */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:C.display, fontSize:22, fontWeight:800, color:C.white, letterSpacing:"-0.02em", marginBottom:6 }}>
            @{user.username || user.firstName}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            {!isFounder && <span style={{ fontSize:9, border:`1px solid ${badgeColor}55`, color:badgeColor, padding:"1px 7px", fontFamily:C.mono }}>{badge}</span>}
            {isFounder && <FounderBadge/>}
            {earnedBadges.map(b=><BadgeChip key={b.id} badge={b}/>)}
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:C.border, border:`1px solid ${C.border}`, marginBottom:12 }}>
          {stats.map(s=>(
            <div key={s.l} style={{ background:C.bgCard, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:C.white, fontFamily:C.mono, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:9, color:C.gray3, marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>
          // member since {new Date(user.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
        </div>
      </div>
      <div style={{ padding:"14px 14px 32px" }}>
    <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:mobile?16:24 }}>
      {[["rice","rice"],["liked","liked"],["issues","issues"],["notifs","notifs"],["settings","settings"]].map(([t,label])=>(
        <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:mobile?"8px 14px":"9px 18px", background:"none", borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:tab===t?`2px solid ${C.fn}`:"2px solid transparent", color:tab===t?C.fn:C.gray2, cursor:"pointer", fontSize:mobile?10:12, fontFamily:C.mono, marginBottom:-1, display:"flex", alignItems:"center", gap:4, fontWeight:tab===t?700:400 }}>
          {label}
          {t==="notifs"&&unreadNotifCount>0&&<span style={{ background:"#f47244", color:"#fff", fontSize:7, padding:"1px 4px", lineHeight:1.4, borderRadius:2 }}>{unreadNotifCount}</span>}
        </button>
      ))}
    </div>
        {tab==="rice" && (
        <div>
          {rices.length===0 ? (
            <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", padding:"20px 0" }}>// no rice published yet</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(240px,1fr))", gap:mobile?8:12 }}>
              {rices.map((r,i)=>(
                <div key={r.id} className="card" style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:mobile?"10px":"14px", animation:`fadeUp .3s ease ${i*.06}s both`, cursor:r.status==="approved"?"pointer":"default" }}
                  onClick={()=>{ if(r.status==="approved") onSelectRice(normalizeRice(r)); }}
                >
                  {r.cover_url && <div style={{ marginBottom:8, marginLeft:mobile?-10:-14, marginRight:mobile?-10:-14, marginTop:mobile?-10:-14 }}><img src={r.cover_url} alt={r.title} style={{ width:"100%", height:80, objectFit:"cover", display:"block" }}/></div>}
                  <div className="ct" style={{ fontSize:mobile?11:12, color:C.white, marginBottom:3, transition:"color .15s", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                  <div style={{ fontSize:9, color:C.gray2, marginBottom:mobile?4:6 }}>{r.wm}{r.distro?` · ${r.distro}`:""}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontSize:9, color:r.status==="approved"?C.fn:C.string, fontStyle:"italic" }}>// {r.status}</div>
                    {!mobile && <DeleteRiceButton riceId={r.id} riceName={r.title} onDeleted={()=>setRices(prev=>prev.filter(x=>x.id!==r.id))}/>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div onClick={()=>onNav("upload")} style={{ border:`1px dashed ${C.border}`, marginTop:12, cursor:"pointer", padding:mobile?"16px":"24px", textAlign:"center", fontSize:11, fontFamily:C.mono, color:C.gray3 }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHi}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
          >+ upload new rice</div>
        </div>
      )}
        {tab==="liked" && (
        <div>
          {likedRices.length===0 ? (
            <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", padding:"20px 0" }}>// no liked rice yet</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(240px,1fr))", gap:mobile?8:12 }}>
              {likedRices.map((r,i)=>(
                <div key={r.id} className="card" style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:mobile?"10px":"14px", animation:`fadeUp .3s ease ${i*.06}s both`, cursor:"pointer" }}
                  onClick={()=>onSelectRice(normalizeRice(r))}
                >
                  {r.cover_url && <div style={{ marginBottom:8, marginLeft:mobile?-10:-14, marginRight:mobile?-10:-14, marginTop:mobile?-10:-14 }}><img src={r.cover_url} alt={r.title} style={{ width:"100%", height:80, objectFit:"cover", display:"block" }}/></div>}
                  <div className="ct" style={{ fontSize:mobile?11:12, color:C.white, marginBottom:3, transition:"color .15s", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                  <div style={{ fontSize:9, color:C.gray2, marginBottom:mobile?4:6 }}>{r.wm}{r.distro?` · ${r.distro}`:""}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:9, color:C.string }}>♥</span>
                    <span style={{ fontSize:9, color:C.gray3 }}>{r.likes||0} likes</span>
                    <span style={{ fontSize:9, color:C.gray3, marginLeft:"auto" }}>by @{r.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        {tab==="issues" && <IssuesTab rices={rices} mobile={mobile}/>}
        {tab==="notifs" && <NotificationsTab userId={user?.id} onRead={()=>{setUnreadNotifCount(0);if(onClearNotifs)onClearNotifs();}}/>}
        {tab==="settings" && <SettingsTab user={user} signOut={signOut}/>}
      </div>
    </div>
  );

  /* ── DESKTOP LAYOUT ────────────────────────────────────────── */
  return (
    <div style={{ padding:"28px 28px 32px", animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// user profile</div>

        {/* Header: name left, stats right */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:24, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.border}` }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ fontFamily:C.display, fontSize:"clamp(24px,4vw,36px)", fontWeight:800, color:C.white, letterSpacing:"-0.03em" }}>
                @{user.username || user.firstName}
              </span>
              {!isFounder && <span style={{ fontSize:9, border:`1px solid ${badgeColor}55`, color:badgeColor, padding:"2px 9px", fontFamily:C.mono }}>{badge}</span>}
              {isFounder && <FounderBadge/>}
            </div>
            <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, marginBottom:8 }}>
              <span style={{fontStyle:"italic"}}>// </span>member since {new Date(user.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {earnedBadges.map(b=><BadgeChip key={b.id} badge={b}/>)}
            </div>
          </div>
          <div style={{ display:"flex", gap:28, flexShrink:0 }}>
            {stats.map(s=>(
              <div key={s.l} style={{ textAlign:"right" }}>
                <div style={{ fontSize:28, fontWeight:700, color:C.white, fontFamily:C.mono, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:C.gray3, marginTop:3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

    <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:mobile?16:24 }}>
      {[["rice","rice"],["liked","liked"],["issues","issues"],["notifs","notifs"],["settings","settings"]].map(([t,label])=>(
        <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:mobile?"8px 14px":"9px 18px", background:"none", borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:tab===t?`2px solid ${C.fn}`:"2px solid transparent", color:tab===t?C.fn:C.gray2, cursor:"pointer", fontSize:mobile?10:12, fontFamily:C.mono, marginBottom:-1, display:"flex", alignItems:"center", gap:4, fontWeight:tab===t?700:400 }}>
          {label}
          {t==="notifs"&&unreadNotifCount>0&&<span style={{ background:"#f47244", color:"#fff", fontSize:7, padding:"1px 4px", lineHeight:1.4, borderRadius:2 }}>{unreadNotifCount}</span>}
        </button>
      ))}
    </div>
        {tab==="rice" && (
        <div>
          {rices.length===0 ? (
            <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", padding:"20px 0" }}>// no rice published yet</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(240px,1fr))", gap:mobile?8:12 }}>
              {rices.map((r,i)=>(
                <div key={r.id} className="card" style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:mobile?"10px":"14px", animation:`fadeUp .3s ease ${i*.06}s both`, cursor:r.status==="approved"?"pointer":"default" }}
                  onClick={()=>{ if(r.status==="approved") onSelectRice(normalizeRice(r)); }}
                >
                  {r.cover_url && <div style={{ marginBottom:8, marginLeft:mobile?-10:-14, marginRight:mobile?-10:-14, marginTop:mobile?-10:-14 }}><img src={r.cover_url} alt={r.title} style={{ width:"100%", height:80, objectFit:"cover", display:"block" }}/></div>}
                  <div className="ct" style={{ fontSize:mobile?11:12, color:C.white, marginBottom:3, transition:"color .15s", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                  <div style={{ fontSize:9, color:C.gray2, marginBottom:mobile?4:6 }}>{r.wm}{r.distro?` · ${r.distro}`:""}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontSize:9, color:r.status==="approved"?C.fn:C.string, fontStyle:"italic" }}>// {r.status}</div>
                    {!mobile && <DeleteRiceButton riceId={r.id} riceName={r.title} onDeleted={()=>setRices(prev=>prev.filter(x=>x.id!==r.id))}/>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div onClick={()=>onNav("upload")} style={{ border:`1px dashed ${C.border}`, marginTop:12, cursor:"pointer", padding:mobile?"16px":"24px", textAlign:"center", fontSize:11, fontFamily:C.mono, color:C.gray3 }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHi}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
          >+ upload new rice</div>
        </div>
      )}
        {tab==="liked" && (
        <div>
          {likedRices.length===0 ? (
            <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", padding:"20px 0" }}>// no liked rice yet</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(240px,1fr))", gap:mobile?8:12 }}>
              {likedRices.map((r,i)=>(
                <div key={r.id} className="card" style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:mobile?"10px":"14px", animation:`fadeUp .3s ease ${i*.06}s both`, cursor:"pointer" }}
                  onClick={()=>onSelectRice(normalizeRice(r))}
                >
                  {r.cover_url && <div style={{ marginBottom:8, marginLeft:mobile?-10:-14, marginRight:mobile?-10:-14, marginTop:mobile?-10:-14 }}><img src={r.cover_url} alt={r.title} style={{ width:"100%", height:80, objectFit:"cover", display:"block" }}/></div>}
                  <div className="ct" style={{ fontSize:mobile?11:12, color:C.white, marginBottom:3, transition:"color .15s", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                  <div style={{ fontSize:9, color:C.gray2, marginBottom:mobile?4:6 }}>{r.wm}{r.distro?` · ${r.distro}`:""}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:9, color:C.string }}>♥</span>
                    <span style={{ fontSize:9, color:C.gray3 }}>{r.likes||0} likes</span>
                    <span style={{ fontSize:9, color:C.gray3, marginLeft:"auto" }}>by @{r.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        {tab==="issues" && <IssuesTab rices={rices} mobile={mobile}/>}
        {tab==="notifs" && <NotificationsTab userId={user?.id} onRead={()=>{setUnreadNotifCount(0);if(onClearNotifs)onClearNotifs();}}/>}
        {tab==="settings" && <SettingsTab user={user} signOut={signOut}/>}
      </div>
    </div>
  );
}

/* ── ABOUT PAGE ──────────────────────────────────────────────────── */
function AboutPage({ onNav, onProfiles }) {
  const TEAM_BASE = [
    { role:"founder, UX/UI designer & dev", username:"marcolino",     isFounder:true },
    { role:"founder & creator",             username:"andrei",         isFounder:true },
  ];
  const [teamBios, setTeamBios] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const usernames = TEAM_BASE.map(m => m.username);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .in('username', usernames);
        console.log('[About] team fetch →', data, error);
        if (data && data.length > 0) {
          const map = {};
          data.forEach(u => { map[u.username] = u; });
          setTeamBios(map);
        } else if (data && data.length === 0) {
          // fallback: prova con ilike (case-insensitive)
          const results = await Promise.all(
            usernames.map(u => supabase.from('users').select('*').ilike('username', u).single())
          );
          const map = {};
          results.forEach(({ data: u }) => { if (u) map[u.username] = u; });
          console.log('[About] fallback ilike →', map);
          setTeamBios(map);
        }
      } catch(e) { console.error('[About] team bio fetch failed', e); }
    })();
  }, []);

  const TEAM = TEAM_BASE.map(m => ({
    ...m,
    name: '@' + m.username,
    bio: teamBios[m.username]?.bio ?? null,
  }));
  const VALUES = [
    { k:"community first", v:"product decisions come from the community. discord is where everything happens." },
    { k:"quality",         v:"every rice is reviewed before appearing in the gallery. we prefer fewer good rice over many mediocre ones." },
    { k:"simplicity",      v:"one command to install any setup. that's a promise we never want to break." },
  ];
  const TIMELINE = [
    { date:"jan 2026", text:"first idea — a bash script and a shared folder" },
    { date:"feb 2026", text:"first version of the gallery, 12 rice total" },
    { date:"mar 2026", text:"public launch v1.0.0 — early adopters open" },
    { date:"upcoming", text:"installer system, badges, theme marketplace" },
  ];

  const mobile = useMobile();
  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:820, margin:"0 auto", padding:mobile?"20px 16px 40px":"40px 40px 56px" }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:14, letterSpacing:"0.1em" }}>// about riceshare</div>
          <div style={{ fontFamily:C.display, fontSize:"clamp(32px,6vw,56px)", fontWeight:900, color:C.white, letterSpacing:"-0.04em", textTransform:"uppercase", lineHeight:1, marginBottom:20 }}>RICESHARE</div>
          <div style={{ width:40, height:2, background:C.kw, marginBottom:24 }}/>
          <div style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:2.1, maxWidth:520 }}>
            riceshare was born from the frustration of searching for dotfiles across reddit, discord and telegram. we wanted one clean place, done right, with an installer that actually works. so we built it.
          </div>
        </div>

        {/* ── Values ── */}
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20, letterSpacing:"0.1em" }}>// our values</div>
          <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)", gap:1, border:`1px solid ${C.border}` }}>
            {VALUES.map((v,i)=>(
              <div key={v.k} style={{ padding:"20px 22px", background:C.bgCard, borderRight:i<VALUES.length-1&&!mobile?`1px solid ${C.border}`:"none", animation:`fadeUp .3s ease ${i*.08}s both` }}>
                <div style={{ fontSize:10, color:C.kw, fontFamily:C.mono, fontWeight:500, marginBottom:10, letterSpacing:"0.05em", textTransform:"uppercase" }}>{v.k}</div>
                <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{v.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:24, letterSpacing:"0.1em" }}>// history</div>
          <div style={{ position:"relative", paddingLeft:20 }}>
            <div style={{ position:"absolute", left:0, top:6, bottom:6, width:1, background:`linear-gradient(to bottom, ${C.kw}, ${C.border})` }}/>
            {TIMELINE.map((t,i)=>(
              <div key={t.date} style={{ display:"flex", gap:20, marginBottom:i<TIMELINE.length-1?28:0, position:"relative", animation:`fadeUp .3s ease ${i*.07}s both` }}>
                <div style={{ position:"absolute", left:-24, top:5, width:8, height:8, borderRadius:"50%", background:t.date==="upcoming"?C.bgDeep:C.kw, border:`1px solid ${t.date==="upcoming"?C.string:C.kw}` }}/>
                <div style={{ width:72, flexShrink:0 }}>
                  <span style={{ fontSize:9, fontFamily:C.mono, color:t.date==="upcoming"?C.string:C.kw, fontStyle:t.date==="upcoming"?"italic":"normal", letterSpacing:"0.05em" }}>{t.date}</span>
                </div>
                <div style={{ fontSize:11, color:t.date==="upcoming"?C.gray3:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{t.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Team ── */}
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20, letterSpacing:"0.1em" }}>// the team</div>
          <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"repeat(2,1fr)", gap:12 }}>
            {TEAM.map((m,i)=>(
              <div key={m.name} style={{ border:`1px solid ${m.isFounder?C.gold+"55":C.border}`, background:m.isFounder?`${C.gold}06`:C.bgCard, padding:"20px 22px", animation:`fadeUp .3s ease ${i*.08}s both` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                  <span onClick={()=>onProfiles&&onProfiles(m.name.replace("@",""))} style={{ fontSize:13, color:C.fn, fontFamily:C.mono, fontWeight:600, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.fn+"44" }}>{m.name}</span>
                  {m.isFounder && <FounderBadge/>}
                </div>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, marginBottom:10, letterSpacing:"0.04em" }}>{m.role}</div>
                {m.bio
                  ? <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{m.bio}</div>
                  : <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, lineHeight:1.9, fontStyle:"italic" }}>no bio yet.</div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Join us ── */}
        <div style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:mobile?"22px 20px":"32px 36px", display:"flex", flexDirection:mobile?"column":"row", alignItems:mobile?"flex-start":"center", justifyContent:"space-between", gap:20 }}>
          <div>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:10, letterSpacing:"0.1em" }}>// join us</div>
            <div style={{ fontSize:mobile?12:13, color:C.white, fontFamily:C.mono, lineHeight:1.9 }}>
              riceshare is community driven.<br/>
              <span style={{ color:C.gray3 }}>// </span><span style={{ color:C.gray2 }}>join Discord, share feedback, or simply upload your rice.</span>
            </div>
          </div>
          <div style={{ flexShrink:0 }}>
            <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
              <button className="bs" style={{ padding:"10px 28px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s", whiteSpace:"nowrap" }}>Discord →</button>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── FOOTER ──────────────────────────────────────────────────────── */
function Footer({ setPage }) {
  const Link = ({ label, href, page }) => (
    page ? (
      <span onClick={()=>setPage(page)} style={{ color:C.gray2, textDecoration:"none", cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"color .15s" }}
        onMouseEnter={e=>e.currentTarget.style.color=C.white}
        onMouseLeave={e=>e.currentTarget.style.color=C.gray2}
      >{label}</span>
    ) : (
      <a href={href} target="_blank" rel="noreferrer" style={{ color:C.gray2, textDecoration:"none", fontSize:10, fontFamily:C.mono, transition:"color .15s" }}
        onMouseEnter={e=>e.currentTarget.style.color=C.white}
        onMouseLeave={e=>e.currentTarget.style.color=C.gray2}
      >{label}</a>
    )
  );

  return (
    <footer style={{ borderTop:`1px solid ${C.border}`, background:C.bgDeep, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"stretch", minHeight:52 }}>
        <div className="rs-hide-mobile" style={{ width:GUTTER, flexShrink:0, background:C.gutter, borderRight:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:14 }}>
          <span style={{ fontSize:10, color:C.lineNum, fontFamily:C.mono, userSelect:"none", fontStyle:"italic" }}>eof</span>
        </div>
        <div style={{ flex:1, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ fontFamily:C.display, fontSize:13, fontWeight:800, color:C.white, letterSpacing:"-0.02em", textTransform:"uppercase" }}>Riceshare</span>
            <span style={{ fontSize:10, fontFamily:C.mono, color:C.gray3 }}>v1.0.0</span>

          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <Link label="docs"      page="docs"/>
            <Link label="leaderboard" page="leaderboard"/>
            <Link label="leaderboard" page="leaderboard"/>
            <Link label="discord"   href="https://discord.gg/riceshare"/>
            <Link label="instagram" href="#" />
            <span style={{ width:1, height:12, background:C.border }}/>
            <Link label="terms"     page="terms"/>
            <Link label="privacy"   page="privacy"/>
          </div>
          <span style={{ fontSize:10, fontFamily:C.mono, color:C.gray3 }}>© 2026 riceshare</span>
        </div>
      </div>
    </footer>
  );
}

/* ── UPLOAD SIDEBAR ─────────────────────────────────────────────── */
function UploadSidebar({ step, rice, installCmd }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(installCmd).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const pct = Math.round((step/5)*100);
  const TRENDING = [
    { title:"catppuccin-mocha", author:"velvet_void", installs:"2.3k", wm:"hyprland" },
    { title:"tokyo-night",      author:"neonpulse",   installs:"3.1k", wm:"sway"     },
    { title:"rose-pine",        author:"petal_arch",  installs:"2.7k", wm:"hyprland" },
    { title:"nord-minimal",     author:"arctic_fox",  installs:"1.2k", wm:"bspwm"    },
  ];

  return (
    <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep }}>
        <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em", display:"flex", justifyContent:"space-between" }}>
          <span>// progress</span>
          <span style={{ color:pct===100?C.fn:C.gray3 }}>{pct}%</span>
        </div>
        <div style={{ padding:"14px" }}>
          <div style={{ height:2, background:C.border, marginBottom:14, position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:pct+"%", background:pct===100?C.fn:C.kw, transition:"width .4s ease" }}/>
          </div>
          {["info","system","images","components","dependencies","files"].map((s,i)=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:14, height:14, borderRadius:2, flexShrink:0, border:`1px solid ${i<step?C.fn:i===step?C.kw:C.gray3}`, background:i<step?C.fn+"22":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {i<step&&<span style={{fontSize:8,color:C.fn}}>✓</span>}
                {i===step&&<span style={{fontSize:7,color:C.kw}}>●</span>}
              </div>
              <span style={{ fontSize:11, fontFamily:C.mono, color:i<step?C.fn:i===step?C.white:C.gray3 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${rice.name?C.borderHi:C.border}`, background:C.bgDeep, transition:"border-color .3s" }}>
        <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// generated command</div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:rice.wm?12:0 }}>
            <span style={{ color:C.gray3, fontSize:12, flexShrink:0 }}>$</span>
            <code style={{ fontSize:10, fontFamily:C.mono, color:rice.name?C.gray1:C.gray3, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0, transition:"color .3s", fontStyle:rice.name?"normal":"italic" }}>{installCmd}</code>
            {rice.name && <button onClick={copy} className="bs" style={{ padding:"3px 10px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:9, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>{copied?"✓":"copy"}</button>}
          </div>
          {rice.wm && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:9, color:C.kw, border:`1px solid ${C.kw}44`, padding:"1px 7px" }}>{rice.wm}</span>
              {rice.distros.slice(0,2).map(d=><span key={d} style={{ fontSize:9, color:C.gray2, border:`1px solid ${C.border}`, padding:"1px 7px" }}>{d}</span>)}
              {rice.shell&&<span style={{ fontSize:9, color:C.gray2, border:`1px solid ${C.border}`, padding:"1px 7px" }}>{rice.shell}</span>}
              {rice.deps.length>0&&<span style={{ fontSize:9, color:C.fn, border:`1px solid ${C.fn}33`, padding:"1px 7px" }}>{rice.deps.length} pkg</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, flex:1 }}>
        <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// trending this week</div>
        <div>
          {TRENDING.map((r,i)=>(
            <div key={r.title} style={{ padding:"10px 14px", borderBottom:i<TRENDING.length-1?`1px solid ${C.border}`:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:C.white, marginBottom:3 }}>
                  <span style={{ color:C.fn, fontFamily:C.mono }}>{r.author}</span>
                  <span style={{ color:C.gray3 }}>/</span>
                  <span style={{ fontFamily:C.mono }}>{r.title}</span>
                </div>
                <span style={{ fontSize:9, color:C.kw, border:`1px solid ${C.kw}33`, padding:"1px 6px", fontFamily:C.mono }}>{r.wm}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, color:C.white, fontFamily:C.mono, fontWeight:500 }}>{r.installs}</div>
                <div style={{ fontSize:9, color:C.gray3 }}>installs</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── UPLOAD PAGE ─────────────────────────────────────────────────── */
const WMS       = ["hyprland","sway","i3wm","bspwm","dwm","openbox","river","niri","gnome","kde","xfce"];
const DISTROS   = ["arch","endeavouros","manjaro","debian","ubuntu","fedora","nixos","void","gentoo"];
const TERMINALS = ["kitty","alacritty","wezterm","foot","xterm","gnome-terminal"];
const SHELLS    = ["zsh","fish","bash","nushell"];
const DEPS_SUG  = ["hyprland","waybar","rofi","wofi","dunst","kitty","alacritty","swww","hyprpaper","nerd-fonts","neovim","tmux","fzf","starship","zoxide","eza","bat"];

function Chip({ label, active, color, onClick }) {
  return <button onClick={onClick} style={{ padding:"3px 12px", fontSize:11, fontFamily:C.mono, cursor:"pointer", border:"1px solid", borderColor:active?(color||C.white):C.border, background:active?(color?color+"18":"#ffffff10"):"transparent", color:active?(color||C.white):C.gray2, transition:"all .15s", borderRadius:2 }}>{label}</button>;
}
function SToggle({ label, checked, onChange }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
      <div onClick={()=>onChange(!checked)} style={{ width:32, height:18, borderRadius:9, position:"relative", background:checked?C.fn:C.gray3, transition:"background .2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left:checked?17:3, width:12, height:12, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
      </div>
      <span style={{ fontSize:12, color:C.gray2 }}>{label}</span>
    </label>
  );
}

function UploadPage({ trustLevel=1, userBadge='member', onGoHome }) {
  const { user } = useUser();
  const mobile = useMobile();
  const [step, setStep]   = useState(0);
  const [rice, setRice]   = useState({ name:"", description:"", wm:"", distros:[], terminal:"", shell:"", deps:[], images:[], imageUrls:[], coverIndex:-1, sampledDots:null, tags:[], components:{ waybar:false, rofi:false, dunst:false, wallpaper:true, fonts:true, neovim:false } });
  const [tagInput, setTagInput] = useState("");
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [imgDragging, setImgDragging] = useState(false);
  const imgRef = useRef(null);

  // ── Campiona i 4 colori dominanti da un File immagine ──────────────
  const sampleColors = (imgFile) => new Promise(resolve => {
    const url = URL.createObjectURL(imgFile);
    const img = new Image();
    img.onload = () => {
      const SIZE = 80; // riduce per velocità
      const canvas = document.createElement("canvas");
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
      // Bucket i pixel in 6 livelli per canale → quantizzazione
      const buckets = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i]   / 43) * 43;
        const g = Math.round(data[i+1] / 43) * 43;
        const b = Math.round(data[i+2] / 43) * 43;
        // Scarta pixel troppo scuri o troppo grigi
        const lum = 0.299*r + 0.587*g + 0.114*b;
        const sat = Math.max(r,g,b) - Math.min(r,g,b);
        if (lum < 20 || sat < 30) continue;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const sorted = Object.entries(buckets).sort((a,b)=>b[1]-a[1]);
      // Prendi i 4 più frequenti sufficientemente diversi tra loro
      const chosen = [];
      for (const [key] of sorted) {
        if (chosen.length >= 4) break;
        const [r,g,b] = key.split(",").map(Number);
        // Controlla che sia abbastanza diverso dai già scelti (distanza euclidea)
        const tooClose = chosen.some(([cr,cg,cb]) =>
          Math.sqrt((r-cr)**2+(g-cg)**2+(b-cb)**2) < 60
        );
        if (!tooClose) chosen.push([r,g,b]);
      }
      if (chosen.length === 0) { resolve(null); return; }
      // Pad se meno di 4
      while (chosen.length < 4) chosen.push(chosen[chosen.length-1]);
      const toHex = ([r,g,b]) => "#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
      resolve(chosen.map(toHex));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

  // Converte qualsiasi immagine in WebP scalata a max 720p (quality 0.82)
  const toWebP = (file) => new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1280; // 720p landscape
      const MAX_H = 720;
      let { width: w, height: h } = img;
      // Scala mantenendo aspect ratio entro 1280x720
      const scaleW = w > MAX_W ? MAX_W / w : 1;
      const scaleH = h > MAX_H ? MAX_H / h : 1;
      const scale = Math.min(scaleW, scaleH);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        resolve(new File([blob], name, { type:"image/webp" }));
      }, "image/webp", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

  // Aggiunge images, converte in WebP e campiona colori dalla prima
  const addImagesAndSample = async (newImgs) => {
    // Converti tutto in WebP prima di aggiungere
    const converted = await Promise.all(Array.from(newImgs).map(toWebP));
    const all = [...rice.images, ...converted];
    set("images", all);
    // Campiona dalla prima immagine disponibile (cover o prima della lista)
    const target = all[rice.coverIndex >= 0 ? rice.coverIndex : 0];
    if (target) {
      const colors = await sampleColors(target);
      if (colors) set("sampledDots", colors);
    }
  };
  const [depInput, setDepInput] = useState("");
  const [filess, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [done, setDone]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubError, setPubError]     = useState(null);
  const filesRef = useRef(null);

  const set  = (k,v) => setRice(r=>({...r,[k]:v}));
  const setC = (k,v) => setRice(r=>({...r,components:{...r.components,[k]:v}}));
  const addDep   = d => { if(d&&!rice.deps.includes(d)) set("deps",[...rice.deps,d]); setDepInput(""); };
  const remDep   = d => set("deps",rice.deps.filter(x=>x!==d));
  const addFiles = inc => { const arr=Array.from(inc); setFiles(prev=>{ const n=new Set(prev.map(f=>f.name)); return [...prev,...arr.filter(f=>!n.has(f.name))]; }); };
  const remFile  = n => setFiles(f=>f.filter(x=>x.name!==n));
  const fmtSize  = b => b<1024?b+" B":b<1048576?(b/1024).toFixed(1)+" KB":(b/1048576).toFixed(1)+" MB";
  const filesTag  = name => {
    if(/\.(png|jpg|jpeg|webp)$/i.test(name)) return {l:"img",c:C.string};
    if(/\.(ttf|otf|woff2?)$/i.test(name))    return {l:"fnt",c:C.kw};
    if(/\.(conf|toml|yaml|lua|sh|zsh|fish|json|ini)$/i.test(name)) return {l:"cfg",c:C.fn};
    return {l:"bin",c:C.gray2};
  };

  const makeSlug = () =>
    `${user?.username||user?.id||"user"}-${rice.name}`
      .toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,80);

  const installCmd = rice.name
    ? `curl -fsSL rice-share.vercel.app/install/${user?.username||"user"}/${makeSlug()} | bash`
    : "// fill the form to generate the command";

  const STEPS   = ["info","system","images","components","dependencies","files"];
  const canNext = [
    !!rice.name && (rice.description.length===0||(rice.description.length>=50&&rice.description.length<=500)),
    !!rice.wm, true, true, true, filess.length>0,
  ][step];

  const labelStyle = { fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8, display:"block" };
  const inputStyle = { width:"100%", background:C.bgDeep, border:`1px solid ${C.border}`, color:C.white, padding:"8px 12px", fontSize:12, fontFamily:C.mono, outline:"none", transition:"border-color .15s" };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);
    setPubError(null);
    try {
      const { supabase } = await import('../lib/supabase');

      // Upload images su Storage e raccogli URL pubblici
      const uploadedImageUrls = [...rice.imageUrls]; // parte dagli URL già inseriti
      for (const img of rice.images) {
        const path = `${user.id}/${makeSlug()}/images/${img.name}`;
        const { error: imgErr } = await supabase.storage
          .from('rice-files')
          .upload(path, img, { upsert:true });
        if (!imgErr) {
          const { data: pub } = supabase.storage.from('rice-files').getPublicUrl(path);
          if (pub?.publicUrl) uploadedImageUrls.push(pub.publicUrl);
        } else {
          console.warn('Image upload skip:', imgErr.message);
        }
      }
      // Risolvi cover_url dall'indice selezionato (unificato: prima files locali, poi URL)
      const allUrls = [...uploadedImageUrls]; // dopo upload, tutti gli URL sono in uploadedImageUrls
      const cover_url = rice.coverIndex >= 0 && rice.coverIndex < allUrls.length
        ? allUrls[rice.coverIndex]
        : (allUrls[0] || null); // fallback alla prima immagine se nessuna stellina

      // Upload dotfiles su Storage (richiede bucket "rice-filess" in Supabase)
      for (const files of filess) {
        const { error: upErr } = await supabase.storage
          .from('rice-files')
          .upload(`${user.id}/${makeSlug()}/${files.name}`, files, { upsert:true });
        if (upErr) console.warn('Storage skip:', upErr.message);
      }

      // Inserisci rice nel database
      // author_id = user.id (Clerk) — author viene risolto via join in lettura
      const { error } = await supabase.from('rice').insert({
        slug:        makeSlug(),
        author_id:   user.id,
        title:       rice.name,
        description: rice.description,
        wm:          rice.wm,
        distro:      rice.distros?.[0] || '',
        terminal:    rice.terminal,
        shell:       rice.shell,
        deps:        rice.deps,             // text[] — array nativo Supabase
        tags:        rice.tags,           // text[] — tag del rice
        images:      uploadedImageUrls,      // text[] — URL images (upload + URL esterni)
        cover_url:   cover_url,              // text  — URL immagine di copertina
        dots:        rice.sampledDots || [], // text[] — colori campionati dall'immagine
        likes:       0,
        installs:    0,
        featured:    false,
        status:      (trustLevel === null || (trustLevel <= 1 && userBadge !== 'founder')) ? 'pending' : 'approved',
      });
      if (error) {
        throw new Error(error.message || error.details || error.hint || JSON.stringify(error));
      }

      // Auto-compute badges after upload
      try {
        const [{ data: allMyRices }, { data: userData }] = await Promise.all([
          supabase.from('rice').select('*, users(username)').eq('author_id', user.id),
          supabase.from('users').select('created_at').eq('id', user.id).single(),
        ]);
    await computeBadges(user.id, allMyRices || [], userData?.created_at, supabase);
      } catch(e) { /* non-blocking */ }

    } catch(e) {
      console.error("publish error:", e.message, e);
      setPubError(e.message || "Errore durante la pubblicazione");
      setPublishing(false);
      return;
    }
    setPublishing(false);
    setDone(true);
  };

  const resetForm = () => {
    setDone(false); setStep(0); setPubError(null);
    setRice({ name:"", description:"", wm:"", distros:[], terminal:"", shell:"", deps:[], images:[], imageUrls:[], coverIndex:-1, sampledDots:null, tags:[], components:{ waybar:false, rofi:false, dunst:false, wallpaper:true, fonts:true, neovim:false } }); setImgUrlInput(""); setTagInput("");
    setFiles([]);
  };

  if (done) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px", animation:"fadeIn .4s ease" }}>
      <div style={{ maxWidth:480, width:"100%", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:0 }}>

        {/* Spunta verde animata */}
        <div style={{ marginBottom:28 }}>
          <div style={{
            width:72, height:72, borderRadius:"50%",
            border:`2px solid ${C.fn}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:C.fn+"12",
            animation:"fadeIn .5s ease",
          }}>
            <span style={{ fontSize:32, color:C.fn, lineHeight:1 }}>✓</span>
          </div>
        </div>

        {/* Titolo */}
        <div style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,34px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", marginBottom:6 }}>
          rice published
        </div>
        <div style={{ fontSize:13, color:C.fn, fontFamily:C.mono, marginBottom:28 }}>
          // {rice.name}
        </div>

        {/* Comando install */}
        <div style={{ width:"100%", border:`1px solid ${C.border}`, background:C.bgDeep, marginBottom:trustLevel!==null&&trustLevel<=1&&userBadge!=='founder'?16:28 }}>
          <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, textAlign:"left", letterSpacing:"0.08em" }}>install command</div>
          <div style={{ padding:"12px 16px", display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ color:C.gray3, flexShrink:0 }}>$</span>
            <code style={{ fontFamily:C.mono, fontSize:11, color:C.gray1, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"left" }}>{installCmd}</code>
          </div>
        </div>

        {/* Avviso revisione */}
        {trustLevel!==null && trustLevel<=1 && userBadge!=='founder' && (
          <div style={{ width:"100%", padding:"10px 14px", border:`1px solid ${C.string}44`, background:`${C.string}08`, fontSize:11, fontFamily:C.mono, color:C.string, marginBottom:28, textAlign:"left", lineHeight:1.8 }}>
            <span style={{fontStyle:"italic"}}>// </span>il rice è in attesa di revisione — apparirà in gallery dopo l'approvazione.
          </div>
        )}

        {/* Bottoni */}
        <div style={{ display:"flex", gap:10, width:"100%" }}>
          <button
            onClick={onGoHome}
            className="bs"
            style={{ flex:1, padding:"11px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s", fontWeight:500 }}
          >view in gallery →</button>
          <button
            onClick={resetForm}
            className="bg"
            style={{ flex:1, padding:"11px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}
          >upload another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ animation:"fadeIn .2s ease", padding:mobile?"16px 16px 32px":"32px 32px 48px" }}>
      {trustLevel !== null && trustLevel <= 1 && userBadge !== 'founder' && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 16px", border:`1px solid ${C.string}44`, background:`${C.string}08`, marginBottom:16, fontSize:11, fontFamily:C.mono, color:C.string }}>
          <span style={{ fontSize:9, border:`1px solid ${C.string}55`, padding:"1px 7px", flexShrink:0 }}>member</span>
          <span style={{ color:C.gray2 }}><span style={{fontStyle:"italic",color:C.gray3}}>// </span>your rice will be reviewed before appearing in gallery — <span style={{color:C.string}}>trusted</span> level requires 1 approved rice</span>
        </div>
      )}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
        <div style={{ width:"100%", maxWidth:600, padding:"0" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// upload your rice</div>
            <div style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.02em", marginBottom:16 }}>New rice</div>
            <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.border}` }}>
              {STEPS.map((s,i)=>(
                <button key={s} onClick={()=>i<=step&&setStep(i)} style={{ padding:"8px 16px", background:"none", border:"none", borderBottom:i===step?`1px solid ${C.white}`:"1px solid transparent", color:i===step?C.white:i<step?C.fn:C.gray3, cursor:i<=step?"pointer":"default", fontSize:11, fontFamily:C.mono, marginBottom:-1, transition:"color .15s" }}>
                  <span style={{ color:i<step?C.fn:C.gray3, marginRight:6 }}>{i<step?"✓":String(i+1).padStart(2,"0")}</span>{s}
                </button>
              ))}
            </div>
          </div>

          {step===0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .2s ease" }}>
              <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// basic info</div>
              <div>
                <span style={labelStyle}>RICE NAME *</span>
                <input value={rice.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. catppuccin-mocha-hypr" style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}/>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginTop:4, lineHeight:1.7 }}>
                  <span style={{color:"#242424"}}>// </span>Use a descriptive and unique name—it will be used in the installation URL. Recommended: tema-wm (es. catppuccin-hypr, nord-i3).
                </div>
              </div>
              <div>
                <span style={labelStyle}>DESCRIPTION</span>
                <textarea value={rice.description} onChange={e=>set("description",e.target.value.slice(0,500))} placeholder="briefly describe your rice..."
                  style={{...inputStyle,resize:"none",height:96,lineHeight:1.7}}
                  onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}/>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:10, fontFamily:C.mono }}>
                  <span style={{ color:rice.description.length>0&&rice.description.length<50?C.string:C.gray3 }}>
                    {rice.description.length>0&&rice.description.length<50?`// minimum 50 characters (${50-rice.description.length} missing)`:rice.description.length>=50?<span style={{color:C.fn}}>// ok</span>:"// min 50 · max 500 characters"}
                  </span>
                  <span style={{ color:rice.description.length>=450?C.string:C.gray3 }}>{rice.description.length}/500</span>
                </div>
              </div>
              {/* Tag */}
              <div>
                <span style={labelStyle}>TAGS</span>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                  <span style={{color:"#242424"}}>// </span>Tags help users find your rice in search. Press enter or space to add. Max 10.
                </div>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input
                    value={tagInput}
                    onChange={e=>setTagInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,24))}
                    onKeyDown={e=>{
                      if((e.key==="Enter"||e.key===" ")&&tagInput.trim()&&!rice.tags.includes(tagInput.trim())&&rice.tags.length<10){
                        set("tags",[...rice.tags,tagInput.trim()]); setTagInput("");
                      }
                    }}
                    placeholder="e.g. catppuccin, minimal, paradise..."
                    style={{...inputStyle,flex:1}}
                    onFocus={e=>e.target.style.borderColor=C.white}
                    onBlur={e=>e.target.style.borderColor=C.border}
                  />
                  <button
                    onClick={()=>{ if(tagInput.trim()&&!rice.tags.includes(tagInput.trim())&&rice.tags.length<10){ set("tags",[...rice.tags,tagInput.trim()]); setTagInput(""); } }}
                    className="bs" style={{ padding:"8px 14px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:11, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>+ add</button>
                </div>
                {/* Suggeriti */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  {["catppuccin","gruvbox","nord","tokyo-night","dracula","rose-pine","paradise","minimal","dark","colorful","pastel","monochrome","neon","retro","clean"].filter(t=>!rice.tags.includes(t)).map(t=>(
                    <button key={t} onClick={()=>{ if(rice.tags.length<10) set("tags",[...rice.tags,t]); }}
                      style={{ padding:"2px 10px", fontSize:10, fontFamily:C.mono, cursor:"pointer", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, transition:"all .15s", borderRadius:2 }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.kw; e.currentTarget.style.color=C.kw; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.gray3; }}
                    >{t}</button>
                  ))}
                </div>
                {/* Tag selezionati */}
                {rice.tags.length>0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                    {rice.tags.map(t=>(
                      <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 10px", fontSize:11, fontFamily:C.mono, border:`1px solid ${C.kw}55`, background:C.kw+"14", color:C.kw }}>
                        #{t}
                        <button onClick={()=>set("tags",rice.tags.filter(x=>x!==t))} style={{ background:"none", border:"none", color:C.kw, cursor:"pointer", fontSize:12, lineHeight:1, padding:0, opacity:.6 }}>×</button>
                      </span>
                    ))}
                    <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>{rice.tags.length}/10</span>
                  </div>
                )}
              </div>

              {rice.name && (
                <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep }}>
                  <div style={{ padding:"5px 12px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3 }}>command preview</div>
                  <div style={{ padding:"10px 12px", display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ color:C.gray3, fontSize:11 }}>$</span>
                    <code style={{ fontSize:10, fontFamily:C.mono, color:C.gray1 }}>{installCmd}</code>
                  </div>
                </div>
              )}
            </div>
          )}

          {step===1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeIn .2s ease" }}>
              <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// target system</div>
              <div>
                <span style={labelStyle}>WINDOW MANAGER / DE *</span>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                  <span style={{color:"#242424"}}>// </span>the WM for which the rice is optimized. required field — defines the category in the gallery.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{WMS.map(w=><Chip key={w} label={w} active={rice.wm===w} onClick={()=>set("wm",w)}/>)}</div>
              </div>
              <div>
                <span style={labelStyle}>COMPATIBLE DISTROS</span>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                  <span style={{color:"#242424"}}>// </span>Select all the distros you've tested Rice on. This helps users determine if it will work on their system.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{DISTROS.map(d=><Chip key={d} label={d} active={rice.distros.includes(d)} onClick={()=>set("distros",rice.distros.includes(d)?rice.distros.filter(x=>x!==d):[...rice.distros,d])}/>)}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:12 }}>
                <div>
                  <span style={labelStyle}>TERMINAL</span>
                  <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                    <span style={{color:"#242424"}}>// </span>the terminal included in your config.
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{TERMINALS.map(t=><Chip key={t} label={t} active={rice.terminal===t} onClick={()=>set("terminal",t)}/>)}</div>
                </div>
                <div>
                  <span style={labelStyle}>SHELL</span>
                  <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                    <span style={{color:"#242424"}}>// </span>the shell used in dotfiles (zshrc, config.fish, ecc.).
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{SHELLS.map(s=><Chip key={s} label={s} active={rice.shell===s} onClick={()=>set("shell",s)}/>)}</div>
                </div>
              </div>
            </div>
          )}

          {step===2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .2s ease" }}>
              <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// screenshots and images</div>
              <div style={{ padding:"10px 14px", border:`1px solid ${C.border}`, background:C.bgDeep, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.9 }}>
                <div style={{marginBottom:4}}><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>upload at least one screenshot of your desktop — it's the first thing users will see.</div>
                <div><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>the <span style={{color:C.string}}>★ cover</span> It will appear as a preview in the gallery. The palette colors are automatically extracted from the image.</div>
              </div>

              {/* Upload diretto */}
              <div>
                <span style={labelStyle}>UPLOAD IMAGES</span>
                <div onDragOver={e=>{e.preventDefault();setImgDragging(true);}} onDragLeave={()=>setImgDragging(false)}
                  onDrop={e=>{
                    e.preventDefault(); setImgDragging(false);
                    const imgs = Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));
                    addImagesAndSample(imgs);
                  }}
                  onClick={()=>imgRef.current?.click()}
                  style={{ border:`1px dashed ${imgDragging?C.white:C.border}`, padding:"24px", textAlign:"center", cursor:"pointer", background:imgDragging?"#ffffff06":"transparent", transition:"all .2s" }}>
                  <div style={{ fontSize:18, color:C.gray3, marginBottom:8 }}>+</div>
                  <p style={{ fontSize:11, color:C.gray2, fontFamily:C.mono }}>drag screenshots here, or <span style={{color:C.white}}>browse</span></p>
                  <p style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, marginTop:4 }}>.png .jpg .jpeg .webp → converted to .webp automatically</p>
                  <input ref={imgRef} type="file" multiple accept="image/*" style={{ display:"none" }}
                    onChange={e=>{ const imgs=Array.from(e.target.files).filter(f=>f.type.startsWith('image/')); addImagesAndSample(imgs); e.target.value=''; }}/>
                </div>
              </div>

              {/* URL esterni */}
              <div>
                <span style={labelStyle}>OR PASTE URL</span>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                  <span style={{color:"#242424"}}>// </span>You can use direct links from imgur, catbox.moe, i.redd.it, or any image host. Make sure the link ends in .png, .jpg, or .webp.
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={imgUrlInput} onChange={e=>setImgUrlInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"&&imgUrlInput.trim()){ set("imageUrls",[...rice.imageUrls,imgUrlInput.trim()]); setImgUrlInput(""); } }}
                    placeholder="https://i.imgur.com/..."
                    style={{...inputStyle,flex:1}}
                    onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}/>
                  <button onClick={()=>{ if(imgUrlInput.trim()){ set("imageUrls",[...rice.imageUrls,imgUrlInput.trim()]); setImgUrlInput(""); } }}
                    className="bs" style={{ padding:"8px 14px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:11, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>+ add</button>
                </div>
              </div>

              {/* Preview unificata — files locali + URL con selezione copertina */}
              {(rice.images.length > 0 || rice.imageUrls.length > 0) && (() => {
                // Lista unificata: prima i files locali, poi gli URL
                const allItems = [
                  ...rice.images.map((f,i)=>({ type:"files", idx:i, src:URL.createObjectURL(f), label:f.name })),
                  ...rice.imageUrls.map((u,i)=>({ type:"url", idx:i, src:u, label:u.split("/").pop()||u })),
                ];
                // coverIndex si riferisce all'array unificato allItems
                return (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <span style={labelStyle}>IMAGES — {allItems.length}</span>
                      <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// ★ = card cover image</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                      {allItems.map((item, globalIdx)=>{
                        const isCover = rice.coverIndex === globalIdx;
                        return (
                          <div key={globalIdx} style={{ position:"relative", border:`1px solid ${isCover?C.string:C.border}`, overflow:"hidden", transition:"border-color .15s" }}>
                            <img src={item.src} alt="" style={{ width:"100%", height:90, objectFit:"cover", display:"block" }}
                              onError={e=>{ e.currentTarget.style.opacity="0.2"; }}/>

                            {/* Stellina copertina */}
                            <button
                              title="set as cover"
                              onClick={async ()=>{
                const newIdx = isCover ? -1 : globalIdx;
                set("coverIndex", newIdx);
                // Ricampiona colori dalla nuova copertina se è un files locale
                if (newIdx >= 0 && newIdx < rice.images.length) {
                  const colors = await sampleColors(rice.images[newIdx]);
                  if (colors) set("sampledDots", colors);
                }
              }}
                              style={{ position:"absolute", top:4, left:4, background: isCover?"rgba(180,100,0,0.85)":"rgba(0,0,0,0.6)", border:"none", color: isCover?C.string:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:13, lineHeight:1, padding:"2px 5px", transition:"all .15s" }}
                              onMouseEnter={e=>{ if(!isCover){e.currentTarget.style.color=C.string; e.currentTarget.style.background="rgba(0,0,0,0.85)";} }}
                              onMouseLeave={e=>{ if(!isCover){e.currentTarget.style.color="rgba(255,255,255,0.5)"; e.currentTarget.style.background="rgba(0,0,0,0.6)";} }}
                            >★</button>

                            {/* Elimina */}
                            <button
                              onClick={()=>{
                                if(item.type==="files"){
                                  const newImgs = rice.images.filter((_,j)=>j!==item.idx);
                                  set("images", newImgs);
                                } else {
                                  const newUrls = rice.imageUrls.filter((_,j)=>j!==item.idx);
                                  set("imageUrls", newUrls);
                                }
                                // Reset cover se era questa
                                if(isCover) set("coverIndex",-1);
                                else if(rice.coverIndex > globalIdx) set("coverIndex", rice.coverIndex-1);
                              }}
                              style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.7)", border:"none", color:C.white, cursor:"pointer", fontSize:13, lineHeight:1, padding:"2px 6px" }}>×</button>

                            {/* Label + badge copertina */}
                            <div style={{ padding:"4px 6px", fontSize:9, fontFamily:C.mono, color: isCover?C.string:C.gray2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", background: isCover?"rgba(180,100,0,0.12)":"transparent", transition:"all .15s" }}>
                              {isCover ? "★ cover" : item.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {rice.images.length===0 && rice.imageUrls.length===0 && (
                <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// skip — images are not required</div>
              )}

              {/* Preview palette campionata */}
              {rice.sampledDots && (
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", border:`1px solid ${C.border}`, background:C.bgDeep, animation:"fadeIn .3s ease" }}>
                  <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", flexShrink:0 }}>// sampled palette</span>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {rice.sampledDots.map((c,i)=>(
                      <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                        <div style={{ width:22, height:22, background:c, borderRadius:2, border:`1px solid rgba(255,255,255,0.08)` }}/>
                        <span style={{ fontSize:8, fontFamily:C.mono, color:C.gray3 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>set("sampledDots",null)} style={{ marginLeft:"auto", background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:11, fontFamily:C.mono, padding:0 }}>✕ reset</button>
                </div>
              )}
            </div>
          )}

          {step===3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeIn .2s ease" }}>
              <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// components included in this rice</div>
              <div style={{ padding:"10px 14px", border:`1px solid ${C.border}`, background:C.bgDeep, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.9, marginBottom:4 }}>
                <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>Indicates which components are included in your rice. This information helps users understand what they will be installing before proceeding.
              </div>
              {Object.entries({ waybar:"Waybar — status bar", rofi:"Rofi / Wofi — launcher", dunst:"Dunst — notifications", wallpaper:"Wallpaper", fonts:"Custom fonts", neovim:"Neovim config" }).map(([k,label])=>(
                <SToggle key={k} label={label} checked={rice.components[k]} onChange={v=>setC(k,v)}/>
              ))}
            </div>
          )}

          {step===4 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .2s ease" }}>
              <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// dependencies to install</div>
              <div style={{ padding:"10px 14px", border:`1px solid ${C.border}`, background:C.bgDeep, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.9, marginBottom:4 }}>
                <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>List of packages that the installation script will automatically install. Use the exact names from the package manager. (es. <span style={{color:C.fn}}>hyprland</span>, <span style={{color:C.fn}}>waybar</span>, <span style={{color:C.fn}}>nerd-fonts</span>).
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={depInput} onChange={e=>setDepInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDep(depInput.trim())} placeholder="package name..."
                  style={{...inputStyle,flex:1}} onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}/>
                <button onClick={()=>addDep(depInput.trim())} className="bs" style={{ padding:"8px 16px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:11, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>+ add</button>
              </div>
              <div><span style={labelStyle}>SUGGESTED</span><div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{DEPS_SUG.filter(d=>!rice.deps.includes(d)).map(d=><Chip key={d} label={d} active={false} onClick={()=>addDep(d)}/>)}</div></div>
              {rice.deps.length>0 && (
                <div>
                  <span style={labelStyle}>SELECTED — {rice.deps.length} packages</span>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {rice.deps.map(d=><button key={d} onClick={()=>remDep(d)} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 10px", fontSize:11, fontFamily:C.mono, cursor:"pointer", border:`1px solid ${C.fn}44`, background:C.fn+"10", color:C.fn, transition:"all .15s" }}>{d} <span style={{opacity:.5}}>×</span></button>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {step===5 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .2s ease" }}>
              <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// upload rice filess</div>
              <div style={{ padding:"10px 14px", border:`1px solid ${C.border}`, background:C.bgDeep, fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.9, marginBottom:4 }}>
                <div style={{marginBottom:4}}><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>upload your dotfiles — config folders, shell rc files, wallpaper, etc.</div>
                <div><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>The <span style={{color:C.fn}}>install.sh</span> script and <span style={{color:C.fn}}>meta.json</span> files are generated automatically. no need to include them.</div>
              </div>
              <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}} onClick={()=>filesRef.current?.click()}
                style={{ border:`1px dashed ${dragging?C.white:C.border}`, padding:"36px 24px", textAlign:"center", cursor:"pointer", background:dragging?"#ffffff06":"transparent", transition:"all .2s" }}>
                <div style={{ fontSize:20, color:C.gray3, marginBottom:10 }}>+</div>
                <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, marginBottom:4 }}>drag files here, or <span style={{color:C.white}}>browse</span></p>
                <p style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>.conf .toml .lua .sh .png .jpg .ttf — any config files</p>
                <input ref={filesRef} type="file" multiple style={{ display:"none" }} onChange={e=>addFiles(e.target.files)}/>
              </div>
              <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"14px 16px" }}>
                <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:10 }}>RECOMMENDED STRUCTURE</div>
                <pre style={{ fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.9, margin:0 }}>{`dotfiless/\n├── ${rice.wm||"wm"}/\n│   └── config\n├── waybar/\n│   ├── config\n│   └── style.css\n├── ${rice.terminal||"terminal"}/\nwallpaper.png\n.${rice.shell||"shell"}rc\ninstall.sh`}</pre>
              </div>
              {filess.length>0 && (
                <div>
                  <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8 }}>{filess.length} FILE · {fmtSize(filess.reduce((a,f)=>a+f.size,0))} totali</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {filess.map(f=>{ const tag=filesTag(f.name); return (
                      <div key={f.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 12px", border:`1px solid ${C.border}`, background:C.bgDeep }}>
                        <span style={{ fontSize:9, fontFamily:C.mono, padding:"1px 6px", border:`1px solid ${tag.c}44`, color:tag.c, flexShrink:0 }}>{tag.l}</span>
                        <span style={{ fontSize:11, fontFamily:C.mono, color:C.gray1, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{f.name}</span>
                        <span style={{ fontSize:10, color:C.gray3, flexShrink:0 }}>{fmtSize(f.size)}</span>
                        <button onClick={()=>remFile(f.name)} style={{ background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:14, padding:"0 4px" }}>×</button>
                      </div>
                    ); })}
                  </div>
                </div>
              )}
            </div>
          )}

          {pubError && (
            <div style={{ marginTop:16, padding:"10px 14px", border:`1px solid #a0585844`, background:"#a0585808", fontSize:11, fontFamily:C.mono, color:"#c07070" }}>
              <span style={{fontStyle:"italic"}}>// error: </span>{pubError}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:32, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
            <button onClick={()=>setStep(s=>s-1)} disabled={step===0} className="bg" style={{ padding:"9px 20px", border:`1px solid ${C.border}`, background:"transparent", color:step===0?C.gray3:C.gray2, cursor:step===0?"default":"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>← back</button>
            <button onClick={()=>step<5?setStep(s=>s+1):handlePublish()} disabled={!canNext||publishing} className={canNext&&!publishing?"bs":""} style={{ padding:"9px 24px", border:`1px solid ${canNext&&!publishing?C.borderHi:C.border}`, background:"transparent", color:canNext&&!publishing?C.white:C.gray3, cursor:canNext&&!publishing?"pointer":"default", fontSize:11, fontFamily:C.mono, fontWeight:500, transition:"all .15s" }}>
              {step<5?"next →":publishing?"// publishing...":"publish rice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── APP ─────────────────────────────────────────────────────────── */
/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────── */
function MobileBottomNav({ page, setPage, isLoggedIn }) {
  const isMobile = useMobile();
  if (!isMobile) return null;
  const items = [
    { id:"home",     icon:"⌂", label:"home" },
    { id:"search",   icon:"⌕", label:"search" },
    { id:"upload",   icon:"↑", label:"upload" },
    { id:"leaderboard", icon:"⊞", label:"ranks" },
  ];
  return (
    <div style={{ position:"fixed", bottom:52, left:0, right:0, zIndex:198, height:48, background:"rgba(12,12,12,0.97)", borderTop:`1px solid ${C.border}`, display:"flex", backdropFilter:"blur(10px)" }}>
      {items.map(item=>{
        const active = page===item.id;
        return (
          <button key={item.id} onClick={()=>setPage(item.id)}
            style={{ flex:1, height:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, color:active?C.fn:C.gray3, transition:"color .15s", borderRight:`1px solid ${C.border}` }}>
            <span style={{ fontSize:16, lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:8, fontFamily:C.mono, letterSpacing:"0.05em" }}>{item.label}</span>
          </button>
        );
      })}
      {isLoggedIn ? (
        <button onClick={()=>setPage("profiles")}
          style={{ flex:1, height:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, color:page==="profiles"?C.fn:C.gray3, transition:"color .15s" }}>
          <span style={{ fontSize:16, lineHeight:1 }}>◉</span>
          <span style={{ fontSize:8, fontFamily:C.mono }}>profile</span>
        </button>
      ) : (
        <button onClick={()=>window.location.href='/sign-in'}
          style={{ flex:1, height:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, color:C.gray3 }}>
          <span style={{ fontSize:16, lineHeight:1 }}>→</span>
          <span style={{ fontSize:8, fontFamily:C.mono }}>login</span>
        </button>
      )}
    </div>
  );
}

/* ── LEADERBOARD PAGE ─────────────────────────────────────────────── */
function LeaderboardPage({ onNav, onSelectUser }) {
  const mobile = useMobile();
  const [sortBy, setSortBy] = useState("installs");
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    import('../lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('rice')
        .select('author_id, installs, users(username)')
        .eq('status','approved');
      const map = {};
      (data||[]).forEach(r=>{
        const u = r.users?.username || r.author_id;
        if (!map[u]) map[u] = { username:u, installs:0, rice:0 };
        map[u].installs += r.installs||0;
        map[u].rice++;
      });
      setAuthors(Object.values(map));
      setLoading(false);
    });
  },[]);

  const sorted = [...authors].sort((a,b)=> sortBy==="rice" ? b.rice-a.rice : b.installs-a.installs);
  const medals = ["①","②","③"];

  return (
    <div style={{ padding:mobile?"14px":"28px 32px 48px", animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        <div style={{ fontSize:10, color:C.kw, fontStyle:"italic", fontFamily:C.mono, marginBottom:6 }}>// leaderboard</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24, flexWrap:"wrap", gap:10 }}>
          <div style={{ fontFamily:C.display, fontSize:"clamp(20px,3vw,32px)", fontWeight:900, color:C.white, letterSpacing:"-0.02em" }}>Top Authors</div>
          <div style={{ display:"flex", gap:0, border:`1px solid ${C.border}` }}>
            {[["installs","↓ installs"],["rice","⊞ rice count"]].map(([k,l])=>(
              <button key={k} onClick={()=>setSortBy(k)}
                style={{ padding:"5px 14px", background:sortBy===k?C.fn:"transparent", border:"none", borderRight:k==="installs"?`1px solid ${C.border}`:"none", color:sortBy===k?"#111":C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"all .15s" }}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color:C.gray3, fontFamily:C.mono, fontSize:12, fontStyle:"italic" }}>// loading...</div>
        ) : (
          <div style={{ border:`1px solid ${C.border}` }}>
            {sorted.slice(0,25).map((a,i)=>(
              <div key={a.username}
                onClick={()=>onSelectUser&&onSelectUser(a.username)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background .12s", background:"transparent" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <span style={{ fontSize:i<3?18:12, fontFamily:C.mono, fontWeight:700, minWidth:26, textAlign:"center",
                  color:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#b45309":C.gray3 }}>
                  {i<3?medals[i]:i+1}
                </span>
                <span style={{ flex:1, fontSize:13, fontFamily:C.mono, color:C.fn }}>@{a.username}</span>
                <div style={{ display:"flex", gap:20, textAlign:"right" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.white, fontFamily:C.mono }}>{fmt(a.installs)}</div>
                    <div style={{ fontSize:9, color:C.gray3 }}>installs</div>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.kw, fontFamily:C.mono }}>{a.rice}</div>
                    <div style={{ fontSize:9, color:C.gray3 }}>rice</div>
                  </div>
                </div>
              </div>
            ))}
            {sorted.length===0 && (
              <div style={{ padding:"24px 16px", fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no data</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SEARCH PAGE ──────────────────────────────────────────────────── */
function SearchPage({ onNav, onSelectRice, onSelectUser, initialQuery="" }) {
  const mobile = useMobile();
  const [query, setQuery]           = useState(initialQuery);
  const [riceResults, setRiceResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const debRef = useRef(null);

  useEffect(() => { if (initialQuery) runSearch(initialQuery); }, []);

  const runSearch = (q) => {
    if (!q.trim()) { setRiceResults([]); setUserResults([]); setSearching(false); return; }
    setSearching(true);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async ()=>{
      const { supabase } = await import('../lib/supabase');
      const [rRes, uRes] = await Promise.all([
        supabase.from('rice').select('id,title,author_id,cover_url,wm,installs,users(username)')
          .eq('status','approved').ilike('title',`%${q}%`).limit(8),
        supabase.from('users').select('id,username,badge')
          .ilike('username',`%${q}%`).limit(6),
      ]);
      setRiceResults(rRes.data||[]);
      setUserResults(uRes.data||[]);
      setSearching(false);
    }, 280);
  };

  const inputRef = useRef(null);
  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),100); },[]);

  return (
    <div style={{ padding:mobile?"14px":"28px 32px 48px", animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        <div style={{ fontSize:10, color:C.string, fontStyle:"italic", fontFamily:C.mono, marginBottom:6 }}>// global search</div>
        <div style={{ fontFamily:C.display, fontSize:"clamp(18px,3vw,30px)", fontWeight:900, color:C.white, letterSpacing:"-0.02em", marginBottom:20 }}>Search</div>

        <div style={{ position:"relative", marginBottom:24 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e=>{setQuery(e.target.value);runSearch(e.target.value);}}
            placeholder="search rice titles, tags, authors..."
            style={{ width:"100%", background:C.bgCard, border:`1px solid ${C.borderHi}`, color:C.white, fontFamily:C.mono, fontSize:14, padding:"12px 44px 12px 16px", outline:"none", boxSizing:"border-box" }}
          />
          <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:C.gray3, fontSize:14, pointerEvents:"none" }}>
            {searching?"...":"⌕"}
          </span>
        </div>

        {riceResults.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", fontFamily:C.mono, marginBottom:8 }}>// RICE ({riceResults.length})</div>
            <div style={{ border:`1px solid ${C.border}` }}>
              {riceResults.map(r=>(
                <div key={r.id} onClick={()=>onSelectRice&&onSelectRice(r)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background .12s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  {r.cover_url && <img src={r.cover_url} alt="" style={{ width:52, height:34, objectFit:"cover", flexShrink:0, border:`1px solid ${C.border}` }}/>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontFamily:C.mono, color:C.white, fontWeight:500 }}>{r.title}</div>
                    <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>@{r.users?.username||r.author_id} · {r.wm}</div>
                  </div>
                  <span style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, flexShrink:0 }}>↓{fmt(r.installs||0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {userResults.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.08em", fontFamily:C.mono, marginBottom:8 }}>// AUTHORS ({userResults.length})</div>
            <div style={{ border:`1px solid ${C.border}` }}>
              {userResults.map(u=>(
                <div key={u.id} onClick={()=>onSelectUser&&onSelectUser(u.username)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background .12s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  <span style={{ flex:1, fontSize:13, fontFamily:C.mono, color:C.fn }}>@{u.username}</span>
                  {u.badge && <span style={{ fontSize:9, fontFamily:C.mono, color:C.gray3, border:`1px solid ${C.border}`, padding:"1px 6px" }}>{u.badge}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!searching && query.length>1 && riceResults.length===0 && userResults.length===0 && (
          <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// no results for "{query}"</div>
        )}
        {!query && (
          <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, lineHeight:2.2, fontStyle:"italic" }}>
            // type to search rice by title<br/>
            // authors matched by username<br/>
            // click a result to open it →
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPageRaw]            = useState("home");
  const [selected, setSelected]       = useState(null);
  const [profilesAuthor, setProfilesAuthor] = useState(null);

  // Scroll position memory: save/restore gallery scroll when entering/leaving detail
  const savedScrollRef = useRef(0);

  // History API: push state on every page change, serializing selected rice id
  const setPage = (newPage, riceObj = null) => {
    try { sessionStorage.setItem('rs_page', newPage); } catch(e) {}
    const state = { page: newPage, selectedId: riceObj?.id ?? null };
    window.history.pushState(state, "", "");
    setPageRaw(newPage);
  };

  // Ripristina pagina da sessionStorage dopo hydration (evita SSR mismatch)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('rs_page');
      if (saved && !['detail','pubprofiles'].includes(saved)) {
        setPageRaw(saved);
      }
    } catch(e) {}
  }, []);

  // Handle OS/browser back button
  useEffect(() => {
    const onPop = (e) => {
      const state = e.state || {};
      const prev = state.page || "home";
      // Restore selected rice from history state if available
      if (state.selectedId) {
        // We only have the id; keep current selected if ids match, else clear
        setSelected(sel => (sel?.id === state.selectedId ? sel : null));
      } else {
        setSelected(null);
      }
      setPageRaw(prev);
      // Restore scroll position when going back to gallery
      if (prev === "home") {
        requestAnimationFrame(() => {
          const el = document.querySelector(".content-area");
          if (el) el.scrollTop = savedScrollRef.current;
        });
      }
    };
    // Push initial state so back from first page doesn't close the site
    window.history.replaceState({ page: "home", selectedId: null }, "", "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const { user, isLoaded: clerkLoaded } = useUser();
  const isLoggedIn = !!user;

  // Legge trustLevel e badge reale da Supabase
  const [trustLevel, setTrustLevel] = useState(null); // null = loading, shows banner only after DB confirms
  const [userBadge,  setUserBadge]  = useState("member");
  const [navUnread,  setNavUnread]  = useState(0);
  const [tagClick,   setTagClick]   = useState(null);
  const [navSearchQuery, setNavSearchQuery] = useState("");
  useEffect(() => {
    if (!user) return;
    import('../lib/supabase').then(({ supabase }) => {
      Promise.all([
        supabase.from('users').select('trust_level,badge').eq('id', user.id).single(),
        supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('read',false),
      ]).then(([{ data }, { count }]) => {
        if (data?.trust_level != null) setTrustLevel(data.trust_level);
        if (data?.badge)               setUserBadge(data.badge);
        setNavUnread(count || 0);
      });
    });
  }, [user]);

  const scrollTop = () => {
    [document.getElementById("docs-scroll"), document.querySelector(".content-area")].forEach(el => { if(el) el.scrollTop=0; });
    window.scrollTo(0,0);
  };

  const go   = r => {
    // Track view history in localStorage
    try {
      const views = JSON.parse(localStorage.getItem('rs_views') || '[]');
      const updated = [r.id, ...views.filter(id => id !== r.id)].slice(0, 30);
      localStorage.setItem('rs_views', JSON.stringify(updated));
    } catch(e) {}
    // Save current gallery scroll position before entering detail
    const el = document.querySelector(".content-area");
    if (el) savedScrollRef.current = el.scrollTop;
    setSelected(r);
    setPage("detail", r);
    scrollTop();
  };
  const back = () => {
    const scrollY = savedScrollRef.current;
    setSelected(null);
    setPage("home");
    // Restore scroll position after the home page renders
    requestAnimationFrame(() => {
      const el = document.querySelector(".content-area");
      if (el) el.scrollTop = scrollY;
    });
  };

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta=document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  }, []);

  useEffect(() => {
    // Don't reset scroll for "home" — it will be handled by back() or onPop to restore position
    if (page === "home") return;
    const el  = document.querySelector(".content-area");
    const doc = document.getElementById("docs-scroll");
    if (el)  el.scrollTop  = 0;
    if (doc) doc.scrollTop = 0;
  }, [page]);

  return (
    <>
      <style>{GS}</style>
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:200 }}>
        <Navbar page={page} setPage={setPage} isAdmin={userBadge==="founder"||userBadge==="staff"} navUnread={navUnread} onSearch={q=>{setNavSearchQuery(q);setPage("search");scrollTop();}}/>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200 }}>
        <Footer setPage={setPage}/>
        <a
          href="https://buymeacoffee.com/riceshare"
          target="_blank"
          rel="noreferrer"
          style={{
            position:"fixed", bottom:68, right:20, zIndex:9999,
            display:"flex", alignItems:"center", gap:7,
            background:"#FFDD00", color:"#000",
            fontFamily:"'IBM Plex Mono','Fira Code','Courier New',monospace",
            fontSize:11, fontWeight:700,
            padding:"8px 14px", borderRadius:6,
            textDecoration:"none",
            boxShadow:"0 4px 16px rgba(0,0,0,0.35)",
            transition:"opacity .15s, transform .15s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.opacity="0.9"; e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.opacity="1";   e.currentTarget.style.transform="translateY(0)"; }}
        >
          <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="" style={{ width:16, height:16 }}/>
          buy the team a coffee
        </a>
      </div>
      <MobileBottomNav page={page} setPage={setPage} isLoggedIn={isLoggedIn}/>
      <div className="content-area" style={{ position:"fixed", top:52, bottom:52, left:0, right:0, overflowY:"auto", background:C.bg }}>
        <PageShell key={page}>
          {clerkLoaded && page==="home"       && <HomePage onSelect={go} onUpload={()=>{setPage("upload");scrollTop();}} tagClick={tagClick} onTagClickConsumed={()=>setTagClick(null)}/>}
          {page==="detail"     && selected && <DetailPage rice={selected} onBack={back} currentUser={user} userBadge={userBadge} onTagClick={t=>{setTagClick(t);back();}} onProfiles={()=>{
            const isOwner = user && (user.username === selected.author || user.firstName === selected.author);
            if (isOwner) { setPage("profiles"); scrollTop(); }
            else { setProfilesAuthor(selected.author); setPage("pubprofiles"); scrollTop(); }
          }}/>}
          {clerkLoaded && page==="upload"     && (isLoggedIn ? <UploadPage trustLevel={trustLevel} userBadge={userBadge} onGoHome={()=>{setPage("home");scrollTop();}}/> : <UploadGate onLogin={()=>{window.location.href='/sign-in';}}/>)}
          {page==="docs"       && <DocsPage/>}
          {page==="terms"      && <TermsPage onNav={setPage}/>}
          {page==="privacy"    && <PrivacyPage onNav={setPage}/>}
          {page==="about"      && <AboutPage onProfiles={author=>{ setProfilesAuthor(author); setPage("pubprofiles"); scrollTop(); }}/>}
          {clerkLoaded && page==="profiles"    && <ProfilesPage onNav={setPage} onSelectRice={r=>{setSelected(r);setPage("detail");scrollTop();}} onClearNotifs={()=>setNavUnread(0)}/>}
          {clerkLoaded && page==="pubprofiles" && <PublicProfilesPage author={profilesAuthor} onBack={()=>{setPage(selected?"detail":"home");scrollTop();}} onSelectRice={r=>{setSelected(r);setPage("detail");scrollTop();}}/>}
          {page==="admin"       && (userBadge==="founder"||userBadge==="staff") && <AdminPage onNav={setPage} onSelectRice={r=>{setSelected(r);setPage("detail");scrollTop();}} onSelectUser={u=>{setProfilesAuthor(u.username||u.clerk_id);setPage("pubprofiles");scrollTop();}}/>}
          {page==="leaderboard" && <LeaderboardPage onNav={setPage} onSelectUser={u=>{setProfilesAuthor(u);setPage("pubprofiles");scrollTop();}}/>}
          {page==="search"      && <SearchPage initialQuery={navSearchQuery} onNav={setPage} onSelectRice={r=>{setSelected(r);setPage("detail",r);scrollTop();}} onSelectUser={u=>{setProfilesAuthor(u);setPage("pubprofiles");scrollTop();}}/>}
        </PageShell>
      </div>
    </>
  );
}
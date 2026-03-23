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
    const t = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => { clearTimeout(t); ro.disconnect(); };
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

  const url     = `https://riceshare.dev/rice/${rice.author}/${rice.slug}`;
  const cmdText = `curl -fsSL riceshare.dev/install/${rice.author}/${rice.slug} | bash`;

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
function DetailPage({ rice, onBack, onProfiles }) {
  const mobile = useMobile();
  const [tab, setTab]       = useState("description");
  const [copied, setCopied] = useState(false);
  const cmd = `curl -fsSL riceshare.dev/install/${rice.author}/${rice.slug} | bash`;
  const copy = () => { navigator.clipboard?.writeText(cmd).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

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
          <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:"7px 16px", background:"none", border:"none", borderBottom:tab===t?`1px solid ${C.white}`:"1px solid transparent", color:tab===t?C.white:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:-1, transition:"color .15s", flexShrink:0 }}>{t}</button>
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
            <span>install.sh</span><span style={{ color:C.fn }}>bash</span>
          </div>
          <div style={{ padding:"12px 16px", overflowX:"auto" }}>
            {script.map((line,i)=>(
              <div key={i} style={{ display:"flex", gap:14, lineHeight:1.9 }}>
                <span style={{ fontSize:10, color:C.gray3, userSelect:"none", minWidth:18, textAlign:"right", flexShrink:0 }}>{line.k!=="blank"?i+1:""}</span>
                <span style={{ fontSize:11, fontFamily:C.mono, color:lc(line.k), fontStyle:line.k==="comment"?"italic":"normal", whiteSpace:"nowrap" }}>
                  {line.k==="comment"?<><span style={{color:C.gray3}}>// </span>{line.v}</>:line.v||" "}
                </span>
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

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <LikeButton rice={rice}/>
        <ShareButton rice={rice}/>
      </div>
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
      <div style={{ padding:"10px 12px", border:`1px solid ${C.border}`, fontSize:10, color:C.gray3, fontFamily:C.mono, lineHeight:1.7 }}>
        <span style={{fontStyle:"italic"}}>// </span>auto backup in <code style={{color:C.fn}}>~/.rice-backup/</code>
      </div>
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
          {rice.tags.map(t=><span key={t} style={{ fontSize:10, fontFamily:C.mono, color:C.kw, border:`1px solid ${C.kw}33`, padding:"1px 8px" }}>#{t}</span>)}
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
              {rice.tags.map(t=><span key={t} style={{ fontSize:9, fontFamily:C.mono, color:C.kw, border:`1px solid ${C.kw}33`, padding:"1px 8px" }}>#{t}</span>)}
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
        <LegalP>The name "Riceshare", the logo and design are owned by Riceshare. The source code is released as open source — specific licenses are listed in the GitHub repository.</LegalP>
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
        <LegalLi>GitHub: <span style={{color:C.kw}}>github.com/riceshare/issues</span></LegalLi>
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
        <LegalLi>GitHub: <span style={{color:C.kw}}>github.com/riceshare/issues</span></LegalLi>
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

/* ── HOMEPAGE ────────────────────────────────────────────────────── */
function HomePage({ onSelect, onUpload }) {
  const [rices, setRices]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [netError, setNetError] = useState(false);
  const [search, setSearch]     = useState("");
  const [wmFilter, setWmFilter] = useState("all");
  const [view, setView]         = useState("grid");

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('rice')
        .select('*, users(username)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) { setNetError(true); }
          else if (data) setRices(data.map(normalizeRice));
          setLoading(false);
        });
    }).catch(() => { setNetError(true); setLoading(false); });
  }, []);

  const wms = ["all","hyprland","sway","i3wm","bspwm","openbox"];
  const mobile = useMobile();
  const filtered = rices.filter(r => {
    const mf = wmFilter==="all" || r.wm===wmFilter;
    const q  = search.toLowerCase();
    const ms = !search
      || (r.title||"").toLowerCase().includes(q)
      || (r.author||"").toLowerCase().includes(q)
      || (r.description||"").toLowerCase().includes(q)
      || (r.tags||[]).some(t=>(t||"").toLowerCase().includes(q));
    return mf && ms;
  });

  return (
    <div>
      <div style={{ borderBottom:`1px solid ${C.border}` }}>
        <div style={{ padding:"10px 32px", borderBottom:`1px solid ${C.border}`, background:C.bgDeep }}>
          <span style={{ fontSize:11, fontFamily:C.mono, color:C.comment, fontStyle:"italic" }}>
            <span style={{ color:"#242424" }}>// </span>linux rice gallery &amp; one-click installer — v1.0.0
          </span>
        </div>
        {mobile ? (
          // Mobile hero — compact
          <div style={{ padding:"16px 14px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:C.display, fontSize:"clamp(24px,8vw,36px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", lineHeight:1, textTransform:"uppercase", marginBottom:8 }}>RICESHARE</div>
            <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, marginBottom:12 }}>
              <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>Find, Share, Customize.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none", flex:1 }}>
                <button className="bs" style={{ width:"100%", padding:"8px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono }}>community →</button>
              </a>
              <button className="bg" onClick={onUpload} style={{ flex:1, padding:"8px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono }}>upload</button>
            </div>
          </div>
        ) : (
          // Desktop hero
          <>
            <div style={{ padding:"28px 32px 16px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:C.display, fontSize:"clamp(28px,4vw,48px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", lineHeight:1, textTransform:"uppercase" }}>RICESHARE</div>
            </div>
            <div style={{ padding:"24px 32px 36px", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:20 }}>
              <div style={{ maxWidth:420 }}>
                <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:20 }}>
                  <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>Find, Share, Customize.<br/>Your Linux, one click away.
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                    <button className="bs" style={{ padding:"9px 22px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>community →</button>
                  </a>
                  <button className="bg" onClick={onUpload} style={{ padding:"9px 22px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>upload rice</button>
                </div>
              </div>
              {!mobile && (
                <div style={{ display:"flex", gap:28, fontFamily:C.mono }}>
                  {[
                    {v:loading?"...":String(rices.length),l:"rice"},
                    {v:loading?"...":fmt(rices.reduce((a,r)=>a+(r.installs||0),0)),l:"installs"},
                    {v:loading?"...":String(new Set(rices.map(r=>r.author).filter(Boolean)).size),l:"authors"},
                  ].map(s=>(
                    <div key={s.l} style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:600, color:C.white }}>{s.v}</div>
                      <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── SEARCH + VIEW TOGGLE ── */}
      {mobile ? (
        // Mobile: search + select dropdown
        <div style={{ borderBottom:`1px solid ${C.border}`, background:C.bgDeep, padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
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
            <span style={{ fontSize:9, color:C.gray3, fontFamily:C.mono, flexShrink:0, whiteSpace:"nowrap" }}>{filtered.length} results</span>
          </div>
        </div>
      ) : (
        // Desktop: search bar + view toggle
        <>
          <div style={{ padding:"10px 32px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center", background:C.bgDeep }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.border}`, padding:"7px 12px" }}>
              <span style={{ color:C.gray3, fontSize:11 }}>{">"}</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='search("rice or author")' style={{ background:"none", border:"none", outline:"none", color:C.white, fontSize:11, fontFamily:C.mono, width:"100%" }}/>
              {search && <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>}
            </div>
            <div style={{ display:"flex", border:`1px solid ${C.border}`, overflow:"hidden" }}>
              {[["grid","▦"],["list","≡"]].map(([v,ic])=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:"7px 14px", border:"none", background:view===v?C.white:"transparent", color:view===v?"#111":C.gray3, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}>{ic}</button>
              ))}
            </div>
          </div>
          {/* WM filter tabs */}
          <div style={{ padding:"0 32px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center" }}>
            {wms.map(f=>(
              <button key={f} className="tb" onClick={()=>setWmFilter(f)} style={{ padding:"9px 14px", background:"none", border:"none", borderBottom:wmFilter===f?`1px solid ${C.white}`:"1px solid transparent", color:wmFilter===f?C.white:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, marginBottom:-1, transition:"color .15s" }}>
                {f==="all"?"*.all":f}
              </button>
            ))}
            <div style={{ flex:1 }}/>
            <span style={{ fontSize:9, color:C.gray3 }}>{filtered.length} results</span>
          </div>
        </>
      )}

      <div style={{ padding:mobile?"12px 14px 32px":"24px 32px 48px" }}>
        {loading ? (
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

function Navbar({ page, setPage }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const isMobile = useContainerWidth(navRef, 680);
  const NAV_LINKS = [["home","home"],["upload","upload"],["docs","docs"],["about","about"]];

  return (
    <>
      <nav ref={navRef} style={{ borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:200, background:"rgba(20,20,20,0.97)", backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", height:44 }}>
          {!isMobile && (
            <div style={{ width:GUTTER, flexShrink:0, height:"100%", background:C.gutter, borderRight:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:14 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:C.fn, opacity:.6 }}/>
            </div>
          )}
          <div style={{ flex:1, paddingLeft:isMobile?12:16, display:"flex", alignItems:"center", height:"100%" }}>
            <button onClick={()=>{setPage("home");setMenuOpen(false);}} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.display, fontSize:isMobile?12:15, fontWeight:800, color:C.white, letterSpacing:"-0.02em", textTransform:"uppercase", padding:"0 12px 0 0", marginRight:8, borderRight:`1px solid ${C.border}`, height:"100%" }}>Riceshare</button>
            {!isMobile && NAV_LINKS.map(([p,label])=>(
              <button key={p} className="tb" onClick={()=>setPage(p)} style={{ padding:"0 12px", height:"100%", background:"none", border:"none", borderBottom:page===p?`1px solid ${C.white}`:"1px solid transparent", color:page===p?C.white:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"color .15s" }}>{label}</button>
            ))}
            <div style={{ flex:1 }}/>
            {!isMobile && (user ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:16 }}>
                <button onClick={()=>setPage("profiles")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, fontFamily:C.mono, color:C.fn, padding:0 }}>@{user?.username || user?.firstName || "user"}</button>
                <button onClick={()=>signOut(()=>setPage("home"))} className="bg" style={{ padding:"4px 10px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", fontSize:10, fontFamily:C.mono }}>logout</button>
              </div>
            ) : (
              <button className="bs" onClick={()=>window.location.href='/sign-in'} style={{ padding:"5px 14px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, marginRight:16 }}>login</button>
            ))}
            {isMobile && (
              <button onClick={()=>setMenuOpen(o=>!o)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.gray2, cursor:"pointer", padding:"4px 10px", fontFamily:C.mono, fontSize:15, marginRight:10, lineHeight:1 }}>{menuOpen?"✕":"☰"}</button>
            )}
          </div>
        </div>
      </nav>
      {isMobile && menuOpen && (
        <div style={{ position:"fixed", top:44, left:0, right:0, zIndex:199, background:"rgba(13,13,13,0.98)", borderBottom:`1px solid ${C.border}`, flexDirection:"column", padding:"8px 0", backdropFilter:"blur(10px)", display:"flex" }}>
          {NAV_LINKS.map(([p,label])=>(
            <button key={p} onClick={()=>{setPage(p);setMenuOpen(false);}} style={{ padding:"13px 20px", background:"none", border:"none", borderLeft:page===p?`2px solid ${C.white}`:"2px solid transparent", color:page===p?C.white:C.gray2, cursor:"pointer", fontSize:14, fontFamily:C.mono, textAlign:"left" }}>{label}</button>
          ))}
          <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
          {user ? (
            <div style={{ display:"flex", gap:10, padding:"8px 20px" }}>
              <button onClick={()=>{setPage("profiles");setMenuOpen(false);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:C.mono, color:C.fn }}>@{user?.username || user?.firstName || "user"}</button>
              <button onClick={()=>signOut(()=>setPage("home"))} style={{ padding:"6px 14px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", fontSize:12, fontFamily:C.mono }}>logout</button>
            </div>
          ) : (
            <button onClick={()=>{window.location.href='/sign-in';setMenuOpen(false);}} style={{ margin:"4px 20px 12px", padding:"11px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:13, fontFamily:C.mono }}>login →</button>
          )}
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
          <Cmd>curl -fsSL riceshare.dev/install/author/rice-name | bash</Cmd>
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
          <Block><div style={{color:C.gray3,fontStyle:"italic",marginBottom:4}}>// base url</div><code style={{color:C.string}}>https://riceshare.dev/api/v1</code></Block>
          <div style={{marginBottom:20}}>
            <ApiRow method="GET" path="/rice"                    desc="lista tutti i rice — params: sort, wm, distro, limit"/>
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
          <P>Riceshare is open source. The code is on GitHub — contributions, bug reports and suggestions are welcome.</P>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// useful links</div>
            <KV k="github"   v="github.com/riceshare"/>
            <KV k="discord"  v="discord.gg/riceshare"/>
            <KV k="issues"   v="github.com/riceshare/issues"/>
          </Block>
          <Block>
            <div style={{color:C.gray3,fontStyle:"italic",marginBottom:8}}>// special badges</div>
            <div style={{marginBottom:8}}><Badge label="early.adopter" color={C.string}/>primi 100 utenti sign up</div>
            <div style={{marginBottom:8}}><Badge label="core.dev" color={C.kw}/>code contributor</div>
            <div style={{marginBottom:8}}><Badge label="featured" color={C.fn}/>featured rice on homepage</div>
            <div style={{marginBottom:8}}><Badge label="verified" color={C.white}/>identity verified by the team</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><FounderBadge/>founding member of the project</div>
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
            <button className="bg" style={{width:"100%",padding:"11px",border:`1px solid ${C.border}`,background:"transparent",color:C.gray2,cursor:"pointer",fontSize:12,fontFamily:C.mono,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:14}}>⌥</span>continue with GitHub
            </button>
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
  const [profiles, setProfiles] = useState(null);
  const [rices, setRices]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      // Carica profilo utente
      supabase.from('users').select('*').eq('username', author).single()
        .then(({ data: u }) => {
          setProfiles(u || { username:author, badge:'member', trust_level:0 });
          if (!u) { setLoading(false); return; }
          // Upload rice approvati di questo autore
          supabase.from('rice').select('*, users(username)').eq('author_id', u.id).eq('status','approved')
            .then(({ data: r }) => { setRices((r||[]).map(normalizeRice)); setLoading(false); });
        });
    }).catch(()=>setLoading(false));
  }, [author]);

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
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
                <span style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em" }}>@{author}</span>
                {profiles?.badge && !isFounder && <span style={{ fontSize:9, border:`1px solid ${badgeColor}55`, color:badgeColor, padding:"2px 9px", fontFamily:C.mono }}>{profiles.badge}</span>}
                {isFounder && <FounderBadge/>}
              </div>
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
            <div style={{ display:"flex", gap:24 }}>
              {[{v:rices.length,l:"rice"},{v:fmt(rices.reduce((a,r)=>a+(r.installs||0),0)),l:"installs"},{v:fmt(rices.reduce((a,r)=>a+(r.likes||0),0)),l:"likes"}].map(s=>(
                <div key={s.l} style={{ textAlign:"right" }}>
                  <div style={{ fontSize:20, fontWeight:600, color:C.white, fontFamily:C.mono }}>{s.v}</div>
                  <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
                </div>
              ))}
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
function DeleteRiceButton({ riceId, onDeleted }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('rice').delete().eq('id', riceId);
      if (error) throw new Error(error.message);
      onDeleted();
    } catch(e) {
      console.error('delete error:', e.message);
      setLoading(false);
      setConfirm(false);
    }
  };

  if (confirm) return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      <span style={{ fontSize:9, color:C.string, fontFamily:C.mono, fontStyle:"italic" }}>sure?</span>
      <button onClick={handleDelete} disabled={loading} style={{ fontSize:9, fontFamily:C.mono, padding:"2px 8px", border:`1px solid #a0585844`, background:"#a0585814", color:"#c07070", cursor:"pointer" }}>
        {loading ? "..." : "yes"}
      </button>
      <button onClick={()=>setConfirm(false)} style={{ fontSize:9, fontFamily:C.mono, padding:"2px 8px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer" }}>no</button>
    </div>
  );

  return (
    <button onClick={()=>setConfirm(true)} style={{ fontSize:9, fontFamily:C.mono, padding:"2px 8px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray3, cursor:"pointer", transition:"all .15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor="#a0585844"; e.currentTarget.style.color="#c07070"; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.gray3; }}
    >delete</button>
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

function SettingsTab({ user, signOut }) {
  const mobile = useMobile();
  const [pwdForm, setPwdForm]   = useState({ current:"", next:"", confirm:"" });
  const [showPwd, setShowPwd]   = useState(false);
  const [pwdState, setPwdState] = useState(null); // null | "loading" | "ok" | "error"
  const [pwdError, setPwdError] = useState("");

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
function ProfilesPage({ onNav, onSelectRice }) {
  const mobile = useMobile();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [rices, setRices]         = useState([]);
  const [tab, setTab]             = useState("rice");
  const [isFounder, setIsFounder] = useState(false);
  const [badge, setBadge]         = useState("member");

  useEffect(() => {
    if (!user) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('users').select('badge,trust_level').eq('id', user.id).single()
        .then(({ data }) => { if(data){ setBadge(data.badge||"member"); setIsFounder(data.badge==='founder'); } });
      supabase.from('rice').select('*, users(username)').eq('author_id', user.id)
        .then(({ data }) => setRices(data||[]));
    });
  }, [user]);

  if (!user) return null;

  const badgeColor = { founder:C.gold, staff:C.string, senior:C.fn, trusted:C.kw, member:C.gray2 }[badge] || C.gray2;

  const BADGES = [{ label:"early.adopter", color:"#b5a07a" }];

  const stats = [
    {v:rices.length, l:"rice"},
    {v:rices.reduce((a,r)=>a+(r.installs||0),0), l:"installs"},
    {v:rices.reduce((a,r)=>a+(r.likes||0),0), l:"likes"},
  ];

  const RiceGrid = () => (
    <div style={{ animation:"fadeIn .2s ease" }}>
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
                {!mobile && <DeleteRiceButton riceId={r.id} onDeleted={()=>setRices(prev=>prev.filter(x=>x.id!==r.id))}/>}
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
  );

  const Tabs = () => (
    <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:mobile?16:24 }}>
      {[["rice","rice"],["settings","settings"]].map(([t,label])=>(
        <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:mobile?"8px 14px":"8px 16px", background:"none", border:"none", borderBottom:tab===t?`1px solid ${C.white}`:"1px solid transparent", color:tab===t?C.white:C.gray2, cursor:"pointer", fontSize:mobile?10:11, fontFamily:C.mono, marginBottom:-1 }}>{label}</button>
      ))}
    </div>
  );

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
            {BADGES.map(b=><span key={b.label} style={{ fontSize:9, border:`1px solid ${b.color}44`, color:b.color, padding:"1px 7px", fontFamily:C.mono }}>{b.label}</span>)}
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
      {/* Tabs + content */}
      <div style={{ padding:"14px 14px 32px" }}>
        <Tabs/>
        {tab==="rice" && <RiceGrid/>}
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
              {BADGES.map(b=>(
                <div key={b.label} style={{ fontSize:9, border:`1px solid ${b.color}44`, color:b.color, padding:"2px 9px", fontFamily:C.mono }}>{b.label}</div>
              ))}
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

        <Tabs/>
        {tab==="rice" && <RiceGrid/>}
        {tab==="settings" && <SettingsTab user={user} signOut={signOut}/>}
      </div>
    </div>
  );
}

/* ── ABOUT PAGE ──────────────────────────────────────────────────── */
function AboutPage({ onNav, onProfiles }) {
  const TEAM = [
    { role:"founder, UX/UI designer & dev", name:"@marcolino",     bio:"graphic designer & ui/ux designer, likes to experiment with programming.", isFounder:true },
    { role:"founder & creator",             name:"@andrei_chirva", bio:"obsessed with pixel-perfect interfaces. rose-pine forever.",               isFounder:true },
  ];
  const VALUES = [
    { k:"open source",     v:"all of riceshare's code is public on GitHub. no lock-in, no black box." },
    { k:"community first", v:"product decisions come from the community. discord is where everything happens." },
    { k:"quality",         v:"every rice is reviewed before appearing in the gallery. we prefer fewer good rice over many mediocre ones." },
    { k:"simplicity",      v:"one command to install any setup. that's a promise we never want to break." },
  ];
  const TIMELINE = [
    { date:"jan 2026", text:"first idea — a github repo with a bash script" },
    { date:"feb 2026", text:"first version of the gallery, 12 rice total" },
    { date:"mar 2026", text:"public launch v1.0.0 — early adopters open" },
    { date:"upcoming", text:"installer system, badges, theme marketplace" },
  ];

  const mobile = useMobile();
  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:mobile?"16px 16px 24px":"28px 40px 28px" }}>
        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// about</div>
        <div style={{ fontFamily:C.display, fontSize:"clamp(28px,5vw,48px)", fontWeight:900, color:C.white, letterSpacing:"-0.04em", textTransform:"uppercase", marginBottom:8 }}>RICESHARE</div>
        <div style={{ fontSize:13, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:40, maxWidth:560 }}>
          <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>
          riceshare was born from the frustration of searching for dotfiles across reddit, github and telegram. we wanted one clean place, done right, with an installer that actually works. so we built it.
        </div>
        <div style={{ height:1, background:C.border, marginBottom:40 }}/>

        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// our values</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,260px),1fr))", gap:12 }}>
            {VALUES.map((v,i)=>(
              <div key={v.k} style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:"18px 20px", animation:`fadeUp .3s ease ${i*.08}s both` }}>
                <div style={{ fontSize:12, color:C.white, fontFamily:C.mono, fontWeight:500, marginBottom:8 }}><span style={{color:C.gray3}}>// </span>{v.k}</div>
                <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{v.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// history</div>
          {TIMELINE.map((t,i)=>(
            <div key={t.date} style={{ display:"flex", gap:20, paddingBottom:20, borderBottom:i<TIMELINE.length-1?`1px solid ${C.border}`:"none", marginBottom:20, animation:`fadeUp .3s ease ${i*.07}s both` }}>
              <div style={{ width:80, flexShrink:0 }}>
                <span style={{ fontSize:10, fontFamily:C.mono, color:t.date==="upcoming"?C.string:C.kw, fontStyle:t.date==="upcoming"?"italic":"normal" }}>{t.date}</span>
              </div>
              <div style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{t.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// the team</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {TEAM.map((m,i)=>(
              <div key={m.name} style={{ border:`1px solid ${m.isFounder?C.gold+"44":C.border}`, background:m.isFounder?`${C.gold}06`:C.bgCard, padding:"18px 20px", display:"flex", gap:20, alignItems:"flex-start", animation:`fadeUp .3s ease ${i*.08}s both` }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                    <span onClick={()=>onProfiles&&onProfiles(m.name.replace("@",""))} style={{ fontSize:13, color:C.fn, fontFamily:C.mono, fontWeight:500, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.fn+"44" }}>{m.name}</span>
                    <span style={{ fontSize:9, color:C.gray3, border:`1px solid ${C.border}`, padding:"1px 7px", fontFamily:C.mono }}>{m.role}</span>
                    {m.isFounder && <FounderBadge/>}
                  </div>
                  <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{m.bio}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:"24px 28px" }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// join us</div>
          <div style={{ fontSize:13, color:C.white, fontFamily:C.mono, marginBottom:20, lineHeight:1.9 }}>
            riceshare is open source and community driven.<br/>
            <span style={{ color:C.gray3 }}>// </span>contribute on GitHub, join the Discord, or simply upload your rice.
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <a href="https://github.com/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
              <button className="bs" style={{ padding:"9px 22px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>GitHub →</button>
            </a>
            <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
              <button className="bg" style={{ padding:"9px 22px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>Discord</button>
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
            <span style={{ fontSize:10, fontFamily:C.mono, color:C.gray3, fontStyle:"italic" }}>// open source</span>
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <Link label="github"    href="https://github.com/riceshare"/>
            <Link label="docs"      page="docs"/>
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

function UploadPage({ trustLevel=1, onGoHome }) {
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

  // Converte qualsiasi immagine in WebP downscalata (max 1920px, quality 0.82)
  const toWebP = (file) => new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1920;
      let { width: w, height: h } = img;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        // Rinomina il file con estensione .webp
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
    ? `curl -fsSL riceshare.dev/install/${user?.username||"user"}/${makeSlug()} | bash`
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
          .from('rice-filess')
          .upload(path, img, { upsert:true });
        if (!imgErr) {
          const { data: pub } = supabase.storage.from('rice-filess').getPublicUrl(path);
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
          .from('rice-filess')
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
        status:      trustLevel <= 1 ? 'pending' : 'approved',
      });
      if (error) {
        throw new Error(error.message || error.details || error.hint || JSON.stringify(error));
      }

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
        <div style={{ width:"100%", border:`1px solid ${C.border}`, background:C.bgDeep, marginBottom:trustLevel<=1?16:28 }}>
          <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, textAlign:"left", letterSpacing:"0.08em" }}>install command</div>
          <div style={{ padding:"12px 16px", display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ color:C.gray3, flexShrink:0 }}>$</span>
            <code style={{ fontFamily:C.mono, fontSize:11, color:C.gray1, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"left" }}>{installCmd}</code>
          </div>
        </div>

        {/* Avviso revisione */}
        {trustLevel<=1 && (
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
      {trustLevel<=1 && (
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
                  <span style={{color:"#242424"}}>// </span>usa un nome descrittivo e unico — verrà usato nell'URL di installazione. consigliato: tema-wm (es. catppuccin-hypr, nord-i3).
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
                  <span style={{color:"#242424"}}>// </span>i tag aiutano gli utenti a trovare il tuo rice nella ricerca. premi invio o spazio per aggiungere. max 10.
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
                  <span style={{color:"#242424"}}>// </span>il WM per cui è ottimizzato il rice. required field — definisce la categoria nella gallery.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{WMS.map(w=><Chip key={w} label={w} active={rice.wm===w} onClick={()=>set("wm",w)}/>)}</div>
              </div>
              <div>
                <span style={labelStyle}>COMPATIBLE DISTROS</span>
                <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                  <span style={{color:"#242424"}}>// </span>seleziona tutte le distro su cui hai testato il rice. aiuta gli utenti a capire se funzionerà sul loro system.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{DISTROS.map(d=><Chip key={d} label={d} active={rice.distros.includes(d)} onClick={()=>set("distros",rice.distros.includes(d)?rice.distros.filter(x=>x!==d):[...rice.distros,d])}/>)}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:12 }}>
                <div>
                  <span style={labelStyle}>TERMINAL</span>
                  <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                    <span style={{color:"#242424"}}>// </span>il terminale incluso nella tua config.
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{TERMINALS.map(t=><Chip key={t} label={t} active={rice.terminal===t} onClick={()=>set("terminal",t)}/>)}</div>
                </div>
                <div>
                  <span style={labelStyle}>SHELL</span>
                  <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8, lineHeight:1.7 }}>
                    <span style={{color:"#242424"}}>// </span>la shell usata nei dotfiles (zshrc, config.fish, ecc.).
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
                <div><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>la <span style={{color:C.string}}>★ cover</span> apparirà come anteprima nella gallery. i colori della palette vengono estratti automaticamente dall'immagine.</div>
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
                <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>indica quali components sono inclusi nel tuo rice. queste informazioni aiutano gli utenti a capire cosa installeranno prima di procedere.
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
                <span style={{color:C.gray3,fontStyle:"italic"}}>// </span>lista dei packages che lo script di installazione installerà automaticamente. usa i nomi esatti del package manager (es. <span style={{color:C.fn}}>hyprland</span>, <span style={{color:C.fn}}>waybar</span>, <span style={{color:C.fn}}>nerd-fonts</span>).
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
                <div><span style={{color:C.gray3,fontStyle:"italic"}}>// </span>lo script <span style={{color:C.fn}}>install.sh</span> script and <span style={{color:C.fn}}>meta.json</span> files are generated automatically. no need to include them.</div>
              </div>
              <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.filess);}} onClick={()=>filesRef.current?.click()}
                style={{ border:`1px dashed ${dragging?C.white:C.border}`, padding:"36px 24px", textAlign:"center", cursor:"pointer", background:dragging?"#ffffff06":"transparent", transition:"all .2s" }}>
                <div style={{ fontSize:20, color:C.gray3, marginBottom:10 }}>+</div>
                <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, marginBottom:4 }}>drag filess here, or <span style={{color:C.white}}>browse</span></p>
                <p style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>.conf .toml .lua .sh .png .jpg .ttf — any config files</p>
                <input ref={filesRef} type="files" multiple style={{ display:"none" }} onChange={e=>addFiles(e.target.filess)}/>
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
export default function App() {
  const [page, setPage]               = useState("home");
  const [selected, setSelected]       = useState(null);
  const [profilesAuthor, setProfilesAuthor] = useState(null);
  const { user } = useUser();
  const isLoggedIn = !!user;

  // Legge trustLevel reale da Supabase
  const [trustLevel, setTrustLevel] = useState(1);
  useEffect(() => {
    if (!user) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('users').select('trust_level').eq('id', user.id).single()
        .then(({ data }) => { if (data?.trust_level != null) setTrustLevel(data.trust_level); });
    });
  }, [user]);

  const scrollTop = () => {
    [document.getElementById("docs-scroll"), document.querySelector(".content-area")].forEach(el => { if(el) el.scrollTop=0; });
    window.scrollTo(0,0);
  };

  const go   = r => { setSelected(r); setPage("detail"); scrollTop(); };
  const back = () => { setSelected(null); setPage("home"); scrollTop(); };

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta=document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  }, []);

  useEffect(() => {
    const el  = document.querySelector(".content-area");
    const doc = document.getElementById("docs-scroll");
    if (el)  el.scrollTop  = 0;
    if (doc) doc.scrollTop = 0;
  }, [page]);

  return (
    <>
      <style>{GS}</style>
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:200 }}>
        <Navbar page={page} setPage={setPage}/>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200 }}>
        <Footer setPage={setPage}/>
      </div>
      <div className="content-area" style={{ position:"fixed", top:44, bottom:52, left:0, right:0, overflowY:"auto", background:C.bg }}>
        <PageShell key={page}>
          {page==="home"       && <HomePage onSelect={go} onUpload={()=>{setPage("upload");scrollTop();}}/>}
          {page==="detail"     && selected && <DetailPage rice={selected} onBack={back} onProfiles={()=>{
            // Se il rice appartiene all'utente loggato → apri la sua ProfilesPage, non la pubblica
            const isOwner = user && (user.username === selected.author || user.firstName === selected.author);
            if (isOwner) { setPage("profiles"); scrollTop(); }
            else { setProfilesAuthor(selected.author); setPage("pubprofiles"); scrollTop(); }
          }}/>}
          {page==="upload"     && (isLoggedIn ? <UploadPage trustLevel={trustLevel} onGoHome={()=>{setPage("home");scrollTop();}}/> : <UploadGate onLogin={()=>{window.location.href='/sign-in';}}/>)}
          {page==="docs"       && <DocsPage/>}
          {page==="terms"      && <TermsPage onNav={setPage}/>}
          {page==="privacy"    && <PrivacyPage onNav={setPage}/>}
          {page==="about"      && <AboutPage onProfiles={author=>{ setProfilesAuthor(author); setPage("pubprofiles"); scrollTop(); }}/>}
          {page==="profiles"    && <ProfilesPage onNav={setPage} onSelectRice={r=>{setSelected(r);setPage("detail");scrollTop();}}/>}
          {page==="pubprofiles" && <PublicProfilesPage author={profilesAuthor} onBack={()=>{setPage(selected?"detail":"home");scrollTop();}} onSelectRice={r=>{setSelected(r);setPage("detail");scrollTop();}}/>}
        </PageShell>
      </div>
    </>
  );
}
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

/* ── DATA ───────────────────────────────────────────────────────── */
const RICES = [
  { id:1, slug:"catppuccin-mocha-hypr", title:"catppuccin-mocha",  author:"velvet_void",   wm:"hyprland", distro:"arch",        terminal:"kitty",     shell:"zsh",    likes:847,  installs:2341, featured:true,  dots:["#cba6f7","#89b4fa","#a6e3a1","#f38ba8"], accent:"#cba6f7", bg:"#1e1e2e" },
  { id:2, slug:"gruvbox-material-i3",   title:"gruvbox-material",  author:"thermal_noise", wm:"i3wm",     distro:"void",        terminal:"alacritty", shell:"fish",   likes:612,  installs:1890, featured:false, dots:["#d4be98","#a9b665","#e78a4e","#d3869b"], accent:"#d4be98", bg:"#1d2021" },
  { id:3, slug:"tokyo-night-sway",      title:"tokyo-night",       author:"neonpulse",     wm:"sway",     distro:"nixos",       terminal:"foot",      shell:"nushell",likes:1203, installs:3102, featured:true,  dots:["#7aa2f7","#bb9af7","#9ece6a","#f7768e"], accent:"#7aa2f7", bg:"#1a1b26" },
  { id:4, slug:"nord-bspwm",            title:"nord-minimal",      author:"arctic_fox",    wm:"bspwm",    distro:"debian",      terminal:"wezterm",   shell:"zsh",    likes:489,  installs:1240, featured:false, dots:["#88c0d0","#81a1c1","#a3be8c","#bf616a"], accent:"#88c0d0", bg:"#2e3440" },
  { id:5, slug:"rose-pine-hypr",        title:"rose-pine",         author:"petal_arch",    wm:"hyprland", distro:"endeavouros", terminal:"kitty",     shell:"fish",   likes:934,  installs:2780, featured:false, dots:["#ebbcba","#c4a7e7","#9ccfd8","#f6c177"], accent:"#ebbcba", bg:"#191724" },
  { id:6, slug:"dracula-openbox",       title:"dracula-classic",   author:"vlad_wm",       wm:"openbox",  distro:"ubuntu",      terminal:"alacritty", shell:"bash",   likes:376,  installs:980,  featured:false, dots:["#bd93f9","#ff79c6","#50fa7b","#ffb86c"], accent:"#bd93f9", bg:"#282a36" },
];

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
`;

/* ── FOUNDER BADGE ───────────────────────────────────────────────── */
function FounderBadge() {
  return (
    <span
      className="badge-founder"
      style={{
        fontSize: 9,
        padding: "2px 9px",
        fontFamily: C.mono,
        letterSpacing: "0.08em",
        display: "inline-block",
        textTransform: "lowercase",
        userSelect: "none",
      }}
    >
      founder
    </span>
  );
}

/* ── PAGE SHELL ──────────────────────────────────────────────────── */
function PageShell({ children }) {
  const contentRef = useRef(null);
  const [lines, setLines] = useState(40);

  useEffect(() => {
    if (!contentRef.current) return;
    const measure = () => {
      const h = contentRef.current.offsetHeight;
      setLines(Math.max(20, Math.ceil(h / LINE_H)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{
        width: GUTTER, flexShrink: 0,
        background: C.gutter,
        borderRight: `1px solid ${C.border}`,
        alignSelf: "flex-start",
      }}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{
            height: LINE_H, display: "flex",
            alignItems: "center", justifyContent: "flex-end", paddingRight: 12,
          }}>
            <span style={{ fontSize: 11, color: C.lineNum, fontFamily: C.mono, userSelect: "none" }}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div ref={contentRef} style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ── DESKTOP THUMB ───────────────────────────────────────────────── */
function Thumb({ rice, h = 130 }) {
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
    <div className="card" onClick={()=>onClick(rice)} style={{
      border:`1px solid ${C.border}`, background:C.bgCard,
      cursor:"pointer", overflow:"hidden", transition:"all .2s",
      animation:`fadeUp .3s ease ${delay}s both`,
    }}>
      <Thumb rice={rice}/>
      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div className="ct" style={{ fontSize:12, color:C.white, fontWeight:500, marginBottom:3, transition:"color .15s" }}>
              <span style={{ color:C.fn }}>{rice.author}</span>
              <span style={{ color:C.gray2 }}>/</span>
              <span>{rice.title}</span>
            </div>
            <div style={{ fontSize:10, color:C.gray2 }}>
              <span style={{ color:C.kw }}>{rice.wm}</span>
              <span style={{ margin:"0 5px" }}>·</span>
              {rice.distro}
            </div>
          </div>
          {rice.featured && <span style={{ fontSize:9, color:C.string, border:`1px solid ${C.string}40`, padding:"1px 7px" }}>top</span>}
        </div>
        <div style={{ display:"flex", gap:14, paddingTop:8, borderTop:`1px solid ${C.border}`, fontSize:10, color:C.gray2 }}>
          <span>♥ {fmt(rice.likes)}</span>
          <span>↓ {fmt(rice.installs)}</span>
          <span style={{ marginLeft:"auto", color:C.gray3 }}>{rice.terminal}</span>
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
            <span style={{ color:C.fn }}>{r.author}</span>
            <span style={{ color:C.gray3 }}>/</span>
            {r.title}
          </span>
          <span style={{ color:C.kw }}>{r.wm}</span>
          <span>{r.distro}</span>
          <span>{r.shell}</span>
          <span>{fmt(r.likes)}</span>
          <span>{fmt(r.installs)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── DETAIL PAGE ─────────────────────────────────────────────────── */
function DetailPage({ rice, onBack, onProfile }) {
  const [tab, setTab]       = useState("install");
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
    {k:"code",   v:`cp -r dotfiles/waybar/    ~/.config/`},
    {k:"blank",  v:``},
    {k:"string", v:`echo "✓ ${rice.title} ready"`},
  ];
  const lc = k => k==="comment"?C.gray2:k==="kw"?C.kw:k==="string"?C.string:k==="blank"?"transparent":C.gray1;

  return (
    <div style={{ padding:"32px 32px 48px", animation:"slideR .2s ease" }}>
      <div style={{ fontSize:11, color:C.gray2, marginBottom:28, display:"flex", gap:6, alignItems:"center" }}>
        <span onClick={onBack} style={{ color:C.fn, cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".6"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >gallery</span>
        <span style={{ color:C.gray3 }}>/</span>
        <span style={{ color:C.gray2 }}>{rice.author}</span>
        <span style={{ color:C.gray3 }}>/</span>
        <span style={{ color:C.white }}>{rice.slug}</span>
      </div>

      <div style={{ marginBottom:28, paddingBottom:28, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ marginBottom:10 }}>
          <span style={{ fontFamily:C.display, fontSize:"clamp(28px,4vw,44px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em" }}>{rice.title}</span>
          {rice.featured && <span style={{ fontSize:10, color:C.string, fontFamily:C.mono, marginLeft:14 }}>★ featured</span>}
        </div>
        <div style={{ fontFamily:C.mono, fontSize:12, color:C.gray2, marginBottom:16, lineHeight:1.8 }}>
          <span style={{ color:C.gray3 }}>by </span>
          <span onClick={onProfile} style={{ color:C.fn, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.fn+"44" }}>@{rice.author}</span>
          <span style={{ color:C.gray3, margin:"0 10px" }}>·</span>
          <span style={{ color:C.kw }}>{rice.wm}</span>
          <span style={{ color:C.gray3, margin:"0 10px" }}>·</span>
          {rice.distro} · {rice.terminal} · {rice.shell}
        </div>
        <div style={{ display:"flex", gap:24 }}>
          {[{v:fmt(rice.likes),l:"likes"},{v:fmt(rice.installs),l:"installs"}].map(s=>(
            <div key={s.l}>
              <div style={{ fontSize:20, fontWeight:600, color:C.white, fontFamily:C.mono }}>{s.v}</div>
              <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div>
            <div style={{ fontSize:10, color:C.gray2, fontStyle:"italic", marginBottom:10 }}>// desktop preview</div>
            <div style={{ border:`1px solid ${C.border}`, overflow:"hidden" }}>
              <Thumb rice={rice} h={200}/>
              <div style={{ background:C.bgDeep, padding:"10px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:10 }}>
                {rice.dots.map((d,i)=>(
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <div style={{ width:20, height:20, background:d }}/>
                    <span style={{ fontSize:8, fontFamily:C.mono, color:C.gray3 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
              {["install","script","files"].map(t=>(
                <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:"7px 16px", background:"none", border:"none", borderBottom:tab===t?`1px solid ${C.white}`:"1px solid transparent", color:tab===t?C.white:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:-1, transition:"color .15s" }}>{t}</button>
              ))}
            </div>

            {tab==="install" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeIn .2s ease" }}>
                <div style={{ background:C.bgDeep, border:`1px solid ${C.border}` }}>
                  <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3 }}>$ bash — one-line install</div>
                  <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ color:C.gray3, fontSize:12 }}>$</span>
                    <code style={{ fontFamily:C.mono, fontSize:11, color:C.gray1, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{cmd}</code>
                    <button className="bs" onClick={copy} style={{ padding:"5px 14px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:10, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>{copied?"✓":"copy"}</button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[{k:"wm",v:rice.wm},{k:"distro",v:rice.distro},{k:"terminal",v:rice.terminal},{k:"shell",v:rice.shell}].map(r=>(
                    <div key={r.k} style={{ padding:"10px 12px", border:`1px solid ${C.border}`, background:C.bgDeep }}>
                      <div style={{ fontSize:9, color:C.gray3, marginBottom:4 }}>{r.k}</div>
                      <div style={{ fontSize:12, color:C.string, fontFamily:C.mono }}>"{r.v}"</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"10px 14px", border:`1px solid ${C.border}`, fontSize:11, color:C.gray2, lineHeight:1.8 }}>
                  <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>
                  backup automatico in <code style={{ color:C.fn }}>~/.rice-backup/</code>
                </div>
              </div>
            )}

            {tab==="script" && (
              <div style={{ background:C.bgDeep, border:`1px solid ${C.border}`, animation:"fadeIn .2s ease" }}>
                <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, display:"flex", justifyContent:"space-between" }}>
                  <span>install.sh</span><span style={{ color:C.fn }}>bash</span>
                </div>
                <div style={{ padding:"12px 16px" }}>
                  {script.map((line,i)=>(
                    <div key={i} style={{ display:"flex", gap:14, lineHeight:1.9 }}>
                      <span style={{ fontSize:10, color:C.gray3, userSelect:"none", minWidth:18, textAlign:"right" }}>{line.k!=="blank"?i+1:""}</span>
                      <span style={{ fontSize:11, fontFamily:C.mono, color:lc(line.k), fontStyle:line.k==="comment"?"italic":"normal" }}>
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
                  {d:0,n:rice.slug+"/",hi:true},
                  {d:1,n:"dotfiles/",hi:false},
                  {d:2,n:rice.wm+"/",hi:true},
                  {d:3,n:"config",hi:false},
                  {d:2,n:"waybar/",hi:false},
                  {d:2,n:rice.terminal+"/",hi:true},
                  {d:1,n:"wallpaper.png",hi:false},
                  {d:1,n:"."+rice.shell+"rc",hi:false},
                  {d:1,n:"install.sh",hi:true},
                  {d:1,n:"meta.json",hi:false},
                ].map((f,i)=>(
                  <div key={i} style={{ fontFamily:C.mono, fontSize:11, lineHeight:2, paddingLeft:f.d*14, color:f.hi?C.fn:C.gray2 }}>
                    {f.d>0&&<span style={{color:C.gray3}}>└── </span>}{f.n}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ border:`1px solid ${C.border}`, padding:16, background:C.bgDeep }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:10 }}>// AUTHOR</div>
            <div onClick={onProfile} style={{ fontSize:13, color:C.fn, marginBottom:2, fontFamily:C.mono, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.fn+"44" }}>@{rice.author}</div>
            <div style={{ fontSize:10, color:C.gray3, marginBottom:12 }}>{RICES.filter(r=>r.author===rice.author).length} rice</div>
            <button className="bg" style={{ width:"100%", padding:"7px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, transition:"all .15s" }}>follow</button>
          </div>
          <div style={{ border:`1px solid ${C.border}`, padding:16, background:C.bgDeep }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:10 }}>// COMPAT</div>
            {[{n:"arch",ok:true},{n:"debian",ok:true},{n:"fedora",ok:true},{n:"nixos",ok:false},{n:"void",ok:false}].map(c=>(
              <div key={c.n} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:11 }}>
                <span style={{ color:C.gray2 }}>{c.n}</span>
                <span style={{ color:c.ok?C.fn:C.gray3, fontFamily:C.mono, fontSize:10 }}>{c.ok?"ok":"—"}</span>
              </div>
            ))}
          </div>
          <button className="bs" style={{ padding:"9px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>♥ {fmt(rice.likes)}</button>
          <button className="bg" style={{ padding:"9px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>↓ .zip</button>
          <div style={{ border:`1px solid ${C.border}`, padding:"14px", background:C.bgDeep }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8 }}>// META.JSON</div>
            <pre style={{ fontSize:10, fontFamily:C.mono, color:C.gray3, lineHeight:1.9, margin:0 }}>
{`{
  `}<span style={{color:C.kw}}>"wm"</span>{`:    `}<span style={{color:C.string}}>"{rice.wm}"</span>{`,
  `}<span style={{color:C.kw}}>"shell"</span>{`: `}<span style={{color:C.string}}>"{rice.shell}"</span>{`,
  `}<span style={{color:C.kw}}>"deps"</span>{`: [
    `}<span style={{color:C.string}}>"{rice.terminal}"</span>{`
  ]
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── HOMEPAGE ────────────────────────────────────────────────────── */
function HomePage({ onSelect, onUpload }) {
  const [rices, setRices]     = useState(RICES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [wmFilter, setWmFilter] = useState("all");
  const [view, setView]       = useState("grid");

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('rice')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) setRices(data);
          setLoading(false);
        });
    });
  }, []);

  const wms = ["all","hyprland","sway","i3wm","bspwm","openbox"];
  const filtered = rices.filter(r => {
    const mf = wmFilter==="all" || r.wm===wmFilter;
    const ms = !search || (r.title||"").toLowerCase().includes(search.toLowerCase()) || (r.author||r.slug||"").toLowerCase().includes(search.toLowerCase());
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
        <div style={{ padding:"28px 32px 16px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:C.display, fontSize:"clamp(28px, 4vw, 48px)", fontWeight:900, color:C.white, letterSpacing:"-0.03em", lineHeight:1, textTransform:"uppercase" }}>
            RICESHARE
          </div>
        </div>
        <div style={{ padding:"24px 32px 36px", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:20 }}>
          <div style={{ maxWidth:420 }}>
            <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:20 }}>
              <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>
              Trova, Condividi, Personalizza.<br/>
              Il tuo Linux, in un click.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <a href="https://discord.gg/riceshare" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                <button className="bs" style={{ padding:"9px 22px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>community →</button>
              </a>
              <button className="bg" onClick={onUpload} style={{ padding:"9px 22px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>carica rice</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:28, fontFamily:C.mono }}>
            {[{v:loading?"...":String(rices.length),l:"rice"},{v:"12.4k",l:"installs"},{v:"847",l:"autori"}].map(s=>(
              <div key={s.l} style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:600, color:C.white }}>{s.v}</div>
                <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"10px clamp(12px,3vw,32px)", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center", background:C.bgDeep, flexWrap:"wrap" }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.border}`, padding:"7px 12px" }}>
          <span style={{ color:C.gray3, fontSize:11 }}>{">"}</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='search("rice or author")' style={{ background:"none", border:"none", outline:"none", color:C.white, fontSize:11, fontFamily:C.mono, width:"100%" }}/>
        </div>
        <div style={{ display:"flex", border:`1px solid ${C.border}`, overflow:"hidden" }}>
          {[["grid","▦"],["list","≡"]].map(([v,ic])=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:"7px 14px", border:"none", background:view===v?C.white:"transparent", color:view===v?"#111":C.gray3, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}>{ic}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 32px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center" }}>
        {wms.map(f=>(
          <button key={f} className="tb" onClick={()=>setWmFilter(f)} style={{ padding:"9px 14px", background:"none", border:"none", borderBottom:wmFilter===f?`1px solid ${C.white}`:"1px solid transparent", color:wmFilter===f?C.white:C.gray2, cursor:"pointer", fontSize:10, fontFamily:C.mono, marginBottom:-1, transition:"color .15s" }}>
            {f==="all"?"*.all":f}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:9, color:C.gray3 }}>{filtered.length} results</span>
      </div>

      <div style={{ padding:"24px 32px 48px" }}>
        {view==="grid" ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {filtered.map((r,i)=><RiceCard key={r.id} rice={r} onClick={onSelect} delay={i*.04}/>)}
          </div>
        ) : (
          <TableView rices={filtered} onClick={onSelect}/>
        )}
        {filtered.length===0 && (
          <div style={{ paddingTop:60, fontFamily:C.mono, fontSize:12, color:C.gray3, fontStyle:"italic" }}>
            // no results for "{search||wmFilter}"
          </div>
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
    const check = () => setIsMobile(ref.current.offsetWidth < breakpoint);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref, breakpoint]);
  return isMobile;
}

function Navbar({ page, setPage, isLoggedIn, onLogout }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const isMobile = useContainerWidth(navRef, 680);
  const NAV_LINKS = [["home","home"],["upload","upload"],["docs","docs"],["about","chi siamo"]];

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
                <button onClick={()=>setPage("profile")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, fontFamily:C.mono, color:C.fn, padding:0 }}>@{user?.username || user?.firstName || "user"}</button>
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
              <button onClick={()=>{setPage("profile");setMenuOpen(false);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:C.mono, color:C.fn }}>@{user?.username || user?.firstName || "user"}</button>
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
  const NAV = [
    { id:"getting-started", label:"getting started", n:"01" },
    { id:"upload-guide",    label:"carica rice",     n:"02" },
    { id:"install-system",  label:"install system",  n:"03" },
    { id:"api",             label:"api reference",   n:"04" },
    { id:"community",       label:"community",       n:"05" },
  ];

  const [active, setActive] = useState("getting-started");
  const sectionRefs = {
    "getting-started": useRef(null),
    "upload-guide":    useRef(null),
    "install-system":  useRef(null),
    "api":             useRef(null),
    "community":       useRef(null),
  };

  const scrollTo = (id) => {
    const el = sectionRefs[id]?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const ids = NAV.map(n => n.id);
    const onScroll = () => {
      const scroller = document.getElementById("docs-scroll");
      if (!scroller) return;
      const scrollTop = scroller.scrollTop;
      let current = ids[0];
      for (const id of ids) {
        const el = sectionRefs[id]?.current;
        if (!el) continue;
        if (el.offsetTop <= scrollTop + 80) current = id;
      }
      setActive(current);
    };
    const timer = setTimeout(() => {
      const scroller = document.getElementById("docs-scroll");
      if (!scroller) return;
      scroller.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }, 100);
    return () => {
      clearTimeout(timer);
      const scroller = document.getElementById("docs-scroll");
      if (scroller) scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  const Block = ({ children }) => (
    <div style={{ background:C.bgDeep, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:12, fontFamily:C.mono, fontSize:11, lineHeight:1.9, color:C.gray2 }}>{children}</div>
  );
  const Cmd = ({ children }) => (
    <div style={{ background:"#090909", border:`1px solid ${C.border}`, padding:"10px 14px", marginBottom:8, display:"flex", gap:8, alignItems:"center" }}>
      <span style={{ color:C.gray3, flexShrink:0 }}>$</span>
      <code style={{ fontFamily:C.mono, fontSize:11, color:C.gray1 }}>{children}</code>
    </div>
  );
  const Sec = ({ id, n, title, children }) => (
    <div ref={sectionRefs[id]} id={id} style={{ marginBottom:48 }}>
      <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginBottom:8 }}>// {String(n).padStart(2,"0")} — {id}</div>
      <div style={{ fontFamily:C.display, fontSize:"clamp(18px,2.5vw,26px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:20, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>{title}</div>
      {children}
    </div>
  );
  const P = ({ children }) => (
    <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:14 }}>
      <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>{children}
    </p>
  );
  const KV = ({ k, v }) => (
    <div style={{ display:"flex", gap:0, marginBottom:6 }}>
      <span style={{ fontSize:11, fontFamily:C.mono, color:C.kw, minWidth:160 }}>{k}</span>
      <span style={{ fontSize:11, fontFamily:C.mono, color:C.gray2 }}>{v}</span>
    </div>
  );
  const Badge = ({ label, color }) => (
    <span style={{ fontSize:9, border:`1px solid ${color}55`, color, padding:"1px 8px", fontFamily:C.mono, marginRight:6 }}>{label}</span>
  );
  const ApiRow = ({ method, path, desc }) => (
    <div style={{ display:"flex", gap:16, alignItems:"flex-start", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:9, fontFamily:C.mono, padding:"2px 8px", border:`1px solid ${method==="GET"?C.fn+"55":C.kw+"55"}`, color:method==="GET"?C.fn:C.kw, flexShrink:0, minWidth:40, textAlign:"center" }}>{method}</span>
      <code style={{ fontSize:11, fontFamily:C.mono, color:C.white, flex:"0 0 260px" }}>{path}</code>
      <span style={{ fontSize:11, fontFamily:C.mono, color:C.gray2 }}>{desc}</span>
    </div>
  );

  const NAV_W = 200;
  const NAVBAR_H = 44;
  const FOOTER_H = 52;

  return (
    <div style={{ height:"100%" }}>
      <div style={{ position:"fixed", top:NAVBAR_H, bottom:FOOTER_H, left:0, width:NAV_W, borderRight:`1px solid ${C.border}`, padding:"28px 0", overflowY:"auto", background:C.bg, zIndex:100 }}>
        <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", padding:"0 20px", marginBottom:20 }}>// DOCS</div>
        {NAV.map(n => {
          const isActive = active === n.id;
          const isPast   = NAV.findIndex(x => x.id === active) > NAV.findIndex(x => x.id === n.id);
          return (
            <button key={n.id} onClick={() => scrollTo(n.id)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 20px", background:"none", border:"none", borderLeft:isActive?`1px solid ${C.white}`:"1px solid transparent", cursor:"pointer", fontFamily:C.mono, transition:"border-color .2s" }}>
              <span style={{ fontSize:9, minWidth:16, color:isPast?C.fn:isActive?C.white:C.gray3, transition:"color .2s" }}>{isPast?"✓":n.n}</span>
              <span style={{ fontSize:11, color:isActive?C.white:isPast?C.gray2:C.gray3, transition:"color .2s" }}>{n.label}</span>
            </button>
          );
        })}
        <div style={{ margin:"20px 20px 0", height:1, background:C.border }}/>
        <div style={{ padding:"14px 20px 0" }}>
          <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8 }}>VERSIONE</div>
          <div style={{ fontSize:11, fontFamily:C.mono, color:C.string }}>v1.0.0</div>
          <div style={{ fontSize:10, fontFamily:C.mono, color:C.gray3, marginTop:4 }}>ultima modifica<br/>marzo 2026</div>
        </div>
      </div>

      <div id="docs-scroll" style={{ position:"absolute", top:0, bottom:0, left:NAV_W, right:0, overflowY:"auto", padding:"32px 40px 60px" }}>
        <Sec id="getting-started" n={1} title="Getting started">
          <P>Riceshare è una piattaforma per condividere e installare configurazioni Linux. Un rice è un insieme di dotfile che definisce l'aspetto e il comportamento del tuo desktop.</P>
          <P>Per installare qualsiasi rice dalla gallery, copia il comando dalla pagina del rice e incollalo nel tuo terminale.</P>
          <Cmd>curl -fsSL riceshare.dev/install/author/rice-name | bash</Cmd>
          <P>Lo script rileva automaticamente la tua distro, installa le dipendenze necessarie, fa un backup delle configurazioni esistenti e copia i file nelle posizioni corrette.</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// prerequisiti minimi</div>
            <KV k="curl"        v="≥ 7.0 — per scaricare lo script"/>
            <KV k="bash"        v="≥ 4.0 — per eseguirlo"/>
            <KV k="package mgr" v="pacman / apt / dnf / xbps"/>
            <KV k="connessione" v="internet attiva durante l'install"/>
          </Block>
          <P>Il backup delle tue configurazioni viene salvato automaticamente in <code style={{color:C.fn}}>~/.rice-backup/YYYYMMDD-HHMMSS/</code> prima di qualsiasi modifica.</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// sistema di trust</div>
            <div style={{ marginBottom:6 }}><Badge label="member" color={C.gray2}/>account nuovo — rice in revisione</div>
            <div style={{ marginBottom:6 }}><Badge label="trusted" color={C.kw}/>email verificata + 1 rice approvato</div>
            <div style={{ marginBottom:6 }}><Badge label="senior" color={C.fn}/>5 rice approvati + 100 installs</div>
            <div style={{ marginBottom:6 }}><Badge label="staff" color={C.string}/>50 segnalazioni corrette</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><FounderBadge/>membro fondatore del progetto</div>
          </Block>
        </Sec>

        <Sec id="upload-guide" n={2} title="Carica il tuo rice">
          <P>Per caricare un rice devi avere un account con email verificata. Vai alla pagina upload e segui i 5 step guidati.</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// struttura consigliata</div>
            {["dotfiles/","├── hypr/           ← config window manager","├── waybar/         ← status bar","│   ├── config","│   └── style.css","├── kitty/          ← terminale","wallpaper.png",".zshrc","install.sh          ← generato automaticamente","meta.json           ← generato automaticamente"].map((l,i)=>(
              <div key={i} style={{ color:l.includes("←")?C.gray3:l.endsWith("/")?C.fn:C.gray2, fontStyle:l.includes("←")?"italic":"normal" }}>{l}</div>
            ))}
          </Block>
          <P>Il file <code style={{color:C.fn}}>meta.json</code> e lo script <code style={{color:C.fn}}>install.sh</code> vengono generati automaticamente. Non devi scriverli a mano.</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// limiti per trust level</div>
            <KV k="member"  v="upload bloccato — verifica email"/>
            <KV k="trusted" v="max 2 upload/giorno · in revisione"/>
            <KV k="senior"  v="illimitato · pubblicazione diretta"/>
          </Block>
        </Sec>

        <Sec id="install-system" n={3} title="Come funziona l'install system">
          <P>Quando esegui il comando di installazione, lo script scaricato fa esattamente questo, in ordine:</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// flusso di installazione</div>
            {[
              {n:"01",c:C.kw,    v:"rileva la distro"},
              {n:"",  c:C.gray3, v:"    controlla /etc/os-release e i package manager"},
              {n:"02",c:C.kw,    v:"rileva WM / DE attivo"},
              {n:"",  c:C.gray3, v:"    legge $XDG_CURRENT_DESKTOP"},
              {n:"03",c:C.fn,    v:"backup automatico"},
              {n:"",  c:C.gray3, v:"    copia ~/.config/[wm] in ~/.rice-backup/"},
              {n:"04",c:C.fn,    v:"installa dipendenze"},
              {n:"",  c:C.gray3, v:"    usa il package manager rilevato"},
              {n:"05",c:C.fn,    v:"copia configurazioni in ~/.config/"},
              {n:"06",c:C.string,v:"post-install — ricarica WM"},
            ].map((l,i)=>(
              <div key={i} style={{ display:"flex", gap:12, lineHeight:1.85 }}>
                <span style={{ color:C.lineNum, fontSize:10, minWidth:20, textAlign:"right", userSelect:"none" }}>{l.n}</span>
                <span style={{ color:l.c }}>{l.v}</span>
              </div>
            ))}
          </Block>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// distro supportate</div>
            <KV k="arch / endeavouros" v="pacman -S --noconfirm --needed"/>
            <KV k="debian / ubuntu"    v="apt install -y"/>
            <KV k="fedora"             v="dnf install -y"/>
            <KV k="void linux"         v="xbps-install -y"/>
            <KV k="nixos"              v="genera home.nix — installazione manuale"/>
          </Block>
        </Sec>

        <Sec id="api" n={4} title="API reference">
          <P>Riceshare espone una API pubblica REST. Tutti gli endpoint sono in sola lettura senza autenticazione.</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// base url</div>
            <code style={{ color:C.string }}>https://riceshare.dev/api/v1</code>
          </Block>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8 }}>ENDPOINTS</div>
            <ApiRow method="GET" path="/rice"                    desc="lista tutti i rice — params: sort, wm, distro, limit"/>
            <ApiRow method="GET" path="/rice/:author/:slug"      desc="dettaglio singolo rice"/>
            <ApiRow method="GET" path="/rice/:author/:slug/meta" desc="meta.json del rice"/>
            <ApiRow method="GET" path="/install/:author/:slug"   desc="script bash di installazione"/>
            <ApiRow method="GET" path="/users/:username"         desc="profilo pubblico utente"/>
            <ApiRow method="GET" path="/trending"                desc="rice più installati questa settimana"/>
          </div>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// esempio risposta</div>
            {[`{`,`  "slug":     "catppuccin-mocha-hypr",`,`  "author":   "velvet_void",`,`  "wm":       "hyprland",`,`  "likes":    847,`,`  "installs": 2341,`,`  "deps":     ["hyprland","waybar","kitty"]`,`}`].map((l,i)=>(
              <div key={i} style={{ color:l.includes(":")?C.gray2:C.gray3 }}>{l}</div>
            ))}
          </Block>
        </Sec>

        <Sec id="community" n={5} title="Community & contributi">
          <P>Riceshare è open source. Il codice è su GitHub — contribuzioni, bug report e suggerimenti sono benvenuti.</P>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// link utili</div>
            <KV k="github"   v="github.com/riceshare"/>
            <KV k="discord"  v="discord.gg/riceshare"/>
            <KV k="issues"   v="github.com/riceshare/issues"/>
            <KV k="releases" v="github.com/riceshare/releases"/>
          </Block>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// code of conduct</div>
            <KV k="✓" v="rice originali o con licenza compatibile"/>
            <KV k="✓" v="dotfile funzionanti e testati"/>
            <KV k="✗" v="contenuti non sicuri o offensivi"/>
            <KV k="✗" v="script con codice malevolo"/>
          </Block>
          <Block>
            <div style={{ color:C.gray3, fontStyle:"italic", marginBottom:8 }}>// badge speciali</div>
            <div style={{ marginBottom:8 }}><Badge label="early.adopter" color={C.string}/>primi 100 utenti registrati</div>
            <div style={{ marginBottom:8 }}><Badge label="core.dev" color={C.kw}/>contributore al codice</div>
            <div style={{ marginBottom:8 }}><Badge label="featured" color={C.fn}/>rice in evidenza in homepage</div>
            <div style={{ marginBottom:8 }}><Badge label="verified" color={C.white}/>identità verificata dal team</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><FounderBadge/>membro fondatore del progetto</div>
          </Block>
        </Sec>
      </div>
    </div>
  );
}

/* ── UPLOAD GATE ─────────────────────────────────────────────────── */
function UploadGate({ onLogin }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px", overflow:"hidden" }}>
      <div style={{ maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// accesso richiesto</div>
        <div style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:16 }}>Devi essere registrato</div>
        <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"20px", marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:2, textAlign:"left" }}>
            <div style={{ marginBottom:8 }}><span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>per caricare un rice su Riceshare devi avere un account.</div>
            <div style={{ marginBottom:8 }}><span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>la registrazione è gratuita e richiede solo un'email valida.</div>
            <div><span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>dopo la verifica email ricevi il badge{" "}<span style={{ fontSize:9, border:`1px solid ${C.gray2}55`, color:C.gray2, padding:"1px 7px", fontFamily:C.mono }}>member</span>{" "}e puoi iniziare a caricare.</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button className="bs" onClick={onLogin} style={{ padding:"10px 28px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}>accedi / registrati →</button>
        </div>
        <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginTop:16 }}>// hai già un account? clicca il pulsante qui sopra</div>
      </div>
    </div>
  );
}

/* ── AUTH PAGE ───────────────────────────────────────────────────── */
function AuthPage({ onBack, onLogin }) {
  const [mode, setMode]         = useState("login");
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState({ email:"", password:"", confirm:"", username:"" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:null})); };

  const validateLogin = () => {
    const e = {};
    if (!form.email)    e.email    = "campo obbligatorio";
    if (!form.password) e.password = "campo obbligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSignup = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = "minimo 3 caratteri";
    if (!/^[a-z0-9_]+$/.test(form.username))        e.username = "solo lettere minuscole, numeri e _";
    if (!form.email || !form.email.includes("@"))   e.email    = "email non valida";
    if (!form.password || form.password.length < 8) e.password = "minimo 8 caratteri";
    if (form.confirm !== form.password)              e.confirm  = "le password non coincidono";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = () => {
    if (!validateLogin()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  const handleSignup = () => {
    if (!validateSignup()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 1200);
  };

  const inputStyle = (k) => ({
    width:"100%", background:C.bgDeep, border:`1px solid ${errors[k]?"#a05858":C.border}`,
    color:C.white, padding:"10px 14px", fontSize:12, fontFamily:C.mono, outline:"none", transition:"border-color .15s",
  });

  const Label = ({ k, label }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:9, color:errors[k]?"#a05858":C.gray3, letterSpacing:"0.1em", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
        <span>{label}</span>
        {errors[k] && <span style={{ fontStyle:"italic", textTransform:"none", letterSpacing:0 }}>// {errors[k]}</span>}
      </div>
    </div>
  );

  const pwdStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["","debole","media","buona","ottima"][pwdStrength];
  const strengthColor = ["",C.gray3,"#a07840",C.kw,C.fn][pwdStrength];

  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px", overflow:"hidden" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:28, padding:0, display:"flex", alignItems:"center", gap:6 }}
          onMouseEnter={e=>e.currentTarget.style.color=C.white}
          onMouseLeave={e=>e.currentTarget.style.color=C.gray2}
        >← torna alla gallery</button>

        {mode==="signup" && step===1 && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// verifica email</div>
            <div style={{ fontFamily:C.display, fontSize:28, fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:20 }}>Controlla la tua email</div>
            <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"20px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:2 }}>
                <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>abbiamo inviato un link di verifica a<br/>
                <span style={{ color:C.white }}>{form.email}</span>
              </div>
            </div>
            <button onClick={onBack} className="bs" style={{ width:"100%", padding:"11px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s" }}>torna alla home →</button>
          </div>
        )}

        {!(mode==="signup" && step===1) && (
          <div style={{ animation:"fadeIn .25s ease" }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>
              {mode==="login"?"// accedi al tuo account":"// crea il tuo account"}
            </div>
            <div style={{ fontFamily:C.display, fontSize:28, fontWeight:800, color:C.white, letterSpacing:"-0.025em", marginBottom:8 }}>
              {mode==="login"?"Login":"Registrati"}
            </div>
            <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, marginBottom:28 }}>
              {mode==="login"
                ? <><span style={{color:C.gray3}}>// </span>non hai un account? <span onClick={()=>{setMode("signup");setErrors({});}} style={{color:C.white,cursor:"pointer",textDecoration:"underline"}}>registrati</span></>
                : <><span style={{color:C.gray3}}>// </span>hai già un account? <span onClick={()=>{setMode("login");setErrors({});}} style={{color:C.white,cursor:"pointer",textDecoration:"underline"}}>accedi</span></>
              }
            </div>

            {mode==="signup" && (
              <div>
                <Label k="username" label="USERNAME"/>
                <div style={{ position:"relative", marginBottom:errors.username?6:14 }}>
                  <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:C.gray3, fontSize:12, fontFamily:C.mono, pointerEvents:"none" }}>@</span>
                  <input value={form.username} onChange={e=>set("username",e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="il_tuo_nome"
                    style={{...inputStyle("username"), paddingLeft:28}}
                    onFocus={e=>e.target.style.borderColor=errors.username?"#a05858":C.white}
                    onBlur={e=>e.target.style.borderColor=errors.username?"#a05858":C.border}
                  />
                </div>
                {errors.username && <div style={{ fontSize:10, color:"#a05858", fontFamily:C.mono, fontStyle:"italic", marginBottom:14 }}>{errors.username}</div>}
              </div>
            )}

            <div>
              <Label k="email" label="EMAIL"/>
              <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="nome@esempio.com" type="email"
                style={{...inputStyle("email"), marginBottom:errors.email?6:14}}
                onFocus={e=>e.target.style.borderColor=errors.email?"#a05858":C.white}
                onBlur={e=>e.target.style.borderColor=errors.email?"#a05858":C.border}
              />
              {errors.email && <div style={{ fontSize:10, color:"#a05858", fontFamily:C.mono, fontStyle:"italic", marginBottom:14 }}>{errors.email}</div>}
            </div>

            <div>
              <Label k="password" label="PASSWORD"/>
              <div style={{ position:"relative", marginBottom:errors.password?6:mode==="signup"?6:14 }}>
                <input value={form.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>setCapsLock(e.getModifierState?.("CapsLock"))}
                  placeholder={mode==="signup"?"minimo 8 caratteri":"••••••••"} type={showPwd?"text":"password"}
                  style={{...inputStyle("password"), paddingRight:44}}
                  onFocus={e=>e.target.style.borderColor=errors.password?"#a05858":C.white}
                  onBlur={e=>e.target.style.borderColor=errors.password?"#a05858":C.border}
                />
                <button onClick={()=>setShowPwd(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.gray3, cursor:"pointer", fontSize:10, fontFamily:C.mono, padding:0 }}>{showPwd?"hide":"show"}</button>
              </div>
              {errors.password && <div style={{ fontSize:10, color:"#a05858", fontFamily:C.mono, fontStyle:"italic", marginBottom:6 }}>{errors.password}</div>}
              {mode==="signup" && form.password && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", gap:3, marginBottom:4 }}>
                    {[1,2,3,4].map(i=>(
                      <div key={i} style={{ flex:1, height:2, background:i<=pwdStrength?strengthColor:C.border, transition:"background .2s" }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:strengthColor, fontFamily:C.mono, fontStyle:"italic" }}>{strengthLabel&&`// password ${strengthLabel}`}</div>
                </div>
              )}
            </div>

            {mode==="signup" && (
              <div>
                <Label k="confirm" label="CONFERMA PASSWORD"/>
                <input value={form.confirm} onChange={e=>set("confirm",e.target.value)} placeholder="ripeti la password" type={showPwd?"text":"password"}
                  style={{...inputStyle("confirm"), marginBottom:errors.confirm?6:14}}
                  onFocus={e=>e.target.style.borderColor=errors.confirm?"#a05858":C.white}
                  onBlur={e=>e.target.style.borderColor=errors.confirm?"#a05858":C.border}
                />
                {errors.confirm && <div style={{ fontSize:10, color:"#a05858", fontFamily:C.mono, fontStyle:"italic", marginBottom:14 }}>{errors.confirm}</div>}
              </div>
            )}

            {capsLock && <div style={{ fontSize:10, color:C.string, fontFamily:C.mono, fontStyle:"italic", marginBottom:14 }}>// caps lock attivo</div>}

            <button onClick={mode==="login"?handleLogin:handleSignup} className="bs"
              style={{ width:"100%", padding:"11px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:loading?"default":"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s", marginBottom:14, opacity:loading?0.6:1 }}>
              {loading ? <span style={{ fontStyle:"italic", color:C.gray2 }}>// autenticazione in corso...</span> : mode==="login"?"accedi →":"crea account →"}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div style={{ flex:1, height:1, background:C.border }}/><span style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>oppure</span><div style={{ flex:1, height:1, background:C.border }}/>
            </div>

            <button className="bg" style={{ width:"100%", padding:"11px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:14 }}>⌥</span>continua con GitHub
            </button>
            <button className="bg" style={{ width:"100%", padding:"11px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:12, fontFamily:C.mono, transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              <span style={{ fontSize:13 }}>G</span>continua con Google
            </button>

            {mode==="signup" && (
              <div style={{ fontSize:10, color:C.gray3, fontFamily:C.mono, fontStyle:"italic", marginTop:16, lineHeight:1.8, textAlign:"center" }}>
                // registrandoti accetti i <span style={{color:C.gray2,cursor:"pointer"}}>termini di servizio</span><br/>
                e la <span style={{color:C.gray2,cursor:"pointer"}}>privacy policy</span> di Riceshare
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PUBLIC PROFILE PAGE ─────────────────────────────────────────── */
function PublicProfilePage({ author, onBack, onSelectRice }) {
  const PROFILE = {
    username:   author,
    badge:      "senior",
    badgeColor: "#7a90a8",
    joined:     "marzo 2026",
    bio:        "linux enjoyer. catppuccin addict. hyprland forever.",
    email:      null,
    website:    "https://velvet.dev",
    installs:   5621,
    likes:      1847,
    isFounder:  author === "velvet_void",
  };

  const USER_RICES   = RICES.filter(r => r.author === author);
  const displayRices = USER_RICES.length > 0 ? USER_RICES : RICES.slice(0, 3);

  const BADGES = [
    { label:"senior",        color:"#7a90a8" },
    { label:"early.adopter", color:"#b5a07a" },
    { label:"top.rice",      color:"#7a9a7a" },
  ];

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 32px 48px" }}>

        <div style={{ fontSize:11, color:C.gray2, marginBottom:28, fontFamily:C.mono }}>
          <span onClick={onBack} style={{ color:C.fn, cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".6"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          >← indietro</span>
          <span style={{ color:C.gray3, margin:"0 8px" }}>/</span>
          <span style={{ color:C.gray2 }}>@{author}</span>
        </div>

        <div style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:"24px 28px", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:20 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
                <span style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.025em" }}>
                  @{PROFILE.username}
                </span>
                <span style={{ fontSize:9, border:`1px solid ${PROFILE.badgeColor}55`, color:PROFILE.badgeColor, padding:"2px 9px", fontFamily:C.mono }}>
                  {PROFILE.badge}
                </span>
                {PROFILE.isFounder && <FounderBadge/>}
              </div>
              <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, marginBottom:14, lineHeight:2 }}>
                <span style={{ fontStyle:"italic" }}>// </span>membro da {PROFILE.joined}
              </div>
              {PROFILE.bio && <div style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, marginBottom:14, lineHeight:1.8 }}>{PROFILE.bio}</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {PROFILE.email && <div style={{ fontSize:11, fontFamily:C.mono, color:C.gray2 }}><span style={{ color:C.gray3 }}>email  </span>{PROFILE.email}</div>}
                {PROFILE.website && (
                  <div style={{ fontSize:11, fontFamily:C.mono }}>
                    <span style={{ color:C.gray3 }}>web    </span>
                    <a href={PROFILE.website} target="_blank" rel="noreferrer" style={{ color:C.kw, textDecoration:"none" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity=".7"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                    >{PROFILE.website.replace("https://","")}</a>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16, alignItems:"flex-end" }}>
              <div style={{ display:"flex", gap:24 }}>
                {[{v:displayRices.length,l:"rice"},{v:fmt(PROFILE.installs),l:"installs"},{v:fmt(PROFILE.likes),l:"likes"}].map(s=>(
                  <div key={s.l} style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:600, color:C.white, fontFamily:C.mono }}>{s.v}</div>
                    <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end", alignItems:"center" }}>
                {BADGES.map(b=>(
                  <span key={b.label} style={{ fontSize:9, border:`1px solid ${b.color}44`, color:b.color, padding:"2px 8px", fontFamily:C.mono }}>{b.label}</span>
                ))}
                {PROFILE.isFounder && <FounderBadge/>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>
            // rice pubblicati — {displayRices.length}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
            {displayRices.map((r,i)=>(
              <div key={r.id} className="card" onClick={()=>onSelectRice(r)} style={{ border:`1px solid ${C.border}`, background:C.bgCard, cursor:"pointer", overflow:"hidden", transition:"all .2s", animation:`fadeUp .3s ease ${i*.06}s both` }}>
                <Thumb rice={r}/>
                <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div className="ct" style={{ fontSize:12, color:C.white, fontWeight:500, marginBottom:3, transition:"color .15s" }}>{r.title}</div>
                      <div style={{ fontSize:10, color:C.gray2 }}><span style={{ color:C.kw }}>{r.wm}</span><span style={{ margin:"0 5px" }}>·</span>{r.distro}</div>
                    </div>
                    {r.featured && <span style={{ fontSize:9, color:C.string, border:`1px solid ${C.string}40`, padding:"1px 7px" }}>top</span>}
                  </div>
                  <div style={{ display:"flex", gap:14, paddingTop:8, borderTop:`1px solid ${C.border}`, fontSize:10, color:C.gray2 }}>
                    <span>♥ {fmt(r.likes)}</span>
                    <span>↓ {fmt(r.installs)}</span>
                    <span style={{ marginLeft:"auto", color:C.gray3 }}>{r.terminal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PROFILE PAGE ────────────────────────────────────────────────── */
function ProfilePage({ onNav }) {
  const { user } = useUser();
  const [rices, setRices] = useState([]);
  const [tab, setTab]     = useState("rice");

  // Founder IDs — aggiungi qui gli user ID dei fondatori
  const FOUNDER_IDS = [];
  const isFounder = FOUNDER_IDS.includes(user?.id);

  useEffect(() => {
    if (!user) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase.from('rice').select('*').eq('author_id', user.id)
        .then(({ data }) => setRices(data || []));
    });
  }, [user]);

  if (!user) return null;

  const BADGES = [
    { label:"early.adopter", color:"#b5a07a" },
  ];

  return (
    <div style={{ padding:"32px 32px 48px", animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// profilo utente</div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:24, marginBottom:28, paddingBottom:24, borderBottom:`1px solid ${C.border}` }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ fontFamily:C.display, fontSize:"clamp(24px,4vw,36px)", fontWeight:800, color:C.white, letterSpacing:"-0.03em" }}>
                @{user.username || user.firstName}
              </span>
              <span style={{ fontSize:9, border:`1px solid #7a90a855`, color:"#7a90a8", padding:"2px 9px", fontFamily:C.mono }}>trusted</span>
              {isFounder && <FounderBadge/>}
            </div>
            <div style={{ fontSize:11, color:C.gray3, fontFamily:C.mono, marginBottom:16 }}>
              <span style={{ fontStyle:"italic" }}>// </span>membro da {new Date(user.createdAt).toLocaleDateString('it-IT',{month:'long',year:'numeric'})}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              {BADGES.map(b=>(
                <div key={b.label} style={{ fontSize:9, border:`1px solid ${b.color}44`, color:b.color, padding:"2px 9px", fontFamily:C.mono }}>{b.label}</div>
              ))}
              {isFounder && <FounderBadge/>}
            </div>
          </div>

          <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
            {[{v:rices.length,l:"rice"},{v:rices.reduce((a,r)=>a+(r.installs||0),0),l:"installs"},{v:rices.reduce((a,r)=>a+(r.likes||0),0),l:"likes"}].map(s=>(
              <div key={s.l} style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:600, color:C.white, fontFamily:C.mono }}>{s.v}</div>
                <div style={{ fontSize:9, color:C.gray3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
          {[["rice","rice pubblicati"],["settings","impostazioni"]].map(([t,label])=>(
            <button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:"8px 16px", background:"none", border:"none", borderBottom:tab===t?`1px solid ${C.white}`:"1px solid transparent", color:tab===t?C.white:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, marginBottom:-1 }}>{label}</button>
          ))}
        </div>

        {tab==="rice" && (
          <div style={{ animation:"fadeIn .2s ease" }}>
            {rices.length===0 ? (
              <div style={{ fontSize:12, color:C.gray3, fontFamily:C.mono, fontStyle:"italic" }}>// nessun rice pubblicato ancora</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
                {rices.map((r,i)=>(
                  <div key={r.id} style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:"14px", animation:`fadeUp .3s ease ${i*.06}s both` }}>
                    <div style={{ fontSize:12, color:C.white, marginBottom:4 }}>{r.title}</div>
                    <div style={{ fontSize:10, color:C.gray2 }}>{r.wm} · {r.distro}</div>
                  </div>
                ))}
              </div>
            )}
            <div onClick={()=>onNav("upload")} style={{ border:`1px dashed ${C.border}`, marginTop:12, cursor:"pointer", padding:"24px", textAlign:"center", fontSize:11, fontFamily:C.mono, color:C.gray3 }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHi}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
            >+ carica nuovo rice</div>
          </div>
        )}

        {tab==="settings" && (
          <div style={{ animation:"fadeIn .2s ease", maxWidth:480 }}>
            <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// impostazioni account</div>
            {[
              { label:"USERNAME", val:user.username||"", note:"modifica su Clerk" },
              { label:"EMAIL",    val:user.primaryEmailAddress?.emailAddress||"" },
            ].map(f=>(
              <div key={f.label} style={{ marginBottom:14 }}>
                <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
                  <span>{f.label}</span>
                  {f.note && <span style={{ fontStyle:"italic", textTransform:"none", letterSpacing:0 }}>// {f.note}</span>}
                </div>
                <input defaultValue={f.val} disabled style={{ width:"100%", background:C.bgDeep, border:`1px solid ${C.border}`, color:C.gray3, padding:"9px 12px", fontSize:12, fontFamily:C.mono, outline:"none", opacity:0.6 }}/>
              </div>
            ))}
            <div style={{ height:1, background:C.border, margin:"16px 0" }}/>
            <button onClick={()=>{ window.location.href='/sign-in'; }} style={{ padding:"9px 20px", border:`1px solid #a0585844`, background:"transparent", color:"#a05858", cursor:"pointer", fontSize:11, fontFamily:C.mono }}>logout</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ABOUT PAGE ──────────────────────────────────────────────────── */
function AboutPage({ onNav, onProfile }) {
  const TEAM = [
    { role:"founder & dev", name:"@velvet_void", bio:"linux enjoyer da 10 anni. hyprland addict. ha creato riceshare per risolvere il suo stesso problema.", isFounder:true },
    { role:"design & ux",   name:"@petal_arch",  bio:"obsessed with pixel-perfect interfaces. rose-pine forever.",                                           isFounder:false },
    { role:"community",     name:"@neonpulse",   bio:"gestisce il discord e cura i weekly picks. tokyo-night enjoyer.",                                       isFounder:false },
  ];

  const VALUES = [
    { k:"open source",     v:"tutto il codice di riceshare è pubblico su GitHub. niente lock-in, niente black box." },
    { k:"community first", v:"le decisioni sul prodotto vengono dalla community. il discord è il posto dove succede tutto." },
    { k:"qualità",         v:"ogni rice viene revisionato prima di apparire in gallery. preferiamo meno rice buoni a tanti mediocri." },
    { k:"semplicità",      v:"un comando per installare qualsiasi setup. questa è la promessa che non vogliamo mai tradire." },
  ];

  const TIMELINE = [
    { date:"gen 2026", text:"prima idea — un repo github con uno script bash" },
    { date:"feb 2026", text:"prima versione della gallery, 12 rice in totale" },
    { date:"mar 2026", text:"lancio pubblico v1.0.0 — early adopters aperto" },
    { date:"prossimo", text:"installer system, badge, marketplace temi" },
  ];

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 40px 60px" }}>
        <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:16 }}>// chi siamo</div>
        <div style={{ marginBottom:8 }}>
          <span style={{ fontFamily:C.display, fontSize:"clamp(28px,5vw,48px)", fontWeight:900, color:C.white, letterSpacing:"-0.04em", textTransform:"uppercase" }}>RICESHARE</span>
        </div>
        <div style={{ fontSize:13, color:C.gray2, fontFamily:C.mono, lineHeight:2, marginBottom:40, maxWidth:560 }}>
          <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>
          riceshare nasce dalla frustrazione di dover cercare dotfile su reddit, github e telegram per trovare quello che volevi. volevamo un posto unico, ben fatto, con un installer che funzionasse davvero. così l'abbiamo costruito.
        </div>

        <div style={{ height:1, background:C.border, marginBottom:40 }}/>

        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// i nostri valori</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,260px),1fr))", gap:12 }}>
            {VALUES.map((v,i)=>(
              <div key={v.k} style={{ border:`1px solid ${C.border}`, background:C.bgCard, padding:"18px 20px", animation:`fadeUp .3s ease ${i*.08}s both` }}>
                <div style={{ fontSize:12, color:C.white, fontFamily:C.mono, fontWeight:500, marginBottom:8 }}><span style={{ color:C.gray3 }}>// </span>{v.k}</div>
                <div style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{v.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// storia</div>
          {TIMELINE.map((t,i)=>(
            <div key={t.date} style={{ display:"flex", gap:20, paddingBottom:20, borderBottom:i<TIMELINE.length-1?`1px solid ${C.border}`:"none", marginBottom:20, animation:`fadeUp .3s ease ${i*.07}s both` }}>
              <div style={{ width:80, flexShrink:0 }}>
                <span style={{ fontSize:10, fontFamily:C.mono, color:t.date==="prossimo"?C.string:C.kw, fontStyle:t.date==="prossimo"?"italic":"normal" }}>{t.date}</span>
              </div>
              <div style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, lineHeight:1.9 }}>{t.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:20 }}>// il team</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {TEAM.map((m,i)=>(
              <div key={m.name} style={{ border:`1px solid ${m.isFounder?C.gold+"44":C.border}`, background:m.isFounder?`${C.gold}06`:C.bgCard, padding:"18px 20px", display:"flex", gap:20, alignItems:"flex-start", animation:`fadeUp .3s ease ${i*.08}s both`, transition:"border-color .2s" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                    <span onClick={()=>onProfile&&onProfile(m.name.replace("@",""))} style={{ fontSize:13, color:C.fn, fontFamily:C.mono, fontWeight:500, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.fn+"44" }}>{m.name}</span>
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
          <div style={{ fontSize:10, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// unisciti a noi</div>
          <div style={{ fontSize:13, color:C.white, fontFamily:C.mono, marginBottom:20, lineHeight:1.9 }}>
            riceshare è open source e guidato dalla community.<br/>
            <span style={{ color:C.gray3 }}>// </span>contribuisci su GitHub, entra nel Discord, o semplicemente carica il tuo rice.
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
function Footer() {
  return (
    <footer style={{ borderTop:`1px solid ${C.border}`, background:C.bgDeep, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"stretch", minHeight:52 }}>
        <div style={{ width:GUTTER, flexShrink:0, background:C.gutter, borderRight:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:14 }}>
          <span style={{ fontSize:10, color:C.lineNum, fontFamily:C.mono, userSelect:"none", fontStyle:"italic" }}>eof</span>
        </div>
        <div style={{ flex:1, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ fontFamily:C.display, fontSize:13, fontWeight:800, color:C.white, letterSpacing:"-0.02em", textTransform:"uppercase" }}>Riceshare</span>
            <span style={{ fontSize:10, fontFamily:C.mono, color:C.gray3 }}>v1.0.0</span>
            <span style={{ fontSize:10, fontFamily:C.mono, color:C.gray3, fontStyle:"italic" }}>// open source</span>
          </div>
          <div style={{ display:"flex", gap:20, fontSize:10, fontFamily:C.mono, color:C.gray2 }}>
            {[["github","#"],["docs","#"],["discord","#"]].map(([label,href])=>(
              <a key={label} href={href} style={{ color:C.gray2, textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e=>e.currentTarget.style.color=C.white}
                onMouseLeave={e=>e.currentTarget.style.color=C.gray2}
              >{label}</a>
            ))}
          </div>
          <span style={{ fontSize:10, fontFamily:C.mono, color:C.gray3 }}>© 2025 riceshare</span>
        </div>
      </div>
    </footer>
  );
}

/* ── UPLOAD SIDEBAR ─────────────────────────────────────────────── */
function UploadSidebar({ step, rice, installCmd }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(installCmd).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const pct = Math.round((step/4)*100);
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
          <span>// avanzamento</span>
          <span style={{ color:pct===100?C.fn:C.gray3 }}>{pct}%</span>
        </div>
        <div style={{ padding:"14px" }}>
          <div style={{ height:2, background:C.border, marginBottom:14, position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:pct+"%", background:pct===100?C.fn:C.kw, transition:"width .4s ease" }}/>
          </div>
          {["info base","sistema","componenti","dipendenze","file"].map((s,i)=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:14, height:14, borderRadius:2, flexShrink:0, border:`1px solid ${i<step?C.fn:i===step?C.kw:C.gray3}`, background:i<step?C.fn+"22":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {i<step&&<span style={{ fontSize:8, color:C.fn }}>✓</span>}
                {i===step&&<span style={{ fontSize:7, color:C.kw }}>●</span>}
              </div>
              <span style={{ fontSize:11, fontFamily:C.mono, color:i<step?C.fn:i===step?C.white:C.gray3 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${rice.name?C.borderHi:C.border}`, background:C.bgDeep, transition:"border-color .3s" }}>
        <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// comando generato</div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:rice.wm?12:0 }}>
            <span style={{ color:C.gray3, fontSize:12, flexShrink:0 }}>$</span>
            <code style={{ fontSize:10, fontFamily:C.mono, color:rice.name?C.gray1:C.gray3, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0, transition:"color .3s", fontStyle:rice.name?"normal":"italic" }}>{installCmd}</code>
            {rice.name && <button onClick={copy} className="bs" style={{ padding:"3px 10px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:9, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>{copied?"✓":"copia"}</button>}
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
        <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3, letterSpacing:"0.08em" }}>// trending questa settimana</div>
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
  return (
    <button onClick={onClick} style={{ padding:"3px 12px", fontSize:11, fontFamily:C.mono, cursor:"pointer", border:"1px solid", borderColor:active?(color||C.white):C.border, background:active?(color?color+"18":"#ffffff10"):"transparent", color:active?(color||C.white):C.gray2, transition:"all .15s", borderRadius:2 }}>{label}</button>
  );
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

function UploadPage({ trustLevel = 1 }) {
  const { user } = useUser();
  const [step, setStep]   = useState(0);
  const [rice, setRice]   = useState({ name:"", author:"", description:"", wm:"", distros:[], terminal:"", shell:"", deps:[], components:{ waybar:false, rofi:false, dunst:false, wallpaper:true, fonts:true, neovim:false } });
  const [depInput, setDepInput] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [done, setDone]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef(null);

  const set  = (k,v) => setRice(r=>({...r,[k]:v}));
  const setC = (k,v) => setRice(r=>({...r,components:{...r.components,[k]:v}}));
  const addDep = d => { if(d&&!rice.deps.includes(d)) set("deps",[...rice.deps,d]); setDepInput(""); };
  const remDep = d => set("deps",rice.deps.filter(x=>x!==d));
  const addFiles = inc => { const arr=Array.from(inc); setFiles(prev=>{ const n=new Set(prev.map(f=>f.name)); return [...prev,...arr.filter(f=>!n.has(f.name))]; }); };
  const remFile  = n => setFiles(f=>f.filter(x=>x.name!==n));
  const fmtSize  = b => b<1024?b+" B":b<1048576?(b/1024).toFixed(1)+" KB":(b/1048576).toFixed(1)+" MB";
  const fileTag  = name => {
    if(/\.(png|jpg|jpeg|webp)$/i.test(name)) return {l:"img",c:C.string};
    if(/\.(ttf|otf|woff2?)$/i.test(name))    return {l:"fnt",c:C.kw};
    if(/\.(conf|toml|yaml|lua|sh|zsh|fish|json|ini)$/i.test(name)) return {l:"cfg",c:C.fn};
    return {l:"bin",c:C.gray2};
  };

  const installCmd = rice.name&&rice.author
    ? `curl -fsSL riceshare.dev/install/@you/${rice.name||"rice"} | bash`
    : "// compila il form per generare il comando";

  const STEPS = ["info","sistema","componenti","dipendenze","file"];
  const canNext = [
    rice.name && (rice.description.length===0||(rice.description.length>=50&&rice.description.length<=500)),
    !!rice.wm, true, true, files.length>0,
  ][step];

  const labelStyle = { fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8, display:"block" };
  const inputStyle = { width:"100%", background:C.bgDeep, border:`1px solid ${C.border}`, color:C.white, padding:"8px 12px", fontSize:12, fontFamily:C.mono, outline:"none", transition:"border-color .15s" };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('rice').insert({
        title:       rice.name,
        slug:        `${user.username||user.id}-${rice.name}`.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
        author_id:   user.id,
        description: rice.description,
        wm:          rice.wm,
        distro:      rice.distros?.[0]||'',
        terminal:    rice.terminal,
        shell:       rice.shell,
        deps:        rice.deps,
        status:      trustLevel<=1?'pending':'approved',
      });
    } catch(e) { console.error(e); }
    setPublishing(false);
    setDone(true);
  };

  if (done) return (
    <div style={{ animation:"fadeIn .3s ease", flex:1, display:"flex", flexDirection:"column", overflow:"hidden", justifyContent:"center", padding:"40px 32px 48px" }}>
      <div style={{ maxWidth:560 }}>
        <div style={{ fontSize:11, color:C.fn, fontFamily:C.mono, marginBottom:16, fontStyle:"italic" }}>// upload completato</div>
        <div style={{ fontFamily:C.display, fontSize:"clamp(24px,3vw,36px)", fontWeight:800, color:C.white, letterSpacing:"-0.02em", marginBottom:24 }}>{rice.name} pubblicato.</div>
        <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, marginBottom:20 }}>
          <div style={{ padding:"6px 14px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3 }}>install command</div>
          <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ color:C.gray3 }}>$</span>
            <code style={{ fontFamily:C.mono, fontSize:11, color:C.gray1, flex:1 }}>{installCmd}</code>
          </div>
        </div>
        <p style={{ fontSize:11, color:C.gray2, fontFamily:C.mono, lineHeight:1.9, marginBottom:24 }}>
          <span style={{ color:C.gray3, fontStyle:"italic" }}>// </span>
          il tuo rice è ora visibile nella gallery.<br/>chiunque può installarlo con il comando sopra.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button className="bs" onClick={()=>{ setDone(false); setStep(0); setRice({name:"",author:"",description:"",wm:"",distros:[],terminal:"",shell:"",deps:[],components:{waybar:false,rofi:false,dunst:false,wallpaper:true,fonts:true,neovim:false}}); setFiles([]); }} style={{ padding:"9px 22px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.white, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>carica un altro →</button>
          <button className="bg" style={{ padding:"9px 22px", border:`1px solid ${C.border}`, background:"transparent", color:C.gray2, cursor:"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>vedi nella gallery</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ animation:"fadeIn .2s ease", flex:1, display:"flex", flexDirection:"column", overflow:"hidden", padding:"32px 32px 48px" }}>
      {trustLevel<=1 && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 16px", border:`1px solid ${C.string}44`, background:`${C.string}08`, marginBottom:16, fontSize:11, fontFamily:C.mono, color:C.string }}>
          <span style={{ fontSize:9, border:`1px solid ${C.string}55`, padding:"1px 7px", flexShrink:0 }}>member</span>
          <span style={{ color:C.gray2 }}><span style={{ fontStyle:"italic", color:C.gray3 }}>// </span>il tuo rice andrà in revisione prima di apparire in gallery — livello <span style={{ color:C.string }}>trusted</span> richiede 1 rice approvato e account registrato</span>
        </div>
      )}
      <div style={{ display:"flex", flex:1, minHeight:0, overflow:"hidden", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:600, overflowY:"auto", height:"100%" }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", fontFamily:C.mono, marginBottom:12 }}>// carica il tuo rice</div>
          <div style={{ fontFamily:C.display, fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.white, letterSpacing:"-0.02em", marginBottom:16 }}>Nuovo rice</div>
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
            <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// informazioni base</div>
            <div>
              <span style={labelStyle}>NOME DEL RICE *</span>
              <input value={rice.name} onChange={e=>set("name",e.target.value)} placeholder="es. catppuccin-mocha-hypr" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <span style={labelStyle}>DESCRIZIONE</span>
              <textarea value={rice.description} onChange={e=>set("description",e.target.value.slice(0,500))} placeholder="descrivi brevemente il tuo rice..."
                style={{...inputStyle, resize:"none", height:96, lineHeight:1.7}}
                onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}
              />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:10, fontFamily:C.mono }}>
                <span style={{ color:rice.description.length>0&&rice.description.length<50?C.string:C.gray3 }}>
                  {rice.description.length>0&&rice.description.length<50?`// minimo 50 caratteri (${50-rice.description.length} mancanti)`:rice.description.length>=50?<span style={{color:C.fn}}>// ok</span>:"// min 50 · max 500 caratteri"}
                </span>
                <span style={{ color:rice.description.length>=450?C.string:C.gray3 }}>{rice.description.length}/500</span>
              </div>
            </div>
            {(rice.name||rice.author) && (
              <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, animation:"fadeIn .2s ease" }}>
                <div style={{ padding:"5px 12px", borderBottom:`1px solid ${C.border}`, fontSize:9, color:C.gray3 }}>anteprima comando</div>
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
            <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// sistema di destinazione</div>
            <div>
              <span style={labelStyle}>WINDOW MANAGER / DE *</span>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{WMS.map(w=><Chip key={w} label={w} active={rice.wm===w} onClick={()=>set("wm",w)}/>)}</div>
            </div>
            <div>
              <span style={labelStyle}>DISTRO COMPATIBILI</span>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{DISTROS.map(d=><Chip key={d} label={d} active={rice.distros.includes(d)} onClick={()=>set("distros",rice.distros.includes(d)?rice.distros.filter(x=>x!==d):[...rice.distros,d])}/>)}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><span style={labelStyle}>TERMINALE</span><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{TERMINALS.map(t=><Chip key={t} label={t} active={rice.terminal===t} onClick={()=>set("terminal",t)}/>)}</div></div>
              <div><span style={labelStyle}>SHELL</span><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{SHELLS.map(s=><Chip key={s} label={s} active={rice.shell===s} onClick={()=>set("shell",s)}/>)}</div></div>
            </div>
          </div>
        )}

        {step===2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeIn .2s ease" }}>
            <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// componenti inclusi nel rice</div>
            <p style={{ fontSize:11, color:C.gray2, lineHeight:1.8 }}><span style={{ color:C.gray3 }}>// </span>seleziona i componenti che hai configurato.</p>
            {Object.entries({ waybar:"Waybar — status bar", rofi:"Rofi / Wofi — launcher", dunst:"Dunst — notifiche", wallpaper:"Wallpaper", fonts:"Font personalizzati", neovim:"Neovim config" }).map(([k,label])=>(
              <SToggle key={k} label={label} checked={rice.components[k]} onChange={v=>setC(k,v)}/>
            ))}
          </div>
        )}

        {step===3 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .2s ease" }}>
            <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// dipendenze da installare</div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={depInput} onChange={e=>setDepInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDep(depInput.trim())} placeholder="nome pacchetto..."
                style={{...inputStyle, flex:1}} onFocus={e=>e.target.style.borderColor=C.white} onBlur={e=>e.target.style.borderColor=C.border}/>
              <button onClick={()=>addDep(depInput.trim())} className="bs" style={{ padding:"8px 16px", border:`1px solid ${C.borderHi}`, background:"transparent", color:C.gray1, cursor:"pointer", fontSize:11, fontFamily:C.mono, flexShrink:0, transition:"all .15s" }}>+ add</button>
            </div>
            <div>
              <span style={labelStyle}>SUGGERITI</span>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{DEPS_SUG.filter(d=>!rice.deps.includes(d)).map(d=><Chip key={d} label={d} active={false} onClick={()=>addDep(d)}/>)}</div>
            </div>
            {rice.deps.length>0 && (
              <div>
                <span style={labelStyle}>SELEZIONATI — {rice.deps.length} pacchetti</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {rice.deps.map(d=>(
                    <button key={d} onClick={()=>remDep(d)} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 10px", fontSize:11, fontFamily:C.mono, cursor:"pointer", border:`1px solid ${C.fn}44`, background:C.fn+"10", color:C.fn, transition:"all .15s" }}>{d} <span style={{ opacity:.5 }}>×</span></button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step===4 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .2s ease" }}>
            <div style={{ fontSize:11, color:C.gray3, fontStyle:"italic", marginBottom:4 }}>// carica i file del rice</div>
            <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}} onClick={()=>fileRef.current?.click()}
              style={{ border:`1px dashed ${dragging?C.white:C.border}`, padding:"36px 24px", textAlign:"center", cursor:"pointer", background:dragging?"#ffffff06":"transparent", transition:"all .2s" }}>
              <div style={{ fontSize:20, color:C.gray3, marginBottom:10 }}>+</div>
              <p style={{ fontSize:12, color:C.gray2, fontFamily:C.mono, marginBottom:4 }}>trascina i file qui, oppure <span style={{ color:C.white }}>sfoglia</span></p>
              <p style={{ fontSize:10, color:C.gray3, fontFamily:C.mono }}>.conf .toml .lua .sh .png .jpg .ttf — qualsiasi file di config</p>
              <input ref={fileRef} type="file" multiple style={{ display:"none" }} onChange={e=>addFiles(e.target.files)}/>
            </div>
            <div style={{ border:`1px solid ${C.border}`, background:C.bgDeep, padding:"14px 16px" }}>
              <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:10 }}>STRUTTURA CONSIGLIATA</div>
              <pre style={{ fontSize:11, fontFamily:C.mono, color:C.gray2, lineHeight:1.9, margin:0 }}>{`dotfiles/\n├── ${rice.wm||"wm"}/\n│   └── config\n├── waybar/\n│   ├── config\n│   └── style.css\n├── ${rice.terminal||"terminal"}/\nwallpaper.png\n.${rice.shell||"shell"}rc\ninstall.sh`}</pre>
            </div>
            {files.length>0 && (
              <div>
                <div style={{ fontSize:9, color:C.gray3, letterSpacing:"0.1em", marginBottom:8 }}>{files.length} FILE · {fmtSize(files.reduce((a,f)=>a+f.size,0))} totali</div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {files.map(f=>{ const tag=fileTag(f.name); return (
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

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:32, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
          <button onClick={()=>setStep(s=>s-1)} disabled={step===0} className="bg" style={{ padding:"9px 20px", border:`1px solid ${C.border}`, background:"transparent", color:step===0?C.gray3:C.gray2, cursor:step===0?"default":"pointer", fontSize:11, fontFamily:C.mono, transition:"all .15s" }}>← indietro</button>
          <button onClick={()=>step<4?setStep(s=>s+1):handlePublish()} disabled={!canNext} className={canNext?"bs":""} style={{ padding:"9px 24px", border:`1px solid ${canNext?C.borderHi:C.border}`, background:"transparent", color:canNext?C.white:C.gray3, cursor:canNext?"pointer":"default", fontSize:11, fontFamily:C.mono, fontWeight:500, transition:"all .15s" }}>
            {step<4?"avanti →":publishing?"pubblicazione...":"pubblica rice"}
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
  const [profileAuthor, setProfileAuthor] = useState(null);
  const { user } = useUser();
  const isLoggedIn = !!user;
  const trustLevel = 1;

  const scrollTop = () => {
    const els = [document.getElementById("docs-scroll"), document.querySelector("[style*='position: fixed'][style*='overflow']")];
    els.forEach(el => { if (el) el.scrollTop = 0; });
    window.scrollTo(0, 0);
  };

  const go     = r => { setSelected(r); setPage("detail"); scrollTop(); };
  const back   = () => { setSelected(null); setPage("home"); scrollTop(); };
  const login  = () => { setPage("home"); scrollTop(); };
  const logout = () => { scrollTop(); };

  const NAVBAR_H = 44;
  const FOOTER_H = 52;

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  }, []);

  useEffect(() => {
    const el = document.querySelector(".content-area");
    if (el) el.scrollTop = 0;
    const docs = document.getElementById("docs-scroll");
    if (docs) docs.scrollTop = 0;
  }, [page]);

  return (
    <>
      <style>{GS}</style>

      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:200 }}>
        <Navbar page={page} setPage={setPage} isLoggedIn={isLoggedIn} onLogout={logout}/>
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200 }}>
        <Footer/>
      </div>

      <div className="content-area" style={{ position:"fixed", top:NAVBAR_H, bottom:FOOTER_H, left:0, right:0, overflowY:"auto", background:C.bg, display:"flex", flexDirection:"column" }}>
        <PageShell>
          {page==="home"       && <HomePage onSelect={go} onUpload={()=>{setPage("upload");scrollTop();}}/>}
          {page==="detail"     && selected && <DetailPage rice={selected} onBack={back} onProfile={()=>{ setProfileAuthor(selected.author); setPage("pubprofile"); scrollTop(); }}/>}
          {page==="upload"     && (isLoggedIn ? <UploadPage trustLevel={trustLevel}/> : <UploadGate onLogin={()=>{window.location.href='/sign-in';scrollTop();}}/>)}
          {page==="auth"       && <AuthPage onBack={()=>{setPage("home");scrollTop();}} onLogin={login}/>}
          {page==="docs"       && <DocsPage/>}
          {page==="about"      && <AboutPage onProfile={author=>{ setProfileAuthor(author); setPage("pubprofile"); scrollTop(); }}/>}
          {page==="profile"    && <ProfilePage onNav={setPage}/>}
          {page==="pubprofile" && <PublicProfilePage author={profileAuthor} onBack={()=>{setPage("detail");scrollTop();}} onSelectRice={r=>{setSelected(r);setPage("detail");scrollTop();}}/>}
        </PageShell>
      </div>
    </>
  );
}
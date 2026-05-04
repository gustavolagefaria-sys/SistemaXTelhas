"use client";

import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href:"/",          label:"Dashboard",         icon:DashIcon  },
  { href:"/despesas",  label:"Despesas",           icon:DespIcon  },
  { href:"/pedidos",   label:"Pedidos emitidos",   icon:PedIcon   },
  { href:"/relatorio", label:"Resumo Financeiro",  icon:RelIcon   },
];
const NAV_CONFIG = [
  { href:"/tipos-despesa", label:"Tipos de despesa", icon:TipoIcon },
];
const NAV_ADMIN = [
  { href:"/auditoria", label:"Log de atividades",  icon:LogIcon  },
];

/* ── ícones ─────────────────────────────────────────────────────────────────── */
function DashIcon({ s=18,c="currentColor" }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/></svg>; }
function DespIcon({ s=18,c="currentColor" }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 7h20M2 7a2 2 0 012-2h16a2 2 0 012 2M2 7v11a2 2 0 002 2h16a2 2 0 002-2V7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12v4M10 14h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function PedIcon({ s=18,c="currentColor" }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" stroke={c} strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function RelIcon({ s=18,c="currentColor" }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function TipoIcon({ s=16,c="currentColor" }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function LogIcon({ s=16,c="currentColor" }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke={c} strokeWidth="1.8"/><path d="M9 12h6M9 16h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function MenuIcon(){ return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function CloseIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function LogoutIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

function LogoXTelhas({ height=48 }) {
  return (
    <svg height={height} viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 38 L60 8 L100 38" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <text x="108" y="46" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="34" fill="white">X</text>
      <text x="108" y="62" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="14" fill="#C0242C" letterSpacing="3">TELHAS</text>
      <text x="108" y="74" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="8" fill="rgba(255,255,255,0.4)" letterSpacing="1">FERRO E AÇO</text>
    </svg>
  );
}

export default function SidebarShell({ children }) {
  const [open,    setOpen]    = useState(false);
  const [path,    setPath]    = useState("/");
  const [usuario, setUsuario] = useState(null);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    setPath(window.location.pathname);
    // buscar dados do usuário logado
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUsuario(d); })
      .catch(() => {});
  }, []);

  function isActive(href) {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  }

  async function handleLogout() {
    setLogging(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  const isAdmin = usuario?.perfil === "ADMIN";
  const fechar  = () => setOpen(false);

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay${open?" visible":""}`} onClick={fechar}/>

      <aside className={`sidebar${open?" open":""}`}>
        <div className="sidebar-logo"><LogoXTelhas height={50}/></div>

        <nav className="sidebar-nav" onClick={fechar}>
          {NAV_ITEMS.map(({ href,label,icon:Icon }) => (
            <a key={href} href={href} className={`nav-item${isActive(href)?" active":""}`}>
              <Icon s={18} c={isActive(href)?"#fff":"#94a3b8"}/>
              {label}
            </a>
          ))}

          <div className="nav-divider"/>

          {NAV_CONFIG.map(({ href,label,icon:Icon }) => (
            <a key={href} href={href} className={`nav-item nav-item--sm${isActive(href)?" active":""}`}>
              <Icon s={15} c={isActive(href)?"#fff":"#475569"}/>
              {label}
            </a>
          ))}

          {/* auditoria — sempre visível, a página controla o acesso */}
          <div className="nav-divider"/>
          {NAV_ADMIN.map(({ href,label,icon:Icon }) => (
            <a key={href} href={href} className={`nav-item nav-item--sm${isActive(href)?" active":""}`}>
              <Icon s={15} c={isActive(href)?"#fff":"#475569"}/>
              {label}
            </a>
          ))}
        </nav>

        {/* usuário + logout */}
        <div className="sidebar-footer">
          {usuario && (
            <div style={{ marginBottom:12, padding:"10px 4px", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
              <div style={{ fontSize:11, color:"#475569", marginBottom:2 }}>Logado como</div>
              <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {usuario.nome}
              </div>
              <div style={{ fontSize:10, color:"#334155", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {usuario.email}
              </div>
              {isAdmin && (
                <span style={{ display:"inline-block", marginTop:4, fontSize:9, background:"#C0242C", color:"#fff", borderRadius:4, padding:"1px 6px", fontWeight:700, letterSpacing:.5 }}>
                  ADMIN
                </span>
              )}
            </div>
          )}

          <button onClick={handleLogout} disabled={logging} style={{
            width:"100%", display:"flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)",
            borderRadius:8, padding:"9px 12px", color:"#94a3b8", cursor:"pointer",
            fontSize:13, fontWeight:500, fontFamily:"'Inter',sans-serif",
            transition:"background .15s, color .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(192,36,44,.15)"; e.currentTarget.style.color="#fca5a5"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.05)"; e.currentTarget.style.color="#94a3b8"; }}
          >
            <LogoutIcon/>
            {logging ? "Saindo…" : "Sair"}
          </button>

          <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontSize:10, color:"#334155", lineHeight:1.7 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", letterSpacing:1 }}>v1.0.0</span><br/>
              Desenvolvido por<br/>
              <span style={{ color:"#64748b", fontWeight:700 }}>MGL Tecnologia</span>
            </div>
            <a href="tel:+5531988984908" style={{ display:"block", marginTop:3, fontSize:11, color:"#C0242C", fontWeight:700, textDecoration:"none" }}>
              (31) 98898-4908
            </a>
          </div>
        </div>
      </aside>

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <header className="topbar">
          <div className="topbar-logo"><LogoXTelhas height={28}/></div>
          <button className="topbar-menu-btn" onClick={() => setOpen(o=>!o)} aria-label="Menu">
            {open ? <CloseIcon/> : <MenuIcon/>}
          </button>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

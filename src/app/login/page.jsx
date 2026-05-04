"use client";

import { useState, useEffect } from "react";

/* ── validação de senha forte ───────────────────────────────────────────────── */
function analisarSenha(senha) {
  return {
    tamanho:   senha.length >= 8,
    letra:     /[a-zA-Z]/.test(senha),
    numero:    /[0-9]/.test(senha),
    especial:  /[^a-zA-Z0-9]/.test(senha),
  };
}
function senhaForte(s) {
  const r = analisarSenha(s);
  return r.tamanho && r.letra && r.numero && r.especial;
}
function forcaLabel(senha) {
  if (!senha) return null;
  const r  = analisarSenha(senha);
  const ok = Object.values(r).filter(Boolean).length;
  if (ok <= 1) return { label:"Muito fraca", cor:"#ef4444", pct:25 };
  if (ok === 2) return { label:"Fraca",       cor:"#f97316", pct:50 };
  if (ok === 3) return { label:"Boa",          cor:"#eab308", pct:75 };
  return          { label:"Forte",         cor:"#22c55e", pct:100 };
}

/* ── ícones ─────────────────────────────────────────────────────────────────── */
function EyeOpen()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function EyeOff()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function XIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }

/* ── campo reutilizável ─────────────────────────────────────────────────────── */
function Campo({ id, label, type="text", placeholder, value, onChange, err, autoComplete }) {
  const [ver, setVer] = useState(false);
  const eSenha = type === "password";
  return (
    <div className="lf">
      <label htmlFor={id}>{label}</label>
      <div className="lf-wrap">
        <input
          id={id}
          type={eSenha ? (ver ? "text" : "password") : type}
          className={`lf-input${err ? " err" : ""}`}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
        />
        {eSenha && (
          <button type="button" className="lf-eye" onClick={() => setVer(v => !v)}>
            {ver ? <EyeOff/> : <EyeOpen/>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── regra de senha ─────────────────────────────────────────────────────────── */
function RegraItem({ ok, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12,
      color: ok ? "#16a34a" : "#94a3b8", transition:"color .2s" }}>
      <span style={{ color: ok ? "#16a34a" : "#cbd5e1" }}>
        {ok ? <CheckIcon/> : <XIcon/>}
      </span>
      {label}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [aba,      setAba]      = useState("login"); // "login" | "cadastro"
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("expirado") === "1") setExpirado(true);
    if (p.get("cadastro") === "1") setAba("cadastro");
  }, []);

  /* ── estado login ── */
  const [lEmail,   setLEmail]   = useState("");
  const [lSenha,   setLSenha]   = useState("");
  const [lErro,    setLErro]    = useState("");
  const [lLoading, setLLoading] = useState(false);

  /* ── estado cadastro ── */
  const [cNome,    setCNome]    = useState("");
  const [cEmail,   setCEmail]   = useState("");
  const [cSenha,   setCSenha]   = useState("");
  const [cConfirm, setCConfirm] = useState("");
  const [cErro,    setCErro]    = useState("");
  const [cOk,      setCOk]      = useState(false);
  const [cLoading, setCLoading] = useState(false);

  const regras = analisarSenha(cSenha);
  const forca  = forcaLabel(cSenha);

  /* ── login ── */
  async function handleLogin(ev) {
    ev.preventDefault();
    setLErro("");
    if (!lEmail.trim())                               { setLErro("Informe o email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lEmail))  { setLErro("Email inválido."); return; }
    if (!lSenha)                                      { setLErro("Informe a senha."); return; }

    setLLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lEmail.trim().toLowerCase(), senha: lSenha }),
      });
      const data = await res.json();
      if (!res.ok) { setLErro(data.error ?? "Erro ao fazer login."); return; }
      const params   = new URLSearchParams(window.location.search);
      window.location.href = params.get("redirect") ?? "/";
    } catch { setLErro("Erro de conexão. Verifique se o servidor está rodando."); }
    finally  { setLLoading(false); }
  }

  /* ── cadastro ── */
  async function handleCadastro(ev) {
    ev.preventDefault();
    setCErro(""); setCOk(false);

    if (!cNome.trim())                                { setCErro("Informe o nome."); return; }
    if (!cEmail.trim())                               { setCErro("Informe o email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail))  { setCErro("Email inválido."); return; }
    if (!senhaForte(cSenha))                          { setCErro("A senha não atende todos os requisitos."); return; }
    if (cSenha !== cConfirm)                          { setCErro("As senhas não conferem."); return; }

    setCLoading(true);
    try {
      const res  = await fetch("/api/auth/cadastro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: cNome.trim(), email: cEmail.trim().toLowerCase(), senha: cSenha }),
      });
      const data = await res.json();
      if (!res.ok) { setCErro(data.error ?? "Erro ao criar conta."); return; }
      setCOk(true);
      setCNome(""); setCEmail(""); setCSenha(""); setCConfirm("");
    } catch { setCErro("Erro de conexão."); }
    finally  { setCLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lr { min-height:100vh; min-height:100dvh; background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%); display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; padding:20px; }

        .lc { background:#fff; border-radius:20px; width:100%; max-width:440px; box-shadow:0 24px 64px rgba(0,0,0,.4); overflow:hidden; }

        /* topo */
        .lt { background:linear-gradient(135deg,#C0242C,#8b1a20); padding:28px 32px 24px; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .lt-ico { width:50px; height:50px; background:rgba(255,255,255,.15); border-radius:14px; display:flex; align-items:center; justify-content:center; }
        .lt-brand { font-size:21px; font-weight:800; color:#fff; letter-spacing:-.3px; text-align:center; }
        .lt-brand span { display:block; font-size:12px; color:rgba(255,255,255,.6); font-weight:400; margin-top:2px; }

        /* abas */
        .abas { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid #f1f5f9; }
        .aba {
          padding:14px; text-align:center; font-size:13px; font-weight:600;
          color:#94a3b8; cursor:pointer; border:none; background:#fff;
          font-family:'Inter',sans-serif; transition:all .15s;
          border-bottom:2px solid transparent;
        }
        .aba:hover { color:#64748b; }
        .aba.ativa { color:#C0242C; border-bottom-color:#C0242C; background:#fff; }

        /* corpo */
        .lb { padding:28px 32px 24px; }

        /* alerta expirado */
        .exp-banner { background:#fef3c7; border:1px solid #fcd34d; border-radius:9px; padding:10px 14px; font-size:12px; color:#92400e; font-weight:500; margin-bottom:16px; display:flex; align-items:center; gap:8px; }

        /* erro / sucesso */
        .al-erro  { background:#fef2f2; border:1.5px solid rgba(192,36,44,.2); border-radius:9px; padding:11px 14px; font-size:13px; color:#C0242C; font-weight:500; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .al-ok    { background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:9px; padding:11px 14px; font-size:13px; color:#166534; font-weight:500; margin-bottom:14px; display:flex; align-items:center; gap:8px; }

        /* campos */
        .lf { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
        .lf label { font-size:13px; font-weight:600; color:#374151; }
        .lf-wrap  { position:relative; }
        .lf-input {
          width:100%; padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:9px;
          font-size:14px; font-family:'Inter',sans-serif; color:#111827; outline:none;
          transition:border-color .15s, box-shadow .15s; background:#f9fafb;
        }
        .lf-input:focus { border-color:#C0242C; box-shadow:0 0 0 3px rgba(192,36,44,.1); background:#fff; }
        .lf-input.err   { border-color:#C0242C; background:rgba(192,36,44,.02); }
        .lf-input::placeholder { color:#9ca3af; }
        .lf-wrap .lf-input { padding-right:42px; }
        .lf-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; padding:4px; display:flex; align-items:center; }
        .lf-eye:hover { color:#374151; }

        /* força de senha */
        .forca-wrap { margin-top:6px; }
        .forca-bar  { height:4px; background:#f1f5f9; border-radius:2px; overflow:hidden; margin-bottom:6px; }
        .forca-fill { height:100%; border-radius:2px; transition:width .3s ease, background .3s ease; }
        .forca-lbl  { font-size:11px; font-weight:600; }
        .regras     { display:flex; flex-direction:column; gap:4px; margin-top:8px; padding:10px 12px; background:#f8fafc; border-radius:8px; border:1px solid #f1f5f9; }
        .regras-title { font-size:11px; font-weight:700; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px; }

        /* esqueci */
        .forgot { display:block; text-align:right; font-size:12px; color:#C0242C; font-weight:600; margin-top:-6px; margin-bottom:18px; text-decoration:none; }
        .forgot:hover { text-decoration:underline; }

        /* botão */
        .lbtn {
          width:100%; padding:13px; background:#C0242C; color:#fff; border:none;
          border-radius:9px; font-size:15px; font-weight:700; cursor:pointer;
          font-family:'Inter',sans-serif; transition:background .15s, transform .1s;
          box-shadow:0 4px 12px rgba(192,36,44,.25);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .lbtn:hover:not(:disabled) { background:#a01e25; }
        .lbtn:active:not(:disabled){ transform:scale(.99); }
        .lbtn:disabled { opacity:.55; cursor:not-allowed; box-shadow:none; }

        .spin { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* rodapé */
        .lfoot { text-align:center; margin-top:18px; font-size:12px; color:#9ca3af; }

        /* já tem conta */
        .ir-login { text-align:center; margin-top:14px; font-size:13px; color:#64748b; }
        .ir-login button { background:none; border:none; color:#C0242C; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; font-size:13px; }
        .ir-login button:hover { text-decoration:underline; }
      `}</style>

      <div className="lr">
        <div className="lc">

          {/* topo */}
          <div className="lt">
            <div className="lt-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M9 21V12h6v9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="lt-brand">
              XTelhas
              <span>Sistema Financeiro</span>
            </div>
          </div>

          {/* abas */}
          <div className="abas">
            <button className={`aba${aba==="login"?" ativa":""}`} onClick={() => { setAba("login"); setLErro(""); setCErro(""); setCOk(false); }}>
              Entrar
            </button>
            <button className={`aba${aba==="cadastro"?" ativa":""}`} onClick={() => { setAba("cadastro"); setLErro(""); setCErro(""); setCOk(false); }}>
              Criar conta
            </button>
          </div>

          {/* corpo */}
          <div className="lb">

            {/* ── ABA LOGIN ── */}
            {aba === "login" && (
              <>
                {expirado && (
                  <div className="exp-banner">
                    ⏱ Sessão expirada por inatividade. Faça login novamente.
                  </div>
                )}

                {lErro && (
                  <div className="al-erro">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    {lErro}
                  </div>
                )}

                <form onSubmit={handleLogin} noValidate>
                  <Campo id="l-email" label="Email" type="email" placeholder="seu@email.com"
                    value={lEmail} onChange={v=>{setLEmail(v);setLErro("");}} err={!!lErro} autoComplete="email"/>

                  <Campo id="l-senha" label="Senha" type="password" placeholder="••••••••"
                    value={lSenha} onChange={v=>{setLSenha(v);setLErro("");}} err={!!lErro} autoComplete="current-password"/>

                  <a href="/recuperar-senha" className="forgot">Esqueci minha senha</a>

                  <button type="submit" className="lbtn" disabled={lLoading}>
                    {lLoading ? <><div className="spin"/> Entrando…</> : "Entrar"}
                  </button>
                </form>

                <div className="ir-login" style={{marginTop:16}}>
                  Não tem conta?{" "}
                  <button onClick={() => setAba("cadastro")}>Criar agora</button>
                </div>
              </>
            )}

            {/* ── ABA CADASTRO ── */}
            {aba === "cadastro" && (
              <>
                {cErro && (
                  <div className="al-erro">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    {cErro}
                  </div>
                )}

                {cOk && (
                  <div className="al-ok">
                    ✅ Conta criada com sucesso!{" "}
                    <button style={{background:"none",border:"none",color:"#166534",fontWeight:700,cursor:"pointer"}}
                      onClick={() => { setAba("login"); setCOk(false); }}>
                      Fazer login
                    </button>
                  </div>
                )}

                {!cOk && (
                  <form onSubmit={handleCadastro} noValidate>
                    <Campo id="c-nome" label="Nome completo" placeholder="Seu nome"
                      value={cNome} onChange={v=>{setCNome(v);setCErro("");}} err={!!cErro} autoComplete="name"/>

                    <Campo id="c-email" label="Email" type="email" placeholder="seu@email.com"
                      value={cEmail} onChange={v=>{setCEmail(v);setCErro("");}} err={!!cErro} autoComplete="email"/>

                    <Campo id="c-senha" label="Senha" type="password" placeholder="Mínimo 8 caracteres"
                      value={cSenha} onChange={v=>{setCSenha(v);setCErro("");}} err={!!cErro} autoComplete="new-password"/>

                    {/* medidor de força */}
                    {cSenha && (
                      <div className="forca-wrap">
                        <div className="forca-bar">
                          <div className="forca-fill" style={{ width:`${forca?.pct??0}%`, background: forca?.cor ?? "#e2e8f0" }}/>
                        </div>
                        <span className="forca-lbl" style={{ color: forca?.cor }}>{forca?.label}</span>

                        <div className="regras">
                          <div className="regras-title">Requisitos da senha</div>
                          <RegraItem ok={regras.tamanho}  label="Mínimo de 8 caracteres"/>
                          <RegraItem ok={regras.letra}    label="Pelo menos uma letra (a–z ou A–Z)"/>
                          <RegraItem ok={regras.numero}   label="Pelo menos um número (0–9)"/>
                          <RegraItem ok={regras.especial} label="Pelo menos um caractere especial (!@#$%...)"/>
                        </div>
                      </div>
                    )}

                    <div style={{marginTop:14}}>
                      <Campo id="c-confirm" label="Confirmar senha" type="password" placeholder="Repita a senha"
                        value={cConfirm} onChange={v=>{setCConfirm(v);setCErro("");}} err={!!cErro && cSenha !== cConfirm} autoComplete="new-password"/>
                    </div>

                    {/* indicador de confirmação */}
                    {cConfirm && cSenha && (
                      <div style={{ fontSize:12, marginTop:-8, marginBottom:10, display:"flex", alignItems:"center", gap:6,
                        color: cSenha===cConfirm ? "#16a34a" : "#ef4444" }}>
                        {cSenha===cConfirm
                          ? <><CheckIcon/> As senhas conferem</>
                          : <><XIcon/> As senhas não conferem</>}
                      </div>
                    )}

                    <button type="submit" className="lbtn" disabled={cLoading}>
                      {cLoading ? <><div className="spin"/> Criando conta…</> : "Criar conta"}
                    </button>
                  </form>
                )}

                <div className="ir-login">
                  Já tem conta?{" "}
                  <button onClick={() => { setAba("login"); setCErro(""); setCOk(false); }}>Entrar</button>
                </div>
              </>
            )}

            <div className="lfoot">
              Desenvolvido por <strong style={{color:"#374151"}}>MGL Tecnologia</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

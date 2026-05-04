"use client";

import { useState, useEffect } from "react";

export default function RecuperarSenhaPage() {
  const [etapa,      setEtapa]      = useState("email"); // email | token | sucesso
  const [email,      setEmail]      = useState("");
  const [token,      setToken]      = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confirma,   setConfirma]   = useState("");
  const [verSenha,   setVerSenha]   = useState(false);
  const [erro,       setErro]       = useState("");
  const [msg,        setMsg]        = useState("");
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) { setToken(t); setEtapa("nova-senha"); }
  }, []);

  async function handleSolicitarRecuperacao(ev) {
    ev.preventDefault();
    if (!email.trim()) { setErro("Informe o email."); return; }
    setErro(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/recuperar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro."); return; }
      setMsg("Instruções enviadas! Verifique o console do servidor (modo dev).");
      setEtapa("enviado");
      // Em dev: usar o token retornado
      if (data._dev_token) {
        console.log("TOKEN DEV:", data._dev_token);
        setToken(data._dev_token);
      }
    } catch { setErro("Erro de conexão."); }
    finally  { setLoading(false); }
  }

  async function handleRedefinir(ev) {
    ev.preventDefault();
    if (!novaSenha)              { setErro("Informe a nova senha."); return; }
    if (novaSenha.length < 6)    { setErro("Senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirma)  { setErro("As senhas não conferem."); return; }
    setErro(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/redefinir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro."); return; }
      setEtapa("sucesso");
    } catch { setErro("Erro de conexão."); }
    finally  { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .rp-root {
          min-height:100vh; min-height:100dvh;
          background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          display:flex; align-items:center; justify-content:center;
          font-family:'Inter',sans-serif; padding:20px;
        }
        .rp-card { background:#fff; border-radius:20px; width:100%; max-width:420px; box-shadow:0 24px 64px rgba(0,0,0,.4); overflow:hidden; }
        .rp-top  { background:linear-gradient(135deg,#C0242C,#8b1a20); padding:28px 32px; }
        .rp-top h1 { font-size:20px; font-weight:800; color:#fff; margin-bottom:4px; }
        .rp-top p  { font-size:13px; color:rgba(255,255,255,.7); }
        .rp-body { padding:28px 32px; }
        .lf { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .lf label { font-size:13px; font-weight:600; color:#374151; }
        .lf-wrap  { position:relative; }
        .lf-input {
          width:100%; padding:11px 14px; border:1.5px solid #e5e7eb;
          border-radius:9px; font-size:14px; font-family:'Inter',sans-serif;
          color:#111827; outline:none; transition:border-color .15s,box-shadow .15s;
          background:#f9fafb;
        }
        .lf-input:focus { border-color:#C0242C; box-shadow:0 0 0 3px rgba(192,36,44,.1); background:#fff; }
        .lf-input.err   { border-color:#C0242C; }
        .lf-input::placeholder { color:#9ca3af; }
        .lf-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; padding:4px; display:flex; align-items:center; }
        .lf-eye:hover { color:#374151; }
        .lf-wrap .lf-input { padding-right:42px; }

        .rp-erro { background:#fef2f2; border:1.5px solid rgba(192,36,44,.2); border-radius:9px; padding:10px 14px; font-size:13px; color:#C0242C; font-weight:500; margin-bottom:14px; }
        .rp-info { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:9px; padding:10px 14px; font-size:13px; color:#166534; margin-bottom:14px; }

        .rp-btn {
          width:100%; padding:13px; background:#C0242C; color:#fff;
          border:none; border-radius:9px; font-size:15px; font-weight:700;
          cursor:pointer; font-family:'Inter',sans-serif; transition:background .15s;
          box-shadow:0 4px 12px rgba(192,36,44,.25);
        }
        .rp-btn:hover:not(:disabled) { background:#a01e25; }
        .rp-btn:disabled { opacity:.6; cursor:not-allowed; }
        .rp-link { display:block; text-align:center; margin-top:16px; font-size:13px; color:#64748b; }
        .rp-link a { color:#C0242C; font-weight:600; text-decoration:none; }
        .rp-link a:hover { text-decoration:underline; }

        .rp-sucesso { text-align:center; padding:16px 0; }
        .rp-sucesso-ico { font-size:48px; margin-bottom:12px; }
        .rp-sucesso h2  { font-size:18px; font-weight:800; color:#0f172a; margin-bottom:8px; }
        .rp-sucesso p   { font-size:13px; color:#64748b; margin-bottom:20px; }

        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; margin-right:6px; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">
          <div className="rp-top">
            <h1>
              {etapa === "email"      && "Recuperar senha"}
              {etapa === "enviado"    && "Email enviado"}
              {etapa === "nova-senha" && "Nova senha"}
              {etapa === "sucesso"    && "Senha redefinida!"}
            </h1>
            <p>Sistema Financeiro XTelhas</p>
          </div>

          <div className="rp-body">

            {/* etapa: solicitar recuperação */}
            {etapa === "email" && (
              <form onSubmit={handleSolicitarRecuperacao} noValidate>
                <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>
                  Informe seu email cadastrado. Enviaremos as instruções para redefinir sua senha.
                </p>
                {erro && <div className="rp-erro">⚠ {erro}</div>}
                <div className="lf">
                  <label htmlFor="email">Email cadastrado</label>
                  <input id="email" type="email" className={`lf-input${erro?" err":""}`}
                    placeholder="seu@email.com" value={email}
                    onChange={e=>{setEmail(e.target.value);setErro("");}}/>
                </div>
                <button type="submit" className="rp-btn" disabled={loading}>
                  {loading && <span className="spin"/>}
                  {loading ? "Enviando…" : "Enviar instruções"}
                </button>
                <div className="rp-link"><a href="/login">← Voltar ao login</a></div>
              </form>
            )}

            {/* etapa: email enviado */}
            {etapa === "enviado" && (
              <div>
                <div className="rp-info">✅ {msg}</div>
                <p style={{fontSize:13,color:"#64748b",marginBottom:16}}>
                  Em modo de desenvolvimento, o token aparece no console do servidor.<br/><br/>
                  {token && (
                    <span>
                      <strong>Link direto (dev):</strong><br/>
                      <a href={`/recuperar-senha?token=${token}`}
                        style={{color:"#C0242C",wordBreak:"break-all",fontSize:12}}>
                        /recuperar-senha?token={token.slice(0,16)}…
                      </a>
                    </span>
                  )}
                </p>
                <div className="rp-link"><a href="/login">← Voltar ao login</a></div>
              </div>
            )}

            {/* etapa: nova senha */}
            {etapa === "nova-senha" && (
              <form onSubmit={handleRedefinir} noValidate>
                {erro && <div className="rp-erro">⚠ {erro}</div>}
                <div className="lf">
                  <label>Nova senha</label>
                  <div className="lf-wrap">
                    <input type={verSenha?"text":"password"} className={`lf-input${erro?" err":""}`}
                      placeholder="Mínimo 6 caracteres" value={novaSenha}
                      onChange={e=>{setNovaSenha(e.target.value);setErro("");}}/>
                    <button type="button" className="lf-eye" onClick={()=>setVerSenha(v=>!v)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="lf">
                  <label>Confirmar nova senha</label>
                  <input type="password" className={`lf-input${erro?" err":""}`}
                    placeholder="Repita a senha" value={confirma}
                    onChange={e=>{setConfirma(e.target.value);setErro("");}}/>
                </div>
                <button type="submit" className="rp-btn" disabled={loading}>
                  {loading && <span className="spin"/>}
                  {loading ? "Salvando…" : "Redefinir senha"}
                </button>
              </form>
            )}

            {/* etapa: sucesso */}
            {etapa === "sucesso" && (
              <div className="rp-sucesso">
                <div className="rp-sucesso-ico">✅</div>
                <h2>Senha redefinida!</h2>
                <p>Sua senha foi alterada com sucesso. Faça login com a nova senha.</p>
                <a href="/login">
                  <button className="rp-btn">Ir para o login</button>
                </a>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

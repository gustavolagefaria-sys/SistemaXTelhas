"use client";

import { useState, useEffect } from "react";

const EMPRESA_ID = 1;

export default function TiposDespesaPage() {
  const [tipos,     setTipos]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editId,    setEditId]    = useState(null);
  const [novoNome,  setNovoNome]  = useState("");
  const [formErro,  setFormErro]  = useState("");
  const [busy,      setBusy]      = useState(false);
  const [ok,        setOk]        = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [delErro,   setDelErro]   = useState("");
  const [deleting,  setDeleting]  = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      // busca todos (ativos e inativos) para a tabela
      const res  = await fetch(`/api/tipos-despesa?empresa_id=${EMPRESA_ID}`);
      const data = await res.json();
      setTipos(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  function iniciarEdicao(t) {
    setEditId(t.id); setNovoNome(t.nome); setFormErro("");
    window.scrollTo({ top:0, behavior:"smooth" });
  }
  function cancelarEdicao() { setEditId(null); setNovoNome(""); setFormErro(""); }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!novoNome.trim()) { setFormErro("Informe o nome do tipo."); return; }
    setFormErro(""); setBusy(true);
    try {
      const url    = editId ? `/api/tipos-despesa/${editId}` : "/api/tipos-despesa";
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nome: novoNome.trim(), empresa_id: EMPRESA_ID }),
      });
      const data = await res.json();
      if (!res.ok) { setFormErro(data.error??"Erro ao salvar."); setBusy(false); return; }
      setOk(true); cancelarEdicao(); carregar();
      setTimeout(() => setOk(false), 2500);
    } catch { setFormErro("Erro de conexão."); }
    setBusy(false);
  }

  async function excluir(id) {
    setDeleting(true); setDelErro("");
    try {
      const res  = await fetch(`/api/tipos-despesa/${id}`, { method:"DELETE" });
      const data = await res.json();
      if (!res.ok) { setDelErro(data.error??"Erro ao excluir."); setDeleting(false); return; }
      setConfirmId(null); carregar();
    } catch { setDelErro("Erro de conexão."); }
    setDeleting(false);
  }

  return (
    <>
      <style>{`
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(2px); }
        .modal { background:#fff; border-radius:14px; padding:28px; width:100%; max-width:400px; box-shadow:0 16px 48px rgba(0,0,0,.18); margin:16px; }
        .modal h3 { font-size:16px; font-weight:700; color:#1a1a1a; margin-bottom:8px; }
        .modal p  { font-size:13px; color:#5a5f6b; line-height:1.6; }
        .modal-del-err { font-size:12px; color:#C0242C; font-weight:600; margin-top:10px; padding:8px 10px; background:#fff5f5; border-radius:7px; border-left:2px solid #C0242C; }
        .modal-actions { display:flex; gap:10px; margin-top:20px; justify-content:flex-end; }
        .btn-cancel { padding:9px 18px; background:#f4f5f7; color:#5a5f6b; border:1.5px solid #e2e4e8; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
        .btn-danger { padding:9px 18px; background:#C0242C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
        .btn-danger:hover:not(:disabled) { background:#a01e25; }
        .btn-danger:disabled { opacity:.5; cursor:not-allowed; }

        .edit-banner { background:#eff6ff; border:1.5px solid rgba(29,78,216,.2); border-radius:8px; padding:10px 14px; font-size:12px; color:#1d4ed8; font-weight:600; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .edit-banner button { font-size:11px; color:#1d4ed8; background:transparent; border:1px solid rgba(29,78,216,.25); border-radius:6px; padding:3px 10px; cursor:pointer; font-weight:600; }

        .hint-box { font-size:12px; color:#9aa0ad; line-height:1.7; padding:12px 14px; background:#f4f5f7; border-radius:8px; border-left:2px solid #e2e4e8; }

        /* tabela */
        .tabela-wrap { overflow-x:auto; border-radius:var(--radius); border:1.5px solid var(--border); box-shadow:var(--shadow-sm); background:#fff; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead tr { background:#f4f5f7; border-bottom:1.5px solid var(--border); }
        thead th { padding:10px 14px; text-align:left; font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.6px; white-space:nowrap; }
        tbody tr { border-bottom:1px solid #f4f5f7; transition:background .12s; }
        tbody tr:last-child { border-bottom:none; }
        tbody tr:hover { background:#fafafa; }
        tbody td { padding:11px 14px; color:var(--text); vertical-align:middle; }
        .td-nome   { font-weight:600; color:#1a1a1a; }
        .td-badge  { }
        .td-acoes  { display:flex; gap:5px; justify-content:flex-end; }
        .btn-edit-t,.btn-del-t { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1.5px solid; transition:all .15s; white-space:nowrap; }
        .btn-edit-t { background:#f4f5f7; color:#5a5f6b; border-color:#e2e4e8; }
        .btn-edit-t:hover { border-color:#5a5f6b; }
        .btn-del-t  { background:#fff5f5; color:var(--red); border-color:rgba(192,36,44,.2); }
        .btn-del-t:hover { background:var(--red-dim); border-color:var(--red); }
        .tipo-badge { font-family:'DM Mono',monospace; font-size:9px; padding:2px 7px; border-radius:20px; font-weight:600; }
        .tipo-badge--sys    { background:#f4f5f7; color:#9aa0ad; border:1px solid #e2e4e8; }
        .tipo-badge--custom { background:rgba(29,78,216,.08); color:#1d4ed8; border:1px solid rgba(29,78,216,.15); }

        .load-msg { text-align:center; padding:32px; color:var(--text3); font-size:13px; }
      `}</style>

      {confirmId && (
        <div className="modal-overlay" onClick={() => { setConfirmId(null); setDelErro(""); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Excluir tipo de despesa?</h3>
            <p>Se houver lançamentos com esse tipo, a exclusão será bloqueada com a mensagem: <em style={{color:"#C0242C"}}>"Erro: Tipo de despesa em utilização"</em>.</p>
            {delErro && <div className="modal-del-err">⚠ {delErro}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setConfirmId(null); setDelErro(""); }}>Cancelar</button>
              <button className="btn-danger" disabled={deleting} onClick={() => excluir(confirmId)}>
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-wrap">
        <div className="page-header">
          <h1>Tipos de despesa</h1>
          <p>Gerencie as categorias disponíveis no lançamento de despesas.</p>
        </div>

        {/* formulário compacto */}
        <div className="card" style={{marginBottom:28}}>
          <div className="card-head"><h2>{editId ? "Editar tipo" : "Novo tipo"}</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate style={{display:"contents"}}>
              {editId && (
                <div className="edit-banner">
                  <span>✏️ Editando tipo #{editId}</span>
                  <button type="button" onClick={cancelarEdicao}>Cancelar</button>
                </div>
              )}
              <div style={{display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap"}}>
                <div className="field" style={{flex:1, minWidth:200}}>
                  <label className="field-label">Nome do tipo</label>
                  <input className={`input${formErro?" err":""}`}
                    placeholder="ex: Combustível" value={novoNome}
                    onChange={e => { setNovoNome(e.target.value); setFormErro(""); }}/>
                  {formErro && <p className="field-err">⚠ {formErro}</p>}
                </div>
                <button type="submit" className="btn-primary" disabled={busy} style={{width:"auto", padding:"10px 24px", whiteSpace:"nowrap"}}>
                  {busy ? "Salvando…" : editId ? "Salvar" : "+ Adicionar"}
                </button>
              </div>
              {ok && <div className="toast">✓ {editId ? "Tipo atualizado!" : "Tipo adicionado!"}</div>}
            </form>
            <div className="hint-box" style={{marginTop:8}}>
              Tipos de <strong style={{color:"#5a5f6b"}}>sistema</strong> não podem ser editados ou excluídos.
              Tipos customizados só podem ser excluídos se não houver lançamentos vinculados.
            </div>
          </div>
        </div>

        {/* tabela */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <h2 style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>Tipos cadastrados</h2>
          <span className="count-badge">{tipos.length}</span>
        </div>

        {loading ? (
          <div className="load-msg">Carregando…</div>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th style={{textAlign:"right"}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map(t => (
                  <tr key={t.id}>
                    <td style={{color:"var(--text3)",fontFamily:"'DM Mono',monospace",fontSize:11}}>{t.id}</td>
                    <td className="td-nome">{t.nome}</td>
                    <td className="td-badge">
                      <span className={`tipo-badge ${t.isSistema?"tipo-badge--sys":"tipo-badge--custom"}`}>
                        {t.isSistema ? "sistema" : "custom"}
                      </span>
                    </td>
                    <td>
                      <div className="td-acoes">
                        {!t.isSistema ? (<>
                          <button className="btn-edit-t" onClick={() => iniciarEdicao(t)}>Editar</button>
                          <button className="btn-del-t"  onClick={() => { setConfirmId(t.id); setDelErro(""); }}>Excluir</button>
                        </>) : (
                          <span style={{fontSize:11,color:"var(--text3)"}}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

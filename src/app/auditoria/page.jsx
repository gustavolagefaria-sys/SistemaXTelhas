"use client";

import { useState, useEffect, useCallback } from "react";
import { labelDataBR } from "@/components/DatePicker";

const TIPOS_ACAO = ["LOGIN","LOGOUT","CREATE","UPDATE","DELETE"];
const ENTIDADES  = ["despesas","pedidos","usuarios","tipos-despesa"];

function badgeAcao(tipo) {
  const map = {
    LOGIN:  { bg:"#dbeafe", color:"#1d4ed8", label:"LOGIN"  },
    LOGOUT: { bg:"#f1f5f9", color:"#64748b", label:"LOGOUT" },
    CREATE: { bg:"#dcfce7", color:"#16a34a", label:"CREATE" },
    UPDATE: { bg:"#fef9c3", color:"#d97706", label:"UPDATE" },
    DELETE: { bg:"#fee2e2", color:"#dc2626", label:"DELETE" },
  };
  const s = map[tipo] ?? { bg:"#f1f5f9", color:"#64748b", label: tipo };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding:"2px 9px", borderRadius:20,
      fontSize:11, fontWeight:700, fontFamily:"'DM Mono',monospace",
      whiteSpace:"nowrap",
    }}>{s.label}</span>
  );
}

export default function AuditoriaPage() {
  const [logs,        setLogs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPag,    setTotalPag]    = useState(1);
  const [pagina,      setPagina]      = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [erro,        setErro]        = useState("");
  const [exportando,  setExportando]  = useState(false);

  // filtros
  const [fUsuario,  setFUsuario]  = useState("");
  const [fAcao,     setFAcao]     = useState("");
  const [fEntidade, setFEntidade] = useState("");
  const [fDataIni,  setFDataIni]  = useState("");
  const [fDataFim,  setFDataFim]  = useState("");

  const LIMITE = 20;

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    p.set("pagina", pagina);
    p.set("limite", LIMITE);
    if (fUsuario)  p.set("usuario_id", fUsuario);
    if (fAcao)     p.set("tipo_acao",  fAcao);
    if (fEntidade) p.set("entidade",   fEntidade);
    if (fDataIni)  p.set("data_inicio",fDataIni);
    if (fDataFim)  p.set("data_fim",   fDataFim);
    return p.toString();
  }, [pagina, fUsuario, fAcao, fEntidade, fDataIni, fDataFim]);

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    try {
      const res  = await fetch(`/api/auditoria?${buildParams()}`);
      if (res.status === 403) { setErro("Acesso restrito a administradores."); setLoading(false); return; }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setTotalPag(data.totalPaginas ?? 1);
    } catch { setErro("Erro ao carregar logs."); }
    setLoading(false);
  }, [buildParams]);

  useEffect(() => { carregar(); }, [carregar]);

  function aplicarFiltros() { setPagina(1); carregar(); }

  async function exportarCSV() {
    setExportando(true);
    try {
      const p = new URLSearchParams(buildParams());
      p.set("exportar", "csv");
      const res  = await fetch(`/api/auditoria?${p}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Erro ao exportar."); }
    setExportando(false);
  }

  function formatDT(dt) {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleString("pt-BR", { day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit" });
  }

  return (
    <>
      <style>{`
        .aud-sel {
          background:#fff; border:1.5px solid #e2e8f0; border-radius:8px;
          color:#0f172a; font-family:'Inter',sans-serif; font-size:13px;
          padding:9px 32px 9px 12px; outline:none; appearance:none; cursor:pointer;
          transition:border-color .15s;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 10px center;
        }
        .aud-sel:focus { border-color:#C0242C; }
        .aud-input {
          background:#fff; border:1.5px solid #e2e8f0; border-radius:8px;
          color:#0f172a; font-family:'Inter',sans-serif; font-size:13px;
          padding:9px 12px; outline:none; transition:border-color .15s;
        }
        .aud-input:focus { border-color:#C0242C; }

        .filtros-bar {
          background:#fff; border:1px solid #e2e8f0; border-radius:12px;
          padding:18px 20px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,.05);
        }
        .filtros-bar-title { font-size:12px; font-weight:700; color:#94a3b8; letter-spacing:.6px; text-transform:uppercase; margin-bottom:14px; }
        .filtros-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; align-items:end; }

        .btn-aplicar {
          padding:9px 16px; background:#C0242C; color:#fff; border:none;
          border-radius:8px; font-size:13px; font-weight:700; cursor:pointer;
          font-family:'Inter',sans-serif; transition:background .15s; white-space:nowrap;
        }
        .btn-aplicar:hover { background:#a01e25; }
        .btn-limpar {
          padding:9px 14px; background:#f1f5f9; color:#64748b; border:1.5px solid #e2e8f0;
          border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;
          font-family:'Inter',sans-serif; transition:background .15s; white-space:nowrap;
        }
        .btn-limpar:hover { background:#e2e8f0; }
        .btn-export {
          display:inline-flex; align-items:center; gap:6px;
          padding:9px 16px; background:#fff; color:#0f172a;
          border:1.5px solid #e2e8f0; border-radius:8px;
          font-size:13px; font-weight:600; cursor:pointer;
          font-family:'Inter',sans-serif; transition:all .15s;
          box-shadow:0 1px 3px rgba(0,0,0,.05);
        }
        .btn-export:hover { border-color:#C0242C; color:#C0242C; }
        .btn-export:disabled { opacity:.5; cursor:not-allowed; }

        /* paginação */
        .pag { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .pag-btn {
          padding:6px 12px; border-radius:7px; border:1.5px solid #e2e8f0;
          background:#fff; color:#64748b; font-size:12px; font-weight:600; cursor:pointer;
          transition:all .15s; font-family:'Inter',sans-serif;
        }
        .pag-btn:hover:not(:disabled) { border-color:#C0242C; color:#C0242C; }
        .pag-btn:disabled { opacity:.4; cursor:not-allowed; }
        .pag-btn.ativo { background:#C0242C; color:#fff; border-color:#C0242C; }
        .pag-info { font-size:12px; color:#94a3b8; }

        /* tabela */
        .aud-table-wrap { overflow-x:auto; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.05); background:#fff; }
        .aud-table { width:100%; border-collapse:collapse; font-size:13px; }
        .aud-table thead tr { background:#f8fafc; border-bottom:1.5px solid #e2e8f0; }
        .aud-table thead th { padding:11px 14px; text-align:left; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.6px; white-space:nowrap; }
        .aud-table tbody tr { border-bottom:1px solid #f8fafc; transition:background .1s; }
        .aud-table tbody tr:last-child { border-bottom:none; }
        .aud-table tbody tr:hover { background:#fafbfc; }
        .aud-table tbody td { padding:12px 14px; vertical-align:top; }
        .td-user { font-weight:600; color:#0f172a; font-size:13px; }
        .td-email { font-size:11px; color:#94a3b8; margin-top:2px; }
        .td-mono  { font-family:'DM Mono',monospace; font-size:11px; color:#64748b; }
        .td-desc  { font-size:12px; color:#374151; max-width:260px; }
        .td-dt    { font-family:'DM Mono',monospace; font-size:11px; color:#64748b; white-space:nowrap; }
      `}</style>

      <div className="page-wrap">
        {/* cabeçalho */}
        <div className="page-header">
          <div>
            <h1>Log de Atividades</h1>
            <p>Auditoria completa de todas as ações realizadas no sistema.</p>
          </div>
          <button className="btn-export" onClick={exportarCSV} disabled={exportando}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {exportando ? "Exportando…" : "Exportar CSV"}
          </button>
        </div>

        {/* filtros */}
        <div className="filtros-bar">
          <div className="filtros-bar-title">Filtros</div>
          <div className="filtros-grid">
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Tipo de ação</div>
              <select className="aud-sel" style={{width:"100%"}} value={fAcao} onChange={e=>setFAcao(e.target.value)}>
                <option value="">Todas</option>
                {TIPOS_ACAO.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Entidade</div>
              <select className="aud-sel" style={{width:"100%"}} value={fEntidade} onChange={e=>setFEntidade(e.target.value)}>
                <option value="">Todas</option>
                {ENTIDADES.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Data início</div>
              <input type="date" className="aud-input" style={{width:"100%"}} value={fDataIni} onChange={e=>setFDataIni(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Data fim</div>
              <input type="date" className="aud-input" style={{width:"100%"}} value={fDataFim} onChange={e=>setFDataFim(e.target.value)}/>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <button className="btn-aplicar" onClick={aplicarFiltros}>Filtrar</button>
              <button className="btn-limpar" onClick={()=>{setFUsuario("");setFAcao("");setFEntidade("");setFDataIni("");setFDataFim("");setPagina(1);}}>Limpar</button>
            </div>
          </div>
        </div>

        {/* resumo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h2 style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Registros</h2>
            <span className="count-badge">{total}</span>
          </div>
          <div className="pag-info">
            Página {pagina} de {totalPag}
          </div>
        </div>

        {erro && <div className="api-err" style={{marginBottom:16}}>⚠ {erro}</div>}

        {/* tabela */}
        {loading ? (
          <div className="load-msg">Carregando logs…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">Nenhum log encontrado para os filtros selecionados.</div>
        ) : (
          <div className="aud-table-wrap">
            <table className="aud-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>Registro</th>
                  <th>Descrição</th>
                  <th>IP</th>
                  <th>Data / Hora ↓</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="td-mono">{l.id}</td>
                    <td>
                      <div className="td-user">{l.usuario?.nome ?? "—"}</div>
                      <div className="td-email">{l.usuario?.email}</div>
                    </td>
                    <td>{badgeAcao(l.tipoAcao)}</td>
                    <td className="td-mono">{l.entidade}</td>
                    <td className="td-mono">{l.registroId ?? "—"}</td>
                    <td className="td-desc">{l.descricao ?? "—"}</td>
                    <td className="td-mono">{l.ip ?? "—"}</td>
                    <td className="td-dt">{formatDT(l.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* paginação */}
        {totalPag > 1 && (
          <div style={{display:"flex",justifyContent:"center",marginTop:20}}>
            <div className="pag">
              <button className="pag-btn" disabled={pagina<=1} onClick={()=>setPagina(p=>p-1)}>← Anterior</button>
              {Array.from({length:Math.min(7,totalPag)},(_,i)=>{
                const p = pagina <= 4 ? i+1 : pagina - 3 + i;
                if (p < 1 || p > totalPag) return null;
                return <button key={p} className={`pag-btn${p===pagina?" ativo":""}`} onClick={()=>setPagina(p)}>{p}</button>;
              })}
              <button className="pag-btn" disabled={pagina>=totalPag} onClick={()=>setPagina(p=>p+1)}>Próximo →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

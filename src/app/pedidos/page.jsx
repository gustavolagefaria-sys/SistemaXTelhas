"use client";

import { useState, useEffect } from "react";
import { Picker, CalDia, CalMes, dataHoje, toISO, toMesRef, labelDataBR, labelMesRef } from "@/components/DatePicker";
import { mascaraMoeda, parseMoeda, fmt } from "@/lib/money";

const EMPRESA_ID    = 1;
const TIPO_MATERIAIS_ID = 1; // id do tipo "Materiais" no seed

export default function PedidosPage() {
  const hoje = dataHoje();

  const [mesFiltro, setMesFiltro] = useState(toMesRef(hoje));
  const [editId,  setEditId]  = useState(null);
  const [num,     setNum]     = useState("");
  const [vtRaw,   setVtRaw]   = useState("");
  const [cbRaw,   setCbRaw]   = useState("");
  const [nf,      setNf]      = useState(false);
  const [vnRaw,   setVnRaw]   = useState("");
  const [nfNum,   setNfNum]   = useState("");
  const [data,    setData]    = useState(toISO(hoje));
  const [mes,     setMes]     = useState(toMesRef(hoje));
  const [erros,   setErros]   = useState({});
  const [busy,    setBusy]    = useState(false);
  const [ok,      setOk]      = useState(false);
  const [apiErr,  setApiErr]  = useState("");
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const vt     = parseMoeda(vtRaw);
  const cb     = parseMoeda(cbRaw);
  const vn     = parseMoeda(vnRaw);
  const vsemNf = nf && vt>0 && vn>0 ? vt-vn : 0;
  const margem = vt>0 && cb>0 ? vt-cb : null;

  async function carregar(mr) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/pedidos?empresa_id=${EMPRESA_ID}&mes_ref=${mr}`);
      const data = await res.json();
      setLista(Array.isArray(data) ? data.sort((a,b) => new Date(b.dataEmissao) - new Date(a.dataEmissao)) : []);
    } catch { setLista([]); }
    setLoading(false);
  }

  useEffect(() => { carregar(mesFiltro); }, [mesFiltro]);

  function resetForm() {
    setEditId(null); setNum(""); setVtRaw(""); setCbRaw("");
    setNf(false); setVnRaw(""); setNfNum("");
    setData(toISO(hoje)); setMes(toMesRef(hoje));
    setErros({}); setApiErr("");
  }

  function toggleNf(v) {
    setNf(v);
    if (!v) { setVnRaw(""); setNfNum(""); }
    setErros(e => ({ ...e, vn:undefined, nfNum:undefined }));
  }

  function iniciarEdicao(item) {
    setEditId(item.id);
    setNum(item.numeroPedido ?? "");
    setVtRaw(mascaraMoeda(String(Math.round(Number(item.valorTotal)*100))));
    setCbRaw(item.custoBruto ? mascaraMoeda(String(Math.round(Number(item.custoBruto)*100))) : "");
    setNf(item.nfEmitida ?? false);
    setVnRaw(item.valorNf ? mascaraMoeda(String(Math.round(Number(item.valorNf)*100))) : "");
    setNfNum(item.numeroNf ?? "");
    setData(item.dataEmissao?.slice(0,10) ?? toISO(hoje));
    setMes(item.mesRef ?? toMesRef(hoje));
    setErros({}); setApiErr("");
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function validar() {
    const e = {};
    if (!num.trim()) e.num  = "Informe o número do pedido.";
    if (vt <= 0)     e.vt   = "Informe o valor total.";
    if (!data)       e.data = "Selecione a data de emissão.";
    if (!mes)        e.mes  = "Selecione o mês de competência.";
    if (nf) {
      if (vn <= 0)       e.vn    = "Informe o valor da NF.";
      if (vn > vt)       e.vn    = "Valor da NF não pode ser maior que o total.";
      if (!nfNum.trim()) e.nfNum = "Informe o número da NF.";
    }
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }
    setErros({}); setApiErr(""); setBusy(true);

    const body = {
      empresa_id: EMPRESA_ID, criado_por_id: 1,
      numero_pedido: num, valor_total: vt,
      custo_bruto: cb > 0 ? cb : null,
      nf_emitida: nf,
      valor_nf:  nf ? vn : null,
      numero_nf: nf ? nfNum : null,
      data_emissao: data, mes_ref: mes,
    };

    try {
      const url    = editId ? `/api/pedidos/${editId}` : "/api/pedidos";
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type":"application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setApiErr(err.error ?? "Erro ao salvar."); setBusy(false); return;
      }
      const pedidoSalvo = await res.json();

      // ── se tem custo bruto, lança como despesa de Materiais ─────────────────
      if (cb > 0 && !editId) {
        await fetch("/api/despesas", {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({
            empresa_id:     EMPRESA_ID,
            tipo_id:        TIPO_MATERIAIS_ID,
            criado_por_id:  1,
            descricao:      `Itens do pedido: ${num}`,
            unidade_medida: "UN",
            quantidade:     1,
            preco_unitario: cb,
            valor:          cb,
            data_lancamento: data,
            mes_ref:         mes,
          }),
        });
      }

      setOk(true);
      resetForm();
      carregar(mesFiltro);
      setTimeout(() => setOk(false), 3000);
    } catch {
      setApiErr("Erro de conexão. Verifique se o servidor está rodando.");
    }
    setBusy(false);
  }

  async function excluir(id) {
    setDeleting(true);
    try {
      await fetch(`/api/pedidos/${id}`, { method:"DELETE" });
      setConfirmId(null); carregar(mesFiltro);
    } catch { alert("Erro ao excluir."); }
    setDeleting(false);
  }

  return (
    <>
      <style>{`
        /* modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(2px); }
        .modal { background:#fff; border-radius:14px; padding:28px; width:100%; max-width:380px; box-shadow:0 16px 48px rgba(0,0,0,.18); margin:16px; }
        .modal h3 { font-size:16px; font-weight:700; color:#1a1a1a; margin-bottom:8px; }
        .modal p  { font-size:13px; color:#5a5f6b; line-height:1.6; }
        .modal-actions { display:flex; gap:10px; margin-top:20px; justify-content:flex-end; }
        .btn-cancel { padding:9px 18px; background:#f4f5f7; color:#5a5f6b; border:1.5px solid #e2e4e8; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
        .btn-danger { padding:9px 18px; background:#C0242C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
        .btn-danger:hover:not(:disabled) { background:#a01e25; }
        .btn-danger:disabled { opacity:.5; cursor:not-allowed; }

        /* edit banner */
        .edit-banner { background:#eff6ff; border:1.5px solid rgba(29,78,216,.2); border-radius:8px; padding:10px 14px; font-size:12px; color:#1d4ed8; font-weight:600; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .edit-banner button { font-size:11px; color:#1d4ed8; background:transparent; border:1px solid rgba(29,78,216,.25); border-radius:6px; padding:3px 10px; cursor:pointer; font-weight:600; }
        .edit-banner button:hover { background:rgba(29,78,216,.08); }

        /* NF */
        .nf-toggle { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg); border:1.5px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; user-select:none; transition:border-color .15s; }
        .nf-toggle:hover { border-color:var(--border2); }
        .nf-toggle input { width:15px; height:15px; accent-color:var(--green); cursor:pointer; flex-shrink:0; }
        .nf-toggle-text { font-size:13px; color:var(--text); font-weight:500; flex:1; }
        .nf-badge { font-family:'DM Mono',monospace; font-size:10px; padding:2px 8px; border-radius:20px; font-weight:600; }
        .nf-badge--sim { background:var(--green-dim); color:var(--green); border:1px solid rgba(26,138,74,.2); }
        .nf-badge--nao { background:var(--bg3); color:var(--text3); border:1px solid var(--border); }
        .nf-box { background:var(--green-dim); border:1.5px solid rgba(26,138,74,.18); border-radius:var(--radius-sm); padding:16px; display:flex; flex-direction:column; gap:14px; animation:pop .18s ease; }
        .nf-box-title { font-size:11px; font-weight:700; color:var(--green); letter-spacing:.5px; text-transform:uppercase; }

        /* custo bruto */
        .custo-box { background:var(--amber-dim); border:1.5px solid rgba(180,83,9,.15); border-radius:var(--radius-sm); padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
        .custo-box-title { font-size:11px; font-weight:700; color:var(--amber); letter-spacing:.5px; text-transform:uppercase; }
        .custo-info { font-size:11px; color:var(--amber); background:rgba(180,83,9,.06); border-radius:6px; padding:7px 10px; line-height:1.5; border-left:2px solid var(--amber); }

        /* breakdown — sem corte */
        .breakdown { display:grid; grid-template-columns:1fr 1fr 1fr; border:1.5px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; background:var(--bg2); }
        .bd-item { padding:10px 12px; border-right:1px solid var(--border); min-width:0; }
        .bd-item:last-child { border-right:none; }
        .bd-label { font-size:10px; color:var(--text3); margin-bottom:4px; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.8px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bd-val   { font-family:'DM Mono',monospace; font-size:12px; font-weight:700; word-break:break-all; }
        .bd-val--t { color:var(--text); }
        .bd-val--n { color:var(--green); }
        .bd-val--s { color:var(--amber); }
        .bd-val--r { color:var(--red); }
        @media(max-width:480px){ .breakdown { grid-template-columns:1fr; } .bd-item { border-right:none; border-bottom:1px solid var(--border); } .bd-item:last-child { border-bottom:none; } }

        /* filtro mês */
        .mes-filtro-wrap { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .mes-filtro-label { font-size:12px; font-weight:600; color:var(--text2); }

        /* TABELA */
        .tabela-wrap { overflow-x:auto; border-radius:var(--radius); border:1.5px solid var(--border); box-shadow:var(--shadow-sm); background:#fff; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead tr { background:#f4f5f7; border-bottom:1.5px solid var(--border); }
        thead th { padding:10px 14px; text-align:left; font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.6px; white-space:nowrap; }
        tbody tr { border-bottom:1px solid #f4f5f7; transition:background .12s; }
        tbody tr:last-child { border-bottom:none; }
        tbody tr:hover { background:#fafafa; }
        tbody td { padding:11px 14px; color:var(--text); vertical-align:middle; }
        .td-num  { font-weight:700; color:var(--red); white-space:nowrap; }
        .td-mono { font-family:'DM Mono',monospace; font-size:12px; font-weight:600; }
        .td-meta { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3); }
        .td-acoes { display:flex; gap:5px; justify-content:flex-end; }
        .btn-edit-t, .btn-del-t {
          padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600;
          cursor:pointer; border:1.5px solid; transition:all .15s; white-space:nowrap;
        }
        .btn-edit-t { background:#f4f5f7; color:#5a5f6b; border-color:#e2e4e8; }
        .btn-edit-t:hover { border-color:#5a5f6b; }
        .btn-del-t  { background:#fff5f5; color:var(--red); border-color:rgba(192,36,44,.2); }
        .btn-del-t:hover { background:var(--red-dim); border-color:var(--red); }

        .api-err  { padding:10px 14px; background:#fff5f5; border:1.5px solid rgba(192,36,44,.2); border-radius:8px; font-size:13px; color:#C0242C; font-weight:500; }
        .load-msg { text-align:center; padding:32px; color:var(--text3); font-size:13px; }
      `}</style>

      {/* modal exclusão */}
      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Excluir pedido?</h3>
            <p>Essa ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn-danger" disabled={deleting} onClick={() => excluir(confirmId)}>
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-wrap">
        <div className="page-header">
          <h1>Pedidos emitidos</h1>
          <p>Registre e gerencie os pedidos faturados com controle de nota fiscal.</p>
        </div>

        {/* formulário */}
        <div className="card" style={{marginBottom:28}}>
          <div className="card-head"><h2>{editId ? "Editar pedido" : "Novo pedido"}</h2></div>
          <div className="card-body">
            <form onSubmit={submit} noValidate style={{display:"contents"}}>

              {editId && (
                <div className="edit-banner">
                  <span>✏️ Editando pedido #{editId}</span>
                  <button type="button" onClick={resetForm}>Cancelar edição</button>
                </div>
              )}

              {/* linha 1: número + valor total */}
              <div className="row-2">
                <div className="field">
                  <label className="field-label">Número do pedido <em>*</em></label>
                  <input className={`input${erros.num?" err":""}`}
                    placeholder="ex: PED-2025-001" value={num}
                    onChange={e=>{setNum(e.target.value);setErros(r=>({...r,num:undefined}));}}/>
                  {erros.num && <p className="field-err">⚠ {erros.num}</p>}
                </div>
                <div className="field">
                  <label className="field-label">Valor total <em>*</em></label>
                  <div className="money-wrap">
                    <span className="money-pre">R$</span>
                    <input className={`input money-input${erros.vt?" err":""}`}
                      type="text" inputMode="numeric" placeholder="0,00" value={vtRaw}
                      onChange={e=>{setVtRaw(mascaraMoeda(e.target.value));setErros(r=>({...r,vt:undefined}));}}/>
                  </div>
                  {erros.vt && <p className="field-err">⚠ {erros.vt}</p>}
                </div>
              </div>

              {/* linha 2: data + mês */}
              <div className="row-2">
                <Picker label="Data de emissão" required
                  placeholder="Selecionar" display={labelDataBR(data)} erro={erros.data}>
                  {close => <CalDia valor={data} onChange={v=>{setData(v);setErros(r=>({...r,data:undefined}));}} onClose={close}/>}
                </Picker>
                <Picker label="Mês de competência" required
                  placeholder="Selecionar" display={labelMesRef(mes)} erro={erros.mes}>
                  {close => <CalMes valor={mes} onChange={v=>{setMes(v);setErros(r=>({...r,mes:undefined}));}} onClose={close}/>}
                </Picker>
              </div>

              {/* custo bruto */}
              <div className="custo-box">
                <div className="custo-box-title">💰 Preço de Custo — Itens do Pedido</div>
                <div className="field">
                  <label className="field-label">Valor <small>(peças e serviços, sem margem — opcional)</small></label>
                  <div className="money-wrap">
                    <span className="money-pre">R$</span>
                    <input className="input money-input"
                      type="text" inputMode="numeric" placeholder="0,00" value={cbRaw}
                      onChange={e => setCbRaw(mascaraMoeda(e.target.value))}/>
                  </div>
                </div>
                {vt > 0 && cb > 0 && (
                  <>
                    <div className="breakdown">
                      <div className="bd-item">
                        <div className="bd-label">Valor pedido</div>
                        <div className="bd-val bd-val--t">{fmt(vt)}</div>
                      </div>
                      <div className="bd-item">
                        <div className="bd-label">Preço de custo</div>
                        <div className="bd-val bd-val--s">{fmt(cb)}</div>
                      </div>
                      <div className="bd-item">
                        <div className="bd-label">Margem bruta</div>
                        <div className={`bd-val ${margem>=0?"bd-val--n":"bd-val--r"}`}>{fmt(margem??0)}</div>
                      </div>
                    </div>
                    {!editId && (
                      <div className="custo-info">
                        ℹ️ Ao salvar, será registrado automaticamente como despesa de <strong>Materiais</strong> com a descrição <em>"Itens do pedido: {num||"..."}"</em>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* NF */}
              <div className="field">
                <label className="nf-toggle">
                  <input type="checkbox" checked={nf} onChange={e=>toggleNf(e.target.checked)}/>
                  <span className="nf-toggle-text">Nota fiscal emitida</span>
                  <span className={`nf-badge ${nf?"nf-badge--sim":"nf-badge--nao"}`}>{nf?"SIM":"NÃO"}</span>
                </label>
                {nf && (
                  <div className="nf-box" style={{marginTop:10}}>
                    <div className="nf-box-title">Dados da nota fiscal</div>
                    <div className="row-2">
                      <div className="field">
                        <label className="field-label">Valor da NF <em>*</em>{vt>0&&<small> máx {fmt(vt)}</small>}</label>
                        <div className="money-wrap">
                          <span className="money-pre">R$</span>
                          <input className={`input money-input${erros.vn?" err":""}`}
                            type="text" inputMode="numeric" placeholder="0,00" value={vnRaw}
                            onChange={e=>{setVnRaw(mascaraMoeda(e.target.value));setErros(r=>({...r,vn:undefined}));}}/>
                        </div>
                        {erros.vn && <p className="field-err">⚠ {erros.vn}</p>}
                      </div>
                      <div className="field">
                        <label className="field-label">Número da NF <em>*</em></label>
                        <input className={`input${erros.nfNum?" err":""}`}
                          placeholder="ex: 000123" value={nfNum}
                          onChange={e=>{setNfNum(e.target.value);setErros(r=>({...r,nfNum:undefined}));}}/>
                        {erros.nfNum && <p className="field-err">⚠ {erros.nfNum}</p>}
                      </div>
                    </div>
                    {vt>0 && vn>0 && (
                      <div className="breakdown" style={{gridTemplateColumns:"1fr 1fr"+(vsemNf>0?" 1fr":"")}}>
                        <div className="bd-item"><div className="bd-label">Total</div><div className="bd-val bd-val--t">{fmt(vt)}</div></div>
                        <div className="bd-item"><div className="bd-label">Com NF</div><div className="bd-val bd-val--n">{fmt(vn)}</div></div>
                        {vsemNf>0&&<div className="bd-item"><div className="bd-label">Sem NF</div><div className="bd-val bd-val--s">{fmt(vsemNf)}</div></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {apiErr && <div className="api-err">⚠ {apiErr}</div>}
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Salvando…" : editId ? "Salvar alterações" : "Salvar pedido"}
              </button>
              {ok && <div className="toast">✓ {editId ? "Pedido atualizado!" : "Pedido registrado com sucesso!"}</div>}
            </form>
          </div>
        </div>

        {/* lista em tabela */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <h2 style={{fontSize:15, fontWeight:700, color:"#1a1a1a"}}>Pedidos registrados</h2>
            <span className="count-badge">{lista.length}</span>
          </div>
          <div className="mes-filtro-wrap" style={{marginBottom:0}}>
            <span className="mes-filtro-label">Mês:</span>
            <Picker placeholder="Selecionar" display={labelMesRef(mesFiltro)}>
              {close => <CalMes valor={mesFiltro} onChange={v=>{setMesFiltro(v);close();}} onClose={close}/>}
            </Picker>
          </div>
        </div>

        {loading ? (
          <div className="load-msg">Carregando pedidos…</div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nenhum pedido em {labelMesRef(mesFiltro)}.
          </div>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data ↓</th>
                  <th>Valor total</th>
                  <th>NF</th>
                  <th>Valor NF</th>
                  <th>Preço de custo</th>
                  <th>Margem bruta</th>
                  <th style={{textAlign:"right"}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(p => {
                  const vTotal = Number(p.valorTotal);
                  const vCusto = Number(p.custoBruto ?? 0);
                  const vNf    = Number(p.valorNf ?? 0);
                  const marg   = vCusto > 0 ? vTotal - vCusto : null;
                  return (
                    <tr key={p.id}>
                      <td className="td-num">{p.numeroPedido}</td>
                      <td className="td-meta">{labelDataBR(p.dataEmissao?.slice(0,10))}</td>
                      <td className="td-mono">{fmt(vTotal)}</td>
                      <td>
                        {p.nfEmitida
                          ? <span className="tag tag--green">#{p.numeroNf}</span>
                          : <span className="tag tag--amber">Sem NF</span>}
                      </td>
                      <td className="td-mono">{p.nfEmitida ? fmt(vNf) : "—"}</td>
                      <td className="td-mono" style={{color:"var(--amber)"}}>{vCusto > 0 ? fmt(vCusto) : "—"}</td>
                      <td className="td-mono" style={{color: marg===null?"var(--text3)":marg>=0?"var(--green)":"var(--red)"}}>
                        {marg !== null ? fmt(marg) : "—"}
                      </td>
                      <td>
                        <div className="td-acoes">
                          <button className="btn-edit-t" onClick={() => iniciarEdicao(p)}>Editar</button>
                          <button className="btn-del-t"  onClick={() => setConfirmId(p.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

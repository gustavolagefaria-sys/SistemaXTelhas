"use client";

import { useState, useEffect } from "react";
import { Picker, CalDia, CalMes, dataHoje, toISO, toMesRef, labelDataBR, labelMesRef } from "@/components/DatePicker";
import { mascaraMoeda, mascaraQtd, parseMoeda, parseQtd, fmt } from "@/lib/money";

const TIPOS_DESPESA = [
  { id:1,  nome:"Materiais"              }, { id:2,  nome:"Salário"                },
  { id:3,  nome:"Alimentação"            }, { id:4,  nome:"Aluguel"                },
  { id:5,  nome:"Energia"                }, { id:6,  nome:"Frete"                  },
  { id:7,  nome:"Internet"               }, { id:8,  nome:"Marketing"              },
  { id:9,  nome:"Seguradora"             }, { id:10, nome:"Bancos"                 },
  { id:11, nome:"Manutenção de máquinas" }, { id:12, nome:"Manutenção de veículos" },
  { id:13, nome:"Retiradas"              }, { id:14, nome:"Serviços"               },
  { id:15, nome:"Rescisão contratual"    }, { id:16, nome:"Outros"                 },
];

const UNIDADES = [
  { sigla:"KG",nome:"Quilograma" },{ sigla:"UN",nome:"Unidade"      },
  { sigla:"LT",nome:"Litro"     },{ sigla:"MT",nome:"Metro"         },
  { sigla:"MT2",nome:"Metro²"   },{ sigla:"MT3",nome:"Metro³"       },
  { sigla:"PC",nome:"Peça"      },{ sigla:"CX",nome:"Caixa"         },
  { sigla:"RL",nome:"Rolo"      },{ sigla:"SC",nome:"Saco"          },
  { sigla:"GL",nome:"Galão"     },{ sigla:"TON",nome:"Tonelada"     },
];

const ICONES = {
  "Materiais":"📦","Salário":"👤","Alimentação":"🍽️","Aluguel":"🏠",
  "Energia":"⚡","Frete":"🚚","Internet":"📶","Marketing":"📣",
  "Seguradora":"🛡️","Bancos":"🏦","Manutenção de máquinas":"⚙️",
  "Manutenção de veículos":"🚗","Retiradas":"💸","Serviços":"🔧",
  "Rescisão contratual":"📄","Outros":"🗂️",
};

const EMPRESA_ID = 1;

export default function DespesasPage() {
  const hoje = dataHoje();

  const [mesFiltro, setMesFiltro] = useState(toMesRef(hoje));
  const [editId,    setEditId]    = useState(null);
  const [tipo,      setTipo]      = useState("");
  const [desc,      setDesc]      = useState("");
  const [um,        setUm]        = useState("");
  const [qtdRaw,    setQtdRaw]    = useState("");
  const [precoRaw,  setPrecoRaw]  = useState("");
  const [valorRaw,  setValorRaw]  = useState("");
  const [data,      setData]      = useState(toISO(hoje));
  const [mes,       setMes]       = useState(toMesRef(hoje));
  const [erros,     setErros]     = useState({});
  const [busy,      setBusy]      = useState(false);
  const [ok,        setOk]        = useState(false);
  const [apiErr,    setApiErr]    = useState("");
  const [lista,     setLista]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const tipoObj    = TIPOS_DESPESA.find(t => t.id === Number(tipo));
  const isMaterial = tipoObj?.nome === "Materiais";
  const isOutros   = tipoObj?.nome === "Outros";
  const isRetirada = tipoObj?.nome === "Retiradas";
  const totalMat   = isMaterial ? parseQtd(qtdRaw) * parseMoeda(precoRaw) : 0;

  async function carregar(mr) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/despesas?empresa_id=${EMPRESA_ID}&mes_ref=${mr}`);
      const data = await res.json();
      setLista(Array.isArray(data) ? data.sort((a,b) => new Date(b.dataLancamento) - new Date(a.dataLancamento)) : []);
    } catch { setLista([]); }
    setLoading(false);
  }

  useEffect(() => { carregar(mesFiltro); }, [mesFiltro]);

  function resetForm() {
    setEditId(null); setTipo(""); setDesc(""); setUm("");
    setQtdRaw(""); setPrecoRaw(""); setValorRaw("");
    setData(toISO(hoje)); setMes(toMesRef(hoje));
    setErros({}); setApiErr("");
  }

  function handleTipo(v) {
    setTipo(v); setUm(""); setQtdRaw(""); setPrecoRaw(""); setValorRaw("");
    setErros(e => ({ ...e, tipo:undefined }));
  }

  function iniciarEdicao(item) {
    setEditId(item.id);
    setTipo(String(item.tipoId));
    setDesc(item.descricao ?? "");
    setUm(item.unidadeMedida ?? "");
    setQtdRaw(item.quantidade ? mascaraQtd(String(Math.round(item.quantidade*1000))) : "");
    setPrecoRaw(item.precoUnitario ? mascaraMoeda(String(Math.round(item.precoUnitario*100))) : "");
    setValorRaw(mascaraMoeda(String(Math.round(Number(item.valor)*100))));
    setData(item.dataLancamento?.slice(0,10) ?? toISO(hoje));
    setMes(item.mesRef ?? toMesRef(hoje));
    setErros({}); setApiErr("");
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function validar() {
    const e = {};
    if (!tipo) e.tipo = "Selecione o tipo de despesa.";
    if ((isOutros||isRetirada) && !desc.trim())
      e.desc = isRetirada ? "Informe o beneficiário." : "Descricao obrigatoria para Outros.";
    if (isMaterial) {
      if (!um)                                e.um    = "Selecione a unidade.";
      if (!qtdRaw||parseQtd(qtdRaw)<=0)       e.qtd   = "Informe a quantidade.";
      if (!precoRaw||parseMoeda(precoRaw)<=0)  e.preco = "Informe o preço unitário.";
    } else {
      if (!valorRaw||parseMoeda(valorRaw)<=0)  e.valor = "Informe o valor.";
    }
    if (!data) e.data = "Selecione a data.";
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }
    setErros({}); setApiErr(""); setBusy(true);

    const valorFinal = isMaterial ? totalMat : parseMoeda(valorRaw);
    const body = {
      empresa_id: EMPRESA_ID, tipo_id: Number(tipo), criado_por_id: 1,
      descricao: desc || null,
      unidade_medida: isMaterial ? um : null,
      quantidade:     isMaterial ? parseQtd(qtdRaw) : null,
      preco_unitario: isMaterial ? parseMoeda(precoRaw) : null,
      valor: valorFinal, data_lancamento: data, mes_ref: mes,
    };

    try {
      const url    = editId ? `/api/despesas/${editId}` : "/api/despesas";
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      if (!res.ok) { const err=await res.json(); setApiErr(err.error??"Erro ao salvar."); setBusy(false); return; }
      setOk(true); resetForm(); carregar(mesFiltro);
      setTimeout(() => setOk(false), 3000);
    } catch { setApiErr("Erro de conexão. Verifique se o servidor está rodando."); }
    setBusy(false);
  }

  async function excluir(id) {
    setDeleting(true);
    try {
      await fetch(`/api/despesas/${id}`, { method:"DELETE" });
      setConfirmId(null); carregar(mesFiltro);
    } catch { alert("Erro ao excluir."); }
    setDeleting(false);
  }

  const totalLista = lista.reduce((s,i) => s + Number(i.valor), 0);

  return (
    <>
      <style>{`
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(2px); }
        .modal { background:#fff; border-radius:14px; padding:28px; width:100%; max-width:380px; box-shadow:0 16px 48px rgba(0,0,0,.18); margin:16px; }
        .modal h3 { font-size:16px; font-weight:700; color:#1a1a1a; margin-bottom:8px; }
        .modal p  { font-size:13px; color:#5a5f6b; line-height:1.6; }
        .modal-actions { display:flex; gap:10px; margin-top:20px; justify-content:flex-end; }
        .btn-cancel { padding:9px 18px; background:#f4f5f7; color:#5a5f6b; border:1.5px solid #e2e4e8; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
        .btn-danger { padding:9px 18px; background:#C0242C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
        .btn-danger:hover:not(:disabled) { background:#a01e25; }
        .btn-danger:disabled { opacity:.5; cursor:not-allowed; }

        .edit-banner { background:#eff6ff; border:1.5px solid rgba(29,78,216,.2); border-radius:8px; padding:10px 14px; font-size:12px; color:#1d4ed8; font-weight:600; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .edit-banner button { font-size:11px; color:#1d4ed8; background:transparent; border:1px solid rgba(29,78,216,.25); border-radius:6px; padding:3px 10px; cursor:pointer; font-weight:600; }

        .mat-box { background:var(--amber-dim); border:1.5px solid rgba(180,83,9,.15); border-radius:var(--radius-sm); padding:16px; display:flex; flex-direction:column; gap:14px; }
        .mat-title { font-size:11px; font-weight:700; color:var(--amber); letter-spacing:.5px; text-transform:uppercase; }
        .total-row { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:10px 13px; }
        .total-label { font-size:12px; color:var(--text2); font-weight:600; }
        .total-val   { font-family:'DM Mono',monospace; font-size:16px; font-weight:700; }
        .total-val.active { color:#C0242C; }
        .total-val.zero   { color:var(--text3); }

        .hint { font-size:11px; color:var(--amber); padding:8px 10px; line-height:1.5; background:rgba(180,83,9,.06); border-radius:7px; border-left:2px solid var(--amber); }

        .sel { width:100%; background:var(--bg); border:1.5px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:'Instrument Sans',sans-serif; font-size:14px; padding:10px 36px 10px 12px; outline:none; appearance:none; cursor:pointer; transition:border-color .15s,box-shadow .15s; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239aa0ad' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
        .sel:focus { border-color:var(--red); box-shadow:0 0 0 3px rgba(192,36,44,.1); }
        .sel.err   { border-color:var(--red); }
        @media(max-width:640px){ .sel { font-size:16px; } }

        .mes-filtro-wrap { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .mes-filtro-label { font-size:12px; font-weight:600; color:var(--text2); }

        /* tabela */
        .tabela-wrap { overflow-x:auto; border-radius:var(--radius); border:1.5px solid var(--border); box-shadow:var(--shadow-sm); background:#fff; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead tr { background:#f4f5f7; border-bottom:1.5px solid var(--border); }
        thead th { padding:10px 14px; text-align:left; font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.6px; white-space:nowrap; }
        tbody tr { border-bottom:1px solid #f4f5f7; transition:background .12s; }
        tbody tr:last-child { border-bottom:none; }
        tbody tr:hover { background:#fafafa; }
        tbody td { padding:11px 14px; color:var(--text); vertical-align:middle; }
        tfoot tr { border-top:2px solid var(--border); background:#f4f5f7; }
        tfoot td { padding:10px 14px; font-weight:700; font-size:13px; }
        .td-tipo  { font-weight:700; color:var(--red); display:flex; align-items:center; gap:7px; white-space:nowrap; }
        .td-mono  { font-family:'DM Mono',monospace; font-size:12px; font-weight:600; }
        .td-desc  { font-size:12px; color:var(--text2); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .td-meta  { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3); white-space:nowrap; }
        .td-acoes { display:flex; gap:5px; justify-content:flex-end; }
        .btn-edit-t,.btn-del-t { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1.5px solid; transition:all .15s; white-space:nowrap; }
        .btn-edit-t { background:#f4f5f7; color:#5a5f6b; border-color:#e2e4e8; }
        .btn-edit-t:hover { border-color:#5a5f6b; }
        .btn-del-t  { background:#fff5f5; color:var(--red); border-color:rgba(192,36,44,.2); }
        .btn-del-t:hover { background:var(--red-dim); border-color:var(--red); }

        .api-err  { padding:10px 14px; background:#fff5f5; border:1.5px solid rgba(192,36,44,.2); border-radius:8px; font-size:13px; color:#C0242C; font-weight:500; }
        .load-msg { text-align:center; padding:32px; color:var(--text3); font-size:13px; }
      `}</style>

      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Excluir lançamento?</h3>
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
          <h1>Despesas</h1>
          <p>Registre e gerencie todos os custos e despesas.</p>
        </div>

        {/* formulário */}
        <div className="card" style={{marginBottom:28}}>
          <div className="card-head"><h2>{editId ? "Editar lançamento" : "Novo lançamento"}</h2></div>
          <div className="card-body">
            <form onSubmit={submit} noValidate style={{display:"contents"}}>

              {editId && (
                <div className="edit-banner">
                  <span>✏️ Editando lançamento #{editId}</span>
                  <button type="button" onClick={resetForm}>Cancelar edição</button>
                </div>
              )}

              {/* linha 1: tipo + data + mês */}
              <div className="row-2" style={{gridTemplateColumns:"1fr 1fr 1fr"}} >
                <div className="field" style={{gridColumn:"1/2"}}>
                  <label className="field-label">Tipo de despesa <em>*</em></label>
                  <select className={`sel${erros.tipo?" err":""}`} value={tipo} onChange={e=>handleTipo(e.target.value)}>
                    <option value="">Selecionar…</option>
                    {TIPOS_DESPESA.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                  {erros.tipo && <p className="field-err">⚠ {erros.tipo}</p>}
                </div>
                <Picker label="Data de lançamento" required
                  placeholder="Selecionar" display={labelDataBR(data)} erro={erros.data}>
                  {close=><CalDia valor={data} onChange={v=>{setData(v);setErros(r=>({...r,data:undefined}));}} onClose={close}/>}
                </Picker>
                <Picker label="Mês de competência" required
                  placeholder="Selecionar" display={labelMesRef(mes)} erro={erros.mes}>
                  {close=><CalMes valor={mes} onChange={v=>{setMes(v);setErros(r=>({...r,mes:undefined}));}} onClose={close}/>}
                </Picker>
              </div>

              {/* materiais */}
              {isMaterial && (
                <div className="mat-box">
                  <div className="mat-title">📦 Detalhes do material</div>
                  <div className="field">
                    <label className="field-label">Unidade de medida <em>*</em></label>
                    <select className={`sel${erros.um?" err":""}`} value={um} onChange={e=>{setUm(e.target.value);setErros(r=>({...r,um:undefined}));}}>
                      <option value="">Selecionar…</option>
                      {UNIDADES.map(u=><option key={u.sigla} value={u.sigla}>{u.sigla} — {u.nome}</option>)}
                    </select>
                    {erros.um && <p className="field-err">⚠ {erros.um}</p>}
                  </div>
                  <div className="row-2">
                    <div className="field">
                      <label className="field-label">Quantidade {um&&<small>({um})</small>} <em>*</em></label>
                      <input className={`input${erros.qtd?" err":""}`} type="text" inputMode="numeric" placeholder="0,000" value={qtdRaw}
                        onChange={e=>{setQtdRaw(mascaraQtd(e.target.value));setErros(r=>({...r,qtd:undefined}));}}
                        style={{fontFamily:"'DM Mono',monospace"}}/>
                      {erros.qtd && <p className="field-err">⚠ {erros.qtd}</p>}
                    </div>
                    <div className="field">
                      <label className="field-label">Preço unitário <em>*</em></label>
                      <div className="money-wrap">
                        <span className="money-pre">R$</span>
                        <input className={`input money-input${erros.preco?" err":""}`} type="text" inputMode="numeric" placeholder="0,00" value={precoRaw}
                          onChange={e=>{setPrecoRaw(mascaraMoeda(e.target.value));setErros(r=>({...r,preco:undefined}));}}/>
                      </div>
                      {erros.preco && <p className="field-err">⚠ {erros.preco}</p>}
                    </div>
                  </div>
                  <div className="total-row">
                    <span className="total-label">Total calculado</span>
                    <span className={`total-val ${totalMat>0?"active":"zero"}`}>{totalMat>0?fmt(totalMat):"R$ —"}</span>
                  </div>
                </div>
              )}

              {/* valor — não materiais */}
              {!isMaterial && (
                <div className="field">
                  <label className="field-label">Valor <em>*</em></label>
                  <div className="money-wrap">
                    <span className="money-pre">R$</span>
                    <input className={`input money-input${erros.valor?" err":""}`} type="text" inputMode="numeric" placeholder="0,00" value={valorRaw}
                      onChange={e=>{setValorRaw(mascaraMoeda(e.target.value));setErros(r=>({...r,valor:undefined}));}}/>
                  </div>
                  {erros.valor && <p className="field-err">⚠ {erros.valor}</p>}
                </div>
              )}

              {/* descrição */}
              <div className="field">
                <label className="field-label">
                  Descrição {(isOutros||isRetirada) ? <em>*</em> : <small>(opcional)</small>}
                </label>
                <textarea className={`input textarea${erros.desc?" err":""}`} rows={2}
                  placeholder={isRetirada?"Nome do beneficiário…":isOutros?"Descreva a despesa…":isMaterial?"Nome ou especificação…":"Detalhes adicionais…"}
                  value={desc} onChange={e=>{setDesc(e.target.value);setErros(r=>({...r,desc:undefined}));}}/>
                {isRetirada&&!erros.desc&&<p className="hint">💸 Informe o nome do sócio ou responsável.</p>}
                {erros.desc && <p className="field-err">⚠ {erros.desc}</p>}
              </div>

              {apiErr && <div className="api-err">⚠ {apiErr}</div>}
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy?"Salvando…":editId?"Salvar alterações":"Salvar despesa"}
              </button>
              {ok && <div className="toast">✓ {editId?"Lançamento atualizado!":"Despesa lançada com sucesso!"}</div>}
            </form>
          </div>
        </div>

        {/* cabeçalho da tabela */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h2 style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>Lançamentos</h2>
            <span className="count-badge">{lista.length}</span>
          </div>
          <div className="mes-filtro-wrap">
            <span className="mes-filtro-label">Mês:</span>
            <Picker placeholder="Selecionar" display={labelMesRef(mesFiltro)}>
              {close=><CalMes valor={mesFiltro} onChange={v=>{setMesFiltro(v);close();}} onClose={close}/>}
            </Picker>
          </div>
        </div>

        {loading ? (
          <div className="load-msg">Carregando lançamentos…</div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M13 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nenhum lançamento em {labelMesRef(mesFiltro)}.
          </div>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Data ↓</th>
                  <th>Qtd / UM</th>
                  <th>Valor</th>
                  <th style={{textAlign:"right"}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="td-tipo">
                        <span>{ICONES[item.tipo?.nome]??""}</span>
                        {item.tipo?.nome}
                      </div>
                    </td>
                    <td className="td-desc">{item.descricao || "—"}</td>
                    <td className="td-meta">{labelDataBR(item.dataLancamento?.slice(0,10))}</td>
                    <td className="td-meta">
                      {item.unidadeMedida
                        ? `${Number(item.quantidade).toLocaleString("pt-BR",{minimumFractionDigits:3})} ${item.unidadeMedida}`
                        : "—"}
                    </td>
                    <td className="td-mono">{fmt(Number(item.valor))}</td>
                    <td>
                      <div className="td-acoes">
                        <button className="btn-edit-t" onClick={()=>iniciarEdicao(item)}>Editar</button>
                        <button className="btn-del-t"  onClick={()=>setConfirmId(item.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{color:"var(--text2)"}}>Total do mês</td>
                  <td className="td-mono" style={{color:"var(--red)"}}>{fmt(totalLista)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

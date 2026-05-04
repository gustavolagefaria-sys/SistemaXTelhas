"use client";

import { useState, useCallback } from "react";
import { Picker, CalDia, dataHoje, toISO, labelDataBR, MESES } from "@/components/DatePicker";
import { fmt } from "@/lib/money";

const EMPRESA_ID  = 1;
const HOJE_DATE   = new Date();
const HOJE_ISO    = HOJE_DATE.toISOString().slice(0, 10);

function pct(v, t) { return t ? (v/t*100).toFixed(1).replace(".",",")+"%" : "0,0%"; }

function mesesFechados() {
  const lista = [];
  let ano = HOJE_DATE.getFullYear(), mes = HOJE_DATE.getMonth() - 1;
  for (let i = 0; i < 12; i++) {
    if (mes < 0) { mes = 11; ano--; }
    lista.push({ ano, mes, label:`${MESES[mes].slice(0,3)}/${String(ano).slice(2)}`, mesRef:`${ano}-${String(mes+1).padStart(2,"0")}` });
    mes--;
  }
  return lista;
}

function labelFiltro(modo, mesF, di, df) {
  if (modo === "atual") {
    return `01/${String(HOJE_DATE.getMonth()+1).padStart(2,"0")}/${HOJE_DATE.getFullYear()} até ${labelDataBR(HOJE_ISO)}`;
  }
  if (modo === "fechado" && mesF) return `${MESES[mesF.mes]} ${mesF.ano}`;
  if (modo === "periodo" && di && df) return `${labelDataBR(di)} → ${labelDataBR(df)}`;
  return "—";
}

function labelTitulo(modo, mesF, di, df) {
  if (modo === "atual") return `${MESES[HOJE_DATE.getMonth()]} ${HOJE_DATE.getFullYear()}`;
  if (modo === "fechado" && mesF) return `${MESES[mesF.mes]} ${mesF.ano}`;
  if (modo === "periodo" && di && df) return `${labelDataBR(di)} a ${labelDataBR(df)}`;
  return "";
}

export default function RelatorioPage() {
  const MESES_FECHADOS = mesesFechados();

  const [modo,    setModo]    = useState("atual");
  const [mesF,    setMesF]    = useState(MESES_FECHADOS[0]);
  const [di,      setDi]      = useState("");
  const [df,      setDf]      = useState("");
  const [erroPer, setErroPer] = useState("");

  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  // monta parâmetros da API conforme filtro
  function buildParams() {
    if (modo === "atual") return `modo=atual`;
    if (modo === "fechado" && mesF) return `modo=fechado&mes_ref=${mesF.mesRef}`;
    if (modo === "periodo" && di && df) return `modo=periodo&data_inicio=${di}&data_fim=${df}`;
    return null;
  }

  const carregar = useCallback(async () => {
    const params = buildParams();
    if (!params) return;
    setLoading(true); setErro("");
    try {
      const res = await fetch(`/api/relatorio?empresa_id=${EMPRESA_ID}&${params}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Erro"); }
      const d = await res.json();
      setDados(d);
      setAtualizadoEm(new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}));
    } catch (e) {
      setErro(e.message || "Erro ao carregar. Verifique o servidor.");
      setDados(null);
    }
    setLoading(false);
  }, [modo, mesF, di, df]);

  function aplicar() {
    if (modo === "periodo") {
      if (!di)     { setErroPer("Selecione a data de início."); return; }
      if (!df)     { setErroPer("Selecione a data fim."); return; }
      if (df < di) { setErroPer("Data fim não pode ser anterior à data início."); return; }
      setErroPer("");
    }
    carregar();
  }

  const temDados = dados && (dados.totais?.qtd_pedidos > 0 || dados.totais?.qtd_despesas > 0);
  const fat    = dados?.faturamento ?? {};
  const desp   = dados?.despesas    ?? {};
  const result = dados?.resultado   ?? {};

  const hoje = new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});

  return (
    <>
      <style>{`
        @media print {
          .sidebar,.topbar,.no-print { display:none !important; }
          .app-shell { display:block !important; }
          .main-content { overflow:visible !important; }
          .page-wrap { padding:12px 20px !important; max-width:100% !important; }
          .print-header { display:flex !important; }
          .cards-grid { grid-template-columns:repeat(4,1fr) !important; }
          .analise-cols { grid-template-columns:1fr 1fr !important; }
          * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
        .print-header {
          display:none; align-items:center; justify-content:space-between;
          margin-bottom:16px; padding-bottom:14px; border-bottom:3px solid #C0242C;
        }
        .ph-logo  { font-size:20px; font-weight:800; color:#C0242C; }
        .ph-sub   { font-size:11px; color:#5a5f6b; margin-top:2px; }
        .ph-info  { text-align:right; font-size:11px; color:#5a5f6b; line-height:1.6; }
        .ph-titulo{ font-size:14px; font-weight:700; color:#1a1a1a; }

        /* filtros */
        .filtros-card { background:#fff; border:1.5px solid #e2e4e8; border-radius:12px; padding:20px 22px; margin-bottom:22px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
        .filtros-title { font-size:11px; font-weight:700; color:#9aa0ad; letter-spacing:.8px; text-transform:uppercase; margin-bottom:14px; }
        .modos { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
        .modo-btn { padding:8px 16px; border-radius:8px; border:1.5px solid #e2e4e8; background:#f4f5f7; color:#5a5f6b; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; }
        .modo-btn:hover  { border-color:#1d4ed8; color:#1d4ed8; }
        .modo-btn.ativo  { background:#1d4ed8; color:#fff; border-color:#1d4ed8; font-weight:700; }
        .modo-desc { font-size:13px; color:#5a5f6b; }
        .modo-desc span { color:#1d4ed8; font-weight:600; }
        .meses-chips { display:flex; gap:6px; flex-wrap:wrap; }
        .mes-chip { padding:6px 13px; border-radius:20px; border:1.5px solid #e2e4e8; background:#f4f5f7; color:#5a5f6b; font-family:'DM Mono',monospace; font-size:11px; cursor:pointer; font-weight:500; transition:all .15s; }
        .mes-chip:hover  { border-color:#1d4ed8; color:#1d4ed8; }
        .mes-chip.ativo  { background:#1d4ed8; color:#fff; border-color:#1d4ed8; }
        .periodo-row { display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; }
        .periodo-row > .picker { flex:1; min-width:140px; }

        .filtros-actions { display:flex; align-items:center; gap:10px; margin-top:14px; flex-wrap:wrap; }
        .aplicar-btn { padding:10px 18px; background:#1d4ed8; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s; }
        .aplicar-btn:hover { background:#1e40af; }
        .btn-atualizar-rel {
          display:inline-flex; align-items:center; gap:6px;
          padding:9px 14px; background:#fff; color:#5a5f6b;
          border:1.5px solid #e2e4e8; border-radius:8px;
          font-size:13px; font-weight:600; cursor:pointer; transition:all .15s;
        }
        .btn-atualizar-rel:hover { border-color:#1d4ed8; color:#1d4ed8; }
        .btn-atualizar-rel:disabled { opacity:.5; cursor:not-allowed; }
        .spin { animation:spin .8s linear infinite; display:inline-block; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .filtro-ativo { display:flex; align-items:center; gap:8px; margin-top:12px; padding:10px 14px; background:#eff6ff; border:1.5px solid rgba(29,78,216,.15); border-radius:8px; font-size:12px; color:#1d4ed8; font-family:'DM Mono',monospace; flex-wrap:wrap; font-weight:500; }
        .filtro-ativo-right { margin-left:auto; color:#9aa0ad; font-weight:400; }
        .atualizado-em-rel  { font-size:11px; color:#9aa0ad; margin-left:auto; }

        /* erro */
        .rel-erro { padding:14px 16px; background:#fff5f5; border:1.5px solid rgba(192,36,44,.2); border-radius:10px; font-size:13px; color:#C0242C; font-weight:500; margin-bottom:20px; }

        /* skeleton */
        .rel-skeleton { background:linear-gradient(90deg,#f4f5f7 25%,#eef0f3 50%,#f4f5f7 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        /* cards */
        .cards-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:900px){ .cards-grid { grid-template-columns:1fr 1fr; } }
        .sum-card { background:#fff; border:1.5px solid #e2e4e8; border-radius:12px; padding:18px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
        .sum-label { font-size:10px; font-weight:700; color:#9aa0ad; letter-spacing:.8px; text-transform:uppercase; margin-bottom:8px; }
        .sum-val   { font-family:'DM Mono',monospace; font-size:19px; font-weight:700; }
        .sum-val.pos  { color:#1a8a4a; }
        .sum-val.neg  { color:#C0242C; }
        .sum-val.blue { color:#1d4ed8; }
        .sum-val.red  { color:#ef4444; }
        .sum-val.neu  { color:#1a1a1a; }
        .sum-sub { font-size:11px; color:#9aa0ad; margin-top:5px; }
        @media(max-width:480px){ .sum-val { font-size:15px; } .sum-sub { display:none; } }

        /* lucro destaque */
        .lucro-card { background:#fff; border:2px solid rgba(29,78,216,.15); border-radius:12px; padding:22px 24px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; box-shadow:0 2px 8px rgba(29,78,216,.06); }
        @media(max-width:640px){ .lucro-card { padding:16px; } }
        .lucro-label { font-size:10px; font-weight:700; color:#1d4ed8; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px; }
        .lucro-val   { font-family:'DM Mono',monospace; font-size:32px; font-weight:700; }
        @media(max-width:480px){ .lucro-val { font-size:24px; } }
        .lucro-val.pos { color:#1a8a4a; }
        .lucro-val.neg { color:#C0242C; }
        .lucro-sub  { font-size:12px; color:#9aa0ad; margin-top:4px; }
        .lucro-formula { font-family:'DM Mono',monospace; font-size:11px; color:#9aa0ad; line-height:2.2; }
        .lucro-formula .lbl   { color:#5a5f6b; }
        .lucro-formula .tot   { border-top:1px solid #e2e4e8; padding-top:4px; margin-top:2px; }
        @media(max-width:640px){ .lucro-formula { display:none; } }

        /* análise */
        .analise-cols { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        @media(max-width:760px){ .analise-cols { grid-template-columns:1fr; } }
        .ana-card { background:#fff; border:1.5px solid #e2e4e8; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
        @media(max-width:640px){ .ana-card { padding:16px; } }
        .ana-title { font-size:10px; font-weight:700; color:#9aa0ad; letter-spacing:.8px; text-transform:uppercase; margin-bottom:14px; }
        .fat-row  { display:flex; align-items:center; justify-content:space-between; padding:9px 0; border-bottom:1px solid #f4f5f7; }
        .fat-row:last-child { border-bottom:none; }
        .fat-nome { font-size:13px; color:#5a5f6b; display:flex; align-items:center; gap:7px; font-weight:500; }
        .fat-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .fat-val  { font-family:'DM Mono',monospace; font-size:13px; color:#1a1a1a; font-weight:600; }
        .fat-pct  { font-family:'DM Mono',monospace; font-size:10px; color:#9aa0ad; margin-left:6px; }
        .desp-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #f4f5f7; }
        .desp-row:last-child { border-bottom:none; }
        .desp-cat { flex:1; font-size:12px; color:#5a5f6b; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .desp-bar { width:60px; flex-shrink:0; }
        .desp-val { font-family:'DM Mono',monospace; font-size:12px; color:#1a1a1a; font-weight:600; white-space:nowrap; }
        .desp-pct { font-family:'DM Mono',monospace; font-size:10px; color:#9aa0ad; width:38px; text-align:right; flex-shrink:0; }
        .desp-total-row { display:flex; justify-content:space-between; padding-top:10px; margin-top:4px; border-top:1.5px solid #e2e4e8; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; }

        /* pedidos */
        .peds-card { background:#fff; border:1.5px solid #e2e4e8; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
        @media(max-width:640px){ .peds-card { padding:16px; } }
        .ped-row  { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f4f5f7; gap:10px; flex-wrap:wrap; }
        .ped-row:last-child { border-bottom:none; }
        .ped-left { display:flex; flex-direction:column; gap:3px; }
        .ped-num  { font-size:12px; font-weight:700; color:#C0242C; }
        .ped-dt   { font-family:'DM Mono',monospace; font-size:10px; color:#9aa0ad; }
        .ped-v    { font-family:'DM Mono',monospace; font-size:13px; color:#1a1a1a; font-weight:700; white-space:nowrap; }

        /* vazio */
        .vazio { text-align:center; padding:56px 16px; color:#9aa0ad; font-size:13px; border:1.5px dashed #e2e4e8; border-radius:12px; line-height:2; margin-bottom:20px; }

        /* print btn */
        .print-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 16px; background:#fff; color:#1a1a1a; border:1.5px solid #e2e4e8; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:border-color .15s, color .15s; box-shadow:0 1px 3px rgba(0,0,0,.06); }
        .print-btn:hover { border-color:#1d4ed8; color:#1d4ed8; }
      `}</style>

      <div className="page-wrap">

        {/* cabeçalho impressão */}
        <div className="print-header">
          <div>
            <div className="ph-logo">XTelhas — Ferro e Aço</div>
            <div className="ph-sub">Sistema Financeiro</div>
          </div>
          <div className="ph-info">
            <div className="ph-titulo">Resumo Financeiro — {labelTitulo(modo, mesF, di, df)}</div>
            <div>Gerado em {hoje}</div>
          </div>
        </div>

        {/* cabeçalho tela */}
        <div className="page-header no-print" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1>Resumo Financeiro</h1>
            <p>Resultado financeiro consolidado por período.</p>
          </div>
          {temDados && (
            <button className="print-btn" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 14h12v8H6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Imprimir
            </button>
          )}
        </div>

        {/* filtros */}
        <div className="filtros-card no-print">
          <div className="filtros-title">Filtrar por período</div>

          <div className="modos">
            {[
              {id:"atual",   label:"📅 Mês atual"  },
              {id:"fechado", label:"🗓 Mês fechado" },
              {id:"periodo", label:"📆 Período"     },
            ].map(m => (
              <button key={m.id} type="button"
                className={`modo-btn${modo===m.id?" ativo":""}`}
                onClick={() => { setModo(m.id); setErroPer(""); setDados(null); }}>
                {m.label}
              </button>
            ))}
          </div>

          {modo === "atual" && (
            <p className="modo-desc">
              De <span>01/{String(HOJE_DATE.getMonth()+1).padStart(2,"0")}/{HOJE_DATE.getFullYear()}</span> até <span>{labelDataBR(HOJE_ISO)} (hoje)</span>
            </p>
          )}

          {modo === "fechado" && (
            <div className="meses-chips">
              {MESES_FECHADOS.map((m,i) => (
                <button key={i} type="button"
                  className={`mes-chip${mesF?.mes===m.mes&&mesF?.ano===m.ano?" ativo":""}`}
                  onClick={() => { setMesF(m); setDados(null); }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {modo === "periodo" && (
            <div className="periodo-row">
              <Picker label="Data início" placeholder="Selecionar"
                display={di ? labelDataBR(di) : ""}>
                {close => (
                  <CalDia valor={di} maxDate={df||HOJE_ISO}
                    onChange={v=>{setDi(v);setErroPer("");setDados(null);}} onClose={close}/>
                )}
              </Picker>
              <Picker label="Data fim" placeholder="Selecionar"
                display={df ? labelDataBR(df) : ""}>
                {close => (
                  <CalDia valor={df} minDate={di} maxDate={HOJE_ISO}
                    onChange={v=>{setDf(v);setErroPer("");setDados(null);}} onClose={close}/>
                )}
              </Picker>
              {erroPer && <p className="field-err" style={{width:"100%"}}>⚠ {erroPer}</p>}
            </div>
          )}

          {/* ações */}
          <div className="filtros-actions">
            <button className="aplicar-btn" onClick={aplicar} disabled={loading}>
              {loading ? "Carregando…" : "Gerar relatório"}
            </button>
            {dados && (
              <button className="btn-atualizar-rel" onClick={carregar} disabled={loading}>
                <span className={loading?"spin":""}>↻</span>
                Atualizar
              </button>
            )}
            {atualizadoEm && !loading && (
              <span className="atualizado-em-rel">Atualizado às {atualizadoEm}</span>
            )}
          </div>

          {temDados && (
            <div className="filtro-ativo">
              <span>🔍</span>
              <span>{labelFiltro(modo, mesF, di, df)}</span>
              <span className="filtro-ativo-right">
                {dados.totais.qtd_pedidos} pedido{dados.totais.qtd_pedidos!==1?"s":""} · {dados.totais.qtd_despesas} lançamento{dados.totais.qtd_despesas!==1?"s":""}
              </span>
            </div>
          )}
        </div>

        {erro && <div className="rel-erro">⚠ {erro}</div>}

        {/* skeleton */}
        {loading && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="rel-skeleton" style={{height:80}}/>
            <div className="rel-skeleton" style={{height:160}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div className="rel-skeleton" style={{height:240}}/>
              <div className="rel-skeleton" style={{height:240}}/>
            </div>
          </div>
        )}

        {/* vazio */}
        {!loading && !erro && !dados && (
          <div className="vazio">
            Selecione um período e clique em <strong>Gerar relatório</strong>.
          </div>
        )}

        {!loading && dados && !temDados && (
          <div className="vazio">
            Nenhum lançamento encontrado para o período selecionado.
          </div>
        )}

        {/* conteúdo */}
        {!loading && temDados && (<>

          <div className="cards-grid">
            <div className="sum-card">
              <div className="sum-label">Faturamento</div>
              <div className="sum-val blue">{fmt(fat.bruto??0)}</div>
              <div className="sum-sub">Total de pedidos</div>
            </div>
            <div className="sum-card">
              <div className="sum-label">Com NF</div>
              <div className="sum-val neu">{fmt(fat.com_nf??0)}</div>
              <div className="sum-sub">{pct(fat.com_nf??0, fat.bruto??1)} do total</div>
            </div>
            <div className="sum-card">
              <div className="sum-label">Despesas</div>
              <div className="sum-val red">{fmt(desp.total??0)}</div>
              <div className="sum-sub">{pct(desp.total??0, fat.bruto??1)} do faturamento</div>
            </div>
            <div className="sum-card">
              <div className="sum-label">Margem</div>
              <div className={`sum-val ${(result.margem_pct??0)>=0?"pos":"neg"}`}>
                {(result.margem_pct??0).toFixed(1).replace(".",",")}%
              </div>
              <div className="sum-sub">Lucro ÷ faturamento</div>
            </div>
          </div>

          <div className="lucro-card">
            <div>
              <div className="lucro-label">Lucro líquido — {labelTitulo(modo, mesF, di, df)}</div>
              <div className={`lucro-val ${(result.lucro_liquido??0)>=0?"pos":"neg"}`}>
                {fmt(result.lucro_liquido??0)}
              </div>
              <div className="lucro-sub">Margem: {(result.margem_pct??0).toFixed(1).replace(".",",")}%</div>
            </div>
            <div className="lucro-formula">
              <div><span className="lbl">Faturamento bruto   </span>{fmt(fat.bruto??0)}</div>
              <div><span className="lbl">− Total despesas    </span>{fmt(desp.total??0)}</div>
              <div className="tot">
                <span className="lbl">= Lucro líquido     </span>
                <span style={{color:(result.lucro_liquido??0)>=0?"#1a8a4a":"#C0242C",fontWeight:700}}>
                  {fmt(result.lucro_liquido??0)}
                </span>
              </div>
            </div>
          </div>

          <div className="analise-cols">
            <div className="ana-card">
              <div className="ana-title">Faturamento</div>
              <div className="fat-row">
                <span className="fat-nome"><span className="fat-dot" style={{background:"#1a1a1a"}}/>Total pedidos</span>
                <span className="fat-val">{fmt(fat.bruto??0)}</span>
              </div>
              <div className="fat-row">
                <span className="fat-nome"><span className="fat-dot" style={{background:"#1a8a4a"}}/>Com nota fiscal</span>
                <span><span className="fat-val">{fmt(fat.com_nf??0)}</span><span className="fat-pct">{pct(fat.com_nf??0,fat.bruto??1)}</span></span>
              </div>
              <div style={{padding:"2px 0 8px 15px"}}>
                <div className="bar-wrap"><div className="bar" style={{width:pct(fat.com_nf??0,fat.bruto??1),background:"#1a8a4a"}}/></div>
              </div>
              <div className="fat-row">
                <span className="fat-nome"><span className="fat-dot" style={{background:"#b45309"}}/>Sem nota fiscal</span>
                <span><span className="fat-val">{fmt(fat.sem_nf??0)}</span><span className="fat-pct">{pct(fat.sem_nf??0,fat.bruto??1)}</span></span>
              </div>
              <div style={{padding:"2px 0 4px 15px"}}>
                <div className="bar-wrap"><div className="bar" style={{width:pct(fat.sem_nf??0,fat.bruto??1),background:"#b45309"}}/></div>
              </div>
            </div>

            <div className="ana-card">
              <div className="ana-title">Despesas por categoria</div>
              {(desp.por_tipo??[]).map((d,i) => (
                <div className="desp-row" key={i}>
                  <span className="desp-cat">{d.tipo}</span>
                  <div className="desp-bar">
                    <div className="bar-wrap">
                      <div className="bar" style={{
                        width:pct(d.valor,desp.total??1),
                        background:`rgba(192,36,44,${0.3+0.7*(d.valor/((desp.por_tipo??[{valor:1}])[0]?.valor??1))})`,
                      }}/>
                    </div>
                  </div>
                  <span className="desp-val">{fmt(d.valor)}</span>
                  <span className="desp-pct">{pct(d.valor,desp.total??1)}</span>
                </div>
              ))}
              <div className="desp-total-row">
                <span style={{color:"#5a5f6b"}}>Total</span>
                <span style={{color:"#1a1a1a"}}>{fmt(desp.total??0)}</span>
              </div>
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <div className="ana-title">Pedidos no período</div>
          </div>
          <div style={{overflowX:"auto",borderRadius:12,border:"1.5px solid #e2e4e8",boxShadow:"0 1px 3px rgba(0,0,0,.06)",background:"#fff"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#f4f5f7",borderBottom:"1.5px solid #e2e4e8"}}>
                  <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#5a5f6b",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>Pedido</th>
                  <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#5a5f6b",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>Data ↓</th>
                  <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#5a5f6b",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>NF</th>
                  <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#5a5f6b",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>Valor NF</th>
                  <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#5a5f6b",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>Sem NF</th>
                  <th style={{padding:"10px 14px",textAlign:"right",fontSize:11,fontWeight:700,color:"#5a5f6b",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(dados.pedidos??[])
                  .slice()
                  .sort((a,b) => new Date(b.dataEmissao) - new Date(a.dataEmissao))
                  .map(p => {
                    const vTotal = Number(p.valorTotal);
                    const vNf    = Number(p.valorNf??0);
                    const semNf  = p.nfEmitida && vNf < vTotal ? vTotal - vNf : (!p.nfEmitida ? vTotal : 0);
                    return (
                      <tr key={p.id} style={{borderBottom:"1px solid #f4f5f7"}}>
                        <td style={{padding:"11px 14px",fontWeight:700,color:"#C0242C",whiteSpace:"nowrap"}}>{p.numeroPedido}</td>
                        <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9aa0ad",whiteSpace:"nowrap"}}>{labelDataBR(p.dataEmissao?.slice(0,10))}</td>
                        <td style={{padding:"11px 14px"}}>
                          {p.nfEmitida
                            ? <span className="tag tag--green">#{p.numeroNf}</span>
                            : <span className="tag tag--amber">Sem NF</span>}
                        </td>
                        <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600}}>
                          {p.nfEmitida ? fmt(vNf) : "—"}
                        </td>
                        <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:"#b45309"}}>
                          {semNf > 0 ? fmt(semNf) : "—"}
                        </td>
                        <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,textAlign:"right"}}>{fmt(vTotal)}</td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"2px solid #e2e4e8",background:"#f4f5f7"}}>
                  <td colSpan={5} style={{padding:"10px 14px",fontWeight:700,fontSize:13,color:"#5a5f6b"}}>Total do período</td>
                  <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,textAlign:"right",color:"#C0242C"}}>{fmt(fat.bruto??0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </>)}
      </div>
    </>
  );
}

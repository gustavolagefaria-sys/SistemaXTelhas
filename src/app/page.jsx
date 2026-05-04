"use client";

import { useState, useEffect, useCallback } from "react";

function fmt(n) { return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" }); }
function pct(v, t) { return t ? Math.round(v/t*100) : 0; }

const EMPRESA_ID = 1;

// ── Gráfico de pizza SVG ───────────────────────────────────────────────────────
function PizzaChart({ pctFat, pctDesp }) {
  const r = 70, cx = 90, cy = 90;
  function arc(startPct, endPct) {
    const toRad = p => (p / 100) * 2 * Math.PI - Math.PI / 2;
    const s = { x: cx + r * Math.cos(toRad(startPct)), y: cy + r * Math.sin(toRad(startPct)) };
    const e = { x: cx + r * Math.cos(toRad(endPct)),   y: cy + r * Math.sin(toRad(endPct))   };
    const large = (endPct - startPct) > 50 ? 1 : 0;
    return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${large},1 ${e.x},${e.y} Z`;
  }

  if (pctFat === 0 && pctDesp === 0) {
    return (
      <svg viewBox="0 0 180 180" width="180" height="180">
        <circle cx={cx} cy={cy} r={r} fill="#f4f5f7"/>
        <circle cx={cx} cy={cy} r={42} fill="white"/>
        <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fill="#9aa0ad" fontFamily="Instrument Sans, sans-serif">Sem dados</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 180" width="180" height="180">
      {/* fatia faturamento — azul */}
      <path d={arc(0, pctFat)} fill="#1d4ed8"/>
      {/* fatia despesas — vermelho claro */}
      <path d={arc(pctFat, 100)} fill="#f87171"/>
      {/* buraco */}
      <circle cx={cx} cy={cy} r={42} fill="white"/>
      <text x={cx} y={cy-6} textAnchor="middle" fontSize="10" fill="#5a5f6b" fontFamily="Instrument Sans, sans-serif">Receita</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1d4ed8" fontFamily="Instrument Sans, sans-serif">{pctFat}%</text>
    </svg>
  );
}

export default function DashboardPage() {
  const [dados,    setDados]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [erro,     setErro]     = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    try {
      const res = await fetch(`/api/dashboard?empresa_id=${EMPRESA_ID}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setDados(d);
      setAtualizadoEm(new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }));
    } catch {
      setErro("Não foi possível carregar os dados. Verifique se o servidor está rodando.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const mes  = dados?.mes_atual;
  const ano  = dados?.ano_corrente;
  const maxBar = mes ? Math.max(mes.faturamento, mes.despesas, 1) : 1;
  const totalAnoPizzaBase = ano ? (ano.faturamento + ano.despesas) : 0;
  const pctFat  = ano ? pct(ano.faturamento, totalAnoPizzaBase) : 0;
  const pctDesp = ano ? pct(ano.despesas, totalAnoPizzaBase) : 0;

  return (
    <>
      <style>{`
        .dash-wrap { max-width:1080px; margin:0 auto; padding:36px 32px 80px; }
        @media(max-width:1024px){ .dash-wrap { padding:28px 24px 64px; } }
        @media(max-width:640px) { .dash-wrap { padding:20px 16px 60px; } }

        .dash-top { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:28px; }
        .dash-title h1 { font-size:22px; font-weight:700; color:#1a1a1a; letter-spacing:-.3px; }
        .dash-title p  { font-size:13px; color:#5a5f6b; margin-top:3px; }

        .btn-atualizar {
          display:inline-flex; align-items:center; gap:7px;
          padding:9px 16px; background:#fff; color:#1a1a1a;
          border:1.5px solid #e2e4e8; border-radius:8px;
          font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600;
          cursor:pointer; transition:all .15s; box-shadow:0 1px 3px rgba(0,0,0,.06);
        }
        .btn-atualizar:hover { border-color:#1d4ed8; color:#1d4ed8; }
        .btn-atualizar:disabled { opacity:.5; cursor:not-allowed; }
        .spin { animation:spin .8s linear infinite; display:inline-block; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .atualizado-em { font-size:11px; color:#9aa0ad; margin-top:6px; text-align:right; }

        .dash-erro {
          padding:14px 16px; background:#fff5f5; border:1.5px solid rgba(192,36,44,.2);
          border-radius:10px; font-size:13px; color:#C0242C; font-weight:500;
          margin-bottom:20px;
        }

        .dash-skeleton {
          background:linear-gradient(90deg,#f4f5f7 25%,#eef0f3 50%,#f4f5f7 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite;
          border-radius:12px;
        }
        @keyframes shimmer { to { background-position:-200% 0; } }

        /* shortcuts */
        .dash-shortcuts { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
        @media(max-width:900px){ .dash-shortcuts { grid-template-columns:1fr 1fr; } }
        @media(max-width:480px){ .dash-shortcuts { gap:10px; } }
        .shortcut {
          background:#fff; border:1.5px solid #e2e4e8; border-radius:12px;
          padding:18px 16px; text-decoration:none;
          display:flex; flex-direction:column; gap:8px;
          transition:border-color .15s, box-shadow .15s, transform .1s;
          box-shadow:0 1px 3px rgba(0,0,0,.06);
        }
        .shortcut:hover { border-color:#1d4ed8; box-shadow:0 4px 16px rgba(29,78,216,.1); transform:translateY(-1px); }
        .shortcut-ico   { font-size:22px; }
        .shortcut-title { font-size:13px; font-weight:700; color:#1a1a1a; }
        .shortcut-desc  { font-size:12px; color:#9aa0ad; line-height:1.4; }
        @media(max-width:480px){ .shortcut { padding:14px; } .shortcut-desc { display:none; } }

        /* gráficos */
        .dash-charts { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        @media(max-width:820px){ .dash-charts { grid-template-columns:1fr; } }

        .chart-card {
          background:#fff; border:1.5px solid #e2e4e8; border-radius:12px;
          padding:22px; box-shadow:0 1px 3px rgba(0,0,0,.06);
        }
        .chart-tag   { font-size:10px; font-weight:700; color:#9aa0ad; letter-spacing:.8px; text-transform:uppercase; margin-bottom:4px; }
        .chart-title { font-size:14px; font-weight:700; color:#1a1a1a; margin-bottom:20px; }

        /* barras */
        .bar-chart { display:flex; flex-direction:column; gap:16px; }
        .bar-item  { display:flex; flex-direction:column; gap:6px; }
        .bar-header{ display:flex; justify-content:space-between; align-items:baseline; }
        .bar-label { font-size:12px; font-weight:600; color:#5a5f6b; }
        .bar-value { font-family:'DM Mono',monospace; font-size:13px; font-weight:700; }
        .bar-value.fat  { color:#1d4ed8; }
        .bar-value.desp { color:#ef4444; }
        .bar-track { height:10px; background:#f4f5f7; border-radius:5px; overflow:hidden; }
        .bar-fill  { height:100%; border-radius:5px; transition:width .6s ease; }
        .bar-fill.fat  { background:#1d4ed8; }
        .bar-fill.desp { background:#f87171; }

        .lucro-box {
          margin-top:20px; padding:14px 16px; background:#f4f5f7; border-radius:9px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .lucro-label { font-size:12px; color:#5a5f6b; font-weight:600; }
        .lucro-val   { font-family:'DM Mono',monospace; font-size:16px; font-weight:700; }
        .lucro-val.pos { color:#1a8a4a; }
        .lucro-val.neg { color:#C0242C; }

        /* pizza */
        .pizza-wrap { display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
        @media(max-width:480px){ .pizza-wrap { flex-direction:column; align-items:flex-start; gap:16px; } }
        .pizza-legenda { display:flex; flex-direction:column; gap:14px; flex:1; }
        .leg-item { display:flex; flex-direction:column; gap:2px; }
        .leg-row  { display:flex; align-items:center; gap:8px; }
        .leg-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .leg-lbl  { font-size:12px; font-weight:600; color:#5a5f6b; }
        .leg-pct  { font-size:22px; font-weight:700; }
        .leg-val  { font-family:'DM Mono',monospace; font-size:11px; color:#9aa0ad; }

        .ano-totais { margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .ano-item   { padding:12px 14px; background:#f4f5f7; border-radius:9px; }
        .ano-lbl    { font-size:10px; color:#9aa0ad; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
        .ano-val    { font-family:'DM Mono',monospace; font-size:14px; font-weight:700; }
        .ano-val.fat   { color:#1d4ed8; }
        .ano-val.desp  { color:#ef4444; }
        .ano-val.lucro.pos { color:#1a8a4a; }
        .ano-val.lucro.neg { color:#C0242C; }
        @media(max-width:380px){ .ano-totais { grid-template-columns:1fr; } }

        .sem-dados { text-align:center; padding:32px 0; color:#9aa0ad; font-size:13px; }
      `}</style>

      <div className="dash-wrap">

        {/* topo */}
        <div className="dash-top">
          <div className="dash-title">
            <h1>Dashboard</h1>
            <p>Visão geral do desempenho financeiro da XTelhas.</p>
          </div>
          <div style={{textAlign:"right"}}>
            <button className="btn-atualizar" onClick={carregar} disabled={loading}>
              <span className={loading ? "spin" : ""}>↻</span>
              {loading ? "Atualizando…" : "Atualizar"}
            </button>
            {atualizadoEm && !loading && (
              <div className="atualizado-em">Atualizado às {atualizadoEm}</div>
            )}
          </div>
        </div>

        {erro && <div className="dash-erro">⚠ {erro}</div>}

        {/* atalhos */}
        <div className="dash-shortcuts">
          <a href="/despesas"      className="shortcut"><span className="shortcut-ico">💳</span><span className="shortcut-title">Despesas</span><span className="shortcut-desc">Lance custos e despesas do mês</span></a>
          <a href="/pedidos"       className="shortcut"><span className="shortcut-ico">📦</span><span className="shortcut-title">Pedidos emitidos</span><span className="shortcut-desc">Registre pedidos e notas fiscais</span></a>
          <a href="/relatorio"     className="shortcut"><span className="shortcut-ico">📈</span><span className="shortcut-title">Relatório</span><span className="shortcut-desc">Lucro líquido por período</span></a>
          <a href="/tipos-despesa" className="shortcut"><span className="shortcut-ico">⚙️</span><span className="shortcut-title">Tipos de despesa</span><span className="shortcut-desc">Gerencie categorias de custo</span></a>
        </div>

        {/* gráficos */}
        {loading ? (
          <div className="dash-charts">
            <div className="dash-skeleton" style={{height:280}}/>
            <div className="dash-skeleton" style={{height:280}}/>
          </div>
        ) : !dados ? null : (
          <div className="dash-charts">

            {/* barras — mês atual */}
            <div className="chart-card">
              <div className="chart-tag">Mês atual</div>
              <div className="chart-title">{mes?.nome} — Faturamento × Despesas</div>

              {mes?.faturamento === 0 && mes?.despesas === 0 ? (
                <div className="sem-dados">Nenhum lançamento no mês atual.</div>
              ) : (
                <>
                  <div className="bar-chart">
                    <div className="bar-item">
                      <div className="bar-header">
                        <span className="bar-label">Faturamento</span>
                        <span className="bar-value fat">{fmt(mes.faturamento)}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill fat" style={{width:`${pct(mes.faturamento, maxBar)}%`}}/>
                      </div>
                    </div>
                    <div className="bar-item">
                      <div className="bar-header">
                        <span className="bar-label">Despesas</span>
                        <span className="bar-value desp">{fmt(mes.despesas)}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill desp" style={{width:`${pct(mes.despesas, maxBar)}%`}}/>
                      </div>
                    </div>
                  </div>
                  <div className="lucro-box">
                    <span className="lucro-label">Lucro do mês</span>
                    <span className={`lucro-val ${mes.lucro >= 0 ? "pos" : "neg"}`}>{fmt(mes.lucro)}</span>
                  </div>
                </>
              )}
            </div>

            {/* pizza — ano corrente */}
            <div className="chart-card">
              <div className="chart-tag">Ano corrente</div>
              <div className="chart-title">{ano?.ano} — Receita × Despesas (%)</div>

              {ano?.faturamento === 0 && ano?.despesas === 0 ? (
                <div className="sem-dados">Nenhum lançamento no ano corrente.</div>
              ) : (
                <>
                  <div className="pizza-wrap">
                    <PizzaChart pctFat={pctFat} pctDesp={pctDesp}/>
                    <div className="pizza-legenda">
                      <div className="leg-item">
                        <div className="leg-row">
                          <span className="leg-dot" style={{background:"#1d4ed8"}}/>
                          <span className="leg-lbl">Receita</span>
                        </div>
                        <div className="leg-pct" style={{color:"#1d4ed8"}}>{pctFat}%</div>
                        <div className="leg-val">{fmt(ano.faturamento)}</div>
                      </div>
                      <div className="leg-item">
                        <div className="leg-row">
                          <span className="leg-dot" style={{background:"#f87171"}}/>
                          <span className="leg-lbl">Despesas</span>
                        </div>
                        <div className="leg-pct" style={{color:"#ef4444"}}>{pctDesp}%</div>
                        <div className="leg-val">{fmt(ano.despesas)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="ano-totais">
                    <div className="ano-item">
                      <div className="ano-lbl">Total faturado</div>
                      <div className="ano-val fat">{fmt(ano.faturamento)}</div>
                    </div>
                    <div className="ano-item">
                      <div className="ano-lbl">Total despesas</div>
                      <div className="ano-val desp">{fmt(ano.despesas)}</div>
                    </div>
                    <div className="ano-item" style={{gridColumn:"1 / -1"}}>
                      <div className="ano-lbl">Lucro líquido acumulado</div>
                      <div className={`ano-val lucro ${ano.lucro >= 0 ? "pos" : "neg"}`}>{fmt(ano.lucro)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}

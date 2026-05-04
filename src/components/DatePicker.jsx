// src/components/DatePicker.jsx
"use client";

import { useState, useRef, useEffect } from "react";

// ─── utilitários ──────────────────────────────────────────────────────────────
export function dataHoje() {
  const d = new Date();
  return { ano: d.getFullYear(), mes: d.getMonth(), dia: d.getDate() };
}
export function toISO({ ano, mes, dia }) {
  return `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
}
export function toMesRef({ ano, mes }) {
  return `${ano}-${String(mes+1).padStart(2,"0")}`;
}
export function labelDataBR(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
export function labelMesRef(mr) {
  if (!mr) return "";
  const [a, m] = mr.split("-");
  return `${MESES[Number(m)-1]} ${a}`;
}

export const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const SEMANA = ["D","S","T","Q","Q","S","S"];

function diasNoMes(a, m) { return new Date(a, m+1, 0).getDate(); }
function primeiroDia(a, m) { return new Date(a, m, 1).getDay(); }

// ─── Calendário de dia ────────────────────────────────────────────────────────
export function CalDia({ valor, onChange, onClose, minDate, maxDate }) {
  const hoje = dataHoje();
  const init = valor
    ? (() => { const [a,m,d] = valor.split("-"); return { ano:+a, mes:+m-1, dia:+d }; })()
    : hoje;
  const [nav, setNav] = useState({ ano: init.ano, mes: init.mes });

  const total  = diasNoMes(nav.ano, nav.mes);
  const offset = primeiroDia(nav.ano, nav.mes);
  const cells  = Array(offset).fill(null).concat(Array.from({ length: total }, (_, i) => i+1));

  function isDisabled(d) {
    const iso = `${nav.ano}-${String(nav.mes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  }
  function pick(d) {
    if (isDisabled(d)) return;
    onChange(toISO({ ano: nav.ano, mes: nav.mes, dia: d }));
    onClose();
  }
  function prev() { setNav(n => n.mes===0 ? {ano:n.ano-1,mes:11} : {...n,mes:n.mes-1}); }
  function next() { setNav(n => n.mes===11 ? {ano:n.ano+1,mes:0} : {...n,mes:n.mes+1}); }

  const sel    = init.ano===nav.ano && init.mes===nav.mes ? init.dia : null;
  const isHoje = d => d===hoje.dia && nav.mes===hoje.mes && nav.ano===hoje.ano;

  return (
    <div className="cal">
      <div className="cal-nav">
        <button type="button" className="cal-arr" onClick={prev}>‹</button>
        <span className="cal-month">{MESES[nav.mes]} {nav.ano}</span>
        <button type="button" className="cal-arr" onClick={next}>›</button>
      </div>
      <div className="cal-grid">
        {SEMANA.map((s,i) => <div key={i} className="cal-wday">{s}</div>)}
        {cells.map((d,i) =>
          d === null ? <div key={`e${i}`}/> :
          <button key={d} type="button"
            disabled={isDisabled(d)}
            className={["cal-d",
              d===sel       ? "cal-d--sel"   : "",
              isHoje(d)     ? "cal-d--today" : "",
              isDisabled(d) ? "cal-d--dis"   : "",
            ].join(" ")}
            onClick={() => pick(d)}>{d}
          </button>
        )}
      </div>
      <div className="cal-foot">
        <button type="button" className="cal-today-btn"
          onClick={() => { onChange(toISO(hoje)); onClose(); }}>
          Hoje
        </button>
      </div>
    </div>
  );
}

// ─── Calendário de mês ────────────────────────────────────────────────────────
export function CalMes({ valor, onChange, onClose }) {
  const hoje = dataHoje();
  const init = valor
    ? (() => { const [a,m] = valor.split("-"); return { ano:+a, mes:+m-1 }; })()
    : { ano: hoje.ano, mes: hoje.mes };
  const [ano, setAno] = useState(init.ano);

  function pick(m) { onChange(toMesRef({ ano, mes: m })); onClose(); }

  return (
    <div className="cal cal--mes">
      <div className="cal-nav">
        <button type="button" className="cal-arr" onClick={() => setAno(a => a-1)}>‹</button>
        <span className="cal-month">{ano}</span>
        <button type="button" className="cal-arr" onClick={() => setAno(a => a+1)}>›</button>
      </div>
      <div className="cal-mes-grid">
        {MESES.map((nm, i) => (
          <button key={i} type="button"
            className={["cal-mes-item",
              init.mes===i && init.ano===ano ? "cal-mes-item--sel"   : "",
              i===hoje.mes && ano===hoje.ano  ? "cal-mes-item--today" : "",
            ].join(" ")}
            onClick={() => pick(i)}>
            {nm.slice(0,3)}
          </button>
        ))}
      </div>
      <div className="cal-foot">
        <button type="button" className="cal-today-btn"
          onClick={() => { onChange(toMesRef({ano:hoje.ano,mes:hoje.mes})); onClose(); }}>
          Mês atual
        </button>
      </div>
    </div>
  );
}

// ─── Picker com detecção de espaço para abrir para cima ou para baixo ─────────
export function Picker({ label, required, placeholder, display, erro, children }) {
  const [open,    setOpen]    = useState(false);
  const [openUp,  setOpenUp]  = useState(false);
  const ref    = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const fn = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect       = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calH       = 320; // altura estimada do calendário
      setOpenUp(spaceBelow < calH && rect.top > calH);
    }
    setOpen(o => !o);
  }

  function fechar() { setOpen(false); }

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 480;

  return (
    <div className="picker" ref={ref}>
      {label && (
        <label className="field-label" style={{ display:"block", marginBottom:6 }}>
          {label}{required && <em> *</em>}
        </label>
      )}
      <button ref={btnRef} type="button"
        className={["picker-btn", open?"open":"", erro?"err":""].join(" ")}
        onClick={handleOpen}>
        <span className={display ? "picker-val" : "picker-ph"}>{display || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{opacity:.4,flexShrink:0}}>
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1v3M11 1v3M2 6h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {erro && <p className="field-err">⚠ {erro}</p>}

      {open && isMobile && <div className="cal-overlay visible" onClick={fechar}/>}

      {open && (
        <div className="picker-drop" style={
          isMobile
            ? { position:"fixed", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:300 }
            : openUp
              ? { position:"absolute", bottom:"calc(100% + 6px)", left:0, zIndex:200, animation:"pop .12s ease" }
              : { position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:200, animation:"pop .12s ease" }
        }>
          {typeof children === "function" ? children(fechar) : children}
        </div>
      )}
    </div>
  );
}

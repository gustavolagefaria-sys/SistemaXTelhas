// src/lib/money.js

export function mascaraMoeda(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseMoeda(v) {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
}

export function fmt(num) {
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mascaraQtd(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 1000;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function parseQtd(v) {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
}

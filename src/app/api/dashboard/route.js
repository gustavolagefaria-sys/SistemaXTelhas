// src/app/api/dashboard/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/dashboard?empresa_id=1
// Retorna: dados do mês atual e totais do ano corrente
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const empresaId = Number(searchParams.get("empresa_id") ?? 1);

  const hoje  = new Date();
  const ano   = hoje.getFullYear();
  const mes   = hoje.getMonth();

  // intervalo mês atual (do dia 1 até hoje)
  const inicioMes = new Date(ano, mes, 1);
  const fimMes    = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  // intervalo ano corrente
  const inicioAno = new Date(ano, 0, 1);
  const fimAno    = new Date(ano, 11, 31, 23, 59, 59);

  try {
    const [pedidosMes, despesasMes, pedidosAno, despesasAno] = await Promise.all([
      prisma.pedido.findMany({
        where: { empresaId, dataEmissao: { gte: inicioMes, lte: fimMes } },
      }),
      prisma.despesa.findMany({
        where: { empresaId, dataLancamento: { gte: inicioMes, lte: fimMes } },
      }),
      prisma.pedido.findMany({
        where: { empresaId, dataEmissao: { gte: inicioAno, lte: fimAno } },
      }),
      prisma.despesa.findMany({
        where: { empresaId, dataLancamento: { gte: inicioAno, lte: fimAno } },
      }),
    ]);

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    // ── mês atual ──────────────────────────────────────────────────────────────
    const fatMes  = pedidosMes.reduce((s,p) => s + Number(p.valorTotal), 0);
    const despMes = despesasMes.reduce((s,d) => s + Number(d.valor), 0);

    // ── ano corrente ───────────────────────────────────────────────────────────
    const fatAno  = pedidosAno.reduce((s,p) => s + Number(p.valorTotal), 0);
    const despAno = despesasAno.reduce((s,d) => s + Number(d.valor), 0);

    return NextResponse.json({
      mes_atual: {
        nome:       `${MESES[mes]}/${String(ano).slice(2)}`,
        faturamento: fatMes,
        despesas:    despMes,
        lucro:       fatMes - despMes,
      },
      ano_corrente: {
        ano,
        faturamento: fatAno,
        despesas:    despAno,
        lucro:       fatAno - despAno,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}

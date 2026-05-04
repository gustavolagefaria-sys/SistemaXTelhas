// src/app/api/relatorio/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/relatorio?modo=atual&empresa_id=1
// GET /api/relatorio?modo=fechado&mes_ref=2026-03&empresa_id=1
// GET /api/relatorio?modo=periodo&data_inicio=2026-03-01&data_fim=2026-03-31&empresa_id=1
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const modo      = searchParams.get("modo") ?? "atual";        // atual | fechado | periodo
  const empresaId = Number(searchParams.get("empresa_id") ?? 1);

  // ── determina intervalo de datas ─────────────────────────────────────────
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  let inicio, fim;

  if (modo === "atual") {
    // do dia 1 do mês corrente até hoje
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    fim    = hoje;

  } else if (modo === "fechado") {
    const mesRef = searchParams.get("mes_ref");
    if (!mesRef) {
      return NextResponse.json({ error: "Parâmetro mes_ref obrigatório para modo=fechado." }, { status: 400 });
    }
    const [ano, mes] = mesRef.split("-").map(Number);
    inicio = new Date(ano, mes - 1, 1);
    fim    = new Date(ano, mes, 0, 23, 59, 59, 999); // último dia do mês

  } else if (modo === "periodo") {
    const dataInicio = searchParams.get("data_inicio");
    const dataFim    = searchParams.get("data_fim");
    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: "Parâmetros data_inicio e data_fim obrigatórios para modo=periodo." }, { status: 400 });
    }
    inicio = new Date(dataInicio + "T00:00:00");
    fim    = new Date(dataFim    + "T23:59:59");
    if (fim < inicio) {
      return NextResponse.json({ error: "data_fim não pode ser anterior a data_inicio." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "modo inválido. Use: atual, fechado ou periodo." }, { status: 400 });
  }

  try {
    // ── busca pedidos e despesas no intervalo ────────────────────────────────
    const [pedidos, despesas] = await Promise.all([
      prisma.pedido.findMany({
        where: {
          empresaId,
          dataEmissao: { gte: inicio, lte: fim },
        },
        orderBy: { dataEmissao: "asc" },
      }),
      prisma.despesa.findMany({
        where: {
          empresaId,
          dataLancamento: { gte: inicio, lte: fim },
        },
        include: { tipo: { select: { nome: true } } },
        orderBy: { dataLancamento: "asc" },
      }),
    ]);

    // ── cálculos ─────────────────────────────────────────────────────────────
    const fatBruto = pedidos.reduce((s, p) => s + Number(p.valorTotal), 0);
    const fatComNf = pedidos
      .filter(p => p.nfEmitida)
      .reduce((s, p) => s + Number(p.valorNf ?? 0), 0);
    const fatSemNf = fatBruto - fatComNf;

    const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);

    const porTipo = {};
    for (const d of despesas) {
      const nome = d.tipo.nome;
      porTipo[nome] = (porTipo[nome] ?? 0) + Number(d.valor);
    }
    const despesasPorTipo = Object.entries(porTipo)
      .map(([tipo, valor]) => ({ tipo, valor }))
      .sort((a, b) => b.valor - a.valor);

    const lucroLiquido = fatBruto - totalDespesas;
    const margem       = fatBruto > 0 ? (lucroLiquido / fatBruto) * 100 : 0;

    // ── resposta ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      filtro: {
        modo,
        data_inicio: inicio.toISOString().slice(0, 10),
        data_fim:    fim.toISOString().slice(0, 10),
      },
      faturamento: {
        bruto:  fatBruto,
        com_nf: fatComNf,
        sem_nf: fatSemNf,
      },
      despesas: {
        total:    totalDespesas,
        por_tipo: despesasPorTipo,
      },
      resultado: {
        lucro_liquido: lucroLiquido,
        margem_pct:    margem,
      },
      totais: {
        qtd_pedidos:  pedidos.length,
        qtd_despesas: despesas.length,
      },
      pedidos,
      lancamentos: despesas,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar relatório." }, { status: 500 });
  }
}

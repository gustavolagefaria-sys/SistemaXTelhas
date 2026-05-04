// src/app/api/pedidos/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/pedidos?mes_ref=2025-05&empresa_id=1
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mesRef    = searchParams.get("mes_ref");
  const empresaId = Number(searchParams.get("empresa_id") ?? 1);

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        empresaId,
        ...(mesRef ? { mesRef } : {}),
      },
      include: { criadoPor: { select: { nome: true } } },
      orderBy: { dataEmissao: "desc" },
    });
    return NextResponse.json(pedidos);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar pedidos." }, { status: 500 });
  }
}

// POST /api/pedidos
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      empresa_id = 1,
      criado_por_id = 1,
      numero_pedido,
      valor_total,
      custo_bruto,
      nf_emitida,
      valor_nf,
      numero_nf,
      data_emissao,
      mes_ref,
    } = body;

    if (!numero_pedido || !valor_total || !data_emissao || !mes_ref)
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    if (Number(valor_total) <= 0)
      return NextResponse.json({ error: "Valor total deve ser maior que zero." }, { status: 400 });
    if (nf_emitida) {
      if (!valor_nf || Number(valor_nf) <= 0)
        return NextResponse.json({ error: "Informe o valor da NF." }, { status: 400 });
      if (Number(valor_nf) > Number(valor_total))
        return NextResponse.json({ error: "Valor da NF não pode ser maior que o total." }, { status: 400 });
      if (!numero_nf)
        return NextResponse.json({ error: "Informe o número da NF." }, { status: 400 });
    }

    const pedido = await prisma.pedido.create({
      data: {
        empresaId:    Number(empresa_id),
        criadoPorId:  Number(criado_por_id),
        numeroPedido: numero_pedido,
        valorTotal:   Number(valor_total),
        custoBruto:   custo_bruto ? Number(custo_bruto) : null,
        nfEmitida:    Boolean(nf_emitida),
        valorNf:      nf_emitida ? Number(valor_nf) : null,
        numeroNf:     nf_emitida ? numero_nf : null,
        dataEmissao:  new Date(data_emissao),
        mesRef:       mes_ref,
      },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar pedido." }, { status: 500 });
  }
}

// src/app/api/despesas/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registrarLog, getIp } from "@/lib/auditoria";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mesRef    = searchParams.get("mes_ref");
  const empresaId = Number(searchParams.get("empresa_id") ?? 1);
  try {
    const despesas = await prisma.despesa.findMany({
      where: { empresaId, ...(mesRef ? { mesRef } : {}) },
      include: { tipo: true, criadoPor: { select: { nome: true } } },
      orderBy: { dataLancamento: "desc" },
    });
    return NextResponse.json(despesas);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar despesas." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { empresa_id=1, tipo_id, criado_por_id=1, descricao, unidade_medida, quantidade, preco_unitario, valor, data_lancamento, mes_ref } = body;
    if (!tipo_id || !valor || !data_lancamento || !mes_ref)
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    if (Number(valor) <= 0)
      return NextResponse.json({ error: "Valor deve ser maior que zero." }, { status: 400 });

    const despesa = await prisma.despesa.create({
      data: {
        empresaId: Number(empresa_id), tipoId: Number(tipo_id), criadoPorId: Number(criado_por_id),
        descricao: descricao ?? null, unidadeMedida: unidade_medida ?? null,
        quantidade: quantidade ? Number(quantidade) : null,
        precoUnitario: preco_unitario ? Number(preco_unitario) : null,
        valor: Number(valor), dataLancamento: new Date(data_lancamento), mesRef: mes_ref,
      },
      include: { tipo: true },
    });

    const usuarioId = request.headers.get("x-usuario-id") ?? criado_por_id;
    await registrarLog({ usuarioId: Number(usuarioId), tipoAcao:"CREATE", entidade:"despesas", registroId: despesa.id, descricao: `Despesa criada: ${despesa.tipo.nome} - R$ ${despesa.valor}`, dadosDepois: body, ip: getIp(request) });

    return NextResponse.json(despesa, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar despesa." }, { status: 500 });
  }
}

// src/app/api/despesas/[id]/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registrarLog, getIp } from "@/lib/auditoria";

export async function PUT(request, { params }) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { tipo_id, descricao, unidade_medida, quantidade, preco_unitario, valor, data_lancamento, mes_ref } = body;
    if (!tipo_id || !valor || !data_lancamento || !mes_ref)
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });

    const antes = await prisma.despesa.findUnique({ where:{ id }, include:{ tipo:true } });
    const despesa = await prisma.despesa.update({
      where: { id },
      data: { tipoId: Number(tipo_id), descricao: descricao??null, unidadeMedida: unidade_medida??null, quantidade: quantidade?Number(quantidade):null, precoUnitario: preco_unitario?Number(preco_unitario):null, valor: Number(valor), dataLancamento: new Date(data_lancamento), mesRef: mes_ref },
      include: { tipo: true },
    });

    const usuarioId = request.headers.get("x-usuario-id") ?? 1;
    await registrarLog({ usuarioId: Number(usuarioId), tipoAcao:"UPDATE", entidade:"despesas", registroId: id, descricao:`Despesa atualizada: ${despesa.tipo.nome}`, dadosAntes: antes, dadosDepois: despesa, ip: getIp(request) });

    return NextResponse.json(despesa);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar despesa." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);
    const antes = await prisma.despesa.findUnique({ where:{ id }, include:{ tipo:true } });
    await prisma.despesa.delete({ where: { id } });

    const usuarioId = request.headers.get("x-usuario-id") ?? 1;
    await registrarLog({ usuarioId: Number(usuarioId), tipoAcao:"DELETE", entidade:"despesas", registroId: id, descricao:`Despesa excluída: ${antes?.tipo?.nome} - R$ ${antes?.valor}`, dadosAntes: antes, ip: getIp(request) });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir despesa." }, { status: 500 });
  }
}

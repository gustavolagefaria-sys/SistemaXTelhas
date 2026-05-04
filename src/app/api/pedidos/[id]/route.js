// src/app/api/pedidos/[id]/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registrarLog, getIp } from "@/lib/auditoria";

export async function PUT(request, { params }) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { numero_pedido, valor_total, custo_bruto, nf_emitida, valor_nf, numero_nf, data_emissao, mes_ref } = body;
    if (!numero_pedido || !valor_total || !data_emissao || !mes_ref)
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });

    const antes  = await prisma.pedido.findUnique({ where:{ id } });
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { numeroPedido: numero_pedido, valorTotal: Number(valor_total), custoBruto: custo_bruto?Number(custo_bruto):null, nfEmitida: Boolean(nf_emitida), valorNf: nf_emitida?Number(valor_nf):null, numeroNf: nf_emitida?numero_nf:null, dataEmissao: new Date(data_emissao), mesRef: mes_ref },
    });

    const usuarioId = request.headers.get("x-usuario-id") ?? 1;
    await registrarLog({ usuarioId: Number(usuarioId), tipoAcao:"UPDATE", entidade:"pedidos", registroId: id, descricao:`Pedido atualizado: ${pedido.numeroPedido}`, dadosAntes: antes, dadosDepois: pedido, ip: getIp(request) });

    return NextResponse.json(pedido);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar pedido." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id    = Number(params.id);
    const antes = await prisma.pedido.findUnique({ where:{ id } });
    await prisma.pedido.delete({ where: { id } });

    const usuarioId = request.headers.get("x-usuario-id") ?? 1;
    await registrarLog({ usuarioId: Number(usuarioId), tipoAcao:"DELETE", entidade:"pedidos", registroId: id, descricao:`Pedido excluído: ${antes?.numeroPedido}`, dadosAntes: antes, ip: getIp(request) });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir pedido." }, { status: 500 });
  }
}

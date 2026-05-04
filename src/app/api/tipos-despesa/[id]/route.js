// src/app/api/tipos-despesa/[id]/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT /api/tipos-despesa/[id]
export async function PUT(request, { params }) {
  try {
    const id   = Number(params.id);
    const { nome } = await request.json();

    if (!nome?.trim())
      return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });

    const tipo = await prisma.tipoDespesa.findUnique({ where: { id } });
    if (!tipo)
      return NextResponse.json({ error: "Tipo não encontrado." }, { status: 404 });
    if (tipo.isSistema)
      return NextResponse.json({ error: "Tipos de sistema não podem ser editados." }, { status: 403 });

    // verificar duplicata
    const duplicado = await prisma.tipoDespesa.findFirst({
      where: {
        nome: { equals: nome.trim(), mode: "insensitive" },
        id:   { not: id },
      },
    });
    if (duplicado)
      return NextResponse.json({ error: "Já existe um tipo com esse nome." }, { status: 409 });

    const atualizado = await prisma.tipoDespesa.update({
      where: { id },
      data:  { nome: nome.trim() },
    });

    return NextResponse.json(atualizado);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar tipo." }, { status: 500 });
  }
}

// DELETE /api/tipos-despesa/[id]
export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);

    const tipo = await prisma.tipoDespesa.findUnique({ where: { id } });
    if (!tipo)
      return NextResponse.json({ error: "Tipo não encontrado." }, { status: 404 });
    if (tipo.isSistema)
      return NextResponse.json({ error: "Tipos de sistema não podem ser excluídos." }, { status: 403 });

    // consistência: verificar se há despesas com esse tipo
    const emUso = await prisma.despesa.count({ where: { tipoId: id } });
    if (emUso > 0)
      return NextResponse.json(
        { error: "Erro: Tipo de despesa em utilização" },
        { status: 409 }
      );

    await prisma.tipoDespesa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir tipo." }, { status: 500 });
  }
}

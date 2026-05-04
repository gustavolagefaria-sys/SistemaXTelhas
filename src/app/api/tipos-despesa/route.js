// src/app/api/tipos-despesa/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/tipos-despesa?empresa_id=1
// Retorna os tipos de sistema + os tipos customizados da empresa, apenas ativos
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const empresaId = Number(searchParams.get("empresa_id") ?? 1);

  try {
    const tipos = await prisma.tipoDespesa.findMany({
      where: {
        ativo: true,
        OR: [
          { isSistema: true },
          { empresaId },
        ],
      },
      orderBy: [{ isSistema: "desc" }, { nome: "asc" }],
    });

    return NextResponse.json(tipos);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar tipos." }, { status: 500 });
  }
}

// POST /api/tipos-despesa — cria tipo customizado
export async function POST(request) {
  try {
    const { nome, empresa_id } = await request.json();

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
    }
    if (!empresa_id) {
      return NextResponse.json({ error: "empresa_id obrigatório." }, { status: 400 });
    }

    // impede duplicata para a mesma empresa
    const existente = await prisma.tipoDespesa.findFirst({
      where: {
        nome: { equals: nome.trim(), mode: "insensitive" },
        OR: [{ isSistema: true }, { empresaId: Number(empresa_id) }],
      },
    });
    if (existente) {
      return NextResponse.json({ error: "Já existe um tipo com esse nome." }, { status: 409 });
    }

    const tipo = await prisma.tipoDespesa.create({
      data: {
        nome:      nome.trim(),
        empresaId: Number(empresa_id),
        isSistema: false,
        ativo:     true,
      },
    });

    return NextResponse.json(tipo, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar tipo." }, { status: 500 });
  }
}

// PATCH /api/tipos-despesa — ativa/desativa tipo customizado
export async function PATCH(request) {
  try {
    const { id, ativo } = await request.json();

    const tipo = await prisma.tipoDespesa.findUnique({ where: { id: Number(id) } });
    if (!tipo) return NextResponse.json({ error: "Tipo não encontrado." }, { status: 404 });
    if (tipo.isSistema) return NextResponse.json({ error: "Tipos de sistema não podem ser alterados." }, { status: 403 });

    const atualizado = await prisma.tipoDespesa.update({
      where: { id: Number(id) },
      data:  { ativo: Boolean(ativo) },
    });

    return NextResponse.json(atualizado);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar tipo." }, { status: 500 });
  }
}

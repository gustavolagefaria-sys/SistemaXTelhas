// src/app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const usuarioId = request.headers.get("x-usuario-id");
    if (!usuarioId)
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId), ativo: true },
      select: {
        id: true, nome: true, email: true,
        perfil: true, empresaId: true, ultimoLogin: true,
      },
    });

    if (!usuario)
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    return NextResponse.json(usuario);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// src/app/api/auth/redefinir/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/lib/auditoria";

export async function POST(request) {
  try {
    const { token, novaSenha } = await request.json();

    if (!token || !novaSenha)
      return NextResponse.json({ error: "Token e nova senha são obrigatórios." }, { status: 400 });

    if (novaSenha.length < 6)
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });

    // buscar token válido
    const registro = await prisma.tokenRecuperacao.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!registro || registro.usado || registro.expiresAt < new Date())
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });

    // atualizar senha
    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await prisma.usuario.update({
      where: { id: registro.usuarioId },
      data:  { senhaHash },
    });

    // marcar token como usado
    await prisma.tokenRecuperacao.update({
      where: { id: registro.id },
      data:  { usado: true },
    });

    // registrar log
    await registrarLog({
      usuarioId:  registro.usuarioId,
      tipoAcao:   "UPDATE",
      entidade:   "usuarios",
      registroId: registro.usuarioId,
      descricao:  "Senha redefinida via recuperação",
    });

    return NextResponse.json({ ok: true, mensagem: "Senha redefinida com sucesso!" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

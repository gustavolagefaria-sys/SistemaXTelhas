// src/app/api/auth/recuperar/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email?.trim())
      return NextResponse.json({ error: "Informe o email." }, { status: 400 });

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase(), ativo: true },
    });

    // Sempre retorna sucesso por segurança (não revelar se email existe)
    if (!usuario)
      return NextResponse.json({ ok: true, mensagem: "Se o email existir, você receberá as instruções." });

    // Invalidar tokens anteriores
    await prisma.tokenRecuperacao.updateMany({
      where: { usuarioId: usuario.id, usado: false },
      data:  { usado: true },
    });

    // Gerar token seguro
    const token   = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.tokenRecuperacao.create({
      data: {
        usuarioId: usuario.id,
        token,
        expiresAt: expires,
      },
    });

    // Em produção: enviar email com o link
    // await sendEmail({ to: usuario.email, token })
    // Por enquanto, retorna o token no log do servidor para desenvolvimento:
    console.log(`\n🔑 TOKEN DE RECUPERAÇÃO para ${usuario.email}:`);
    console.log(`   http://localhost:3000/recuperar-senha?token=${token}\n`);

    return NextResponse.json({
      ok: true,
      mensagem: "Se o email existir, você receberá as instruções.",
      // Em dev apenas — remover em produção:
      _dev_token: process.env.NODE_ENV !== "production" ? token : undefined,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

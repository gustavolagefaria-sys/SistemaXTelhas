// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { gerarToken, COOKIE_NAME, SESSION_MINS } from "@/lib/auth";
import { registrarLog, getIp } from "@/lib/auditoria";

export async function POST(request) {
  try {
    const { email, senha } = await request.json();
    const ip = getIp(request);

    // validação básica
    if (!email?.trim() || !senha)
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });

    // buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { empresa: { select: { id: true, nome: true } } },
    });

    if (!usuario || !usuario.ativo)
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });

    // verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaCorreta)
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });

    // gerar token JWT
    const token = await gerarToken({
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      perfil:    usuario.perfil,
    });

    // atualizar último login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data:  { ultimoLogin: new Date() },
    });

    // registrar log de login
    await registrarLog({
      usuarioId:  usuario.id,
      tipoAcao:   "LOGIN",
      entidade:   "usuarios",
      registroId: usuario.id,
      descricao:  `Login realizado por ${usuario.email}`,
      ip,
    });

    // setar cookie httpOnly
    const response = NextResponse.json({
      ok: true,
      usuario: {
        id:     usuario.id,
        nome:   usuario.nome,
        email:  usuario.email,
        perfil: usuario.perfil,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   SESSION_MINS * 60,
      path:     "/",
    });

    return response;

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

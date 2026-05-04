// src/app/api/auth/cadastro/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registrarLog, getIp } from "@/lib/auditoria";

// Regras de senha forte
function validarSenha(senha) {
  const erros = [];
  if (senha.length < 8)              erros.push("Mínimo de 8 caracteres.");
  if (!/[a-zA-Z]/.test(senha))       erros.push("Deve conter pelo menos uma letra.");
  if (!/[0-9]/.test(senha))          erros.push("Deve conter pelo menos um número.");
  if (!/[^a-zA-Z0-9]/.test(senha))   erros.push("Deve conter pelo menos um caractere especial (!@#$%...).");
  return erros;
}

// POST /api/auth/cadastro
export async function POST(request) {
  try {
    const { nome, email, senha } = await request.json();
    const ip = getIp(request);

    // ── validações ────────────────────────────────────────────────────────────
    if (!nome?.trim())
      return NextResponse.json({ error: "Informe o nome." }, { status: 400 });

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });

    if (!senha)
      return NextResponse.json({ error: "Informe a senha." }, { status: 400 });

    const errosSenha = validarSenha(senha);
    if (errosSenha.length > 0)
      return NextResponse.json({ error: errosSenha[0], erros: errosSenha }, { status: 400 });

    // ── verificar se email já existe ──────────────────────────────────────────
    const existente = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existente)
      return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });

    // ── buscar empresa padrão (id=1) ──────────────────────────────────────────
    const empresa = await prisma.empresa.findFirst();
    if (!empresa)
      return NextResponse.json({ error: "Empresa não configurada. Contate o administrador." }, { status: 500 });

    // ── criar usuário ─────────────────────────────────────────────────────────
    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario   = await prisma.usuario.create({
      data: {
        nome:      nome.trim(),
        email:     email.trim().toLowerCase(),
        senhaHash,
        perfil:    "USUARIO",   // novos usuários são USUARIO por padrão
        ativo:     true,
        empresaId: empresa.id,
      },
    });

    // ── auditoria ─────────────────────────────────────────────────────────────
    // usa o admin (id=1) como referência de auditoria para cadastros públicos
    await registrarLog({
      usuarioId:  usuario.id,
      tipoAcao:   "CREATE",
      entidade:   "usuarios",
      registroId: usuario.id,
      descricao:  `Novo usuário cadastrado: ${usuario.email}`,
      dadosDepois: { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      ip,
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Conta criada com sucesso! Faça login para continuar.",
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    }, { status: 201 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}

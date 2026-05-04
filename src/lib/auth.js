// src/lib/auth.js
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "xtelhas-secret-key-change-in-production-2025"
);

const COOKIE_NAME  = "xtelhas_session";
const SESSION_MINS = 10; // expiração em minutos de inatividade

// ── gerar JWT ─────────────────────────────────────────────────────────────────
export async function gerarToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MINS}m`)
    .sign(SECRET);
}

// ── verificar JWT ─────────────────────────────────────────────────────────────
export async function verificarToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ── obter usuário da sessão (server-side) ─────────────────────────────────────
export async function getUsuarioSessao() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verificarToken(token);
    if (!payload?.usuarioId) return null;

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(payload.usuarioId), ativo: true },
      select: {
        id: true, nome: true, email: true,
        perfil: true, empresaId: true,
      },
    });

    return usuario;
  } catch {
    return null;
  }
}

// ── renovar token (sliding session) ──────────────────────────────────────────
export async function renovarSessao(usuarioId, empresaId, perfil) {
  const token = await gerarToken({ usuarioId, empresaId, perfil });
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   SESSION_MINS * 60,
    path:     "/",
  });
  return token;
}

// ── apagar sessão ─────────────────────────────────────────────────────────────
export async function apagarSessao() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── extrair token do request ──────────────────────────────────────────────────
export function getTokenDoRequest(request) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie) return cookie;
  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export { COOKIE_NAME, SESSION_MINS };

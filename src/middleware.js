// src/middleware.js
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET não definido."); })()
);
const COOKIE_NAME  = "xtelhas_session";
const SESSION_MINS = 10;

// rotas públicas — não precisam de autenticação
const ROTAS_PUBLICAS = [
  "/login",
  "/recuperar-senha",
  "/api/auth/login",
  "/api/auth/cadastro",
  "/api/auth/recuperar",
  "/api/auth/redefinir",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // libera rotas públicas, assets e _next
  if (
    ROTAS_PUBLICAS.some(r => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // sem token → redireciona para login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // token válido → renova o cookie (sliding session)
    const novoToken = await new SignJWT({
      usuarioId: payload.usuarioId,
      empresaId: payload.empresaId,
      perfil:    payload.perfil,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MINS}m`)
      .sign(SECRET);

    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, novoToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   SESSION_MINS * 60,
      path:     "/",
    });

    // passa dados do usuário para as rotas via header
    response.headers.set("x-usuario-id",    String(payload.usuarioId));
    response.headers.set("x-empresa-id",    String(payload.empresaId));
    response.headers.set("x-usuario-perfil", String(payload.perfil));

    return response;

  } catch {
    // token expirado ou inválido → redireciona para login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("expirado", "1");
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

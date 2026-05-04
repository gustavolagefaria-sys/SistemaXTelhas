// src/app/api/auth/logout/route.js
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { registrarLog, getIp } from "@/lib/auditoria";

export async function POST(request) {
  try {
    const usuarioId = request.headers.get("x-usuario-id");
    const ip        = getIp(request);

    if (usuarioId) {
      await registrarLog({
        usuarioId:  Number(usuarioId),
        tipoAcao:   "LOGOUT",
        entidade:   "usuarios",
        registroId: usuarioId,
        descricao:  "Logout realizado",
        ip,
      });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao fazer logout." }, { status: 500 });
  }
}

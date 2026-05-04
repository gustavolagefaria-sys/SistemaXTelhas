// src/app/api/auditoria/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenDoRequest, verificarToken } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // verificar permissão via token JWT do cookie
  try {
    const token = getTokenDoRequest(request);
    if (!token)
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const payload = await verificarToken(token);
    if (!payload?.usuarioId)
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });

    // buscar perfil direto do banco
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(payload.usuarioId) },
      select: { perfil: true },
    });

    if (!usuario || usuario.perfil !== "ADMIN")
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  } catch {
    return NextResponse.json({ error: "Erro de autenticação." }, { status: 401 });
  }

  const pagina   = Math.max(1, Number(searchParams.get("pagina") ?? 1));
  const limite   = Math.min(100, Math.max(1, Number(searchParams.get("limite") ?? 20)));
  const skip     = (pagina - 1) * limite;
  const exportar = searchParams.get("exportar");

  const where = {};
  const usuarioId  = searchParams.get("usuario_id");
  const tipoAcao   = searchParams.get("tipo_acao");
  const entidade   = searchParams.get("entidade");
  const dataInicio = searchParams.get("data_inicio");
  const dataFim    = searchParams.get("data_fim");

  if (usuarioId)  where.usuarioId = Number(usuarioId);
  if (tipoAcao)   where.tipoAcao  = tipoAcao;
  if (entidade)   where.entidade  = entidade;
  if (dataInicio || dataFim) {
    where.criadoEm = {};
    if (dataInicio) where.criadoEm.gte = new Date(dataInicio + "T00:00:00");
    if (dataFim)    where.criadoEm.lte = new Date(dataFim    + "T23:59:59");
  }

  try {
    if (exportar === "csv") {
      const todos = await prisma.logAtividade.findMany({
        where,
        include: { usuario: { select: { nome: true, email: true } } },
        orderBy: { criadoEm: "desc" },
        take: 10000,
      });

      const cab = "ID,Usuario,Email,Tipo Acao,Entidade,Registro ID,Descricao,IP,Data Hora\n";
      const lin = todos.map(l => [
        l.id,
        `"${l.usuario.nome}"`,
        l.usuario.email,
        l.tipoAcao,
        l.entidade,
        l.registroId ?? "",
        `"${(l.descricao ?? "").replace(/"/g, "'")}"`,
        l.ip ?? "",
        new Date(l.criadoEm).toLocaleString("pt-BR"),
      ].join(",")).join("\n");

      return new Response(cab + lin, {
        headers: {
          "Content-Type":        "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0,10)}.csv"`,
        },
      });
    }

    const [total, logs] = await Promise.all([
      prisma.logAtividade.count({ where }),
      prisma.logAtividade.findMany({
        where,
        include: { usuario: { select: { id: true, nome: true, email: true } } },
        orderBy: { criadoEm: "desc" },
        skip,
        take: limite,
      }),
    ]);

    return NextResponse.json({
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      logs,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar logs." }, { status: 500 });
  }
}

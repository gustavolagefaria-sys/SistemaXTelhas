// src/lib/auditoria.js
import { prisma } from "./prisma";

/**
 * Registra uma ação de auditoria no banco.
 *
 * @param {Object} params
 * @param {number}  params.usuarioId  - ID do usuário que realizou a ação
 * @param {string}  params.tipoAcao   - CREATE | UPDATE | DELETE | LOGIN | LOGOUT
 * @param {string}  params.entidade   - Nome da entidade (despesas, pedidos, usuarios…)
 * @param {string|number|null} params.registroId - ID do registro afetado
 * @param {string}  [params.descricao]  - Descrição livre da ação
 * @param {object}  [params.dadosAntes] - Estado anterior (UPDATE/DELETE)
 * @param {object}  [params.dadosDepois] - Estado posterior (CREATE/UPDATE)
 * @param {string}  [params.ip]         - IP do cliente
 */
export async function registrarLog({
  usuarioId,
  tipoAcao,
  entidade,
  registroId = null,
  descricao  = null,
  dadosAntes = null,
  dadosDepois = null,
  ip = null,
}) {
  try {
    await prisma.logAtividade.create({
      data: {
        usuarioId:   Number(usuarioId),
        tipoAcao,
        entidade,
        registroId:  registroId ? String(registroId) : null,
        descricao,
        dadosAntes:  dadosAntes  ? dadosAntes  : undefined,
        dadosDepois: dadosDepois ? dadosDepois : undefined,
        ip,
      },
    });
  } catch (err) {
    // auditoria nunca deve travar a operação principal
    console.error("[AUDITORIA] Erro ao registrar log:", err);
  }
}

// ── helper: extrair IP do request ─────────────────────────────────────────────
export function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "desconhecido"
  );
}

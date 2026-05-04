const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const total = await p.logAtividade.count();
  console.log('Total de logs no banco:', total);

  const logs = await p.logAtividade.findMany({
    take: 5,
    orderBy: { criadoEm: 'desc' },
    include: { usuario: { select: { email: true } } }
  });

  console.log('\nÚltimos logs:');
  logs.forEach(l => {
    console.log(`  [${l.tipoAcao}] ${l.entidade} - ${l.usuario.email} - ${l.criadoEm}`);
  });
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const u = await p.usuario.update({
    where: { email: 'admin@xtelhas.com' },
    data:  { perfil: 'ADMIN' },
  });
  console.log('Perfil atualizado:', u.email, '->', u.perfil);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());

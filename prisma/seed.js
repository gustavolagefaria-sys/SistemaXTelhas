// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const TIPOS_SISTEMA = [
  "Materiais","Salário","Alimentação","Aluguel","Energia","Frete",
  "Internet","Marketing","Seguradora","Bancos","Manutenção de máquinas",
  "Manutenção de veículos","Retiradas","Serviços","Rescisão contratual","Outros",
];

async function main() {
  console.log("🌱 Iniciando seed...\n");

  for (const nome of TIPOS_SISTEMA) {
    await prisma.tipoDespesa.upsert({
      where:  { id: TIPOS_SISTEMA.indexOf(nome) + 1 },
      update: {},
      create: { nome, isSistema: true, ativo: true },
    });
  }
  console.log(`✅ ${TIPOS_SISTEMA.length} tipos de despesa criados.`);

  const empresa = await prisma.empresa.upsert({
    where:  { cnpj: "00.000.000/0001-00" },
    update: {},
    create: { nome: "XTelhas", cnpj: "00.000.000/0001-00" },
  });
  console.log(`✅ Empresa: ${empresa.nome}`);

  const senhaHash = await bcrypt.hash("Admin@2025", 12);
  const admin = await prisma.usuario.upsert({
    where:  { email: "admin@xtelhas.com" },
    update: {},
    create: {
      nome: "Administrador", email: "admin@xtelhas.com",
      senhaHash, perfil: "ADMIN", ativo: true, empresaId: empresa.id,
    },
  });
  console.log(`✅ Admin Master: ${admin.email}`);

  console.log(`
─────────────────────────────────────
  Login: admin@xtelhas.com
  Senha: Admin@2025
  ⚠️  Troque a senha após o primeiro acesso!
─────────────────────────────────────`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

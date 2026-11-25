const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

// ISSO É UM ARQUIVO DE TESTE !!!

const sdrs = [
  { email: "eduardo.barros@consultoriafocus.com", nome: "Eduardo Barros", cargo: "SDR" },
  { email: "mariafernanda.fernandes@consultoriafocus.com", nome: "Maria Fernanda Fernandes", cargo: "SDR Sênior" },
  { email: "gabriel.valim@consultoriafocus.com", nome: "Gabriel Valim", cargo: "SDR" },
];

const leads = [
  {
    nomePessoa: "Luma Campos",
    nomeEmpresa: "Empresa Exemplo",
    email: "luma@exemplo.com",
    whatsapp: "21999990001",
    descricao: "Queremos automatizar o atendimento comercial.",
    solucaoInteresse: "Automação de Processos",
    nicho: "Serviços",
    origem: "SITE",
    situacao: "Novo",
  },
  {
    nomePessoa: "Luis Felipe",
    nomeEmpresa: "Padaria Modelo",
    email: "luis@padariamodelo.com",
    descricao: "Precisa organizar pedidos e entregas.",
    solucaoInteresse: "Automação de Processos",
    nicho: "Alimentício",
    origem: "SDR",
    situacao: "Em contato",
    responsavelSdr: "eduardo.barros@consultoriafocus.com",
    cadastradoPor: "eduardo.barros@consultoriafocus.com",
  },
  {
    nomePessoa: "Vitto Baroni",
    nomeEmpresa: "Clínica Vida",
    email: "vitto@clinicavida.com",
    whatsapp: "21999990003",
    descricao: "Agendamentos manuais geram muitos erros.",
    solucaoInteresse: "Gestão de Atendimento",
    nicho: "Saúde",
    origem: "SITE",
    situacao: "Qualificado",
    responsavelSdr: "gabriel.valim@consultoriafocus.com",
  },
];

// Cada análise e cada operação aponta para o lead pelo e-mail dele
// Cada análise e cada operação aponta para o lead pelo e-mail dele
const analises = [
  {
    leadEmail: "luma@exemplo.com",
    prioridade: "Alta",
    justificativa: "Dor operacional clara e prazo mencionado.",
    abordagem: "Investigar o fluxo atual e o impacto no tempo da equipe.",
    statusIA: "Processado",
    dataProcessamento: new Date("2026-11-14T10:30:00"),
  },
  {
    leadEmail: "luis@padariamodelo.com",
    prioridade: "Baixa",
    justificativa: "Necessidade genérica, sem prazo definido.",
    abordagem: "Enviar material introdutório e acompanhar.",
    statusIA: "Processado",
    dataProcessamento: new Date("2026-11-14T11:00:00"),
  },
  { leadEmail: "vitto@clinicavida.com", statusIA: "Erro" },
];

const operacoes = [
  {
    sdrEmail: "eduardo.barros@consultoriafocus.com",
    leadEmail: "luis@padariamodelo.com",
    tentativasContato: 2,
    ultimoContato: new Date("2026-11-13T15:00:00"),
    proximoContato: new Date("2026-11-17T09:30:00"),
  },
  {
    sdrEmail: "mariafernanda.fernandes@consultoriafocus.com",
    leadEmail: "vitto@clinicavida.com",
    tentativasContato: 1,
    ultimoContato: new Date("2026-11-14T16:20:00"),
    proximoContato: new Date("2026-11-18T14:00:00"),
  },
  {
    sdrEmail: "gabriel.valim@consultoriafocus.com",
    leadEmail: "luma@exemplo.com",
    tentativasContato: 0,
    proximoContato: new Date("2026-11-16T10:00:00"),
  },
];

// Aqui começam as funções sobre validação dos dados e testes
function validarLead(lead) {
  if (!lead.email && !lead.whatsapp) {
    throw new Error(`Lead ${lead.nomePessoa}: precisa de e-mail ou WhatsApp.`);
  }
  if (lead.origem === "SITE" && lead.cadastradoPor) {
    throw new Error(`Lead ${lead.nomePessoa}: origem SITE não tem SDR cadastrando.`);
  }
  if (lead.origem === "SDR" && !lead.cadastradoPor) {
    throw new Error(`Lead ${lead.nomePessoa}: origem SDR exige o SDR que cadastrou.`);
  }
}

async function main() {
  // Limpa tudo, na ordem certa (quem aponta para outro vem primeiro)
  await prisma.operacao.deleteMany();
  await prisma.ia.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.sdr.deleteMany();

  // 1. INSERT INTO
  console.log(" Cadastrando SDRs, leads, análises e operações...");
  const leadsComId = leads.map((l) => ({ id: randomUUID(), ...l }));
  const idPorEmail = Object.fromEntries(leadsComId.map((l) => [l.email, l.id]));

  leadsComId.forEach(validarLead);
  [...analises, ...operacoes].forEach((item) => {
    if (!idPorEmail[item.leadEmail]) {
      throw new Error(`leadEmail "${item.leadEmail}" não existe na lista leads.`);
    }
  });
  operacoes.forEach((op) => {
    if (!sdrs.some((s) => s.email === op.sdrEmail)) {
      throw new Error(`sdrEmail "${op.sdrEmail}" não existe na lista sdrs.`);
    }
  });

  await prisma.sdr.createMany({ data: sdrs });
  await prisma.lead.createMany({ data: leadsComId });
  await prisma.ia.createMany({
    data: analises.map(({ leadEmail, ...resto }) => ({
      leadId: idPorEmail[leadEmail],
      ...resto,
    })),
  });
  await prisma.operacao.createMany({
    data: operacoes.map(({ leadEmail, ...resto }) => ({
      leadId: idPorEmail[leadEmail],
      ...resto,
    })),
  });
  console.log(" Dados cadastrados com sucesso!\n");

  // 2. SELECT * FROM
  console.log(" Leads com a análise da IA:");
  const todos = await prisma.lead.findMany({ include: { analises: true } });
  console.table(
    todos.map((l) => ({
      empresa: l.nomeEmpresa,
      origem: l.origem,
      responsavel: l.responsavelSdr,
      prioridade: l.analises[0]?.prioridade ?? "-",
      statusIA: l.analises[0]?.statusIA ?? "-",
    }))
  );
  console.log("");

  // 3. SELECT ... WHERE
  console.log(" 3. [SELECT WHERE] Operações do Eduardo:");
  const doEduardo = await prisma.operacao.findMany({
    where: { sdrEmail: "eduardo.barros@consultoriafocus.com" },
  });
  console.table(doEduardo);
  console.log("");

  // 4. UPDATE
  console.log(" 4. [UPDATE] Marcando o lead do Vitto como reprocessado pela IA...");
  const idVitto = idPorEmail["vitto@clinicavida.com"];
  await prisma.ia.updateMany({
    where: { leadId: idVitto },
    data: {
      prioridade: "Media",
      justificativa: "Processo manual com erros frequentes.",
      abordagem: "Mapear o fluxo de agendamento atual.",
      statusIA: "Processado",
      dataProcessamento: new Date(),
    },
  });
  console.log(" Análise atualizada!\n");

  // 5. DELETE FROM
  console.log(" 5. [DELETE FROM] Removendo o lead do Luis...");
  await prisma.lead.delete({ where: { id: idPorEmail["luis@padariamodelo.com"] } });
  console.log(" Lead removido!");
}

main()
  .catch((erro) => {
    console.error("Erro:", erro.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
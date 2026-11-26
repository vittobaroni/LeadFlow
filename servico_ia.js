// servico_ia.js

function prepararDadosParaIA(lead, dadosScraping = null) {
  const nichoFinal =
    dadosScraping &&
    dadosScraping.segmento &&
    dadosScraping.segmento !== "Não identificado"
      ? dadosScraping.segmento
      : lead.nicho || null;

  const oportunidade = {
    id: lead.id,
    situacao: "aberta",
    nomeEmpresa: lead.nomeEmpresa || null,
    descricao: lead.descricao || null,
    solucaoInteresse: lead.solucaoInteresse || null,
    nicho: nichoFinal,
  };

  if (dadosScraping) {
    oportunidade.dadosSite = {
      url: dadosScraping.url,
      titulo: dadosScraping.titulo,
      descricao: dadosScraping.descricao,
      segmento: dadosScraping.segmento,
    };
  }

  return oportunidade;
}

function converterPontuacaoParaPrioridade(pontuacao) {
  if (pontuacao >= 75) return "Alta";
  if (pontuacao >= 45) return "Media";
  return "Baixa";
}

async function salvarAnaliseIA(prisma, leadId, itemRanking) {
  const prioridade = converterPontuacaoParaPrioridade(itemRanking.pontuacao);

  const dadosAnalise = {
    prioridade,
    justificativa: itemRanking.justificativa,
    abordagem: itemRanking.abordagem,
    statusIA: "Processado",
    dataProcessamento: new Date(),
  };

  const registroExistente = await prisma.ia.findFirst({
    where: { leadId },
  });

  if (registroExistente) {
    return await prisma.ia.update({
      where: { id: registroExistente.id },
      data: dadosAnalise,
    });
  }

  return await prisma.ia.create({
    data: {
      leadId,
      ...dadosAnalise,
    },
  });
}

async function registrarErroIA(prisma, leadId) {
  const dadosErro = {
    prioridade: null,
    justificativa: null,
    abordagem: null,
    statusIA: "Erro",
    dataProcessamento: null,
  };

  const registroExistente = await prisma.ia.findFirst({
    where: { leadId },
  });

  if (registroExistente) {
    return await prisma.ia.update({
      where: { id: registroExistente.id },
      data: dadosErro,
    });
  }

  return await prisma.ia.create({
    data: {
      leadId,
      ...dadosErro,
    },
  });
}

module.exports = {
  prepararDadosParaIA,
  converterPontuacaoParaPrioridade,
  salvarAnaliseIA,
  registrarErroIA,
};
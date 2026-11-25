function validarLead(lead) {
  const origensValidas = ["SITE", "SDR"];

  if (!lead.nomePessoa || !lead.nomePessoa.trim()) {
    throw new Error("O nome do decisor (nome_completo) é obrigatório.");
  }

  if (!lead.nomeEmpresa || !lead.nomeEmpresa.trim()) {
    throw new Error("O nome da empresa (empresa) é obrigatório.");
  }

  const emailLimpo = lead.email?.trim() || "";
  const whatsappLimpo = lead.whatsapp?.replace(/\D/g, "") || "";

  if (!emailLimpo && !whatsappLimpo) {
    throw new Error(`Lead ${lead.nomePessoa}: informe ao menos e-mail ou WhatsApp.`);
  }

  if (emailLimpo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
    throw new Error(`Lead ${lead.nomePessoa}: formato de e-mail inválido.`);
  }

  if (!origensValidas.includes(lead.origem)) {
    throw new Error(`Origem inválida: "${lead.origem}". Use SITE ou SDR.`);
  }

  if (lead.origem === "SITE") {
    if (lead.cadastradoPor) {
      throw new Error(`Lead ${lead.nomePessoa}: origem SITE não deve ter SDR cadastrante.`);
    }
    if (!lead.descricao?.trim() || !lead.solucaoInteresse?.trim()) {
      throw new Error(`Lead ${lead.nomePessoa}: origem SITE exige descrição e solução de interesse.`);
    }
  }

  if (lead.origem === "SDR" && !lead.cadastradoPor?.trim()) {
    throw new Error(`Lead ${lead.nomePessoa}: origem SDR exige o e-mail do SDR que cadastrou.`);
  }

  return {
    nomePessoa: lead.nomePessoa.trim(),
    nomeEmpresa: lead.nomeEmpresa.trim(),
    email: emailLimpo || null,
    whatsapp: whatsappLimpo || null,
    descricao: lead.descricao?.trim() || null,
    solucaoInteresse: lead.solucaoInteresse?.trim() || null,
    nicho: lead.nicho?.trim() || null,
    origem: lead.origem,
    situacao: lead.situacao || "Novo",
    responsavelSdr: lead.responsavelSdr || null,
    cadastradoPor: lead.cadastradoPor || null,
  };
}

module.exports = { validarLead };
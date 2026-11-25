const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const { validarLead } = require("./validador_lead");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// rota de entrada de leads do site - definido pelo contrato

app.post("/api/webhooks/leads", async (req, res) => {
  try {
    // 1. Garante que o Content-Type seja application/json
    if (!req.is("application/json")) {
      return res.status(415).json({
        erro: "Content-Type inválido. Utilize application/json.",
      });
    }

    // extrai os 6 campos definidos no contrato mínimo
    const {
      nome_completo,
      empresa,
      email,
      whatsapp,
      descricao,
      solucao_interesse,
    } = req.body;

    if (!email?.trim() || !whatsapp?.trim()) {
      return res.status(400).json({
        erro: "Os campos email e whatsapp são obrigatórios no contrato do webhook.",
      });
    }

    const dadosRecebidos = {
      nomePessoa: nome_completo,
      nomeEmpresa: empresa,
      email,
      whatsapp,
      descricao,
      solucaoInteresse: solucao_interesse,
      nicho: null,
      origem: "SITE",
      situacao: "Novo",
      responsavelSdr: null,
      cadastradoPor: null,
    };

    // validação dos dados
    const leadValidado = validarLead(dadosRecebidos);

    // 3.5 Verifica se já existe lead com o mesmo e-mail ou WhatsApp
    const condicoesBusca = [];
    if (leadValidado.email) condicoesBusca.push({ email: leadValidado.email });
    if (leadValidado.whatsapp) condicoesBusca.push({ whatsapp: leadValidado.whatsapp });

    const leadExistente = await prisma.lead.findFirst({
      where: { OR: condicoesBusca },
    });

    if (leadExistente) {
      return res.status(409).json({
        erro: "Lead já cadastrado com este e-mail ou WhatsApp.",
        lead: leadExistente,
      });
    }

    // gera o uuid pra cada um deles e salva no banco
    
    const novoLead = await prisma.lead.create({
      data: {
        id: randomUUID(),
        ...leadValidado,
      },
    });

    return res.status(201).json({
      mensagem: "Lead recebido e salvo com sucesso!",
      lead: novoLead,
    });
  } catch (erro) {
    if (
      erro.message.includes("obrigatório") ||
      erro.message.includes("inválido") ||
      erro.message.includes("informe ao menos") ||
      erro.message.includes("origem SITE")
    ) {
      return res.status(400).json({ erro: erro.message });
    }

    console.error("Erro interno ao salvar lead:", erro);
    return res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

app.get("/api/leads", async (req, res) => {
  const leads = await prisma.lead.findMany({
    orderBy: { criadoEm: "desc" },
  });
  return res.json(leads);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor do leadflow rodando em http://localhost:${PORT}`);
  // pra acessar, coloca o link/api/leads
});
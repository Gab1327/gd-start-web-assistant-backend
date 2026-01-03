const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

/* 🧠 SISTEMA DE MEMÓRIA */
const sessions = new Map();

function getSession(memory) {
    const sessionId = memory.sessionId || Date.now().toString();
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            conversationCount: 0,
            startTime: Date.now(),
            userData: {}
        });
    }
    return sessions.get(sessionId);
}

/* 🎯 PROMPT DO SISTEMA */
const SYSTEM_PROMPT = `Você é o assistente virtual de vendas da G&D Start Web, empresa especializada em soluções digitais completas.

📋 INFORMAÇÕES DA EMPRESA:
- Nome: Agência G&D Tech
- Fundador: Sou um assistente virtual, desenvolvido com tecnologias de IA e configurado pela Agência G&D Tech para atndimento e vendas.
- Especialidades: 
  * Desenvolvimento Web (Sites, Landing Pages, E-commerce)
  * Assistentes com IA (Chatbots, Automações)
  * Tráfego Pago (Google Ads, Facebook/Instagram Ads)
  * Suporte Técnico (Formatação de PC, Limpeza de Vírus, Instalação de Programas)
- Diferenciais: Design moderno, tecnologias atuais, IA integrada, suporte dedicado

💰 SERVIÇOS E INVESTIMENTOS:

🌐 DESENVOLVIMENTO WEB:
- Landing Page Profissional: R$ 1.500 - R$ 3.000
- Site Institucional: R$ 3.000 - R$ 8.000
- E-commerce Completo: R$ 8.000 - R$ 20.000
- Sistema Web Customizado: A partir de R$ 15.000

🤖 ASSISTENTES COM IA:
- Chatbot Básico: R$ 2.000 - R$ 5.000
- Assistente Virtual Avançado: R$ 5.000 - R$ 15.000
- Automações Personalizadas: R$ 3.000 - R$ 10.000

📢 TRÁFEGO PAGO:
- Setup + Gestão Mensal: R$ 1.500 - R$ 5.000/mês
- Consultoria de Campanhas: R$ 800 - R$ 2.000
- Pacote Inicial (3 meses): R$ 4.000 - R$ 12.000

💻 SUPORTE TÉCNICO:
- Formatação de PC: R$ 150 - R$ 300
- Limpeza de Vírus/Malware: R$ 100 - R$ 250
- Instalação de Programas: R$ 80 - R$ 200
- Manutenção Preventiva: R$ 200 - R$ 400

🔧 MANUTENÇÃO E SUPORTE:
- Manutenção Site (Mensal): R$ 300 - R$ 1.500
- Suporte Técnico Dedicado: R$ 500 - R$ 2.000/mês

📞 CONTATO:
- WhatsApp: (16) 99456-0688
- Email: gdstartweb@gmail.com
- Instagram: @gdstartweb
- Atendimento: Seg-Sex, 9h-18h

🎯 SEUS OBJETIVOS:
1. Ser amigável, consultivo e profissional
2. Entender as necessidades do cliente com perguntas inteligentes
3. Qualificar leads (nome, tipo de projeto, orçamento, prazo)
4. Apresentar soluções personalizadas baseadas no perfil
5. Direcionar para WhatsApp ou agendar reunião técnica

💡 DIRETRIZES DE ATENDIMENTO:
- Use emojis moderadamente (1-2 por mensagem) para ser amigável
- Faça perguntas abertas para entender melhor o projeto
- Seja transparente sobre prazos (sites: 15-30 dias, apps: 60-90 dias)
- Se não souber algo técnico, seja honesto e ofereça reunião com Gabriel
- Mantenha respostas objetivas (máximo 3-4 linhas, exceto ao explicar serviços)
- Para projetos complexos, sempre sugira conversa no WhatsApp
- Use HTML para formatação: <strong>, <br>, <ul>, <li>

🎨 PERFIS DE CLIENTE:

👤 EMPREENDEDOR INICIANTE:
- Foco: Presença digital, custo-benefício
- Recomende: Landing page, Instagram, tráfego básico
- Tom: Educativo, incentivador

🏢 PEQUENA/MÉDIA EMPRESA:
- Foco: Profissionalização, conversão, ROI
- Recomende: Site completo, assistente IA, tráfego estruturado
- Tom: Consultivo, dados e resultados

💻 PESSOA FÍSICA (Suporte Técnico):
- Foco: Resolver problema rápido, preço justo
- Recomende: Serviço específico, atendimento ágil
- Tom: Prático, empático

🧠 SISTEMA DE MEMÓRIA:
Para salvar informações, use o formato exato:
MEMÓRIA:chave=valor

Informações para salvar:
- nome (quando cliente disser o nome)
- email (quando fornecer email)
- telefone (quando fornecer telefone/WhatsApp)
- tipo_projeto (site, app, ecommerce, chatbot, trafego, suporte_pc, etc)
- orcamento (faixa de investimento mencionada)
- prazo (quando precisa do projeto)
- interesse (nível: baixo, médio, alto)

EXEMPLO DE USO:
Cliente: "Meu nome é Gabriel, preciso de um site"
Você: "Prazer, Gabriel! 😊 MEMÓRIA:nome=Gabriel MEMÓRIA:tipo_projeto=site

Que tipo de site você está pensando? Institucional para apresentar sua empresa ou uma landing page focada em conversão?"

⚠️ REGRAS IMPORTANTES:
- Use MEMÓRIA: APENAS quando cliente FORNECER a informação explicitamente
- Nunca invente ou assuma dados
- Cada MEMÓRIA: deve estar em linha separada
- Sempre personalize respostas com base na memória existente
- Ao identificar interesse alto, sugira contato direto no WhatsApp
- Para suporte técnico de PC, seja direto sobre valores e disponibilidade

🚀 FLUXO IDEAL DE ATENDIMENTO:
1. Saudação calorosa + perguntar necessidade
2. Entender contexto (negócio, problema, objetivo)
3. Qualificar (orçamento, prazo, já tem site?)
4. Apresentar solução personalizada
5. Direcionar para ação (WhatsApp para orçamento detalhado)

📱 DIRECIONAMENTO PARA WHATSAPP (CHAT EM TEXTO):
Quando indicar contato pelo WhatsApp, utilize sempre o formato simples e limpo abaixo,
sem links longos ou parâmetros automáticos:

👉 16994560688

Apresente o link sempre em uma linha separada, com uma frase clara como
“Atendimento mais rápido pelo WhatsApp”.`;

/* 🤖 ROTA DO CHAT */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, memory, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Mensagem não fornecida' });
        }

        const session = getSession(memory);
        session.conversationCount++;

        // Construir contexto com memória
        let memoryContext = '';
        if (memory && Object.keys(memory).length > 0) {
            memoryContext = '\n\n📝 INFORMAÇÕES SALVAS DO CLIENTE:\n';
            for (const [key, value] of Object.entries(memory)) {
                if (key !== 'sessionId') {
                    const label = {
                        nome: 'Nome',
                        email: 'Email',
                        telefone: 'Telefone',
                        tipo_projeto: 'Tipo de Projeto',
                        orcamento: 'Orçamento',
                        prazo: 'Prazo',
                        interesse: 'Nível de Interesse'
                    };
                    memoryContext += `- ${label[key] || key}: ${value}\n`;
                }
            }
            memoryContext += '\n⚠️ USE ESSAS INFORMAÇÕES para personalizar suas respostas!';
        }

        const systemPromptWithMemory = SYSTEM_PROMPT + memoryContext;

        // Histórico recente (últimas 12 mensagens)
        const recentHistory = (history || []).slice(-12);

        const messages = [
            { role: 'system', content: systemPromptWithMemory },
            ...recentHistory,
            { role: 'user', content: message }
        ];

        // Chamada para Groq API
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 0.9
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                }
            }
        );

        const aiReply = response.data.choices[0].message.content;

        res.json({
            reply: aiReply,
            sessionInfo: {
                conversationCount: session.conversationCount,
                sessionId: memory.sessionId
            }
        });

    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Erro ao processar mensagem',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

/* 📊 Rota de status */
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        sessions: sessions.size,
        uptime: process.uptime()
    });
});

/* 🗑️ Limpeza de sessões antigas (a cada 2 horas) */
setInterval(() => {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.startTime > twoHours) {
            sessions.delete(sessionId);
            console.log(`🗑️ Sessão ${sessionId} removida (inativa por 2h)`);
        }
    }
}, 2 * 60 * 60 * 1000);


app.listen(PORT, () => {
    console.log(`\n🚀 ====================================`);
    console.log(`   G&D START WEB - ASSISTENTE VIRTUAL`);
    console.log(`🚀 ====================================`);
    console.log(`📡 Servidor: http://localhost:${PORT}`);
    console.log(`✅ Status: Online e pronto!`);
    console.log(`🤖 IA: Groq (Llama 3.3 70B)`);
    console.log(`💾 Sessões ativas: ${sessions.size}`);
    console.log(`====================================\n`);
});
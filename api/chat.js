import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { messages, category } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `És um assistente de suporte técnico de IT para colaboradores de uma empresa portuguesa.
O teu nome é "Suporte IT". Respondes SEMPRE em português de Portugal (não Brasil).
Categorias de suporte: passwords, VPN, email (Outlook), e impressoras.
Regras:
- Sê direto e prático. Usa passos numerados quando necessário.
- Se o utilizador enviar uma imagem ou print, analisa-a e identifica o problema visível.
- Se não conseguires resolver, diz para contactar o IT na extensão 1234 ou abrir ticket em helpdesk.empresa.pt.
- Nunca peças passwords reais.
- Tom: amigável e profissional. Respostas curtas (máx 6 linhas).`,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Erro na resposta.';

    // Guardar conversa no Blob
    const conversa = {
      id: Date.now(),
      data: new Date().toISOString(),
      categoria: category || 'geral',
      mensagens: messages,
      resposta: reply,
    };

    await put(`conversas/${conversa.id}.json`, JSON.stringify(conversa), {
      access: 'public',
      contentType: 'application/json',
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

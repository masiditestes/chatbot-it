
import { list, head } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Proteção simples com password de admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const { blobs } = await list({ prefix: 'conversas/' });

    const conversas = await Promise.all(
      blobs
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 50) // últimas 50 conversas
        .map(async (blob) => {
          const res = await fetch(blob.url);
          return res.json();
        })
    );

    return res.status(200).json(conversas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar conversas' });
  }
}

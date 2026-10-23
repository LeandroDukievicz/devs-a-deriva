import { createServer } from 'node:http';

const categories = [
  ['tech', 'Tech'], ['carreira', 'Carreira Profissional'], ['livros', 'Livros & Leitura'],
  ['musica', 'Música'], ['aleatoriedades', 'Aleatoriedades'], ['noticias', 'Notícias'],
  ['curiosidades-tech', 'Curiosidades Tech'], ['sem-categoria', 'Sem Categoria'],
  ['trilha-de-estudos', 'Trilha de Estudos'],
].map(([slug, name]) => ({ slug, name }));
const posts = Array.from({ length: 14 }, (_, index) => ({
  slug: `artigo-de-teste-${index + 1}`,
  title: `Artigo de teste ${index + 1}: uma nova leitura em órbita`,
  category: index < 8 ? 'tech' : categories[1 + (index - 8) % (categories.length - 1)].slug,
  publishedAt: new Date(Date.UTC(2026, 8, 30 - index)).toISOString(),
  content: `Este artigo apresenta uma leitura verificável sobre tecnologia e as descobertas que fazemos no desenvolvimento de software. O conteúdo é público e serve para validar a navegação e o arquivo do blog.\n\n## Uma descoberta\n\nTexto com **ênfase**, *itálico* e [uma referência](https://example.com).\n\n- Primeiro aprendizado\n- Segundo aprendizado\n\n> Uma ideia para levar na próxima viagem.\n\nÚltimo parágrafo do artigo, com acentuação: à deriva, programação e histórias.`,
  author: { displayName: 'Editorial Devs à Deriva', jobTitle: 'Editorial', photoUrl: '/logo-high-color.webp' },
}));
posts.push({ ...posts[0], slug: 'artigo-agendado', title: 'Este artigo ainda não foi publicado', publishedAt: '2099-01-01T00:00:00.000Z' });

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.setHeader('Content-Type', 'application/json');
  if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
  const { pathname } = new URL(request.url, 'http://127.0.0.1:3001');
  if (pathname === '/health') { response.end(JSON.stringify({ status: 'ok' })); return; }
  if (pathname === '/api/posts') { response.end(JSON.stringify({ data: posts })); return; }
  if (pathname === '/api/categories') { response.end(JSON.stringify({ data: categories })); return; }
  if (pathname === '/api/reading-progress') { response.end(JSON.stringify({ progress: [] })); return; }
  if (pathname === '/api/comments') { response.end(JSON.stringify({ data: { comments: [] } })); return; }
  response.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
});
server.listen(3001, '127.0.0.1', () => console.log('Fixture dashboard ready at http://127.0.0.1:3001'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));

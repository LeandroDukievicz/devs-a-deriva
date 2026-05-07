export interface CategoryMeta {
  slug: string;
  label: string;
  description: string;
  illustration: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'tech',
    label: 'Tech',
    description: 'Um pouco sobre as ferramentas que usamos no dia a dia, stacks, opiniões baseadas em uso, o estado atual da tecnologia, sem glamour, só a realidade !',
    illustration: '/tech-astronaut.webp',
  },
  {
    slug: 'carreira',
    label: 'Carreira Profissional',
    description: 'O verdadeiro Backstage de quem paga boleto com código, sem maquiagem, sem firulas, vai encontrar nossa opinião sobre o mercado tech, trajetória, os erros e também os acertos, nada mais do que a vida real !',
    illustration: '/carreira-profissional-astronaut-body.webp',
  },
  {
    slug: 'aleatoriedades',
    label: 'Aleatoriedades',
    description: 'Fragmentos de pensamentos que rendem algumas boas histórias.',
    illustration: '/aleatoriedades-astronaut-body.webp',
  },
  {
    slug: 'livros',
    label: 'Livros & Leituras',
    description: 'Resenhas, indicações de leitura, não apenas livros técnicos, mas ficção científica, sci-fi, animes, tudo o que apreciamos do mundo nerd...',
    illustration: '/livros-astronaut.webp',
  },
  {
    slug: 'musica',
    label: 'Música',
    description: 'Playlists, discos, indicações, descobertas e o que escutamos enquanto estamos em modo DEV..',
    illustration: '/musica-astronaut.webp',
  },
  {
    slug: 'noticias',
    label: 'Notícias',
    description: 'Notícias da bolha tech que achamos relevantes pra compartilhar ou dar nossa opinião sincera...',
    illustration: '/noticias-astronaut.webp',
  },
];

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

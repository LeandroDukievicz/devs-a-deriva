import { fetchWithRetry } from './api';

export interface CategoryMeta {
  slug: string;
  label: string;
  hashtag: string;
  description: string;
  illustration: string;
}

export const FALLBACK_CATEGORY_ILLUSTRATION = '/logo-high-color.webp';

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'tech',
    label: 'Tech',
    hashtag: '#tech',
    description: 'Um pouco sobre as ferramentas que usamos no dia a dia, stacks, opiniões baseadas em uso, o estado atual da tecnologia, sem glamour, só a realidade !',
    illustration: '/tech-astronaut.webp',
  },
  {
    slug: 'carreira',
    label: 'Carreira Profissional',
    hashtag: '#carreira',
    description: 'O verdadeiro Backstage de quem paga boleto com código, sem maquiagem, sem firulas, vai encontrar nossa opinião sobre o mercado tech, trajetória, os erros e também os acertos, nada mais do que a vida real !',
    illustration: '/carreira-profissional-astronaut-body.webp',
  },
  {
    slug: 'aleatoriedades',
    label: 'Aleatoriedades',
    hashtag: '#devaneios',
    description: 'Fragmentos de pensamentos que rendem algumas boas histórias.',
    illustration: '/aleatoriedades-astronaut-body.webp',
  },
  {
    slug: 'livros',
    label: 'Livros & Leituras',
    hashtag: '#livros',
    description: 'Resenhas, indicações de leitura, não apenas livros técnicos, mas ficção científica, sci-fi, animes, tudo o que apreciamos do mundo nerd...',
    illustration: '/livros-astronaut.webp',
  },
  {
    slug: 'musica',
    label: 'Música',
    hashtag: '#musica',
    description: 'Playlists, discos, indicações, descobertas e o que escutamos enquanto estamos em modo DEV..',
    illustration: '/musica-astronaut.webp',
  },
  {
    slug: 'noticias',
    label: 'Notícias',
    hashtag: '#noticias',
    description: 'Notícias da bolha tech que achamos relevantes pra compartilhar ou dar nossa opinião sincera...',
    illustration: '/noticias-astronaut.webp',
  },
];

const DASHBOARD_URL = import.meta.env.PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000';
const CATEGORY_CACHE_TTL_MS = 30_000;

let _categoryCache: CategoryMeta[] | null = null;
let _categoryCacheTime = 0;

type DashboardCategory = {
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
};

function hasValidCategoryShape(raw: unknown): raw is DashboardCategory {
  if (typeof raw !== 'object' || raw === null) return false;

  const category = raw as { readonly name?: unknown; readonly slug?: unknown };
  return (
    typeof category.name === 'string' &&
    category.name.trim().length > 0 &&
    typeof category.slug === 'string' &&
    category.slug.trim().length > 0
  );
}

function categoryFromDashboard(raw: DashboardCategory): CategoryMeta {
  const slug = raw.slug.trim();
  const fallback = CATEGORIES.find((category) => category.slug === slug);
  const label = raw.name.trim();

  return {
    slug,
    label,
    hashtag: fallback?.hashtag ?? `#${slug}`,
    description: raw.description?.trim() || fallback?.description || `Posts da categoria ${label}.`,
    illustration: fallback?.illustration ?? FALLBACK_CATEGORY_ILLUSTRATION,
  };
}

export async function fetchCategories(): Promise<CategoryMeta[]> {
  const now = Date.now();
  if (_categoryCache && import.meta.env.PROD && now - _categoryCacheTime < CATEGORY_CACHE_TTL_MS) {
    return _categoryCache;
  }

  try {
    const response = await fetchWithRetry(`${DASHBOARD_URL}/api/categories?status=ACTIVE`);
    if (!response.ok) return _categoryCache ?? CATEGORIES;

    const json = await response.json();
    const items: unknown[] = Array.isArray(json?.data) ? json.data : [];
    const categories = items.filter(hasValidCategoryShape).map(categoryFromDashboard);

    if (categories.length === 0) return _categoryCache ?? CATEGORIES;

    _categoryCache = categories.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    _categoryCacheTime = now;
    return _categoryCache;
  } catch {
    return _categoryCache ?? CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryMeta | undefined> {
  const categories = await fetchCategories();
  return categories.find((category) => category.slug === slug);
}

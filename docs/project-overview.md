# Visão Geral do Projeto

## O que é

**Devs à Deriva** é uma plataforma editorial sobre tecnologia, engenharia de software, carreira, cultura digital e experiências pessoais no ecossistema dev. O projeto combina conteúdo autoral com uma interface visualmente marcante, construída para parecer menos um blog tradicional e mais uma experiência imersiva de navegação.

## Visão

A proposta é criar um espaço independente para textos que não precisam seguir a estética neutra, corporativa ou excessivamente otimizada da maioria dos blogs técnicos. O conteúdo pode ser técnico, opinativo, experimental ou pessoal, desde que preserve uma voz humana e uma direção editorial clara.

O projeto já opera como uma plataforma própria de publicação: o blog público roda em Astro com modo híbrido (SSR seletivo + estático) e o dashboard separado (`dashboard-ldstudio`) concentra publicação, categorias, autores, comentários, newsletter, métricas e regras de segurança.

## Identidade Editorial

O projeto assume uma postura direta, crítica e exploratória. Os temas principais são:

- engenharia de software;
- carreira e mercado de tecnologia;
- cultura dev;
- ferramentas, tendências e práticas;
- reflexões pessoais sobre trabalhar com tecnologia;
- experimentos visuais e narrativos.

O tom pode variar entre técnico, provocativo e informal, mas deve evitar conteúdo genérico ou puramente motivacional.

## Diferença em Relação a Blogs Comuns

Devs à Deriva não trata a interface como um detalhe secundário. A experiência visual faz parte da identidade editorial.

O projeto se diferencia por:

- direção visual futurista e cyberpunk;
- componentes interativos e animações customizadas;
- páginas editoriais com linguagem própria, como o manifesto;
- categorias tratadas como ambientes editoriais, não apenas filtros;
- foco em conteúdo autoral e menos pasteurizado.

## Público-Alvo

- Desenvolvedores e desenvolvedoras.
- Pessoas em transição ou evolução na carreira tech.
- Profissionais cansados de conteúdo técnico genérico.
- Leitores interessados em cultura, bastidores e reflexão crítica sobre tecnologia.
- Autores que querem publicar com mais personalidade visual e editorial.

## Estado Atual

A plataforma já possui:

- posts reais gerenciados pelo dashboard e publicados via API em runtime (SSR com cache TTL 30s);
- banco PostgreSQL como fonte de conteúdo dinâmico;
- autores e links sociais refletidos no blog;
- comentários com fluxo `draft -> OAuth -> PENDING`, moderação no dashboard e exibição pública apenas quando `APPROVED`;
- newsletter com double opt-in no backend;
- progresso de leitura sincronizado;
- busca client-side com índice embutido em `/busca`;
- RSS feed dinâmico em `/rss.xml`;
- SEO/AEO base com canonical, Open Graph, JSON-LD, sitemap dinâmico, robots.txt e llms.txt;
- headers de segurança via nginx do sistema (VPS) e via `vercel.json` (Vercel);
- deploy dual Vercel + VPS com detecção automática de adapter;
- paginação por URL em `/categorias/{slug}/pagina/{n}` para SEO de longo prazo;
- documentação operacional de cron, backup e restauração em [docs/operations.md](./operations.md);
- testes mínimos com Vitest e Playwright.

## Direção de Longo Prazo

A plataforma deve caminhar para:

- analytics editorial mais completo;
- recomendações de posts relacionados;
- cobertura de testes maior para comentários, categorias e payloads hostis;
- integrações futuras com automação e IA;
- documentação contínua para sustentar evolução do produto.

A aplicação já possui páginas individuais de post em SSR, busca, RSS, paginação por URL, CTA de newsletter, comentários moderados e deploy dual. O próximo passo é ampliar cobertura de testes, analytics e recomendações sem perder a identidade visual atual.

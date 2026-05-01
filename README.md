# Devs à Deriva

**Devs à Deriva** é uma plataforma editorial tech-driven para publicar ideias sobre engenharia de software, carreira, cultura digital e experiências pessoais no meio da tecnologia. Não é um blog genérico: a proposta combina conteúdo autoral, identidade visual futurista e uma experiência de leitura imersiva, com estética cyberpunk, interações customizadas e conteúdo já sincronizado com o dashboard.

## Propósito

O projeto nasce para ser um espaço menos polido e mais honesto sobre tecnologia. Aqui cabem textos técnicos, reflexões de carreira, cultura dev, opinião, experimentos visuais e narrativas pessoais.

A diferença está na experiência: o conteúdo não vive em um template neutro. A interface faz parte da linguagem do projeto, com animações, temas, categorias visuais e interações que reforçam a ideia de estar navegando por algo vivo, estranho e deliberadamente fora da órbita comum.

## Tech Stack

- [Astro.js](https://astro.build/) como base da aplicação.
- [Tailwind CSS](https://tailwindcss.com/) para utilitários de estilo.
- CSS escopado em componentes/páginas Astro para interações visuais específicas.
- Canvas e JavaScript nativo para experiências interativas.
- Dashboard/admin em desenvolvimento para gerenciamento de posts.
- Backend e banco de dados já fornecem posts publicados, dados do autor e progresso de leitura.
- [Vercel Analytics](https://vercel.com/analytics) integrado ao projeto.

## Funcionalidades

### Atual

- Home com experiência visual imersiva e cards abastecidos pelo dashboard.
- Cards de posts com interação, progresso de leitura em tempo real e estado de conclusão.
- Categorias editoriais.
- Páginas individuais de posts com hero, metadados, imagem de capa, navegação contextual e leitura sincronizada.
- CTA de newsletter com validação básica e animação de confirmação visual.
- Página de manifesto com crawl scroll-driven em perspectiva.
- Sistema de temas visuais.
- Páginas de erro customizadas.
- Página inicial de login/admin.
- Links sociais do autor refletidos a partir da configuração do dashboard.

### Planejado

- Dashboard/admin para criar, editar e publicar conteúdos.
- Gestão de categorias e autores.
- Comentários ou reações.
- Integrações futuras com analytics, busca e métricas editoriais.

## Estrutura do Projeto

```txt
devs-a-deriva/
├── public/              # Assets estáticos
├── src/
│   ├── components/      # Componentes Astro reutilizáveis
│   ├── layouts/         # Layouts base da aplicação
│   ├── lib/             # Utilitários e configurações compartilhadas
│   ├── pages/           # Rotas e páginas Astro
│   └── styles/          # Tokens e estilos globais
├── astro.config.mjs     # Configuração do Astro
├── tailwind.config.mjs  # Configuração do Tailwind
└── package.json         # Scripts e dependências
```

## Começando

Clone o repositório e instale as dependências:

```bash
npm install
```

Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Gere o build de produção:

```bash
npm run build
```

Visualize o build localmente:

```bash
npm run preview
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor local de desenvolvimento. |
| `npm run build` | Gera a versão estática de produção. |
| `npm run preview` | Executa um preview local do build. |

## Status

Em desenvolvimento.

## Links

- Produção: [https://www.devsaderiva.com.br/](https://www.devsaderiva.com.br/)

## Documentação

A documentação técnica e decisões de produto devem ficar centralizadas na pasta [`/docs`](./docs).

O fluxo atual de conteúdo sai do dashboard, passa pela API e alimenta a home, as páginas de post e os cards de progresso de leitura.

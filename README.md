# Devs à Deriva

> Uma experiência visual interativa construída com Astro e Tailwind CSS — onde código, arte e física se encontram no horizonte de eventos.

---

## Visão Geral

**Devs à Deriva** é um projeto web com foco em experiência visual e animações procedurais. A home page apresenta uma simulação de buraco negro com física de fluidos, trilhas de partículas e o efeito de espaghettificação aplicado tanto ao título quanto à ilustração de astronautas.

---

## Tecnologias

| Tecnologia | Versão |
|---|---|
| [Astro](https://astro.build) | ^4.16.0 |
| [Tailwind CSS](https://tailwindcss.com) | ^3.4.19 |
| Canvas API | nativa |
| Node.js | ^20+ |

---

## Estrutura do Projeto

```
devs-a-deriva/
├── public/
│   ├── astronauts.svg       # Ilustração principal
│   └── devs_a_deriva.svg    # Logo
├── src/
│   ├── components/
│   │   └── BlackHole.astro  # Animação procedural do buraco negro
│   └── pages/
│       └── index.astro      # Home page
├── astro.config.mjs
└── tailwind.config.mjs
```

---

## Funcionalidades

- **Simulação de buraco negro** — campo gravitacional com componentes orbital e de queda, renderizado em tempo real via Canvas 2D
- **Espaghettificação do título** — texto "Devs à deriva" sofre distorção física em direção ao buraco negro, caractere por caractere
- **Espaghettificação dos astronautas** — a ilustração é fatiada em 120 slices, cada um puxado em velocidade proporcional à sua posição no eixo gravitacional
- **Efeito de levitação** — animação CSS suave simulando ausência de gravidade
- **Colorshift ciano/magenta** — gradiente de cor cíclico aplicado diretamente no fill do SVG
- **Totalmente responsivo** — dimensões e posicionamentos calculados dinamicamente em relação ao viewport

---

## Instalação

```bash
# Clone o repositório
git clone git@github.com:LeandroDukievicz/devs-a-deriva.git
cd devs-a-deriva

# Instale as dependências
npm install
```

---

## Scripts

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## Branches

| Branch | Finalidade |
|---|---|
| `main` | Produção estável |
| `develop` | Desenvolvimento ativo |

Todo o desenvolvimento acontece na branch `develop`. Merges para `main` apenas em releases estáveis.

---

## Licença

MIT © [Leandro Dukievicz](https://github.com/LeandroDukievicz)

# Convenções

## Organização de Código

Diretrizes:

- páginas ficam em `src/pages`;
- componentes reutilizáveis ficam em `src/components`;
- layouts ficam em `src/layouts`;
- tokens globais ficam em `src/styles`;
- utilitários compartilhados ficam em `src/lib`.

## Nomeação

Usar nomes descritivos e consistentes.

Exemplos:

- componentes em PascalCase: `Navbar.astro`, `ErrorPage.astro`;
- classes CSS com nomes relacionados ao domínio visual;
- ids apenas quando necessários para JS ou acessibilidade;
- slugs em minúsculas e com hífen.

## Componentes

Criar componente quando:

- houver reutilização real;
- a responsabilidade visual ou funcional for clara;
- o arquivo da página estiver acumulando lógica demais;
- a interação puder ser isolada sem quebrar contexto.

Evitar componentes prematuros para blocos usados uma única vez.

## CSS

Preferir:

- tokens globais para cores;
- CSS escopado em `.astro` para interações específicas;
- Tailwind para utilitários simples;
- `transform` e `opacity` para animações.

Evitar:

- cores fixas em componentes temáveis;
- seletores globais sem necessidade;
- animações que causem layout shift;
- duplicação de estilos complexos.

## JavaScript

Usar JavaScript no cliente apenas quando necessário.

Casos válidos:

- animação baseada em scroll;
- canvas;
- controle de tema;
- interações que dependem do DOM;
- leitura/gravação de progresso local.

## Acessibilidade

Regras básicas:

- elementos clicáveis devem ser links ou botões sempre que possível;
- quando um card inteiro for clicável, usar `role`, `tabindex` e suporte a teclado;
- manter foco visível;
- imagens informativas precisam de `alt`;
- ícones decorativos devem usar `aria-hidden`;
- não depender apenas de cor para transmitir estado.

## Do's

- Usar tokens do tema.
- Manter páginas públicas rápidas.
- Escrever componentes com responsabilidade clara.
- Validar build antes de fechar alterações.
- Preservar a identidade visual do projeto.

## Don'ts

- Não introduzir framework client-side sem necessidade.
- Não transformar toda interação em estado global.
- Não criar abstrações genéricas antes da hora.
- Não quebrar temas com cores hardcoded.
- Não esconder comportamento importante atrás de animações.

# Design System

## Identidade Visual

Devs à Deriva usa uma estética futurista, espacial e cyberpunk. A interface deve parecer técnica, imersiva e levemente experimental, sem perder legibilidade.

Referências de direção:

- espaço profundo;
- terminais;
- neon;
- ficção científica;
- distorções e movimento;
- contraste alto;
- atmosferas digitais.

## Princípios de UI

- A interface deve reforçar o conteúdo, não competir com ele.
- Interações devem ter propósito.
- Animações precisam ser performáticas e legíveis.
- O visual pode ser ousado, mas a navegação deve continuar clara.
- Cards, páginas e categorias devem parecer parte do mesmo universo.

## Tipografia

Diretrizes:

- usar fontes monoespaçadas quando a intenção for reforçar a linguagem técnica;
- manter line-height confortável para textos longos;
- evitar tamanhos excessivos em blocos densos;
- preservar contraste adequado nos temas;
- títulos podem ser mais expressivos, mas o corpo precisa ser legível.

## Cores

As cores devem vir de tokens globais:

- `--color-bg`;
- `--color-star`;
- `--color-accent`;
- `--color-text`;
- variações com opacidade definidas em `tokens.css`.

Evitar cores fixas em componentes que precisam respeitar temas.

## Temas

Temas atuais:

- Órbita Baixa;
- Espaço Profundo;
- Limbo.

Todo componente visual relevante deve responder aos tokens de tema, especialmente:

- fundo;
- texto;
- bordas;
- sombras;
- scrollbar;
- estados de hover/focus.

## Layout

Direção geral:

- composição centralizada quando o foco for leitura;
- layouts mais imersivos na home e páginas editoriais;
- grids claros para categorias;
- evitar blocos visuais genéricos;
- preservar responsividade desde o início.

## Interações

Padrões esperados:

- hover com mudança de cor, brilho ou leve deslocamento;
- focus visível em elementos interativos;
- animações baseadas em `transform` e `opacity`;
- evitar animações baseadas em `top`, `left`, largura ou altura;
- respeitar performance em dispositivos modestos.

Feedbacks transitórios, como confirmações de CTA, devem esconder temporariamente o conteúdo anterior quando isso melhorar a leitura do estado animado. Quando a animação terminar, o conteúdo base deve voltar sem salto visual.

## Movimento

Movimento é parte da identidade do projeto, mas deve ser controlado.

Usar animações para:

- transições de estado;
- feedback de interação;
- experiências editoriais específicas;
- reforço de atmosfera.

Evitar animações contínuas sem necessidade.

Em CTAs inline, priorizar alinhamento tipográfico consistente entre label, texto principal e ícones. Pequenos desalinhamentos de baseline quebram a leitura mais rápido do que falta de animação.

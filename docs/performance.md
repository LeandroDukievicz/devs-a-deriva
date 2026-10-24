# Performance

## Princípios

Performance é parte da experiência editorial. A interface pode ser visualmente forte, mas não deve tornar a leitura lenta, pesada ou instável.

Diretrizes:

- carregar pouco JavaScript por padrão;
- usar Astro para renderização eficiente;
- hidratar apenas o que precisa de interação;
- priorizar `transform` e `opacity` em animações;
- evitar recalcular layout em loops;
- manter imagens otimizadas.

## Astro

Astro favorece:

- HTML estático;
- baixo custo no cliente;
- componentes sem JavaScript por padrão;
- hidratação parcial quando necessário;
- boa base para SEO.

O projeto deve preservar essas vantagens e evitar transformar páginas estáticas em aplicações client-side completas sem motivo.

## JavaScript

JavaScript no cliente deve ser pontual.

Usar para:

- canvas;
- animações de interação;
- scroll-driven effects;
- tema;
- progresso de leitura.

Evitar:

- bibliotecas pesadas para interações simples;
- listeners sem `passive` quando aplicável;
- manipulação frequente de layout;
- animações que dependem de propriedades que causam reflow.

## Listagens de Posts

A home renderiza seis artigos na grade cronológica e mantém todos os publicados na faixa do carrossel. As capas fora de exibição usam lazy loading; apenas as duas primeiras do carrossel são prioritárias. A grade não cresce durante o scroll: `/page/[n]/` entrega o próximo conjunto de seis via SSR.

O carrossel anima apenas transform e opacity, pausa quando está fora da viewport ou em aba oculta e respeita movimento reduzido. Slides fora de exibição são inertes e ficam fora da navegação por teclado. Se o catálogo crescer muito, reavaliar a quantidade de elementos na faixa antes de introduzir virtualização.

A geração de PDF ocorre no servidor somente quando solicitada. Fontes e biblioteca não entram no bundle do navegador. As imagens têm limite de bytes e pixels, timeout e concorrência de quatro; respostas bem-sucedidas permitem cache por 30 segundos.

## Imagens

Estratégia:

- usar formatos modernos quando possível;
- comprimir assets;
- definir dimensões estáveis;
- evitar imagens gigantes em cards;
- ter fallback para capas ausentes;
- usar lazy loading em listas, quando aplicável.

## Animações

Animações devem usar:

- `transform`;
- `opacity`;
- `requestAnimationFrame` para efeitos sincronizados com scroll ou canvas;
- `will-change` apenas em elementos que realmente animam.

Evitar:

- animar `width`, `height`, `top`, `left`;
- loops desnecessários;
- múltiplas animações concorrendo por atenção.

## Abertura em Vídeo

A abertura diária da home usa o MP4 versionado de 1080p apenas em telas com pelo menos 600 × 600 CSS px. Telas menores e usuários com movimento reduzido seguem direto para o conteúdo. O HTML SSR dos posts permanece pronto atrás da abertura; o vídeo não bloqueia a resposta nem a indexação da home.

- Só atribuir `src` ao vídeo quando a abertura for exibida; não solicitar MP4 nem pôster em visitas elegíveis para skip.
- Exibir o MP4 em `object-fit: contain` para preservar o título e o enquadramento em telas verticais; usar um pôster leve como fundo decorativo.
- Manter botão de pular visível durante o carregamento e a reprodução; erro de mídia deve liberar a home.
- Usar `muted` e `playsinline`, respeitar `prefers-reduced-motion` e não iniciar áudio.
- Versionar vídeo e pôster e manter cache longo; a entrega estática suporta requisições por faixa de bytes.

## SEO e AEO

O projeto deve ser preparado para busca e respostas assistidas.

Prioridades:

- títulos claros por página;
- meta descriptions;
- estrutura semântica;
- slugs legíveis;
- conteúdo textual renderizado no HTML;
- dados estruturados no futuro;
- boas descrições para imagens.

## Métricas a Observar

- Largest Contentful Paint;
- Cumulative Layout Shift;
- First Input Delay ou Interaction to Next Paint;
- peso total de JavaScript;
- tamanho e formato das imagens;
- tempo de build conforme conteúdo crescer.

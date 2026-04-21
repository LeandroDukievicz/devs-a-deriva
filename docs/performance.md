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

export interface Post {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  excerpt: string;
  content: string;
  readTime: string;
  hashtag: string;
  featured?: boolean;
}

export const posts: Post[] = [
  {
    slug: 'portas-que-nao-levam-a-lugar-nenhum',
    title: 'Portas que não levam a lugar nenhum',
    category: 'Aleatoriedades',
    categorySlug: 'aleatoriedades',
    excerpt: 'Às vezes, o caminho mais interessante é aquele que não tem destino.',
    readTime: '5 min',
    hashtag: '#devaneios',
    featured: true,
    content: `Existe uma porta nos fundos do escritório que ninguém abre. Não porque esteja trancada — a maçaneta gira, a dobradiça range, o vão existe. Mas ninguém abre.

Passei semanas observando isso antes de entender: às vezes as pessoas constroem saídas que não pretendem usar. A porta existe como promessa, não como caminho.

No código é igual. Quantas abstrações você já escreveu pra casos de uso que nunca vieram? Quantas interfaces genéricas que só têm uma implementação? A porta existe. O outro lado, não.

Tem algo de honesto em admitir que você construiu uma saída de emergência que é mais decoração do que contingência. O problema é quando você confunde as duas coisas na hora de tomar decisões.

A porta dos fundos do escritório agora tem uma planta na frente. Ninguém moveu a planta. Ninguém vai mover. E tá tudo bem — algumas portas existem pra lembrar que você poderia sair, não pra você sair de fato.

Só não confunda isso com covardia. Às vezes você escolhe ficar não porque não tem saída, mas porque o que tem aqui vale mais do que o que pode ter lá fora.

A diferença importa.`,
  },
  {
    slug: 'navegando-em-mares-que-inventei',
    title: 'Navegando em mares que inventei',
    category: 'Aleatoriedades',
    categorySlug: 'aleatoriedades',
    excerpt: 'Construo barcos de papel para cruzar oceanos imaginários.',
    readTime: '6 min',
    hashtag: '#pensamentos',
    featured: true,
    content: `Todo projeto começa como um oceano que você inventou. Você não sabe a profundidade, não tem mapa, e o barco que você tem é o que você conseguiu construir com o que sabia até ontem.

Aí você navega.

No começo parece irresponsável — partir sem saber onde vai chegar. Mas com o tempo você percebe que o oceano vai tomando forma conforme você avança nele. O mapa não existe antes da viagem. O mapa é a viagem.

O problema é que a maioria das pessoas espera o mapa pronto antes de sair do porto. E o porto fica cheio de barcos bem construídos que nunca navegaram.

Barcos de papel parecem frágeis. E são. Mas um barco de papel no oceano aprende mais sobre oceanos do que o barco perfeito que ficou na prateleira esperando condições ideais.

Condições ideais não existem. Só existem condições reais e o que você faz com elas.

Construa o barco. Entre no mar. Aprenda a nadar enquanto o barco afunda se necessário. Mas vá.`,
  },
  {
    slug: 'cartas-para-meu-eu-do-futuro',
    title: 'Cartas para meu eu do futuro',
    category: 'Aleatoriedades',
    categorySlug: 'aleatoriedades',
    excerpt: 'Se alguém encontrar isso um dia, me lembra de quem eu era.',
    readTime: '7 min',
    hashtag: '#reflexões',
    featured: false,
    content: `Eu comecei a escrever cartas para mim mesmo depois de perceber que estava esquecendo quem eu era antes de saber o que sei agora.

É uma armadilha curiosa do aprendizado: quanto mais você aprende, mais difícil fica de lembrar como era não saber. O código que parecia impossível um dia vira trivial, e junto vai embora a memória de como era estar diante do impossível.

As cartas são um arquivo contra esse esquecimento.

Não cartas do tipo "invista em bitcoin" ou "não namora fulana". Cartas que registram como eu pensava um problema antes de resolvê-lo. A lógica torta que eu usava. As perguntas que eu tinha medo de fazer porque pareciam óbvias demais.

Você pode chamar de journaling técnico. Mas pra mim é arqueologia do próprio raciocínio.

Quando leio uma carta de dois anos atrás, às vezes fico surpreso com o quão perto eu estava de uma solução sem saber. Às vezes fico surpreso com o quão longe. Mas sempre fico grato por ter guardado as evidências.

A pessoa que vai ler essa carta daqui a dois anos vai sorrir pra algumas partes. Vai franzir o cenho pra outras. E vai, espero, entender que o caminho entre um ponto e o outro não foi linha reta.

Raramente é.`,
  },
  {
    slug: 'o-estado-atual-da-ia-no-desenvolvimento',
    title: 'O estado atual da IA no desenvolvimento — sem hype',
    category: 'Tech',
    categorySlug: 'tech',
    excerpt: 'Depois de um ano usando IA no dia a dia, o que realmente mudou e o que é só ruído.',
    readTime: '8 min',
    hashtag: '#ia',
    featured: true,
    content: `Deixa eu ser direto: a IA não vai te substituir. Mas vai substituir quem não souber usá-la — e essa distinção importa mais do que parece.

Faz um ano que tenho IA integrada no meu fluxo de trabalho de verdade, não no modo "testei uma vez e achei legal". De verdade mesmo, dia a dia, produção, decisões que importam.

O que mudou:

Autocomplete ficou inteligente de verdade. Não é mais sugestão de variável — é sugestão de intenção. Você começa a digitar uma lógica e ela termina. Certo talvez 60% das vezes. 60% é muito.

Debugging melhorou. Jogar um stack trace e receber não só a causa mas contexto histórico de erros similares — isso tem valor real.

Documentação... ainda é ruim. A IA gera documentação, mas gera documentação que parece documentação. O problema é que documentação que parece documentação geralmente não serve pra nada.

O que não mudou:

Arquitetura ainda é sua. A IA não sabe o que você não sabe dizer. Se você não consegue articular o problema, ela vai articular um problema diferente do seu muito bem.

Code review ainda precisa de humano. A IA não pega o erro de negócio. Pega o erro de sintaxe, o erro de padrão, o erro óbvio. O erro que importa — o que está certo mas errado — ainda é com você.

O ruído vai diminuir. O sinal vai ficar mais claro. E o sinal é: a IA é uma ferramenta que amplifica o que você já é. Se você é bom, fica melhor mais rápido. Se você é ruim, fica ruim mais rápido também.`,
  },
  {
    slug: 'typescript-strict-mode-vale-a-pena',
    title: 'TypeScript strict mode: vale a dor de cabeça?',
    category: 'Tech',
    categorySlug: 'tech',
    excerpt: 'Habilitei strict em um projeto legado. Aqui está o que aprendi.',
    readTime: '6 min',
    hashtag: '#typescript',
    featured: true,
    content: `Sim. Vale. Mas deixa eu te dar contexto.

Habilitei strict mode em um projeto que tinha dois anos de TypeScript "relaxado". Levou três dias de correções antes de conseguir um build limpo. Foram três dias úteis, não de horas — dias.

O que apareceu:

Nulls por toda parte. O código estava cheio de "isso nunca vai ser null na prática" que eram só esperança disfarçada de certeza. O compilador não aceita esperança.

Tipos any escondidos. Você descobre quantos any implícitos você estava carregando sem saber. Cada um é uma dívida técnica com juros compostos.

Funções sem retorno declarado. Parece frescura. Não é. Quando você força o tipo de retorno, você descobre inconsistências que o runtime ia te mostrar em produção, não em desenvolvimento.

O que vale:

Depois dos três dias, o código ficou honesto. Não mais rápido, não mais bonito — honesto. O compilador passou a ser documentação viva do que o código realmente faz versus o que você achou que fazia.

A manutenção depois ficou mais fácil. Não dramaticamente — mas cada mudança passou a ter feedback imediato sobre o que ela quebra. Isso tem valor que só aparece no décimo segundo mês do projeto, não no segundo.

Se você vai começar um projeto novo, ativa strict desde o dia um. Se é legado: planeja uma semana, não um sprint.`,
  },
  {
    slug: 'mercado-tech-2024-sem-maquiagem',
    title: 'Mercado tech em 2024: sem maquiagem',
    category: 'Carreira Profissional',
    categorySlug: 'carreira',
    excerpt: 'O que realmente está acontecendo no mercado e como navegar isso.',
    readTime: '9 min',
    hashtag: '#mercado',
    featured: true,
    content: `Vou falar o que eu vejo, não o que é confortável de ouvir.

O mercado está difícil. Não "difícil" como "precisa de esforço" — difícil como "as regras mudaram e muita gente ainda não percebeu".

O que mudou de fato:

O volume de vagas sênior caiu, mas a exigência subiu. Antes, sênior era quem sabia fazer. Agora, sênior é quem sabe fazer, decide quando não fazer, e consegue explicar os dois para não-técnicos.

Fullstack virou expectativa mínima em startup, não diferencial. Especialização profunda ainda tem valor em enterprise, mas a maioria das vagas quer T-shaped.

Soft skills deixaram de ser bonus. Comunicação escrita assíncrona, gestão de expectativas, autonomia sem supervisão — isso está na mesma lista de requisitos que as stacks técnicas.

O que não mudou:

Quem resolve problemas reais ainda é contratado. O mercado está rejeitando quem sabe fazer demos, não quem entrega.

Referência ainda é o canal mais eficiente. LinkedIn frio funciona muito menos do que uma conversa com alguém que já trabalhou com você.

O que fazer:

Construa evidências, não só currículo. Um projeto real no ar vale mais do que dez certificados em tecnologias que você estudou mas não usou.

Escolha onde quer chegar e trace o caminho para trás. "Quero ser senior em dois anos" é um plano. "Quero crescer na área" não é.

O mercado está mais honesto, não mais cruel. Apenas exige que você também seja.`,
  },
  {
    slug: 'como-pedir-aumento-sendo-dev',
    title: 'Como pedir aumento sendo dev — o guia que ninguém te deu',
    category: 'Carreira Profissional',
    categorySlug: 'carreira',
    excerpt: 'A conversa mais difícil da sua carreira não precisa ser um tiro no escuro.',
    readTime: '7 min',
    hashtag: '#carreira',
    featured: false,
    content: `A maioria dos devs que pede aumento e não recebe cometeu o mesmo erro: não preparou o caso. Chegou na reunião com "acho que mereço mais" e saiu com "vamos conversar no próximo ciclo".

"Vamos conversar no próximo ciclo" é não, com prazo indeterminado.

Como preparar o caso:

Documente entregas nos últimos seis meses. Não "participei do projeto X" — "implementei a feature Y que resultou em Z mensurável". Se você não tem Z mensurável, encontre o mais próximo de Z que você tiver.

Pesquise o mercado. Glassdoor, LinkedIn Salary, conversa com pessoas do mercado. Você precisa de um número ancorado em dados, não em expectativa.

Escolha o momento. Depois de uma entrega grande. Depois de uma avaliação positiva. Não na semana em que o time está apagando incêndio.

A conversa:

Não peça. Apresente. "Nos últimos seis meses entregamos X, Y e Z. O mercado paga R$ [número] para esse perfil. Quero entender se existe caminho para chegar nesse valor aqui."

Isso é diferente de "acho que mereço mais".

Um é dado. O outro é opinião. Dado é mais difícil de negar.

Se a resposta for não: peça o que precisaria mudar para ser sim, e com qual prazo. Resposta vaga não é resposta — é adiamento.`,
  },
  {
    slug: 'dune-e-o-que-aprendi-sobre-lideranca',
    title: 'Dune e o que aprendi sobre liderança técnica',
    category: 'Livros & Leituras',
    categorySlug: 'livros',
    excerpt: 'Reli Dune e não consegui parar de pensar em arquitetura de sistemas.',
    readTime: '7 min',
    hashtag: '#livros',
    featured: true,
    content: `Eu sei que parece forçado. Mas me ouça.

Reli Dune faz três semanas e não consigo parar de pensar em um trecho específico — o momento em que Paul percebe que suas visões do futuro não são certeza, são probabilidade. Quanto mais você age baseado nelas, mais você colapsa as outras possibilidades.

Em arquitetura de sistemas isso se chama lock-in.

Toda decisão técnica é uma aposta em um futuro. Quando você escolhe a stack, o banco, o padrão arquitetural — você está colapsando possibilidades. O problema não é a escolha. É quando a escolha vira certeza antes de ser validada.

O que Herbert estava descrevendo em Arrakis é o custo da previsibilidade forçada. Paul sabe o que vai acontecer. E isso é mais prisão do que poder.

Os melhores líderes técnicos que trabalhei junto tinham algo em comum: tomavam decisões reversíveis o maior tempo possível. Não porque eram indecisos — porque entendiam que o custo de reverter uma decisão errada é muito maior do que o custo de esperar mais um sprint por informação.

Dune tem 800 páginas de consequence driven design. De como sistemas complexos se comportam quando as decisões de hoje constrangem as escolhas de amanhã.

Isso é o que boas arquiteturas evitam.

Leia Dune. Pense em microsserviços. Não é tão absurdo quanto parece.`,
  },
  {
    slug: 'playlists-que-uso-pra-codar',
    title: 'As playlists que uso pra codar — e por quê funcionam',
    category: 'Música',
    categorySlug: 'musica',
    excerpt: 'Não é qualquer música que serve. Tem ciência por trás disso.',
    readTime: '5 min',
    hashtag: '#musica',
    featured: true,
    content: `Existe um tipo específico de música que me faz codar bem e outro que me faz codar rápido. Não são a mesma coisa.

Codar bem — problemas complexos, arquitetura, debugging difícil — precisa de música sem letra, preferencialmente instrumental. Lo-fi, jazz eletrônico, post-rock. A letra compete com o monólogo interno que você usa pra pensar no problema. Música com letra vence essa disputa e você perde o fio.

Codar rápido — tarefas mecânicas, refatoração óbvia, testes repetitivos — funciona bem com qualquer coisa que te energize. Letra, batida forte, o que for. Você não está processando, está executando.

As playlists que funcionam pra mim:

Para foco profundo: álbuns do Explosions in the Sky, Boards of Canada, Jon Hopkins. Sem shuffle — a ordem importa, foi curada por alguém.

Para energia: Tame Impala, MGMT, coisas com groove constante. O objetivo é manter cadência, não inspiração.

Para transições (aquele momento entre terminar uma coisa e começar outra): silêncio. Sério. Cinco minutos sem nada antes de entrar em algo novo fazem diferença.

O que não funciona: podcast enquanto coda. Você está processando linguagem para entender o podcast E para escrever código. Um dos dois vai sair pior. Geralmente o código.

Teste isso por uma semana. Mude só a música e veja o que acontece com seu foco.`,
  },
  {
    slug: 'open-ai-o1-o-que-muda-na-pratica',
    title: 'OpenAI o1: o que muda na prática pra quem desenvolve',
    category: 'Notícias',
    categorySlug: 'noticias',
    excerpt: 'Testei por duas semanas antes de escrever. Aqui está o que é real.',
    readTime: '6 min',
    hashtag: '#openai',
    featured: true,
    content: `Passei duas semanas usando o o1 antes de escrever qualquer coisa sobre ele. Queria ter opinião, não impressão.

O que é diferente de verdade:

Raciocínio em cadeia visível. O modelo "pensa" antes de responder — e esse processo de pensamento é trackeável. Para debugging complexo e problemas de lógica, isso muda o resultado, não só a velocidade.

Matemática e algoritmos melhoraram de forma notável. Problemas que o GPT-4 resolvia pela metade agora chegam ao fim com mais consistência. Não é perfeito, mas a diferença é perceptível.

Código em linguagens menos populares melhorou. Elixir, Rust, coisas com menos presença no training data parecem se beneficiar mais do raciocínio explícito do que do padrão de completude dos modelos anteriores.

O que não mudou:

Alucinação ainda existe. Menor, mas existe. Continue validando referências externas.

Contexto longo ainda é ponto fraco. Documentos grandes, codebases complexas — o modelo ainda perde fio com mais de 50k tokens de contexto relevante.

Velocidade é menor. O raciocínio custa tempo. Para tarefas simples, GPT-4o ainda é mais prático.

O o1 não é "melhor" no sentido absoluto. É melhor em um conjunto específico de tarefas que se sobrepõem bastante com o trabalho de desenvolvimento de software. Vale o teste controlado antes de mudar seu fluxo de trabalho.`,
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug);
}

export function getPostsByCategory(categorySlug: string): Post[] {
  return posts.filter(p => p.categorySlug === categorySlug);
}

export function getFeaturedByCategory(categorySlug: string): Post[] {
  return posts.filter(p => p.categorySlug === categorySlug && p.featured);
}

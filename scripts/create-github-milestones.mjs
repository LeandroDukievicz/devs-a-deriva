#!/usr/bin/env node

/**
 * Devs a Deriva - GitHub milestone generator
 *
 * Default usage (dry run, safe):
 *   node scripts/create-github-milestones.mjs
 *
 * To create/update milestones on GitHub:
 *   GH_TOKEN=ghp_xxx node scripts/create-github-milestones.mjs --apply
 *
 * Options:
 *   --apply             Create/update milestones on GitHub (requires GH_TOKEN or GITHUB_TOKEN)
 *   --no-update         Skip milestones that already exist
 *   --repo owner/name   Override repository detection
 */

import { execFileSync } from 'node:child_process';

const OWNER_FALLBACK = 'LeandroDukievicz';
const REPO_FALLBACK  = 'devs-a-deriva';

// ── Milestone definitions ─────────────────────────────────────────────────────

const milestones = [
  // ── Etapa 1: Para ir ao ar ────────────────────────────────────────────────
  {
    title: 'AGORA 1 — Segurança imediata',
    due_on: '2026-05-12T23:59:59Z',
    body: `## Para ir ao ar

Bloqueador de produção. O site não deve ser publicado antes destes itens estarem resolvidos.

**Checklist:**
- [ ] Remover token exposto do remote Git e rotacionar o token
- [x] Corrigir XSS nos comentários — \`Comments.astro\` não usa mais \`innerHTML\` com dados externos
- [ ] Atualizar Astro, Vite, esbuild e PostCSS — rodar \`npm audit\` até não restar advisory alto/crítico
- [ ] Criar \`.env.example\` com todas as variáveis necessárias, sem valores reais

**Pronto quando:**
- [ ] \`npm audit\` não retorna vulnerabilidade alta/crítica
- [ ] Nenhum segredo fica no repositório`,
  },
  {
    title: 'AGORA 2 — Deploy e CI básico',
    due_on: '2026-05-19T23:59:59Z',
    body: `## Para ir ao ar

Necessário para publicar o blog e manter o pipeline mínimo funcionando.

**Checklist:**
- [ ] Configurar headers de segurança no host: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors — via Vercel config ou \`astro.config.mjs\`
- [ ] Criar GitHub Actions mínimo: install → typecheck → build, bloqueando merge com build quebrado
- [ ] Configurar variáveis de ambiente por ambiente (local, production) sem segredos no código
- [ ] Configurar deploy do blog na Vercel com preview por PR
- [ ] Verificar que \`PUBLIC_DASHBOARD_URL\` aponta para o backend de produção

**Pronto quando:**
- [ ] Blog sobe em produção com URL pública
- [ ] PR tem preview automático
- [ ] CI bloqueia build quebrado antes do merge`,
  },
  {
    title: 'AGORA 3 — Blog consumindo API em produção',
    due_on: '2026-05-26T23:59:59Z',
    body: `## Para ir ao ar

Conteúdo real vindo do banco em produção. Sem isso o blog vai ao ar sem posts.

**Checklist:**
- [ ] Confirmar que o adapter de conteúdo aponta corretamente para a API de produção
- [ ] Garantir fallback visual quando a API estiver indisponível
- [ ] Remover qualquer dado hardcoded ou mock que ainda apareça como fonte final de conteúdo
- [ ] Validar que posts publicados no banco aparecem no blog

**Pronto quando:**
- [ ] Blog em produção exibe posts reais vindos do banco
- [ ] Falha de API não quebra o site — exibe mensagem adequada`,
  },

  // ── Etapa 2: Pós-produção ─────────────────────────────────────────────────
  {
    title: 'DEPOIS 1 — Testes automatizados',
    due_on: '2026-06-16T23:59:59Z',
    body: `## Pós-produção

Rede mínima de testes para proteger segurança e UX crítica.

**Checklist:**
- [ ] Vitest para helpers de validação de e-mail, segurança de comentários e adapters
- [ ] Testes com payloads XSS para \`Comments.astro\`
- [ ] Playwright para home, post e categoria
- [ ] \`npm run test:ci\` agregando unit + e2e mínimo + audit
- [ ] CI rodando \`test:ci\` em PRs`,
  },
  {
    title: 'DEPOIS 2 — SEO básico',
    due_on: '2026-06-30T23:59:59Z',
    body: `## Pós-produção

Preparar o conteúdo para indexação e compartilhamento.

**Checklist:**
- [ ] Canonical URL em todas as rotas públicas
- [ ] Open Graph (title, description, image) por post e categoria
- [ ] \`sitemap.xml\` com apenas conteúdo publicado
- [ ] \`robots.txt\` coerente com produção
- [ ] JSON-LD Article para posts publicados
- [ ] Checar por último o relatório AEO: https://check.aeojs.org/scan/devsaderiva.com.br/20260506-014013`,
  },
  {
    title: 'DEPOIS 3 — Sistema de comentários completo',
    due_on: '2026-07-14T23:59:59Z',
    body: `## Pós-produção

Fechar o fluxo de comentários com autenticação, anti-spam e moderação.

**Checklist:**
- [ ] OAuth com \`state\` assinado, PKCE e \`redirectTo\` validado por allowlist
- [ ] Rate limit por IP, conta, post e janela de tempo
- [ ] Honeypot ou captcha adaptativo para comportamento suspeito
- [ ] Comentários salvos como \`pending\` por padrão — expostos publicamente apenas quando \`approved\`
- [ ] Tela de moderação no dashboard com filtros e ações em lote`,
  },
  {
    title: 'DEPOIS 4 — Observabilidade básica',
    due_on: '2026-07-28T23:59:59Z',
    body: `## Pós-produção

Visibilidade de erros e saúde do sistema.

**Checklist:**
- [ ] Captura de erros frontend com Sentry ou equivalente
- [ ] Logs estruturados no backend com \`requestId\`
- [ ] Alertas para erro 5xx e falha de OAuth
- [ ] Runbook para incidente de segurança e indisponibilidade`,
  },
  {
    title: 'DEPOIS 5 — Newsletter: tela administrativa',
    due_on: '2026-08-11T23:59:59Z',
    body: `## Pós-produção

Gestão operacional dos inscritos de newsletter.

**Checklist:**
- [ ] Tela no dashboard para listar inscritos com status, origem e data de consentimento
- [ ] Ações de supressão e descadastro manual
- [ ] Testes unitários do validador de e-mail
- [ ] Testes de integração do endpoint de inscrição`,
  },
  {
    title: 'DEPOIS 6 — Performance e acessibilidade',
    due_on: '2026-08-25T23:59:59Z',
    body: `## Pós-produção

Qualidade técnica da experiência pública.

**Checklist:**
- [ ] \`width\`/\`height\` ou \`aspect-ratio\` nas imagens principais (evitar layout shift)
- [ ] Lazy loading em imagens não críticas
- [ ] \`prefers-reduced-motion\` aplicado nas animações
- [ ] Navegação por teclado em navbar, comentários e formulários
- [ ] Contraste validado em todos os temas incluindo Limbo e páginas com canvas
- [ ] Lighthouse em home, post e categoria`,
  },
  {
    title: 'DEPOIS 7 — Polimento editorial e UX',
    due_on: '2026-09-08T23:59:59Z',
    body: `## Pós-produção

Experiência editorial completa e recursos de distribuição.

**Checklist:**
- [ ] Paginação para home e páginas de categoria
- [ ] Busca (página ou endpoint)
- [ ] Histórico de revisões de post com restauração controlada
- [ ] Gestão de categorias, autores e media assets no dashboard
- [ ] RSS/Atom para distribuição editorial`,
  },
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { apply: false, update: true, repo: null };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply')     args.apply = true;
    else if (arg === '--no-update') args.update = false;
    else if (arg === '--repo') args.repo = argv[++i];
    else if (arg === '--help' || arg === '-h') { printHelp(); process.exit(0); }
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`Uso:
  node scripts/create-github-milestones.mjs              # dry run (não altera nada)
  GH_TOKEN=ghp_xxx node scripts/create-github-milestones.mjs --apply

Opções:
  --apply           Cria/atualiza milestones no GitHub (requer GH_TOKEN ou GITHUB_TOKEN)
  --no-update       Pula milestones que já existem
  --repo owner/name Override do repositório
`);
}

function detectRepo(explicitRepo) {
  if (explicitRepo) return splitRepo(explicitRepo);
  if (process.env.GITHUB_REPOSITORY) return splitRepo(process.env.GITHUB_REPOSITORY);

  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const sanitized = remote.replace(/\/\/[^/@]+@/, '//');
    const match = sanitized.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/);
    if (match?.groups) return { owner: match.groups.owner, repo: match.groups.repo };
  } catch {}

  return { owner: OWNER_FALLBACK, repo: REPO_FALLBACK };
}

function splitRepo(value) {
  const [owner, repo] = value.split('/');
  if (!owner || !repo) throw new Error(`Repositório inválido: "${value}". Formato esperado: owner/name`);
  return { owner, repo };
}

async function githubRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'devs-a-deriva-milestone-generator',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${data?.message ?? response.statusText}`);
  return data;
}

async function applyMilestones(repo, token, update) {
  const items = await githubRequest(`/repos/${repo.owner}/${repo.repo}/milestones?state=all&per_page=100`, { token });
  const existing = new Map(items.map(item => [item.title, item]));
  const results = [];

  for (const milestone of milestones) {
    const current = existing.get(milestone.title);
    const payload = { title: milestone.title, state: 'open', description: milestone.body, due_on: milestone.due_on };

    if (!current) {
      const created = await githubRequest(`/repos/${repo.owner}/${repo.repo}/milestones`, { method: 'POST', token, body: payload });
      results.push(`criado:     ${created.title}`);
      continue;
    }

    if (!update) { results.push(`ignorado:   ${current.title}`); continue; }

    const updated = await githubRequest(`/repos/${repo.owner}/${repo.repo}/milestones/${current.number}`, { method: 'PATCH', token, body: payload });
    results.push(`atualizado: ${updated.title}`);
  }

  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = detectRepo(args.repo);

  console.log(`Repositório: ${repo.owner}/${repo.repo}`);
  console.log(`Milestones:  ${milestones.length} (${milestones.filter(m => m.title.startsWith('AGORA')).length} para produção, ${milestones.filter(m => m.title.startsWith('DEPOIS')).length} pós-produção)\n`);

  if (!args.apply) {
    for (const m of milestones) console.log(`  [ ] ${m.title} (${m.due_on.slice(0, 10)})`);
    console.log('\nDry run. Use --apply com GH_TOKEN para criar/atualizar no GitHub.');
    return;
  }

  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GH_TOKEN ou GITHUB_TOKEN é obrigatório com --apply.');

  const results = await applyMilestones(repo, token, args.update);
  console.log(results.join('\n'));
}

main().catch(err => { console.error(err.message); process.exit(1); });

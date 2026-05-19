## O que muda

<!-- Descreva o que foi alterado e por quê -->

## Tipo de mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Refactor
- [ ] Docs / config

---

## Checklist geral

- [ ] Testes passando (`npm test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Sem `console.log` ou `debugger` esquecido

---

## Checklist OWASP — preencha se o PR tocar em auth, comentários ou HTML dinâmico

> Deixe em branco se o PR não toca nenhuma dessas áreas.

### Autenticação / OAuth (A07 — Falhas de identificação)

- [ ] O parâmetro `state` do OAuth é gerado com entropia suficiente e validado no callback
- [ ] O `redirectTo` / `signInUrl` aceita apenas origens conhecidas (sem open redirect)
- [ ] Tokens de sessão têm `HttpOnly`, `Secure` e `SameSite=Lax` (ou `Strict`)
- [ ] Logout invalida o token no servidor, não só no cliente

### Comentários (A03 — Injection · A05 — Security Misconfiguration)

- [ ] Texto do comentário é inserido via `textContent` (nunca `innerHTML`)
- [ ] Nome do autor é inserido via `textContent` (nunca concatenado em HTML)
- [ ] URL de avatar passa por `sanitizeImageUrl` — só `https:` aceito
- [ ] Provider do ícone valida contra `ALLOWED_PROVIDERS` antes de qualquer `innerHTML`
- [ ] Honeypot e `elapsedMs` / `typingElapsedMs` estão presentes para mitigar bots
- [ ] Backend aplica rate limiting por IP na rota de draft de comentário
- [ ] Backend valida e sanitiza `body` antes de persistir

### HTML dinâmico / `innerHTML` (A03 — XSS)

- [ ] Cada uso de `innerHTML` insere apenas HTML estático (literal no código) ou saiu de uma allowlist
- [ ] Conteúdo de origem externa nunca é passado diretamente a `innerHTML` / `outerHTML` / `insertAdjacentHTML`
- [ ] Não há uso de `eval`, `new Function`, ou `setTimeout(string)`
- [ ] CSP do site bloqueia `unsafe-inline` para scripts (ou há nonce/hash)

### Validação de entrada (A03 — Injection)

- [ ] Inputs de usuário que chegam a queries são parametrizados (sem concatenação)
- [ ] `encodeURIComponent` usado em todos os parâmetros de URL montados dinamicamente
- [ ] Campos com `maxlength` no HTML têm o mesmo limite validado no servidor

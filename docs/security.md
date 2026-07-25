# Segurança — Devs à Deriva

Documentação das configurações de segurança aplicadas em 13/05/2026.

## Arquitetura de proteção

```
Visitante → Cloudflare (proxy + WAF + DDoS) → VPS (UFW + Caddy + Fail2ban)
```

O IP real da VPS fica oculto atrás do Cloudflare. A VPS só aceita tráfego nas portas 80/443 vindo dos IPs do Cloudflare.

---

## Cloudflare

### DNS
- Nameservers: `magdalena.ns.cloudflare.com` e `michael.ns.cloudflare.com`
- Registros A com proxy laranja (ON) para `devsaderiva.com.br`, `www` e `dashboard`
- Registros wildcard `*` apontam para IPs da Vercel (AWS AS16509) — legítimo

### SSL/TLS
- Modo: **Full (strict)** — criptografia ponta a ponta com validação do certificado de origem
- Always Use HTTPS: ON
- HSTS: ON — max-age 12 meses, include subdomains ON, preload OFF
- TLS mínimo: 1.2

### Proteção contra bots e DDoS
- **Bot Fight Mode**: ON — detecta e desafia tráfego de bots automaticamente
- **AI Labyrinth**: ON — adiciona armadilhas para bots que ignoram robots.txt
- **Hotlink Protection**: ON — impede outros sites de incorporar imagens do blog
- **DDoS L3/L4** (SSL/TLS e Network-layer): sempre ativo, gerenciado pelo Cloudflare
- **DDoS L7** (HTTP): sempre ativo, gerenciado pelo Cloudflare

### Regras de segurança

#### Custom rule — Block Bad Paths
Bloqueia requisições a paths sensíveis:
```
URI Path contains /.env
URI Path contains /.git
URI Path contains /wp-admin
URI Path contains /xmlrpc.php
Ação: Block
```

#### Rate limiting rule — Rate Limit Geral
Limita requisições por IP:
```
URI Path contains /
Limite: 100 requests / 10 segundos por IP
Ação: Block por 10 segundos
```
> Limite do plano Free — protege contra bursts rápidos.

### Under Attack Mode
Em caso de ataque DDoS severo, ativar manualmente em:
**Security → Overview → Under Attack Mode**

Coloca CAPTCHA em todo tráfego imediatamente.

---

## VPS

### Firewall (UFW)
Portas 80 e 443 só aceitam tráfego dos IPs do Cloudflare. SSH (porta 22) aberto para qualquer IP.

**IPs IPv4 do Cloudflare permitidos:**
```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

**IPs IPv6 do Cloudflare permitidos:**
```
2400:cb00::/32
2606:4700::/32
2803:f800::/32
2405:b500::/32
2405:8100::/32
2a06:98c0::/29
2c0f:f248::/32
```

Para verificar regras ativas: `ufw status verbose`

> Os IPs do Cloudflare podem mudar. Consulte a lista oficial em: https://www.cloudflare.com/ips/

### Fail2ban
Protege o SSH contra ataques de força bruta.

Configuração em `/etc/fail2ban/jail.local`:
```ini
[DEFAULT]
bantime  = 24h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
maxretry = 3
bantime  = 48h
```

- Após 3 tentativas falhas de SSH em 10 minutos → IP banido por 48h
- Verificar status: `fail2ban-client status sshd`
- Ver IPs banidos: `fail2ban-client status sshd`

### Caddy (reverse proxy)
Gerencia SSL automaticamente via Let's Encrypt. Certificados ativos para:
- `devsaderiva.com.br`
- `www.devsaderiva.com.br`
- `dashboard.devsaderiva.com.br`

Localização: `/var/lib/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/`

### Content Security Policy

O blog mantém uma CSP enforced em `nginx.conf` e `vercel.json` para bloquear enquadramento externo e restringir origens conhecidas. Como ainda existem scripts inline gerados por páginas/componentes Astro e integrações de analytics, a policy enforced preserva `script-src 'unsafe-inline'` temporariamente.

Também existe uma CSP mais restritiva em `Content-Security-Policy-Report-Only`, com `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` e `report-uri /api/csp-report`. Essa policy serve para monitorar violações antes de remover exceções da CSP enforced.

Checklist para promover report-only para enforced:
- Monitorar logs de `[csp-report]` por pelo menos 1 semana.
- Confirmar que violações esperadas são apenas scripts inline/analytics já conhecidos.
- Migrar scripts inline críticos para arquivos processados, hashes ou nonces.
- Restringir `img-src` para o domínio definitivo de assets R2 quando ele estiver fixado.
- Trocar a policy restritiva para `Content-Security-Policy` apenas depois de páginas de home, posts, categorias, comentários, newsletter e busca abrirem sem violações inesperadas.

### Validação de paginação e PHP shell

O blog roda em Astro/Node, sem runtime PHP na aplicação. Parâmetros como `?page=` não são usados para montar caminhos de arquivo, incluir código, importar módulos ou executar templates; eles alimentam apenas a paginação de listas.

Para evitar falso positivo de scanners e reduzir risco de configuração incorreta, a API `/api/posts.json` valida `page` e `limit` como inteiros positivos estritos. Valores ausentes usam fallback seguro, mas valores sintaticamente inválidos retornam `400`, incluindo payloads como `1.php`, `../../etc/passwd`, URL remota ou trechos `<?php ... ?>`.

As rotas HTML paginadas (`/page/[n]` e `/categorias/[categoria]/pagina/[n]`) usam a mesma validação estrita antes de calcular a página. No Nginx, também há bloqueio explícito para `/node_modules/` e para extensões `.php`, `.phtml` e `.phar`, de modo que arquivos PHP não sejam expostos caso uma dependência traga esse tipo de artefato.

Cobertura automatizada:
- `tests/post-listing.test.ts` valida o parser estrito.
- `tests/posts-api.test.ts` valida que payloads PHP/LFI/RFI em `page` retornam `400`.
- `tests/security.test.ts` valida a presença dos bloqueios de Nginx.

---

## Checklist de manutenção

| Tarefa | Frequência |
|--------|-----------|
| Verificar IPs do Cloudflare atualizados | A cada 6 meses |
| Checar certificados Caddy | Automático (renovação automática) |
| Revisar logs do Fail2ban | Mensal |
| Revisar eventos WAF no Cloudflare | Mensal |
| Checar status UFW | `ufw status verbose` |
| Checar status Fail2ban | `fail2ban-client status sshd` |

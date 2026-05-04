# Newsletter e Privacidade

## Escopo

A captação de newsletter acontece no blog público, dentro das páginas de post. O backend responsável por validar, persistir e confirmar inscrições fica no projeto `dashboard-ldstudio`.

Fluxo atual:

```txt
Usuário informa e-mail no post
        ↓
Blog valida apenas para UX
        ↓
Blog envia POST para PUBLIC_DASHBOARD_URL/api/newsletter/subscribe
        ↓
Dashboard valida no servidor
        ↓
Dashboard salva lead como PENDING
        ↓
Dashboard envia e-mail de confirmação
        ↓
Usuário confirma
        ↓
Lead vira ACTIVE
```

## Dados Coletados

O fluxo de newsletter coleta e processa:

- e-mail informado;
- versão normalizada do e-mail para deduplicação;
- origem da inscrição, como `post_newsletter`;
- slug do post;
- URL da página de origem, quando pertence ao domínio do blog;
- texto de consentimento apresentado no momento da inscrição;
- data/hora do consentimento;
- status da inscrição;
- tokens hasheados de confirmação e descadastro;
- hash de IP para rate limit e abuso;
- sinais anti-bot enviados pelo formulário, como honeypot e tempo de preenchimento.

## Minimização e Proteção

O backend não deve persistir e-mail em texto puro.

No estado atual, o dashboard salva:

- hash do e-mail normalizado para unicidade e busca;
- e-mail original criptografado;
- e-mail normalizado criptografado;
- hash de IP para rate limit, sem armazenar IP bruto;
- tokens de confirmação e descadastro apenas em formato hasheado.

Logs não devem imprimir e-mail bruto, tokens ou IP bruto.

## Consentimento

O formulário exige consentimento explícito antes do envio:

```txt
Autorizo o uso deste e-mail para receber a newsletter e sei que posso solicitar exclusão a qualquer momento.
```

O texto do consentimento é enviado ao backend e persistido junto ao lead. Mudanças futuras nesse texto devem ser tratadas como nova versão de consentimento.

## Double Opt-In

Uma inscrição nova não vira ativa imediatamente.

Estados relevantes:

- `PENDING`: e-mail recebido, aguardando confirmação;
- `ACTIVE`: e-mail confirmado pelo usuário;
- `UNSUBSCRIBED`: usuário descadastrado;
- `BOUNCED`: reservado para falha de entrega;
- `SUPPRESSED`: reservado para bloqueio administrativo ou compliance.

O envio de newsletter futura deve considerar apenas contatos `ACTIVE`.

## Resposta Anti-Enumeração

O endpoint público de inscrição não deve revelar se um e-mail é novo, duplicado, pendente, descadastrado ou rejeitado por validação não crítica.

A resposta pública deve permanecer genérica.

## Descadastro

O backend expõe endpoint de descadastro com token próprio. O token público não deve ser salvo em texto puro; apenas seu hash deve ser persistido.

O descadastro deve mudar o status para `UNSUBSCRIBED` e registrar `unsubscribedAt`.

## Exclusão e LGPD

Solicitações de exclusão devem localizar o lead por e-mail normalizado, usando hash derivado da mesma normalização do backend.

Política recomendada:

- remover ou anonimizar dados pessoais criptografados;
- preservar registros mínimos de supressão quando necessário para evitar reimportação indevida;
- não manter IP bruto;
- manter apenas hashes e metadados indispensáveis para auditoria e segurança.

## Pendências

- Criar tela real no dashboard para listar inscritos, status, origem e data de consentimento.
- Criar ação administrativa segura para descadastro/supressão.
- Criar testes unitários do validador.
- Criar testes de integração para inscrição, duplicidade, rate limit, honeypot, confirmação e descadastro.
- Definir prazo formal de retenção para leads `PENDING` expirados.

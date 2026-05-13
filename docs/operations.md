# Operação

## Escopo

Este repositório contém o blog público estático em Astro. As rotinas agendadas, backups e tarefas de manutenção que envolvem dados dinâmicos devem viver no `dashboard-ldstudio` ou no VPS que hospeda o backend.

Em termos práticos:

- o blog público não precisa de `cron` para publicar conteúdo;
- o dashboard/backend pode usar `cron`, `systemd timers` ou o agendador do provedor;
- o banco PostgreSQL precisa de backup recorrente;
- as APIs não são "backupadas" por si só, mas os dados que elas expõem e persistem precisam ser protegidos;
- código e configuração do backend continuam versionados no repositório do dashboard.

## O Que Deve Rodar Em Cron

Os jobs abaixo fazem sentido para a camada dinâmica:

- backup do PostgreSQL;
- limpeza de backups antigos;
- healthcheck interno do backend;
- sincronização ou reconciliação de jobs pendentes;
- envio de filas pendentes, se existirem;
- geração de relatórios ou métricas periódicas;
- tarefas de manutenção como `VACUUM`, `ANALYZE` ou refresh de views materializadas, quando aplicável.

O blog estático não deve depender de cron para renderização pública.

## Backup Do Banco

O mínimo esperado é um backup diário do PostgreSQL, com retenção definida e restauração testada.

Fluxo recomendado:

1. gerar dump do banco com `pg_dump`;
2. comprimir o arquivo;
3. armazenar em local seguro fora do diretório ativo;
4. enviar para um destino externo ou volume separado;
5. manter retenção curta para backups diários e retenção maior para backups semanais;
6. validar periodicamente a restauração em ambiente de teste.

Exemplo de política simples:

- backups diários: 7 dias;
- backups semanais: 4 semanas;
- backups mensais: 3 meses, se o volume justificar.

O dump deve incluir somente o necessário para reconstruir os dados. Segredos, tokens e arquivos de ambiente não entram no banco nem no backup do banco.

## O Que Fazer Com As APIs

As APIs do dashboard não costumam ser "backupadas" como arquivos. O que precisa ser protegido é o que elas armazenam e processam:

- tabelas PostgreSQL;
- assets persistidos fora do repositório;
- filas ou jobs pendentes;
- arquivos gerados por processo de ingestão;
- configurações de integração necessárias para o backend continuar operando.

Se a API produzir artefatos derivados, o ideal é reconstituí-los a partir do banco e do código versionado, não salvar o endpoint em si.

## Restauracao

Uma restauração segura deve seguir esta ordem:

1. parar escrita no backend;
2. restaurar o dump em um banco limpo ou em um clone isolado;
3. aplicar migrations necessárias;
4. validar contagem básica de registros e integridade referencial;
5. rodar smoke test da API e do blog;
6. só então reativar o tráfego.

Se o backup falhar ou a restauração não for testada, o backup não deve ser considerado confiável.

## Onde Documentar O Cron

Se o cron for implementado no VPS, a documentação operacional deve ficar ao lado do deploy e da restauração:

- este arquivo para visão geral;
- `docs/database.md` para detalhes de PostgreSQL e migrations;
- `docs/ci-cd.md` para deploy, smoke e rollback;
- o repositório `dashboard-ldstudio` para os scripts reais de backup e manutenção.

## Estado Atual

Hoje este repositório não contém scripts de `cron` nem de backup automático. A documentação acima serve como contrato operacional para a camada dinâmica e para o VPS.

## Próximo Passo Recomendado

Quando for implementar de fato, crie no dashboard/backend:

- `scripts/backup-db.sh` ou equivalente;
- `scripts/restore-db.sh`;
- um `systemd timer` ou `cron.d` dedicado;
- uma rotina de log com saída por execução;
- um restore testado em ambiente de staging.

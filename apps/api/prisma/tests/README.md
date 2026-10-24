# Integridade do banco

Execute `pnpm db:test:integrity` na raiz. Requer Docker e a imagem
`postgres:16-alpine` (baixada pelo Docker se necessário). O teste cria um
container sem portas publicadas nem volumes, aplica todo o histórico de
migrations, insere dados antes da migration de integridade e verifica backfills,
constraints e triggers usando SQL real. O container é removido ao terminar.
O comando não lê `DATABASE_URL` nem acessa o banco da aplicação.

A migration `20261020120000_enforce_domain_integrity` é transacional. Dados já
inconsistentes fazem a migration falhar e reverter suas alterações; ela não
exclui duplicatas nem ajusta saldos automaticamente. Corrija os registros
indicados pelo PostgreSQL antes de reaplicar. As alterações de FK e criação de
índices exigem locks: aplique em uma janela adequada ao volume do banco.

`NULLS NOT DISTINCT`, o índice parcial de alertas e os triggers são mantidos em
SQL porque não são representados pelo Prisma 5.22. Use migrations, não `db push`,
e preserve essas regras ao revisar SQL gerado no futuro.

Alertas `OPEN` e `ACKNOWLEDGED` compartilham a unicidade de `dedup_key`.
`RESOLVED` e `SUPPRESSED` liberam a chave. O escritor de falhas de Saga usa
`INSERT ... ON CONFLICT` com o predicado do índice parcial para consolidar
reentregas no alerta ativo. Escritores futuros também precisam preservar essa
regra; um índice comum não substitui essa proteção.

A auditoria grava `actor_id` sem FK e `actor_email` como snapshot. O backfill usa
o e-mail atual dos usuários existentes; não pode reconstruir e-mails antigos
ou IDs já apagados por `SET NULL`. Reentregas usam `INSERT ... ON CONFLICT DO
NOTHING`, preservando o registro original. Buscas por e-mail usam o snapshot.

Os triggers bloqueiam `UPDATE`, `DELETE` e `TRUNCATE` em `audit_logs` e
`audit_log_changes`. O runtime deve usar um papel separado do proprietário das
tabelas, com apenas `SELECT`/`INSERT` nessas tabelas e `USAGE` na sequência.
A migration revoga permissões de mutação de `PUBLIC`; grants diretos a papéis
existentes precisam ser administrados pela configuração do ambiente. Um
proprietário ou superusuário pode desabilitar triggers, portanto isso não é uma
proteção contra administradores do banco.

Esta etapa cobre os itens 1–5 da revisão. Reservas por item de transação,
unificação dos campos de Product e conversão para timestamptz são evoluções
separadas: exigem migrar os contratos e fluxos consumidores correspondentes.

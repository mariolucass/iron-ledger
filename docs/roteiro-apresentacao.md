# Roteiro de apresentação — Iron Ledger

Duração sugerida: 12–15 minutos. Tudo abaixo foi ensaiado pela URL pública (funnel).

## Antes de começar (15 min antes)

1. `WEB_PORT=3002 DEMO_TTL_MIN=90 pnpm demo:funnel` (ajuste o tempo para cobrir a apresentação).
   - Use 3002 se a 3001 estiver ocupada por um `next dev`.
2. Confirme que o Temporal e o worker estão de pé: a página **Sistema → Plataforma** deve mostrar "7 de 7 operando" e "Workers ativos: 1".
3. Rode `pnpm demo:check` (~10 s): deve terminar com "Demo pronta". Cada item vermelho traz a ação corretiva. Ele cria e libera uma reserva de 1 un. na Jaqueta e cria (uma vez) o usuário `demo-check@example.com`, sem papéis.
4. Abra a URL do funnel no navegador e entre com a conta admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` do `.env`).
5. Deixe o PC sem suspender. Tenha uma aba em `localhost` como plano B.

## Telas com dados reais (mostre à vontade)

Dashboard (atualiza a cada 15 s: saldos, transações, alertas e itens abaixo do mínimo), Estoque, Transações, Alertas, Auditoria, Produtos, Armazéns, Usuários, Plataforma.

## Telas com dados de demonstração (avise antes de abrir)

- **Relatórios**: gráfico e arquivos fictícios (selo na tela).
- **Previsões**: a parte "Previsão dos seus produtos" está marcada "Em integração"; a validação usa dados da Olist (média móvel, ainda sem ARIMA).
- **Analytics**: laboratório com dados públicos da Olist, não do seu estoque.

## Roteiro

### 1. Contexto (1 min)
Sistema de operações de estoque com auditoria imutável e transações distribuídas com compensação (saga).
Arquitetura: Next.js (BFF) → API Express → PostgreSQL; eventos via RabbitMQ (outbox) → auditoria; Temporal executa as sagas.

### 1b. Dashboard (30 s) — `/dashboard`
Tela inicial após o login, com dados reais da API: 5 saldos, transações recentes (status ao vivo) e os 2 produtos abaixo do mínimo (Jaqueta e Camiseta). Use-a como gancho para o Estoque.

### 2. Plataforma (1 min) — `/system`
Mostre os serviços operando: PostgreSQL, Event bus, RabbitMQ, Outbox, Temporal (1 worker), Kafka (opcional), Analytics.
Fala: "isto é a saúde real da infraestrutura, consultada ao vivo".

### 3. Cadastros (1 min) — `/products` e `/warehouses`
Mostre os 5 produtos e os 3 armazéns. Mencione importação de produtos por CSV/Excel.

### 4. Estoque e movimento (2 min) — `/inventory`
1. Mostre os saldos. A Jaqueta (3 un, mínimo 8) e a Camiseta (10 un, mínimo 15) aparecem como "Baixo".
2. Clique em **Novo movimento**, deixe tipo **Entrada**, quantidade 1, produto Calça Jeans (SKU-1092-D), e clique em **Registrar**.
3. Volta para o Estoque e o saldo sobe em 1.

### 5. Transação com sucesso (2 min) — `/transactions`
1. **Nova transação** (é uma transação de saída): Calça Jeans, quantidade 1, deixe "Simular falha na confirmação" desligado e clique em **Iniciar Saga**.
2. A tela abre o detalhe e o status passa de Processando para Concluída em poucos segundos.
3. Na linha do tempo: "Reservar estoque" e "Confirmar baixa" concluídos.

### 6. Saga com compensação (2 min)
1. **Nova transação** com **Simular falha na confirmação** ligado e **Iniciar Saga**.
2. Resultado: **Compensada** (~5 s). Na linha do tempo: "Confirmar baixa" falha, "Reconciliar reserva" e "Liberar reserva" (compensação) concluem.
3. Abra o **Temporal UI** (`http://localhost:8088`, namespace `default`): o workflow tem o mesmo id da transação e mostra as atividades e a compensação.
4. Fala: "a saga desfez o que tinha feito; o saldo voltou ao normal".

### 7. Auditoria (1 min) — `/audit-log`
Mostre os eventos recém-gerados: `Inventory.StockReserved`, `Inventory.StockReleased`, `Transaction.TransactionCompensated`.
Fala: "a auditoria é append-only; esses registros vêm do RabbitMQ, não do clique".

### 7b. Concorrência: duas reservas simultâneas, só uma vence (2 min)
No terminal: `pnpm demo:race` (usa a Jaqueta: 3 un., duas reservas de 2 un. ao mesmo tempo, 5 rodadas).
- Saída esperada: em cada rodada uma reserva `✓201` e outra `✗409`; no fim "Sem overselling" e saldo igual ao inicial.
- Explicação de 1 minuto: o saldo (`StockLevel`) tem uma coluna `version`. A atualização só vale se a versão ainda for a lida (`updateMany where id e version`). Quem perde recebe 409 (`CONCURRENT_OPERATION` ou `INSUFFICIENT_STOCK`) e pode tentar de novo. Escolhemos bloqueio otimista porque conflito é raro e não segura linha no banco.
- Ensaiado 10 vezes (5 pela URL pública e 5 direto na API): 10/10 sem overselling.

### 8. Alerta de falha de saga (2 min) — `/alerts`
Este é o único alerta real hoje: falha terminal de saga. A compensação **não** gera alerta.
Para gerar um alerta ao vivo (ensaiado):

1. No terminal: `docker compose --profile platform stop temporal`
2. Crie uma **Nova transação** normal. A tela pode mostrar "API indisponível" (o BFF desiste em 8 s); a transação é gravada como `FAILED` mesmo assim.
3. Em `/alerts` (atualiza a cada 15 s ou em **Atualizar**) aparece "Falha na transação TXN-…" como crítico.
4. **Reconheça** e depois **resolva** o alerta.
5. Volte o serviço: `docker compose --profile platform start temporal` e espere ficar `healthy` (~20 s). Confirme em `/system` ("Workers ativos: 1") antes de qualquer nova transação.

Se não quiser fazer isso ao vivo, mostre os alertas já resolvidos na lista e explique a regra.

### 8b. Analytics (Olist) (2 min) — `/analytics`
O serviço Python precisa estar no ar (porta 8000).
- O que é um ponto de inflexão: uma mudança persistente (3 semanas) no nível de vendas, cancelamentos, atraso ou avaliação de um vendedor/categoria, comparando a mediana das 8 semanas anteriores com a das 3 seguintes.
- Mostre os cartões (45.733 observações, 1.360 pontos de inflexão), filtre por severidade (por ex. "Ver só o que piorou") e abra um sinal para ver a série temporal.
- Limitações (diga você antes que perguntem): é processamento em lote, com dados públicos da Olist; não é alerta do estoque real.

### 9. Fechamento (1 min) — limites e próximos passos
- Notificações por e-mail/Slack ainda não existem; falta alerta de estoque baixo e de analytics.
- Previsão de demanda: hoje só valida o método com dados da Olist.
- Dashboard e Relatórios ainda são protótipos de interface.

## Cuidados com a máquina
- Feche o `next dev` da porta 3001 se não for usar: ele estava com ~2 GB de RAM e 80% de CPU, e a máquina fica lenta (o navegador de teste chegou a travar por isso).

## Plano B
- Funnel fora do ar: rode a mesma demo em `localhost` e mostre pelo notebook.
- Transação travada em `PROCESSING`: verifique o worker (`/system`) e se o Temporal está `healthy`.

## Ao terminar
`Ctrl+C` no terminal da demo desliga o funnel e os serviços. Confira com
`"/mnt/c/Program Files/Tailscale/tailscale.exe" funnel status` (deve mostrar "No serve config").

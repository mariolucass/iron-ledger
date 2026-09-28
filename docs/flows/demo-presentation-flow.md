# Roteiro da Demonstração: Do Login à Consulta Analítica

## 1. Identidade e Autenticação
- **Ação:** O utilizador acessa a interface web e insere as suas credenciais.
- **Módulo:** O frontend em `apps/web/` envia a requisição para `apps/api/`.
- **Resultado:** A API valida as credenciais, aplica o controle de acesso (RBAC) e emite um token JWT.

## 2. Início da Transação e Reserva
- **Ação:** O utilizador solicita a reserva de um item de estoque.
- **Módulo:** Endpoint `POST /inventory/transactions` em `apps/api/`.
- **Resultado:** A API utiliza o Prisma (`apps/api/prisma/`) para persistir a reserva no PostgreSQL. A concorrência simultânea é tratada utilizando *optimistic locking* através da validação da `version` na entidade `STOCK_LEVEL`.

## 3. Orquestração e Mensageria
- **Ação:** Garantia de consistência da transação distribuída.
- **Módulo:** Mensageria via `packages/event-bus/` e orquestração em `apps/temporal-worker/`.
- **Resultado:** Após a reserva, o sistema publica um evento no RabbitMQ. O *worker* do Temporal.io escuta esse evento e inicia um **Workflow Saga** assíncrono. Em caso de falha de validação nas etapas seguintes, o fluxo entra em compensação automática.

## 4. Auditoria Imutável
- **Ação:** Registro de rastreabilidade (Append-only).
- **Módulo:** `apps/api/` (AuditConsumer) e Kafka.
- **Resultado:** O evento de domínio aciona a inserção de um registro na tabela `AUDIT_LOG` no PostgreSQL, capturando as cargas *before*, *after* e *diff*. Em seguida, o `KafkaRelay` replica esse log para os tópicos do Kafka.

## 5. Consulta Analítica
- **Ação:** Análise dos dados e logs em tempo real.
- **Módulo:** Serviço Python isolado em `services/analytics/`.
- **Resultado:** O microsserviço atua como consumidor do Kafka, lendo os dados do streaming analítico oriundos do log de auditoria, concluindo assim o fluxo de ponta a ponta da demonstração.

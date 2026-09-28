# Roteiro da Demonstração: Do Login à Consulta Analítica

Este documento descreve o fluxo passo a passo que será apresentado na demonstração oficial do projeto **iron-ledger**, mapeando cada etapa aos seus respectivos módulos.

## 1. Identidade e Autenticação (Identity Context)
- **Ação:** O usuário acessa a interface web e insere as suas credenciais.

- **Módulo:** O frontend em `apps/web/` envia a requisição para a API em `apps/api/`.

- **Resultado:** A API valida as credenciais, aplica o controle de acesso (RBAC) e emite um token JWT.

## 2. Início da Transação e Reserva (Inventory Context)
- **Ação:** O usuário solicita a reserva de um item de estoque.

- **Módulo:** Endpoint `POST /inventory/transactions` em `apps/api/`.

- **Resultado:** A API utiliza o Prisma (`apps/api/prisma/`) para persistir a reserva no PostgreSQL. A concorrência simultânea é tratada utilizando *optimistic locking* através da validação da `version` na entidade `STOCK_LEVEL`.

## 3. Orquestração e Mensageria (Transaction Context)
- **Ação:** Garantia de consistência da transação distribuída.

- **Módulo:** Mensageria via `packages/event-bus/` e orquestração em `apps/temporal-worker/`.

- **Resultado:** Após a reserva, o sistema publica um evento no RabbitMQ. O *worker* do Temporal.io escuta esse evento e inicia um **Workflow Saga** assíncrono. Em caso de falha de validação nas etapas seguintes, o fluxo entra em compensação automática.

## 4. Auditoria Imutável (Audit Context)
- **Ação:** Registro de rastreabilidade (Append-only).

- **Módulo:** `apps/api/` (AuditConsumer) e Kafka.

- **Resultado:** O evento de domínio aciona a inserção de um registro na tabela `AUDIT_LOG` no PostgreSQL, capturando as cargas *before*, *after* e *diff*. Em seguida, o `KafkaRelay` replica esse log para os tópicos do Kafka.

## 5. Consulta Analítica (Analytics Context)
- **Ação:** Análise dos dados e logs em tempo real.

- **Módulo:** Serviço Python isolado em `services/analytics/`.

- **Resultado:** O microsserviço atua como consumidor do Kafka, lendo os dados do streaming analítico oriundos do log de auditoria, concluindo assim o fluxo de ponta a ponta da demonstração.

## 6. Mapeamento de Endpoints e Eventos

Durante a demonstração, os seguintes pontos de comunicação serão utilizados para integrar os *Bounded Contexts*:

### Endpoints da API (HTTP)
| Método | Endpoint | Ação / Responsabilidade |
| :--- | :--- | :--- |
| **POST** | `/auth/login` *(ou rota de autenticação equivalente)* | Validação de credenciais e emissão do token JWT na etapa de Identity. |
| **POST** | `/inventory/transactions` | Ponto de entrada principal da demonstração. Valida as regras de negócio, aplica a reserva e inicia a orquestração. |

### Eventos de Domínio (Mensageria)
| Evento | Broker | Publicador | Consumidores |
| :--- | :--- | :--- | :--- |
| `StockReserved` | RabbitMQ / Kafka | `InventoryService` | Inicia o Workflow Saga no Temporal e é gravado pelo `AuditConsumer`. |
| `StockCommitted` | RabbitMQ / Kafka | *Temporal Worker* | Conclui a transação, gera o log *append-only* e é transmitido ao *Analytics* via `KafkaRelay`. |

## 7. Massa de Dados da Demonstração (Seed Data)

Para que a demonstração técnica funcione e os testes de resiliência sejam acionados ao vivo, o banco de dados PostgreSQL deve ser previamente populado (através do *seed* do Prisma) com os seguintes dados:

### 7.1. Usuários de Teste (Identity / RBAC)
Para testar os acessos e a concorrência (duas pessoas tentando comprar ao mesmo tempo), precisamos de usuários pré-registrados com as devidas permissões RBAC:
- **Comprador A:** Email: `comprador_a@demo.com` | Role: `USER`

- **Comprador B:** Email: `comprador_b@demo.com` | Role: `USER`

### 7.2. Tabela de Estoque (STOCK_LEVEL)
Para demonstrar o *optimistic locking* (prevenção de condições de corrida), devemos ter um produto com apenas 1 unidade disponível. É imperativo que o campo de versionamento esteja definido:
- **ID do Produto / SKU:** `PROD-IRON-001` (Ex: "Console de Edição Limitada")

- **Quantidade Inicial:** `1`

- **Campo `version`:** `1` (Este é o campo crucial na entidade `STOCK_LEVEL` que o sistema verificará para barrar a requisição do Comprador B após o Comprador A efetuar a reserva).

### 7.3. Tabela de Log (COMPENSATION_LOG e AUDIT_LOG)
- Estas tabelas (`COMPENSATION_LOG` e `AUDIT_LOG`) devem começar **vazias**. O objetivo da demonstração é mostrar estes registros sendo criados (estado *before*, *after* e *diff*) à medida que os eventos acontecem.

## 8. Responsabilidades da Equipe (Coreografia da Demonstração)

A apresentação técnica será dividida entre os três desenvolvedores do grupo para garantir fluidez e demonstrar domínio sobre as diferentes camadas do sistema distribuído.

### Desenvolvedor 1: Mário Lucas de Almeida Silva
**Foco:** Infraestrutura Inicial, Identidade e Frontend.
*   **Abertura:** Explicar a proposta *backend-first* do iron-ledger e os desafios que ele resolve.

*   **Operação:** Mostrar os containers subindo no Docker (`docker compose up -d`) e rodar o *seed* no Prisma.

*   **Ação:** Executar o login na interface web (Next.js) e explicar rapidamente o contexto de *Identity* e validação de token JWT.

### Desenvolvedor 2: Luiz Felipe Carvalho Menezes
**Foco:** Inventário, Concorrência e Orquestração (Temporal.io).
*   **Ação (Race Condition):** Simular o cenário de concorrência ao vivo (usando a interface ou uma ferramenta como Insomnia/Postman), disparando duas requisições de compra simultâneas para o item com apenas 1 unidade no estoque.

*   **Explicação:** Mostrar no código/terminal como o *optimistic locking* (campo `version`) bloqueou a segunda requisição, prevenindo o *overselling*.

*   **Ação (Falha/Compensação):** Forçar um erro de validação na transação e abrir o painel do Temporal.io (na porta `:8088`) para mostrar o *Workflow Saga* realizando a compensação automática (desfazendo a reserva).

### Desenvolvedor 3: Pedro Ygor Beserra Pereira
**Foco:** Mensageria, Auditoria Imutável e Analytics.
*   **Ação:** Após as transações do Luiz, Pedro abrirá o cliente de banco de dados (ex: DBeaver ou o Prisma Studio) para consultar as tabelas `AUDIT_LOG` e `COMPENSATION_LOG`.

*   **Explicação:** Mostrar que o log é *append-only* (imutável), provando a rastreabilidade ao exibir os payloads *before*, *after* e *diff* gerados pelos eventos `StockReserved` e `StockCommitted`.

*   **Fechamento:** Mostrar o terminal do serviço Python isolado consumindo os logs que foram replicados via Kafka, fechando o fluxo do *Analytics Context*.

## 9. Plano de Contingência (Gestão de Bloqueios)

Dado que o objetivo principal do **iron-ledger** é demonstrar a resiliência arquitetural e a consistência de dados em um ambiente *backend-first*, eventuais instabilidades em camadas secundárias ou funcionalidades incompletas não bloquearão a apresentação. A equipe definiu as seguintes salvaguardas:

*   **Falha no Frontend (Next.js):** Se a interface gráfica (`apps/web/`) apresentar algum erro de renderização ou lentidão, a equipe transitará imediatamente para o **Insomnia ou Postman**. Uma coleção com as requisições de autenticação e de transação estará previamente configurada e aberta para demonstrar a API funcionando de forma isolada.

*   **Problemas no Serviço Analítico (Python):** Caso o consumidor Kafka em `services/analytics/` sofra alguma falha de execução, a prova da rastreabilidade se manterá focada no banco de dados. A equipe demonstrará os dados entrando diretamente na tabela `AUDIT_LOG` no PostgreSQL utilizando o Prisma Studio ou um cliente de banco de dados.

*   **Gestão de Escopo:** Se os avaliadores questionarem sobre funcionalidades fora do roteiro (ex: telas de registro de usuário, edição de perfil), a equipe esclarecerá que o escopo desta *Sprint* e do projeto incide sobre a engenharia de transações distribuídas (Saga), a resolução de *race conditions* e a auditoria imutável (*append-only*), pelo que a ausência de fluxos CRUD secundários é intencional.

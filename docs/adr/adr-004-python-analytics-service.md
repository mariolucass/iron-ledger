# ADR-004: Serviço de analytics em Python, isolado via mensageria

- **Status:** Aceita
- **Contexto:** `analytics`

## Contexto

Relatórios e análise de estoque/transações se beneficiam do ecossistema de dados do Python, e não devem
competir por recursos com o caminho transacional da API.

## Decisão

Um serviço Python independente (`services/analytics`) que **apenas consome Kafka** e expõe seus próprios
resultados. Não acessa o banco transacional nem importa código da API.

## Consequências

- (+) Falha ou lentidão do analytics não afeta reservas nem Sagas; escala de forma independente.
- (+) Contrato único e explícito: os eventos em `packages/shared-types`.
- (−) Consistência eventual: os relatórios podem estar alguns instantes atrás da operação.

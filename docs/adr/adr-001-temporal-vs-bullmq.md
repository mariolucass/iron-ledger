# ADR-001: Temporal.io em vez de BullMQ para orquestração de transações

- **Status:** Aceita
- **Contexto:** `transaction`, `inventory`

## Contexto

Uma transação de estoque atravessa várias etapas (reservar, confirmar externamente, efetivar) e precisa ser
desfeita de forma consistente se qualquer uma falhar. Isso é uma **Saga** de longa duração, que deve sobreviver
a reinícios de processo e ter o histórico de cada passo inspecionável.

## Decisão

Usar **Temporal.io** para orquestrar as Sagas. Cada passo é uma *activity* e a compensação é parte do próprio workflow.

## Alternativas consideradas

| Opção | Por que não |
| --- | --- |
| **BullMQ** | É uma fila de jobs, não um motor de workflow. Estado da Saga, retries por etapa, timeouts e compensação teriam de ser reimplementados à mão sobre Redis. |
| **Saga coreografada (só eventos)** | Sem ponto central, fica difícil responder "em que passo esta transação está?" e raciocinar sobre a ordem das compensações. |

## Consequências

- (+) Estado durável e *replay* determinístico: um worker que cai retoma de onde parou.
- (+) Compensação explícita no código do workflow e histórico visível na Temporal UI (`:8088`).
- (−) Mais uma peça de infraestrutura (server + worker) e a restrição de workflows determinísticos.

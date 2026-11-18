# ADR-002: RabbitMQ para eventos de domínio, Kafka para o log de auditoria

- **Status:** Aceita
- **Contexto:** `audit`, `analytics`, mensageria

## Contexto

O sistema tem dois padrões de tráfego diferentes: (1) eventos de domínio que disparam reações imediatas
(iniciar Saga, gravar auditoria) e (2) um fluxo ordenado e retido de registros de auditoria para análise.

## Decisão

- **RabbitMQ** transporta os *DomainEvents* (`StockReserved`, `StockUpdated`, ...) entre módulos.
- **Kafka** transporta o log de auditoria (via `KafkaRelay`) para consumidores analíticos.

## Consequências

- (+) Cada broker faz o que faz melhor: roteamento/ack no RabbitMQ; retenção, ordem por partição e *replay* no Kafka.
- (+) O serviço de analytics relê o histórico sem afetar o caminho transacional.
- (−) Dois brokers para operar. Mitigação: o `EventBus` em `packages/event-bus` esconde o RabbitMQ atrás de uma
  interface (há implementação em memória para testes).

# ADR-003: Auditoria como tabela append-only

- **Status:** Aceita
- **Contexto:** `audit`

## Contexto

O requisito central é rastreabilidade completa: saber quem mudou o quê, quando, e qual era o estado antes e depois.

## Decisão

`AUDIT_LOG` é **somente de inserção**. Cada registro guarda `before`, `after` e `diff`. A aplicação nunca emite `UPDATE` nem
`DELETE` nessa tabela (o repositório só expõe `append` e consultas). Correções são novos registros, nunca edições.
Endurecimento no banco (permissões só de `INSERT`/`SELECT`) é um próximo passo.

## Alternativas consideradas

- **Event sourcing completo:** dá a mesma garantia, mas muda todo o modelo de persistência. Custo desproporcional
  para o escopo; o log de auditoria resolve a necessidade sem isso.
- **Auditoria por trigger no banco:** captura tudo, mas perde o contexto de domínio (quem/por quê/qual evento).

## Consequências

- (+) Histórico confiável e fácil de provar; ótimo para o relay ao Kafka.
- (−) A tabela só cresce: precisará de particionamento/retenção no futuro.

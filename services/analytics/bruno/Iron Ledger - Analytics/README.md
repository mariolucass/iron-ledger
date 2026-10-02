# Iron Ledger Analytics no Bruno

Abra esta pasta como coleção no [Bruno](https://docs.usebruno.com/get-started/bruno-basics/create-a-collection) e selecione o ambiente `local`. A URL padrão é `http://localhost:8000` e pode ser alterada em `baseurl`.

Antes de consultar, execute o pipeline de dados descrito em [`docs/analytics/olist-first-step.md`](../../../../docs/analytics/olist-first-step.md) e inicie o serviço. **Health** abre o banco SQLite; **Summary** e **List points** exigem que o pipeline tenha criado as tabelas. Para **Get point**, copie um `id` retornado por **List points** para `pointId` no ambiente.

Este serviço também oferece documentação interativa em `http://localhost:8000/docs`.

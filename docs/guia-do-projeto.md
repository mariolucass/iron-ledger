# Guia de estudo do Iron Ledger

Este guia explica a estrutura do repositório, como as partes conversam, o que o código faz hoje e o que ainda está incompleto. Ele foi escrito para ajudar a entender o projeto e transformar ideias em tarefas pequenas e claras.

## 1. O que o projeto pretende ser

O Iron Ledger é um sistema de operações de estoque. A ideia é permitir que usuários gerenciem produtos, armazéns, saldos e movimentações, mantendo uma trilha de auditoria. Algumas operações podem envolver vários passos: uma saga coordena esses passos e tenta compensá-los se algo falhar. Um serviço separado de analytics analisa dados e pode, no futuro, transformar sinais em alertas.

Uma visão resumida:

```text
Pessoa → site Next.js → API → PostgreSQL
                         ├→ RabbitMQ → auditoria
                         └→ Temporal → worker → API/estoque

Analytics (Python) → dados analíticos e pontos de inflexão
```

O repositório mistura funcionalidades operacionais, páginas demonstrativas e infraestrutura de uma arquitetura maior. Ter uma tela, tabela ou documento de arquitetura não significa, por si só, que a funcionalidade esteja conectada de ponta a ponta.

## 2. Como ler os níveis de maturidade

- **Funcional:** há código executável cobrindo o fluxo principal, da entrada até o resultado persistido ou exibido.
- **Parcial:** parte do fluxo funciona, mas há lacunas importantes, limites ou dependências externas.
- **Demonstração:** a interface existe, mas usa fixtures, dados estáticos ou estado só em memória.
- **Planejado:** aparece em documentos, tipos, tabelas ou infraestrutura, mas ainda não há fluxo funcional completo.

Essas classificações descrevem o código encontrado no repositório. O estado da sua máquina também depende de instalações e serviços em execução.

## 3. Mapa do repositório

| Pasta | Para que serve |
| --- | --- |
| `apps/web` | Site Next.js: páginas, formulários, navegação e rotas intermediárias do navegador para a API. |
| `apps/api` | API Express em TypeScript: autenticação, estoque, catálogo, armazéns, auditoria e transações. |
| `apps/temporal-worker` | Worker que executa atividades e workflows duráveis no Temporal. |
| `services/analytics` | Pipeline e API analítica em Python; atualmente trabalha em lote com dados da Olist. |
| `packages/shared-types` | Tipos de eventos e contratos HTTP compartilhados entre projetos. |
| `packages/event-bus` | Abstração de mensageria e adaptadores RabbitMQ/em memória. |
| `packages/logger` | Logger estruturado e propagação de contexto de log. |
| `packages/workflow-contracts` | Contratos TypeScript dos workflows e atividades do worker. |
| `infra/docker` e `docker-compose.yml` | Imagens e serviços de infraestrutura para execução com Docker. |
| `scripts` | Inicialização local, carregamento de ambiente, Prisma e preparação do projeto. |
| `docs` | Decisões, arquitetura, fluxos, planos e este guia. |

## 4. O que acontece quando alguém usa o site

### Site e BFF

O site usa Next.js. As páginas estão em `apps/web/src/app`; os componentes são organizados principalmente como `views`, `widgets`, `features`, `entities` e `shared`.

O navegador costuma chamar rotas `/api/...` do próprio Next. Essas rotas, chamadas de **BFF** (Backend for Frontend), repassam as chamadas à API e podem adaptar a resposta. Por exemplo, o token de sessão fica num cookie HTTP-only em vez de ser exposto ao JavaScript da página.

Por isso, existem dois servidores distintos durante o desenvolvimento:

- Web: normalmente `http://localhost:3001` (`pnpm dev:web`).
- API: normalmente `http://localhost:3000` (`pnpm dev:api`).

Subir só o site não sobe a API. Uma página pode abrir normalmente e, ainda assim, não conseguir cadastrar ou carregar dados reais.

### API

A inicialização da API começa em `apps/api/src/main.ts`. Ela valida as variáveis de ambiente, conecta ao PostgreSQL e ao RabbitMQ, inicia o consumidor de auditoria e então abre o servidor HTTP. Portanto, no estado atual, o RabbitMQ é uma dependência de inicialização da API, mesmo que a regra de cadastro de usuário não precise publicar eventos.

Cada módulo compõe suas dependências e rotas em `apps/api/src/modules/<módulo>/<módulo>.module.ts`; `apps/api/src/infra/http/router.ts` apenas os monta. O fluxo típico é:

```text
rota HTTP → controller → caso de uso → interface de repositório → Prisma/PostgreSQL
```

Isso separa transporte HTTP, regra de negócio e acesso a dados. Os módulos em `apps/api/src/modules` seguem essa divisão em graus variados.

## 5. Áreas de negócio e estado atual

### Identity: cadastro, login e usuários

Cuida de contas, senhas, tokens, perfis e papéis.

- Cadastro público em `POST /auth/register` e login em `POST /auth/login` estão implementados.
- Senhas são armazenadas como hash bcrypt; o login emite JWT.
- O site encaminha cadastro e login pelo BFF e grava o JWT num cookie HTTP-only.
- O cadastro público cria usuário sem papéis privilegiados.
- Perfil e preferências têm casos de uso e rotas.
- Há gestão administrativa de usuários e papéis, protegida por autenticação/autorização, mas a documentação de entidades do frontend diz que essas operações não estão cobertas por clientes web de domínio. Verifique tela e rota específicas antes de assumir que uma ação administrativa está conectada.
- As preferências incluem `emailAlerts` e `slackAlerts`, mas isso não equivale a envio de e-mail ou Slack: não encontrei integração de entrega de notificações por esses canais.

### Catalog: produtos

Tem casos de uso e rotas para listar, consultar, criar, atualizar e arquivar produtos, além de lookups. O estado persistido é PostgreSQL/Prisma. A disponibilidade no produto depende de autenticação e permissões configuradas.

### Warehouse: armazéns e locais

Tem operações para consultar, criar e atualizar armazéns e locais, além de desativar armazéns. É a estrutura física usada pelo estoque.

### Inventory: saldo, movimentos e reservas

Cuida de leitura de saldo e dos comandos de movimentar, reservar, liberar e confirmar estoque. Cada comando grava o saldo e o evento de domínio no outbox na mesma transação; o relay do outbox publica no RabbitMQ. As invariantes de saldo estão na entidade `StockLevel` e no objeto de valor `Quantity`. Movimentar exige o papel `WAREHOUSE_MANAGER`; reservar, liberar e confirmar aceitam também `SERVICE` (worker da Saga); `ADMIN` passa em tudo.

O banco tem um esquema amplo para lotes, contagens e transferências, mas a existência dessas tabelas não garante que cada operação esteja exposta e completa. As rotas atuais concentram-se em saldos, movimentos e reservas.

### Audit: trilha de auditoria

A API inicia um consumidor RabbitMQ. Eventos de domínio recebidos são persistidos como registros de auditoria; a consulta de auditoria é paginada e filtrável. A auditoria é projetada como append-only, com proteções no banco contra edição e exclusão comuns.

Esse fluxo depende de RabbitMQ e não deve ser confundido com uma notificação ao usuário. Auditoria registra fatos para rastreabilidade; notificação informa alguém e costuma ter estado de leitura/reconhecimento.

### Transaction: workflows/sagas

A API cria e consulta transações e pode pedir ao Temporal que inicie uma saga. O worker executa as atividades: conversa com a API para reservar, confirmar ou liberar estoque e registra etapas/resultados.

Esse caminho depende de Temporal Server e do worker além da API. No comando combinado `pnpm dev`, o worker pode ser omitido se o Temporal não estiver acessível. Assim, uma API e uma página ativas não provam que a saga executará.

### Analytics: análise e sinais

O serviço Python baixa/carrega dados públicos da Olist, agrega observações semanais, detecta pontos de inflexão e expõe endpoints HTTP de resumo, métricas e detalhes. A tela `/analytics` consulta esse serviço.

Hoje é um pipeline em lote e laboratório de método. A integração contínua de eventos operacionais por Kafka está descrita como planejada; o consumidor Kafka não forma atualmente um fluxo operacional completo. Um ponto analítico da Olist não representa automaticamente um alerta de estoque real do Iron Ledger.

## 6. Notificações e alertas: o que existe e o que falta

O Centro de Alertas em `apps/web/src/views/alerts` agora consulta o BFF do Next, que encaminha chamadas autenticadas para `GET /alerts`, `PATCH /alerts/:id` e `POST /alerts/resolve-all` na API. Reconhecer e resolver alteram o registro persistido, e a página atualiza os dados ao abrir, ao clicar em Atualizar e a cada 15 segundos.

O primeiro produtor real está ligado: quando uma transação muda para `FAILED`, `PrismaTransactionRepository.save` grava um alerta `SAGA_FAILURE` no mesmo commit do estado e histórico da transação. Isso inclui falha ao iniciar o workflow e falha final reportada pelo worker. A chave `saga-failure:<transactionId>` usa o índice único parcial existente, e o upsert mantém a gravação segura diante de reentregas concorrentes. Uma transação `COMPENSATED` não gera alerta nesta regra inicial, pois a compensação concluiu a recuperação.

Limites atuais: a central é compartilhada entre usuários autenticados (o estado de reconhecer/resolver é global), somente falha terminal de saga gera alertas reais, e não há entrega por e-mail ou Slack. Regras de estoque baixo, alertas do Analytics, assinantes por usuário e permissões mais finas ainda precisam ser implementados. RabbitMQ não é usado para criar esse alerta específico: o registro é feito junto com a transição transacional no PostgreSQL.

Para exercitar esse fluxo pela interface, a API e o site precisam estar rodando, e deve existir pelo menos um saldo de estoque disponível para iniciar uma transação. A caixa “Simular falha na confirmação” do formulário termina em `COMPENSATED` quando a compensação funciona, então ela não cria este alerta. Uma forma de observar `FAILED` localmente é manter a API ligada sem o Temporal Server e iniciar uma transação: a API registra a falha ao tentar iniciar o workflow e a central mostra o alerta na atualização seguinte. Essa falha do formulário é esperada nesse cenário de diagnóstico.

## 7. Eventos, RabbitMQ, outbox e Kafka

- **Evento:** fato que já aconteceu, como `Inventory.StockReserved`.
- **RabbitMQ:** transporta eventos de domínio para consumidores, como auditoria. A API atual depende dele ao iniciar.
- **Outbox:** grava eventos junto com a mudança de negócio no PostgreSQL e publica depois; reduz o risco de salvar a mudança sem publicar o evento. O relay está na API.
- **Kafka:** está previsto para streaming/analytics e disponível em infraestrutura opcional, mas não é um requisito do cadastro e não está ligado como relay operacional completo no fluxo atual.
- **Temporal:** mantém histórico e executa processos longos que precisam de retry/compensação; não substitui o RabbitMQ.

Exemplo conceitual de movimento:

```text
site envia movimento → API valida e grava saldo/movimento → evento/outbox
  → RabbitMQ → consumidor de auditoria → audit log no PostgreSQL
```

## 8. Dados e persistência

- PostgreSQL é a fonte principal de identidade, catálogo, armazéns, estoque, transações, auditoria e modelos analíticos preparados para evolução.
- Prisma define os modelos em vários arquivos dentro de `apps/api/prisma/schema`.
- Migrations versionam mudanças do banco. `pnpm db:deploy` aplica migrations já existentes; não inicia API, web, RabbitMQ ou Temporal.
- Seeds criam/atualizam dados iniciais. O seed administrativo pode redefinir a conta de demonstração; consulte README antes de rodá-lo.
- SQLite do Analytics é uma base local separada, gerada pelo pipeline Python.
- Redis tem infraestrutura e cliente, mas não identifiquei uso central no fluxo operacional atual.

Não use `db:reset` ou `infra:nuke` sem compreender que podem apagar dados locais.

## 9. Configuração e execução local

O `.env` da raiz é a configuração compartilhada. `.env.example` é apenas um modelo. O script `scripts/app-env.cjs` combina ambiente do terminal, `.env` opcional do app e `.env` da raiz; variáveis já definidas no terminal têm prioridade.

Para o fluxo web básico desta configuração, são necessários:

1. PostgreSQL iniciado, com banco/usuário/URL corretos.
2. RabbitMQ iniciado e credenciais compatíveis com `RABBITMQ_URL`, porque a API conecta a ele durante o bootstrap.
3. Migrations aplicadas.
4. API e site iniciados em terminais que permaneçam abertos.

Na raiz, os comandos úteis são:

```powershell
pnpm db:status       # verifica estado das migrations
pnpm db:deploy       # aplica migrations já existentes
pnpm dev:api         # inicia somente a API
pnpm dev:web         # inicia somente o site
pnpm dev             # inicia serviços locais compatíveis; worker/analytics podem ser omitidos
```

O `pnpm dev:web` sozinho não é suficiente para cadastro. Se o navegador mostrar `API_UNAVAILABLE`, examine o terminal da API e confirme a URL `API_URL`/porta. Se a API não iniciar, comece pelo primeiro erro de bootstrap (banco, RabbitMQ, variável de ambiente ou migração), em vez de depurar o formulário.

O projeto também pode ser executado com Docker Compose. Serviços como Temporal/Kafka e analytics pertencem a perfis opcionais; não são necessários para abrir a página de cadastro.

## 10. Scripts e infraestrutura

- `scripts/run-app.mjs` prepara pacotes compartilhados, carrega variáveis e inicia apps selecionados. Em `pnpm dev`, faz verificações e pode ignorar alguns serviços opcionais.
- `scripts/run-prisma.mjs` executa comandos Prisma com o carregador de ambiente do projeto.
- `scripts/bootstrap.mjs` prepara dependências Node/Python conforme a opção escolhida.
- `scripts/run-analytics.mjs` inicia o serviço Python.
- `docker-compose.yml` descreve PostgreSQL, RabbitMQ, Redis, API, web/worker e perfis opcionais.
- `infra/docker` contém receitas de imagem. Docker é uma forma de iniciar serviços, não um requisito técnico se as dependências equivalentes já estiverem instaladas localmente.

## 11. Documentação: como não se confundir

O repositório tem documentos em níveis diferentes: alguns descrevem código atual; outros registram intenção futura, propostas de arquitetura ou planos de sprint. Quando houver dúvida, priorize nesta ordem:

1. comportamento observado no código atual e rotas realmente registradas;
2. README e guias operacionais recentes;
3. documentação de arquitetura, ADRs e planos, conferindo data e linguagem (“planejado”, “proposta”, “implementado”).

Há discrepâncias conhecidas. Por exemplo, `docs/architecture/bounded-contexts.md` descreve partes de Inventory, Transaction e Audit como planejadas, embora hoje existam casos de uso/rotas e o bootstrap do consumidor de auditoria. Já o README apresenta alertas de analytics como acionáveis, mas a tela geral de alertas usa fixtures e não há escritor de alertas. A documentação precisa de revisão para refletir o código com uma matriz de estado consistente.

## 12. Glossário simples

| Termo | Significado aqui |
| --- | --- |
| API | Servidor que valida pedidos e aplica regras de negócio. |
| BFF | Rotas do Next que intermediam as chamadas do navegador à API. |
| Prisma | Ferramenta TypeScript que mapeia modelos e consultas do PostgreSQL. |
| Migration | Alteração versionada aplicada ao esquema do banco. |
| Seed | Dados iniciais/de demonstração inseridos no banco. |
| Evento | Registro de um fato ocorrido que outros módulos podem consumir. |
| Consumidor | Processo que recebe eventos e executa uma ação, como gravar auditoria. |
| Outbox | Caixa de saída no banco usada para publicar eventos após persistir a mudança. |
| Saga | Processo de negócio com vários passos e ações de compensação em falhas. |
| Workflow | Execução durável coordenada pelo Temporal. |
| Fixture/mock | Dados falsos ou simulados usados para desenhar/testar a interface. |
| RBAC | Autorização por papéis e permissões. |
| Bounded context | Área de negócio com vocabulário, regras e dados próprios. |

## 13. Como me direcionar em próximas tarefas

Para cada melhoria, tente especificar:

1. **Quem usa?** Ex.: operador, administrador, serviço automático.
2. **O que dispara?** Ex.: estoque cai abaixo do mínimo, saga falha, login ocorre.
3. **Qual resultado espera?** Ex.: aparece na central, salva no banco, envia e-mail.
4. **Onde deve aparecer?** Ex.: badge, página de alertas, e-mail, Slack.
5. **Como deve mudar de estado?** Ex.: abrir, reconhecer, resolver ou dispensar.
6. **Quais dependências aceita?** Ex.: apenas PostgreSQL, RabbitMQ ou um provedor externo.

Uma próxima instrução concreta poderia ser: “Quero alertas de estoque baixo baseados no ponto de reposição do produto; devem ser deduplicados por produto e armazém e aparecer na mesma central de alertas.”

## 14. Próximos passos recomendados para entender o sistema

1. Leia o README da raiz e este guia.
2. Siga o cadastro em `apps/web/src/app/api/auth/register/route.ts`, `apps/api/src/modules/identity` e no modelo Prisma de usuário.
3. Siga uma movimentação: rota de inventário → caso de uso → repositório Prisma → evento → RabbitMQ → consumidor de auditoria.
4. Compare `/alerts` e `/analytics`: a primeira lê alertas persistidos de falhas finais de saga; a segunda lê os pontos de inflexão do serviço analítico, que ainda não viram alertas nessa central.
5. Depois escolha uma lacuna funcional pequena e feche o fluxo de ponta a ponta.

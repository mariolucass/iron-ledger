import type { SystemAlert } from "./types";

export const mockAlerts: SystemAlert[] = [
  {
    id: "ALT-0091",
    title: "Ruptura de Estoque Iminente",
    description: "O modelo ARIMA prevê que o Tênis Esportivo Nike Air atingirá zero em poucas horas na Loja Centro.",
    detail: "Com base em 90 dias de dados históricos, o modelo ARIMA-X prevê uma demanda de 12 unidades por dia. O estoque atual é de 2 unidades, o que resulta numa janela de poucas horas antes da ruptura. A última reposição ocorreu há 18 dias. Recomenda-se emissão de pedido de compra urgente.",
    severity: "CRITICAL", source: "FORECASTING", timestamp: "Há 10 min", ts_iso: "2026-06-09T13:50:00Z", status: "ACTIVE",
    affectedEntity: "SKU-4821-A · Loja Centro",
  },
  {
    id: "ALT-0090", title: "Falha na Compensação de Saga",
    description: "A transação TXN-00483919 falhou ao reverter a dedução de estoque. Intervenção manual necessária.",
    detail: "Durante a execução da compensação automática (Saga Rollback), o worker 'CompensarDedução' atingiu o limite de 3 tentativas e terminou em estado FAILED. O inventário pode estar inconsistente entre o serviço de Estoque e o serviço de Vendas. Um lock de escrita foi colocado na SKU-3910-B até resolução manual.",
    severity: "CRITICAL", source: "TRANSACTIONS", timestamp: "Há 42 min", ts_iso: "2026-06-09T13:18:00Z", status: "ACTIVE", affectedEntity: "TXN-00483919",
  },
  {
    id: "ALT-0089", title: "Múltiplas Falhas de Autenticação",
    description: "Detectadas 5 tentativas de login falhadas consecutivas para admin@ironledger a partir de 10.0.1.42.",
    detail: "O sistema de identidade bloqueou temporariamente o usuário após exceder o limite de falhas configurado (5 tentativas em 120 segundos). O IP de origem não consta na whitelist. Poderá ser um ataque de força bruta ou um token de sessão expirado mal-configurado no cliente.",
    severity: "HIGH", source: "SECURITY", timestamp: "Há 1 hora", ts_iso: "2026-06-09T12:48:00Z", status: "ACKNOWLEDGED", affectedEntity: "admin@ironledger",
  },
  {
    id: "ALT-0088", title: "Latência Elevada no Worker Temporal",
    description: "A fila 'inventory-tasks' tem latência > 5s. Considere escalar os workers.",
    detail: "O dashboard do Temporal.io mostra 247 tasks em fila com uma latência mediana de 6.2 segundos. O limite configurado é de 2 segundos. A provável causa é o pico de transações do turno da tarde. O auto-scaler foi acionado mas ainda não estabilizou.",
    severity: "MEDIUM", source: "SYSTEM", timestamp: "Há 3 horas", ts_iso: "2026-06-09T10:48:00Z", status: "ACTIVE", affectedEntity: "inventory-tasks queue",
  },
  {
    id: "ALT-0087", title: "Rebalanceamento Kafka Concluído",
    description: "O cluster de leitura concluiu o rebalanceamento sem perda de dados.",
    detail: "Após a janela de manutenção programada, todas as 12 partições foram reatribuídas com sucesso. Nenhuma mensagem foi perdida. O lag do consumer group 'audit-writer' voltou a zero. Sistema operando normalmente.",
    severity: "LOW", source: "SYSTEM", timestamp: "Há 5 horas", ts_iso: "2026-06-09T08:48:00Z", status: "RESOLVED", affectedEntity: "kafka-cluster-01",
  },
  {
    id: "ALT-0086", title: "Estoque Abaixo do Mínimo — SKU-3910-B",
    description: "Estoque da Camiseta de Algodão Premium caiu abaixo do nível mínimo no Estoque Sul.",
    detail: "O estoque atual de 8 unidades está abaixo do mínimo configurado de 15 unidades. Com a taxa de consumo média dos últimos 7 dias (2.1 un/dia), prevê-se esgotamento em 3.8 dias. O reorder point foi ativado automaticamente mas ainda aguarda aprovação de compra.",
    severity: "HIGH", source: "FORECASTING", timestamp: "Há 6 horas", ts_iso: "2026-06-09T07:48:00Z", status: "ACKNOWLEDGED", affectedEntity: "SKU-3910-B · Estoque Sul",
  },
];

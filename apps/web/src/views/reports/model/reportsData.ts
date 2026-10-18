export const activityData = [
  { date: "01 Jun", sucesso: 120, falha: 12, compensado: 5 },
  { date: "02 Jun", sucesso: 132, falha: 8, compensado: 2 },
  { date: "03 Jun", sucesso: 101, falha: 15, compensado: 8 },
  { date: "04 Jun", sucesso: 145, falha: 5, compensado: 1 },
  { date: "05 Jun", sucesso: 160, falha: 9, compensado: 3 },
  { date: "06 Jun", sucesso: 110, falha: 20, compensado: 12 },
  { date: "07 Jun", sucesso: 95, falha: 4, compensado: 0 },
  { date: "08 Jun", sucesso: 150, falha: 11, compensado: 4 },
  { date: "09 Jun", sucesso: 180, falha: 7, compensado: 2 },
];

export const recentReports = [
  {
    id: "REP-9921",
    name: "Auditoria_Geral_Maio2026",
    type: "Auditoria",
    format: "CSV",
    size: "12.4 MB",
    date: "2026-06-08 14:30",
    author: "admin@ironledger",
    status: "READY",
  },
  {
    id: "REP-9920",
    name: "Transacoes_Falhas_Q2",
    type: "Transações",
    format: "XLSX",
    size: "4.1 MB",
    date: "2026-06-07 09:15",
    author: "vendas@ironledger",
    status: "READY",
  },
  {
    id: "REP-9919",
    name: "Inventario_Posicao_Atual",
    type: "Inventário",
    format: "PDF",
    size: "1.2 MB",
    date: "2026-06-07 08:00",
    author: "estoque-centro@ironledger",
    status: "READY",
  },
  {
    id: "REP-9918",
    name: "Relatorio_Sagas_Compensadas",
    type: "Transações",
    format: "CSV",
    size: "8.7 MB",
    date: "2026-06-05 16:45",
    author: "admin@ironledger",
    status: "READY",
  },
];

export const reportTypes = [
  "Todos os Domínios",
  "Inventário",
  "Transações (Sagas)",
  "Log de Auditoria",
  "Previsões",
];

export const formats = ["CSV", "XLSX", "PDF (Resumo)"];

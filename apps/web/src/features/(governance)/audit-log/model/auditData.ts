export const resourceTypes = [
  "Todos",
  "Inventário",
  "Transação",
  "Usuário",
  "Permissão",
  "Sistema",
];

export const actions = [
  "Todas",
  "CRIAR",
  "ATUALIZAR",
  "DELETAR",
  "LOGIN",
  "ALTERAR PERMISSÃO",
];

export interface AuditEntry {
  ts: string;
  user: string;
  action: string;
  resource: string;
  resourceId: string;
  corrId: string;
}

export const auditEntries: AuditEntry[] = [
  {
    ts: "2026-06-09 14:32:01",
    user: "vendas@ironledger",
    action: "UPDATE",
    resource: "Transaction",
    resourceId: "TXN-00483921",
    corrId: "corr-a9f2b1e3",
  },
  {
    ts: "2026-06-09 14:30:45",
    user: "system",
    action: "CREATE",
    resource: "Inventory",
    resourceId: "SKU-4821-A",
    corrId: "corr-a9f2b1e3",
  },
  {
    ts: "2026-06-09 14:28:47",
    user: "estoque-centro@ironledger",
    action: "UPDATE",
    resource: "Transaction",
    resourceId: "TXN-00483920",
    corrId: "corr-b7d4c2f1",
  },
  {
    ts: "2026-06-09 14:15:00",
    user: "admin@ironledger",
    action: "PERMISSION_CHANGE",
    resource: "User",
    resourceId: "usr-00092",
    corrId: "corr-c1a3e9d7",
  },
  {
    ts: "2026-06-09 14:11:03",
    user: "admin@ironledger",
    action: "DELETE",
    resource: "Transaction",
    resourceId: "TXN-00483919",
    corrId: "corr-d2b8f0e4",
  },
  {
    ts: "2026-06-09 13:55:22",
    user: "vendas@ironledger",
    action: "CREATE",
    resource: "Transaction",
    resourceId: "TXN-00483918",
    corrId: "corr-e5c7a2b9",
  },
  {
    ts: "2026-06-09 13:40:10",
    user: "estoque-sul@ironledger",
    action: "UPDATE",
    resource: "Inventory",
    resourceId: "SKU-3910-B",
    corrId: "corr-f1d9c3a0",
  },
];

export const beforeAfterData = {
  before: {
    status: "PENDING",
    quantity: 42,
    reserved: 8,
    updatedAt: "2026-06-09T13:40:00Z",
    version: 11,
  },
  after: {
    status: "PROCESSING",
    quantity: 37,
    reserved: 13,
    updatedAt: "2026-06-09T13:40:10Z",
    version: 12,
  },
};

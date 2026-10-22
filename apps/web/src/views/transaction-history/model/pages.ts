import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Execução e histórico de uma transação (transaction.SagaStep, TransactionStatusHistory). */
export const transactionHistoryPages = {
  saga: (id: string): PlannedPage => ({
    title: "Etapas da saga",
    description: "Ações e compensações executadas pelo workflow, com tentativas, entradas, saídas e erros.",
    back: { href: `/transactions/${id}` as Route, label: "Transação" },
  }),
  history: (id: string): PlannedPage => ({
    title: "Histórico de status",
    description: "Mudanças de status da transação, com motivo e responsável.",
    back: { href: `/transactions/${id}` as Route, label: "Transação" },
  }),
  auditLog: (id: string): PlannedPage => ({
    title: "Auditoria da transação",
    description: "Eventos de auditoria relacionados a esta transação.",
    back: { href: `/transactions/${id}` as Route, label: "Transação" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;

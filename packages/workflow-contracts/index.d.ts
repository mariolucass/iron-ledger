/**
 * Compatibilidade: reexporta só o módulo `transaction`, que nasceu aqui.
 * Módulos novos NÃO entram neste arquivo: ficam em `<modulo>.d.ts` e são
 * importados por subpath (`@iron-ledger/workflow-contracts/<modulo>`).
 */
export * from "./transaction";

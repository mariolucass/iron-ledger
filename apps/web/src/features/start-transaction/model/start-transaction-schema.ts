import { z } from "zod";

export const startTransactionSchema = z.object({
  stockLevelId: z.string().uuid("Selecione um saldo de estoque válido."),
  quantity: z.coerce.number().finite().positive("A quantidade deve ser maior que zero."),
  externalRef: z.string().trim().max(120).optional().transform((value) => value || undefined),
  failConfirmation: z.boolean(),
});

export type StartTransactionForm = z.infer<typeof startTransactionSchema>;

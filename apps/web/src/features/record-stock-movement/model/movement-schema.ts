import { z } from "zod";

export const movementSchema = z
  .object({
    stockLevelId: z.string().uuid("Selecione um saldo de estoque válido."),
    type: z.enum(["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"]),
    quantity: z.coerce
      .number()
      .finite()
      .refine((value) => value !== 0, "A quantidade deve ser diferente de zero."),
    referenceId: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((value) => value || undefined),
    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => value || undefined),
  })
  .refine((value) => value.type === "ADJUSTMENT" || value.quantity > 0, {
    path: ["quantity"],
    message: "A quantidade deve ser positiva para este tipo de movimentação.",
  });

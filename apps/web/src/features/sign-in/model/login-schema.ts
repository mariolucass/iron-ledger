import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu email corporativo.").email("Digite um endereço de email válido."),
  password: z.string().min(1, "Informe sua senha."),
  remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

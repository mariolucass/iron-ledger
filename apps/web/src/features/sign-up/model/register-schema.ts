import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome completo.").max(120, "Nome muito longo."),
    email: z.string().trim().min(1, "Informe seu email corporativo.").email("Digite um endereço de email válido."),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.").max(72, "A senha deve ter no máximo 72 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

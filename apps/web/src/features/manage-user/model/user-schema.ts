import { z } from "zod";
import { USER_STATUSES } from "@/entities/user";

const base = {
  name: z.string().trim().min(2, "Informe o nome completo.").max(120, "Nome muito longo."),
  status: z.enum(USER_STATUSES),
  roles: z.array(z.string()),
};

export const createUserFormSchema = z.object({
  ...base,
  email: z.string().trim().min(1, "Informe o e-mail.").email("Digite um endereço de e-mail válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.").max(72, "A senha deve ter no máximo 72 caracteres."),
});

export const editUserFormSchema = z.object({
  ...base,
  email: z.string(),
  password: z.string(),
});

export type UserFormValues = z.infer<typeof createUserFormSchema>;

export const emptyUserForm: UserFormValues = { name: "", email: "", password: "", status: "ACTIVE", roles: [] };

export const sameRoles = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((role, index) => role === [...b].sort()[index]);

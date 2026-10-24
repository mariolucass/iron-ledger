"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useEscape } from "@/shared/lib/use-escape";
import { Button } from "@/shared/ui/kit/button";
import { Form } from "@/shared/ui/kit/form";

interface FormDialogProps<TInput extends FieldValues, TOutput extends FieldValues | undefined> {
  form: UseFormReturn<TInput, unknown, TOutput>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  /** Linha pequena acima do título. */
  eyebrow: string;
  title: string;
  description?: string;
  submitLabel: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  /** Mensagem de erro da submissão, exibida acima dos botões. */
  error?: string;
  /** Conteúdo à esquerda do rodapé (ex.: link para o formulário completo). */
  footerStart?: ReactNode;
  children: ReactNode;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const panelVariants = (reduced: boolean | null): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...(reduced
        ? { duration: 0.15 }
        : { type: "spring", stiffness: 380, damping: 32, mass: 0.9 }),
      when: "beforeChildren",
      staggerChildren: reduced ? 0 : 0.045,
    },
  },
  exit: reduced
    ? { opacity: 0, transition: { duration: 0.12 } }
    : { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
});

const sectionVariants = (reduced: boolean | null): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: { opacity: 1 },
});

/**
 * Casca modal dos formulários rápidos: cabeçalho, corpo, erro e rodapé com ações.
 * Renderize dentro de `<AnimatePresence>` para animar a saída. Esc e clique no fundo fecham.
 */
export function FormDialog<TInput extends FieldValues, TOutput extends FieldValues | undefined>({
  form,
  onSubmit,
  onClose,
  eyebrow,
  title,
  description,
  submitLabel,
  submitting = false,
  submitDisabled = false,
  error,
  footerStart,
  children,
}: FormDialogProps<TInput, TOutput>) {
  const reduced = useReducedMotion();
  const panel = panelVariants(reduced);
  const section = sectionVariants(reduced);
  useEscape(onClose);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center p-4" role="presentation">
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }}
        exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md backdrop-saturate-150"
      />
      <Form {...form}>
        <motion.form
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ transformOrigin: "center 40%" }}
          onSubmit={onSubmit}
          noValidate
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative w-full max-w-lg rounded-2xl border border-border bg-card-elevated p-6 shadow-elevated backdrop-blur-2xl"
        >
          <motion.div variants={section} className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.08em] text-primary uppercase">
                {eyebrow}
              </p>
              <h2 className="mt-1 text-xl font-bold">{title}</h2>
              {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Fechar"
              onClick={onClose}
              className="rounded-full"
            >
              <X />
            </Button>
          </motion.div>

          <motion.div variants={section} className="grid gap-4">
            {children}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive"
              >
                {error}
              </div>
            )}
          </motion.div>

          <motion.div variants={section} className="mt-6 flex items-center justify-between gap-3">
            <div className="min-w-0">{footerStart}</div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || submitDisabled}>
                {submitting && <Loader2 className="animate-spin" />}
                {submitLabel}
              </Button>
            </div>
          </motion.div>
        </motion.form>
      </Form>
    </div>
  );
}

"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { unitApi, type UnitOfMeasure } from "@/entities/unit-of-measure";
import { ApiError } from "@/shared/api/client";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import { emptyUnitForm, toUnitInput, unitFormSchema, type UnitFormValues } from "./unit-schema";
export function useUnitForm(onSaved: (unit: UnitOfMeasure) => void) {
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<UnitFormValues>({ resolver: zodResolver(unitFormSchema), defaultValues: emptyUnitForm });
  const submit = form.handleSubmit(async (values) => {
    setStatus(null);
    try { onSaved(await withSession(unitApi.create(toUnitInput(values)))); }
    catch (reason) {
      if (reason instanceof ApiError && reason.code === "UNIT_CODE_ALREADY_EXISTS") {
        form.setError("code", { message: reason.message }); form.setFocus("code"); return;
      }
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível cadastrar a unidade." });
    }
  });
  return { form, submit, status };
}

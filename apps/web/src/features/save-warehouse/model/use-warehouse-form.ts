"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { warehouseApi, type WarehouseDetail } from "@/entities/warehouse";
import { ApiError } from "@/shared/api/client";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import {
  emptyWarehouseForm,
  toFormValues,
  toWarehouseInput,
  warehouseFormSchema,
  type WarehouseFormValues,
} from "./warehouse-schema";

interface Options {
  warehouse?: WarehouseDetail;
  onSaved: (warehouse: WarehouseDetail, mode: "created" | "updated") => void;
}

export function useWarehouseForm({ warehouse, onSaved }: Options) {
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: warehouse ? toFormValues(warehouse) : emptyWarehouseForm,
  });

  const submit = form.handleSubmit(async (values) => {
    setStatus(null);
    const input = toWarehouseInput(values);
    try {
      if (warehouse) {
        const saved = await withSession(warehouseApi.update(warehouse.id, input));
        form.reset(toFormValues(saved));
        onSaved(saved, "updated");
      } else {
        onSaved(await withSession(warehouseApi.create({ ...input, code: values.code.trim().toUpperCase() })), "created");
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "WAREHOUSE_CODE_EXISTS") {
        form.setError("code", { message: reason.message });
        form.setFocus("code");
        return;
      }
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível salvar a instalação." });
    }
  });

  return { form, submit, status, isEditing: Boolean(warehouse) };
}

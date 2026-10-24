"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { inventoryApi } from "@/entities/inventory";
import { withSession } from "@/shared/auth/with-session";
import { movementSchema } from "./movement-schema";
import type { MovementStockOption } from "./types";

interface Options {
  items: MovementStockOption[];
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}

type FormInput = z.input<typeof movementSchema>;
type FormOutput = z.output<typeof movementSchema>;

export function useRecordStockMovement({ items, onClose, onSuccess }: Options) {
  const [error, setError] = useState("");
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      stockLevelId: items[0]?.stockLevelId ?? "",
      type: "INBOUND",
      quantity: 1,
      referenceId: "",
      notes: "",
    },
  });
  const stockLevelId = form.watch("stockLevelId");

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      await withSession(inventoryApi.createMovement(values));
      await onSuccess("Movimentação registrada e enviada para auditoria.");
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível registrar a movimentação.",
      );
    }
  });

  return { form, stockLevelId, error, submit };
}

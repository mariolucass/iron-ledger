"use client";

import { useState, type FormEvent } from "react";
import { inventoryApi, type CreateMovementType } from "@/entities/inventory";
import { withSession } from "@/shared/auth/with-session";
import { movementSchema } from "./movement-schema";
import type { MovementStockOption } from "./types";

interface Options {
  items: MovementStockOption[];
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}

export function useRecordStockMovement({ items, onClose, onSuccess }: Options) {
  const [stockLevelId, setStockLevelId] = useState(items[0]?.stockLevelId ?? "");
  const [type, setType] = useState<CreateMovementType>("INBOUND");
  const [quantity, setQuantity] = useState("1");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const result = movementSchema.safeParse({ stockLevelId, type, quantity, referenceId, notes });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await withSession(inventoryApi.createMovement(result.data));
      await onSuccess("Movimentação registrada e enviada para auditoria.");
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar a movimentação.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    stockLevelId, setStockLevelId, type, setType, quantity, setQuantity,
    referenceId, setReferenceId, notes, setNotes, error, submitting, submit,
  };
}

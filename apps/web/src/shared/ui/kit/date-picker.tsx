"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

/** Mesmo formato de `<input type="date">`, para manter o estado das telas como string. */
const ISO_DATE = "yyyy-MM-dd";

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, ISO_DATE, new Date());
  return isValid(date) ? date : undefined;
}

interface DatePickerProps {
  /** Data no formato `yyyy-MM-dd`; string vazia representa "sem data". */
  value: string;
  onChange: (value: string) => void;
  /** Limites inclusivos no formato `yyyy-MM-dd`. */
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Selecionar data",
  clearable = true,
  disabled,
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  const disabledDays: Matcher[] = [];
  if (minDate) disabledDays.push({ before: minDate });
  if (maxDate) disabledDays.push({ after: maxDate });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          data-empty={!selected}
          className={cn(
            "w-[150px] justify-start px-3 font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="text-muted-foreground" />
          {selected ? format(selected, "dd/MM/yyyy", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate ?? minDate}
          disabled={disabledDays}
          onSelect={(date) => {
            onChange(date ? format(date, ISO_DATE) : "");
            setOpen(false);
          }}
        />
        {clearable && selected && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <XIcon />
              Limpar data
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, type DatePickerProps };

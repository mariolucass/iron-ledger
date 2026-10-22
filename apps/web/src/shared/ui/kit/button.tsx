import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium tracking-[-0.01em] transition-[background,border-color,color,box-shadow,transform] duration-150 outline-none select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:ring-destructive/30",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_92%,white),var(--primary))] text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/35%),0_1px_2px_rgb(0_0_0/30%),0_6px_18px_var(--primary-glow)] hover:bg-[linear-gradient(180deg,var(--primary),var(--primary-hover))] hover:shadow-[inset_0_1px_0_rgb(255_255_255/30%),0_1px_2px_rgb(0_0_0/30%),0_8px_24px_var(--primary-border)]",
        destructive:
          "border border-destructive/30 bg-destructive-soft text-destructive shadow-[inset_0_1px_0_rgb(255_255_255/6%)] hover:border-destructive/50 hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive/30",
        outline:
          "border border-border-strong bg-card-elevated text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/7%),0_1px_2px_rgb(0_0_0/20%)] backdrop-blur-md hover:bg-card-hover hover:border-ink/25",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/6%)] hover:bg-card-hover",
        ghost: "text-muted-foreground hover:bg-card-hover hover:text-foreground",
        link: "text-info underline-offset-4 hover:underline active:scale-100",
        orb: "isolate overflow-hidden border border-border-strong text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/12%),0_6px_20px_rgb(0_0_0/25%)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_12%_20%,color-mix(in_srgb,var(--info)_42%,transparent),transparent_58%),radial-gradient(circle_at_88%_90%,color-mix(in_srgb,var(--purple)_36%,transparent),transparent_58%),radial-gradient(circle_at_60%_0%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_55%)] before:blur-md bg-card-elevated hover:border-ink/25 hover:before:opacity-90",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[13px] has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };

import * as React from "react";
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn("rounded-md bg-ink/[0.06] motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}

export { Skeleton };

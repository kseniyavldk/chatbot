import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors",
        "bg-[var(--bg-3)] border-[var(--border)] text-[var(--text-1)] placeholder:text-[var(--text-3)]",
        "focus-visible:border-[var(--accent)] focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

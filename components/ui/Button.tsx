"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "icon";
  active?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", active, className, children, ...props }, ref) => {
    const cls =
      variant === "primary"
        ? "btn-primary"
        : variant === "ghost"
          ? cn("btn-ghost", active && "active")
          : "btn-icon";

    return (
      <button ref={ref} className={cn(cls, className)} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

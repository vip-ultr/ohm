"use client";

import { Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  size?: number;
  className?: string;
}

export function CopyButton({ text, size = 14, className }: CopyButtonProps) {
  const { copied, copy } = useCopy();

  return (
    <button
      className={cn("copy-btn", copied && "copied", className)}
      onClick={() => copy(text)}
      title={copied ? "Copied!" : "Copy to clipboard"}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check size={size} strokeWidth={2.5} />
      ) : (
        <Copy size={size} strokeWidth={2} />
      )}
    </button>
  );
}

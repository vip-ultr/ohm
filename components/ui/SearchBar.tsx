"use client";

import { Search } from "lucide-react";
import { InputHTMLAttributes, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (val: string) => void;
  onEnter?: (val: string) => void;
  containerClass?: string;
}

export function SearchBar({
  value,
  onChange,
  onEnter,
  containerClass,
  className,
  ...props
}: SearchBarProps) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter(value);
    }
  };

  return (
    <div className={cn("search-bar", containerClass)}>
      <Search className="search-icon" size={16} />
      <input
        className={cn("search-input", className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        type="text"
        autoComplete="off"
        spellCheck={false}
        {...props}
      />
    </div>
  );
}

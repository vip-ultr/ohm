import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  value?: string | number;
  sub?: string;
  valueClass?: string;
}

export function Card({
  label,
  value,
  sub,
  valueClass,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div className={cn("card", className)} {...props}>
      {label && <div className="card-label">{label}</div>}
      {value !== undefined && (
        <div className={cn("card-value", valueClass)}>{value}</div>
      )}
      {sub && <div className="card-sub">{sub}</div>}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  valueClass,
  className,
}: CardProps) {
  return (
    <div className={cn("stat-card", className)}>
      {label && <div className="stat-label">{label}</div>}
      {value !== undefined && (
        <div className={cn("stat-value", valueClass)}>{value}</div>
      )}
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

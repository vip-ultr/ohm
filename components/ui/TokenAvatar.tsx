import Image from "next/image";
import { cn } from "@/lib/utils";
import { avatarColor } from "@/lib/helius";

interface TokenAvatarProps {
  name: string;
  ticker: string;
  address: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TokenAvatar({
  name,
  ticker,
  address,
  logoUrl,
  size = "md",
  className,
}: TokenAvatarProps) {
  const sizeClass =
    size === "sm"
      ? "token-avatar token-avatar-sm"
      : size === "lg"
        ? "token-avatar token-avatar-lg"
        : "token-avatar";

  const px = size === "sm" ? 28 : size === "lg" ? 52 : 36;

  if (logoUrl) {
    return (
      <div className={cn(sizeClass, className)} style={{ borderRadius: 0, overflow: "hidden", position: "relative" }}>
        <Image
          src={logoUrl}
          alt={name}
          width={px}
          height={px}
          style={{ objectFit: "cover" }}
          onError={(e) => {
            // Fall back to avatar on load error
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          unoptimized
        />
      </div>
    );
  }

  const color = avatarColor(address);
  const letter = (ticker[0] ?? name[0] ?? "?").toUpperCase();

  return (
    <div
      className={cn(sizeClass, className)}
      style={{ background: color }}
    >
      {letter}
    </div>
  );
}

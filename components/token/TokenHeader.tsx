"use client";

import Link from "next/link";
import { ExternalLink, Twitter, MessageCircle, Globe } from "lucide-react";
import { useTokenAnalytics, useXMentions } from "@/hooks/useTokenData";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenAvatar } from "@/components/ui/TokenAvatar";
import { shortenAddr } from "@/lib/helius";
import { Skeleton } from "@/components/ui/Skeleton";

interface TokenHeaderProps {
  address: string;
}

export default function TokenHeader({ address }: TokenHeaderProps) {
  const { data: token, isLoading } = useTokenAnalytics(address);
  const { data: mentions } = useXMentions(token?.ticker ?? "", address);

  if (isLoading || !token) {
    return (
      <div className="token-header">
        <div className="token-header-left">
          <Skeleton style={{ width: 52, height: 52, borderRadius: "50%" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton style={{ width: 160, height: 24 }} />
            <Skeleton style={{ width: 100, height: 14 }} />
            <Skeleton style={{ width: 200, height: 14 }} />
          </div>
        </div>
        <div className="token-header-right">
          <Skeleton style={{ width: 140, height: 40, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  const bagsUrl = `https://bags.fm/token/${address}`;

  return (
    <div className="token-header">
      {/* Left: Logo + info */}
      <div className="token-header-left">
        <TokenAvatar
          name={token.name}
          ticker={token.ticker}
          address={token.address}
          logoUrl={token.logoUrl}
          size="lg"
        />

        <div className="token-header-info">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="token-name">{token.name}</span>
            <span className="token-ticker">${token.ticker}</span>
            {token.isNew && <span className="new-badge">NEW</span>}
            {token.isHot && <span className="hot-badge">🔥 HOT</span>}
          </div>

          {/* Contract address */}
          <div className="token-ca">
            <span style={{ color: "var(--text4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px" }}>
              CA:
            </span>
            <span>{shortenAddr(address, 6)}</span>
            <CopyButton text={address} size={13} />
          </div>

          {/* Social links */}
          <div className="token-socials">
            {token.socials.twitter && (
              <Link
                href={token.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="token-social-link"
                title="Twitter / X"
              >
                <Twitter size={15} />
              </Link>
            )}
            {token.socials.telegram && (
              <Link
                href={token.socials.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="token-social-link"
                title="Telegram"
              >
                <MessageCircle size={15} />
              </Link>
            )}
            {token.socials.website && (
              <Link
                href={token.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="token-social-link"
                title="Website"
              >
                <Globe size={15} />
              </Link>
            )}

            {/* X mentions badge */}
            {mentions && (
              <div className="x-mentions">
                <Twitter size={12} />
                <span className="x-mentions-count">{mentions.count}</span>
                <span>mentions</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Buy button + price */}
      <div className="token-header-right">
        <Link
          href={bagsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="buy-btn"
        >
          Buy on Bags.fm
          <ExternalLink size={13} />
        </Link>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {token.priceFormatted}
          </div>
          <div
            className={token.change24h >= 0 ? "positive" : "negative"}
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {token.change24h >= 0 ? "+" : ""}
            {token.change24h.toFixed(2)}% (24h)
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { FaXTwitter, FaDiscord, FaTelegram } from "react-icons/fa6";
import { useTokenAnalytics, useXMentions } from "@/hooks/useTokenData";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenAvatar } from "@/components/ui/TokenAvatar";
import { shortenAddr } from "@/lib/helius";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TokenHeader({ address }: { address: string }) {
  const { data: token, isLoading } = useTokenAnalytics(address);
  const { data: mentions } = useXMentions(token?.ticker ?? "", address);

  if (isLoading || !token) {
    return (
      <div className="token-header">
        <div className="token-header-left">
          <Skeleton style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton style={{ width: 180, height: 22 }} />
            <Skeleton style={{ width: 120, height: 13 }} />
            <Skeleton style={{ width: 200, height: 13 }} />
          </div>
        </div>
        <div className="token-header-right">
          <Skeleton style={{ width: 320, height: 84, borderRadius: 8 }} />
          <Skeleton style={{ width: 90, height: 34, borderRadius: 7 }} />
        </div>
      </div>
    );
  }

  const bagsUrl = `https://bags.fm/token/${address}`;

  return (
    <div className="token-header">
      {/* Left: logo + name + CA + socials */}
      <div className="token-header-left">
        <TokenAvatar name={token.name} ticker={token.ticker} address={token.address} logoUrl={token.logoUrl} size="lg" />
        <div className="token-header-info">
          <div className="token-name-row">
            <span className="token-name">{token.name}</span>
            <span className="token-ticker">{token.ticker}</span>
            {token.isNew && <span className="new-badge">NEW</span>}
            {token.isHot && <span className="hot-badge">🔥</span>}
          </div>
          <div className="token-ca">
            <span className="token-ca-label">Token</span>
            <span>{shortenAddr(address, 8)}</span>
            <CopyButton text={address} size={12} />
          </div>
          <div className="token-socials">
            {token.socials.twitter && (
              <Link href={token.socials.twitter} target="_blank" rel="noopener noreferrer" className="token-social-link" title="X">
                <FaXTwitter size={14} />
              </Link>
            )}
            {token.socials.telegram && (
              <Link href={token.socials.telegram} target="_blank" rel="noopener noreferrer" className="token-social-link" title="Telegram">
                <FaTelegram size={14} />
              </Link>
            )}
            {token.socials.website && (
              <Link href={token.socials.website} target="_blank" rel="noopener noreferrer" className="token-social-link" title="Website">
                <Globe size={14} />
              </Link>
            )}
            {mentions && (
              <div className="x-mentions">
                <FaXTwitter size={11} />
                <span className="x-mentions-count">{mentions.count}</span>
                <span>mentions</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: meta key-value table + BUY */}
      <div className="token-header-right">
        <div className="token-meta-table">
          <div className="token-meta-cell">
            <span className="token-meta-key">Supply</span>
            <span className="token-meta-val">{token.supplyFormatted}</span>
          </div>
          <div className="token-meta-cell">
            <span className="token-meta-key">Liquidity</span>
            <span className="token-meta-val">{token.liquidityFormatted}</span>
          </div>
          <div className="token-meta-cell">
            <span className="token-meta-key">Market Cap</span>
            <span className="token-meta-val">{token.marketCapFormatted}</span>
          </div>
          <div className="token-meta-cell">
            <span className="token-meta-key">FDV</span>
            <span className="token-meta-val">{token.fdvFormatted}</span>
          </div>
        </div>
        <Link href={bagsUrl} target="_blank" rel="noopener noreferrer" className="token-buy-btn">
          Buy on Bags <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

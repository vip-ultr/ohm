"use client";

import Link from "next/link";
import { Twitter, Github, MessageCircle } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";

// Replace with actual Ohm contract address when deployed
const CONTRACT_ADDRESS = "OHMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const SHORT_CA = `${CONTRACT_ADDRESS.slice(0, 8)}…${CONTRACT_ADDRESS.slice(-6)}`;

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Left: Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-logo-icon">Ω</div>
            <span className="footer-logo-text">Ohm</span>
          </div>
          <div className="footer-slogan">Detect. Analyze. Act.</div>
        </div>

        {/* Center: Contract + Socials */}
        <div className="footer-center">
          <div className="footer-ca-label">Contract Address</div>
          <div className="footer-ca">
            <span className="footer-ca-addr">{SHORT_CA}</span>
            <CopyButton text={CONTRACT_ADDRESS} size={13} />
          </div>

          <div className="footer-socials">
            <Link
              href="https://twitter.com/ohm_markets"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Twitter / X"
            >
              <Twitter size={18} />
            </Link>
            <Link
              href="https://github.com/vip-ultr/ohm"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="GitHub"
            >
              <Github size={18} />
            </Link>
            <Link
              href="https://discord.gg/ohm"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Discord"
            >
              <MessageCircle size={18} />
            </Link>
          </div>
        </div>

        {/* Right: Powered by Solana */}
        <div className="footer-right">
          <div className="powered-by">Powered by</div>
          <div className="powered-sol">
            ◎ SOL<span>ANA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

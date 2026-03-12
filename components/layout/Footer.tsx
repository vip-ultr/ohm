"use client";

import Link from "next/link";
import { FaGithub, FaXTwitter, FaDiscord } from "react-icons/fa6";
import { SiSolana } from "react-icons/si";
import { AlertCircle, Code2 } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";

const CONTRACT_ADDRESS = "2xQcYitABjwjVEc5Z5zZ97N33BhGD27zNWUhv2Q7pump";
const SHORT_CA = `${CONTRACT_ADDRESS.slice(0, 4)}...${CONTRACT_ADDRESS.slice(-4)}`;

function Divider() {
  return <span className="footer-divider">|</span>;
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bar">

        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-logo-icon">Ω</span>
          <span className="footer-logo-text">Ohm</span>
          <Divider />
          <span className="footer-tagline">Token Analytics Model</span>
        </div>

        {/* Contract address */}
        <div className="footer-ca">
          <span className="footer-ca-addr">{SHORT_CA}</span>
          <CopyButton text={CONTRACT_ADDRESS} size={12} />
        </div>

        <Divider />

        {/* Social icons */}
        <div className="footer-socials">
          <Link href="https://github.com/vip-ultr/ohm" target="_blank" rel="noopener noreferrer" className="footer-icon-link" aria-label="GitHub">
            <FaGithub size={18} />
          </Link>
          <Link href="https://twitter.com/ohm_markets" target="_blank" rel="noopener noreferrer" className="footer-icon-link" aria-label="X / Twitter">
            <FaXTwitter size={17} />
          </Link>
          <Link href="https://discord.gg/ohm" target="_blank" rel="noopener noreferrer" className="footer-icon-link" aria-label="Discord">
            <FaDiscord size={18} />
          </Link>
        </div>

        <Divider />

        {/* Utility links */}
        <Link href="/docs" className="footer-text-link">
          <Code2 size={15} />
          developers
        </Link>

        <Divider />

        <Link href="https://github.com/vip-ultr/ohm/issues/new" target="_blank" rel="noopener noreferrer" className="footer-text-link">
          <AlertCircle size={15} />
          report bug
        </Link>

        <Divider />

        {/* Powered by Solana */}
        <div className="footer-powered">
          <span className="footer-powered-label">powered by</span>
          <SiSolana size={16} className="footer-sol-icon" />
          <span className="footer-sol-text">solana</span>
        </div>

      </div>
    </footer>
  );
}

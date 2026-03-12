"use client";

import { CheckCircle } from "lucide-react";

interface LaunchpadOption {
  id: string;
  name: string;
}

const LAUNCHPADS: LaunchpadOption[] = [
  { id: "bags.fm", name: "Bags.fm" },
];

interface LaunchpadSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export default function LaunchpadSelector({ value, onChange }: LaunchpadSelectorProps) {
  return (
    <div className="launchpad-selector">
      <span style={{ fontSize: 12, color: "var(--text3)", marginRight: 4 }}>
        Launchpad:
      </span>
      {LAUNCHPADS.map((lp) => (
        <button
          key={lp.id}
          className={`launchpad-chip ${value === lp.id ? "active" : ""}`}
          onClick={() => onChange(lp.id)}
          style={value !== lp.id ? { background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text2)" } : undefined}
        >
          <CheckCircle size={13} />
          {lp.name}
        </button>
      ))}
    </div>
  );
}

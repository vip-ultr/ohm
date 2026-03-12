"use client";

import type { Timeframe } from "@/types";

const TIMEFRAMES: Timeframe[] = ["1H", "24H", "7D", "30D"];

interface TimeframeFilterProps {
  value: Timeframe;
  onChange: (tf: Timeframe) => void;
}

export default function TimeframeFilter({ value, onChange }: TimeframeFilterProps) {
  return (
    <div className="timeframe-filter">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={`time-btn ${value === tf ? "active" : ""}`}
          onClick={() => onChange(tf)}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useTokenOHLCV } from "@/hooks/useTokenData";
import type { ChartTimeframe } from "@/types";
import { useAppTheme } from "@/hooks/useTheme";

const TIMEFRAMES: ChartTimeframe[] = ["1H", "24H", "30D"];

interface PriceChartProps {
  address: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyChart = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySeries = any;

export default function PriceChart({ address }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<AnyChart>(null);
  const seriesRef = useRef<AnySeries>(null);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("24H");
  const { isDark } = useAppTheme();

  const { data: ohlcv } = useTokenOHLCV(address, timeframe);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    import("lightweight-charts").then((lc) => {
      if (!containerRef.current) return;

      const chartOptions = {
        layout: {
          background: { color: "transparent" },
          textColor: isDark ? "#555555" : "#888888",
        },
        grid: {
          vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
          horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
        },
        crosshair: { mode: 1 },
        rightPriceScale: {
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)",
        },
        timeScale: {
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)",
          timeVisible: true,
        },
        width: containerRef.current.offsetWidth,
        height: 300,
        handleScroll: true,
        handleScale: true,
      };

      // Cast to any to avoid type mismatch between v4/v5 APIs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chart: any = lc.createChart(containerRef.current, chartOptions);
      chartRef.current = chart;

      // lightweight-charts v5 API: addSeries with AreaSeries
      const series = chart.addSeries(lc.AreaSeries, {
        topColor: "rgba(3, 163, 56, 0.3)",
        bottomColor: "rgba(3, 163, 56, 0)",
        lineColor: "#03A338",
        lineWidth: 2,
      });
      seriesRef.current = series;

      // Responsive resize
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.offsetWidth,
          });
        }
      });
      ro.observe(containerRef.current);

      cleanup = () => {
        ro.disconnect();
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    });

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { color: "transparent" },
        textColor: isDark ? "#555555" : "#888888",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
      },
    });
  }, [isDark]);

  // Update data when ohlcv changes
  useEffect(() => {
    if (!seriesRef.current || !ohlcv?.length) return;

    const chartData = ohlcv
      .filter((p) => p.time && p.value !== undefined)
      .map((p) => ({ time: p.time as number, value: p.value ?? p.close }))
      .sort((a, b) => a.time - b.time);

    // Deduplicate timestamps (required by lightweight-charts)
    const seen = new Set<number>();
    const deduped = chartData.filter((p) => {
      if (seen.has(p.time)) return false;
      seen.add(p.time);
      return true;
    });

    if (deduped.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesRef.current.setData(deduped as any);
      chartRef.current?.timeScale().fitContent();
    }
  }, [ohlcv]);

  return (
    <div className="chart-section">
      <div className="chart-header">
        <div className="chart-title">
          <span className="live-dot" />
          Price Chart
        </div>
        <div className="timeframe-filter">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`time-btn ${timeframe === tf ? "active" : ""}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} style={{ width: "100%", minHeight: 300 }} />

      {(!ohlcv || ohlcv.length === 0) && (
        <div
          style={{
            textAlign: "center",
            color: "var(--text3)",
            fontSize: 13,
            padding: "20px 0",
          }}
        >
          No price data available for this timeframe
        </div>
      )}
    </div>
  );
}

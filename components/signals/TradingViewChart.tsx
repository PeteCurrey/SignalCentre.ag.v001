"use client";

// ============================================================
// components/signals/TradingViewChart.tsx
// TradingView Advanced Charts Widget + Autochartist SDK Injection
// ============================================================

import { useEffect, useRef, useState } from "react";

interface TradingViewChartProps {
  symbol: string;
}

// Ensure TypeScript knows about TradingView global
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TradingView: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    autochartist?: any;
  }
}

export function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const [acStatus, setAcStatus] = useState<"pending" | "loaded" | "failed">("pending");

  // Format symbol for TradingView (e.g. EURUSD -> FX:EURUSD or BINANCE:BTCUSDT)
  // Simple heuristic for demo:
  const getTvSymbol = (sym: string) => {
    if (sym.includes("BTC") || sym.includes("ETH") || sym.includes("SOL")) {
      return `BINANCE:${sym}`;
    }
    // Default to FX_IDC for forex
    return `FX_IDC:${sym}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const containerId = `tv_chart_${symbol}`;
    containerRef.current.id = containerId;

    let widget: any = null;

    const initChart = () => {
      if (typeof window.TradingView === "undefined") return;

      widget = new window.TradingView.widget({
        autosize: true,
        symbol: getTvSymbol(symbol),
        interval: "60",
        timezone: "Etc/UTC",
        theme: "light", // Strictly following platform corporate design
        style: "1",     // Candlesticks
        locale: "en",
        enable_publishing: false,
        backgroundColor: "#ffffff",
        gridColor: "#e0dfdb",
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: containerId,
        toolbar_bg: "#fafaf8",
        onChartReady: () => {
          setChartReady(true);
        }
      });
    };

    // Load TradingView Script
    if (!document.getElementById("tv-script")) {
      const script = document.createElement("script");
      script.id = "tv-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initChart;
      document.body.appendChild(script);
    } else {
      // If already loaded
      initChart();
    }

    return () => {
      if (widget && typeof widget.remove === "function") {
        widget.remove();
      }
    };
  }, [symbol]);

  // Inject Autochartist SDK once chart is ready
  useEffect(() => {
    if (!chartReady) return;

    const injectAutochartist = async () => {
      try {
        // In a real scenario, this is the URL provided by Autochartist
        const AC_SCRIPT_URL = "https://component.autochartist.com/tv/plugin.js";
        
        // Mock injection for phase 1 development
        // We simulate loading the script, but deliberately fail if no real keys
        const appId = process.env.NEXT_PUBLIC_AUTOCHARTIST_APP_ID;
        
        if (!appId || appId.includes("your_autochartist")) {
          console.warn("[Autochartist SDK] No valid credentials found. Skipping SDK injection overlay. Falling back to REST API data.");
          setAcStatus("failed");
          return;
        }

        // Standard script injection pattern for third-party plugins
        const script = document.createElement("script");
        script.src = AC_SCRIPT_URL;
        script.async = true;
        
        script.onload = () => {
          // Initialize plugin on the TradingView widget instance
          // window.autochartist.init({ widget: widgetInstance, credentials: {...} })
          setAcStatus("loaded");
        };

        script.onerror = () => {
          console.error("[Autochartist SDK] Failed to load plugin script.");
          setAcStatus("failed");
        };

        document.head.appendChild(script);

      } catch (err) {
        console.error("[Autochartist SDK] Initialization error:", err);
        setAcStatus("failed");
      }
    };

    injectAutochartist();
  }, [chartReady]);

  return (
    <div style={{
      width: "100%",
      height: 500,
      border: "1px solid var(--border)",
      backgroundColor: "var(--bg-base)",
      position: "relative",
    }}>
      {/* Chart Container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Autochartist Status Overlay Indicator */}
      <div style={{
        position: "absolute",
        bottom: 10,
        right: 10,
        backgroundColor: "var(--bg-base)",
        border: "1px solid var(--border)",
        padding: "4px 8px",
        fontSize: "0.625rem",
        fontFamily: "var(--font-mono)",
        color: acStatus === "loaded" ? "var(--green)" : "var(--text-disabled)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        pointerEvents: "none",
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: acStatus === "loaded" ? "var(--green)" : "var(--text-disabled)",
        }} />
        AC OVERLAY: {acStatus.toUpperCase()}
      </div>
    </div>
  );
}

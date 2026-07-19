"use client";
import { useEffect, useRef } from "react";

export default function TradingViewChart({ symbol, interval }: { symbol: string; interval: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map to TV symbols roughly
  const mappedSymbol = symbol === "EUR/USD" ? "FX:EURUSD" 
    : symbol === "GBP/JPY" ? "FX:GBPJPY"
    : symbol === "XAU/USD" ? "OANDA:XAUUSD"
    : symbol === "BTC/USD" ? "BINANCE:BTCUSDT"
    : `FX:${symbol.replace("/", "")}`;

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear the container in case of re-mount
    containerRef.current.innerHTML = "";
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== "undefined") {
        new window.TradingView.widget({
          autosize: true,
          symbol: mappedSymbol,
          interval: interval || "60",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_top_toolbar: false,
          toolbar_bg: "#ffffff",
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current?.id,
          studies: ["Volume@tv-basicstudies"]
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // document.body.removeChild(script);
    };
  }, [mappedSymbol, interval]);

  return <div id="tv_chart_container" ref={containerRef} style={{ height: "380px", width: "100%" }} />;
}

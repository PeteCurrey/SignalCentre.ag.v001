"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";
import type { DailyPoint } from "@/lib/performance-client";

interface WinRateChartProps {
  data: DailyPoint[];
}

export function WinRateChart({ data }: WinRateChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#737b84",
      },
      grid: {
        vertLines: { color: "#e0dfdb" },
        horzLines: { color: "#e0dfdb" },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
        // Fixed scale for percentage
        mode: 1, // PriceScaleMode.Normal
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: {
          color: "#12263a",
          width: 1,
          style: 3, // LineStyle.Dashed
          labelVisible: true,
        },
      },
      handleScroll: false,
      handleScale: false,
    });
    
    // Explicitly set the price range for percentages (0-100)
    chart.priceScale("right").applyOptions({
        autoScale: false,
        scaleMargins: {
            top: 0.1,
            bottom: 0.1,
        },
    });

    const series = (chart as any).addAreaSeries({
      lineColor: "#12263a",
      topColor: "rgba(18, 38, 58, 0.1)",
      bottomColor: "rgba(18, 38, 58, 0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${price.toFixed(1)}%`,
      },
      autoscaleInfoProvider: () => ({
        priceRange: {
            minValue: 0,
            maxValue: 100,
        },
        margins: {
            above: 10,
            below: 10,
        }
      })
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    // Format data for lightweight-charts
    const chartData = data.map((d) => ({
      time: d.date,
      value: d.win_rate,
    }));

    seriesRef.current.setData(chartData);
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: "100%", height: 300 }} />;
}

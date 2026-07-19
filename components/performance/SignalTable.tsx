"use client";

import React, { useState, useEffect } from "react";
import { Download, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { ArchiveRow, ArchivePage, ArchiveFilters } from "@/lib/performance-client";
import type { AssetClass, SignalOutcome } from "@/lib/supabase/types";

export function SignalTable() {
  const [data, setData] = useState<ArchivePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ArchiveFilters>({ page: 1, limit: 20 });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.page) params.set("page", filters.page.toString());
        if (filters.limit) params.set("limit", filters.limit.toString());
        if (filters.asset_class) params.set("asset_class", filters.asset_class);
        if (filters.outcome) params.set("outcome", filters.outcome);
        if (filters.timeframe) params.set("timeframe", filters.timeframe);

        const res = await fetch(`/api/signal-archive?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters]);

  const handleExportCSV = () => {
    if (!data?.data.length) return;
    
    const headers = ["Date", "Symbol", "Class", "Direction", "DCS", "Entry", "SL", "TP", "Outcome", "R:R"];
    const rows = data.data.map((r) => [
      r.date,
      r.symbol,
      r.asset_class,
      r.direction,
      r.dcs.toString(),
      r.entry,
      r.sl,
      r.tp,
      r.outcome,
      r.rr?.toString() ?? "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `signal_archive_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setFilter = (key: keyof ArchiveFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 })); // reset page on filter change
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Filters Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-4)",
          padding: "var(--space-3)",
          backgroundColor: "var(--bg-stone)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={16} color="var(--text-muted)" />
          
          <select
            value={filters.asset_class ?? ""}
            onChange={(e) => setFilter("asset_class", e.target.value || undefined)}
            style={{
              padding: "4px 8px",
              fontSize: "0.875rem",
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Assets</option>
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="indices">Indices</option>
            <option value="commodities">Commodities</option>
          </select>

          <select
            value={filters.outcome ?? ""}
            onChange={(e) => setFilter("outcome", e.target.value || undefined)}
            style={{
              padding: "4px 8px",
              fontSize: "0.875rem",
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Outcomes</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={filters.timeframe ?? ""}
            onChange={(e) => setFilter("timeframe", e.target.value || undefined)}
            style={{
              padding: "4px 8px",
              fontSize: "0.875rem",
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Timeframes</option>
            <option value="M15">M15</option>
            <option value="H1">H1</option>
            <option value="H4">H4</option>
            <option value="D1">D1</option>
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!data?.data.length}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "4px 12px",
            fontSize: "0.875rem",
            backgroundColor: "var(--navy)",
            color: "white",
            border: "none",
            cursor: "pointer",
            opacity: data?.data.length ? 1 : 0.5,
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-stone)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>Date</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>Instrument</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>Direction</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>DCS</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>Entry</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>SL</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>TP</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>Outcome</th>
              <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text-secondary)" }}>R:R</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading signals...
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)" }}>
                  No signals found matching criteria.
                </td>
              </tr>
            ) : (
              data?.data.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
                  <td style={{ padding: "var(--space-3)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {row.date}
                  </td>
                  <td style={{ padding: "var(--space-3)", fontWeight: 500 }}>{row.symbol}</td>
                  <td style={{ padding: "var(--space-3)" }}>
                    <span
                      style={{
                        color: row.direction === "bullish" ? "var(--green)" : "var(--burgundy)",
                        textTransform: "capitalize",
                      }}
                    >
                      {row.direction}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span>{row.dcs}</span>
                      <div
                        style={{
                          width: 4,
                          height: 12,
                          backgroundColor: row.dcs >= 75 ? "var(--green)" : row.dcs >= 50 ? "var(--accent)" : "var(--burgundy)",
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>{row.entry}</td>
                  <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>{row.sl}</td>
                  <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>{row.tp}</td>
                  <td style={{ padding: "var(--space-3)" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        backgroundColor:
                          row.outcome === "win"
                            ? "rgba(35, 134, 54, 0.1)"
                            : row.outcome === "loss"
                            ? "rgba(186, 26, 26, 0.1)"
                            : "var(--bg-stone)",
                        color:
                          row.outcome === "win"
                            ? "var(--green)"
                            : row.outcome === "loss"
                            ? "var(--burgundy)"
                            : "var(--text-muted)",
                      }}
                    >
                      {row.outcome}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>
                    {row.rr ? `1:${row.rr.toFixed(1)}` : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) 0" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button
              onClick={() => setFilter("page", data.page - 1)}
              disabled={data.page === 1}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                backgroundColor: "var(--bg-stone)",
                border: "1px solid var(--border)",
                cursor: data.page === 1 ? "not-allowed" : "pointer",
                opacity: data.page === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setFilter("page", data.page + 1)}
              disabled={data.page === data.totalPages}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                backgroundColor: "var(--bg-stone)",
                border: "1px solid var(--border)",
                cursor: data.page === data.totalPages ? "not-allowed" : "pointer",
                opacity: data.page === data.totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

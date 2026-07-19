"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import type { Alert } from "@/lib/supabase/types";

interface AlertListProps {
  alerts: Alert[];
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function AlertList({ alerts, onToggle, onDelete }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)" }}>
        No active alerts. Create one above.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {alerts.map(alert => (
        <div key={alert.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4)", backgroundColor: "var(--bg-base)", border: `1px solid ${alert.active ? 'var(--border)' : 'var(--bg-stone)'}`, opacity: alert.active ? 1 : 0.6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontWeight: 600, fontSize: "1.125rem" }}>{alert.instrument}</span>
              <span style={{ fontSize: "0.75rem", padding: "2px 6px", backgroundColor: "var(--bg-stone)", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                {alert.condition_type.replace("_", " ")}
              </span>
              {alert.threshold && (
                <span style={{ fontSize: "0.875rem", fontFamily: "var(--font-mono)", color: "var(--navy)" }}>
                  {alert.threshold}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>Channels: {alert.notification_channels.join(", ")}</span>
              {alert.last_triggered_at && (
                <span>Last fired: {new Date(alert.last_triggered_at).toLocaleString()}</span>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.875rem", color: alert.active ? "var(--green)" : "var(--text-muted)" }}>
              <input 
                type="checkbox" 
                checked={alert.active} 
                onChange={(e) => onToggle(alert.id, e.target.checked)} 
                style={{ cursor: "pointer" }}
              />
              {alert.active ? "Active" : "Paused"}
            </label>
            <button 
              onClick={() => onDelete(alert.id)}
              style={{ background: "none", border: "none", color: "var(--burgundy)", cursor: "pointer", padding: "4px" }}
              title="Delete alert"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

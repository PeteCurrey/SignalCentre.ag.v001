"use client";

import React, { useState } from "react";
import { Bell, Mail, Webhook, Loader2 } from "lucide-react";

interface AlertFormProps {
  onCreated: () => void;
}

export function AlertForm({ onCreated }: AlertFormProps) {
  const [instrument, setInstrument] = useState("EURUSD");
  const [condition, setCondition] = useState("dcs_above");
  const [threshold, setThreshold] = useState("75");
  const [channels, setChannels] = useState({ email: true, browser: false, webhook: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const activeChannels = Object.entries(channels)
        .filter(([_, active]) => active)
        .map(([key]) => key);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument,
          condition_type: condition,
          threshold: parseFloat(threshold),
          notification_channels: activeChannels
        })
      });
      if (res.ok) {
        onCreated();
        setInstrument("EURUSD");
        setCondition("dcs_above");
        setThreshold("75");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", backgroundColor: "var(--bg-stone)", padding: "var(--space-6)", border: "1px solid var(--border)" }}>
      <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Create New Alert</h3>
      
      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Instrument</label>
          <select value={instrument} onChange={e => setInstrument(e.target.value)} style={{ padding: "8px", backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="BTCUSD">BTC/USD</option>
            <option value="US30">US30</option>
            <option value="XAUUSD">Gold (XAU/USD)</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Condition</label>
          <select value={condition} onChange={e => setCondition(e.target.value)} style={{ padding: "8px", backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <option value="dcs_above">DCS crosses above</option>
            <option value="price_level">Price hits level</option>
            <option value="direction_change">Direction flips</option>
            <option value="new_pattern">New chart pattern</option>
          </select>
        </div>

        {(condition === "dcs_above" || condition === "price_level") && (
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Threshold</label>
            <input type="number" step="any" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ padding: "8px", backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Delivery Channels</label>
        <div style={{ display: "flex", gap: "var(--space-4)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={channels.email} onChange={e => setChannels(p => ({...p, email: e.target.checked}))} />
            <Mail size={16} /> Email
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={channels.webhook} onChange={e => setChannels(p => ({...p, webhook: e.target.checked}))} />
            <Webhook size={16} /> Webhook
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={channels.browser} onChange={e => setChannels(p => ({...p, browser: e.target.checked}))} />
            <Bell size={16} /> Browser Push
          </label>
        </div>
      </div>

      <button type="submit" disabled={saving} style={{ alignSelf: "flex-start", marginTop: "var(--space-2)", padding: "8px 16px", backgroundColor: "var(--navy)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "0.875rem" }}>
        {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
        Create Alert
      </button>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}

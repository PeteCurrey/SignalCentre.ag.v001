"use client";

import React, { useState, useEffect } from "react";
import { AlertForm } from "@/components/alerts/AlertForm";
import { AlertList } from "@/components/alerts/AlertList";
import { Webhook, Activity } from "lucide-react";
import type { Alert } from "@/lib/supabase/types";

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testingHook, setTestingHook] = useState(false);
  const [hookStatus, setHookStatus] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        setAlerts(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleToggle = async (id: string, active: boolean) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active } : a));
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active })
    });
  };

  const handleDelete = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
  };

  const testWebhook = async () => {
    if (!webhookUrl) return;
    setTestingHook(true);
    setHookStatus("");
    try {
      const res = await fetch("/api/alerts/webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl })
      });
      if (res.ok) setHookStatus("Test payload delivered successfully.");
      else setHookStatus("Delivery failed. Check endpoint.");
    } catch {
      setHookStatus("Network error occurred.");
    } finally {
      setTestingHook(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-base)", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-warm)", padding: "var(--space-10)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 500, margin: "0 0 var(--space-2) 0" }}>Custom Alerts</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Automated notifications for high-conviction setups. Pushed directly to your email, browser, or custom webhook.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
        
        <AlertForm onCreated={fetchAlerts} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Activity size={20} color="var(--navy)" />
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Active Rules</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)" }}>Loading alerts...</div>
          ) : (
            <AlertList alerts={alerts} onToggle={handleToggle} onDelete={handleDelete} />
          )}
        </div>

        <hr style={{ border: 0, borderBottom: "1px solid var(--border)", margin: "var(--space-4) 0" }} />

        {/* Webhook Configuration */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", backgroundColor: "var(--bg-stone)", padding: "var(--space-6)", border: "1px dashed var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Webhook size={20} color="var(--navy)" />
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Global Webhook Endpoint</h3>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
            Configure a global URL to receive JSON payloads when alerts trigger. Use this to integrate Signal Centre into your automated trading scripts or Discord/Slack bots.
          </p>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <input 
              type="url" 
              placeholder="https://your-endpoint.com/webhook"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              style={{ flex: 1, padding: "8px", backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button 
              onClick={testWebhook}
              disabled={testingHook || !webhookUrl}
              style={{ padding: "8px 16px", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: webhookUrl ? "pointer" : "not-allowed", opacity: webhookUrl ? 1 : 0.5 }}
            >
              {testingHook ? "Testing..." : "Send Test"}
            </button>
          </div>
          {hookStatus && <span style={{ fontSize: "0.875rem", color: hookStatus.includes("success") ? "var(--green)" : "var(--burgundy)" }}>{hookStatus}</span>}
        </div>

      </div>
    </div>
  );
}

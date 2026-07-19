"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import type { Notification } from "@/lib/supabase/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  
  // Note: in a real app, this would use Supabase real-time subscriptions
  // For now, we fetch on mount and mock a few
  useEffect(() => {
    // We don't have a GET notifications route yet, so mock it for UI demonstration
    setNotifications([
      { id: "1", user_id: "mock", alert_id: null, message: "EURUSD DCS reached 85 — BULLISH", signal_id: "123", sent_at: new Date().toISOString(), read_at: null, delivery_status: null },
      { id: "2", user_id: "mock", alert_id: null, message: "BTCUSD Price hit 65000", signal_id: "456", sent_at: new Date(Date.now() - 3600000).toISOString(), read_at: null, delivery_status: null }
    ]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          padding: "var(--space-2)", 
          position: "relative",
          color: "var(--text-secondary)"
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: 4,
            right: 4,
            backgroundColor: "var(--burgundy)",
            color: "white",
            fontSize: "0.625rem",
            fontWeight: "bold",
            padding: "2px 5px",
            borderRadius: "10px",
            minWidth: 16,
            textAlign: "center"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          width: 320,
          backgroundColor: "var(--bg-base)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          maxHeight: 400,
          overflowY: "auto"
        }}>
          <div style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: "0.875rem" }}>Notifications</h4>
            <Link href="/dashboard/alerts" style={{ fontSize: "0.75rem", color: "var(--navy)", textDecoration: "none" }} onClick={() => setOpen(false)}>
              Settings
            </Link>
          </div>
          
          {notifications.length === 0 ? (
            <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No notifications
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ 
                padding: "var(--space-3)", 
                borderBottom: "1px solid var(--border)",
                backgroundColor: n.read_at ? "transparent" : "var(--bg-stone)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-1)"
              }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{n.message}</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  {new Date(n.sent_at).toLocaleTimeString()}
                </span>
                {n.signal_id && (
                  <Link href={`/signals/detail?id=${n.signal_id}`} style={{ fontSize: "0.75rem", color: "var(--navy)", textDecoration: "none", marginTop: 4 }}>
                    View Signal →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

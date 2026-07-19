"use client";

import { Share, Star } from "lucide-react";

export default function ClientActions() {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Signal Centre Analysis",
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard");
    }
  };

  const handleWatchlist = () => {
    // optimistic toggle
    alert("Added to Watchlist (Mock)");
  };

  return (
    <div style={{ display: "flex", gap: "var(--space-4)" }}>
      <button 
        onClick={handleShare}
        style={{ 
          display: "flex", alignItems: "center", gap: 6, 
          padding: "6px 12px", border: "1px solid var(--border)", 
          backgroundColor: "var(--bg-base)", cursor: "pointer",
          fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em"
        }}
      >
        <Share size={14} /> SHARE
      </button>
      <button 
        onClick={handleWatchlist}
        style={{ 
          display: "flex", alignItems: "center", gap: 6, 
          padding: "6px 12px", border: "1px solid var(--border)", 
          backgroundColor: "var(--bg-base)", cursor: "pointer",
          fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em"
        }}
      >
        <Star size={14} /> WATCHLIST
      </button>
    </div>
  );
}

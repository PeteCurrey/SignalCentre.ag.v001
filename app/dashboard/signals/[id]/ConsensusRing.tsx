"use client";
import { useEffect, useState } from "react";

export default function ConsensusRing({ score }: { score: number }) {
  const [offset, setOffset] = useState(251); // 2 * pi * 40 approx 251

  useEffect(() => {
    // Animate on mount
    const timeout = setTimeout(() => {
      const percentage = score / 100;
      const newOffset = 251 - (percentage * 251);
      setOffset(newOffset);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="80" height="80" viewBox="0 0 100 100" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        {/* Background track */}
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="8" />
        {/* Filled ring */}
        <circle 
          cx="50" cy="50" r="40" fill="transparent" 
          stroke="var(--navy)" strokeWidth="8" 
          strokeDasharray="251" 
          strokeDashoffset={offset} 
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div style={{ zIndex: 1, textAlign: "center" }}>
        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--navy)", fontFamily: "var(--font-mono)" }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

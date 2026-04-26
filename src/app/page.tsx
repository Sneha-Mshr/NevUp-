"use client";

import { useState } from "react";
import { SEED_TRADERS, type TraderInfo } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import styles from "./page.module.css";

export default function Home() {
  const [selectedTrader, setSelectedTrader] = useState<TraderInfo | null>(null);

  if (selectedTrader) {
    return (
      <Dashboard
        trader={selectedTrader}
        onBack={() => setSelectedTrader(null)}
      />
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.logo}>
          <span className={styles.logoIcon}>◈</span> NevUp
        </h1>
        <p className={styles.subtitle}>Trading Psychology Coach</p>
      </header>

      <section className={styles.traderGrid} role="list" aria-label="Select a trader">
        {SEED_TRADERS.map((trader) => (
          <button
            key={trader.userId}
            className={styles.traderCard}
            onClick={() => setSelectedTrader(trader)}
            role="listitem"
            aria-label={`Select ${trader.name}`}
          >
            <div className={styles.avatar}>
              {trader.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className={styles.traderInfo}>
              <span className={styles.traderName}>{trader.name}</span>
              {trader.pathology ? (
                <span className={styles.pathology}>
                  {trader.pathology.replace(/_/g, " ")}
                </span>
              ) : (
                <span className={styles.control}>control profile</span>
              )}
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}

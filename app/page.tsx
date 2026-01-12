"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { minikitConfig } from "../minikit.config";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* Stars Background */}
      <div className={styles.stars}></div>
      <div className={styles.stars2}></div>
      <div className={styles.stars3}></div>

      {/* Wave Background */}
      <div className={styles.wave}>
        <div className={styles.waveSpan}></div>
        <div className={styles.waveSpan}></div>
        <div className={styles.waveSpan}></div>
      </div>

      <button className={styles.closeButton} type="button">
        ✕
      </button>

      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>MiddleKid</h1>

          <p className={styles.subtitle}>
            Your first friend in the world of crypto 🚀<br />
            Learn, analyze, and grow with confidence on Base.
          </p>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3>Wallet Analyzer</h3>
              <p>Connect your wallet to see your tokens, DeFi positions, and get a health score</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔎</div>
              <h3>Address Lookup</h3>
              <p>Search any wallet or contract address to detect scams and analyze holdings</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3>Bot Detection</h3>
              <p>Find out if a wallet is controlled by a bot or real human</p>
            </div>
          </div>

          <Link href="/analyzer" className={styles.launchButton}>
            Launch MiddleKid
          </Link>
        </div>
      </div>
    </div>
  );
}

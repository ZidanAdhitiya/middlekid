"use client";

import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import styles from "./page.module.css";

export default function TimeTravellerPage() {
    return (
        <div className={styles.container}>
            {/* Navbar Background */}
            <div className={styles.navbar}></div>

            {/* Stars Background */}
            <div className={styles.stars}></div>
            <div className={styles.stars2}></div>
            <div className={styles.stars3}></div>

            {/* Logo */}
            <Logo />

            {/* Navigation */}
            <Navigation />

            {/* Centered Title - Fixed at Top */}
            <div className={styles.header}>
                <h1 className={styles.title}>Time Traveller</h1>
            </div>

            {/* Content */}
            <div className={styles.contentWrapper}>
                <div className={styles.comingSoon}>
                    <div className={styles.icon}>🚧</div>
                    <h2 className={styles.comingSoonTitle}>Under Development</h2>
                    <p className={styles.comingSoonText}>
                        The Time Traveller module enables price contracts based on historical data.
                        Buy or sell crypto at prices from the past within your contract duration.
                    </p>
                    <p className={styles.comingSoonSubtext}>
                        <strong>How it works:</strong> Purchase a contract (e.g., 90 days) to lock in historical prices.
                        If Solana is up on day 88, you can still buy at the price from 88 days ago.
                        After 90 days, the contract expires. Perfect for strategic trading based on historical trends!
                    </p>

                    <a
                        href="https://app.gitbook.com/o/kPdY7vBe3AzKgFA1pn4h/s/XNAsDhibqyfBy41OEGyg/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.docsButton}
                    >
                        📖 Read Documentation
                    </a>
                </div>
            </div>
        </div>
    );
}

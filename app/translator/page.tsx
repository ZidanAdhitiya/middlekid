"use client";

import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import styles from "./page.module.css";

export default function TranslatorPage() {
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
                <h1 className={styles.title}>Translator</h1>
            </div>

            {/* Content */}
            <div className={styles.contentWrapper}>
                <div className={styles.comingSoon}>
                    <div className={styles.icon}>🚧</div>
                    <h2 className={styles.comingSoonTitle}>Under Development</h2>
                    <p className={styles.comingSoonText}>
                        The Translator module is currently being built. This feature will decode complex
                        blockchain transactions into human-readable explanations.
                    </p>
                    <p className={styles.comingSoonSubtext}>
                        Coming soon: Transaction breakdown, smart contract interaction analysis, and more!
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

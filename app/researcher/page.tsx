"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import ResearchResults from "../components/ResearchResults";
import styles from "./page.module.css";

interface ResearchResult {
    type: "token" | "wallet" | "contract";
    address: string;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    flags: any[];
    metadata: any;
    analysis: {
        security?: any;
        market?: {
            liquidity?: number;
            volume24h?: number;
            priceUsd?: string;
            fdv?: number;
        };
        hasLiquidity?: boolean;
        securityScore?: number;
        marketScore?: number;
        metadataScore?: number;
    };
}

export default function ResearcherPage() {
    const [inputAddress, setInputAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResearchResult | null>(null);

    async function handleResearch() {
        if (!inputAddress.trim()) {
            setError("Please enter an address");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/research?type=token&address=${inputAddress.trim()}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to research address");
            }

            setResult(data);
        } catch (err: any) {
            console.error("Research error:", err);
            setError(err.message);
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    function handleNewSearch() {
        setResult(null);
        setInputAddress("");
        setError(null);
    }

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
                <h1 className={styles.title}>Researcher</h1>
            </div>

            {/* Content */}
            <div className={styles.contentWrapper}>
                {!result ? (
                    <div className={styles.emptyState} key="search-form">
                        {/* Development Warning */}
                        <div className={styles.devWarning}>
                            ⚠️ <strong>Early Access:</strong> Some features may not work as expected and results may not be fully accurate. We're actively improving the system.
                        </div>

                        <div className={styles.emptyIcon}>🔬</div>
                        <h2 className={styles.emptyTitle}>Multi-Source Research Tool</h2>
                        <p className={styles.emptyText}>
                            Analyze tokens using GoPlusLabs security scans + DEX liquidity data
                        </p>

                        <div className={styles.inputSection}>
                            <input
                                type="text"
                                placeholder="Enter token address (0x...)"
                                value={inputAddress}
                                onChange={(e) => setInputAddress(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && !loading && handleResearch()}
                                className={styles.input}
                                disabled={loading}
                            />
                            <button
                                onClick={handleResearch}
                                disabled={loading}
                                className={styles.analyzeButton}
                            >
                                {loading ? "Scanning..." : "Research"}
                            </button>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                <span className={styles.errorIcon}>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>🔒</div>
                                <h3>Security Scan</h3>
                                <p>Honeypot detection, tax analysis, owner privileges via GoPlusLabs</p>
                            </div>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>💧</div>
                                <h3>Liquidity Check</h3>
                                <p>Real-time market data and trading volume from DEX Screener</p>
                            </div>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>🎯</div>
                                <h3>Smart Scoring</h3>
                                <p>Weighted risk analysis: 60% security, 30% market, 10% metadata</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div key={`results-${result.address}`}>
                        <button
                            onClick={handleNewSearch}
                            className={styles.backToSearch}
                        >
                            ← New Search
                        </button>
                        <ResearchResults result={result} />
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import ResearchResults from "../components/ResearchResults";
import styles from "./page.module.css";

type SupportedChain = "base" | "ethereum" | "bsc" | "tron";

interface ResearchResult {
    type: "token" | "wallet" | "contract";
    address: string;
    riskScore: number;
    riskLevel: "low" | "medium" | "high" | "unknown";
    confidence?: "low" | "medium" | "high";
    reasons?: string[];
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
        dataCoverage?: {
            hasMetadata: boolean;
            hasSecurity: boolean;
            hasMarket: boolean;
        };
    };
}

export default function ResearcherPage() {
    const [inputAddress, setInputAddress] = useState("");
    const [chain, setChain] = useState<SupportedChain>("base");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResearchResult | null>(null);

    function validateAddress(addr: string, selectedChain: SupportedChain): boolean {
        if (selectedChain === "tron") return addr.trim() === "0";
        return /^0x[a-fA-F0-9]{40}$/.test(addr);
    }

    async function handleResearch() {
        const trimmed = inputAddress.trim();
        if (!trimmed) {
            setError("Please enter an address");
            return;
        }

        if (!validateAddress(trimmed, chain)) {
            setError(
                chain === "tron"
                    ? "For native TRX on Tron, use address '0' (as shown on CoinMarketCap)."
                    : "Invalid address format. Must start with 0x and be 42 characters long."
            );
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/research?type=token&chain=${chain}&address=${trimmed}`
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
                            <br />
                            Mau paham istilah dasar (honeypot, tax, liquidity)? Baca di{" "}
                            <Link href="/teacher" style={{ color: "rgba(147, 197, 253, 0.95)", textDecoration: "underline" }}>
                                Teacher
                            </Link>
                            .
                        </p>

                        <div className={styles.chainNote}>
                            Selected chain: <strong>{chain}</strong>
                        </div>

                        <div className={styles.inputSection}>
                            <select
                                className={styles.select}
                                value={chain}
                                onChange={(e) => {
                                    setChain(e.target.value as SupportedChain);
                                    setError(null);
                                    setResult(null);
                                }}
                                disabled={loading}
                            >
                                <option value="base">Base (EVM)</option>
                                <option value="ethereum">Ethereum (EVM)</option>
                                <option value="bsc">BSC (EVM)</option>
                                <option value="tron">Tron (native TRX only)</option>
                            </select>
                            <input
                                type="text"
                                placeholder={
                                    chain === "tron"
                                        ? "Enter token identifier (use 0 for TRX)"
                                        : "Enter token address (0x...)"
                                }
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

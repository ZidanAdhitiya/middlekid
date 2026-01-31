"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import WalletConnect from "../components/WalletConnect";
import Navigation from "../components/Navigation";
import TokenList from "../components/TokenList";
import Logo from "../components/Logo";
import styles from "./page.module.css";

interface Token {
    contractAddress: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    logo?: string;
    priceUsd?: number;
    valueUsd?: number;
    chain: string;
}

export default function AnalyzerPage() {
    const { address, isConnected } = useAccount();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manualAddress, setManualAddress] = useState("");
    const [analyzedAddress, setAnalyzedAddress] = useState<string | null>(null);
    const [totalValue, setTotalValue] = useState<string>("0");

    useEffect(() => {
        if (isConnected && address && !analyzedAddress) {
            fetchTokens(address);
        }
    }, [address, isConnected, analyzedAddress]);

    function validateAddress(addr: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(addr);
    }

    async function handleManualAnalyze() {
        const trimmedAddress = manualAddress.trim();

        if (!trimmedAddress) {
            setError("Please enter a wallet address");
            return;
        }

        if (!validateAddress(trimmedAddress)) {
            setError("Invalid address format. Address must start with 0x and be 42 characters long");
            return;
        }

        setAnalyzedAddress(trimmedAddress);
        await fetchTokens(trimmedAddress);
    }

    function handleReset() {
        setManualAddress("");
        setAnalyzedAddress(null);
        setTokens([]);
        setTotalValue("0");
        setError(null);

        if (isConnected && address) {
            fetchTokens(address);
        }
    }

    async function fetchTokens(walletAddress: string) {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/wallet/tokens?address=${walletAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch tokens");
            }

            setTokens(
                (data.tokens as any[]).map((t) => ({
                    ...t,
                    chain: t.chain || "Base",
                }))
            );
            setTotalValue(data.totalValue || "0");
        } catch (err: any) {
            console.error("Error fetching tokens:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            {/* Navbar Background */}
            <div className={styles.navbar}></div>

            {/* Logo */}
            <Logo />

            {/* Navigation */}
            <Navigation />

            {/* Stars Background - Full Width */}
            <div className={styles.stars}></div>
            <div className={styles.stars2}></div>
            <div className={styles.stars3}></div>

            {/* Centered Title - Only show during search, hide during results */}
            {!analyzedAddress && !isConnected && (
                <div className={styles.header}>
                    <h1 className={styles.title}>Wallet Analyzer</h1>
                </div>
            )}

            {/* Top-right Wallet Button - Always visible */}
            <div className={styles.walletConnectWrapper}>
                <WalletConnect />
            </div>

            {/* Content Wrapper - Centered */}
            <div className={styles.contentWrapper}>
                {!analyzedAddress && !isConnected ? (
                    /* SEARCH INTERFACE */
                    <div className={styles.emptyState}>
                        <div className={styles.devWarning}>
                            ⚠️ <strong>Early Access:</strong> Some features may not work as expected and results may not be fully accurate. We're actively improving the system.
                        </div>

                        <div className={styles.emptyIcon}>🔍</div>
                        <h2 className={styles.emptyTitle}>Analyze Any Wallet</h2>
                        <p className={styles.emptyText}>
                            Connect your wallet or enter any wallet address to analyze Base holdings and DeFi positions.
                            <br />
                            Baru mulai? Baca konsep dasar crypto di{" "}
                            <Link href="/teacher" style={{ color: "rgba(147, 197, 253, 0.95)", textDecoration: "underline" }}>
                                Teacher
                            </Link>
                            .
                        </p>

                        {/* Manual Address Input */}
                        <div className={styles.inputSection}>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Enter wallet address (0x...)"
                                    value={manualAddress}
                                    onChange={(e) => setManualAddress(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && !loading && handleManualAnalyze()}
                                    className={styles.input}
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleManualAnalyze}
                                    disabled={loading}
                                    className={styles.analyzeButton}
                                >
                                    {loading ? "Analyzing..." : "Analyze"}
                                </button>
                            </div>
                        </div>

                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>💰</div>
                                <h3>Token Analysis</h3>
                                <p>See all Base tokens and their values</p>
                            </div>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>🌊</div>
                                <h3>DeFi Positions</h3>
                                <p>Track liquidity pools and staking</p>
                            </div>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>❤️</div>
                                <h3>Wallet Health</h3>
                                <p>Get a safety score for holdings</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ANALYSIS RESULTS DASHBOARD */
                    <div className={styles.resultsView}>
                        {/* Results Page Title */}
                        <div className={styles.resultsTitle}>
                            <h1>Wallet Analysis Report</h1>
                            <p className={styles.resultsSubtitle}>Comprehensive view of holdings on Base network</p>
                        </div>

                        {/* Results Header with Back Button and Wallet Card */}
                        <div className={styles.resultsHeader}>
                            <button onClick={handleReset} className={styles.backToSearch}>
                                <span className={styles.backArrow}>←</span>
                                <span>New Analysis</span>
                            </button>

                            <div className={styles.analyzedWalletCard}>
                                <div className={styles.walletLabel}>Wallet Address</div>
                                <div className={styles.walletAddressDisplay}>
                                    {analyzedAddress || address}
                                </div>
                            </div>

                            <div className={styles.totalValueCard}>
                                <div className={styles.walletLabel}>Total Value</div>
                                <div className={styles.totalValueDisplay}>
                                    ${parseFloat(totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className={styles.error}>
                                <span className={styles.errorIcon}>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Analysis Results */}
                        <div className={styles.analysisContent}>
                            <TokenList tokens={tokens} loading={loading} />

                            {!loading && tokens.length > 0 && (
                                <div className={styles.healthScore}>
                                    <div className={styles.healthIcon}>❤️</div>
                                    <div>
                                        <h3>Wallet Health Score</h3>
                                        <p className={styles.comingSoon}>Coming soon...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

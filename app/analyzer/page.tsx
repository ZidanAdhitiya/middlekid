"use client";

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
}

export default function AnalyzerPage() {
    const { address, isConnected } = useAccount();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            fetchTokens(address);
        } else {
            setTokens([]);
            setError(null);
        }
    }, [address, isConnected]);

    async function fetchTokens(walletAddress: string) {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/wallet/tokens?address=${walletAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch tokens");
            }

            setTokens(data.tokens);
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

            {/* Centered Title - Fixed at Top */}
            <div className={styles.header}>
                <h1 className={styles.title}>Wallet Analyzer</h1>
            </div>

            {/* Top-right Wallet Button - Always visible */}
            <div className={styles.walletConnectWrapper}>
                <WalletConnect />
            </div>

            {/* Content Wrapper - Centered */}
            <div className={styles.contentWrapper}>
                {!isConnected ? (
                    <div className={styles.emptyState}>
                        {/* Development Warning */}
                        <div className={styles.devWarning}>
                            ⚠️ <strong>Early Access:</strong> Some features may not work as expected and results may not be fully accurate. We're actively improving the system.
                        </div>

                        <div className={styles.emptyIcon}>🔍</div>
                        <h2 className={styles.emptyTitle}>Connect Your Wallet</h2>
                        <p className={styles.emptyText}>
                            Connect your wallet to analyze your Base holdings, track DeFi positions, and get a health score.
                        </p>
                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>💰</div>
                                <h3>Token Analysis</h3>
                                <p>See all your Base tokens and their values</p>
                            </div>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>🌊</div>
                                <h3>DeFi Positions</h3>
                                <p>Track your liquidity pools and staking</p>
                            </div>
                            <div className={styles.feature}>
                                <div className={styles.featureIcon}>❤️</div>
                                <h3>Wallet Health</h3>
                                <p>Get a safety score for your holdings</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={styles.walletInfo}>
                            <h2>Wallet Address</h2>
                            <p className={styles.address}>{address}</p>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                <span className={styles.errorIcon}>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

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
                )}
            </div>
        </div>
    );
}

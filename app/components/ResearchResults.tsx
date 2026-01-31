"use client";

import styles from "./ResearchResults.module.css";

interface RiskFlag {
    severity: "warning" | "danger";
    title: string;
    description: string;
}

interface TokenMetadata {
    name: string;
    symbol: string;
    decimals: number;
    logo?: string;
}

interface ResearchResult {
    type: "token" | "wallet" | "contract";
    address: string;
    riskScore: number;
    riskLevel: "low" | "medium" | "high" | "unknown";
    confidence?: "low" | "medium" | "high";
    reasons?: string[];
    flags: RiskFlag[];
    metadata: TokenMetadata;
    analysis: {
        security?: any;
        market?: {
            liquidity?: number;
            volume24h?: number;
            priceUsd?: string;
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

interface ResearchResultsProps {
    result: ResearchResult;
}

export default function ResearchResults({ result }: ResearchResultsProps) {
    const insufficientData = result.riskLevel === "unknown" && result.confidence === "low";
    const notDetectedByTools =
        result.analysis?.dataCoverage?.hasSecurity === false &&
        result.analysis?.dataCoverage?.hasMarket === false;

    const getRiskColor = () => {
        if (result.riskLevel === "unknown") return "#94a3b8"; // Slate
        if (result.riskLevel === "low") return "#10b981"; // Green
        if (result.riskLevel === "medium") return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    const getRiskEmoji = () => {
        if (result.riskLevel === "unknown") return "❔";
        if (result.riskLevel === "low") return "✅";
        if (result.riskLevel === "medium") return "⚠️";
        return "🚨";
    };

    const getConfidenceLabel = () => {
        if (!result.confidence) return "CONFIDENCE: N/A";
        return `CONFIDENCE: ${result.confidence.toUpperCase()}`;
    };

    const formatUSD = (value?: number) => {
        if (!value) return "$0";
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    return (
        <div className={styles.container}>
            {/* Risk Score Badge */}
            <div
                className={styles.riskBadge}
                style={{ borderColor: getRiskColor() }}
            >
                <div className={styles.riskEmoji}>{getRiskEmoji()}</div>
                <div className={styles.riskInfo}>
                    <div className={styles.riskScore} style={{ color: getRiskColor() }}>
                        {insufficientData || notDetectedByTools ? "N/A" : `${result.riskScore}/100`}
                    </div>
                    <div className={styles.riskLabelRow}>
                        <div className={styles.riskLabel}>
                            {insufficientData
                                ? "INSUFFICIENT DATA"
                                : notDetectedByTools
                                    ? "NOT DETECTED"
                                : `${result.riskLevel.toUpperCase()} RISK`}
                        </div>
                        <div className={styles.confidenceLabel}>{getConfidenceLabel()}</div>
                    </div>
                </div>
            </div>

            {/* Reasons */}
            {result.reasons && result.reasons.length > 0 && (
                <div className={styles.reasonsSection}>
                    <h3 className={styles.sectionTitle}>🧠 Why this result?</h3>
                    <ul className={styles.reasonsList}>
                        {result.reasons.map((r, idx) => (
                            <li key={idx} className={styles.reasonsItem}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Token Info */}
            <div className={styles.tokenInfo}>
                {result.metadata.logo && (
                    <img
                        src={result.metadata.logo}
                        alt={result.metadata.symbol}
                        className={styles.tokenLogo}
                    />
                )}
                <div>
                    <h2 className={styles.tokenName}>
                        {result.metadata.name || "Unknown Token"}
                    </h2>
                    <p className={styles.tokenSymbol}>{result.metadata.symbol}</p>
                    <p className={styles.address}>{result.address}</p>
                </div>
            </div>

            {/* Market Data */}
            {result.analysis.market && (
                <div className={styles.marketSection}>
                    <h3 className={styles.sectionTitle}>💧 Market Data</h3>
                    <div className={styles.marketGrid}>
                        <div className={styles.marketItem}>
                            <div className={styles.marketLabel}>Liquidity</div>
                            <div className={styles.marketValue}>
                                {formatUSD(result.analysis.market.liquidity)}
                            </div>
                        </div>
                        <div className={styles.marketItem}>
                            <div className={styles.marketLabel}>24h Volume</div>
                            <div className={styles.marketValue}>
                                {formatUSD(result.analysis.market.volume24h)}
                            </div>
                        </div>
                        {result.analysis.market.priceUsd && (
                            <div className={styles.marketItem}>
                                <div className={styles.marketLabel}>Price</div>
                                <div className={styles.marketValue}>
                                    ${parseFloat(result.analysis.market.priceUsd).toFixed(8)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Risk Flags */}
            {result.flags.length > 0 && (
                <div className={styles.flagsSection}>
                    <h3 className={styles.sectionTitle}>⚠️ Risk Flags</h3>
                    <div className={styles.flags}>
                        {result.flags.map((flag, index) => (
                            <div
                                key={index}
                                className={`${styles.flag} ${flag.severity === "danger" ? styles.flagDanger : styles.flagWarning
                                    }`}
                            >
                                <div className={styles.flagHeader}>
                                    <span className={styles.flagIcon}>
                                        {flag.severity === "danger" ? "🚨" : "⚠️"}
                                    </span>
                                    <h4 className={styles.flagTitle}>{flag.title}</h4>
                                </div>
                                <p className={styles.flagDescription}>{flag.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Breakdown */}
            <div className={styles.analysisSection}>
                <h3 className={styles.sectionTitle}>📊 Score Breakdown</h3>
                <div className={styles.analysisGrid}>
                    {result.analysis.securityScore !== undefined && (
                        <div className={styles.analysisItem}>
                            <div className={styles.analysisLabel}>Security</div>
                            <div className={styles.analysisValue}>
                                {result.analysis.securityScore}/100 (60%)
                            </div>
                        </div>
                    )}
                    {result.analysis.marketScore !== undefined && (
                        <div className={styles.analysisItem}>
                            <div className={styles.analysisLabel}>Market</div>
                            <div className={styles.analysisValue}>
                                {result.analysis.marketScore}/100 (30%)
                            </div>
                        </div>
                    )}
                    {result.analysis.metadataScore !== undefined && (
                        <div className={styles.analysisItem}>
                            <div className={styles.analysisLabel}>Metadata</div>
                            <div className={styles.analysisValue}>
                                {result.analysis.metadataScore}/100 (10%)
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recommendation */}
            <div className={styles.recommendation}>
                <h4>💡 Recommendation</h4>
                {result.riskLevel === "low" && (
                    <p>
                        No major red flags detected with strong data coverage. Still verify on multiple sources before investing.
                    </p>
                )}
                {result.riskLevel === "medium" && (
                    <p>
                        Exercise caution. Review the risk flags and verify information from multiple sources.
                    </p>
                )}
                {result.riskLevel === "high" && (
                    <p className={styles.dangerText}>
                        ⚠️ HIGH RISK - Critical security issues or market red flags detected.
                        We strongly recommend avoiding this token.
                    </p>
                )}
                {result.riskLevel === "unknown" && (
                    <p>
                        Insufficient or partial data to confidently label this token safe or risky.
                        Treat as risky until you verify liquidity, contract ownership, and taxes.
                    </p>
                )}
            </div>
        </div>
    );
}

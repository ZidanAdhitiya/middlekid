"use client";

import styles from "./TokenList.module.css";

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

interface TokenListProps {
    tokens: Token[];
    loading?: boolean;
}

function formatBalance(balance: string, decimals: number): string {
    const balanceNum = parseInt(balance, 16);
    const formatted = balanceNum / Math.pow(10, decimals);
    return formatted.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function TokenList({ tokens, loading }: TokenListProps) {
    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading tokens...</p>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>💰</div>
                <p>No tokens found in this wallet</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Token Holdings</h2>
            <div className={styles.grid}>
                {tokens.map((token) => (
                    <div key={token.contractAddress + token.chain} className={styles.tokenCard}>
                        <div className={styles.tokenHeader}>
                            {token.logo ? (
                                <img src={token.logo} alt={token.symbol} className={styles.logo} />
                            ) : (
                                <div className={styles.logoPlaceholder}>{token.symbol[0]}</div>
                            )}
                            <div className={styles.tokenInfo}>
                                <h3 className={styles.tokenName}>{token.name}</h3>
                                <div className={styles.tokenMeta}>
                                    <span className={styles.tokenSymbol}>{token.symbol}</span>
                                    <span className={styles.chainBadge}>{token.chain}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.tokenValues}>
                            <div className={styles.balance}>
                                {formatBalance(token.balance, token.decimals)}
                            </div>
                            {token.valueUsd !== undefined && (
                                <div className={styles.usdValue}>
                                    ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            )}
                            {token.priceUsd !== undefined && token.priceUsd > 0 && (
                                <div className={styles.pricePerToken}>
                                    ${token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} / {token.symbol}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

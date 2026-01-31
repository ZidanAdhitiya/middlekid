import { NextRequest, NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

type SupportedChain = "base" | "ethereum" | "bsc" | "tron";

interface RiskFlag {
    severity: "warning" | "danger";
    title: string;
    description: string;
}

interface TokenMetadata {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply?: string;
    logo?: string;
}

interface SecurityData {
    is_honeypot: string;
    buy_tax: string;
    sell_tax: string;
    is_mintable: string;
    can_take_back_ownership: string;
    is_blacklisted: string;
    is_proxy: string;
    hidden_owner: string;
    trading_cooldown: string;
    token_name?: string;
    token_symbol?: string;
    decimals?: string;
}

interface DEXData {
    liquidity?: number;
    volume24h?: number;
    priceUsd?: string;
    fdv?: number;
}

type ConfidenceLevel = "low" | "medium" | "high";

type RiskLevel = "low" | "medium" | "high" | "unknown";

interface ResearchResult {
    type: "token" | "wallet" | "contract";
    address: string;
    riskScore: number;
    riskLevel: RiskLevel;
    confidence: ConfidenceLevel;
    reasons: string[];
    flags: RiskFlag[];
    metadata: TokenMetadata;
    analysis: {
        security?: SecurityData;
        market?: DEXData;
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

function normalizeChain(raw: string | null): SupportedChain {
    const v = (raw || "base").toLowerCase();
    if (v === "base") return "base";
    if (v === "eth" || v === "ethereum") return "ethereum";
    if (v === "bsc" || v === "bnb" || v === "binance") return "bsc";
    if (v === "trx" || v === "tron") return "tron";
    return "base";
}

function getGoPlusChainId(chain: SupportedChain): number {
    if (chain === "base") return 8453;
    if (chain === "ethereum") return 1;
    if (chain === "bsc") return 56;
    // Tron native coin does not use the GoPlus EVM token endpoint
    return 0;
}

function getEmptyMetadata(): TokenMetadata {
    return { name: "", symbol: "", decimals: 0, logo: undefined, totalSupply: undefined };
}

async function getTokenMetadata(address: string, chain: SupportedChain): Promise<TokenMetadata> {
    if (chain !== "base") {
        return getEmptyMetadata();
    }

    const response = await fetch(ALCHEMY_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getTokenMetadata",
            params: [address],
        }),
    });

    const data = await response.json();
    const result = data.result;

    if (!result || result.name === null) {
        throw new Error(
            "Token not found on Base chain. This tool currently supports Base (EVM) token contract addresses only."
        );
    }

    return result;
}

async function getGoPlusSecurity(address: string, chain: SupportedChain): Promise<SecurityData | null> {
    try {
        const chainId = getGoPlusChainId(chain);
        if (!chainId) return null;
        const response = await fetch(
            `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`,
            { method: "GET" }
        );

        const data = await response.json();

        if (data.code === 1 && data.result) {
            const lower = address.toLowerCase();
            const exact = data.result[address];
            const lowerHit = data.result[lower];
            if (exact) return exact;
            if (lowerHit) return lowerHit;

            const firstKey = Object.keys(data.result)[0];
            if (firstKey && data.result[firstKey]) return data.result[firstKey];
        }

        return null;
    } catch (error) {
        console.error("GoPlus error:", error);
        return null;
    }
}

function getDexScreenerChainSlug(chain: SupportedChain): string | null {
    // DexScreener chainId values are not fully consistent across integrations.
    // We handle matching via a small allowlist in getDEXData.
    if (chain === "ethereum") return "ethereum";
    if (chain === "bsc") return "bsc";
    if (chain === "base") return "base";
    return null;
}

async function getDEXData(address: string, chain: SupportedChain): Promise<DEXData | null> {
    try {
        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${address}`,
            { method: "GET" }
        );

        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
            const wantedChain = getDexScreenerChainSlug(chain);
            const wantedAliases =
                chain === "ethereum"
                    ? new Set(["ethereum", "eth"])
                    : chain === "bsc"
                        ? new Set(["bsc", "binance-smart-chain", "bnb"])
                        : chain === "base"
                            ? new Set(["base"])
                            : new Set<string>();
            const pair =
                (wantedChain
                    ? data.pairs.find((p: any) => (p.chainId || "").toLowerCase() === wantedChain)
                    : null) || data.pairs[0];

            const resolvedPair =
                wantedAliases.size > 0
                    ? data.pairs.find((p: any) => wantedAliases.has((p.chainId || "").toLowerCase())) || pair
                    : pair;
            return {
                liquidity: resolvedPair.liquidity?.usd || 0,
                volume24h: resolvedPair.volume?.h24 || 0,
                priceUsd: resolvedPair.priceUsd,
                fdv: resolvedPair.fdv,
            };
        }

        return null;
    } catch (error) {
        console.error("DEX Screener error:", error);
        return null;
    }
}

function calculateSecurityScore(security: SecurityData | null): number {
    if (!security) return 30; // No data = medium risk

    let score = 0;

    // Critical issues
    if (security.is_honeypot === "1") score += 60;
    if (security.hidden_owner === "1") score += 30;

    // High taxes
    const buyTax = parseFloat(security.buy_tax || "0");
    const sellTax = parseFloat(security.sell_tax || "0");
    if (buyTax > 0.1 || sellTax > 0.1) score += 25; // >10% tax
    else if (buyTax > 0.05 || sellTax > 0.05) score += 15; // >5% tax

    // Owner privileges
    if (security.is_mintable === "1") score += 20;
    if (security.can_take_back_ownership === "1") score += 20;
    if (security.is_blacklisted === "1") score += 15;
    if (security.trading_cooldown === "1") score += 10;
    if (security.is_proxy === "1") score += 5; // Proxy is sometimes legit

    return Math.min(score, 100);
}

function mergeMetadata(metadata: TokenMetadata, security: SecurityData | null): TokenMetadata {
    if (metadata?.name && metadata?.symbol) return metadata;
    const name = security?.token_name || metadata?.name || "";
    const symbol = security?.token_symbol || metadata?.symbol || "";
    const decimalsRaw = security?.decimals;
    const decimals = decimalsRaw ? Number.parseInt(decimalsRaw, 10) : metadata?.decimals || 0;
    return {
        ...metadata,
        name,
        symbol,
        decimals: Number.isFinite(decimals) ? decimals : (metadata?.decimals || 0),
    };
}

function parseTax(raw: string | undefined): number {
    const n = parseFloat(raw || "0");
    if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
    return Math.max(0, n);
}

function buildReasons(
    security: SecurityData | null,
    market: DEXData | null,
    metadata: TokenMetadata
): { reasons: string[]; confidence: ConfidenceLevel; riskLevel: RiskLevel; riskScore: number } {
    const reasons: string[] = [];
    const hasSecurity = !!security;
    const hasMarket = !!market;
    const hasMetadata = !!metadata?.name && !!metadata?.symbol;

    if (!hasSecurity) reasons.push("Security scan data not available (GoPlus).");
    if (!hasMarket) reasons.push("Market data not available (DEX Screener).");
    if (!hasMetadata) reasons.push("Token metadata incomplete.");

    // If both external tools have no data, do not pretend we have a meaningful score.
    // This usually means the token is not indexed/detected by the scanners yet.
    if (!hasSecurity && !hasMarket) {
        return {
            reasons: [
                "Token not detected by security scanner (GoPlus) or market indexer (DEX Screener).",
                "Unable to assess risk with current data sources.",
            ],
            confidence: hasMetadata ? "low" : "low",
            riskLevel: "unknown",
            riskScore: 0,
        };
    }

    // Hard red-flags => HIGH risk
    if (security?.is_honeypot === "1") {
        return {
            reasons: ["Honeypot detected: token likely cannot be sold."],
            confidence: hasSecurity ? "high" : "medium",
            riskLevel: "high",
            riskScore: 95,
        };
    }

    if (security?.hidden_owner === "1") {
        return {
            reasons: ["Hidden owner detected: contract ownership is obscured."],
            confidence: hasSecurity ? "high" : "medium",
            riskLevel: "high",
            riskScore: 85,
        };
    }

    const buyTax = security ? parseTax(security.buy_tax) : 0;
    const sellTax = security ? parseTax(security.sell_tax) : 0;
    const maxTax = Math.max(buyTax, sellTax);

    if (security && maxTax >= 0.2) {
        return {
            reasons: [`Very high token tax detected (>=20%). Buy tax=${(buyTax * 100).toFixed(1)}%, Sell tax=${(sellTax * 100).toFixed(1)}%.`],
            confidence: "high",
            riskLevel: "high",
            riskScore: 90,
        };
    }

    // Soft indicators
    let score = 0;
    if (security) {
        if (maxTax >= 0.1) {
            reasons.push(`High token tax detected (>10%). Buy tax=${(buyTax * 100).toFixed(1)}%, Sell tax=${(sellTax * 100).toFixed(1)}%.`);
            score += 30;
        } else if (maxTax >= 0.05) {
            reasons.push(`Moderate token tax detected (>5%). Buy tax=${(buyTax * 100).toFixed(1)}%, Sell tax=${(sellTax * 100).toFixed(1)}%.`);
            score += 15;
        }

        if (security.can_take_back_ownership === "1") {
            reasons.push("Owner can reclaim ownership (risk of admin abuse).");
            score += 15;
        }
        if (security.is_mintable === "1") {
            reasons.push("Token is mintable by owner (supply can increase).");
            score += 10;
        }
        if (security.is_blacklisted === "1") {
            reasons.push("Blacklist functionality detected (addresses can be blocked).");
            score += 10;
        }
        if (security.trading_cooldown === "1") {
            reasons.push("Trading cooldown detected (can restrict trading).");
            score += 5;
        }
    }

    if (market) {
        const liquidity = market.liquidity || 0;
        const volume = market.volume24h || 0;

        // Market risk is informative but not decisive for 'safe'
        if (liquidity === 0) {
            reasons.push("No DEX liquidity found (may be untradeable or new).");
            score += 25;
        } else if (liquidity < 1000) {
            reasons.push("Very low liquidity (<$1k).");
            score += 20;
        } else if (liquidity < 10000) {
            reasons.push("Low liquidity (<$10k).");
            score += 10;
        }

        if (volume === 0) {
            reasons.push("No 24h trading volume.");
            score += 10;
        } else if (volume < 100) {
            reasons.push("Very low 24h trading volume (<$100).");
            score += 5;
        }
    }

    // Data coverage determines confidence and whether we are allowed to label LOW risk.
    const coveragePoints = (hasSecurity ? 1 : 0) + (hasMarket ? 1 : 0) + (hasMetadata ? 1 : 0);
    const confidence: ConfidenceLevel = coveragePoints === 3 ? "high" : coveragePoints === 2 ? "medium" : "low";

    // Conservative classification:
    // - LOW only if confidence high and score is very low.
    // - HIGH if score is high enough or hard flags already returned.
    // - UNKNOWN if confidence is low/medium and score is not clearly high.
    // - MEDIUM for in-between cases with decent data.
    const normalizedScore = Math.min(100, Math.max(0, score));
    if (confidence === "high" && normalizedScore <= 10) {
        return { reasons: reasons.length ? reasons : ["No major red flags detected."], confidence, riskLevel: "low", riskScore: 15 };
    }

    if (normalizedScore >= 60) {
        return { reasons: reasons.length ? reasons : ["Multiple risk indicators detected."], confidence, riskLevel: "high", riskScore: 75 };
    }

    if (confidence === "low") {
        return {
            reasons: reasons.length
                ? [...reasons, "Insufficient data to assess risk. No score will be shown."]
                : ["Insufficient data to assess risk. No score will be shown."],
            confidence,
            riskLevel: "unknown",
            riskScore: 0,
        };
    }

    if (normalizedScore <= 20 && confidence === "medium") {
        return { reasons: reasons.length ? reasons : ["Limited data; no major red flags detected."], confidence, riskLevel: "unknown", riskScore: 40 };
    }

    return { reasons: reasons.length ? reasons : ["Some risk indicators detected."], confidence, riskLevel: "medium", riskScore: 55 };
}

function calculateMarketScore(market: DEXData | null): number {
    if (!market) return 50; // No market data = HIGH risk (increased from 30)

    let score = 0;
    const liquidity = market.liquidity || 0;
    const volume = market.volume24h || 0;
    const fdv = market.fdv || 0;

    // Liquidity scoring (higher liquidity = LOWER score = SAFER)
    if (liquidity === 0) score += 50; // No liquidity = very bad
    else if (liquidity < 1000) score += 40;
    else if (liquidity < 10000) score += 25;
    else if (liquidity < 50000) score += 10;
    else if (liquidity < 100000) score += 5;
    // >$100k liquidity = 0 points (GOOD)

    // Volume scoring
    if (volume === 0) score += 15;
    else if (volume < 100) score += 10;
    else if (volume < 1000) score += 5;
    // >$1k daily volume = 0 points

    // Investment-aware heuristics:
    // Small FDV (micro caps) are intrinsically higher risk (volatile / easy to manipulate),
    // even if contract/security scans show no red flags.
    // We intentionally DO NOT penalize large/blue-chip tokens here.
    if (fdv > 0) {
        if (fdv < 200_000) score += 35;
        else if (fdv < 1_000_000) score += 25;
        else if (fdv < 5_000_000) score += 15;
        else if (fdv < 20_000_000) score += 8;
    }

    // Thin-liquidity trading can be unstable: apply a small penalty when liquidity is low
    // relative to daily volume (can indicate spiky / highly volatile markets).
    if (liquidity > 0 && volume > 0) {
        const vToL = volume / liquidity;
        if (vToL > 5) score += 10;
        else if (vToL > 2) score += 5;
    }

    return Math.min(score, 100);
}

function calculateMetadataScore(metadata: TokenMetadata): number {
    let score = 0;

    if (!metadata.name || metadata.name.trim() === "") score += 10;
    if (!metadata.symbol || metadata.symbol.trim() === "") score += 10;

    return Math.min(score, 100);
}

function generateFlags(
    security: SecurityData | null,
    market: DEXData | null,
    metadata: TokenMetadata,
    riskScore: number
): RiskFlag[] {
    const flags: RiskFlag[] = [];

    // Security flags
    if (security) {
        if (security.is_honeypot === "1") {
            flags.push({
                severity: "danger",
                title: "🚨 HONEYPOT DETECTED",
                description: "This token cannot be sold after purchase. DO NOT BUY!",
            });
        }

        const buyTax = parseFloat(security.buy_tax || "0") * 100;
        const sellTax = parseFloat(security.sell_tax || "0") * 100;
        if (buyTax > 10 || sellTax > 10) {
            flags.push({
                severity: "danger",
                title: "Very High Tax",
                description: `Buy tax: ${buyTax.toFixed(1)}%, Sell tax: ${sellTax.toFixed(1)}%. This is likely a scam.`,
            });
        } else if (buyTax > 5 || sellTax > 5) {
            flags.push({
                severity: "warning",
                title: "High Tax",
                description: `Buy tax: ${buyTax.toFixed(1)}%, Sell tax: ${sellTax.toFixed(1)}%.`,
            });
        }

        if (security.hidden_owner === "1") {
            flags.push({
                severity: "danger",
                title: "Hidden Owner",
                description: "Contract ownership is hidden. Very suspicious.",
            });
        }

        if (security.is_mintable === "1") {
            flags.push({
                severity: "warning",
                title: "Mintable",
                description: "Owner can mint new tokens, potentially diluting value.",
            });
        }

        if (security.is_blacklisted === "1") {
            flags.push({
                severity: "warning",
                title: "Blacklist Function",
                description: "Owner can blacklist specific addresses from trading.",
            });
        }
    }

    // Market flags
    if (market) {
        if ((market.liquidity || 0) < 1000) {
            flags.push({
                severity: "danger",
                title: "Very Low Liquidity",
                description: `Only $${market.liquidity?.toFixed(0) || 0} liquidity. High risk of pump & dump.`,
            });
        } else if ((market.liquidity || 0) < 10000) {
            flags.push({
                severity: "warning",
                title: "Low Liquidity",
                description: `Only $${market.liquidity?.toLocaleString()} liquidity. Proceed with caution.`,
            });
        }

        if ((market.volume24h || 0) < 100) {
            flags.push({
                severity: "warning",
                title: "Minimal Trading Activity",
                description: "Very low 24h trading volume. Token may be illiquid.",
            });
        }
    } else {
        flags.push({
            severity: "warning",
            title: "No Market Data",
            description: "Token not found on any DEX. May be new or unlisted.",
        });
    }

    // Overall risk
    if (riskScore >= 70) {
        flags.push({
            severity: "danger",
            title: "VERY HIGH RISK",
            description: "Multiple critical red flags. Likely a scam. DO NOT INVEST.",
        });
    } else if (riskScore >= 50) {
        flags.push({
            severity: "warning",
            title: "High Risk",
            description: "Several concerning indicators. Research thoroughly before proceeding.",
        });
    }

    return flags;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") || "token";
        const chain = normalizeChain(searchParams.get("chain"));
        const address = searchParams.get("address");

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        // Native Tron (TRX) special case: CoinMarketCap uses contract address "0".
        // We treat this as a supported native coin lookup.
        if (type === "token" && chain === "tron" && address.trim() === "0") {
            const metadata: TokenMetadata = {
                name: "TRON",
                symbol: "TRX",
                decimals: 6,
            };

            const result: ResearchResult = {
                type: "token",
                address: "0",
                riskScore: 5,
                riskLevel: "low",
                confidence: "high",
                reasons: [
                    "Native coin (TRX) on Tron network.",
                    "This is not a smart-contract token, so typical honeypot/tax checks do not apply.",
                ],
                flags: [],
                metadata,
                analysis: {
                    hasLiquidity: true,
                    securityScore: undefined,
                    marketScore: undefined,
                    metadataScore: 0,
                    dataCoverage: {
                        hasMetadata: true,
                        hasSecurity: false,
                        hasMarket: false,
                    },
                },
            };

            return NextResponse.json(result);
        }

        if (type === "token" && chain === "tron" && address.trim() !== "0") {
            return NextResponse.json(
                {
                    error:
                        "TRC20 contract research is not supported yet. For native TRX, use address '0' (as shown on CoinMarketCap).",
                },
                { status: 400 }
            );
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json(
                {
                    error:
                        "Invalid address format. This endpoint currently supports EVM contract addresses only (0x...40 hex). For native TRX use chain=tron and address=0.",
                },
                { status: 400 }
            );
        }

        if (type === "token") {
            console.log(`\n[RESEARCH] Analyzing: ${address}`);

            // Fetch from all sources in parallel
            const [metadata, security, market] = await Promise.all([
                getTokenMetadata(address, chain),
                getGoPlusSecurity(address, chain),
                getDEXData(address, chain),
            ]);

            const mergedMetadata = mergeMetadata(metadata, security);

            console.log(`Token: ${mergedMetadata.name} (${mergedMetadata.symbol})`);
            console.log(`Security data: ${security ? 'Found' : 'Not found'}`);
            console.log(`Market data: ${market ? `$${market.liquidity?.toLocaleString()} liq` : 'Not found'}`);

            // Keep legacy scores for breakdown display
            const metadataScore = calculateMetadataScore(mergedMetadata);
            const securityScore = calculateSecurityScore(security);
            const marketScore = calculateMarketScore(market);
            const riskScore = Math.round(securityScore * 0.6 + marketScore * 0.3 + metadataScore * 0.1);

            // Conservative decision + reasons
            const decision = buildReasons(security, market, mergedMetadata);
            const flags = generateFlags(security, market, mergedMetadata, riskScore);

            console.log(`Scores - Security: ${securityScore}, Market: ${marketScore}, Metadata: ${metadataScore}`);
            console.log(`Decision - Level: ${decision.riskLevel}, Confidence: ${decision.confidence}, Score: ${decision.riskScore}`);

            const result: ResearchResult = {
                type: "token",
                address,
                riskScore,
                riskLevel: decision.riskLevel,
                confidence: decision.confidence,
                reasons: decision.reasons,
                flags,
                metadata: mergedMetadata,
                analysis: {
                    security: security || undefined,
                    market: market || undefined,
                    hasLiquidity: (market?.liquidity || 0) > 0,
                    securityScore,
                    marketScore,
                    metadataScore,
                    dataCoverage: {
                        hasMetadata: !!mergedMetadata?.name && !!mergedMetadata?.symbol,
                        hasSecurity: !!security,
                        hasMarket: !!market,
                    },
                },
            };

            return NextResponse.json(result);
        }

        return NextResponse.json(
            { error: "Only token research is currently supported" },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("Research API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to research address" },
            { status: 500 }
        );
    }
}

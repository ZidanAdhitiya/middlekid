import { NextRequest, NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

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
}

interface DEXData {
    liquidity?: number;
    volume24h?: number;
    priceUsd?: string;
    fdv?: number;
}

interface ResearchResult {
    type: "token" | "wallet" | "contract";
    address: string;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    flags: RiskFlag[];
    metadata: TokenMetadata;
    analysis: {
        security?: SecurityData;
        market?: DEXData;
        hasLiquidity?: boolean;
        securityScore?: number;
        marketScore?: number;
        metadataScore?: number;
    };
}

async function getTokenMetadata(address: string): Promise<TokenMetadata> {
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
            "Token not found on Base chain. Use a Base token address."
        );
    }

    return result;
}

async function getGoPlusSecurity(address: string): Promise<SecurityData | null> {
    try {
        const response = await fetch(
            `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`,
            { method: "GET" }
        );

        const data = await response.json();

        if (data.code === 1 && data.result && data.result[address.toLowerCase()]) {
            return data.result[address.toLowerCase()];
        }

        return null;
    } catch (error) {
        console.error("GoPlus error:", error);
        return null;
    }
}

async function getDEXData(address: string): Promise<DEXData | null> {
    try {
        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${address}`,
            { method: "GET" }
        );

        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            return {
                liquidity: pair.liquidity?.usd || 0,
                volume24h: pair.volume?.h24 || 0,
                priceUsd: pair.priceUsd,
                fdv: pair.fdv,
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

function calculateMarketScore(market: DEXData | null): number {
    if (!market) return 50; // No market data = HIGH risk (increased from 30)

    let score = 0;
    const liquidity = market.liquidity || 0;
    const volume = market.volume24h || 0;

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
        const address = searchParams.get("address");

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
        }

        if (type === "token") {
            console.log(`\n[RESEARCH] Analyzing: ${address}`);

            // Fetch from all sources in parallel
            const [metadata, security, market] = await Promise.all([
                getTokenMetadata(address),
                getGoPlusSecurity(address),
                getDEXData(address),
            ]);

            console.log(`Token: ${metadata.name} (${metadata.symbol})`);
            console.log(`Security data: ${security ? 'Found' : 'Not found'}`);
            console.log(`Market data: ${market ? `$${market.liquidity?.toLocaleString()} liq` : 'Not found'}`);

            // Calculate scores
            const securityScore = calculateSecurityScore(security);
            const marketScore = calculateMarketScore(market);
            const metadataScore = calculateMetadataScore(metadata);

            // Weighted total: Security 60%, Market 30%, Metadata 10%
            const riskScore = Math.round(
                securityScore * 0.6 + marketScore * 0.3 + metadataScore * 0.1
            );

            console.log(`Scores - Security: ${securityScore}, Market: ${marketScore}, Metadata: ${metadataScore}`);
            console.log(`Final Risk Score: ${riskScore}/100\n`);

            const riskLevel = riskScore < 26 ? "low" : riskScore < 61 ? "medium" : "high";
            const flags = generateFlags(security, market, metadata, riskScore);

            const result: ResearchResult = {
                type: "token",
                address,
                riskScore,
                riskLevel,
                flags,
                metadata,
                analysis: {
                    security: security || undefined,
                    market: market || undefined,
                    hasLiquidity: (market?.liquidity || 0) > 0,
                    securityScore,
                    marketScore,
                    metadataScore,
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

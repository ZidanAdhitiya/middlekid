import { NextRequest, NextResponse } from "next/server";

const ALCHEMY_API_KEY = "9a5HgXqX3Fgk-k-FugDEq";
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

interface Token {
    contractAddress: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    logo?: string;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const address = searchParams.get("address");

        if (!address) {
            return NextResponse.json(
                { error: "Wallet address is required" },
                { status: 400 }
            );
        }

        // Fetch token balances
        const balancesResponse = await fetch(ALCHEMY_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "alchemy_getTokenBalances",
                params: [address],
            }),
        });

        const balancesData = await balancesResponse.json();

        if (balancesData.error) {
            return NextResponse.json(
                { error: balancesData.error.message },
                { status: 500 }
            );
        }

        const tokenBalances = balancesData.result.tokenBalances.filter(
            (token: any) => parseInt(token.tokenBalance, 16) > 0
        );

        // Fetch metadata for each token
        const tokens: Token[] = await Promise.all(
            tokenBalances.map(async (token: any) => {
                const metadataResponse = await fetch(ALCHEMY_BASE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        id: 1,
                        method: "alchemy_getTokenMetadata",
                        params: [token.contractAddress],
                    }),
                });

                const metadata = await metadataResponse.json();
                const tokenMetadata = metadata.result;

                return {
                    contractAddress: token.contractAddress,
                    name: tokenMetadata.name || "Unknown Token",
                    symbol: tokenMetadata.symbol || "???",
                    decimals: tokenMetadata.decimals || 18,
                    balance: token.tokenBalance,
                    logo: tokenMetadata.logo,
                };
            })
        );

        return NextResponse.json({ tokens });
    } catch (error: any) {
        console.error("Error fetching tokens:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch tokens" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";

type SupportedChain = "base" | "ethereum" | "bsc";

function normalizeChain(raw: string | null): SupportedChain {
    const v = (raw || "base").toLowerCase();
    if (v === "base") return "base";
    if (v === "eth" || v === "ethereum") return "ethereum";
    if (v === "bsc" || v === "bnb" || v === "binance") return "bsc";
    return "base";
}

function getRpcUrl(chain: SupportedChain): string {
    if (chain === "ethereum") return "https://cloudflare-eth.com";
    if (chain === "bsc") return "https://bsc-dataseed.binance.org";
    return "https://mainnet.base.org";
}

async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
    const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });

    if (!res.ok) {
        throw new Error(`RPC error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
        throw new Error(data.error.message || "RPC returned an error");
    }

    return data.result as T;
}

export async function GET(request: NextRequest) {
    try {
        const sp = request.nextUrl.searchParams;
        const chain = normalizeChain(sp.get("chain"));
        const hash = sp.get("hash");

        if (!hash) {
            return NextResponse.json({ error: "hash is required" }, { status: 400 });
        }

        if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
            return NextResponse.json({ error: "Invalid tx hash format" }, { status: 400 });
        }

        const rpcUrl = getRpcUrl(chain);

        const tx = await rpcCall<any>(rpcUrl, "eth_getTransactionByHash", [hash]);
        if (!tx) {
            return NextResponse.json({ error: "Transaction not found (yet)." }, { status: 404 });
        }

        const receipt = await rpcCall<any>(rpcUrl, "eth_getTransactionReceipt", [hash]);

        const normalized = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            data: tx.input,
            chain,
            blockNumber: tx.blockNumber,
            status: receipt?.status,
        };

        return NextResponse.json(normalized);
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Failed to fetch tx" }, { status: 500 });
    }
}

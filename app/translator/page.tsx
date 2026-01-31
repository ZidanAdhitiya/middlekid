"use client";

import Link from "next/link";
import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import { useMemo, useState } from "react";
import { decodeFunctionData, formatEther, parseAbi } from "viem";
import styles from "./page.module.css";

type OutputBlock = {
    title: string;
    lines: string[];
};

const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount)",
    "function transfer(address to, uint256 amount)",
    "function transferFrom(address from, address to, uint256 amount)",
]);

function safeJsonParse(input: string): unknown {
    const trimmed = input.trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed);
}

function parseKeyValueText(input: string): Record<string, string> {
    const out: Record<string, string> = {};
    const lines = input
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

    for (const line of lines) {
        const m = line.match(/^([^:]{2,80}):\s*(.+)$/);
        if (!m) continue;
        const k = m[1].trim().toLowerCase();
        const v = m[2].trim();
        if (!out[k]) out[k] = v;
    }

    return out;
}

function summarizeMetaMaskText(input: string): OutputBlock | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();
    const kv = parseKeyValueText(trimmed);

    const network = kv["network"];
    const requestFrom = kv["request from"] || kv["from"] || kv["site"];
    const interactingWith = kv["interacting with"] || kv["to"] || kv["contract"];
    const amount = kv["amount"] || kv["value"];
    const message = kv["message"];

    const looksLikeTx = lower.includes("transaction request") || !!amount || !!interactingWith;
    const looksLikeSig = lower.includes("signature request") || !!message || lower.includes("we require a signature");

    if (!looksLikeTx && !looksLikeSig) return null;

    const looksLikeAddress = (v?: string) => (typeof v === "string" ? /^0x[a-fA-F0-9]{40}$/.test(v.trim()) : false);
    const hasLink = (v?: string) => (typeof v === "string" ? /(https?:\/\/|www\.)/i.test(v) : false);

    const keywordHits = (v?: string) => {
        if (typeof v !== "string") return [] as string[];
        const s = v.toLowerCase();
        const keys = [
            "approve",
            "allowance",
            "permit",
            "setapprovalforall",
            "unlimited",
            "drain",
            "authorize",
        ];
        return keys.filter((k) => s.includes(k));
    };

    const formatTarget = (v?: string) => {
        if (!v) return "(tidak ada)";
        const t = v.trim();
        if (looksLikeAddress(t)) return `${t.slice(0, 6)}…${t.slice(-4)}`;
        return t;
    };

    if (looksLikeSig) {
        const lines: string[] = [];
        const fromLabel = requestFrom ? requestFrom.trim() : "(unknown site)";
        const networkLabel = network ? network.trim() : "(unknown network)";
        lines.push(`Ini adalah permintaan tanda tangan pesan dari ${fromLabel} di network ${networkLabel}.`);
        lines.push("Signature request biasanya tidak mengirim token/ETH. Tapi tanda tangan bisa dipakai untuk login atau mengizinkan aksi tertentu di aplikasi.");

        const msg = message ? (message.length > 260 ? `${message.slice(0, 260)}…` : message) : "";
        if (msg) {
            lines.push(`Ringkasan pesan: ${msg}`);
        } else {
            lines.push("Ringkasan pesan: (tidak ada pesan yang bisa dibaca dari input)");
        }

        const hits = keywordHits(message);
        if (hits.length > 0) {
            lines.push(`Red flags: pesan mengandung keyword berisiko: ${hits.join(", ")}.`);
        }
        if (hasLink(message)) {
            lines.push("Red flags: pesan mengandung link. Pastikan domain benar dan kamu paham apa yang kamu tandatangani.");
        }

        lines.push("Checklist cepat:");
        lines.push("- Pastikan domain `Request from` benar (bukan typo)." );
        lines.push("- Jangan sign kalau ada kata approve/permit/unlimited atau kamu tidak paham konteksnya." );
        lines.push("- Kalau ragu: Cancel." );
        return { title: "MetaMask Summary", lines };
    }

    if (looksLikeTx) {
        const lines: string[] = [];
        const fromLabel = requestFrom ? requestFrom.trim() : "(unknown site)";
        const networkLabel = network ? network.trim() : "(unknown network)";
        const toLabel = formatTarget(interactingWith);
        const valueLabel = amount ? amount.trim() : "(tidak ada amount)";

        lines.push(`Ini adalah transaksi on-chain di ${networkLabel} yang diminta oleh ${fromLabel}.`);
        if (amount) {
            lines.push(`Kamu akan mengirim value: ${valueLabel}.`);
        } else {
            lines.push("Tidak ada value yang terlihat di ringkasan ini.");
        }

        if (interactingWith) {
            lines.push(`Target kontrak/alamat: ${toLabel}.`);
        }

        lines.push("Yang belum bisa dipastikan dari ringkasan MetaMask:");
        lines.push("- Apakah ini approval / swap / transfer token (butuh field `data` / calldata 0x...)." );
        lines.push("Checklist cepat:");
        lines.push("- Pastikan domain `Request from` benar dan kamu memang sedang memakai dApp itu." );
        lines.push("- Buka explorer dan cek alamat target (verifikasi kontrak, reputasi)." );
        lines.push("- Kalau nilai ETH besar/tidak sesuai ekspektasi: Cancel." );
        return { title: "MetaMask Summary", lines };
    }

    return null;
}

function formatMaybeEthValue(value: unknown): string {
    if (typeof value !== "string") return "0";
    if (!value) return "0";

    try {
        if (value.startsWith("0x")) {
            return `${formatEther(BigInt(value))} ETH`;
        }
        if (/^[0-9]+$/.test(value)) {
            return `${formatEther(BigInt(value))} ETH`;
        }
    } catch {
        return value;
    }

    return value;
}

function extractCalldata(payload: unknown): string | null {
    if (typeof payload === "string") {
        const trimmed = payload.trim();
        return trimmed.startsWith("0x") ? trimmed : null;
    }

    if (!payload || typeof payload !== "object") return null;

    const obj = payload as Record<string, unknown>;
    if (typeof obj.data === "string" && obj.data.startsWith("0x")) return obj.data;
    if (typeof obj.calldata === "string" && obj.calldata.startsWith("0x")) return obj.calldata;

    if (obj.params && Array.isArray(obj.params)) {
        for (const p of obj.params) {
            if (p && typeof p === "object") {
                const po = p as Record<string, unknown>;
                if (typeof po.data === "string" && po.data.startsWith("0x")) return po.data;
            }
        }
    }

    return null;
}

function decodeErc20Call(calldata: string): OutputBlock | null {
    if (!calldata.startsWith("0x") || calldata.length < 10) return null;

    try {
        const decoded = decodeFunctionData({
            abi: erc20Abi,
            data: calldata as `0x${string}`,
        });

        if (decoded.functionName === "approve") {
            const spender = decoded.args[0] as string;
            const amount = decoded.args[1] as bigint;
            const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1);
            const isUnlimited = amount === maxUint256;

            return {
                title: "ERC20 Approval (approve)",
                lines: [
                    `Aplikasi meminta izin untuk spend token kamu.`,
                    `Spender: ${spender}`,
                    `Allowance: ${isUnlimited ? "Unlimited" : amount.toString()} (raw units)`
                ],
            };
        }

        if (decoded.functionName === "transfer") {
            const to = decoded.args[0] as string;
            const amount = decoded.args[1] as bigint;
            return {
                title: "ERC20 Transfer (transfer)",
                lines: [
                    `Aplikasi akan mengirim token ke alamat: ${to}`,
                    `Jumlah: ${amount.toString()} (raw units)`,
                ],
            };
        }

        if (decoded.functionName === "transferFrom") {
            const from = decoded.args[0] as string;
            const to = decoded.args[1] as string;
            const amount = decoded.args[2] as bigint;
            return {
                title: "ERC20 Transfer From (transferFrom)",
                lines: [
                    `Aplikasi akan memindahkan token dari: ${from}`,
                    `Ke: ${to}`,
                    `Jumlah: ${amount.toString()} (raw units)`,
                ],
            };
        }
    } catch {
        return null;
    }

    return null;
}

function summarizeTransactionObject(tx: Record<string, unknown>): OutputBlock {
    const toRaw = typeof tx.to === "string" ? tx.to : null;
    const fromRaw = typeof tx.from === "string" ? tx.from : null;
    const data = typeof tx.data === "string" ? tx.data : null;
    const valueLabel = formatMaybeEthValue(tx.value);

    const toLabel = toRaw ? `${toRaw.slice(0, 6)}…${toRaw.slice(-4)}` : "(contract creation / unknown)";
    const fromLabel = fromRaw ? `${fromRaw.slice(0, 6)}…${fromRaw.slice(-4)}` : "(unknown)";
    const hasData = !!(data && data.startsWith("0x") && data.length >= 10);
    const selector = hasData ? data!.slice(0, 10) : null;

    const lines: string[] = [];

    // Extra tx-hash fields if present
    if (typeof tx.hash === "string") lines.push(`Tx: ${tx.hash.slice(0, 10)}…${tx.hash.slice(-6)}`);
    if (typeof tx.status === "string") {
        lines.push(`Status: ${tx.status === "0x1" ? "SUCCESS" : tx.status === "0x0" ? "REVERTED" : tx.status}`);
    }

    // Interpretation first
    const valueIsNonZero = typeof tx.value === "string" && tx.value !== "0x0" && tx.value !== "0";
    if (valueIsNonZero && !hasData) {
        lines.push(`Ini adalah transaksi mengirim ${valueLabel} ke ${toLabel}.`);
    } else if (valueIsNonZero && hasData) {
        lines.push(`Ini adalah transaksi memanggil kontrak ${toLabel} sambil mengirim ${valueLabel}.`);
    } else if (!valueIsNonZero && hasData) {
        lines.push(`Ini adalah interaksi kontrak ke ${toLabel} (value 0). Bisa jadi approval / swap / transfer token.`);
    } else {
        lines.push(`Ini adalah transaksi ke ${toLabel}.`);
    }

    // Key facts (minimal)
    lines.push(`From: ${fromLabel}`);
    lines.push(`To: ${toLabel}`);
    lines.push(`Value: ${valueLabel}`);
    if (typeof tx.chainId === "string" || typeof tx.chainId === "number") lines.push(`Chain: ${String(tx.chainId)}`);
    if (selector) lines.push(`Function selector: ${selector}`);
    if (hasData) lines.push(`Calldata size: ${(data!.length - 2) / 2} bytes`);

    lines.push("Checklist cepat:");
    lines.push("- Pastikan alamat `To` benar (cek di explorer)." );
    lines.push("- Kalau ini approval: pastikan spender adalah dApp yang kamu pakai dan allowance tidak unlimited kecuali kamu paham risikonya." );
    lines.push("- Kalau ragu: Cancel." );

    return { title: "Transaction Summary", lines };
}

function summarizeTypedData(obj: Record<string, unknown>): OutputBlock {
    const domain = (obj.domain && typeof obj.domain === "object") ? (obj.domain as Record<string, unknown>) : null;
    const message = (obj.message && typeof obj.message === "object") ? (obj.message as Record<string, unknown>) : null;
    const primaryType = typeof obj.primaryType === "string" ? obj.primaryType : "(unknown)";

    const lines: string[] = [];

    const pt = String(primaryType);
    const ptLower = pt.toLowerCase();
    const domainName = domain?.name ? String(domain.name) : "(unknown dApp)";
    const verifying = domain?.verifyingContract ? String(domain.verifyingContract) : "";
    const verifyingShort = verifying && /^0x[a-fA-F0-9]{40}$/.test(verifying) ? `${verifying.slice(0, 6)}…${verifying.slice(-4)}` : verifying;
    const chainLabel = domain?.chainId ? String(domain.chainId) : "";

    lines.push(`Ini adalah permintaan signature (EIP-712) dari ${domainName}.`);
    lines.push(`Tipe data: ${pt}.`);
    if (verifyingShort) lines.push(`Verifying contract: ${verifyingShort}`);
    if (chainLabel) lines.push(`ChainId: ${chainLabel}`);

    const messageKeys = message ? Object.keys(message) : [];
    const mightBePermit = ptLower.includes("permit") || messageKeys.some((k) => ["spender", "value", "amount", "deadline"].includes(k.toLowerCase()));
    if (mightBePermit) {
        lines.push("Interpretasi: Ini terlihat seperti Permit / approval via signature (bisa memberi izin spend token tanpa tx approve manual)." );
    }

    if (message) {
        const spender = (message as any).spender;
        const value = (message as any).value ?? (message as any).amount;
        if (typeof spender === "string" && /^0x[a-fA-F0-9]{40}$/.test(spender)) {
            lines.push(`Spender: ${spender.slice(0, 6)}…${spender.slice(-4)}`);
        }
        if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
            lines.push(`Allowance/Value (raw): ${String(value)}`);
        }
    }

    lines.push("Checklist cepat:");
    lines.push("- Pastikan kamu mengenal dApp (domain di wallet) dan kontrak verifying benar." );
    lines.push("- Kalau ada field `spender` / `value` besar/unlimited dan kamu tidak paham: Cancel." );

    return {
        title: "Signature Request (Typed Data)",
        lines,
    };
}

function translateInput(input: string): { blocks: OutputBlock[]; error?: string } {
    const trimmed = input.trim();
    if (!trimmed) return { blocks: [], error: "Masukkan JSON atau calldata (0x...) dulu." };

    const blocks: OutputBlock[] = [];

    const metaMaskText = summarizeMetaMaskText(trimmed);
    if (metaMaskText) {
        blocks.push(metaMaskText);
        return { blocks };
    }

    const looksLikeHexCalldata = trimmed.startsWith("0x") && /^[0-9a-fA-Fx]+$/.test(trimmed);
    if (looksLikeHexCalldata) {
        const erc20 = decodeErc20Call(trimmed);
        if (erc20) {
            blocks.push(erc20);
        } else {
            const selector = trimmed.slice(0, 10);
            blocks.push({
                title: "Calldata (Unknown Function)",
                lines: [
                    `Function selector: ${selector}`,
                    `Raw calldata: ${trimmed}`,
                ],
            });
        }

        return { blocks };
    }

    let parsed: unknown;
    try {
        parsed = safeJsonParse(trimmed);
    } catch (e) {
        return { blocks: [], error: "JSON tidak valid. Pastikan formatnya benar atau tempel calldata 0x..." };
    }

    if (!parsed || typeof parsed !== "object") {
        return { blocks: [], error: "Input harus JSON object atau calldata hex." };
    }

    const obj = parsed as Record<string, unknown>;
    const method = typeof obj.method === "string" ? obj.method : null;

    if (method === "eth_sendTransaction" && Array.isArray(obj.params) && obj.params[0] && typeof obj.params[0] === "object") {
        const tx = obj.params[0] as Record<string, unknown>;
        blocks.push(summarizeTransactionObject(tx));

        const data = extractCalldata(tx);
        if (data) {
            const erc20 = decodeErc20Call(data);
            if (erc20) blocks.push(erc20);
        }

        return { blocks };
    }

    if (method === "eth_signTypedData_v4") {
        if (Array.isArray(obj.params) && typeof obj.params[1] === "string") {
            try {
                const typed = JSON.parse(obj.params[1]);
                if (typed && typeof typed === "object") {
                    blocks.push(summarizeTypedData(typed as Record<string, unknown>));
                    return { blocks };
                }
            } catch {
                return { blocks: [], error: "Field typedData (params[1]) tidak bisa diparse sebagai JSON." };
            }
        }
    }

    if (obj.domain && obj.types && obj.message) {
        blocks.push(summarizeTypedData(obj));
        return { blocks };
    }

    const txLike = (typeof obj.to === "string" || typeof obj.data === "string");
    if (txLike) {
        blocks.push(summarizeTransactionObject(obj));
        const data = extractCalldata(obj);
        if (data) {
            const erc20 = decodeErc20Call(data);
            if (erc20) blocks.push(erc20);
        }
        return { blocks };
    }

    const calldata = extractCalldata(obj);
    if (calldata) {
        const erc20 = decodeErc20Call(calldata);
        if (erc20) {
            blocks.push(erc20);
        } else {
            blocks.push({
                title: "Payload Summary",
                lines: [
                    `Ada calldata tapi belum bisa dikenali.`,
                    `Function selector: ${calldata.slice(0, 10)}`,
                ],
            });
        }
        return { blocks };
    }

    blocks.push({
        title: "Payload Summary",
        lines: [
            "Format belum dikenali.",
            "Coba paste payload dari wallet (JSON) atau calldata 0x...",
        ],
    });
    return { blocks };
}

export default function TranslatorPage() {
    const [input, setInput] = useState("");
    const [submitted, setSubmitted] = useState<string | null>(null);

    const [mode, setMode] = useState<"paste" | "manual" | "txhash">("paste");
    const [manualType, setManualType] = useState<"transaction" | "signature">("transaction");
    const [manualNetwork, setManualNetwork] = useState("");
    const [manualRequestFrom, setManualRequestFrom] = useState("");
    const [manualInteractingWith, setManualInteractingWith] = useState("");
    const [manualAmount, setManualAmount] = useState("");
    const [manualMessage, setManualMessage] = useState("");

    const [txChain, setTxChain] = useState<"base" | "ethereum" | "bsc">("base");
    const [txHash, setTxHash] = useState("");
    const [txLoading, setTxLoading] = useState(false);
    const [txError, setTxError] = useState<string | null>(null);

    const translation = useMemo(() => {
        if (submitted === null) return { blocks: [] as OutputBlock[], error: undefined as string | undefined };
        return translateInput(submitted);
    }, [submitted]);

    const exampleSendTx = `{
  "method": "eth_sendTransaction",
  "params": [
    {
      "from": "0x0000000000000000000000000000000000000001",
      "to": "0x0000000000000000000000000000000000000002",
      "value": "0x0",
      "data": "0x095ea7b300000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001"
    }
  ]
}`;

    const exampleMetaMaskTx = `Transaction request
Network: Base Sepolia
Request from: superbridge.app
Interacting with: Proxy
Amount: 0.02 ETH`;

    const exampleMetaMaskSig = `Signature request
Network: Base Sepolia
Request from: faucets.chain.link
Message: Welcome to Chainlink Faucets! We require a signature in order to ensure you are the owner of the wallet requesting funds.`;

    function buildManualPayload(): string {
        const lines: string[] = [];
        if (manualType === "transaction") lines.push("Transaction request");
        else lines.push("Signature request");

        if (manualNetwork.trim()) lines.push(`Network: ${manualNetwork.trim()}`);
        if (manualRequestFrom.trim()) lines.push(`Request from: ${manualRequestFrom.trim()}`);

        if (manualType === "transaction") {
            if (manualInteractingWith.trim()) lines.push(`Interacting with: ${manualInteractingWith.trim()}`);
            if (manualAmount.trim()) lines.push(`Amount: ${manualAmount.trim()}`);
        } else {
            if (manualMessage.trim()) lines.push(`Message: ${manualMessage.trim()}`);
        }

        return lines.join("\n");
    }

    async function handleTranslateTxHash() {
        const trimmed = txHash.trim();
        if (!trimmed) {
            setTxError("Masukkan tx hash dulu.");
            return;
        }

        if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
            setTxError("Tx hash tidak valid (harus 0x + 64 hex)." );
            return;
        }

        try {
            setTxLoading(true);
            setTxError(null);
            setSubmitted(null);

            const res = await fetch(`/api/tx?chain=${txChain}&hash=${trimmed}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Gagal fetch tx" );
            }

            // Feed a tx-like object into the existing translator.
            setSubmitted(
                JSON.stringify({
                    from: data.from,
                    to: data.to,
                    value: data.value,
                    data: data.data,
                    chainId: data.chain,
                    hash: data.hash,
                    status: data.status,
                    blockNumber: data.blockNumber,
                })
            );
        } catch (e: any) {
            setTxError(e?.message || "Gagal fetch tx" );
        } finally {
            setTxLoading(false);
        }
    }

    const exampleTypedData = `{
  "domain": {
    "name": "Example Dapp",
    "version": "1",
    "chainId": 8453,
    "verifyingContract": "0x0000000000000000000000000000000000000002"
  },
  "primaryType": "Permit",
  "types": {
    "EIP712Domain": [
      {"name":"name","type":"string"},
      {"name":"version","type":"string"},
      {"name":"chainId","type":"uint256"},
      {"name":"verifyingContract","type":"address"}
    ],
    "Permit": [
      {"name":"owner","type":"address"},
      {"name":"spender","type":"address"},
      {"name":"value","type":"uint256"},
      {"name":"nonce","type":"uint256"},
      {"name":"deadline","type":"uint256"}
    ]
  },
  "message": {
    "owner": "0x0000000000000000000000000000000000000001",
    "spender": "0x0000000000000000000000000000000000000002",
    "value": "1000000",
    "nonce": "0",
    "deadline": "9999999999"
  }
}`;

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

            <div className={styles.headerFixed}>
                <h1 className={styles.title}>Translator</h1>
            </div>

            {/* Content */}
            <div className={styles.contentWrapper}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🧾</div>
                    <h2 className={styles.emptyTitle}>Wallet Prompt Translator</h2>
                    <p className={styles.emptyText}>
                        Ubah prompt wallet (JSON / calldata) jadi ringkasan bahasa manusia.
                        <br />
                        Masih bingung istilah seperti approve/permit? Baca ringkasannya di{" "}
                        <Link href="/teacher" style={{ color: "rgba(147, 197, 253, 0.95)", textDecoration: "underline" }}>
                            Teacher
                        </Link>
                        .
                    </p>
                </div>

                <div className={styles.modeTabs}>
                    <button
                        type="button"
                        className={`${styles.modeTab} ${mode === "paste" ? styles.modeTabActive : ""}`}
                        onClick={() => {
                            setMode("paste");
                            setSubmitted(null);
                        }}
                    >
                        Paste Payload
                    </button>
                    <button
                        type="button"
                        className={`${styles.modeTab} ${mode === "manual" ? styles.modeTabActive : ""}`}
                        onClick={() => {
                            setMode("manual");
                            setSubmitted(null);
                        }}
                    >
                        Manual Input
                    </button>
                    <button
                        type="button"
                        className={`${styles.modeTab} ${mode === "txhash" ? styles.modeTabActive : ""}`}
                        onClick={() => {
                            setMode("txhash");
                            setSubmitted(null);
                        }}
                    >
                        Tx Hash
                    </button>
                </div>

                <div className={styles.translatorLayout}>
                    <div className={styles.card}>
                        {mode === "paste" ? (
                            <>
                                <h2 className={styles.cardTitle}>Paste Wallet Payload</h2>
                                <p className={styles.cardSubtext}>
                                    Tempel JSON / calldata `0x...` / atau copasan MetaMask (Transaction request / Signature request).
                                </p>

                                <textarea
                                    className={styles.textarea}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Paste JSON, 0x..., atau teks MetaMask"
                                    rows={12}
                                />

                                <div className={styles.toolbar}>
                                    <div className={styles.toolbarGroup}>
                                        <button
                                            className={styles.secondaryButton}
                                            type="button"
                                            onClick={() => {
                                                setInput(exampleSendTx);
                                                setSubmitted(null);
                                            }}
                                        >
                                            Example: sendTransaction
                                        </button>
                                        <button
                                            className={styles.secondaryButton}
                                            type="button"
                                            onClick={() => {
                                                setInput(exampleTypedData);
                                                setSubmitted(null);
                                            }}
                                        >
                                            Example: typedData
                                        </button>
                                        <button
                                            className={styles.secondaryButton}
                                            type="button"
                                            onClick={() => {
                                                setInput(exampleMetaMaskTx);
                                                setSubmitted(null);
                                            }}
                                        >
                                            Example: MetaMask tx
                                        </button>
                                        <button
                                            className={styles.secondaryButton}
                                            type="button"
                                            onClick={() => {
                                                setInput(exampleMetaMaskSig);
                                                setSubmitted(null);
                                            }}
                                        >
                                            Example: MetaMask sig
                                        </button>
                                        <button
                                            className={styles.ghostButton}
                                            type="button"
                                            onClick={() => {
                                                setInput("");
                                                setSubmitted(null);
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    <div className={styles.toolbarRight}>
                                        <button
                                            className={styles.primaryButton}
                                            type="button"
                                            onClick={() => setSubmitted(input)}
                                        >
                                            Translate
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : mode === "manual" ? (
                            <>
                                <h2 className={styles.cardTitle}>Manual Input</h2>
                                <p className={styles.cardSubtext}>
                                    Isi data sesuai yang kamu lihat di wallet. Sistem akan merangkum secara otomatis.
                                </p>

                                <div className={styles.formGrid}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Request type</label>
                                        <select
                                            className={styles.select}
                                            value={manualType}
                                            onChange={(e) => {
                                                setManualType(e.target.value as "transaction" | "signature");
                                                setSubmitted(null);
                                            }}
                                        >
                                            <option value="transaction">Transaction request</option>
                                            <option value="signature">Signature request</option>
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Network</label>
                                        <input
                                            className={styles.textInput}
                                            value={manualNetwork}
                                            onChange={(e) => setManualNetwork(e.target.value)}
                                            placeholder="Base Sepolia"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Request from</label>
                                        <input
                                            className={styles.textInput}
                                            value={manualRequestFrom}
                                            onChange={(e) => setManualRequestFrom(e.target.value)}
                                            placeholder="superbridge.app"
                                        />
                                    </div>

                                    {manualType === "transaction" ? (
                                        <>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Interacting with</label>
                                                <input
                                                    className={styles.textInput}
                                                    value={manualInteractingWith}
                                                    onChange={(e) => setManualInteractingWith(e.target.value)}
                                                    placeholder="Proxy / 0x..."
                                                />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Amount</label>
                                                <input
                                                    className={styles.textInput}
                                                    value={manualAmount}
                                                    onChange={(e) => setManualAmount(e.target.value)}
                                                    placeholder="0.02 ETH"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.fieldFull}>
                                            <label className={styles.label}>Message</label>
                                            <textarea
                                                className={styles.textareaSmall}
                                                value={manualMessage}
                                                onChange={(e) => setManualMessage(e.target.value)}
                                                placeholder="Paste message yang tampil di wallet"
                                                rows={6}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className={styles.toolbar}>
                                    <div className={styles.toolbarGroup}>
                                        <button
                                            className={styles.ghostButton}
                                            type="button"
                                            onClick={() => {
                                                setManualNetwork("");
                                                setManualRequestFrom("");
                                                setManualInteractingWith("");
                                                setManualAmount("");
                                                setManualMessage("");
                                                setSubmitted(null);
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    <button
                                        className={styles.primaryButton}
                                        type="button"
                                        onClick={() => setSubmitted(buildManualPayload())}
                                    >
                                        Translate
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className={styles.cardTitle}>Translate from Tx Hash</h2>
                                <p className={styles.cardSubtext}>
                                    Tempel tx hash untuk ambil detail transaksi dari chain, lalu sistem decode `to/value/data`.
                                </p>

                                <div className={styles.formGrid}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Chain</label>
                                        <select
                                            className={styles.select}
                                            value={txChain}
                                            onChange={(e) => {
                                                setTxChain(e.target.value as "base" | "ethereum" | "bsc");
                                                setTxError(null);
                                                setSubmitted(null);
                                            }}
                                            disabled={txLoading}
                                        >
                                            <option value="base">Base</option>
                                            <option value="ethereum">Ethereum</option>
                                            <option value="bsc">BSC</option>
                                        </select>
                                    </div>
                                    <div className={styles.fieldFull}>
                                        <label className={styles.label}>Tx Hash</label>
                                        <input
                                            className={styles.textInput}
                                            value={txHash}
                                            onChange={(e) => setTxHash(e.target.value)}
                                            placeholder="0x..."
                                            disabled={txLoading}
                                        />
                                    </div>
                                </div>

                                {txError && <div className={styles.errorBox}>{txError}</div>}

                                <div className={styles.toolbar}>
                                    <div className={styles.toolbarGroup}>
                                        <button
                                            className={styles.ghostButton}
                                            type="button"
                                            onClick={() => {
                                                setTxHash("");
                                                setTxError(null);
                                                setSubmitted(null);
                                            }}
                                            disabled={txLoading}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <button
                                        className={styles.primaryButton}
                                        type="button"
                                        onClick={handleTranslateTxHash}
                                        disabled={txLoading}
                                    >
                                        {txLoading ? "Fetching…" : "Translate"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Human-readable Summary</h2>

                        {submitted === null ? (
                            <div className={styles.placeholderBox}>
                                Klik `Translate` untuk lihat hasil.
                            </div>
                        ) : translation.error ? (
                            <div className={styles.errorBox}>{translation.error}</div>
                        ) : translation.blocks.length === 0 ? (
                            <div className={styles.placeholderBox}>Tidak ada output.</div>
                        ) : (
                            <div className={styles.blocks}>
                                {translation.blocks.map((b) => (
                                    <div key={b.title} className={styles.block}>
                                        <div className={styles.blockTitle}>{b.title}</div>
                                        <div className={styles.blockBody}>
                                            <ul className={styles.blockList}>
                                                {b.lines.map((line, idx) => (
                                                    <li key={idx} className={styles.blockLine}>
                                                        {line}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

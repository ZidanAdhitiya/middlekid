"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { parseUnits, toHex } from "viem";
import Link from "next/link";
import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import WalletConnect from "../components/WalletConnect";
import styles from "./page.module.css";

const optionFactoryAbi = [
    {
        inputs: [
            {
                components: [
                    { internalType: "address", name: "requester", type: "address" },
                    { internalType: "address", name: "existingOptionAddress", type: "address" },
                    { internalType: "address", name: "collateral", type: "address" },
                    { internalType: "address", name: "collateralPriceFeed", type: "address" },
                    { internalType: "address", name: "implementation", type: "address" },
                    { internalType: "uint256[]", name: "strikes", type: "uint256[]" },
                    { internalType: "uint256", name: "numContracts", type: "uint256" },
                    { internalType: "uint256", name: "requesterDeposit", type: "uint256" },
                    { internalType: "uint256", name: "collateralAmount", type: "uint256" },
                    { internalType: "uint256", name: "expiryTimestamp", type: "uint256" },
                    { internalType: "uint256", name: "offerEndTimestamp", type: "uint256" },
                    { internalType: "bool", name: "isRequestingLongPosition", type: "bool" },
                    { internalType: "bool", name: "convertToLimitOrder", type: "bool" },
                    { internalType: "bytes", name: "extraOptionData", type: "bytes" },
                ],
                internalType: "struct OptionFactory.QuotationParameters",
                name: "params",
                type: "tuple",
            },
            {
                components: [
                    { internalType: "uint256", name: "referralId", type: "uint256" },
                    { internalType: "uint256", name: "eventCode", type: "uint256" },
                ],
                internalType: "struct OptionFactory.QuotationTracking",
                name: "tracking",
                type: "tuple",
            },
            { internalType: "uint256", name: "reservePrice", type: "uint256" },
            { internalType: "string", name: "requesterPublicKey", type: "string" },
        ],
        name: "requestForQuotation",
        outputs: [{ internalType: "uint256", name: "quotationId", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "quotationId", type: "uint256" }],
        name: "cancelQuotation",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "quotationId", type: "uint256" },
            { indexed: true, internalType: "address", name: "requester", type: "address" },
        ],
        name: "QuotationRequested",
        type: "event",
    },
] as const;

export default function TimeTravellerPage() {
    const [step, setStep] = useState<"setup" | "quote" | "confirm">("setup");
    const [direction, setDirection] = useState<"bullish" | "bearish">("bullish");
    const [asset, setAsset] = useState<"WETH">("WETH");
    const [tenor, setTenor] = useState<"7d" | "14d" | "30d" | "90d">("30d");
    const [size, setSize] = useState("1");
    const [strikeUsd, setStrikeUsd] = useState("3000");
    const [publicKey, setPublicKey] = useState(() => {
        try {
            const bytes = new Uint8Array(32);
            crypto.getRandomValues(bytes);
            return toHex(bytes);
        } catch {
            return "0x" + "00".repeat(32);
        }
    });

    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [switchError, setSwitchError] = useState<string | null>(null);
    const [flowError, setFlowError] = useState<string | null>(null);
    const [txError, setTxError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const optionFactoryAddressBase = "0x1aDcD391CF15Fb699Ed29B1D394F4A64106886e5" as const;
    const optionImplementationInverseCallBase = "0x3CeB524cBA83D2D4579F5a9F8C0D1f5701dd16FE" as const;
    const optionImplementationPutBase = "0xF480F636301d50Ed570D026254dC5728b746A90F" as const;

    const baseWeth = "0x4200000000000000000000000000000000000006" as const;
    const baseUsdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
    const baseEthUsdPriceFeed = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" as const;

    const quotePreview = useMemo(() => {
        const parsedSize = Number(size);
        const normalizedSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 0;

        const tenorDays = tenor === "7d" ? 7 : tenor === "14d" ? 14 : tenor === "30d" ? 30 : 90;
        const expiry = new Date(Date.now() + tenorDays * 24 * 60 * 60 * 1000);

        // Placeholder economics until we wire real RFQ offer decryption.
        // We keep it explicit in UI: these are estimates.
        const estimatedPremiumPerContract = direction === "bullish" ? 0.01 : 0.012;
        const estimatedPremium = estimatedPremiumPerContract * normalizedSize;

        return {
            normalizedSize,
            tenorDays,
            expiry,
            estimatedPremium,
            maxLoss: estimatedPremium,
        };
    }, [direction, size, tenor]);

    const onBase = chainId === base.id;

    async function handleSwitchToBase() {
        try {
            setSwitchError(null);
            await switchChainAsync({ chainId: base.id });
        } catch (e: any) {
            setSwitchError(e?.message || "Gagal switch network");
        }
    }

    function handleNextFromSetup() {
        setFlowError(null);
        if (!isConnected) {
            setFlowError("Connect wallet dulu untuk lanjut.");
            return;
        }
        setStep("quote");
    }

    function handleNextFromQuote() {
        setFlowError(null);
        if (!quotePreview.normalizedSize) {
            setFlowError("Size harus lebih dari 0.");
            return;
        }
        setStep("confirm");
    }

    async function handleExecute() {
        setTxError(null);
        setTxHash(null);

        if (!address) {
            setTxError("Wallet belum connect.");
            return;
        }

        if (!publicClient || !walletClient) {
            setTxError("Wallet client belum siap. Coba refresh dan connect ulang.");
            return;
        }

        const numContracts = Math.floor(Number(size));
        if (!Number.isFinite(numContracts) || numContracts <= 0) {
            setTxError("Size harus angka bulat > 0 (sementara ini).");
            return;
        }

        let strike;
        try {
            strike = parseUnits(strikeUsd || "0", 8);
        } catch {
            setTxError("Strike USD tidak valid.");
            return;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const tenorDays = tenor === "7d" ? 7 : tenor === "14d" ? 14 : tenor === "30d" ? 30 : 90;
        const expiryTimestamp = BigInt(nowSec + tenorDays * 24 * 60 * 60);

        // Give makers a short time window to respond.
        const offerEndTimestamp = BigInt(nowSec + 10 * 60);

        const isBullish = direction === "bullish";
        const implementation = isBullish ? optionImplementationInverseCallBase : optionImplementationPutBase;
        const collateral = isBullish ? baseWeth : baseUsdc;

        const params = {
            requester: address,
            existingOptionAddress: "0x0000000000000000000000000000000000000000",
            collateral,
            collateralPriceFeed: baseEthUsdPriceFeed,
            implementation,
            strikes: [strike],
            numContracts: BigInt(numContracts),
            requesterDeposit: 0n,
            collateralAmount: 0n,
            expiryTimestamp,
            offerEndTimestamp,
            isRequestingLongPosition: true,
            convertToLimitOrder: false,
            extraOptionData: "0x",
        };

        const tracking = {
            referralId: 0n,
            eventCode: 0n,
        };

        setIsExecuting(true);
        try {
            const { request } = await publicClient.simulateContract({
                address: optionFactoryAddressBase,
                abi: optionFactoryAbi,
                functionName: "requestForQuotation",
                args: [params, tracking, 0n, publicKey],
                account: address,
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);
        } catch (e: any) {
            setTxError(e?.shortMessage || e?.message || "Transaction failed");
        } finally {
            setIsExecuting(false);
        }
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

            {/* Top-right Wallet Button - Always visible */}
            <div className={styles.walletConnectWrapper}>
                <WalletConnect />
            </div>

            {/* Centered Title - Fixed at Top */}
            <div className={styles.header}>
                <h1 className={styles.title}>Time Traveller</h1>
            </div>

            {/* Content */}
            <div className={styles.contentWrapper}>
                <div className={styles.layout}>
                    <div className={styles.card}>
                        <div className={styles.stepTabs}>
                            <button
                                type="button"
                                className={`${styles.stepTab} ${step === "setup" ? styles.stepTabActive : ""}`}
                                onClick={() => setStep("setup")}
                            >
                                Setup
                            </button>
                            <button
                                type="button"
                                className={`${styles.stepTab} ${step === "quote" ? styles.stepTabActive : ""}`}
                                onClick={() => setStep("quote")}
                                disabled={!isConnected}
                            >
                                Quote
                            </button>
                            <button
                                type="button"
                                className={`${styles.stepTab} ${step === "confirm" ? styles.stepTabActive : ""}`}
                                onClick={() => setStep("confirm")}
                                disabled={!isConnected}
                            >
                                Confirm
                            </button>
                        </div>

                        {step === "setup" && (
                            <>
                                <h2 className={styles.cardTitle}>Setup</h2>
                                <p className={styles.cardSubtext}>
                                    Isi pilihan kamu pelan-pelan. Step berikutnya cuma menampilkan estimasi dan penjelasan.
                                    Belum ada transaksi yang dilakukan.
                                </p>

                                <div className={styles.segmented}>
                                    <button
                                        type="button"
                                        className={`${styles.segment} ${direction === "bullish" ? styles.segmentActive : ""}`}
                                        onClick={() => setDirection("bullish")}
                                    >
                                        Bullish (Long Call)
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.segment} ${direction === "bearish" ? styles.segmentActive : ""}`}
                                        onClick={() => setDirection("bearish")}
                                    >
                                        Bearish (Long Put)
                                    </button>
                                </div>

                                <div className={styles.formGrid}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Asset</label>
                                        <select
                                            className={styles.select}
                                            value={asset}
                                            onChange={(e) => setAsset(e.target.value as "WETH")}
                                        >
                                            <option value="WETH">WETH</option>
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Tenor</label>
                                        <select
                                            className={styles.select}
                                            value={tenor}
                                            onChange={(e) => setTenor(e.target.value as "7d" | "14d" | "30d" | "90d")}
                                        >
                                            <option value="7d">7 days</option>
                                            <option value="14d">14 days</option>
                                            <option value="30d">30 days</option>
                                            <option value="90d">90 days</option>
                                        </select>
                                    </div>

                                    <div className={styles.fieldFull}>
                                        <label className={styles.label}>Size</label>
                                        <input
                                            className={styles.textInput}
                                            value={size}
                                            onChange={(e) => setSize(e.target.value)}
                                            placeholder="1"
                                            inputMode="decimal"
                                        />
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        className={styles.primaryButton}
                                        type="button"
                                        onClick={handleNextFromSetup}
                                        disabled={!isConnected}
                                    >
                                        Next: Quote
                                    </button>
                                </div>

                                {flowError && <div className={styles.errorBox}>{flowError}</div>}
                            </>
                        )}

                        {step === "quote" && (
                            <>
                                <h2 className={styles.cardTitle}>Quote (Estimate)</h2>
                                <p className={styles.cardSubtext}>
                                    Ini <strong>perkiraan</strong> untuk bantu kamu memahami biaya dan risiko.
                                    Angka final bisa berbeda ketika RFQ on-chain diproses.
                                </p>

                                <div className={styles.infoBox}>
                                    <div className={styles.infoTitle}>Estimate</div>
                                    <ul className={styles.miniList}>
                                        <li>
                                            Expiry target: {quotePreview.expiry.toLocaleDateString()} ({quotePreview.tenorDays} days)
                                        </li>
                                        <li>Estimated premium: ~{quotePreview.estimatedPremium.toFixed(4)} {asset}</li>
                                        <li>Max loss (worst case): ~{quotePreview.maxLoss.toFixed(4)} {asset}</li>
                                    </ul>
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.secondaryButton} type="button" onClick={() => setStep("setup")}>
                                        Back
                                    </button>
                                    <button className={styles.primaryButton} type="button" onClick={handleNextFromQuote}>
                                        Next: Confirm
                                    </button>
                                </div>

                                {flowError && <div className={styles.errorBox}>{flowError}</div>}
                            </>
                        )}

                        {step === "confirm" && (
                            <>
                                <h2 className={styles.cardTitle}>Confirm</h2>
                                <p className={styles.cardSubtext}>
                                    Di step ini kamu melihat detail target kontrak. Klik <strong>Execute</strong> hanya kalau kamu benar-benar
                                    paham risikonya, lalu konfirmasi lagi di wallet.
                                </p>

                                <div className={styles.infoBox}>
                                    <div className={styles.infoTitle}>Execution target</div>
                                    <ul className={styles.miniList}>
                                        <li>Network: Base</li>
                                        <li>OptionFactory: {optionFactoryAddressBase}</li>
                                    </ul>
                                </div>

                                <div className={styles.formGrid} style={{ marginTop: "1rem" }}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Strike (USD)</label>
                                        <input
                                            className={styles.textInput}
                                            value={strikeUsd}
                                            onChange={(e) => setStrikeUsd(e.target.value)}
                                            placeholder="3000"
                                            inputMode="decimal"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Requester Public Key</label>
                                        <input
                                            className={styles.textInput}
                                            value={publicKey}
                                            onChange={(e) => setPublicKey(e.target.value)}
                                            placeholder="0x…"
                                        />
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    {!onBase ? (
                                        <button
                                            className={styles.primaryButton}
                                            type="button"
                                            onClick={handleSwitchToBase}
                                            disabled={isSwitching}
                                        >
                                            {isSwitching ? "Switching…" : "Switch to Base"}
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.primaryButton}
                                            type="button"
                                            onClick={handleExecute}
                                            disabled={isExecuting || !walletClient || !publicClient}
                                        >
                                            {isExecuting ? "Executing…" : "Execute"}
                                        </button>
                                    )}

                                    <button className={styles.secondaryButton} type="button" onClick={() => setStep("quote")}>
                                        Back
                                    </button>
                                </div>

                                {txHash && (
                                    <div className={styles.infoBox} style={{ marginTop: "1rem" }}>
                                        <div className={styles.infoTitle}>Transaction sent</div>
                                        <div style={{ wordBreak: "break-all" }}>{txHash}</div>
                                    </div>
                                )}

                                {txError && <div className={styles.errorBox}>{txError}</div>}
                            </>
                        )}

                        {switchError && <div className={styles.errorBox}>{switchError}</div>}
                    </div>

                    <div className={styles.card}>
                        <div className={styles.pill}>Powered by Thetanuts</div>
                        <h2 className={styles.cardTitle}>Ini sebenarnya “trading” seperti di exchange?</h2>
                        <p className={styles.cardSubtext}>
                            Tidak persis. Di exchange biasanya kamu beli/jual aset (spot) atau leverage. Di sini kamu membuat kontrak
                            “mirip options” yang punya <strong>durasi</strong> dan ada <strong>biaya</strong> (premium).
                            Kalau prediksi kamu salah, biaya itu bisa hilang.
                        </p>
                        <div className={styles.infoBox}>
                            <div className={styles.infoTitle}>Sebelum kamu lanjut</div>
                            <ul className={styles.miniList}>
                                <li>Kamu boleh coba untuk belajar, tapi jangan pakai uang yang kamu nggak siap kehilangan.</li>
                                <li>Lihat <strong>premium</strong> dan pahami itu bisa jadi kerugian maksimal.</li>
                                <li>Kalau wallet minta approve “unlimited” dan kamu ragu: lebih aman batalin.</li>
                            </ul>
                        </div>

                        <div className={styles.infoBox} style={{ marginTop: "1rem" }}>
                            <div className={styles.infoTitle}>Your setup (preview)</div>
                            <ul className={styles.miniList}>
                                <li>Direction: {direction === "bullish" ? "Bullish (Long Call)" : "Bearish (Long Put)"}</li>
                                <li>Asset: {asset}</li>
                                <li>Tenor: {tenor}</li>
                                <li>Size: {size || "(empty)"}</li>
                            </ul>
                        </div>

                        <div className={styles.infoBox} style={{ marginTop: "1rem" }}>
                            <div className={styles.infoTitle}>Plain-English meaning</div>
                            <ul className={styles.miniList}>
                                <li>
                                    <strong>Bullish</strong>: kamu bayar biaya (premium). Kalau harga naik, posisi kamu bisa untung.
                                </li>
                                <li>
                                    <strong>Bearish</strong>: kamu bayar biaya (premium). Kalau harga turun, posisi kamu bisa untung.
                                </li>
                                <li>
                                    <strong>Worst case</strong>: kamu bisa rugi sebesar premium yang kamu bayar.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>⏳</div>
                    <h2 className={styles.emptyTitle}>Options-like Time Simulator</h2>
                    <p className={styles.emptyText}>
                        Time Traveller membantu kamu memahami strategi yang mirip <strong>options</strong> di on-chain.
                        Ini <strong>bukan</strong> spot trading biasa dan bukan leverage seperti di exchange.
                    </p>

                    <ul className={styles.explainerBullets}>
                        <li>
                            <strong>Bullish</strong> (mirip <strong>Call</strong>) = untung kalau harga naik melewati strike.
                        </li>
                        <li>
                            <strong>Bearish</strong> (mirip <strong>Put</strong>) = untung kalau harga turun melewati strike.
                        </li>
                        <li>
                            Tidak ada transaksi yang dikirim sampai kamu klik <strong>Execute</strong> dan konfirmasi di wallet.
                        </li>
                    </ul>

                    <details className={styles.explainerDetails}>
                        <summary className={styles.explainerSummary}>Kontrak apa yang dibuat (dan kenapa ada RFQ)?</summary>
                        <div className={styles.explainerBody}>
                            Saat kamu klik <strong>Execute</strong>, aplikasi mengirim permintaan quote (RFQ) ke kontrak <strong>OptionFactory</strong> (Thetanuts)
                            di Base. RFQ ini meminta “harga premium” untuk posisi options-like dengan parameter yang kamu pilih.
                        </div>
                    </details>

                    <details className={styles.explainerDetails}>
                        <summary className={styles.explainerSummary}>Kamu bayar apa, dapat apa?</summary>
                        <div className={styles.explainerBody}>
                            Kamu membayar <strong>premium</strong> (biaya posisi). Risiko terburuk biasanya: premium itu bisa habis kalau skenario tidak terjadi
                            sampai expiry. Sebagai gantinya, kamu dapat payoff yang “terbatas ke bawah” (maks rugi = premium) dan potensi untung kalau harga bergerak
                            sesuai skenario.
                        </div>
                    </details>

                    <details className={styles.explainerDetails}>
                        <summary className={styles.explainerSummary}>Flow-nya gimana?</summary>
                        <div className={styles.explainerBody}>
                            Setup = pilih arah + durasi + parameter.
                            <br />
                            Quote = lihat estimasi (belum kirim transaksi).
                            <br />
                            Confirm = kirim RFQ on-chain dan (kalau kamu lanjut) eksekusi untuk membeli posisi.
                        </div>
                    </details>

                    <details className={styles.explainerDetails}>
                        <summary className={styles.explainerSummary}>Risiko & hal yang perlu kamu tahu</summary>
                        <div className={styles.explainerBody}>
                            Harga bisa volatile, quote bisa berubah/expired, dan ada risiko smart contract + gas fee.
                            Kamu selalu bisa berhenti kapan pun. Tidak ada transaksi yang dikirim sampai kamu klik <strong>Execute</strong> dan konfirmasi di wallet.
                        </div>
                    </details>

                    <div className={styles.explainerFooter}>
                        Baru mulai? Baca konsep dasar (wallet, approve, options, premium, strike, expiry) di{" "}
                        <Link href="/teacher" style={{ color: "rgba(147, 197, 253, 0.95)", textDecoration: "underline" }}>
                            Teacher
                        </Link>
                        .
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useMemo, useState } from "react";
import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import styles from "./page.module.css";

type TeacherTab = "crypto-basics" | "features" | "platform" | "safety";

export default function TeacherPage() {
    const [tab, setTab] = useState<TeacherTab>("crypto-basics");
    const [query, setQuery] = useState("");

    const tabContent = useMemo(() => {
        if (tab === "crypto-basics") {
            return {
                title: "Crypto Basics (Mulai dari nol)",
                items: [
                    {
                        title: "Apa itu wallet?",
                        body: "Wallet itu seperti akun + kunci. Address (0x...) adalah ‘nomor rekening’ kamu, sedangkan private key/seed phrase adalah kuncinya. Jangan pernah share seed phrase ke siapa pun.",
                    },
                    {
                        title: "Bedanya wallet (EOA) vs smart contract wallet?",
                        body: "EOA (yang umum di MetaMask) dikontrol oleh private key. Smart contract wallet (misal multi-sig) dikontrol oleh aturan kontrak (bisa butuh 2/3 tanda tangan, ada recovery, dll.). Address sama-sama 0x... tapi cara kontrolnya berbeda.",
                    },
                    {
                        title: "Apa itu public address dan apakah aman dibagikan?",
                        body: "Public address aman dibagikan (orang lain bisa lihat transaksi/holdings kamu). Yang tidak boleh dibagikan adalah seed phrase/private key.",
                    },
                    {
                        title: "Apa itu network/chain?",
                        body: "Network (misal Base/Ethereum) adalah ‘jalur’ tempat transaksi terjadi. Token dan kontrak bisa beda antar chain, jadi pastikan network di wallet sesuai sebelum konfirmasi.",
                    },
                    {
                        title: "Apa itu L1 vs L2?",
                        body: "Ethereum sering disebut L1. Base adalah L2. Umumnya L2 lebih murah/cepat untuk transaksi, tapi tetap ada konsep bridge kalau pindah aset dari L1 ke L2.",
                    },
                    {
                        title: "Apa itu bridge?",
                        body: "Bridge memindahkan aset antar chain (misal Ethereum → Base). Prosesnya bisa butuh waktu, biaya, dan ada risiko smart contract. Pastikan pakai bridge resmi/terpercaya.",
                    },
                    {
                        title: "Apa itu token native vs ERC-20?",
                        body: "ETH adalah token native di Ethereum/Base (dipakai untuk gas). ERC-20 adalah token yang dibuat oleh smart contract (USDC, WETH, dll.).", 
                    },
                    {
                        title: "Kenapa ada WETH padahal sudah ada ETH?",
                        body: "WETH adalah ‘ETH versi ERC-20’. Banyak protokol butuh token ERC-20 agar bisa di-approve dan dipakai di kontrak.",
                    },
                    {
                        title: "Apa itu token & contract?",
                        body: "Token biasanya adalah smart contract. Karena itu, transaksi sering berarti ‘memanggil fungsi’ di contract — bukan sekadar kirim uang.",
                    },
                    {
                        title: "Apa itu dApp?",
                        body: "dApp adalah aplikasi yang berinteraksi dengan smart contract. Saat kamu klik tombol di dApp, biasanya itu menyiapkan transaksi yang nanti kamu setujui di wallet.",
                    },
                    {
                        title: "Apa itu signature vs transaction?",
                        body: "Signature (tanda tangan pesan) biasanya tidak mengirim token/ETH, tapi bisa dipakai untuk login atau memberi izin tertentu (misal permit). Transaction benar-benar mengubah state dan bisa memindahkan aset.",
                    },
                    {
                        title: "Gas fee itu apa?",
                        body: "Gas fee adalah biaya untuk memproses transaksi di blockchain. Biaya bisa naik turun tergantung kepadatan network.",
                    },
                    {
                        title: "Kenapa kadang gas fee mahal?",
                        body: "Kalau network ramai atau transaksi kompleks (misal swap multi-step), gas bisa lebih besar. Di L2, fee biasanya lebih murah, tapi tetap bisa naik kalau ramai.",
                    },
                    {
                        title: "Apa itu nonce?",
                        body: "Nonce adalah nomor urut transaksi dari address kamu. Kalau ada transaksi pending yang ‘nyangkut’, transaksi berikutnya bisa ikut tertahan sampai nonce tersebut selesai/cancel.",
                    },
                    {
                        title: "Apa itu slippage?",
                        body: "Slippage adalah toleransi perubahan harga saat swap. Di pool yang liquidity-nya kecil, slippage bisa besar dan bikin hasil swap jelek.",
                    },
                    {
                        title: "Apa itu liquidity?",
                        body: "Liquidity adalah ‘kedalaman’ pasar. Semakin kecil liquidity, semakin gampang harga tergeser (slippage tinggi) dan makin rawan manipulasi.",
                    },
                    {
                        title: "Approve itu apa dan kenapa berisiko?",
                        body: "Approve memberi izin contract untuk memindahkan token kamu. Kalau approve-nya ‘unlimited’, risikonya lebih besar. Idealnya approve secukupnya dan hanya ke kontrak yang kamu percaya.",
                    },
                    {
                        title: "Bedanya approve vs transfer?",
                        body: "Transfer mengirim token sekarang juga. Approve hanya memberi izin; setelah itu contract bisa melakukan transferFrom sesuai allowance.",
                    },
                    {
                        title: "Apa itu allowance?",
                        body: "Allowance adalah batas maksimum token yang boleh dipindahkan oleh spender. Ini yang di-set lewat approve.",
                    },
                    {
                        title: "Apa itu revoke (cabut izin)?",
                        body: "Kamu bisa cabut allowance (set ke 0) agar contract tidak bisa lagi memindahkan token. Ini bagus untuk hygiene keamanan setelah selesai pakai dApp.",
                    },
                    {
                        title: "Apa itu DEX vs CEX?",
                        body: "CEX (exchange terpusat) seperti Binance: akun kamu dipegang exchange. DEX (on-chain) seperti Uniswap: kamu tetap pegang wallet, tapi semua aksi terjadi lewat smart contract.",
                    },
                    {
                        title: "Apa itu AMM (swap pool)?",
                        body: "Banyak DEX pakai AMM: harga ditentukan oleh pool liquidity, bukan orderbook. Dampaknya: swap besar di pool kecil bisa bikin slippage besar.",
                    },
                    {
                        title: "Apa itu LP (liquidity provider) dan risikonya?",
                        body: "LP itu menyetor 2 aset ke pool untuk dapat fee. Risiko utamanya: impermanent loss (nilai bisa lebih kecil dibanding hanya hold), plus risiko smart contract.",
                    },
                    {
                        title: "Apa itu stablecoin dan risikonya?",
                        body: "Stablecoin (USDC/USDT/DAI) berusaha stabil ke $1. Risiko: depeg, risiko issuer (kalau terpusat), dan risiko smart contract (kalau terdesentralisasi).",
                    },
                    {
                        title: "Apa itu NFT?",
                        body: "NFT adalah token unik (ERC-721/1155). Waspada izin ‘setApprovalForAll’ karena itu memberi izin penuh ke operator untuk memindahkan NFT.",
                    },
                    {
                        title: "Apa itu airdrop dan kenapa sering jadi scam?",
                        body: "Airdrop legit ada, tapi scam juga banyak: situs palsu, minta sign/approve aneh, atau minta seed phrase. Selalu cek sumber resmi.",
                    },
                    {
                        title: "Apa itu rugpull?",
                        body: "Rugpull biasanya ketika liquidity ditarik atau token dibuat tidak bisa dijual. Red flags: liquidity kecil, owner privileges kuat, tax tinggi, atau contract tidak terverifikasi.",
                    },
                ],
                badges: ["Wallet", "Network", "L1/L2", "Token", "Gas", "Approve", "Safety"],
            };
        }

        if (tab === "features") {
            return {
                title: "Fitur MiddleKid (tiap tab buat apa?)",
                items: [
                    {
                        title: "Analyzer",
                        body: "Melihat isi wallet (token holdings) dan estimasi value. Cocok buat cek aset kamu atau cek wallet orang lain (public address) tanpa harus buka explorer satu-satu.",
                    },
                    {
                        title: "Analyzer — kapan dipakai?",
                        body: "Kalau kamu habis airdrop, habis swap, atau habis bridging dan ingin memastikan token sudah masuk. Bisa juga buat cek ‘dompet ini punya apa’ sebelum kamu ikut-ikutan sesuatu.",
                    },
                    {
                        title: "Analyzer — keterbatasan",
                        body: "Nilai USD adalah estimasi dari data market. Token yang tidak punya liquidity/market data bisa terlihat ‘0’ walaupun ada balance.",
                    },
                    {
                        title: "Translator",
                        body: "Menerjemahkan input transaksi/signature (contoh dari MetaMask) jadi bahasa manusia. Tujuannya membantu kamu paham: ‘ini transaksi apa?’ sebelum klik Confirm.",
                    },
                    {
                        title: "Translator — contoh input yang cocok",
                        body: "Teks dari pop-up MetaMask (Transaction request / Signature request), calldata (0x...), atau payload JSON RPC. Kamu bisa paste dan lihat ringkasan.",
                    },
                    {
                        title: "Translator — red flags yang sering muncul",
                        body: "Approve unlimited, setApprovalForAll (NFT), permit, transferFrom, dan domain mencurigakan. Translator membantu kamu spot hal-hal ini.",
                    },
                    {
                        title: "Researcher",
                        body: "Cek risiko token/kontrak dengan data scanner (contoh: honeypot, tax, owner privileges) dan data market (liquidity/volume). Hasilnya membantu kamu decide lebih aman atau harus ekstra hati-hati.",
                    },
                    {
                        title: "Researcher — cara baca hasil",
                        body: "Risk score/level itu indikator, bukan kepastian. Fokus pada ‘reasons’: misal honeypot, hidden owner, tax tinggi, liquidity kecil, atau data tidak tersedia.",
                    },
                    {
                        title: "Researcher — contoh keputusan",
                        body: "Kalau liquidity sangat kecil atau tax tinggi, pertimbangkan untuk tidak masuk. Kalau confidence rendah (data minim), anggap risiko lebih tinggi.",
                    },
                    {
                        title: "Time Traveller",
                        body: "Eksperimen strategi mirip options (bullish/bearish) yang punya durasi dan biaya (premium). Ini bukan spot trading seperti exchange. Kamu bisa lihat estimasi risiko dulu sebelum ada transaksi.",
                    },
                    {
                        title: "Time Traveller — beda dengan futures/leverage",
                        body: "Di futures, PnL bisa naik turun dan bisa kena liquidation. Di options-like, biasanya ada biaya upfront (premium) dan risiko bisa lebih terbatasi (tergantung produk).",
                    },
                    {
                        title: "Time Traveller — hal yang perlu diperhatikan",
                        body: "Strike, tenor (durasi), biaya/premium, dan kondisi market. Kalau tidak yakin, pakai size kecil atau berhenti dulu.",
                    },
                    {
                        title: "Apa arti ‘risk score’ di Researcher?",
                        body: "Itu indikator berbasis data yang tersedia, bukan jaminan aman. Kalau confidence rendah (data minim), anggap hasil belum kuat.",
                    },
                    {
                        title: "Kapan sebaiknya pakai Translator dulu?",
                        body: "Kalau kamu ragu dengan pop-up MetaMask (khususnya approve/unlimited/setApprovalForAll) atau kamu tidak paham ‘Interacting with’. Paste ke Translator sebelum konfirmasi.",
                    },
                    {
                        title: "Flow aman (pemula)",
                        body: "Biasanya urutannya: Researcher untuk cek risiko token/kontrak → Translator untuk cek isi transaksi/approve → baru eksekusi dengan nominal kecil dulu.",
                    },
                ],
                badges: ["Analyzer", "Translator", "Researcher", "Time Traveller", "How to use"],
            };
        }

        if (tab === "platform") {
            return {
                title: "Tentang platform",
                items: [
                    {
                        title: "Tujuan MiddleKid",
                        body: "MiddleKid dibuat untuk membantu kamu membaca dan memahami aktivitas on-chain dengan cara yang lebih ramah pemula: lihat aset, cek risiko, dan pahami isi transaksi.",
                    },
                    {
                        title: "Apakah MiddleKid menyimpan seed phrase?",
                        body: "Tidak. MiddleKid tidak pernah meminta seed phrase/private key. Koneksi wallet terjadi lewat provider wallet (MetaMask, dll.).", 
                    },
                    {
                        title: "Apa yang MiddleKid lihat dari wallet?",
                        body: "Umumnya hanya address publik dan data on-chain yang memang publik. Untuk transaksi, kamu tetap harus konfirmasi di wallet.",
                    },
                    {
                        title: "Data yang dipakai",
                        body: "Beberapa fitur mengambil data publik (misal API market/security scanner). Data ini membantu, tapi tidak selalu lengkap atau 100% akurat.",
                    },
                    {
                        title: "Kenapa hasil bisa beda dengan explorer?",
                        body: "Explorer menampilkan data mentah. MiddleKid menggabungkan beberapa sumber (market/security) dan melakukan estimasi. Kalau salah satu sumber tidak punya data, hasil bisa terlihat berbeda.",
                    },
                    {
                        title: "Apa itu ‘Early Access’ di beberapa halaman?",
                        body: "Artinya fitur masih berkembang. Kamu boleh pakai untuk belajar, tapi tetap gunakan judgement sendiri dan jangan pakai uang yang tidak siap hilang.",
                    },
                    {
                        title: "Batasan",
                        body: "Tidak semua token/kontrak bisa dianalisis sempurna. Kalau data tidak tersedia, MiddleKid akan lebih konservatif dan menyarankan ekstra hati-hati.",
                    },
                    {
                        title: "Kalau ada bug/hasil aneh, apa yang harus dilakukan?",
                        body: "Anggap hasil ‘unknown’ dan jangan langsung eksekusi transaksi. Cek ulang di explorer atau tanya di Teacher/Translator untuk memastikan kamu paham konteksnya.",
                    },
                    {
                        title: "Apakah MiddleKid memberi advice finansial?",
                        body: "Tidak. Konten Teacher bertujuan edukasi dan membantu kamu memahami istilah/risiko. Keputusan akhir tetap di kamu.",
                    },
                    {
                        title: "Kenapa ada fitur yang terlihat ‘menakutkan’?",
                        body: "Karena di crypto, salah klik bisa fatal. MiddleKid sengaja dibuat konservatif: lebih baik kamu cancel dan cek ulang daripada buru-buru.",
                    },
                ],
                badges: ["Privacy", "Public Data", "Early Access", "Limitations"],
            };
        }

        return {
            title: "Safety (anti-scam checklist)",
            items: [
                {
                    title: "Jangan pernah share seed phrase",
                    body: "Seed phrase/private key adalah akses penuh ke wallet. Tim/CS/app apa pun yang minta seed phrase = scam.",
                },
                {
                    title: "Kalau ada yang minta remote access / install app",
                    body: "Scam sering minta kamu install app/extension aneh atau remote desktop. Rule of thumb: jangan pernah kasih akses device kamu.",
                },
                {
                    title: "Periksa domain & izin",
                    body: "Pastikan domain benar (bukan typo). Untuk approve, cek siapa spender-nya, dan hindari unlimited kalau kamu belum yakin.",
                },
                {
                    title: "Hindari approve unlimited kalau kamu belum paham",
                    body: "Unlimited approve bukan selalu scam, tapi memperbesar dampak kalau contract/website kompromi. Kalau memungkinkan, approve secukupnya.",
                },
                {
                    title: "Bedakan signature vs transaction",
                    body: "Signature biasanya tidak mengirim token/ETH, tapi bisa jadi izin login/aksi lain. Transaction akan mengubah state dan bisa memindahkan aset.",
                },
                {
                    title: "Waspada permit / setApprovalForAll",
                    body: "Permit bisa memberi izin tanpa approve biasa. setApprovalForAll memberi izin penuh untuk NFT collection. Kalau kamu tidak yakin, cancel.",
                },
                {
                    title: "Cek ‘Interacting with’ di MetaMask",
                    body: "Kalau contract address-nya aneh atau tidak sesuai dengan yang kamu harapkan, jangan lanjut. Translator bisa bantu jelasin calldata kalau kamu paste.",
                },
                {
                    title: "Waspada token yang ‘tidak bisa dijual’",
                    body: "Honeypot biasanya terlihat dari laporan scanner atau dari pola: bisa buy tapi gagal sell. Researcher membantu mendeteksi indikasi ini.",
                },
                {
                    title: "Kalau bingung: stop",
                    body: "Tidak apa-apa cancel. Lebih baik kehilangan peluang daripada kehilangan aset karena salah klik.",
                },
                {
                    title: "Checklist 30 detik sebelum klik Confirm",
                    body: "1) Domain benar. 2) Network benar. 3) ‘Interacting with’ sesuai. 4) Tidak ada approve/setApprovalForAll yang kamu tidak pahami. 5) Jumlah/token benar.",
                },
                {
                    title: "Kalau token ‘naik gila-gilaan’ tapi liquidity kecil",
                    body: "Harga bisa mudah dimanipulasi. Di pool kecil, beberapa swap bisa gerakin harga. Cek liquidity dan apakah kamu benar-benar bisa sell.",
                },
                {
                    title: "Hati-hati ‘airdrop claim’ yang minta approve",
                    body: "Claim biasanya cukup signature atau tx sederhana. Kalau tiba-tiba minta approve token bernilai atau setApprovalForAll NFT, itu red flag.",
                },
                {
                    title: "Hati-hati saat connect wallet",
                    body: "Connect wallet saja tidak memindahkan aset. Yang berbahaya adalah approve/signature/tx setelah connect. Tapi tetap pastikan domain-nya benar.",
                },
            ],
            badges: ["Seed Phrase", "Domain", "Approve", "Signature vs Tx", "NFT", "Honeypot"],
        };
    }, [tab]);

    const filteredItems = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return tabContent.items;

        return tabContent.items.filter((it) => {
            const hay = `${it.title} ${it.body}`.toLowerCase();
            return hay.includes(normalized);
        });
    }, [query, tabContent.items]);

    return (
        <div className={styles.container}>
            <div className={styles.navbar}></div>

            <div className={styles.stars}></div>
            <div className={styles.stars2}></div>
            <div className={styles.stars3}></div>

            <Logo />
            <Navigation />

            <div className={styles.header}>
                <h1 className={styles.title}>Teacher</h1>
            </div>

            <div className={styles.contentWrapper}>
                <p className={styles.subtitle}>
                    Ringkas, newbie-friendly, dan fokus ke hal yang sering bikin orang salah klik. Pilih topik di kiri.
                </p>

                <div className={styles.layout}>
                    <div className={`${styles.card} ${styles.stickyCard}`}>
                        <h2 className={styles.cardTitle}>Topics</h2>
                        <p className={styles.cardSubtext}>Baca pelan-pelan. Nggak perlu hafal — yang penting paham konsepnya.</p>
                        <div className={styles.tabList}>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${tab === "crypto-basics" ? styles.tabButtonActive : ""}`}
                                onClick={() => setTab("crypto-basics")}
                            >
                                <span className={styles.tabIcon}>🧠</span>
                                Crypto Basics
                            </button>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${tab === "features" ? styles.tabButtonActive : ""}`}
                                onClick={() => setTab("features")}
                            >
                                <span className={styles.tabIcon}>🧭</span>
                                Fitur MiddleKid
                            </button>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${tab === "platform" ? styles.tabButtonActive : ""}`}
                                onClick={() => setTab("platform")}
                            >
                                <span className={styles.tabIcon}>🏗️</span>
                                Tentang Platform
                            </button>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${tab === "safety" ? styles.tabButtonActive : ""}`}
                                onClick={() => setTab("safety")}
                            >
                                <span className={styles.tabIcon}>🛡️</span>
                                Safety
                            </button>
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.scrollCard}`}>
                        <div className={styles.section}>
                            <h2 className={styles.cardTitle}>{tabContent.title}</h2>
                            {tabContent.badges?.length ? (
                                <div className={styles.badgeRow}>
                                    {tabContent.badges.map((b) => (
                                        <span key={b} className={styles.badge}>
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className={styles.searchRow}>
                            <input
                                className={styles.searchInput}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search di topik ini… (contoh: approve, gas, liquidity)"
                            />
                            <button
                                type="button"
                                className={styles.clearButton}
                                onClick={() => setQuery("")}
                                disabled={!query.trim()}
                            >
                                Clear
                            </button>
                        </div>

                        <div className={styles.section} style={{ marginTop: "1rem" }}>
                            <div className={styles.kv}>
                                {filteredItems.length ? (
                                    filteredItems.map((it) => (
                                        <div key={it.title} className={styles.kvItem}>
                                            <div className={styles.kvTitle}>{it.title}</div>
                                            <p className={styles.kvBody}>{it.body}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyResults}>
                                        Tidak ketemu untuk kata kunci itu. Coba kata lain atau klik Clear.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

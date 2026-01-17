"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";
import Logo from "../components/Logo";
import styles from "./page.module.css";
import SmartInput from "../components/translator/SmartInput";
import TranslationCard from "../components/translator/TranslationCard";
import { translateTransaction, translateWallet, translateToken, TranslationResult, identifyInputType } from "../utils/babyTranslator";

export default function TranslatorPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TranslationResult | null>(null);

    const handleTranslate = async (input: string, type: string) => {
        setIsLoading(true);
        setResult(null);

        try {
            let res: TranslationResult;

            // Allow the utility to identify the real type from the blockchain
            // This distinguishes smart contracts (Tokens) from EOAs (Wallets)
            const realType = await identifyInputType(input);

            if (realType === "TRANSACTION") {
                res = await translateTransaction(input);
            } else if (realType === "TOKEN") {
                res = await translateToken(input);
            } else if (realType === "WALLET") {
                res = await translateWallet(input);
            } else {
                res = {
                    type: "UNKNOWN",
                    babyExplanation: "I don't know what this is! 😵 pls give me a hash or address.",
                    safetyStatus: "NEUTRAL"
                };
            }
            setResult(res);
        } catch (error) {
            console.error(error);
            setResult({
                type: "UNKNOWN",
                babyExplanation: "Something broke! 💥 I need a nap.",
                safetyStatus: "DANGER"
            });
        } finally {
            setIsLoading(false);
        }
    };

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

            {/* Centered Title - Fixed at Top */}
            <div className={styles.header}>
                <h1 className={styles.title}>Translator 🍼</h1>
                <p className={styles.subtitle}>Explain it to me like I'm 5</p>
            </div>

            {/* Content */}
            <div className={styles.contentWrapper}>
                <div className={styles.translatorBox}>
                    <SmartInput onTranslate={handleTranslate} isLoading={isLoading} />
                    <TranslationCard result={result} />
                </div>
            </div>
        </div>
    );
}


import { checkTokenSecurity, checkWalletBot } from "./mockSecurity";

export type TranslationResult = {
    type: "TOKEN" | "WALLET" | "TRANSACTION" | "UNKNOWN";
    babyExplanation: string;
    safetyStatus: "SAFE" | "DANGER" | "WARNING" | "NEUTRAL";
    originalData?: any;
};

// Helper to determine input type
export const identifyInputType = (input: string): "TOKEN" | "WALLET" | "TRANSACTION" | "UNKNOWN" => {
    const cleanInput = input.trim();
    // Basic regex checks
    if (/^0x[a-fA-F0-9]{64}$/i.test(cleanInput)) return "TRANSACTION";
    if (/^0x[a-fA-F0-9]{40}$/i.test(cleanInput)) return "WALLET"; // Addresses can be wallets or tokens
    return "UNKNOWN";
};

// Comprehensive Baby Dictionary for explanations
const babyPhrases = {
    success: [
        "Yay! Money went zoom zoom! 🏎️💨",
        "Look at it go! Weeee! 🎢",
        "High five! It worked! 🙌",
        "Shiny coins delivered! ✨"
    ],
    failed: [
        "Uh oh! The money got lost. 🥺",
        "Ouchie! Transaction fell down. 🩹",
        "It broke! We need glue. 🧩",
        "No shinies this time. ☁️"
    ],
    safeWallet: [
        "A real human bean! 🧍",
        "Just a normal friend! 🎈",
        "Safe and sound! 🛡️"
    ],
    botWallet: [
        "Beep Boop! 🤖 Robot alert!",
        "It moves too fast! SCARY! ⚡",
        "This friend has no soul. It's code! 💾"
    ],
    scamToken: [
        "BAD TOUCH! 🔥 Do not eat!",
        "Yucky! Tastes like old socks! 🧦",
        "It's a trap! Run away! 🏃‍♂️💨"
    ],
    safeToken: [
        "Yummy candy! 🍬 Safe to eat.",
        "Sparkly and nice! ✨",
        "Good token! Who's a good token? 🐶"
    ]
};

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const translateTransaction = async (txHash: string): Promise<TranslationResult> => {
    // Mock logic based on hash content
    const isFailure = txHash.toLowerCase().includes("dead") || txHash.includes("0000");

    if (isFailure) {
        return {
            type: "TRANSACTION",
            babyExplanation: getRandom(babyPhrases.failed) + " (Transaction Failed)",
            safetyStatus: "WARNING"
        };
    }

    return {
        type: "TRANSACTION",
        babyExplanation: getRandom(babyPhrases.success) + " (Transaction Confirmed)",
        safetyStatus: "SAFE"
    };
};

export const translateWallet = async (address: string): Promise<TranslationResult> => {
    // If we suspect it might be a token (for the demo, if checking "wallet" input but it has token markers)
    // We can run the token check first or in parallel? 
    // For specific "0xdead" inputs we want to force token result if the user didn't specify.

    // Check for "Bot" markers first
    const botCheck = await checkWalletBot(address);
    if (botCheck.isBot) {
        return {
            type: "WALLET",
            babyExplanation: getRandom(babyPhrases.botWallet) + " (High Frequency Bot Detected)",
            safetyStatus: "WARNING",
            originalData: botCheck
        };
    }

    // Default to Safe Human
    return {
        type: "WALLET",
        babyExplanation: getRandom(babyPhrases.safeWallet) + " (Normal Human Activity)",
        safetyStatus: "SAFE",
        originalData: botCheck
    };
};

export const translateToken = async (address: string): Promise<TranslationResult> => {
    const security = await checkTokenSecurity(address);

    if (security.isHoneypot) {
        return {
            type: "TOKEN",
            babyExplanation: getRandom(babyPhrases.scamToken) + " (Honeypot Detected: Buy YES, Sell NO)",
            safetyStatus: "DANGER",
            originalData: security
        };
    }

    if (!security.isSafe) {
        return {
            type: "TOKEN",
            babyExplanation: "Smells funny... 🤢 Put it down.",
            safetyStatus: "WARNING",
            originalData: security
        };
    }

    return {
        type: "TOKEN",
        babyExplanation: getRandom(babyPhrases.safeToken) + " (Low Risk Token)",
        safetyStatus: "SAFE",
        originalData: security
    };
};

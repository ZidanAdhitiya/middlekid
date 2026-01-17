import { createPublicClient, http, formatEther, parseAbi, Address } from 'viem';
import { base } from 'viem/chains';

// Initialize Viem Client for Base
const client = createPublicClient({
    chain: base,
    transport: http()
});

export type TranslationResult = {
    type: "TOKEN" | "WALLET" | "TRANSACTION" | "UNKNOWN";
    babyExplanation: string;
    safetyStatus: "SAFE" | "DANGER" | "WARNING" | "NEUTRAL";
    originalData?: any;
};

// Regex patterns
const RES_HASH = /^0x[a-fA-F0-9]{64}$/;
const RES_ADDR = /^0x[a-fA-F0-9]{40}$/;

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
    humanWallet: [
        "A real human bean! 🧍",
        "Just a normal friend! 🎈",
        "Safe and sound! 🛡️"
    ],
    richWallet: [
        "Whoa! Big piggy bank! 🐷💰",
        "So many treaties! 🍪",
        "King of the castle! 🏰"
    ],
    contract: [
        "Beep Boop! 🤖 It's a machine!",
        "Smart words written here! 📜",
        "Not a person, it's a robot helper! 🦾"
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

// Quick synchronous check for UI feedback using Regex only
export const identifyQuickType = (input: string): "TRANSACTION" | "ADDRESS" | "UNKNOWN" => {
    const cleanInput = input.trim();
    if (RES_HASH.test(cleanInput)) return "TRANSACTION";
    if (RES_ADDR.test(cleanInput)) return "ADDRESS";
    return "UNKNOWN";
};

// Helper to determine input type accurately
export const identifyInputType = async (input: string): Promise<"TOKEN" | "WALLET" | "TRANSACTION" | "UNKNOWN"> => {
    const cleanInput = input.trim();

    if (RES_HASH.test(cleanInput)) return "TRANSACTION";

    if (RES_ADDR.test(cleanInput)) {
        try {
            // Check if address is a contract or EOA
            const code = await client.getBytecode({ address: cleanInput as Address });
            // If code exists (length > 0), it's a CONTRACT (likely Token or other contract)
            // If undefined or "0x", it's a WALLET (EOA)
            return code ? "TOKEN" : "WALLET";
        } catch (error) {
            console.error("Error identifying address type:", error);
            return "UNKNOWN";
        }
    }

    return "UNKNOWN";
};

export const translateTransaction = async (txHash: string): Promise<TranslationResult> => {
    try {
        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

        if (receipt.status === 'success') {
            return {
                type: "TRANSACTION",
                babyExplanation: getRandom(babyPhrases.success) + " (Transaction Success)",
                safetyStatus: "SAFE",
                originalData: {
                    hash: receipt.transactionHash,
                    from: receipt.from,
                    to: receipt.to,
                    gasUsed: receipt.gasUsed.toString()
                }
            };
        } else {
            return {
                type: "TRANSACTION",
                babyExplanation: getRandom(babyPhrases.failed) + " (Transaction Failed)",
                safetyStatus: "WARNING",
                originalData: {
                    hash: receipt.transactionHash,
                    status: "reverted"
                }
            };
        }
    } catch (error) {
        console.error("Error fetching tx:", error);
        return {
            type: "TRANSACTION",
            babyExplanation: "I couldn't find it! Did you make it up? 🕵️‍♀️",
            safetyStatus: "NEUTRAL"
        };
    }
};

export const translateWallet = async (address: string): Promise<TranslationResult> => {
    try {
        const balance = await client.getBalance({ address: address as Address });
        const txCount = await client.getTransactionCount({ address: address as Address });

        const ethBalance = parseFloat(formatEther(balance));

        // Logic for explanation
        let explanation = getRandom(babyPhrases.humanWallet);
        if (ethBalance > 0.5) {
            explanation = getRandom(babyPhrases.richWallet);
        }

        return {
            type: "WALLET",
            babyExplanation: `${explanation} (Has ${ethBalance.toFixed(4)} ETH)`,
            safetyStatus: "SAFE",
            originalData: {
                balance: ethBalance.toFixed(4) + " ETH",
                transactions: txCount
            }
        };

    } catch (error) {
        console.error("Error fetching wallet:", error);
        return {
            type: "WALLET",
            babyExplanation: "This friend is hiding! 🙈",
            safetyStatus: "NEUTRAL"
        };
    }
};

export const translateToken = async (address: string): Promise<TranslationResult> => {
    // Check if it's actually a contract first
    const code = await client.getBytecode({ address: address as Address });
    if (!code) {
        // Technically this shouldn't happen if identifyInputType filtered it, but good fallback
        return translateWallet(address);
    }

    try {
        // Try to read standard ERC20 properties
        const abi = parseAbi([
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function totalSupply() view returns (uint256)'
        ]);

        const [name, symbol] = await Promise.all([
            client.readContract({ address: address as Address, abi, functionName: 'name' }).catch(() => "Unknown"),
            client.readContract({ address: address as Address, abi, functionName: 'symbol' }).catch(() => "???")
        ]);

        if (name === "Unknown" && symbol === "???") {
            // Probably not an ERC20 token, just a generic contract
            return {
                type: "TOKEN",
                babyExplanation: getRandom(babyPhrases.contract) + " (Smart Contract)",
                safetyStatus: "NEUTRAL",
                originalData: { isContract: true }
            };
        }

        return {
            type: "TOKEN",
            babyExplanation: `${getRandom(babyPhrases.safeToken)} It's called ${name} (${symbol})!`,
            safetyStatus: "SAFE", // We assume safe unless external API says otherwise, but valid ERC20 is generally "Safe" structure-wise for a baby
            originalData: {
                name,
                symbol,
                isContract: true
            }
        };

    } catch (error) {
        console.error("Error fetching token:", error);
        return {
            type: "TOKEN",
            babyExplanation: "It's a weird robot! I don't understand it. 🤖❓",
            safetyStatus: "WARNING"
        };
    }
};

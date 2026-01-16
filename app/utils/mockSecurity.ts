
// Mock Security API for Demo Purposes

export const checkTokenSecurity = async (address: string) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Slight delay

    const lowerAddr = address.toLowerCase();

    // SCAM / HONEYPOT MOCKS
    if (lowerAddr.startsWith("0xdead")) {
        return {
            isSafe: false,
            isHoneypot: true,
            riskLevel: "CRITICAL",
            message: "HONEYPOT: Transfer disabled"
        };
    }

    // SUSPICIOUS MOCKS
    if (lowerAddr.startsWith("0xbad")) {
        return {
            isSafe: false,
            isHoneypot: false,
            riskLevel: "HIGH",
            message: "Proxy Contract Detected (Mutable)"
        };
    }

    // SAFE MOCKS
    return {
        isSafe: true,
        isHoneypot: false,
        riskLevel: "LOW",
        message: "No threats detected"
    };
};

export const checkWalletBot = async (address: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerAddr = address.toLowerCase();

    // BOT MOCKS
    if (lowerAddr.startsWith("0xbot") || lowerAddr.includes("beef")) {
        return {
            isHuman: false,
            isBot: true,
            botScore: 95,
            behavior: "Front-running patterns detected"
        };
    }

    // WHALE MOCKS (Safe but big)
    if (lowerAddr.startsWith("0x999")) {
        return {
            isHuman: true,
            isBot: false,
            botScore: 20,
            behavior: "High Value Transactions (Whale)"
        };
    }

    // HUMAN MOCKS
    return {
        isHuman: true,
        isBot: false,
        botScore: 5,
        behavior: "Organic interaction patterns"
    };
};

import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

const DEFAULT_SYSTEM_PROMPT = `You are MiddleKid AI, a security-focused assistant for crypto wallet prompts.

Goals:
- Explain transaction/signature requests in simple Indonesian.
- Identify red flags: unlimited approvals, permit, setApprovalForAll, suspicious domains, strange messages, high value transfers.
- Ask for missing details (chain, tx hash, contract address, calldata) before concluding.

Rules:
- Never ask for seed phrase/private key.
- Be conservative: if unsure, say you are unsure and recommend cancel/verify on explorer.
- Provide a short checklist at the end.`;

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const body = (await request.json()) as { messages?: ChatMessage[] };
        const messages = Array.isArray(body.messages) ? body.messages : [];

        const contents = messages
            .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
            .map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));

        const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = process.env.MIDDLEKID_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }],
                },
                contents,
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 600,
                },
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            const msg = data?.error?.message || "Gemini request failed";
            return NextResponse.json({ error: msg }, { status: 500 });
        }

        const text =
            data?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p?.text)
                .filter(Boolean)
                .join("") || "";

        return NextResponse.json({ role: "assistant", content: text });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Failed to chat" }, { status: 500 });
    }
}

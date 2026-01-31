"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ChatBox.module.css";

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content:
                "Halo! Aku MiddleKid AI. Kirim payload wallet / tx hash / atau pertanyaan crypto kamu, nanti aku bantu jelasin dan kasih checklist keamanan.",
        },
    ]);
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    const canSend = useMemo(() => draft.trim().length > 0 && !isSending, [draft, isSending]);

    useEffect(() => {
        if (!isOpen) return;
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [isOpen, messages.length, isSending]);

    async function sendMessage() {
        const content = draft.trim();
        if (!content || isSending) return;

        setError(null);
        setIsSending(true);
        setDraft("");

        const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
        setMessages(nextMessages);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: nextMessages }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Gagal menghubungi AI" );
            }

            const assistantText = typeof data?.content === "string" ? data.content : "";
            setMessages((prev) => [...prev, { role: "assistant", content: assistantText || "(no response)" }]);
        } catch (e: any) {
            setError(e?.message || "Gagal menghubungi AI" );
        } finally {
            setIsSending(false);
        }
    }

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={styles.chatToggle}
            >
                💬
            </button>

            {/* Chat Box */}
            {isOpen && (
                <div className={styles.chatBox}>
                    {/* Header */}
                    <div className={styles.chatHeader}>
                        <div className={styles.headerLeft}>
                            <div className={styles.aiIcon}>🤖</div>
                            <div>
                                <h3 className={styles.chatTitle}>MiddleKid AI</h3>
                                <p className={styles.chatStatus}>{isSending ? "Thinking…" : "Online"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={styles.closeBtn}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className={styles.messagesArea} ref={scrollRef}>
                        <div className={styles.messagesList}>
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={m.role === "user" ? styles.userRow : styles.assistantRow}
                                >
                                    <div className={m.role === "user" ? styles.userBubble : styles.assistantBubble}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className={styles.assistantRow}>
                                    <div className={styles.assistantBubble}>…</div>
                                </div>
                            )}
                            {error && <div className={styles.errorBanner}>{error}</div>}
                        </div>
                    </div>

                    {/* Input Area (Disabled) */}
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            placeholder="Tanya apa aja… (tx hash / payload / domain)"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={isSending}
                            className={styles.input}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!canSend}
                            className={styles.sendBtn}
                            type="button"
                            aria-label="Send"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

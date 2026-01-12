"use client";

import { useState } from "react";
import styles from "./ChatBox.module.css";

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);

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
                                <p className={styles.chatStatus}>Coming Soon</p>
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
                    <div className={styles.messagesArea}>
                        <div className={styles.devNotice}>
                            <div className={styles.noticeIcon}>🚧</div>
                            <h4>AI Chat Under Development</h4>
                            <p>
                                Our AI assistant is being built to help you with crypto analysis,
                                token research, and DeFi questions. Stay tuned!
                            </p>
                            <div className={styles.featuresList}>
                                <div className={styles.featureItem}>✓ Token analysis assistance</div>
                                <div className={styles.featureItem}>✓ Market insights</div>
                                <div className={styles.featureItem}>✓ Risk assessment help</div>
                                <div className={styles.featureItem}>✓ DeFi strategy guidance</div>
                            </div>
                        </div>
                    </div>

                    {/* Input Area (Disabled) */}
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            placeholder="AI Chat coming soon..."
                            disabled
                            className={styles.input}
                        />
                        <button disabled className={styles.sendBtn}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

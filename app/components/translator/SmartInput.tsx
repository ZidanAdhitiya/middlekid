
import { useState } from "react";
import styles from "./Translator.module.css";
import { identifyInputType } from "../../utils/babyTranslator";

interface SmartInputProps {
    onTranslate: (input: string, type: string) => void;
    isLoading: boolean;
}

export default function SmartInput({ onTranslate, isLoading }: SmartInputProps) {
    const [input, setInput] = useState("");
    const [type, setType] = useState<string>("UNKNOWN");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        setType(identifyInputType(val));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && input && type !== "UNKNOWN") {
            onTranslate(input, type);
        }
    };

    return (
        <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
                <input
                    className={styles.input}
                    placeholder="Paste Tx Hash, Wallet Address, or Token Address..."
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <button
                    className={styles.translateButton}
                    onClick={() => onTranslate(input, type)}
                    disabled={isLoading || !input || type === "UNKNOWN"}
                >
                    {isLoading ? "Translating..." : "Translate 🍼"}
                </button>
            </div>
            {input && (
                <span className={styles.detectedType}>
                    Detected: {type !== "UNKNOWN" ? type : "..."}
                </span>
            )}
        </div>
    );
}


import styles from "./Translator.module.css";
import { TranslationResult } from "../../utils/babyTranslator";

interface TranslationCardProps {
    result: TranslationResult | null;
}

export default function TranslationCard({ result }: TranslationCardProps) {
    if (!result) return null;

    const getStatusStyle = () => {
        switch (result.safetyStatus) {
            case "SAFE": return styles.cardSafe;
            case "WARNING": return styles.cardWarning;
            case "DANGER": return styles.cardDanger;
            default: return "";
        }
    };

    const getIcon = () => {
        switch (result.safetyStatus) {
            case "SAFE": return "✅";
            case "WARNING": return "⚠️";
            case "DANGER": return "🚨";
            default: return "ℹ️";
        }
    };

    return (
        <div className={`${styles.card} ${getStatusStyle()}`}>
            <div className={styles.cardHeader}>
                <span className={styles.statusIcon}>{getIcon()}</span>
                <span className={styles.statusText}>{result.type} - {result.safetyStatus}</span>
            </div>

            <p className={styles.explanation}>{result.babyExplanation}</p>

            {result.originalData && (
                <div className={styles.details}>
                    <strong>Technical Details (For Grown Ups):</strong><br />
                    {JSON.stringify(result.originalData, null, 2)}
                </div>
            )}
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";

const tabs = [
    { name: "Analyzer", path: "/analyzer", icon: "🔍" },
    { name: "Translator", path: "/translator", icon: "🌐" },
    { name: "Researcher", path: "/researcher", icon: "🔬" },
    { name: "Time Traveller", path: "/time-traveller", icon: "⏰" },
    { name: "Teacher", path: "/teacher", icon: "🎓" },
];

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className={styles.navigation}>
            <div className={styles.tabs}>
                {tabs.map((tab) => (
                    <Link
                        key={tab.path}
                        href={tab.path}
                        className={`${styles.tab} ${pathname === tab.path ? styles.active : ""}`}
                    >
                        <span className={styles.icon}>{tab.icon}</span>
                        <span className={styles.name}>{tab.name}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}

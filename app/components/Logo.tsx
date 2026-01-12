"use client";

import Link from "next/link";
import styles from "./Logo.module.css";

export default function Logo() {
    return (
        <Link href="/" className={styles.logo}>
            <span className={styles.middle}>Middle</span>
            <span className={styles.kid}>Kid</span>
            <span className={styles.badge}>| Early Access</span>
        </Link>
    );
}

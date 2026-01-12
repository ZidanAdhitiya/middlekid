"use client";

import styles from "./LoadingScreen.module.css";

export default function LoadingScreen() {
    return (
        <div className={styles.loadingScreen}>
            <div className={styles.stars}></div>
            <div className={styles.stars2}></div>
            <div className={styles.stars3}></div>

            <div className={styles.content}>
                <div className={styles.spinner}>
                    <div className={styles.orbit}></div>
                    <div className={styles.orbit}></div>
                    <div className={styles.orbit}></div>
                    <div className={styles.core}></div>
                </div>
                <p className={styles.text}>Loading...</p>
            </div>
        </div>
    );
}

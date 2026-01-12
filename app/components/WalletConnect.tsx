"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect, useRef } from "react";
import styles from "./WalletConnect.module.css";

export default function WalletConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [showConnectors, setShowConnectors] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowConnectors(false);
            }
        }

        if (showConnectors) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showConnectors]);

    if (isConnected && address) {
        return (
            <div className={styles.connected}>
                <div className={styles.addressBadge}>
                    <span className={styles.dot}></span>
                    <span className={styles.address}>{formatAddress(address)}</span>
                </div>
                <button
                    onClick={() => disconnect()}
                    className={styles.disconnectBtn}
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                onClick={() => setShowConnectors(!showConnectors)}
                className={styles.connectBtn}
                disabled={isPending}
            >
                {isPending ? "Connecting..." : "Connect Wallet"}
            </button>

            {showConnectors && (
                <div className={styles.connectorList}>
                    {connectors.map((connector) => (
                        <button
                            key={connector.id}
                            onClick={() => {
                                connect({ connector });
                                setShowConnectors(false);
                            }}
                            className={styles.connectorBtn}
                        >
                            {connector.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { ReactNode, useMemo } from "react";
import { WagmiProvider as WagmiProviderBase, createConfig, http } from "wagmi";
import { arbitrum, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";

const queryClient = new QueryClient();

export function WagmiProvider({ children }: { children: ReactNode }) {
    // Create config in useMemo to avoid SSR issues
    const config = useMemo(() => {
        // Only create connectors on client side
        if (typeof window === 'undefined') {
            return createConfig({
                chains: [base, arbitrum],
                connectors: [],
                transports: {
                    [base.id]: http(),
                    [arbitrum.id]: http(),
                },
            });
        }

        return createConfig({
            chains: [base, arbitrum],
            connectors: [
                injected(),
                coinbaseWallet({
                    appName: "MiddleKid",
                    appLogoUrl: undefined,
                }),
                walletConnect({
                    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
                }),
            ],
            transports: {
                [base.id]: http(),
                [arbitrum.id]: http(),
            },
        });
    }, []);

    return (
        <WagmiProviderBase config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProviderBase>
    );
}

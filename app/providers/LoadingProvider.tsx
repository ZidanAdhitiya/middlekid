"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "../components/LoadingScreen";

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);

    // Initial page load
    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 100); // Reduced from 1200ms

        return () => clearTimeout(timeout);
    }, []);

    // Navigation between pages
    useEffect(() => {
        // Skip initial load
        setIsNavigating(true);

        const timeout = setTimeout(() => {
            setIsNavigating(false);
        }, 300); // Reduced from 800ms

        return () => clearTimeout(timeout);
    }, [pathname]);

    const showLoading = isLoading || isNavigating;

    return (
        <>
            {showLoading && <LoadingScreen />}
            <div style={{ opacity: showLoading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                {children}
            </div>
        </>
    );
}

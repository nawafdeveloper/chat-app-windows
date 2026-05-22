import { useEffect, useState } from 'react';
import GlobalLoading from './global-loading';
import { motion } from "framer-motion";
import AuthFlowSection from './auth-flow-section';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

export default function MainClientUIAuthWrapper({ country }: { country: string | null }) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            setTimeout(() => setIsLoaded(true), 1000);
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    if (!isLoaded) return <GlobalLoading />;

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                duration: 0.35,
                ease: "easeOut",
            }}
            style={{ height: "100%" }}
        >
            <main className="w-full h-full overflow-hidden">
                <AuthFlowSection
                    country={country}
                    isRTL={isRTL}
                />
            </main>
        </motion.div>
    );
}

import { createContext, useContext, ReactNode } from "react";
import { useCryptoController, type CryptoState } from "../hooks/use-crypto";

interface CryptoContextType {
    state: CryptoState;
    publicKey: CryptoKey | null;
    privateKey: CryptoKey | null;
    isReady: boolean;
    isHydrated: boolean;
    register: (pin: string) => Promise<void>;
    unlock: (pin: string) => Promise<boolean>;
    changePin: (currentPin: string, newPin: string) => Promise<boolean>;
    lock: () => void;
}

const CryptoContext = createContext<CryptoContextType>({
    state: { status: "idle" },
    publicKey: null,
    privateKey: null,
    isReady: false,
    isHydrated: false,
    register: async () => {},
    unlock: async () => false,
    changePin: async () => false,
    lock: () => {},
});

export function CryptoProvider({ children }: { children: ReactNode }) {
    const { state, isHydrated, register, unlock, changePin, lock } =
        useCryptoController();

    const isReady = state.status === "unlocked" && state.session !== null;
    const publicKey = state.status === "unlocked" ? state.session.publicKey : null;
    const privateKey = state.status === "unlocked" ? state.session.privateKey : null;

    return (
        <CryptoContext.Provider
            value={{
                state,
                publicKey,
                privateKey,
                isReady,
                isHydrated,
                register,
                unlock,
                changePin,
                lock,
            }}
        >
            {children}
        </CryptoContext.Provider>
    );
}

export function useCrypto() {
    const context = useContext(CryptoContext);
    return context;
}

export const useCryptoKeys = useCrypto;

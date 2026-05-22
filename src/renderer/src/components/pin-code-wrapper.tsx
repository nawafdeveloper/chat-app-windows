import { useCrypto } from "../context/crypto";
import type React from "react";
import GlobalLoading from "./global-loading";
import PinCode from "./pin-code";

export default function PinCodeWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isHydrated, isReady } = useCrypto();

    if (!isHydrated) {
        return <GlobalLoading />;
    }

    if (!isReady) {
        return <PinCode />;
    }

    return <>{children}</>;
}

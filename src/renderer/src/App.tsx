import { useEffect, useMemo } from "react";
import AppPage from "./components/app-page";
import GlobalLoading from "./components/global-loading";
import MainClientUIAppWrapper from "./components/main-client-ui-app-warper";
import MainClientUIAuthWrapper from "./components/main-client-ui-auth-warper";
import NewUserOnboarding from "./components/new-user-onboarding";
import PinCodeWrapper from "./components/pin-code-wrapper";
import { CryptoProvider } from "./context/crypto";
import { MuiSystemThemeProvider } from "./context/theme";
import { authClient } from "./lib/auth-client";
import { getLocale } from "./lib/locale";
import { isRTLClient } from "./lib/locale-client";
import WindowTitleBar from "./components/window-title-bar";

function getClientCountry() {
    const locale = navigator.languages?.[0] ?? navigator.language;
    const match = locale.match(/[-_]([A-Za-z]{2})\b/);
    return match?.[1]?.toUpperCase() ?? null;
}

function useDocumentLocale() {
    const locale = getLocale();

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = isRTLClient(locale) ? "rtl" : "ltr";
    }, [locale]);

    return locale;
}

function AppContent() {
    const { data: session, isPending } = authClient.useSession();
    const country = useMemo(() => getClientCountry(), []);

    useDocumentLocale();

    if (isPending) {
        return (
            <main className="absolute inset-0 z-50">
                <GlobalLoading />
            </main>
        );
    }

    if (!session) {
        return <MainClientUIAuthWrapper country={country} />;
    }

    if (session.user.isNewUser) {
        return (
            <CryptoProvider>
                <NewUserOnboarding />
            </CryptoProvider>
        );
    }

    return (
        <CryptoProvider>
            <PinCodeWrapper>
                <MainClientUIAppWrapper country={country}>
                    <AppPage />
                </MainClientUIAppWrapper>
            </PinCodeWrapper>
        </CryptoProvider>
    );
}

export function App() {
  return (
    <MuiSystemThemeProvider>
      <div className="app-window-shell">
        <WindowTitleBar />
        <div className="app-window-content">
          <AppContent />
        </div>
      </div>
    </MuiSystemThemeProvider>
  );
}

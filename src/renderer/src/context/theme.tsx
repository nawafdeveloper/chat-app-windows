import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";

const appFontFamily = '"Noto Sans Arabic", "Segoe UI", Arial, sans-serif';

// Create context for theme state
type ThemeMode = "light" | "dark" | "system";
interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "app-theme";

export const appThemeVars = {
    background: "var(--background)",
    foreground: "var(--foreground)",
    surface: "var(--surface)",
    surfaceMuted: "var(--surface-muted)",
    surfaceSoft: "var(--surface-soft)",
    surfaceStrong: "var(--surface-strong)",
    surfaceStrongHover: "var(--surface-strong-hover)",
    foregroundMuted: "var(--foreground-muted)",
    borderSubtle: "var(--border-subtle)",
    borderStrong: "var(--border-strong)",
    inverseSurface: "var(--inverse-surface)",
    inverseForeground: "var(--inverse-foreground)",
    successSoft: "var(--success-soft)",
    successSoftBorder: "var(--success-soft-border)",
    successForeground: "var(--success-foreground)",
    primary: "var(--primary)",
} as const;

const appThemeColors = {
    light: {
        background: "#f7f5f3",
        foreground: "#1C1E21",
        surface: "#ffffff",
        surfaceSoft: "#eeeeee",
        foregroundMuted: "#636261",
        borderSubtle: "#e9e9e9",
        inverseSurface: "#000000",
        inverseForeground: "#ffffff",
        successSoft: "#d9fdd3",
        successSoftBorder: "#c4dcc0",
        successForeground: "#1f4e2e",
        primary: "#25D366",
    },
    dark: {
        background: "#161717",
        foreground: "#f7f5f3",
        surface: "#1d1f1f",
        surfaceSoft: "#353939",
        foregroundMuted: "#a5a5a5",
        borderSubtle: "#2c2c2c",
        inverseSurface: "#ffffff",
        inverseForeground: "#000000",
        successSoft: "#103529",
        successSoftBorder: "#24453b",
        successForeground: "#25d366",
        primary: "#25D366",
    },
} as const;

function isThemeMode(value: string | null): value is ThemeMode {
    return value === "light" || value === "dark" || value === "system";
}

function resolveThemeMode(theme: ThemeMode) {
    if (theme !== "system") {
        return theme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyDocumentTheme(nextResolvedTheme: "light" | "dark") {
    document.documentElement.classList.toggle("dark", nextResolvedTheme === "dark");
    document.documentElement.style.colorScheme = nextResolvedTheme;
}

export function useAppTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useAppTheme must be used within MuiSystemThemeProvider");
    return context;
}

export function MuiSystemThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeMode>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
    const [themeKey, setThemeKey] = useState(0);
    const [isThemeReady, setIsThemeReady] = useState(false);

    // Load saved theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

        if (isThemeMode(savedTheme)) {
            setTheme(savedTheme);
            const nextResolvedTheme = resolveThemeMode(savedTheme);
            setResolvedTheme(nextResolvedTheme);
            applyDocumentTheme(nextResolvedTheme);
        } else {
            const nextResolvedTheme = resolveThemeMode("system");
            setResolvedTheme(nextResolvedTheme);
            applyDocumentTheme(nextResolvedTheme);
        }

        setIsThemeReady(true);
    }, []);

    // Apply theme
    useEffect(() => {
        if (!isThemeReady) {
            return;
        }

        localStorage.setItem(THEME_STORAGE_KEY, theme);

        const nextResolvedTheme = resolveThemeMode(theme);
        setResolvedTheme(nextResolvedTheme);
        applyDocumentTheme(nextResolvedTheme);
    }, [isThemeReady, theme]);

    // Listen to system changes
    useEffect(() => {
        if (!isThemeReady) {
            return;
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            if (theme === "system") {
                const nextResolvedTheme = e.matches ? "dark" : "light";
                setResolvedTheme(nextResolvedTheme);
                applyDocumentTheme(nextResolvedTheme);
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [isThemeReady, theme]);

    // Handle direction
    useEffect(() => {
        const updateDirection = () => {
            const locale = getLocaleFromCookie();
            const isRTL = locale ? isRTLClient(locale) : false;
            const newDirection = isRTL ? "rtl" : "ltr";
            setDirection(newDirection);
            document.documentElement.dir = newDirection;
            setThemeKey(prev => prev + 1);
        };
        updateDirection();
        window.addEventListener('localeChanged', updateDirection);
        return () => window.removeEventListener('localeChanged', updateDirection);
    }, []);

    const paletteColors = appThemeColors[resolvedTheme];

    const muiTheme = createTheme({
        palette: {
            mode: resolvedTheme,
            primary: {
                main: paletteColors.primary,
            },
            background: {
                default: paletteColors.background,
                paper: paletteColors.surface,
            },
            text: {
                primary: paletteColors.foreground,
                secondary: paletteColors.foregroundMuted,
            },
            divider: paletteColors.borderSubtle,
            action: {
                hover: paletteColors.surfaceSoft,
            },
            success: {
                light: paletteColors.successSoft,
                main: paletteColors.primary,
                dark: paletteColors.successSoftBorder,
                contrastText: paletteColors.successForeground,
            },
        },
        typography: { fontFamily: appFontFamily },
        direction: direction,
        components: {
            MuiCssBaseline: { styleOverrides: { body: { fontFamily: appFontFamily } } },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        backgroundColor: appThemeVars.surface,
                        color: appThemeVars.foreground,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        backgroundColor: appThemeVars.surface,
                        color: appThemeVars.foreground,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundImage: "none",
                        backgroundColor: appThemeVars.surface,
                        color: appThemeVars.foreground,
                    },
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        backgroundImage: "none",
                        backgroundColor: appThemeVars.surface,
                        color: appThemeVars.foreground,
                        border: `1px solid ${appThemeVars.borderSubtle}`,
                    },
                },
            },
            MuiPopover: {
                styleOverrides: {
                    paper: {
                        backgroundImage: "none",
                        backgroundColor: appThemeVars.surface,
                        color: appThemeVars.foreground,
                        border: `1px solid ${appThemeVars.borderSubtle}`,
                    },
                },
            },
            MuiSnackbarContent: {
                styleOverrides: {
                    root: {
                        backgroundColor: appThemeVars.inverseSurface,
                        color: appThemeVars.inverseForeground,
                    },
                },
            },
            MuiListItem: { styleOverrides: { root: { direction: direction } } },
            MuiListItemText: {
                styleOverrides: {
                    root: { textAlign: direction === 'rtl' ? 'right' : 'left' },
                    secondary: { direction: direction },
                },
            },
            MuiListItemAvatar: { styleOverrides: { root: { marginRight: direction === 'rtl' ? 0 : 16, marginLeft: direction === 'rtl' ? 16 : 0 } } },
            MuiBadge: { styleOverrides: { root: { direction: 'ltr' } } }
        },
    });

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            <ThemeProvider key={themeKey} theme={muiTheme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}

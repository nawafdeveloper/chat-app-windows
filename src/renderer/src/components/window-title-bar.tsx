import { Close, CropSquare, FilterNone, Remove } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { publicAssetSrc } from "../lib/public-assets";

function WindowControls() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.electronAPI) {
            return;
        }

        let isMounted = true;

        window.electronAPI.isWindowMaximized().then((nextIsMaximized) => {
            if (isMounted) {
                setIsMaximized(nextIsMaximized);
            }
        });

        const removeListener = window.electronAPI.onWindowMaximizedChange(
            setIsMaximized
        );

        return () => {
            isMounted = false;
            removeListener();
        };
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle(
            "app-window-maximized",
            isMaximized
        );

        return () => {
            document.documentElement.classList.remove("app-window-maximized");
        };
    }, [isMaximized]);

    if (typeof window === "undefined" || !window.electronAPI) {
        return null;
    }

    return (
        <div className="app-window-controls app-region-no-drag">
            <button
                type="button"
                className="app-window-control-button"
                aria-label="Minimize window"
                onClick={() => window.electronAPI.minimizeWindow()}
            >
                <Remove fontSize="inherit" />
            </button>
            <button
                type="button"
                className="app-window-control-button"
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
                onClick={() => window.electronAPI.toggleMaximizeWindow()}
            >
                {isMaximized ? (
                    <FilterNone fontSize="inherit" />
                ) : (
                    <CropSquare fontSize="inherit" />
                )}
            </button>
            <button
                type="button"
                className="app-window-control-button app-window-control-close"
                aria-label="Close window"
                onClick={() => window.electronAPI.closeWindow()}
            >
                <Close fontSize="inherit" />
            </button>
        </div>
    );
}

export default function WindowTitleBar() {
    if (typeof window === "undefined" || !window.electronAPI) {
        return null;
    }

    return (
        <header className="app-window-drag-region">
            <div className="app-window-title-brand">
                <img
                    src={publicAssetSrc("favicon.svg")}
                    alt=""
                    className="app-window-title-logo"
                    draggable={false}
                />
                <span className="app-window-title-text">Yahla</span>
            </div>
            <WindowControls />
        </header>
    );
}

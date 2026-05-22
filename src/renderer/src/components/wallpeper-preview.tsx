import { useWallpaperStore } from '../store/use-update-wallpaper';
import { Box } from '@mui/material';
import { publicAssetCssUrl } from '../lib/public-assets';

export default function WallpaperPreview() {
    const activeWallpaper = useWallpaperStore((s) => s.getActiveKey());

    const getWallpaper = (mode: 'dark' | 'light') => {
        switch (activeWallpaper) {
            case "wallpaper-1":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-1.svg") : publicAssetCssUrl("light-wallpaper-1.svg");
            case "wallpaper-2":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-2.svg") : publicAssetCssUrl("light-wallpaper-2.svg");
            case "wallpaper-3":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-3.svg") : publicAssetCssUrl("light-wallpaper-3.svg");
            case "wallpaper-4":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-4.svg") : publicAssetCssUrl("light-wallpaper-4.svg");
            case "wallpaper-5":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-5.svg") : publicAssetCssUrl("light-wallpaper-5.svg");
            case "wallpaper-6":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-6.svg") : publicAssetCssUrl("light-wallpaper-6.svg");
            case "wallpaper-7":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-7.svg") : publicAssetCssUrl("light-wallpaper-7.svg");
            case "wallpaper-8":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-8.svg") : publicAssetCssUrl("light-wallpaper-8.svg");
            case "wallpaper-9":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-9.svg") : publicAssetCssUrl("light-wallpaper-9.svg");
            case "wallpaper-10":
                return mode === 'dark' ? publicAssetCssUrl("dark-wallpaper-10.svg") : publicAssetCssUrl("light-wallpaper-10.svg");
            default:
                return mode === 'dark' ? publicAssetCssUrl("chat-background-dark.svg") : publicAssetCssUrl("chat-background-light.svg")
        };
    };

    return (
        <Box
            sx={(theme) => ({
                height: "100%",
                width: "100%",
                position: "relative",
                display: "flex",
                overflow: 'hidden',
                backgroundImage: getWallpaper(theme.palette.mode),
                backgroundRepeat: "repeat",
                backgroundSize: "110px",
            })}
        />
    )
}

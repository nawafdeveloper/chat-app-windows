import { useDecryptedMessageMedia } from "../hooks/use-decrypted-message-media";
import useMediaPreviewStore from "../store/media-preview-store";
import { ImageOutlined, PlayArrowRounded, VideocamRounded } from "@mui/icons-material";
import { Box, CircularProgress } from "@mui/material";

export type DetailedSidebarMediaItem = {
    id: string;
    type: "photo" | "video";
    mediaUrl?: string | null;
    previewUrl?: string | null;
    createdAt: Date;
    senderUserId: string;
    senderDisplayName?: string | null;
};

export function DetailedSidebarMediaTile({ item }: { item: DetailedSidebarMediaItem }) {
    const { openPreview } = useMediaPreviewStore();
    const {
        decryptedUrl,
        displayUrl,
        loading,
    } = useDecryptedMessageMedia({
        mediaUrl: item.mediaUrl,
        previewUrl: item.previewUrl ?? null,
        autoDownload: true,
    });
    const source = displayUrl ?? decryptedUrl;
    const showVideo = item.type === "video" && Boolean(decryptedUrl);
    const previewMediaUrl =
        item.mediaUrl ?? (item.type === "photo" ? item.previewUrl ?? null : null);
    const canOpenPreview = Boolean(previewMediaUrl);

    const handleOpenPreview = () => {
        if (!previewMediaUrl) {
            return;
        }

        openPreview(
            item.type,
            previewMediaUrl,
            "",
            item.id,
            item.senderUserId,
            item.createdAt.toLocaleDateString(),
            item.senderDisplayName ?? item.senderUserId
        );
    };

    return (
        <Box
            component="button"
            type="button"
            onClick={handleOpenPreview}
            disabled={!canOpenPreview}
            aria-label={item.type === "video" ? "Open video preview" : "Open photo preview"}
            sx={(theme) => ({
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: 2,
                appearance: "none",
                border: 0,
                p: 0,
                backgroundColor:
                    theme.palette.mode === "dark" ? "#202323" : "#eeeae6",
                cursor: canOpenPreview ? "pointer" : "default",
                display: "block",
                font: "inherit",
                "&:focus-visible": {
                    outline: "2px solid #25D366",
                    outlineOffset: 2,
                },
            })}
        >
            {showVideo ? (
                <Box
                    component="video"
                    src={decryptedUrl ?? undefined}
                    muted
                    playsInline
                    preload="metadata"
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : source ? (
                <Box
                    component="img"
                    src={source}
                    alt=""
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                    }}
                >
                    {item.type === "video" ? <VideocamRounded /> : <ImageOutlined />}
                </Box>
            )}
            {item.type === "video" && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.28))",
                    }}
                >
                    <PlayArrowRounded />
                </Box>
            )}
            {loading && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.18)",
                    }}
                >
                    <CircularProgress size={22} sx={{ color: "#ffffff" }} />
                </Box>
            )}
        </Box>
    );
}

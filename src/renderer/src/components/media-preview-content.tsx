import useMediaPreviewStore from '../store/media-preview-store';
import { Box } from '@mui/material';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useDecryptedMessageMedia } from '../hooks/use-decrypted-message-media';

const MIN_ZOOM = 1;
const ZOOM_STEP = 0.1;

type Props = {
    zoom: number;
    maxZoom: number;
    minZoom: number;
    onZoomChange: (zoom: number) => void;
}

export default function MediaPreviewContent({ zoom, maxZoom, minZoom, onZoomChange }: Props) {
    const { mediaUrl, mediaType } = useMediaPreviewStore();
    const { displayUrl } = useDecryptedMessageMedia({
        mediaUrl,
        autoDownload: true,
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const imageWrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

    // Play video only on mount, don't restart on re-renders
    useEffect(() => {
        if (mediaType !== 'video' || !videoRef.current) return;
        videoRef.current.play().catch(() => { });
    }, [mediaType]);

    const clampTranslate = useCallback((x: number, y: number, currentZoom: number) => {
        const container = containerRef.current;
        const image = imageWrapperRef.current;
        if (!container || !image) return { x, y };

        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const imageW = image.clientWidth * currentZoom;
        const imageH = image.clientHeight * currentZoom;

        const maxX = Math.max(0, (imageW - containerW) / 2);
        const maxY = Math.max(0, (imageH - containerH) / 2);

        return {
            x: Math.min(maxX, Math.max(-maxX, x)),
            y: Math.min(maxY, Math.max(-maxY, y)),
        };
    }, []);

    useEffect(() => {
        if (zoom <= minZoom) {
            setTranslate({ x: 0, y: 0 });
        } else {
            setTranslate(prev => clampTranslate(prev.x, prev.y, zoom));
        }
    }, [zoom, minZoom, clampTranslate]);

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        onZoomChange(Math.min(maxZoom, Math.max(minZoom, parseFloat((zoom + delta).toFixed(2)))));
    }, [zoom, maxZoom, minZoom, onZoomChange]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom <= MIN_ZOOM) return;
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            tx: translate.x,
            ty: translate.y,
        };
    }, [zoom, translate]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !dragStart.current) return;
        const rawX = dragStart.current.tx + (e.clientX - dragStart.current.x);
        const rawY = dragStart.current.ty + (e.clientY - dragStart.current.y);
        setTranslate(clampTranslate(rawX, rawY, zoom));
    }, [isDragging, zoom, clampTranslate]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        dragStart.current = null;
    }, []);

    const cursor = zoom > MIN_ZOOM
        ? isDragging ? 'grabbing' : 'grab'
        : 'default';

    const mediaTransform = {
        transform: `scale(${zoom}) translate(${translate.x / zoom}px, ${translate.y / zoom}px)`,
        transformOrigin: "center center",
        transition: isDragging ? 'none' : "transform 0.15s ease",
        willChange: 'transform' as const,
    };

    return (
        <Box
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            sx={(theme) => ({
                flex: 1,
                minHeight: 0,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor,
                userSelect: 'none',
                backgroundColor: theme.palette.mode === "dark" ? "#161717" : "#FFFFFF",
                color: theme.palette.mode === "dark" ? "#FFFFFF" : "#000000",
            })}
        >
            <div
                ref={imageWrapperRef}
                style={{ lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            >
                {mediaType === 'photo' && (
                    <LazyLoadImage
                        alt=""
                        effect="blur"
                        src={displayUrl || ''}
                        draggable={false}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "calc(100dvh - 64px)",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            display: "block",
                            pointerEvents: 'none',
                            ...mediaTransform,
                        }}
                    />
                )}
                {mediaType === 'video' && (
                    <video
                        ref={videoRef}
                        src={displayUrl || ''}
                        controls
                        playsInline
                        draggable={false}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "calc(100dvh - 64px)",
                            width: "100%",
                            height: "100%",
                            display: "block",
                            pointerEvents: zoom > MIN_ZOOM ? 'none' : 'auto',
                            ...mediaTransform
                        }}
                        poster=''
                    />
                )}
            </div>
        </Box>
    )
}

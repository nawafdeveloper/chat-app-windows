import { useState, useCallback } from 'react'
import MediaPreviewHeader from './media-preview-header'
import { motion } from 'framer-motion'
import MediaPreviewContent from './media-preview-content';
import { Box } from '@mui/material';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function MediaPreviewWarper() {
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const handleZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                duration: 0.35,
                ease: "easeOut",
            }}
            style={{ height: "100dvh", position: 'absolute', zIndex: 999, top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}
        >
            <Box
                sx={(theme) => ({
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: "flex",
                    flexDirection: 'column',
                    backgroundColor: theme.palette.mode === "dark" ? "#161717" : "#FFFFFF",
                    color: theme.palette.mode === "dark" ? "#FFFFFF" : "#000000"
                })}
            >
                <MediaPreviewHeader
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    maxZoom={MAX_ZOOM}
                    minZoom={MIN_ZOOM}
                />
                <MediaPreviewContent
                    zoom={zoom}
                    maxZoom={MAX_ZOOM}
                    minZoom={MIN_ZOOM}
                    onZoomChange={handleZoomChange}
                />
            </Box>
        </motion.div>
    )
}
import { EmojiEmotionsOutlined } from "@mui/icons-material";
import { IconButton, Paper, Popper, Typography, Zoom } from "@mui/material";
import React, { useState } from "react";

const REACTION_EMOJIS = [
    "\u{1F44D}",
    "\u2764\uFE0F",
    "\u{1F602}",
    "\u{1F62E}",
    "\u{1F972}",
    "\u{1F64F}",
];

type Props = {
    onReact: (emoji: string) => void | Promise<void>;
};

export default function ChatRoomReactionButton({ onReact }: Props) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };
    const handleClose = () => {
        setAnchorEl(null);
        setOpen(false);
    };
    const handleReact = (emoji: string) => {
        handleClose();
        void onReact(emoji);
    };

    return (
        <div>
            <IconButton
                onClick={handleClick}
                aria-label="React to message"
                sx={{
                    color: "gray",
                }}
            >
                <EmojiEmotionsOutlined fontSize="small" />
            </IconButton>
            <Popper
                sx={{ zIndex: 1200 }}
                open={open}
                anchorEl={anchorEl}
                placement="top"
                transition
                modifiers={[
                    {
                        name: "offset",
                        options: {
                            offset: [0, 8],
                        },
                    },
                ]}
            >
                {({ TransitionProps }) => (
                    <Zoom
                        {...TransitionProps}
                        in={open}
                        {...(open ? { timeout: 200 } : {})}
                    >
                        <Paper
                            sx={(theme) => ({
                                p: "4px",
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(20, 22, 22, 1)"
                                        : "#ffffff",
                                borderRadius: 99,
                                boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                                color:
                                    theme.palette.mode === "dark"
                                        ? "#FFFFFF"
                                        : "#000000",
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                            })}
                        >
                            {REACTION_EMOJIS.map((emoji) => (
                                <IconButton
                                    key={emoji}
                                    onClick={() => handleReact(emoji)}
                                    sx={{ px: "2px", py: "1px" }}
                                >
                                    <Typography sx={{ fontSize: "28px" }} variant="body1">
                                        {emoji}
                                    </Typography>
                                </IconButton>
                            ))}
                        </Paper>
                    </Zoom>
                )}
            </Popper>
        </div>
    );
}

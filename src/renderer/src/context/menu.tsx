import React, { useState, useEffect, RefObject } from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem, MenuList } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

interface ContextMenuItem {
    label: string;
    onClick: () => void;
    icon?: React.ReactElement<SvgIconComponent>;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    containerRef?: RefObject<HTMLElement | null>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, containerRef }) => {
    const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            if (containerRef?.current && !containerRef.current.contains(event.target as Node)) {
                return;
            }
            event.preventDefault();
            setAnchorPosition({ top: event.clientY, left: event.clientX });
        };

        const handleClick = () => {
            if (anchorPosition) setAnchorPosition(null);
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("click", handleClick);
        };
    }, [containerRef, anchorPosition]);

    return (
        <Menu
            open={Boolean(anchorPosition)}
            onClose={() => setAnchorPosition(null)}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition ? { top: anchorPosition.top, left: anchorPosition.left } : undefined}
            PaperProps={{
                sx: (theme) => ({
                    backgroundColor: theme.palette.mode === "dark" ? "#222424" : "#fff",
                    borderRadius: 3,
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                }),
            }}
            MenuListProps={{
                "aria-labelledby": "context-menu",
                sx: { p: 1 },
            }}
        >
            <MenuList>
                {items.map((item, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            item.onClick();
                            setAnchorPosition(null);
                        }}
                        sx={(theme) => ({
                            "&:hover": {
                                backgroundColor: theme.palette.mode === "dark" ? "#353939" : "#eee",
                            },
                            borderRadius: 2,
                            py: 1,
                            px: 1,
                        })}
                    >
                        {item.icon && (
                            <ListItemIcon
                                sx={(theme) => ({
                                    color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                })}
                            >
                                {item.icon}
                            </ListItemIcon>
                        )}
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                sx: (theme) => ({
                                    color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                    fontWeight: 600,
                                    fontSize: "15px",
                                }),
                            }}
                        />
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
};

export default ContextMenu;

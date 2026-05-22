import { LogoutOutlined } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

type Props = {
    logout: () => void;
};

export default function ChatsMoreButtonMenu({ logout }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    return (
        <div>
            <Tooltip
                title={isRTL ? 'تسجيل الخروج' : 'Logout'}
                placement={isRTL ? "bottom-end" : "bottom"}
                slotProps={{
                    tooltip: {
                        sx: (theme) => ({
                            backgroundColor:
                                theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
                            direction: isRTL ? 'rtl' : 'ltr',
                            textAlign: isRTL ? 'right' : 'left',
                        }),
                    },
                }}
            >
                <IconButton
                    id="more-button"
                    onClick={logout}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? "#333333"
                                    : "#e5e5e5",
                        },
                    })}
                >
                    <LogoutOutlined
                        sx={(theme) => ({
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            transform: isRTL ? 'scaleX(-1)' : 'scaleX(1)',
                        })}
                    />
                </IconButton>
            </Tooltip>
        </div>
    )
}
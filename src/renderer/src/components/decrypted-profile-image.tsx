import { Avatar, AvatarProps } from "@mui/material";
import { useDecryptedProfileImage } from "../hooks/use-decrypted-profile-image";

interface DecryptedProfileImageProps extends Omit<AvatarProps, "src"> {
    imageUrl?: string | null;
    fallback?: React.ReactNode;
}

export default function DecryptedProfileImage({
    imageUrl,
    fallback,
    ...avatarProps
}: DecryptedProfileImageProps) {
    const { decryptedUrl, loading } = useDecryptedProfileImage(imageUrl);

    if (loading) {
        // Show fallback while decrypting
        return <Avatar {...avatarProps}>{fallback}</Avatar>;
    }

    if (!decryptedUrl) {
        // Show fallback if decryption failed or no image
        return <Avatar {...avatarProps}>{fallback}</Avatar>;
    }

    return <Avatar {...avatarProps} src={decryptedUrl} />;
}

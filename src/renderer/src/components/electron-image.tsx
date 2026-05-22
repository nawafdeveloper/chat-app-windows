import type { ImgHTMLAttributes } from "react";
import { publicAssetSrc } from "../lib/public-assets";

type ElectronImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string;
    width?: number | string;
    height?: number | string;
};

export default function ElectronImage({
    src,
    alt,
    width,
    height,
    loading = "lazy",
    ...props
}: ElectronImageProps) {
    return (
        <img
            {...props}
            src={publicAssetSrc(src)}
            alt={alt ?? ""}
            width={width}
            height={height}
            loading={loading}
        />
    );
}

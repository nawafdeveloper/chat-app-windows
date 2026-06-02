const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const repoRoot = path.resolve(__dirname, "..");
const sourceIcon = path.join(
  repoRoot,
  "src",
  "renderer",
  "public",
  "icon-512x512.png"
);
const appxAssetDir = path.join(repoRoot, "build", "appx");
const appListTargetSizes = [
  16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 256,
];
const tileAssets = [
  { fileName: "Square44x44Logo.png", width: 44, height: 44 },
  { fileName: "Square150x150Logo.png", width: 150, height: 150 },
  { fileName: "StoreLogo.png", width: 512, height: 512 },
  { fileName: "Wide310x150Logo.png", width: 310, height: 150 },
];

async function createContainedIcon(width, height) {
  const iconSize = Math.min(width, height);

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(sourceIcon)
          .resize(iconSize, iconSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        left: Math.round((width - iconSize) / 2),
        top: Math.round((height - iconSize) / 2),
      },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function writePng(fileName, width, height) {
  fs.writeFileSync(
    path.join(appxAssetDir, fileName),
    await createContainedIcon(width, height)
  );
}

(async () => {
  fs.mkdirSync(appxAssetDir, { recursive: true });

  for (const { fileName, width, height } of tileAssets) {
    await writePng(fileName, width, height);
  }

  for (const size of appListTargetSizes) {
    await writePng(`Square44x44Logo.targetsize-${size}.png`, size, size);
    await writePng(
      `Square44x44Logo.targetsize-${size}_altform-unplated.png`,
      size,
      size
    );
    await writePng(
      `Square44x44Logo.targetsize-${size}_altform-lightunplated.png`,
      size,
      size
    );
  }
})();

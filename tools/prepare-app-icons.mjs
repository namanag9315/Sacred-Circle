#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const mobileDir = join(repoRoot, "apps", "mobile");
const source = join(mobileDir, "src", "assets", "starter", "sacred-flame-logo.png");
const outputDir = join(mobileDir, "src", "assets", "branding");
const size = 1024;

await mkdir(outputDir, { recursive: true });

await Promise.all([
  renderOpaqueIcon(join(outputDir, "app-icon.png")),
  renderAdaptiveForeground(join(outputDir, "app-icon-foreground.png"))
]);

console.log("Prepared Sacred Circle native app icons from the approved flame logo.");

async function renderOpaqueIcon(destination) {
  await sharp(source)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: "#FFF9F0" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(destination);
}

async function renderAdaptiveForeground(destination) {
  const markSize = Math.round(size * 0.64);
  const mask = Buffer.from(
    `<svg width="${markSize}" height="${markSize}"><circle cx="${markSize / 2}" cy="${markSize / 2}" r="${markSize / 2}" fill="#fff" /></svg>`
  );
  const mark = await sharp(source)
    .resize(markSize, markSize, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(destination);
}

#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const mobileDir = join(repoRoot, "apps", "mobile");
const distDir = join(mobileDir, "dist");
const publicDir = join(mobileDir, "public");
const starterAsset = join(mobileDir, "src", "assets", "starter", "starter-background.png");
const flameAsset = join(mobileDir, "src", "assets", "starter", "sacred-flame-logo-optimized.png");
const indexPath = join(distDir, "index.html");

const requiredFiles = [indexPath, starterAsset, flameAsset];
for (const path of requiredFiles) {
  if (!existsSync(path)) {
    throw new Error(`Mobile web preparation is missing ${relative(repoRoot, path)}.`);
  }
}

const manifest = {
  id: "/",
  name: "Sacred Circle",
  short_name: "Sacred Circle",
  description: "Join Sacred Circle sessions and access meditation audio, videos, recordings and spiritual resources.",
  start_url: "/",
  scope: "/",
  lang: "en-IN",
  dir: "ltr",
  display: "standalone",
  display_override: ["standalone", "minimal-ui"],
  orientation: "portrait-primary",
  theme_color: "#FFF9F0",
  background_color: "#FFF9F0",
  categories: ["health", "lifestyle", "education"],
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ],
  prefer_related_applications: false
};

const startupImages = [
  { deviceWidth: 320, deviceHeight: 568, pixelRatio: 2, width: 640, height: 1136 },
  { deviceWidth: 375, deviceHeight: 667, pixelRatio: 2, width: 750, height: 1334 },
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3, width: 1242, height: 2208 },
  { deviceWidth: 375, deviceHeight: 812, pixelRatio: 3, width: 1125, height: 2436 },
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 2, width: 828, height: 1792 },
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 3, width: 1242, height: 2688 },
  { deviceWidth: 390, deviceHeight: 844, pixelRatio: 3, width: 1170, height: 2532 },
  { deviceWidth: 428, deviceHeight: 926, pixelRatio: 3, width: 1284, height: 2778 },
  { deviceWidth: 393, deviceHeight: 852, pixelRatio: 3, width: 1179, height: 2556 },
  { deviceWidth: 430, deviceHeight: 932, pixelRatio: 3, width: 1290, height: 2796 },
  { deviceWidth: 402, deviceHeight: 874, pixelRatio: 3, width: 1206, height: 2622 },
  { deviceWidth: 440, deviceHeight: 956, pixelRatio: 3, width: 1320, height: 2868 }
];

await Promise.all([
  generateIcons(publicDir),
  generateIcons(distDir),
  generateStartupImages(distDir)
]);

writeJson(join(publicDir, "manifest.json"), manifest);
writeJson(join(distDir, "manifest.json"), manifest);

let html = readFileSync(indexPath, "utf8");
html = removePreviousPwaMarkup(html);
html = html.replace(
  /<meta name="viewport" content="[^"]*" \/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />'
);
html = html.replace(/<title>[^<]*<\/title>/, "<title>Sacred Circle</title>");

const startupLinks = startupImages.map((image) => {
  const filename = startupFilename(image);
  const media = `(device-width: ${image.deviceWidth}px) and (device-height: ${image.deviceHeight}px) and (-webkit-device-pixel-ratio: ${image.pixelRatio}) and (orientation: portrait)`;
  return `  <link rel="apple-touch-startup-image" href="/ios-startup/${filename}" media="${media}" />`;
});

const headMarkup = [
  "<!-- Sacred Circle PWA -->",
  '  <meta name="application-name" content="Sacred Circle" />',
  '  <meta name="description" content="Join Sacred Circle sessions and access meditation audio, videos, recordings and spiritual resources." />',
  '  <meta name="theme-color" content="#FFF9F0" />',
  '  <meta name="color-scheme" content="light" />',
  '  <meta name="mobile-web-app-capable" content="yes" />',
  '  <meta name="apple-mobile-web-app-capable" content="yes" />',
  '  <meta name="apple-mobile-web-app-title" content="Sacred Circle" />',
  '  <meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '  <meta name="format-detection" content="telephone=no, address=no, email=no" />',
  '  <link rel="manifest" href="/manifest.json" />',
  '  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />',
  '  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />',
  ...startupLinks,
  "<!-- /Sacred Circle PWA -->"
].join("\n");

const pwaStyles = `
    <style id="sacred-circle-pwa">
      :root {
        color-scheme: light;
        --app-height: 100dvh;
        background: #FFF9F0;
      }
      html {
        width: 100%;
        height: 100%;
        min-height: 100%;
        background: #FFF9F0;
      }
      body,
      #root {
        box-sizing: border-box;
        width: 100%;
        height: var(--app-height, 100dvh);
        min-height: 0;
        background: #FFF9F0;
      }
      html,
      body {
        overflow: hidden;
        overscroll-behavior: none;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
      body {
        position: fixed;
        inset: 0;
        margin: 0;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      #root {
        display: flex;
        min-width: 0;
        min-height: 0;
        isolation: isolate;
      }
      input,
      textarea,
      select {
        font-size: 16px !important;
      }
    </style>`;

const pwaBoot = `
  <script id="sacred-circle-pwa-boot">
    (() => {
      const syncViewportHeight = () => {
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        document.documentElement.style.setProperty("--app-height", Math.round(viewportHeight) + "px");
      };
      syncViewportHeight();
      window.addEventListener("resize", syncViewportHeight, { passive: true });
      window.addEventListener("orientationchange", syncViewportHeight, { passive: true });
      window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });

      if (!("serviceWorker" in navigator) || !(window.isSecureContext || location.hostname === "localhost")) return;
      window.addEventListener("load", async () => {
        try {
          const hadController = Boolean(navigator.serviceWorker.controller);
          let refreshing = false;
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!hadController || refreshing) return;
            refreshing = true;
            window.location.reload();
          });
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none"
          });
          registration.update().catch(() => undefined);
        } catch (error) {
          console.warn("Sacred Circle offline support could not start.", error);
        }
      });
    })();
  </script>`;

html = html.replace(/\s*<\/head>/, `\n${headMarkup}\n${pwaStyles}\n</head>`);
html = html.replace(/\s*<\/body>/, `\n${pwaBoot}\n</body>`);
writeFileSync(indexPath, html);

const precacheFiles = collectPrecacheFiles(distDir);
const cacheVersion = createHash("sha256")
  .update(precacheFiles.map((file) => `${file.url}:${file.hash}`).join("\n"))
  .digest("hex")
  .slice(0, 16);
writeFileSync(join(distDir, "sw.js"), createServiceWorker(cacheVersion, precacheFiles.map((file) => file.url)));

console.log(`Prepared Sacred Circle iOS PWA (${cacheVersion}, ${precacheFiles.length} offline shell files).`);

async function generateIcons(outputDir) {
  const iconDir = join(outputDir, "icons");
  mkdirSync(iconDir, { recursive: true });
  await Promise.all([
    renderOpaqueWebIcon(join(iconDir, "apple-touch-icon-180.png"), 180),
    renderOpaqueWebIcon(join(iconDir, "icon-192.png"), 192),
    renderOpaqueWebIcon(join(iconDir, "icon-512.png"), 512),
    renderMaskableWebIcon(join(iconDir, "icon-maskable-512.png"), 512)
  ]);
}

async function renderOpaqueWebIcon(destination, size) {
  await sharp(flameAsset)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: "#FFF9F0" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(destination);
}

async function renderMaskableWebIcon(destination, size) {
  const logoSize = Math.round(size * 0.72);
  const mask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}"><circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="#fff" /></svg>`
  );
  const logo = await sharp(flameAsset)
    .resize(logoSize, logoSize, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#FFF9F0" }
  })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(destination);
}

async function generateStartupImages(outputDir) {
  const startupDir = join(outputDir, "ios-startup");
  mkdirSync(startupDir, { recursive: true });
  await Promise.all(startupImages.map(async (image) => {
    await sharp(starterAsset)
      .resize(image.width, image.height, { fit: "cover", position: "centre" })
      .jpeg({ quality: 84, chromaSubsampling: "4:2:0", mozjpeg: true })
      .toFile(join(startupDir, startupFilename(image)));
  }));
}

function startupFilename(image) {
  return `iphone-${image.width}x${image.height}.jpg`;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function removePreviousPwaMarkup(input) {
  let output = input.replace(/\s*<!-- Sacred Circle PWA -->[\s\S]*?<!-- \/Sacred Circle PWA -->\s*/g, "\n");
  output = output.replace(/\s*<style id="sacred-circle-pwa">[\s\S]*?<\/style>\s*/g, "\n");
  output = output.replace(/\s*<script id="sacred-circle-pwa-boot">[\s\S]*?<\/script>\s*/g, "\n");
  const metaNames = [
    "application-name",
    "description",
    "theme-color",
    "color-scheme",
    "mobile-web-app-capable",
    "apple-mobile-web-app-capable",
    "apple-mobile-web-app-title",
    "apple-mobile-web-app-status-bar-style",
    "format-detection"
  ];
  for (const name of metaNames) {
    output = output.replace(new RegExp(`\\s*<meta[^>]+name=["']${name}["'][^>]*\\/?>`, "gi"), "");
  }
  output = output.replace(/\s*<link[^>]+rel=["']manifest["'][^>]*\/?>/gi, "");
  output = output.replace(/\s*<link[^>]+rel=["']apple-touch-icon["'][^>]*\/?>/gi, "");
  output = output.replace(/\s*<link[^>]+rel=["']apple-touch-startup-image["'][^>]*\/?>/gi, "");
  return output;
}

function collectPrecacheFiles(rootDir) {
  const ignored = new Set(["metadata.json", "sw.js", "_headers", "_redirects"]);
  const files = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolute = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "ios-startup") continue;
        walk(absolute);
        continue;
      }
      const relativePath = relative(rootDir, absolute).split(sep).join("/");
      if (ignored.has(relativePath) || relativePath.endsWith(".map")) continue;
      if (!isAppShellFile(relativePath)) continue;
      const content = readFileSync(absolute);
      files.push({
        url: `/${relativePath}`,
        hash: createHash("sha256").update(content).digest("hex")
      });
    }
  }

  walk(rootDir);
  return files.sort((a, b) => a.url.localeCompare(b.url));
}

function isAppShellFile(path) {
  return (
    ["index.html", "manifest.json", "favicon.ico"].includes(path) ||
    path.startsWith("_expo/static/js/") ||
    path.startsWith("icons/") ||
    path.includes("/assets/fonts/") ||
    path.includes("/assets/starter/")
  );
}

function createServiceWorker(version, urls) {
  return `/* Sacred Circle generated service worker. */
const CACHE_NAME = "sacred-circle-${version}";
const APP_SHELL = ${JSON.stringify(urls, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("sacred-circle-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", response.clone()));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  if (url.pathname === "/sw.js") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
      if (cached) {
        event.waitUntil(refresh.catch(() => undefined));
        return cached;
      }
      return refresh;
    })
  );
});
`;
}

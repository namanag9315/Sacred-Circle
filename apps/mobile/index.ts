import { registerRootComponent } from "expo";
import App from "./App";

if (typeof document !== "undefined") {
  const upsertMeta = (name: string, content: string) => {
    const meta = document.querySelector(`meta[name="${name}"]`) ?? document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    if (!meta.parentNode) {
      document.head.appendChild(meta);
    }
  };

  const upsertLink = (
    rel: string,
    href: string,
    attributes: { sizes?: string; type?: string } = {}
  ) => {
    const sizesSelector = attributes.sizes ? `[sizes="${attributes.sizes}"]` : "";
    const link = document.querySelector(`link[rel="${rel}"]${sizesSelector}`) ?? document.createElement("link");
    link.setAttribute("rel", rel);
    link.setAttribute("href", href);
    if (attributes.sizes) link.setAttribute("sizes", attributes.sizes);
    if (attributes.type) link.setAttribute("type", attributes.type);
    if (!link.parentNode) {
      document.head.appendChild(link);
    }
  };

  const viewportContent = "width=device-width, initial-scale=1, viewport-fit=cover";
  const viewport = document.querySelector('meta[name="viewport"]') ?? document.createElement("meta");
  viewport.setAttribute("name", "viewport");
  viewport.setAttribute("content", viewportContent);
  if (!viewport.parentNode) {
    document.head.appendChild(viewport);
  }
  upsertMeta("theme-color", "#FFF9F0");
  upsertMeta("mobile-web-app-capable", "yes");
  upsertMeta("apple-mobile-web-app-capable", "yes");
  upsertMeta("apple-mobile-web-app-title", "Sacred Circle");
  upsertMeta("apple-mobile-web-app-status-bar-style", "default");
  upsertMeta("format-detection", "telephone=no");
  upsertLink("manifest", "/manifest.json");
  upsertLink("apple-touch-icon", "/icons/sacred-circle-180.png", { sizes: "180x180" });
  upsertLink("icon", "/icons/sacred-circle-32.png", { sizes: "32x32", type: "image/png" });
  upsertLink("icon", "/icons/sacred-circle-192.png", { sizes: "192x192", type: "image/png" });
  document.documentElement.style.overflowX = "hidden";
  document.documentElement.style.backgroundColor = "#FFF9F0";
  document.documentElement.style.minHeight = "100dvh";
  document.body.style.overflowX = "hidden";
  document.body.style.backgroundColor = "#FFF9F0";
  document.body.style.minHeight = "100dvh";
}

registerRootComponent(App);

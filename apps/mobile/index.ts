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

  const upsertLink = (rel: string, href: string) => {
    const link = document.querySelector(`link[rel="${rel}"]`) ?? document.createElement("link");
    link.setAttribute("rel", rel);
    link.setAttribute("href", href);
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
  upsertLink("apple-touch-icon", "/icons/apple-touch-icon-180.png");
  upsertLink("icon", "/icons/icon-192.png");
  document.documentElement.style.overflowX = "hidden";
  document.documentElement.style.backgroundColor = "#FFF9F0";
  document.documentElement.style.minHeight = "100dvh";
  document.body.style.overflowX = "hidden";
  document.body.style.backgroundColor = "#FFF9F0";
  document.body.style.minHeight = "100dvh";
}

registerRootComponent(App);

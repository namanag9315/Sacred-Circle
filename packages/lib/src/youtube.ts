export function getYouTubeVideoId(url?: string | null) {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;

  const directMatch = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,})/);
  if (directMatch?.[1]) return directMatch[1];

  try {
    const parsed = new URL(value);
    const v = parsed.searchParams.get("v");
    if (v) return v;
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeThumbnailUrl(url?: string | null, quality: "maxresdefault" | "hqdefault" | "mqdefault" = "hqdefault") {
  const id = getYouTubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : null;
}

/** Compress an image file to a JPEG data URL (max edge, quality). */
export function compressImage(
  file: File,
  maxEdge = 1600,
  quality = 0.9,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxEdge || height > maxEdge) {
        const scale = maxEdge / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not available"));
        return;
      }
      // High-quality downscale for clearer personal photos
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#12141a";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/** Build a simple branded SVG placeholder as a data URL. */
export function figurePlaceholder(
  name: string,
  accent = "#c41e3a",
): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const safe = name.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1d26"/>
      <stop offset="100%" stop-color="#0a0b0e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#g)"/>
  <rect x="40" y="40" width="1120" height="1120" rx="24" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>
  <circle cx="600" cy="480" r="140" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
  <text x="600" y="505" text-anchor="middle" font-family="system-ui,sans-serif" font-size="72" font-weight="600" fill="${accent}">${initials}</text>
  <text x="600" y="720" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="500" fill="#eef0f4">${safe.slice(0, 32)}</text>
  <text x="600" y="780" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="#6b7385">McFarlane Toys</text>
  <rect x="500" y="860" width="200" height="6" rx="3" fill="${accent}" fill-opacity="0.6"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

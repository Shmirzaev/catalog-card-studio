import type { Canvas } from "fabric";

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadPNG(canvas: Canvas, filename = "milana-card.png") {
  const dataUrl = canvas.toDataURL({
    format: "png",
    multiplier: 1,
    enableRetinaScaling: false
  });
  downloadDataUrl(dataUrl, filename);
}

export function downloadJPG(canvas: Canvas, filename = "milana-card.jpg") {
  const dataUrl = canvas.toDataURL({
    format: "jpeg",
    quality: 0.95,
    multiplier: 1,
    enableRetinaScaling: false
  });
  downloadDataUrl(dataUrl, filename);
}

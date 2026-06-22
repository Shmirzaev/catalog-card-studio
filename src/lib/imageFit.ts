export type FitMode = "contain" | "cover";

export type FitRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export function getImageFit(
  image: ImageSize,
  rect: FitRect,
  mode: FitMode = "contain"
) {
  const scaleX = rect.width / image.width;
  const scaleY = rect.height / image.height;
  const scale = mode === "cover" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const width = image.width * scale;
  const height = image.height * scale;

  return {
    scale,
    left: rect.x + (rect.width - width) / 2,
    top: rect.y + (rect.height - height) / 2,
    width,
    height
  };
}

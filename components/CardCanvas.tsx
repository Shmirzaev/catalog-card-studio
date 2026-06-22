"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Canvas,
  FabricImage,
  Group,
  Line,
  Rect,
  Text,
  type FabricObject
} from "fabric";
import type { DetailSizes, ProductCardData } from "@/components/CardGenerator";
import { downloadJPG, downloadPNG } from "@/src/lib/downloadCanvas";
import { getImageFit } from "@/src/lib/imageFit";
import { milanaTemplate as t } from "@/src/templates/milanaTemplate";

const layoutStorageKey = "milana-card-generator-layout";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const logoPath = `${basePath}/milana-logo.png`;

export type CardCanvasHandle = {
  downloadPNG: () => void;
  downloadJPG: () => void;
};

type CardCanvasProps = {
  data: ProductCardData;
  detailSizes: DetailSizes;
  parsedSizes: number[];
  refreshKey: number;
  editLayout: boolean;
  layoutResetKey: number;
};

type LayoutKey = string;
type LayoutPosition = {
  left: number;
  top: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
};

type EditableObject = FabricObject & {
  layoutKey?: LayoutKey;
};

function makeEditableGroup(
  key: LayoutKey,
  objects: FabricObject[],
  editLayout: boolean,
  positions: Partial<Record<LayoutKey, LayoutPosition>>,
  options: { allowTransform?: boolean } = {}
) {
  const group = new Group(objects, {
    selectable: editLayout,
    evented: editLayout,
    hasControls: editLayout && Boolean(options.allowTransform),
    hoverCursor: editLayout ? "move" : "default",
    moveCursor: editLayout ? "move" : "default",
    lockScalingX: !options.allowTransform,
    lockScalingY: !options.allowTransform,
    lockRotation: !options.allowTransform,
    borderColor: "#111111",
    cornerColor: "#111111",
    transparentCorners: false
  }) as EditableObject;

  group.layoutKey = key;

  const savedPosition = positions[key];
  if (savedPosition) {
    group.set(savedPosition);
  }

  return group;
}

function saveCurrentLayout(canvas: Canvas, positions: Partial<Record<LayoutKey, LayoutPosition>>) {
  canvas.getObjects().forEach((object) => {
    const editableObject = object as EditableObject;
    if (!editableObject.layoutKey) return;

    positions[editableObject.layoutKey] = {
      left: editableObject.left ?? 0,
      top: editableObject.top ?? 0,
      scaleX: editableObject.scaleX,
      scaleY: editableObject.scaleY,
      angle: editableObject.angle
    };
  });
}

function persistLayout(positions: Partial<Record<LayoutKey, LayoutPosition>>) {
  try {
    window.localStorage.setItem(layoutStorageKey, JSON.stringify(positions));
  } catch {
    // Browser storage can be unavailable in private or restricted sessions.
  }
}

function loadSavedLayout() {
  try {
    const saved = window.localStorage.getItem(layoutStorageKey);
    if (!saved) return {};
    return JSON.parse(saved) as Partial<Record<LayoutKey, LayoutPosition>>;
  } catch {
    return {};
  }
}

function clearSavedLayout() {
  try {
    window.localStorage.removeItem(layoutStorageKey);
  } catch {
    // Ignore storage failures; the in-memory reset still works.
  }
}

function cloneLayout(positions: Partial<Record<LayoutKey, LayoutPosition>>) {
  return JSON.parse(JSON.stringify(positions)) as Partial<Record<LayoutKey, LayoutPosition>>;
}

function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

function saveObjectLayout(
  target: FabricObject | undefined,
  positions: Partial<Record<LayoutKey, LayoutPosition>>
) {
  const editableObject = target as EditableObject | undefined;
  if (!editableObject?.layoutKey) return;

  positions[editableObject.layoutKey] = {
    left: editableObject.left ?? 0,
    top: editableObject.top ?? 0,
    scaleX: editableObject.scaleX,
    scaleY: editableObject.scaleY,
    angle: editableObject.angle
  };
}

function add(canvas: Canvas, object: FabricObject) {
  canvas.add(object);
}

function makeText(text: string, options: ConstructorParameters<typeof Text>[1]) {
  return new Text(text, {
    fontFamily: "Arial",
    fill: "#101010",
    selectable: false,
    evented: false,
    ...options
  });
}

function makeRect(options: ConstructorParameters<typeof Rect>[0]) {
  return new Rect({
    selectable: false,
    evented: false,
    ...options
  });
}

function makeHitArea(options: ConstructorParameters<typeof Rect>[0]) {
  return makeRect({
    fill: "rgba(0,0,0,0)",
    strokeWidth: 0,
    ...options
  });
}

async function loadFabricImage(src: string) {
  return FabricImage.fromURL(src, { crossOrigin: "anonymous" });
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load zoom image."));
    image.src = src;
  });
}

async function createCircularImageDataUrl(src: string, diameter: number) {
  const image = await loadHtmlImage(src);
  const output = document.createElement("canvas");
  output.width = diameter;
  output.height = diameter;
  const context = output.getContext("2d");

  if (!context) {
    throw new Error("Could not create zoom image.");
  }

  const scale = Math.max(diameter / image.naturalWidth, diameter / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const left = (diameter - width) / 2;
  const top = (diameter - height) / 2;

  context.beginPath();
  context.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, left, top, width, height);

  return output.toDataURL("image/png");
}

async function logoExists() {
  try {
    const response = await fetch(logoPath, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

function addBackground(canvas: Canvas) {
  add(
    canvas,
    makeRect({
      left: 0,
      top: 0,
      width: t.canvas.width,
      height: t.canvas.height,
      fill: t.background.outerColor
    })
  );

  add(
    canvas,
    makeRect({
      left: t.background.margin,
      top: t.background.margin,
      width: t.canvas.width - t.background.margin * 2,
      height: t.canvas.height - t.background.margin * 2,
      rx: t.background.radius,
      ry: t.background.radius,
      fill: t.background.color
    })
  );
}

function addProductBox(
  canvas: Canvas,
  data: ProductCardData,
  detailSizes: DetailSizes,
  editLayout: boolean,
  positions: Partial<Record<LayoutKey, LayoutPosition>>
) {
  add(
    canvas,
    makeEditableGroup(
      "productBox",
      [
        makeRect({
      left: t.productNameBox.x,
      top: t.productNameBox.y,
      width: t.productNameBox.width,
      height: t.productNameBox.height,
      rx: t.productNameBox.radius,
      ry: t.productNameBox.radius,
      fill: t.productNameBox.color
    }),
        makeRect({
      left: t.productNameBox.x,
      top: t.productNameBox.y + t.productNameBox.height * 0.58,
      width: t.productNameBox.width,
      height: t.productNameBox.height * 0.42,
      fill: t.productNameBox.fabricBandColor
    })
      ],
      editLayout,
      positions
    )
  );

  add(
    canvas,
    makeEditableGroup(
      "productNameText",
      [
        makeText(data.productName || "Suprem", {
      left: t.productName.x,
      top: t.productName.y,
      originX: "center",
      fontSize: detailSizes.productName,
      fontWeight: t.productName.fontWeight,
      fill: t.productName.color
    })
      ],
      editLayout,
      positions
    )
  );

  add(
    canvas,
    makeEditableGroup(
      "fabricText",
      [
        makeText(data.fabric || "100% COTTON", {
      left: t.fabric.x,
      top: t.fabric.y,
      originX: "center",
      fontSize: detailSizes.fabric,
      fontWeight: t.fabric.fontWeight,
      fill: t.fabric.color
    })
      ],
      editLayout,
      positions
    )
  );
}

function makeCornerBracket(x: number, y: number, width: number, height: number) {
  const stroke = t.bracket.color;
  const strokeWidth = t.bracket.strokeWidth;
  const lineLength = 22;
  const points: Array<[number, number, number, number]> = [
    [x, y, x + lineLength, y],
    [x, y, x, y + lineLength],
    [x + width, y, x + width - lineLength, y],
    [x + width, y, x + width, y + lineLength],
    [x, y + height, x + lineLength, y + height],
    [x, y + height, x, y + height - lineLength],
    [x + width, y + height, x + width - lineLength, y + height],
    [x + width, y + height, x + width, y + height - lineLength]
  ];

  return points.map(
    (point) =>
      new Line(point, {
        stroke,
        strokeWidth,
        selectable: false,
        evented: false
      })
  );
}

function addModelCode(
  canvas: Canvas,
  data: ProductCardData,
  detailSizes: DetailSizes,
  editLayout: boolean,
  positions: Partial<Record<LayoutKey, LayoutPosition>>
) {
  const detailHitPadding = 24;

  add(
    canvas,
    makeEditableGroup(
      "modelDetails",
      [
        makeHitArea({
          left: t.bracket.modelX - detailHitPadding,
          top: t.model.labelY - detailHitPadding,
          width: t.bracket.modelWidth + detailHitPadding * 2,
          height: t.bracket.modelHeight + (t.bracket.modelY - t.model.labelY) + detailHitPadding * 2
        }),
        ...makeCornerBracket(
          t.bracket.modelX,
          t.bracket.modelY,
          t.bracket.modelWidth,
          t.bracket.modelHeight
        ),
        makeText("MODEL", {
          left: t.model.labelX,
          top: t.model.labelY,
          fontSize: detailSizes.modelLabel,
          fontWeight: "bold"
        }),
        makeText(data.model || "TJ-2000", {
          left: t.model.valueX,
          top: t.model.valueY,
          fontSize: detailSizes.modelValue,
          fontWeight: "bold"
        })
      ],
      editLayout,
      positions
    )
  );

  add(
    canvas,
    makeEditableGroup(
      "codeDetails",
      [
        makeHitArea({
          left: t.code.labelX - detailHitPadding,
          top: t.code.labelY - detailHitPadding,
          width: t.bracket.modelWidth + detailHitPadding * 2,
          height: t.code.valueY - t.code.labelY + detailSizes.codeValue + detailHitPadding * 2
        }),
        makeText("CODE", {
          left: t.code.labelX,
          top: t.code.labelY,
          fontSize: detailSizes.codeLabel,
          fontWeight: "bold"
        }),
        makeText(data.code || "V-4558", {
          left: t.code.valueX,
          top: t.code.valueY,
          fontSize: detailSizes.codeValue,
          fontWeight: "bold"
        })
      ],
      editLayout,
      positions
    )
  );
}

function addSizes(
  canvas: Canvas,
  parsedSizes: number[],
  detailSizes: DetailSizes,
  editLayout: boolean,
  positions: Partial<Record<LayoutKey, LayoutPosition>>
) {
  const sizes = parsedSizes.length ? parsedSizes : [46, 48, 50, 52, 54, 56];
  const availableHeight = t.sizePanel.height - 95;
  const gap = sizes.length > 1 ? Math.min(t.sizes.gapY, availableHeight / (sizes.length - 1)) : 0;
  const fontSize = Math.max(t.sizes.minFontSize, Math.min(detailSizes.sizeNumber, gap * 0.64 || detailSizes.sizeNumber));
  const boxSize = Math.min(t.sizes.boxSize, Math.max(44, gap * 0.82 || t.sizes.boxSize));

  const objects: FabricObject[] = [
    makeRect({
      left: t.sizePanel.x,
      top: t.sizePanel.y,
      width: t.sizePanel.width,
      height: t.sizePanel.height,
      rx: t.sizePanel.radius,
      ry: t.sizePanel.radius,
      fill: t.sizePanel.color
    })
  ];

  sizes.forEach((size, index) => {
    const y = t.sizes.startY + index * gap;
    objects.push(
      makeRect({
        left: t.sizes.startX - 20,
        top: y - 10,
        width: boxSize,
        height: boxSize,
        fill: "transparent",
        stroke: "#101010",
        strokeWidth: t.sizes.boxStrokeWidth
      })
    );
  });

  add(canvas, makeEditableGroup("sizes", objects, editLayout, positions));

  sizes.forEach((size, index) => {
    const y = t.sizes.startY + index * gap;
    add(
      canvas,
      makeEditableGroup(
        `sizeText-${size}`,
        [
          makeText(String(size), {
            left: t.sizes.startX + boxSize + 2,
            top: y + 8,
            fontSize,
            fontWeight: "bold"
          })
        ],
        editLayout,
        positions
      )
    );
  });
}

async function addLogo(
  canvas: Canvas,
  detailSizes: DetailSizes,
  editLayout: boolean,
  positions: Partial<Record<LayoutKey, LayoutPosition>>
) {
  if (await logoExists()) {
    try {
      const logo = await loadFabricImage(logoPath);
      const scale = detailSizes.logo / (logo.width || t.logo.width);
      logo.set({
        left: t.logo.x,
        top: t.logo.y,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false
      });
      add(canvas, makeEditableGroup("logo", [logo], editLayout, positions));
      return;
    } catch {
      // Fall back to text if the public logo cannot be decoded.
    }
  }

  add(
    canvas,
    makeEditableGroup(
      "logo",
      [
        makeText("MILANA", {
      left: t.logo.x,
      top: t.logo.y + 72,
      fontSize: Math.max(18, Math.min(80, detailSizes.logo / 8)),
      fontWeight: "normal",
      charSpacing: t.logo.fallbackLetterSpacing
    }),
        makeText("PREMIUM", {
      left: t.logo.x + 35,
      top: t.logo.y + 128,
      fontSize: Math.max(14, Math.min(60, detailSizes.logoPremium)),
      fontWeight: "bold",
      charSpacing: 210
    })
      ],
      editLayout,
      positions
    )
  );
}

async function addMainImage(canvas: Canvas, src?: string) {
  if (!src) return;

  const image = await loadFabricImage(src);
  const fit = getImageFit(
    { width: image.width || 1, height: image.height || 1 },
    t.mainImage,
    t.mainImage.fit
  );

  image.set({
    left: fit.left,
    top: fit.top,
    scaleX: fit.scale,
    scaleY: fit.scale,
    selectable: false,
    evented: false,
    clipPath: t.mainImage.clipToCard
      ? new Rect({
          left: t.background.margin,
          top: t.background.margin,
          width: t.canvas.width - t.background.margin * 2,
          height: t.canvas.height - t.background.margin * 2,
          rx: t.background.radius,
          ry: t.background.radius,
          absolutePositioned: true
        })
      : undefined
  });

  add(canvas, image);
}

async function addZoomCircle(
  canvas: Canvas,
  src: string | undefined,
  detailSizes: DetailSizes,
  editLayout: boolean,
  positions: Partial<Record<LayoutKey, LayoutPosition>>
) {
  if (!src) return;

  const d = detailSizes.zoomCircle;
  const cx = t.zoomCircle.x + d / 2;
  const cy = t.zoomCircle.y + d / 2;
  const circularImageSrc = await createCircularImageDataUrl(src, d);
  const image = await loadFabricImage(circularImageSrc);

  add(
    canvas,
    makeEditableGroup(
      "zoomLine1",
      [
        new Line([t.zoomCircle.pointerStartX, t.zoomCircle.pointerStartY, cx, cy], {
          stroke: t.zoomCircle.lineColor,
          strokeWidth: t.zoomCircle.lineWidth,
          selectable: false,
          evented: false
        })
      ],
      editLayout,
      positions,
      { allowTransform: true }
    )
  );

  add(
    canvas,
    makeEditableGroup(
      "zoomLine2",
      [
        new Line([t.zoomCircle.pointerStartX + 10, t.zoomCircle.pointerStartY + 28, cx, cy], {
          stroke: t.zoomCircle.lineColor,
          strokeWidth: t.zoomCircle.lineWidth,
          selectable: false,
          evented: false
        })
      ],
      editLayout,
      positions,
      { allowTransform: true }
    )
  );

  image.set({
    left: t.zoomCircle.x,
    top: t.zoomCircle.y,
    width: d,
    height: d,
    selectable: false,
    evented: false
  });

  add(
    canvas,
    makeEditableGroup("zoomCircle", [image], editLayout, positions, { allowTransform: true })
  );
}

export const CardCanvas = forwardRef<CardCanvasHandle, CardCanvasProps>(function CardCanvas(
  { data, detailSizes, parsedSizes, refreshKey, editLayout, layoutResetKey },
  ref
) {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const positionsRef = useRef<Partial<Record<LayoutKey, LayoutPosition>>>({});
  const undoStackRef = useRef<Array<Partial<Record<LayoutKey, LayoutPosition>>>>([]);
  const pendingUndoSnapshotRef = useRef<Partial<Record<LayoutKey, LayoutPosition>> | null>(null);
  const lastLayoutResetKey = useRef(layoutResetKey);
  const renderVersion = useRef(0);
  const [isRendering, setIsRendering] = useState(true);
  const [layoutUndoKey, setLayoutUndoKey] = useState(0);

  useImperativeHandle(ref, () => ({
    downloadPNG: () => {
      if (canvasRef.current) downloadPNG(canvasRef.current);
    },
    downloadJPG: () => {
      if (canvasRef.current) downloadJPG(canvasRef.current);
    }
  }));

  useEffect(() => {
    if (!canvasHostRef.current) return;

    const canvasElement = document.createElement("canvas");
    canvasElement.width = t.canvas.width;
    canvasElement.height = t.canvas.height;
    canvasElement.className = "h-auto w-full rounded-md shadow-soft";
    canvasHostRef.current.appendChild(canvasElement);

    const canvas = new Canvas(canvasElement, {
      width: t.canvas.width,
      height: t.canvas.height,
      backgroundColor: t.background.outerColor,
      renderOnAddRemove: false,
      preserveObjectStacking: true,
      selection: false
    });

    canvas.on("mouse:down", (event) => {
      const target = event.target as EditableObject | undefined;
      if (!target?.layoutKey) return;

      saveCurrentLayout(canvas, positionsRef.current);
      pendingUndoSnapshotRef.current = cloneLayout(positionsRef.current);
    });
    canvas.on("object:moving", (event) => saveObjectLayout(event.target, positionsRef.current));
    canvas.on("object:modified", (event) => {
      saveObjectLayout(event.target, positionsRef.current);
      if (pendingUndoSnapshotRef.current) {
        undoStackRef.current.push(pendingUndoSnapshotRef.current);
        pendingUndoSnapshotRef.current = null;
      }
      persistLayout(positionsRef.current);
    });

    canvasRef.current = canvas;
    positionsRef.current = loadSavedLayout();

    return () => {
      const host = canvasHostRef.current;
      canvas.dispose();
      if (host) {
        host.replaceChildren();
      }
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    function handleUndo(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      if (isTextEditingTarget(event.target)) return;

      const previousLayout = undoStackRef.current.pop();
      if (!previousLayout) return;

      event.preventDefault();
      positionsRef.current = previousLayout;
      persistLayout(positionsRef.current);
      setLayoutUndoKey((key) => key + 1);
    }

    window.addEventListener("keydown", handleUndo);
    return () => window.removeEventListener("keydown", handleUndo);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasInstance = canvas;

    if (lastLayoutResetKey.current !== layoutResetKey) {
      positionsRef.current = {};
      undoStackRef.current = [];
      pendingUndoSnapshotRef.current = null;
      clearSavedLayout();
      lastLayoutResetKey.current = layoutResetKey;
    } else {
      saveCurrentLayout(canvasInstance, positionsRef.current);
      persistLayout(positionsRef.current);
    }

    const currentVersion = ++renderVersion.current;
    setIsRendering(true);

    async function render() {
      canvasInstance.clear();
      canvasInstance.selection = editLayout;
      addBackground(canvasInstance);
      await addMainImage(canvasInstance, data.mainImageSrc);
      await addLogo(canvasInstance, detailSizes, editLayout, positionsRef.current);
      addProductBox(canvasInstance, data, detailSizes, editLayout, positionsRef.current);
      addModelCode(canvasInstance, data, detailSizes, editLayout, positionsRef.current);
      addSizes(canvasInstance, parsedSizes, detailSizes, editLayout, positionsRef.current);
      await addZoomCircle(
        canvasInstance,
        data.zoomImageSrc,
        detailSizes,
        editLayout,
        positionsRef.current
      );

      if (currentVersion === renderVersion.current) {
        canvasInstance.renderAll();
        setIsRendering(false);
      }
    }

    render().catch(() => {
      canvasInstance.renderAll();
      setIsRendering(false);
    });
  }, [data, detailSizes, parsedSizes, refreshKey, editLayout, layoutResetKey, layoutUndoKey]);

  return (
    <div className="relative mx-auto w-full max-w-[820px] overflow-hidden rounded-lg bg-white/30 p-2">
      <div
        className={`absolute right-4 top-4 z-10 rounded-md bg-white/90 px-3 py-1.5 text-xs font-bold text-black/65 shadow transition-opacity ${
          isRendering ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isRendering}
      >
        Rendering...
      </div>
      <div
        ref={canvasHostRef}
        className="fabric-preview w-full"
      />
    </div>
  );
});

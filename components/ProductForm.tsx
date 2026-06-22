"use client";

import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import type { DetailSizes, ProductCardData } from "@/components/CardGenerator";
import { initialDetailSizes } from "@/components/CardGenerator";
import { parseFilename } from "@/src/lib/parseFilename";

type ProductFormProps = {
  data: ProductCardData;
  detailSizes: DetailSizes;
  parsedSizes: number[];
  onChange: Dispatch<SetStateAction<ProductCardData>>;
  onDetailSizesChange: Dispatch<SetStateAction<DetailSizes>>;
  onRefresh: () => void;
  onDownloadPNG: () => void;
  onDownloadJPG: () => void;
  editLayout: boolean;
  onToggleEditLayout: () => void;
  onResetLayout: () => void;
  onReset: () => void;
};

function Field({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-black/70">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black/45 focus:ring-4 focus:ring-black/5"
      />
    </label>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read this image."));
      }
    };
    reader.onerror = () => reject(new Error("Image upload failed."));
    reader.readAsDataURL(file);
  });
}

export function ProductForm({
  data,
  detailSizes,
  parsedSizes,
  onChange,
  onDetailSizesChange,
  onRefresh,
  onDownloadPNG,
  onDownloadJPG,
  editLayout,
  onToggleEditLayout,
  onResetLayout,
  onReset
}: ProductFormProps) {
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    kind: "main" | "zoom"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a PNG or JPG image.");
      return;
    }

    setIsLoadingImage(true);
    setError(null);

    try {
      const src = await readFileAsDataUrl(file);
      onChange((current) => ({
        ...current,
        ...(kind === "main"
          ? { mainImageSrc: src, mainImageName: file.name }
          : { zoomImageSrc: src, zoomImageName: file.name })
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setIsLoadingImage(false);
      event.target.value = "";
    }
  }

  function update<K extends keyof ProductCardData>(key: K, value: ProductCardData[K]) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  function updateDetailSize(key: keyof DetailSizes, value: string) {
    const size = Number(value);
    if (!Number.isFinite(size)) return;
    const max = key === "logo" || key === "zoomCircle" ? 900 : 160;
    onDetailSizesChange((current) => ({
      ...current,
      [key]: Math.max(8, Math.min(max, size))
    }));
  }

  function parseMainFilename() {
    if (!data.mainImageName) {
      setError("Upload the main product image first, then parse its filename.");
      return;
    }

    const parsed = parseFilename(data.mainImageName);
    onChange((current) => ({
      ...current,
      model: parsed.model ?? current.model,
      code: parsed.code ?? current.code,
      sizesInput: parsed.sizes ?? current.sizesInput,
      fabric: parsed.fabric ?? current.fabric
    }));
    setError(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-black/70">
            Upload main product image
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => handleImageUpload(event, "main")}
            className="block w-full cursor-pointer rounded-md border border-dashed border-black/25 bg-white px-3 py-3 text-sm"
          />
          {data.mainImageName ? (
            <span className="mt-1 block truncate text-xs text-black/55">{data.mainImageName}</span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-black/70">
            Upload fabric zoom/detail image
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => handleImageUpload(event, "zoom")}
            className="block w-full cursor-pointer rounded-md border border-dashed border-black/25 bg-white px-3 py-3 text-sm"
          />
          {data.zoomImageName ? (
            <span className="mt-1 block truncate text-xs text-black/55">{data.zoomImageName}</span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field
          label="Product name"
          value={data.productName}
          placeholder="Suprem"
          onChange={(value) => update("productName", value)}
        />
        <Field
          label="Fabric"
          value={data.fabric}
          placeholder="100% COTTON"
          onChange={(value) => update("fabric", value.toUpperCase())}
        />
        <Field
          label="Model"
          value={data.model}
          placeholder="TJ-2000"
          onChange={(value) => update("model", value.toUpperCase())}
        />
        <Field
          label="Code"
          value={data.code}
          placeholder="V-4558"
          onChange={(value) => update("code", value.toUpperCase())}
        />
      </div>

      <Field
        label="Sizes"
        value={data.sizesInput}
        placeholder="46-56"
        onChange={(value) => update("sizesInput", value)}
      />
      <p className="rounded-md bg-black/[0.04] px-3 py-2 text-sm text-black/65">
        Parsed sizes: {parsedSizes.length ? parsedSizes.join(", ") : "none"}
      </p>

      <details className="rounded-md border border-black/10 bg-white/60 p-3">
        <summary className="cursor-pointer text-sm font-bold text-black/75">Detail text sizes</summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ["productName", "Product"] as const,
            ["fabric", "Fabric"] as const,
            ["modelLabel", "Model label"] as const,
            ["modelValue", "Model"] as const,
            ["codeLabel", "Code label"] as const,
            ["codeValue", "Code"] as const,
            ["sizeNumber", "Sizes"] as const,
            ["zoomCircle", "Zoom circle"] as const,
            ["logo", "Logo width"] as const
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-bold text-black/60">{label}</span>
              <input
                type="number"
                min={8}
                max={key === "logo" || key === "zoomCircle" ? 900 : 160}
                value={detailSizes[key]}
                onChange={(event) => updateDetailSize(key, event.target.value)}
                className="h-9 w-full rounded-md border border-black/15 bg-white px-2 text-sm outline-none focus:border-black/45"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => onDetailSizesChange(initialDetailSizes)}
            className="col-span-2 rounded-md border border-black/15 bg-white px-3 py-2 text-sm font-bold transition hover:border-black/35"
          >
            Reset text sizes
          </button>
        </div>
      </details>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {isLoadingImage ? (
        <p className="rounded-md bg-black/[0.04] px-3 py-2 text-sm text-black/65">
          Processing image...
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md bg-[#171411] px-3 py-3 text-sm font-bold text-white transition hover:bg-black"
        >
          Generate / Refresh Preview
        </button>
        <button
          type="button"
          onClick={parseMainFilename}
          className="rounded-md border border-black/15 bg-white px-3 py-3 text-sm font-bold transition hover:border-black/35"
        >
          Parse from filename
        </button>
        <button
          type="button"
          onClick={onDownloadPNG}
          className="rounded-md border border-black/15 bg-white px-3 py-3 text-sm font-bold transition hover:border-black/35"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={onDownloadJPG}
          className="rounded-md border border-black/15 bg-white px-3 py-3 text-sm font-bold transition hover:border-black/35"
        >
          Download JPG
        </button>
        <button
          type="button"
          onClick={onToggleEditLayout}
          className={`rounded-md px-3 py-3 text-sm font-bold transition ${
            editLayout
              ? "bg-[#171411] text-white"
              : "border border-black/15 bg-white hover:border-black/35"
          }`}
        >
          {editLayout ? "Lock layout" : "Move details"}
        </button>
        <button
          type="button"
          onClick={onResetLayout}
          className="rounded-md border border-black/15 bg-white px-3 py-3 text-sm font-bold transition hover:border-black/35"
        >
          Reset layout
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            onReset();
          }}
          className="col-span-2 rounded-md bg-[#cfc4b8] px-3 py-3 text-sm font-bold transition hover:bg-[#c4b8ab]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

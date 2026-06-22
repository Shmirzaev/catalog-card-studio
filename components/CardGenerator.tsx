"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardCanvas, type CardCanvasHandle } from "@/components/CardCanvas";
import { ProductForm } from "@/components/ProductForm";
import { parseSizes } from "@/src/lib/parseSizes";

export type ProductCardData = {
  productName: string;
  fabric: string;
  model: string;
  code: string;
  sizesInput: string;
  mainImageSrc?: string;
  mainImageName?: string;
  zoomImageSrc?: string;
  zoomImageName?: string;
};

export type DetailSizes = {
  logo: number;
  logoPremium: number;
  productName: number;
  fabric: number;
  modelLabel: number;
  modelValue: number;
  codeLabel: number;
  codeValue: number;
  sizeNumber: number;
  zoomCircle: number;
};

const initialData: ProductCardData = {
  productName: "Suprem",
  fabric: "100% COTTON",
  model: "TJ-2000",
  code: "V-4558",
  sizesInput: "46-56"
};

export const initialDetailSizes: DetailSizes = {
  logo: 330,
  logoPremium: 28,
  productName: 42,
  fabric: 22,
  modelLabel: 24,
  modelValue: 48,
  codeLabel: 24,
  codeValue: 48,
  sizeNumber: 34,
  zoomCircle: 190
};

const detailSizesStorageKey = "milana-card-generator-detail-sizes";

function loadSavedDetailSizes(): DetailSizes | null {
  try {
    const saved = window.localStorage.getItem(detailSizesStorageKey);
    if (!saved) return null;
    const parsed = { ...initialDetailSizes, ...JSON.parse(saved) } as DetailSizes;
    if (parsed.logo < 100) {
      parsed.logo = initialDetailSizes.logo;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function CardGenerator() {
  const canvasRef = useRef<CardCanvasHandle>(null);
  const [data, setData] = useState<ProductCardData>(initialData);
  const [detailSizes, setDetailSizes] = useState<DetailSizes>(initialDetailSizes);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editLayout, setEditLayout] = useState(false);
  const [layoutResetKey, setLayoutResetKey] = useState(0);
  const [hasLoadedSavedSizes, setHasLoadedSavedSizes] = useState(false);

  const parsedSizes = useMemo(() => parseSizes(data.sizesInput), [data.sizesInput]);

  useEffect(() => {
    const savedSizes = loadSavedDetailSizes();
    if (savedSizes) {
      setDetailSizes(savedSizes);
    }
    setHasLoadedSavedSizes(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedSizes) return;

    try {
      window.localStorage.setItem(detailSizesStorageKey, JSON.stringify(detailSizes));
    } catch {
      // Ignore storage failures; the current session still updates normally.
    }
  }, [detailSizes, hasLoadedSavedSizes]);

  return (
    <main className="min-h-screen bg-[#eee7df] px-4 py-5 text-[#171411] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 xl:grid xl:grid-cols-[440px_minmax(0,1fr)]">
        <section className="rounded-lg border border-black/10 bg-white/78 p-4 shadow-soft backdrop-blur md:p-5">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/50">
              Milana Premium
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal">Milana Card Generator</h1>
          </div>

          <ProductForm
            data={data}
            detailSizes={detailSizes}
            parsedSizes={parsedSizes}
            onChange={setData}
            onDetailSizesChange={setDetailSizes}
            onRefresh={() => setRefreshKey((key) => key + 1)}
            onDownloadPNG={() => canvasRef.current?.downloadPNG()}
            onDownloadJPG={() => canvasRef.current?.downloadJPG()}
            editLayout={editLayout}
            onToggleEditLayout={() => setEditLayout((value) => !value)}
            onResetLayout={() => setLayoutResetKey((key) => key + 1)}
            onReset={() => {
              setData(initialData);
              setDetailSizes(initialDetailSizes);
              try {
                window.localStorage.removeItem(detailSizesStorageKey);
              } catch {
                // Ignore storage failures.
              }
              setEditLayout(false);
              setLayoutResetKey((key) => key + 1);
              setRefreshKey((key) => key + 1);
            }}
          />
        </section>

        <section className="min-w-0 rounded-lg border border-black/10 bg-[#d9d0c7] p-3 shadow-soft md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Live Preview</h2>
              <p className="text-sm text-black/60">
                {editLayout ? "Drag details to move them." : "Export stays 1472 x 2048 px."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditLayout((value) => !value)}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                editLayout
                  ? "bg-[#171411] text-white"
                  : "border border-black/15 bg-white text-[#171411] hover:border-black/35"
              }`}
            >
              {editLayout ? "Lock Layout" : "Move Details"}
            </button>
          </div>
          <CardCanvas
            ref={canvasRef}
            data={data}
            detailSizes={detailSizes}
            parsedSizes={parsedSizes}
            refreshKey={refreshKey}
            editLayout={editLayout}
            layoutResetKey={layoutResetKey}
          />
        </section>
      </div>
    </main>
  );
}

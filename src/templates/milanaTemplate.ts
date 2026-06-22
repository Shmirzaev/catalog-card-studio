export const milanaTemplate = {
  canvas: {
    width: 1472,
    height: 2048
  },
  background: {
    color: "#aaa095",
    outerColor: "#ffffff",
    margin: 26,
    radius: 36
  },
  logo: {
    x: 50,
    y: 45,
    width: 330,
    fallbackFontSize: 38,
    fallbackLetterSpacing: 180
  },
  productNameBox: {
    x: 60,
    y: 270,
    width: 310,
    height: 110,
    radius: 24,
    color: "rgba(244, 240, 235, 0.72)",
    fabricBandColor: "rgba(244, 240, 235, 0.45)"
  },
  productName: {
    x: 215,
    y: 300,
    fontSize: 42,
    fontWeight: "bold",
    color: "#0e0d0c"
  },
  fabric: {
    x: 215,
    y: 350,
    fontSize: 22,
    fontWeight: "bold",
    color: "#0e0d0c"
  },
  mainImage: {
    x: 26,
    y: 26,
    width: 1420,
    height: 1996,
    fit: "cover",
    clipToCard: true
  },
  model: {
    labelX: 128,
    labelY: 855,
    valueX: 128,
    valueY: 895,
    labelFontSize: 24,
    valueFontSize: 48
  },
  code: {
    labelX: 128,
    labelY: 995,
    valueX: 128,
    valueY: 1035,
    labelFontSize: 24,
    valueFontSize: 48
  },
  bracket: {
    color: "#101010",
    strokeWidth: 4,
    modelX: 112,
    modelY: 875,
    modelWidth: 245,
    modelHeight: 95
  },
  sizePanel: {
    x: 85,
    y: 1160,
    width: 220,
    height: 650,
    radius: 30,
    color: "rgba(244, 240, 235, 0.72)"
  },
  sizes: {
    startX: 150,
    startY: 1240,
    gapY: 78,
    fontSize: 34,
    minFontSize: 22,
    boxSize: 78,
    boxStrokeWidth: 3
  },
  zoomCircle: {
    x: 1190,
    y: 1660,
    diameter: 190,
    borderColor: "#ffffff",
    borderWidth: 8,
    lineColor: "#ffffff",
    lineWidth: 3,
    pointerStartX: 1090,
    pointerStartY: 1635
  }
} as const;

export type MilanaTemplate = typeof milanaTemplate;

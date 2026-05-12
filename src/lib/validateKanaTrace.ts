/**
 * Heuristic validation: ink must cover a large fraction of the template and
 * its outline, stay mostly on the glyph, and include enough ink vs template
 * size (rejects a single short stroke on multi-stroke kana like ん).
 */

const ALPHA_INK = 28;
const DILATE_RADIUS = 12;
/** Most ink pixels must fall on dilated template */
const MIN_INK_ON_TEMPLATE_RATIO = 0.72;
const MAX_INK_OUTSIDE_DILATED_RATIO = 0.3;
/** Sampled template body: fraction that must have ink within NEAR_RADIUS */
const MIN_BODY_COVERAGE = 0.42;
/** Outline samples: stricter — partial strokes miss loops / second strokes */
const MIN_EDGE_COVERAGE = 0.52;
const SAMPLE_STEP_BODY = 3;
const SAMPLE_STEP_EDGE = 2;
const NEAR_RADIUS = 9;
const MAX_INK_BBOX_AREA_VS_TEMPLATE = 2.9;
/** Total ink pixels vs template foreground mass (thin full trace passes; one line fails) */
const MIN_INK_TO_TEMPLATE_MASS = 0.15;

function renderTemplateImage(char: string, width: number, height: number): ImageData {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = Math.floor(height * 0.72);
  ctx.font = `${fontSize}px "Noto Sans JP", system-ui, sans-serif`;
  ctx.fillText(char, width / 2, height / 2);
  return ctx.getImageData(0, 0, width, height);
}

function toTemplateMask(data: ImageData, width: number, height: number): Uint8Array {
  const m = new Uint8Array(width * height);
  const d = data.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = d[i]!;
      const g = d[i + 1]!;
      const b = d[i + 2]!;
      const a = d[i + 3]!;
      const br = (r + g + b) / 3;
      if (a > 25 && br < 248) m[y * width + x] = 1;
    }
  }
  return m;
}

/** Pixels on the boundary of the glyph (helps reject strokes that only cover one segment). */
function outlineEdgeMask(
  template: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const edge = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!template[i]) continue;
      let border = false;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || xx >= width || yy < 0 || yy >= height || !template[yy * width + xx]) {
          border = true;
          break;
        }
      }
      if (border) edge[i] = 1;
    }
  }
  return edge;
}

function dilateMask(
  src: Uint8Array,
  width: number,
  height: number,
  r: number,
): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let dy = -r; dy <= r && !v; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          if (src[yy * width + xx]) {
            v = 1;
            break;
          }
        }
      }
      out[y * width + x] = v;
    }
  }
  return out;
}

function bboxFromMask(
  mask: Uint8Array,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number; count: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      count++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (count === 0) return null;
  return { minX, minY, maxX, maxY, count };
}

function bboxFromInk(
  inkData: ImageData,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number; inkTotal: number } | null {
  const d = inkData.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let inkTotal = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = d[(y * width + x) * 4 + 3]!;
      if (a < ALPHA_INK) continue;
      inkTotal++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (inkTotal === 0) return null;
  return { minX, minY, maxX, maxY, inkTotal };
}

function coverageOfMask(
  requirement: Uint8Array,
  inkData: ImageData,
  width: number,
  height: number,
  step: number,
  nearRadius: number,
): { hit: number; total: number } {
  const d = inkData.data;
  let total = 0;
  let hit = 0;

  const nearInk = (tx: number, ty: number): boolean => {
    const R = nearRadius;
    const x0 = Math.max(0, tx - R);
    const x1 = Math.min(width - 1, tx + R);
    const y0 = Math.max(0, ty - R);
    const y1 = Math.min(height - 1, ty + R);
    for (let yy = y0; yy <= y1; yy += 2) {
      for (let xx = x0; xx <= x1; xx += 2) {
        if (d[(yy * width + xx) * 4 + 3]! >= ALPHA_INK) return true;
      }
    }
    return false;
  };

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (!requirement[y * width + x]) continue;
      total++;
      if (nearInk(x, y)) hit++;
    }
  }
  return { hit, total };
}

export function validateKanaTrace(inkCanvas: HTMLCanvasElement, char: string): boolean {
  const w = inkCanvas.width;
  const h = inkCanvas.height;
  if (!char || w < 16 || h < 16) return false;

  const inkCtx = inkCanvas.getContext("2d");
  if (!inkCtx) return false;
  const inkData = inkCtx.getImageData(0, 0, w, h);

  const inkBox = bboxFromInk(inkData, w, h);
  if (!inkBox) return false;

  const tmplImg = renderTemplateImage(char, w, h);
  const template = toTemplateMask(tmplImg, w, h);
  const dilated = dilateMask(template, w, h, DILATE_RADIUS);
  const edge = outlineEdgeMask(template, w, h);

  const tmplBox = bboxFromMask(template, w, h);
  if (!tmplBox) return false;

  const minInkByMass = Math.floor(tmplBox.count * MIN_INK_TO_TEMPLATE_MASS);
  const minInkAdaptive = Math.max(
    160,
    Math.min(520, Math.floor(tmplBox.count * 0.17)),
  );
  const minInk = Math.max(minInkByMass, minInkAdaptive);
  if (inkBox.inkTotal < minInk) return false;

  let onTemplate = 0;
  let outside = 0;
  const d = inkData.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3]! < ALPHA_INK) continue;
      if (dilated[y * w + x]) onTemplate++;
      else outside++;
    }
  }
  const totalInk = onTemplate + outside;
  if (totalInk < minInk) return false;

  const onRatio = onTemplate / totalInk;
  const outRatio = outside / totalInk;
  if (onRatio < MIN_INK_ON_TEMPLATE_RATIO) return false;
  if (outRatio > MAX_INK_OUTSIDE_DILATED_RATIO) return false;

  const inkArea =
    (inkBox.maxX - inkBox.minX + 1) * (inkBox.maxY - inkBox.minY + 1);
  const tmplArea =
    (tmplBox.maxX - tmplBox.minX + 1) * (tmplBox.maxY - tmplBox.minY + 1);
  if (tmplArea > 0 && inkArea > tmplArea * MAX_INK_BBOX_AREA_VS_TEMPLATE) {
    return false;
  }

  const body = coverageOfMask(template, inkData, w, h, SAMPLE_STEP_BODY, NEAR_RADIUS);
  if (body.total === 0) return false;
  if (body.hit / body.total < MIN_BODY_COVERAGE) return false;

  const edgeCov = coverageOfMask(edge, inkData, w, h, SAMPLE_STEP_EDGE, NEAR_RADIUS);
  if (edgeCov.total === 0) {
    if (tmplBox.count > 80) return false;
  } else if (edgeCov.hit / edgeCov.total < MIN_EDGE_COVERAGE) {
    return false;
  }

  return true;
}

// T05 무지티 영역만 골라 선호 색으로 바꾸는 핵심 로직.
// ------------------------------------------------------------
// 원본 이미지에는 옷 영역을 나타내는 별도 레이어/알파 마스크가 없다. 대신 이
// 그림체가 각 옷을 진한 잉크 외곽선으로 두르고 있는 점을 이용해,
// "인접 픽셀끼리 색이 비슷하면 계속 번지고 외곽선(색이 확 바뀌는 경계)을
// 만나면 멈추는" flood fill로 무지티 영역만 골라낸다.
//
// 무지티는 거의 흰색(채도가 낮고 명도가 매우 높음)이라 CSS hue-rotate로는
// 색이 보이지 않는다(채도가 0에 가까우면 회전할 색상 자체가 없음). 그래서
// 무지티 영역의 명도(L)를 새 범위로 재매핑하면서 목표 색상의 Hue·채도를
// 주입하는 방식을 쓴다. 이 과정에서 원본의 주름·하이라이트·그림자 명암은
// 순서/대비가 그대로 유지된다.
//
// 원본이 WebP이므로 디코딩·인코딩은 sharp에 맡기고, 이 모듈은 순수 픽셀
// 버퍼({data, width, height}, RGBA)만 다룬다.
import sharp from 'sharp';
import { PNG } from 'pngjs';
import fs from 'node:fs';

// 배포용 원본(WebP 등)을 RGBA 원시 픽셀 버퍼로 읽는다.
export async function readImage(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

function floodFrom(img, sx, sy, threshold, visited) {
  const { width, height, data } = img;
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return null;
  const startIdx = (sy * width + sx) << 2;
  if (data[startIdx + 3] < 10) return null;
  if (visited[sy * width + sx]) return null;

  const rgbAt = (x, y) => { const i = (width * y + x) << 2; return [data[i], data[i + 1], data[i + 2]]; };
  const dist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

  const stack = [[sx, sy]];
  visited[sy * width + sx] = 1;
  const indices = [];
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let touchesBorder = false;

  while (stack.length) {
    const [x, y] = stack.pop();
    indices.push(y * width + x);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    const cur = rgbAt(x, y);
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const vi = ny * width + nx;
      if (visited[vi]) continue;
      const i = vi << 2;
      if (data[i + 3] < 10) continue;
      if (dist(cur, rgbAt(nx, ny)) < threshold) {
        visited[vi] = 1;
        stack.push([nx, ny]);
      }
    }
  }
  return { indices, count: indices.length, bbox: [minX, minY, maxX, maxY], touchesBorder };
}

const isNearWhite = (r, g, b) => r > 220 && g > 220 && b > 220 && Math.max(r, g, b) - Math.min(r, g, b) < 22;

// candidates: 비율 좌표 [[x,y],...] 그리드. manualSeeds가 있으면 그 좌표(절대 픽셀)만 사용.
// 배경 전체를 채우는 거대한 블롭이나 테두리에 닿는 블롭은 자동으로 걸러진다.
export function buildMask(img, { candidates, threshold, minBlobSize = 2500, manualSeeds = null }) {
  const { width, height, data } = img;
  const visited = new Uint8Array(width * height);
  const blobs = [];
  // manualSeeds도 candidates와 같은 비율 좌표(0~1)로 받는다 — 해상도가 바뀌어도
  // (리사이즈 설정을 바꾸는 등) 그대로 쓸 수 있게 하기 위함.
  const ratioSeeds = manualSeeds ?? candidates;
  const seedsToTry = ratioSeeds.map(([rx, ry]) => [Math.round(rx * width), Math.round(ry * height)]);

  for (const [x, y] of seedsToTry) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    if (visited[y * width + x]) continue;
    const i = (y * width + x) << 2;
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 10) continue;
    if (!manualSeeds && !isNearWhite(r, g, b)) continue;
    const blob = floodFrom(img, x, y, threshold, visited);
    if (!blob) continue;
    if (blob.count < minBlobSize) continue;
    blobs.push({ seed: [x, y], ...blob });
  }
  return blobs;
}

export function unionMaskIndices(blobs) {
  const set = new Set();
  for (const b of blobs) {
    if (b.touchesBorder) continue; // 배경까지 새어나간 블롭은 제외
    for (const idx of b.indices) set.add(idx);
  }
  return set;
}

// 디버그 전용(로컬 확인용): 마스크 영역을 마젠타로 칠한 PNG를 만든다.
export function writeMaskDebugPng(img, indices, outPath) {
  const out = new PNG({ width: img.width, height: img.height });
  Buffer.from(img.data).copy(out.data);
  for (const vi of indices) {
    const i = vi << 2;
    out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255;
  }
  fs.writeFileSync(outPath, PNG.sync.write(out));
}

// 마스크 픽셀만 목표 색으로 재색상. 밝기(L)는 관측된 범위를 [lShadow,lHighlight]로
// 재매핑해 원본이 거의 흰색이라 채도가 없던 문제를 해결하면서 음영 대비는 유지한다.
// 반환값은 순수 픽셀 버퍼({data,width,height}) — 인코딩은 호출 쪽(sharp)에 맡긴다.
export function recolorMask(img, indices, hex, { lShadow = 0.30, lHighlight = 0.80 } = {}) {
  const { data, width, height } = img;
  const hr = parseInt(hex.slice(1, 3), 16), hg = parseInt(hex.slice(3, 5), 16), hb = parseInt(hex.slice(5, 7), 16);
  const [targetH, targetS] = rgbToHsl(hr, hg, hb);
  let lMin = 1, lMax = 0;
  for (const vi of indices) {
    const i = vi << 2;
    const [, , l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (l < lMin) lMin = l;
    if (l > lMax) lMax = l;
  }
  const outData = Buffer.from(data);
  for (const vi of indices) {
    const i = vi << 2;
    const [, , l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const t = lMax > lMin ? (l - lMin) / (lMax - lMin) : 0.5;
    const newL = lShadow + t * (lHighlight - lShadow);
    const [nr, ng, nb] = hslToRgb(targetH, targetS, newL);
    outData[i] = Math.round(nr);
    outData[i + 1] = Math.round(ng);
    outData[i + 2] = Math.round(nb);
  }
  return { data: outData, width, height };
}

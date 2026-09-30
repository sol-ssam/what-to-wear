// T05 무지티 부분만 선호 색으로 바꾼 색상 버전을 생성한다.
// 실행 시점: sync-assets 다음(항상 public/assets를 먼저 최신 원본으로 채운 뒤 실행).
// 입력: public/assets/outfits/*.webp, public/assets/items/T05_{B,G}.webp (둘 다 sync-assets가 만든 것,
//       이미 실제 표시 크기에 맞춰 리사이즈된 상태 — 여기서 다시 리사이즈하지 않는다)
// 출력: 같은 폴더에 "<원본이름>_<colorId>.webp" 파일로 추가 저장(원본은 절대 덮어쓰지 않음).
//
// 캐시: mtime이 아니라 "원본 내용 + 팔레트 색 + 시작점/임계값 + 재색상 알고리즘
// 설정 + 출력 인코딩 설정 + 파이프라인 버전"을 합친 해시로 판단한다
// (scripts/.tee-color-cache.json). 이 중 하나라도 바뀌면 자동으로 다시 생성되고,
// 같은 파일명으로 원본을 바꿔치기해도(내용이 다르면 해시가 달라지므로) 안전하다.
//
// 정리: 이번 실행에서 나오지 않은 이전 색상 버전(예: 예전 .png 산출물, 삭제된
// 대상의 옛 결과)은 지운다.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { readImage, buildMask, unionMaskIndices, recolorMask, writeMaskDebugPng } from './tee-recolor-core.mjs';
import {
  OUTFIT_TARGETS,
  DECLUTTER_TARGETS,
  NO_OUTER_TARGETS,
  ITEM_TARGETS,
  DEFAULT_CANDIDATES,
  ITEM_CANDIDATES,
  DEFAULT_THRESHOLD,
  MIN_BLOB_SIZE,
  OVERRIDES,
} from './tee-recolor-targets.mjs';
import { FAVORITE_COLORS } from '../src/data/colorPalette.js';
import { loadManifest, saveManifest, computeHash } from './asset-cache.mjs';

const PIPELINE_VERSION = 'tee-v2-webp'; // 알고리즘/출력 형식을 바꿀 때마다 올려서 전체 재생성을 강제할 수 있다.
const WEBP_QUALITY = 85;
const RECOLOR_SETTINGS = { lShadow: 0.3, lHighlight: 0.8 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outfitsDir = path.join(projectRoot, 'public', 'assets', 'outfits');
const itemsDir = path.join(projectRoot, 'public', 'assets', 'items');
const manifestPath = path.join(__dirname, '.tee-color-cache.json');

const FORCE = process.argv.includes('--force');
const DEBUG_MASKS = process.argv.includes('--debug-masks');
const debugDir = path.join(projectRoot, 'scripts', '.tee-mask-debug');
if (DEBUG_MASKS) fs.mkdirSync(debugDir, { recursive: true });

const manifest = loadManifest(manifestPath);
const nextManifest = {};

let generatedCount = 0;
let skippedCount = 0;
let generatedBytes = 0;
let originalBytesForGenerated = 0;
const failures = [];
const warnings = [];
const expectedRel = new Set(); // dir/파일명 (정리 단계에서 "지금도 필요한 파일" 판단용)

async function processFile(dir, target, candidates) {
  const srcPath = path.join(dir, target.file);
  if (!fs.existsSync(srcPath)) {
    failures.push(`SOURCE MISSING: ${target.file}`);
    return;
  }
  const srcBuf = fs.readFileSync(srcPath);
  const override = OVERRIDES[target.file] ?? {};
  const threshold = override.threshold ?? DEFAULT_THRESHOLD;
  const useCandidates = override.candidates ?? candidates;
  const manualSeeds = override.manualSeeds ?? null;
  const maskSettings = { threshold, useCandidates, manualSeeds, MIN_BLOB_SIZE, PIPELINE_VERSION };

  // 이번 실행에서 만들 5색 전부가 캐시로 이미 최신 상태인지 먼저 확인한다
  // (전부 최신이면 마스크 계산(flood fill)까지 건너뛸 수 있어 훨씬 빠르다).
  const colorChecks = FAVORITE_COLORS.map((c) => {
    const outName = `${target.outBase}_${c.id}.webp`;
    const outRel = path.posix.join(path.basename(dir), outName);
    const hash = computeHash(srcBuf, maskSettings, RECOLOR_SETTINGS, c.swatch, WEBP_QUALITY);
    expectedRel.add(outRel);
    return { color: c, outName, outRel, hash, outPath: path.join(dir, outName) };
  });

  const allCached = colorChecks.every((cc) => manifest[cc.outRel] === cc.hash && fs.existsSync(cc.outPath));
  if (allCached && !FORCE) {
    for (const cc of colorChecks) nextManifest[cc.outRel] = cc.hash;
    skippedCount += colorChecks.length;
    return;
  }

  const img = await readImage(srcPath);
  const blobs = buildMask(img, { candidates: useCandidates, threshold, minBlobSize: MIN_BLOB_SIZE, manualSeeds });
  const idxSet = unionMaskIndices(blobs);

  if (idxSet.size < MIN_BLOB_SIZE) {
    failures.push(`MASK EMPTY/TOO SMALL: ${target.file} (mask=${idxSet.size}px) — 이 파일은 생성을 건너뛰고 실패로 보고합니다.`);
    return;
  }
  const coveragePct = (100 * idxSet.size) / (img.width * img.height);
  if (coveragePct < 0.8) {
    warnings.push(`LOW COVERAGE: ${target.file} coverage=${coveragePct.toFixed(2)}% — 육안 확인 권장`);
  }
  if (DEBUG_MASKS) {
    writeMaskDebugPng(img, idxSet, path.join(debugDir, target.file.replace(/\.webp$/, '_mask.png')));
  }

  const srcBytes = srcBuf.length;
  for (const cc of colorChecks) {
    if (!FORCE && manifest[cc.outRel] === cc.hash && fs.existsSync(cc.outPath)) {
      nextManifest[cc.outRel] = cc.hash;
      skippedCount++;
      continue;
    }
    const recolored = recolorMask(img, idxSet, cc.color.swatch, RECOLOR_SETTINGS);
    const buf = await sharp(recolored.data, { raw: { width: recolored.width, height: recolored.height, channels: 4 } })
      .webp({ quality: WEBP_QUALITY, effort: 5 })
      .toBuffer();
    fs.writeFileSync(cc.outPath, buf);
    nextManifest[cc.outRel] = cc.hash;
    generatedCount++;
    generatedBytes += buf.length;
    originalBytesForGenerated += srcBytes;
  }
}

// 이번 실행에서 필요하다고 확인된 색상 파일 목록(expectedRel)에 없는, 이 스크립트가
// 예전에 만들었던 산출물(예전 .png, 지금은 대상이 아닌 파일의 색상본)을 지운다.
function cleanup(dir) {
  if (!fs.existsSync(dir)) return [];
  const colorSuffix = new RegExp(`_(${FAVORITE_COLORS.map((c) => c.id).join('|')})\\.(png|webp)$`, 'i');
  const removed = [];
  for (const file of fs.readdirSync(dir)) {
    if (!colorSuffix.test(file)) continue; // 색상 파일이 아니면(원본 등) 건드리지 않음
    const rel = path.posix.join(path.basename(dir), file);
    if (expectedRel.has(rel)) continue;
    fs.rmSync(path.join(dir, file));
    removed.push(rel);
  }
  return removed;
}

async function run() {
  console.log(`색상 팔레트: ${FAVORITE_COLORS.map((c) => c.id).join(', ')} (${FAVORITE_COLORS.length}색)`);
  const allOutfitTargets = [...OUTFIT_TARGETS, ...DECLUTTER_TARGETS, ...NO_OUTER_TARGETS];
  console.log(`대상 이미지: 완성 코디 ${OUTFIT_TARGETS.length} + 정리 ${DECLUTTER_TARGETS.length} + 겉옷없음 ${NO_OUTER_TARGETS.length} = ${allOutfitTargets.length}장, 아이템 카드 ${ITEM_TARGETS.length}장`);

  for (const target of allOutfitTargets) {
    await processFile(outfitsDir, target, DEFAULT_CANDIDATES);
  }
  for (const target of ITEM_TARGETS) {
    await processFile(itemsDir, target, ITEM_CANDIDATES);
  }

  saveManifest(manifestPath, nextManifest);
  const removed = [...cleanup(outfitsDir), ...cleanup(itemsDir)];

  console.log(`\n생성: ${generatedCount}개 파일, 건너뜀(캐시 최신): ${skippedCount}개`);
  if (removed.length > 0) {
    console.log(`정리: 더 이상 쓰이지 않는 이전 색상본 ${removed.length}개 삭제`);
    removed.forEach((f) => console.log(`  - ${f}`));
  }
  if (generatedCount > 0) {
    console.log(
      `원본 합계 ${(originalBytesForGenerated / 1024 / 1024).toFixed(1)}MB -> 색상본 합계 ${(generatedBytes / 1024 / 1024).toFixed(1)}MB ` +
      `(파일당 평균 ${(generatedBytes / generatedCount / 1024).toFixed(0)}KB)`
    );
  }
  if (warnings.length > 0) {
    console.log(`\n! 육안 확인 권장 (${warnings.length}건):`);
    warnings.forEach((w) => console.log('  - ' + w));
  }
  if (failures.length > 0) {
    console.log(`\n!! 실패 (${failures.length}건) — 숨기지 않고 그대로 보고합니다:`);
    failures.forEach((f) => console.log('  - ' + f));
    process.exitCode = 1;
  }
}

run();

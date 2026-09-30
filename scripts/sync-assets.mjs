// 두 개의 원본 이미지 폴더를 public/assets 아래로 "최적화해서" 복사한다.
//   1) "옷 이미지"        -> public/assets/{characters,main,items}  (선택 카드용 낱개 아이템 그림)
//   2) "코디 결과 이미지"  -> public/assets/outfits                  (완성된 착용 이미지 등)
// 원본 폴더는 절대 건드리지 않는다(읽기 전용). "옷 이미지"는 전각 문자
// 파일명이라 NFKC 정규화로 ASCII 이름을 쓰고, "코디 결과 이미지"는 이미 ASCII라
// 이름만 그대로 두고 확장자만 바꾼다.
//
// 배포용 파일은 실제 화면 표시 크기(휴대전화 고해상도 포함)에 맞춰 리사이즈하고
// WebP로 인코딩한다 — 원본(최대 5~7MB급 PNG)보다 훨씬 작으면서 글자·무늬·윤곽은
// 육안상 구분이 안 될 정도로 유지된다(별도 비교 테스트로 확인, PNG는 리사이즈만
// 해도 원본의 1/8 수준, WebP(q85)는 다시 그 1/8~1/10 수준).
//
// 캐시: mtime이 아니라 "원본 내용 + 리사이즈/포맷 설정 + 파이프라인 버전"의
// 해시로 판단한다 — 원본을 같은 파일명으로 바꿔치기하거나, 이 스크립트의 설정을
// 바꾸면 자동으로 다시 생성된다(scripts/.sync-assets-cache.json에 기록).
//
// 정리: 이 스크립트가 관리하는 파일명 규칙에 해당하면서 이번 실행에서 나오지
// 않은 결과물(예: 예전 .png 산출물, 삭제된 원본의 옛 결과물)은 지운다. 색상
// 버전(outfit_..._pink.webp 등, generate-tee-colors.mjs 관리)이나 관련 없는
// 파일은 건드리지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { loadManifest, saveManifest, computeHash } from './asset-cache.mjs';
import { FAVORITE_COLORS } from '../src/data/colorPalette.js';

const PIPELINE_VERSION = 'sync-v1';
const QUALITY = 85;
// 카테고리별 최대 가로폭. 실제 표시 크기(휴대전화 고해상도 3배 기준)보다
// 넉넉하게 잡았다 — 원본보다 작을 때는 확대하지 않는다(withoutEnlargement).
const MAX_WIDTH = { characters: 450, main: 700, items: 400, outfits: 900 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const targetRoot = path.join(projectRoot, 'public', 'assets');
const manifestPath = path.join(__dirname, '.sync-assets-cache.json');

const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;
const manifest = loadManifest(manifestPath);
const nextManifest = {};

for (const dir of ['characters', 'main', 'items', 'outfits']) {
  fs.mkdirSync(path.join(targetRoot, dir), { recursive: true });
}

async function convert(srcPath, category, outName) {
  const buf = fs.readFileSync(srcPath);
  const outRel = path.posix.join(category, outName);
  const outPath = path.join(targetRoot, category, outName);
  const settings = { PIPELINE_VERSION, quality: QUALITY, maxWidth: MAX_WIDTH[category] };
  const hash = computeHash(buf, settings);

  nextManifest[outRel] = hash;
  if (manifest[outRel] === hash && fs.existsSync(outPath)) {
    return { outRel, bytes: fs.statSync(outPath).size, skipped: true };
  }

  const webpBuf = await sharp(buf)
    .resize({ width: MAX_WIDTH[category], withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toBuffer();
  fs.writeFileSync(outPath, webpBuf);
  return { outRel, bytes: webpBuf.length, skipped: false };
}

// ------------------------------------------------------------------
// 1) 낱개 아이템 이미지 ("옷 이미지" 폴더, 전각 문자 파일명 -> NFKC 정규화 -> .webp)
// ------------------------------------------------------------------
const itemSourceDir = path.join(projectRoot, '옷 이미지');
const CHARACTER_FILES = new Set(['boy.png', 'girl.png']);
const MAIN_FILES = new Set(['Main.png']);

async function syncItems() {
  const itemFiles = fs.readdirSync(itemSourceDir).filter((f) => IMAGE_EXT.test(f));
  const itemManifest = [];
  let skipped = 0;

  for (const original of itemFiles) {
    const normalized = original.normalize('NFKC');
    let category = 'items';
    if (CHARACTER_FILES.has(normalized)) category = 'characters';
    else if (MAIN_FILES.has(normalized)) category = 'main';

    const outName = normalized.replace(/\.png$/i, '.webp');
    const result = await convert(path.join(itemSourceDir, original), category, outName);
    if (result.skipped) skipped++;
    itemManifest.push({ original, outName, category, bytes: result.bytes });
  }

  itemManifest.sort((a, b) => a.outName.localeCompare(b.outName));
  console.log(`[아이템 이미지] 변환 완료: ${itemManifest.length}개 (새로 생성 ${itemManifest.length - skipped}, 캐시 재사용 ${skipped})\n`);
  for (const m of itemManifest) {
    console.log(`  ${m.category.padEnd(11)} ${m.outName.padEnd(16)} <- ${m.original}  (${(m.bytes / 1024).toFixed(0)}KB)`);
  }
  return itemManifest;
}

// ------------------------------------------------------------------
// 2) 완성 코디 + 정리 + 겉옷없음 + 이야기1(상황1~2) 이미지
//    ("코디 결과 이미지" 폴더, 이미 ASCII 이름 -> 확장자만 .webp로 변경)
// ------------------------------------------------------------------
const outfitSourceDir = path.join(projectRoot, '코디 결과 이미지');
const OUTFIT_PATTERN = /^outfit_(\d{2})-([ABC])[-_](boy|girl)\.png$/i;
const DECLUTTER_PATTERN = /^outfit_declutter_([ABC])[-_](S0[12])[-_](boy|girl)\.png$/i;
const NO_OUTER_PATTERN = /^outfit_no_outer_([ABC])[-_]([ABC])[-_](boy|girl)\.png$/i;
const SCENE1_SOLO_PATTERN = /^scene1_(cardigan|padding)_(boy|girl)\.png$/i;
const SCENE1_COMBO_PATTERN = /^scene2_(cardigan|padding|none)_([ABC])_(boy|girl)\.png$/i;

async function syncOutfits() {
  const outfitFiles = fs.existsSync(outfitSourceDir)
    ? fs.readdirSync(outfitSourceDir).filter((f) => IMAGE_EXT.test(f))
    : [];

  const outfitManifest = [];
  const declutterManifest = [];
  const noOuterManifest = [];
  const scene1SoloManifest = [];
  const scene1ComboManifest = [];
  const unmatched = [];
  let skipped = 0;

  for (const original of outfitFiles) {
    const soloMatch = original.match(SCENE1_SOLO_PATTERN);
    const comboMatch = soloMatch ? null : original.match(SCENE1_COMBO_PATTERN);
    const noOuterMatch = soloMatch || comboMatch ? null : original.match(NO_OUTER_PATTERN);
    const declutterMatch = soloMatch || comboMatch || noOuterMatch ? null : original.match(DECLUTTER_PATTERN);
    const outfitMatch =
      soloMatch || comboMatch || noOuterMatch || declutterMatch ? null : original.match(OUTFIT_PATTERN);

    if (!soloMatch && !comboMatch && !noOuterMatch && !declutterMatch && !outfitMatch) {
      unmatched.push(original);
      continue; // 인식 못하는 파일은 최적화 대상에서 제외(복사도 하지 않음)
    }

    const outName = original.replace(/\.png$/i, '.webp');
    const result = await convert(path.join(outfitSourceDir, original), 'outfits', outName);
    if (result.skipped) skipped++;

    if (soloMatch) {
      const [, outfit, gender] = soloMatch;
      scene1SoloManifest.push({ outfit: outfit.toLowerCase(), gender: gender.toLowerCase() });
    } else if (comboMatch) {
      const [, outfit, scene2, gender] = comboMatch;
      scene1ComboManifest.push({ outfit: outfit.toLowerCase(), scene2: scene2.toUpperCase(), gender: gender.toLowerCase() });
    } else if (noOuterMatch) {
      const [, scene3, accessory, gender] = noOuterMatch;
      noOuterManifest.push({ scene3: scene3.toUpperCase(), accessory: accessory.toUpperCase(), gender: gender.toLowerCase() });
    } else if (declutterMatch) {
      const [, scene3, shoeGroup, gender] = declutterMatch;
      declutterManifest.push({ scene3: scene3.toUpperCase(), shoeGroup: shoeGroup.toUpperCase(), gender: gender.toLowerCase() });
    } else if (outfitMatch) {
      const [, code, suffix, gender] = outfitMatch;
      outfitManifest.push({ code, suffix: suffix.toUpperCase(), gender: gender.toLowerCase() });
    }
  }

  console.log(`\n[코디 결과 이미지] 변환 완료: ${outfitFiles.length - unmatched.length}개 (새로 생성 ${outfitFiles.length - unmatched.length - skipped}, 캐시 재사용 ${skipped})`);
  if (unmatched.length > 0) {
    console.log(`  ! 파일명 규칙과 맞지 않아 인식되지 않은 파일 (복사·변환하지 않음):`);
    unmatched.forEach((f) => console.log(`    - ${f}`));
  }

  return { outfitManifest, declutterManifest, noOuterManifest, scene1SoloManifest, scene1ComboManifest };
}

// ------------------------------------------------------------------
// 정리: 이 스크립트가 관리하는 파일명 규칙에 해당하지만 이번에 만들지 않은
// 결과물(예전 .png, 삭제된 원본의 옛 결과)은 지운다. 색상 버전(_blue.webp 등)과
// 관련 없는 파일은 건드리지 않는다.
// ------------------------------------------------------------------
const OWN_OUTFIT_BASE_PATTERN =
  /^(outfit_\d{2}-[ABC]|outfit_declutter_[ABC]_S0[12]|outfit_no_outer_[ABC]_[ABC]|scene1_(cardigan|padding)|scene2_(cardigan|padding|none)_[ABC])_(boy|girl)\.(png|webp)$/i;
const OWN_ITEM_BASE_PATTERN = /^([A-Za-z]\d{2}(_[BG])?|boy|girl|Main)\.(png|webp)$/;
const COLOR_SUFFIX_PATTERN = new RegExp(`_(${FAVORITE_COLORS.map((c) => c.id).join('|')})\\.(png|webp)$`, 'i');

function cleanupDir(dir, ownPattern, expectedRelNames) {
  if (!fs.existsSync(dir)) return [];
  const removed = [];
  for (const file of fs.readdirSync(dir)) {
    if (COLOR_SUFFIX_PATTERN.test(file)) continue; // generate-tee-colors.mjs 소관
    if (!ownPattern.test(file)) continue; // 이 스크립트가 모르는 파일은 건드리지 않음
    const rel = path.posix.join(path.basename(dir), file);
    if (expectedRelNames.has(rel)) continue;
    fs.rmSync(path.join(dir, file));
    removed.push(rel);
  }
  return removed;
}

async function run() {
  const itemManifest = await syncItems();
  const { outfitManifest, declutterManifest, noOuterManifest, scene1SoloManifest, scene1ComboManifest } =
    await syncOutfits();

  saveManifest(manifestPath, nextManifest);

  const expectedItemRel = new Set(itemManifest.map((m) => path.posix.join(m.category, m.outName)));
  const removedItems = [
    ...cleanupDir(path.join(targetRoot, 'items'), OWN_ITEM_BASE_PATTERN, expectedItemRel),
    ...cleanupDir(path.join(targetRoot, 'characters'), OWN_ITEM_BASE_PATTERN, expectedItemRel),
    ...cleanupDir(path.join(targetRoot, 'main'), OWN_ITEM_BASE_PATTERN, expectedItemRel),
  ];
  const expectedOutfitRel = new Set(Object.keys(nextManifest).filter((k) => k.startsWith('outfits/')));
  const removedOutfits = cleanupDir(path.join(targetRoot, 'outfits'), OWN_OUTFIT_BASE_PATTERN, expectedOutfitRel);

  if (removedItems.length + removedOutfits.length > 0) {
    console.log(`\n[정리] 더 이상 쓰이지 않는 배포용 파일 ${removedItems.length + removedOutfits.length}개 삭제:`);
    [...removedItems, ...removedOutfits].forEach((f) => console.log(`    - ${f}`));
  }

  // 27개 코드(01~09 x A/B/C) x 남/여 = 54장이 모두 있는지 검증
  const CODES = Array.from({ length: 9 }, (_, i) => String(i + 1).padStart(2, '0'));
  const SUFFIXES = ['A', 'B', 'C'];
  const GENDERS = ['boy', 'girl'];
  const missing = [];
  for (const code of CODES) for (const suffix of SUFFIXES) for (const gender of GENDERS) {
    if (!outfitManifest.some((m) => m.code === code && m.suffix === suffix && m.gender === gender)) {
      missing.push(`${code}-${suffix} (${gender})`);
    }
  }
  console.log(missing.length === 0 ? `  ✓ 완성 코디: 27개 코드 x 남/여 = 54장 전부 확인됨` : `  ! 누락된 완성 코디 이미지 ${missing.length}개: ${missing.join(', ')}`);

  const SHOE_GROUPS = ['S01', 'S02'];
  const missingDeclutter = [];
  for (const scene3 of SUFFIXES) for (const shoeGroup of SHOE_GROUPS) for (const gender of GENDERS) {
    if (!declutterManifest.some((m) => m.scene3 === scene3 && m.shoeGroup === shoeGroup && m.gender === gender)) {
      missingDeclutter.push(`declutter_${scene3}_${shoeGroup} (${gender})`);
    }
  }
  console.log(missingDeclutter.length === 0 ? `  ✓ 정리 후 이미지: 상황3 3종 x 신발 2종 x 남/여 = 12장 전부 확인됨` : `  ! 누락된 정리 후 이미지: ${missingDeclutter.join(', ')}`);

  const missingNoOuter = [];
  for (const scene3 of SUFFIXES) for (const accessory of SUFFIXES) for (const gender of GENDERS) {
    if (!noOuterManifest.some((m) => m.scene3 === scene3 && m.accessory === accessory && m.gender === gender)) {
      missingNoOuter.push(`no_outer_${scene3}_${accessory} (${gender})`);
    }
  }
  console.log(missingNoOuter.length === 0 ? `  ✓ 겉옷 없는 이미지: 상황3 3종 x 신발·가방 3종 x 남/여 = 18장 전부 확인됨` : `  ! 누락된 겉옷 없는 이미지: ${missingNoOuter.join(', ')}`);

  const SOLO_OUTFITS = ['cardigan', 'padding'];
  const missingSolo = [];
  for (const outfit of SOLO_OUTFITS) for (const gender of GENDERS) {
    if (!scene1SoloManifest.some((m) => m.outfit === outfit && m.gender === gender)) missingSolo.push(`scene1_${outfit} (${gender})`);
  }
  console.log(missingSolo.length === 0 ? `  ✓ 이야기1 상황1 단독 이미지: 가디건·패딩 x 남/여 = 4장 전부 확인됨` : `  ! 누락된 이야기1 상황1 이미지: ${missingSolo.join(', ')}`);

  const COMBO_OUTFITS = ['cardigan', 'padding', 'none'];
  const missingCombo = [];
  for (const outfit of COMBO_OUTFITS) for (const scene2 of SUFFIXES) for (const gender of GENDERS) {
    if (!scene1ComboManifest.some((m) => m.outfit === outfit && m.scene2 === scene2 && m.gender === gender)) {
      missingCombo.push(`scene2_${outfit}_${scene2} (${gender})`);
    }
  }
  console.log(missingCombo.length === 0 ? `  ✓ 이야기1 상황2 조합 이미지: 겉옷 3종 x 상황2 3종 x 남/여 = 18장 전부 확인됨` : `  ! 누락된 이야기1 상황2 이미지: ${missingCombo.join(', ')}`);

  if (missing.length + missingDeclutter.length + missingNoOuter.length + missingSolo.length + missingCombo.length > 0) {
    process.exitCode = 1;
  }
}

run();

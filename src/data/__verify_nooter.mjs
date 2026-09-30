import fs from 'node:fs';
import path from 'node:path';
import { getDisplayOutfit } from './outfitCode.js';
import { getDisplayImageSrc } from './assetMap.js';
import { FAVORITE_COLORS } from './colorPalette.js';

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`);
  if (!cond) failures++;
}

// 1) scene3+scene3Accessories만 있고 scene4 없음 -> no_outer, scene2(이야기1)는 무시
const withScene2A = getDisplayOutfit({ scene2: 'A', scene3: 'B', scene3Accessories: 'C' });
const withScene2B = getDisplayOutfit({ scene2: 'B', scene3: 'B', scene3Accessories: 'C' });
check('kind=no_outer', withScene2A.kind === 'no_outer' && withScene2A.id === 'B_C');
check('scene2(이야기1) 값 무관하게 동일', JSON.stringify(withScene2A) === JSON.stringify(withScene2B));

// 2) row A는 색상 무시(그래픽 티셔츠), row B/C는 색상 적용
for (const color of FAVORITE_COLORS) {
  const specA = getDisplayOutfit({ scene3: 'A', scene3Accessories: 'B' });
  const srcA = getDisplayImageSrc(specA, 'boy', color.id);
  check(`row A(${color.id}) 색상 미적용`, srcA === '/assets/outfits/outfit_no_outer_A_B_boy.webp');

  const specB = getDisplayOutfit({ scene3: 'B', scene3Accessories: 'A' });
  const srcB = getDisplayImageSrc(specB, 'girl', color.id);
  check(`row B(${color.id}) 색상 적용`, srcB === `/assets/outfits/outfit_no_outer_B_A_girl_${color.id}.webp`);

  const specC = getDisplayOutfit({ scene3: 'C', scene3Accessories: 'C' });
  const srcC = getDisplayImageSrc(specC, 'boy', color.id);
  check(`row C(${color.id}) 색상 적용`, srcC === `/assets/outfits/outfit_no_outer_C_C_boy_${color.id}.webp`);
}

// 3) scene4 확정되면 no_outer가 아니라 완성 코디로 바뀜
const afterScene4 = getDisplayOutfit({ scene3: 'B', scene3Accessories: 'C', scene4: 'A' });
check('상황4 확정 후 kind=outfit', afterScene4.kind === 'outfit' && afterScene4.id === '04-C');

// 4) declutter/키링제거는 여전히 우선 적용됨(no_outer로 새지 않음)
const declutter = getDisplayOutfit({ scene3: 'B', scene3Accessories: 'C', scene4: 'A', scene5: 'B' });
check('상황5=B는 declutter 유지', declutter.kind === 'declutter');
const keyringRemoved = getDisplayOutfit({ scene3: 'C', scene3Accessories: 'C', scene4: 'B', scene5: 'C' });
check('상황5=C+scene3Accessories=C는 -A 재사용 유지', keyringRemoved.kind === 'outfit' && keyringRemoved.id === '09-A');

// 5) 18장 전부 실제 파일로 존재(무색 9 + 색상 9x5=45, 총 54개 조합 검사)
const PUBLIC = path.resolve('public');
let missing = [];
const CH = ['A', 'B', 'C'];
for (const scene3 of CH) for (const scene3Accessories of CH) for (const gender of ['boy', 'girl']) {
  const spec = getDisplayOutfit({ scene3, scene3Accessories });
  const base = getDisplayImageSrc(spec, gender);
  if (!fs.existsSync(path.join(PUBLIC, base))) missing.push(base);
  if (scene3 !== 'A') {
    for (const c of FAVORITE_COLORS) {
      const colored = getDisplayImageSrc(spec, gender, c.id);
      if (!fs.existsSync(path.join(PUBLIC, colored))) missing.push(colored);
    }
  }
}
check(`겉옷없음 18장(+색상) 전부 파일 존재 (검사 ${9 * 2 + 6 * 2 * 5}개)`, missing.length === 0);
if (missing.length) missing.forEach((m) => console.log('  누락:', m));

console.log(failures === 0 ? '\n=== ALL PASS ===' : `\n=== ${failures} FAILURES ===`);
if (failures > 0) process.exit(1);

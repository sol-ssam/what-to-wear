// 이미지 경로를 한 곳에 모아 관리한다.
// 실제 파일(옷 이미지 폴더, 전각 문자 파일명 / 코디 결과 이미지 폴더)은
// scripts/sync-assets.mjs가 public/assets 아래로 리사이즈 + WebP 변환해서 둔다.
// 원본 이미지를 교체했다면 `npm run sync-assets`를 다시 실행하면 이 매핑은
// 그대로 유지된다(파일명은 같고 확장자만 .webp).
// T05(선호 색 무지티)가 들어간 이미지의 색상 버전은 scripts/generate-tee-colors.mjs가
// "<원본이름>_<colorId>.webp" 형태로 같은 폴더에 만들어 둔다.

export const MAIN_IMAGE = '/assets/main/Main.webp';

export const CHARACTER_BASE_IMAGES = {
  boy: '/assets/characters/boy.webp',
  girl: '/assets/characters/girl.webp',
};

// 남녀 캐릭터별 이미지가 따로 있는 아이템: { B, G }
// 공용 이미지 아이템: { shared }
// hasColorVariants: true인 아이템(T05)만 favoriteColor에 따라 다른 파일을 쓴다.
export const ITEMS = {
  T01: { name: '기본 반소매 상의', B: '/assets/items/T01_B.webp', G: '/assets/items/T01_G.webp' },
  T02: { name: '얇은 가디건', B: '/assets/items/T02_B.webp', G: '/assets/items/T02_G.webp' },
  T03: { name: '두꺼운 점퍼', B: '/assets/items/T03_B.webp', G: '/assets/items/T03_G.webp' },
  T04: { name: '그래픽 티셔츠', B: '/assets/items/T04_B.webp', G: '/assets/items/T04_G.webp' },
  T05: { name: '선호 색 기본 상의', B: '/assets/items/T05_B.webp', G: '/assets/items/T05_G.webp', hasColorVariants: true },
  T06: { name: '세로선 강조 겉옷', B: '/assets/items/T06_B.webp', G: '/assets/items/T06_G.webp' },
  T07: { name: '밝은 색·무늬 겉옷', B: '/assets/items/T07_B.webp', G: '/assets/items/T07_G.webp' },
  T08: { name: '부드러운 재질 겉옷', shared: '/assets/items/T08.webp' },
  B01: { name: '와이드 데님', shared: '/assets/items/B01.webp' },
  B02: { name: '편한 기본 하의', shared: '/assets/items/B02.webp' },
  S01: { name: '편한 운동화', B: '/assets/items/S01_B.webp', G: '/assets/items/S01_G.webp' },
  S02: { name: '단단한 외출 신발', shared: '/assets/items/S02.webp' },
  A01: { name: '작은 백팩', B: '/assets/items/A01_B.webp', G: '/assets/items/A01_G.webp' },
  A02: { name: '손가방', B: '/assets/items/A02_B.webp', G: '/assets/items/A02_G.webp' },
  A03: { name: '포인트 키링', B: '/assets/items/A03_B.webp', G: '/assets/items/A03_G.webp' },
};

// colorId를 주면(그리고 그 아이템이 색상 버전을 갖고 있으면) 선호 색이 반영된
// 파일 경로를 돌려준다. 그 외에는 기존 기본 이미지를 그대로 돌려준다.
export function getItemImage(itemId, character, colorId) {
  const item = ITEMS[itemId];
  if (!item) return null;
  const base = item.shared ? item.shared : character === 'girl' ? item.G : item.B;
  if (item.hasColorVariants && colorId) {
    return base.replace(/\.webp$/, `_${colorId}.webp`);
  }
  return base;
}

export function getItemName(itemId) {
  return ITEMS[itemId]?.name ?? itemId;
}

// 코드/정리ID/겉옷없음ID의 첫 글자(상황3 선택: A/B/C)를 뽑아낸다.
// 상황3 A(그래픽 티셔츠 T04)는 색상 버전이 없으므로 항상 기본 이미지를 써야 한다.
function scene3RowOf(outfitId) {
  // outfitId 예: "05-B" -> 코드 05 -> row 1(B). declutterId/noOuterId는 "B_S01", "B_C"처럼 첫 글자가 바로 row.
  const codeMatch = outfitId.match(/^(\d{2})-[ABC]$/);
  if (codeMatch) {
    const code = Number(codeMatch[1]);
    return ['A', 'B', 'C'][Math.floor((code - 1) / 3)];
  }
  return outfitId[0]; // "B_S01" / "B_C" 형태
}

function withColorSuffix(path, colorId, row) {
  if (!colorId || row === 'A') return path; // 그래픽 티셔츠(row A)는 색상 버전이 없다
  return path.replace(/\.webp$/, `_${colorId}.webp`);
}

// 완성된 코디 착용 이미지("코디 결과 이미지" 폴더 -> public/assets/outfits/).
// 파일명 규칙: outfit_<코드>_<boy|girl>.webp (코드는 예: "05-B")
export function getOutfitImage(outfitId, character, colorId) {
  if (!outfitId) return null;
  const path = `/assets/outfits/outfit_${outfitId}_${character}.webp`;
  return withColorSuffix(path, colorId, scene3RowOf(outfitId));
}

// 상황5 "겉옷·가방 정리" 후 모습("코디 결과 이미지" 폴더에 추가된 12장).
// 파일명 규칙: outfit_declutter_<id>_<boy|girl>.webp (id는 예: "A_S01")
export function getDeclutterImage(declutterId, character, colorId) {
  if (!declutterId) return null;
  const path = `/assets/outfits/outfit_declutter_${declutterId}_${character}.webp`;
  return withColorSuffix(path, colorId, scene3RowOf(declutterId));
}

// 상황3(상의·하의)+신발·가방까지 고르고 상황4(겉옷)는 아직 고르지 않았을 때 쓰는
// "겉옷 없음" 미리보기(18장). 파일명 규칙: outfit_no_outer_<id>_<boy|girl>.webp
// (id는 예: "B_C" = 상황3 B행 + 신발·가방 C)
export function getNoOuterImage(noOuterId, character, colorId) {
  if (!noOuterId) return null;
  const path = `/assets/outfits/outfit_no_outer_${noOuterId}_${character}.webp`;
  return withColorSuffix(path, colorId, scene3RowOf(noOuterId));
}

// getDisplayOutfit()의 결과({kind, id})를 실제 이미지 경로로 바꾼다.
export function getDisplayImageSrc(displaySpec, character, colorId) {
  if (!displaySpec) return null;
  if (displaySpec.kind === 'declutter') return getDeclutterImage(displaySpec.id, character, colorId);
  if (displaySpec.kind === 'no_outer') return getNoOuterImage(displaySpec.id, character, colorId);
  return getOutfitImage(displaySpec.id, character, colorId);
}

// 이야기1(상황1~2) 결과 이미지. 색상(favoriteColor)과는 무관하다.
// - story1-solo: scene1_<cardigan|padding>_<boy|girl>.webp (상황1만 확정된 상태)
// - story1-combo: scene2_<cardigan|padding|none>_<A|B|C>_<boy|girl>.webp (상황2까지 확정된 상태)
export function getStory1Image(displaySpec, character) {
  if (!displaySpec) return null;
  if (displaySpec.kind === 'story1-solo') return `/assets/outfits/scene1_${displaySpec.id}_${character}.webp`;
  if (displaySpec.kind === 'story1-combo') return `/assets/outfits/scene2_${displaySpec.id}_${character}.webp`;
  return null;
}

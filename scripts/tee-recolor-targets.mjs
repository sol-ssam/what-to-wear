// 색상 처리 대상 목록 (T05 무지티가 보이는 파일만).
// 상황3 A(그래픽 티셔츠 T04)는 대상에서 제외한다 -> row 'A'는 애초에 이 목록에 없다.
// 원본은 sync-assets.mjs가 만든 .webp(리사이즈됨)를 그대로 읽는다 — 좌표는
// 전부 비율(0~1)이라 해상도가 바뀌어도 그대로 유효하다.
const GENDERS = ['boy', 'girl'];
const SUFFIX = ['A', 'B', 'C']; // 상황3 신발·가방(scene3Accessories) 선택
const SHOE_GROUPS = ['S01', 'S02'];
const ROWS_BC = ['B', 'C']; // 상황3(상의·하의) B/C만 무지티(T05)

// 1) 완성 코디 54장 중 T05가 있는 36장 (코드 04~09)
export const OUTFIT_TARGETS = [];
for (const code of ['04', '05', '06', '07', '08', '09']) {
  for (const s of SUFFIX) {
    for (const g of GENDERS) {
      OUTFIT_TARGETS.push({ file: `outfit_${code}-${s}_${g}.webp`, outBase: `outfit_${code}-${s}_${g}` });
    }
  }
}

// 2) 상황5 "정리" 이미지 12장 중 T05가 있는 8장
export const DECLUTTER_TARGETS = [];
for (const row of ROWS_BC) {
  for (const sg of SHOE_GROUPS) {
    for (const g of GENDERS) {
      DECLUTTER_TARGETS.push({ file: `outfit_declutter_${row}_${sg}_${g}.webp`, outBase: `outfit_declutter_${row}_${sg}_${g}` });
    }
  }
}

// 3) 겉옷 없는 코디(신발·가방 확정 후 상황4 이전 미리보기) 18장 중 T05가 있는 12장
export const NO_OUTER_TARGETS = [];
for (const row of ROWS_BC) {
  for (const s of SUFFIX) {
    for (const g of GENDERS) {
      NO_OUTER_TARGETS.push({ file: `outfit_no_outer_${row}_${s}_${g}.webp`, outBase: `outfit_no_outer_${row}_${s}_${g}` });
    }
  }
}

// 4) 선택 카드·아이템 칩용 T05 단품 이미지 2장(성별별)
export const ITEM_TARGETS = [
  { file: 'T05_B.webp', outBase: 'T05_B' },
  { file: 'T05_G.webp', outBase: 'T05_G' },
];

// 무지티를 찾기 위한 기본 후보 시작점(비율 좌표): 가슴 중앙 클러스터 + 소매 피크 + 허리단 후보.
// 옷 이미지 폴더의 원화들은 전부 같은 인물 도상 체계를 쓰지만, 각 장면은 독립적으로
// 그려져 자세·확대율이 조금씩 달라서 한 좌표를 고정하지 않고 그리드로 후보를 모은다.
export const DEFAULT_CANDIDATES = [];
for (const x of [0.40, 0.46, 0.50, 0.54, 0.60]) for (const y of [0.27, 0.30, 0.33, 0.37, 0.40]) DEFAULT_CANDIDATES.push([x, y]);
for (const x of [0.20, 0.25, 0.75, 0.80]) for (const y of [0.23, 0.27]) DEFAULT_CANDIDATES.push([x, y]);
for (const x of [0.42, 0.50, 0.58]) for (const y of [0.42, 0.45]) DEFAULT_CANDIDATES.push([x, y]);

// 아이템 카드(원래 800x800, 옷만 크게 그려진 단품 그림)는 인물 사진보다 단순해서
// 중앙 한 점이면 충분하다.
export const ITEM_CANDIDATES = [[0.5, 0.5]];

export const DEFAULT_THRESHOLD = 9;
export const MIN_BLOB_SIZE = 2500;

// 자동 그리드로 부족하거나 새는 파일이 발견되면 여기에 파일명별 수동 보정을 추가한다.
// { threshold?, candidates?: [[x,y]-비율], manualSeeds?: [[x,y]-비율, isNearWhite 필터 건너뜀] }
//
// T05_B.webp/T05_G.webp는 옷 자체가 이미 진한 파란색이라(흰색이 아님) 자동
// 후보(흰색 계열에서만 시작)가 전혀 걸리지 않는다. manualSeeds로 이 자동
// 필터를 건너뛰고 중앙 지점에서 바로 시작한다.
export const OVERRIDES = {
  'T05_B.webp': { manualSeeds: [[0.5, 0.5]] },
  'T05_G.webp': { manualSeeds: [[0.5, 0.5]] },
};

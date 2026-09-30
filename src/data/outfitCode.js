// 상황3(상의·하의) + 상황4(겉옷) + 상황3 신발·가방(scene3Accessories) 선택을
// "코디 결과 이미지" 파일명 코드로 바꾸는 단 하나의 계산 함수.
// (이야기1의 상황2는 완전히 다른 날의 선택이라 이야기2의 코디에는 쓰이지 않는다.)
//
//                     상황4: T06(세로선) | 상황4: T07(밝은 색·무늬) | 상황4: T08(부드러운 겉옷)
// 상황3: T04+B01(A)         01                    02                        03
// 상황3: T05+B02(B)         04                    05                        06
// 상황3: T05+B01(C)         07                    08                        09
//
// 상황3 선택 ID(A/B/C)가 행, 상황4 선택 ID(A/B/C)가 열이 되어 01~09가 정해지고,
// 상황3 신발·가방 선택 ID(A/B/C)가 그대로 파일명 접미사(-A/-B/-C)가 된다.
// 예: 상황3=B(T05+B02), 상황4=B(T07), 신발·가방=B(외출 신발+손가방) -> "05-B"
import { getChoice } from './story';

const ROW_BY_SCENE3_CHOICE = { A: 0, B: 1, C: 2 };
const COL_BY_SCENE4_CHOICE = { A: 0, B: 1, C: 2 };

export function getOutfitCode(answers) {
  const row = ROW_BY_SCENE3_CHOICE[answers?.scene3];
  const col = COL_BY_SCENE4_CHOICE[answers?.scene4];
  if (row === undefined || col === undefined) return null;
  return String(row * 3 + col + 1).padStart(2, '0');
}

// 상황4까지 골라야 완성되는 최종 코디 ID (예: "05-B"). 상황3·4·(신발·가방) 중
// 하나라도 아직 선택하지 않았다면 null을 반환한다 -> 호출 쪽에서는 이 null을
// "아직 완성된 착용 이미지를 보여줄 수 없다"는 신호로 쓰면 된다.
export function getOutfitId(answers) {
  const code = getOutfitCode(answers);
  const suffix = answers?.scene3Accessories;
  if (!code || !suffix) return null;
  return `${code}-${suffix}`;
}

// ------------------------------------------------------------------
// 상황5 "겉옷·가방 정리"(선택 id 'B') 전용 이미지, 그리고 상황4를 고르기 전
// "상의·하의·신발까지만" 미리 보여줄 때도 재사용하는 이미지.
// 겉옷(상황4 T06/T07/T08)과 가방·키링을 빼고 나면 신발만 남는데, 신발·가방
// 선택의 A/C는 둘 다 운동화(S01)라 같은 그림으로 합쳐진다(B만 외출 신발 S02).
// 그래서 "상황3(상의·하의) x 신발그룹(S01|S02)" 6종 x 성별 2종 = 12장이면 된다.
// 파일명: outfit_declutter_<상황3 A|B|C>_<S01|S02>_<boy|girl>.webp
function getShoeGroup(answers) {
  const choice = getChoice('scene3Accessories', answers?.scene3Accessories);
  return choice?.items.find((id) => id.startsWith('S')) ?? null;
}

export function getDeclutterId(answers) {
  const scene3 = answers?.scene3;
  const shoeGroup = getShoeGroup(answers);
  if (!scene3 || !shoeGroup) return null;
  return `${scene3}_${shoeGroup}`;
}

// ------------------------------------------------------------------
// 상황4(겉옷)를 고르기 전, "상의·하의 + 신발·가방(+키링)"까지만 미리 보여줄 때
// 쓰는 이미지(18장). declutter와 달리 신발그룹으로 합치지 않고 신발·가방
// 선택 A/B/C를 그대로 살린다(가방·키링이 큰 그림에도 정확히 보이도록).
// 파일명: outfit_no_outer_<상황3 A|B|C>_<신발가방 A|B|C>_<boy|girl>.webp
export function getNoOuterId(answers) {
  const scene3 = answers?.scene3;
  const accessories = answers?.scene3Accessories;
  if (!scene3 || !accessories) return null;
  return `${scene3}_${accessories}`;
}

// 상황3(상의·하의) 카드를 미리 눌러볼 때 쓰는 기본 신발 그룹. 신발·가방은
// 아직 고르지 않은 단계라 실제 선택으로 저장하지 않고, 화면에만 이 신발로
// "정리 후" 모습을 잠깐 보여준다(가방·키링은 정리 이미지에 애초에 없다).
const PREVIEW_DEFAULT_SHOE_GROUP = 'S01';

// 화면에 표시할 이미지가 무엇인지 결정하는 단 하나의 함수.
// activeSceneId: 지금 선택 중인 장면의 id(예: 'scene3'). 미리보기 중인 답만
// answers에 얹혀 들어올 수 있으므로, 어느 단계에서 부르는지 함께 알려줘야
// 상황3(상의·하의)·상황3(신발·가방) 단계의 "아직 다음 정보가 없는" 미리보기를
// 다른 장면에 잘못 새어나가지 않게 제한할 수 있다.
// - 상황5에서 '정리'(B)를 골랐다면 정리 이미지(겉옷·가방·키링 없음)를 최우선으로 보여준다.
// - 상황5에서 '포인트 소품 정돈'(C)을 골랐고, 신발·가방 선택도 키링이 달린
//   C였다면, 키링만 없는 모습이 필요하다. 이를 위한 새 그림을 따로 만들지
//   않고, 같은 코디 번호의 A 유형(같은 신발·가방, 키링 없음) 이미지를 재사용한다.
//   (신발·가방 A/B에는 애초에 키링이 없으므로 이 경우는 적용되지 않는다.)
// - 상황4(겉옷)까지 골랐다면 기존 완성 코디 이미지(54장)를 보여준다.
// - 상의·하의와 신발·가방까지만 고르고 아직 상황4(겉옷)를 고르지 않았다면,
//   "겉옷 없음" 이미지로 상의·하의·신발·가방(+키링)까지 미리 보여준다.
// - 상황3(상의·하의) 또는 상황3(신발·가방) 단계에서, 아직 신발·가방을 고르지
//   않았다면(=미확정) 기본 신발(S01)로 만든 정리 이미지를 임시로 보여준다.
// - 필요한 선택이 아직 다 모이지 않았다면 null(=아직 기본 캐릭터를 보여줘야 함).
export function getDisplayOutfit(answers, activeSceneId) {
  if (answers?.scene5 === 'B') {
    const id = getDeclutterId(answers);
    return id ? { kind: 'declutter', id } : null;
  }
  if (answers?.scene5 === 'C' && answers?.scene3Accessories === 'C') {
    const code = getOutfitCode(answers);
    return code ? { kind: 'outfit', id: `${code}-A` } : null;
  }
  const id = getOutfitId(answers);
  if (id) return { kind: 'outfit', id };

  const isScene3Stage = activeSceneId === 'scene3' || activeSceneId === 'scene3Accessories';
  if (isScene3Stage && answers?.scene3 && !answers?.scene3Accessories) {
    return { kind: 'declutter', id: `${answers.scene3}_${PREVIEW_DEFAULT_SHOE_GROUP}` };
  }

  const noOuterId = getNoOuterId(answers);
  return noOuterId ? { kind: 'no_outer', id: noOuterId } : null;
}

// 개발 중 실수를 바로 잡기 위한 전수 검증: 27개 조합이 전부 01-A ~ 09-C
// 형태의 유효한 코드를 만드는지, 정리 이미지 6종 id가 모두 유효한지,
// getDisplayOutfit()이 상황5(A/B/C)까지 포함해 항상 유효한 결과를 내는지
// 모듈 로드 시점에 확인한다.
const ALL_CHOICES = ['A', 'B', 'C'];
for (const scene3 of ALL_CHOICES) {
  for (const scene4 of ALL_CHOICES) {
    for (const scene3Accessories of ALL_CHOICES) {
      const id = getOutfitId({ scene3, scene4, scene3Accessories });
      if (!/^0[1-9]-[ABC]$/.test(id)) {
        throw new Error(
          `outfitCode: 잘못된 코디 코드 생성 (scene3=${scene3}, scene4=${scene4}, scene3Accessories=${scene3Accessories}) -> ${id}`
        );
      }
      const declutterId = getDeclutterId({ scene3, scene3Accessories });
      if (!/^[ABC]_S0[12]$/.test(declutterId)) {
        throw new Error(
          `outfitCode: 잘못된 정리 이미지 ID 생성 (scene3=${scene3}, scene3Accessories=${scene3Accessories}) -> ${declutterId}`
        );
      }
      for (const scene5 of ALL_CHOICES) {
        const spec = getDisplayOutfit({ scene3, scene4, scene3Accessories, scene5 });
        if (!spec) {
          throw new Error(
            `outfitCode: getDisplayOutfit이 null 반환 (scene3=${scene3}, scene4=${scene4}, scene3Accessories=${scene3Accessories}, scene5=${scene5})`
          );
        }
        const validOutfit = spec.kind === 'outfit' && /^0[1-9]-[ABC]$/.test(spec.id);
        const validDeclutter = spec.kind === 'declutter' && /^[ABC]_S0[12]$/.test(spec.id);
        if (!validOutfit && !validDeclutter) {
          throw new Error(
            `outfitCode: getDisplayOutfit이 잘못된 값을 반환 (scene3=${scene3}, scene4=${scene4}, scene3Accessories=${scene3Accessories}, scene5=${scene5}) -> ${JSON.stringify(spec)}`
          );
        }
      }
      const noOuterId = getNoOuterId({ scene3, scene3Accessories });
      if (!/^[ABC]_[ABC]$/.test(noOuterId)) {
        throw new Error(
          `outfitCode: 잘못된 겉옷 없음 이미지 ID 생성 (scene3=${scene3}, scene3Accessories=${scene3Accessories}) -> ${noOuterId}`
        );
      }
    }
  }
}
// 상황4를 아직 고르지 않은 "미리보기" 상태도 항상 유효한 "겉옷 없음" 이미지를 내는지 확인
for (const scene3 of ALL_CHOICES) {
  for (const scene3Accessories of ALL_CHOICES) {
    const spec = getDisplayOutfit({ scene3, scene3Accessories });
    if (!spec || spec.kind !== 'no_outer' || !/^[ABC]_[ABC]$/.test(spec.id)) {
      throw new Error(
        `outfitCode: 상황4 이전 미리보기가 잘못됨 (scene3=${scene3}, scene3Accessories=${scene3Accessories}) -> ${JSON.stringify(spec)}`
      );
    }
  }
}
// 상황3(상의·하의)를 미리 눌러보는 중이라 신발·가방을 아직 모르는 상태에서는
// activeSceneId가 'scene3'/'scene3Accessories'일 때만 기본 신발(S01) 정리
// 이미지를 보여주고, 다른 장면(activeSceneId 없음/다른 값)에서는 이 임시값이
// 새어나가지 않고 그대로 null을 내는지 확인한다.
for (const scene3 of ALL_CHOICES) {
  for (const activeSceneId of ['scene3', 'scene3Accessories']) {
    const spec = getDisplayOutfit({ scene3 }, activeSceneId);
    if (!spec || spec.kind !== 'declutter' || spec.id !== `${scene3}_${PREVIEW_DEFAULT_SHOE_GROUP}`) {
      throw new Error(
        `outfitCode: 상황3 미리보기(기본 신발)가 잘못됨 (scene3=${scene3}, activeSceneId=${activeSceneId}) -> ${JSON.stringify(spec)}`
      );
    }
  }
  const specElsewhere = getDisplayOutfit({ scene3 }, 'scene4');
  if (specElsewhere !== null) {
    throw new Error(
      `outfitCode: activeSceneId가 다른 장면인데 상황3 임시 미리보기가 새어나감 (scene3=${scene3}) -> ${JSON.stringify(specElsewhere)}`
    );
  }
  const specNoActiveId = getDisplayOutfit({ scene3 });
  if (specNoActiveId !== null) {
    throw new Error(
      `outfitCode: activeSceneId 없이 부르면 상황3 임시 미리보기가 나오면 안 됨 (scene3=${scene3}) -> ${JSON.stringify(specNoActiveId)}`
    );
  }
}

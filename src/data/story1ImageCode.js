// 이야기1(상황1~2) 결과 화면에서 보여줄 착용 이미지를 결정하는 단 하나의 함수.
// story2(outfitCode.js)와 완전히 분리되어 있고, 색상(T05) 처리와도 무관하다.
//
// 상황1 선택 -> 겉옷 이름:  A(가디건)=cardigan, B(패딩)=padding, C(겉옷 없음)=none
// 상황1만 확정된 상태: 겉옷만 반영한 이미지(scene1_<겉옷>_<gender>.webp)를 보여준다.
//   (겉옷 없음 C는 기본 캐릭터와 모습이 같아 별도 이미지가 없다.)
// 상황2까지 확정되면: 겉옷 + 상황2에서 고른 신발·가방(A/B/C)을 합친 이미지
//   (scene2_<겉옷>_<A|B|C>_<gender>.webp)로 전환하고, 다음 선택(=이야기2 전환) 전까지 유지한다.
const OUTFIT_NAME_BY_SCENE1 = { A: 'cardigan', B: 'padding', C: 'none' };

export function getStory1OutfitName(answers) {
  return OUTFIT_NAME_BY_SCENE1[answers?.scene1] ?? null;
}

export function getStory1SoloId(answers) {
  const outfit = getStory1OutfitName(answers);
  if (!outfit || outfit === 'none') return null;
  return outfit;
}

export function getStory1ComboId(answers) {
  const outfit = getStory1OutfitName(answers);
  const scene2 = answers?.scene2;
  if (!outfit || !scene2) return null;
  return `${outfit}_${scene2}`;
}

// 화면에 표시할 이야기1 이미지를 한 곳에서 결정한다.
export function getStory1DisplayImage(answers) {
  const comboId = getStory1ComboId(answers);
  if (comboId) return { kind: 'story1-combo', id: comboId };
  const soloId = getStory1SoloId(answers);
  if (soloId) return { kind: 'story1-solo', id: soloId };
  return null;
}

// 전수 검증
const ALL_CHOICES = ['A', 'B', 'C'];
for (const scene1 of ALL_CHOICES) {
  const outfit = OUTFIT_NAME_BY_SCENE1[scene1];

  const soloSpec = getStory1DisplayImage({ scene1 });
  if (scene1 === 'C') {
    if (soloSpec !== null) {
      throw new Error(`story1ImageCode: scene1=C(겉옷 없음)인데 이미지가 나옴 -> ${JSON.stringify(soloSpec)}`);
    }
  } else if (!soloSpec || soloSpec.kind !== 'story1-solo' || soloSpec.id !== outfit) {
    throw new Error(`story1ImageCode: 잘못된 단독 이미지 (scene1=${scene1}) -> ${JSON.stringify(soloSpec)}`);
  }

  for (const scene2 of ALL_CHOICES) {
    const comboSpec = getStory1DisplayImage({ scene1, scene2 });
    if (!comboSpec || comboSpec.kind !== 'story1-combo' || comboSpec.id !== `${outfit}_${scene2}`) {
      throw new Error(`story1ImageCode: 잘못된 조합 이미지 (scene1=${scene1}, scene2=${scene2}) -> ${JSON.stringify(comboSpec)}`);
    }
  }
}
if (getStory1DisplayImage({}) !== null) {
  throw new Error('story1ImageCode: 선택 전인데 이미지가 나옴');
}

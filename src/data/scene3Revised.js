// 이야기 2("며칠 뒤, 또 다른 체험활동 날")의 시작 장면들.
// ------------------------------------------------------------
// 개정 이력
//   v1: 원본 스토리라인의 상황3("체험 장소 도착 후 여벌 옷으로 갈아입기")이
//       선택지의 와이드 데님(하의 교체)과 맞지 않아, "학교에서 출발하기 전"
//       시점으로 옮긴 수정본이었다.
//   v2(현재): 게임 전체를 두 개의 이야기로 나누면서, 상황3의 코디 선택이
//       아예 다른 날(이야기 2)의 "출발 전, 집에서" 장면이 되었다.
//       - "도착 후 여벌 옷으로 갈아입는다" 설정과 대사는 전부 제거했다.
//       - 상황3을 두 단계로 나눴다: 상의·하의 선택(scene3)과
//         신발·가방 선택(scene3Accessories). 신발·가방 선택은 이야기1의
//         상황2(answers.scene2)와 별도로 answers.scene3Accessories에 저장해,
//         상황2 기록을 덮어쓰거나 재사용하지 않는다.
// 원본 텍스트("오늘 뭐 입지_스토리라인.txt")는 여전히 수정하지 않았다.

import { ITEMS } from './assetMap';

export const scene3 = {
  id: 'scene3',
  order: 3,
  story: 2,
  storyLabel: '이야기 2 · 나의 스타일',
  storyStep: 1,
  storyTotal: 4,
  location: '출발 전, 내 방 옷장 앞',
  title: '유행도 좋고, 내 취향도 좋은데?',
  layout: 'default',
  intro: [
    { speaker: '내레이션', text: '며칠 뒤, 또 다른 체험활동 날 아침이다. 오늘도 사복 착용이 허용됐다.' },
    {
      speaker: '친구',
      text: '요즘 친구들 사이에서는 그래픽 티셔츠와 와이드 데님이 인기더라. 유행을 시도해 볼까, 내 취향대로 입을까?',
    },
    { speaker: '내레이션', text: '집에서 오늘 입을 상의와 하의부터 골라 보자.' },
  ],
  choices: [
    {
      id: 'A',
      label: '요즘 보이는 스타일을 시도한다',
      tag: '그래픽 티셔츠 + 와이드 데님',
      items: ['T04', 'B01'],
      result: '평소와 달라서 새롭다. 유행하는 스타일을 시도해 보는 것도 즐겁다.',
    },
    {
      id: 'B',
      label: '내가 좋아하는 색과 스타일로 입는다',
      tag: '선호 색 상의 + 편한 하의',
      items: ['T05', 'B02'],
      tintItem: 'T05',
      result: '내가 좋아하는 모습이라 자연스럽다. 오늘 하루도 편하게 움직일 수 있을 것 같다.',
    },
    {
      id: 'C',
      label: '유행하는 옷에 내 취향 한 가지를 더한다',
      tag: '와이드 데님 + 선호 색 포인트',
      items: ['T05', 'B01'],
      tintItem: 'T05',
      result: '익숙한 유행에 좋아하는 색을 더하니 나다운 느낌도 남는다.',
    },
  ],
  outro: [{ speaker: '내레이션', text: '옷은 골랐다! 이제 오늘 신을 신발과 가져갈 가방을 골라 보자.' }],
};

export const scene3Accessories = {
  id: 'scene3Accessories',
  order: 3.5,
  story: 2,
  storyLabel: '이야기 2 · 나의 스타일',
  storyStep: 2,
  storyTotal: 4,
  location: '출발 전, 신발장 앞',
  title: '신발과 가방도 골라 볼까?',
  layout: 'default',
  intro: [{ speaker: '내레이션', text: '옷은 골랐다! 이제 오늘 신을 신발과 가져갈 가방을 골라 보자.' }],
  choices: [
    {
      id: 'A',
      label: '편한 운동화와 가벼운 가방을 고른다',
      tag: '운동화 + 백팩',
      items: ['S01', 'A01'],
      result: '걷기 편하고, 필요한 물건도 가방에 잘 들어간다.',
    },
    {
      id: 'B',
      label: '사진에 잘 나오는 신발과 가방을 고른다',
      tag: '외출 신발 + 손가방',
      items: ['S02', 'A02'],
      result: '사진에는 마음에 드는 모습이다. 다만 오래 걸으면 발이 조금 불편할 수도 있다.',
    },
    {
      id: 'C',
      label: '운동화를 신고, 좋아하는 소품으로 포인트를 준다',
      tag: '운동화 + 백팩 + 포인트 키링',
      items: ['S01', 'A01', 'A03'],
      result: '걷기 편하고, 가방에 달린 키링도 눈에 띈다.',
    },
  ],
  outro: [{ speaker: '내레이션', text: '준비 끝! 체험활동 장소로 출발한다.' }],
};

// 데이터 검증용: choices에서 참조하는 아이템이 실제로 존재하는지 확인
[scene3, scene3Accessories].forEach((scene) =>
  scene.choices.forEach((c) =>
    c.items.forEach((id) => {
      if (!ITEMS[id]) throw new Error(`scene3Revised(${scene.id}): 알 수 없는 아이템 ID ${id}`);
    })
  )
);

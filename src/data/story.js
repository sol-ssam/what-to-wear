// 게임 전체 대사·선택지 데이터.
// 이야기 1(상황1~2)은 "오늘 뭐 입지_스토리라인.txt" 원문을 그대로 옮겼다.
// 이야기 2(상황3~5)는 완전히 다른 날의 이야기로, 상황3(상의·하의 + 신발·가방)은
// 시간 순서를 정리한 별도 파일(scene3Revised.js)에서 가져온다.
import { ITEMS } from './assetMap';
import { scene3, scene3Accessories } from './scene3Revised';

const scene1 = {
  id: 'scene1',
  order: 1,
  story: 1,
  storyLabel: '이야기 1 · 날씨와 활동',
  storyStep: 1,
  storyTotal: 2,
  location: '등굣길',
  title: '아침은 쌀쌀, 오후는 포근?',
  layout: 'default',
  intro: [
    { speaker: '내레이션', text: '알람이 울린다. 창밖에는 바람이 불고, 휴대전화 날씨 알림에는 이렇게 적혀 있다.' },
    { speaker: '날씨 알림', text: '현재 12℃, 낮 최고 23℃. 오후에는 야외 체험활동 예정.' },
    { speaker: '친구', text: '오늘 학교에서 바로 체험활동 장소로 이동한대. 오래 걷지는 않겠지?' },
    { speaker: '내레이션', text: '아침에는 춥지만 오후에는 더울 수도 있다. 옷장 앞에서 무엇을 챙길까?' },
  ],
  choices: [
    {
      id: 'A',
      label: '가벼운 가디건을 챙긴다',
      tag: '가디건',
      items: ['T02'],
      result: '등굣길에는 가디건을 걸쳐 따뜻했다. 오후에 더워지면 벗어 들고 다닐 수도 있겠다.',
    },
    {
      id: 'B',
      label: '두꺼운 겉옷을 입고 나간다',
      tag: '두꺼운 점퍼',
      items: ['T03'],
      result: '등굣길에는 든든했다. 날씨가 풀리자 겉옷이 조금 무겁게 느껴진다.',
    },
    {
      id: 'C',
      label: '겉옷 없이 가볍게 나간다',
      tag: '겉옷 없음',
      items: ['T01'],
      result: '집 앞에서는 가벼웠는데, 학교까지 걸어가는 동안 바람이 차갑다. 오후에는 괜찮을지도 모른다.',
    },
  ],
  outro: [{ speaker: '내레이션', text: '학교에 도착하자 선생님의 안내 방송이 들린다.' }],
};

// 상황1 선택에 따라 상황2 결과 뒤에 붙는 "이전 선택 반영 대사"
const scene1FollowUp = {
  A: '햇빛이 따뜻해지자 가디건을 벗어 가방에 넣는다.',
  B: '두꺼운 점퍼를 들고 이동하느라 짐이 조금 늘었다.',
  C: '아침 바람은 추웠지만, 낮에는 움직이기 가볍다.',
};

const scene2 = {
  id: 'scene2',
  order: 2,
  story: 1,
  storyLabel: '이야기 1 · 날씨와 활동',
  storyStep: 2,
  storyTotal: 2,
  location: '학교, 안내 방송',
  title: '체험활동 일정이 바뀌었다!',
  layout: 'default',
  intro: [
    {
      speaker: '선생님',
      text: '오늘은 실내 전시만 보는 줄 알았죠? 야외 탐방 코스가 추가됐습니다. 꽤 걸을 예정이니 신발과 준비물을 확인하세요.',
    },
    { speaker: '친구', text: '나 새 신발 신고 왔는데 오래 걸어도 괜찮을까?' },
    { speaker: '내레이션', text: '신발을 고르고, 필요한 물건을 챙길 시간이 잠깐 있다.' },
  ],
  choices: [
    {
      id: 'A',
      label: '편한 운동화와 가벼운 가방을 고른다',
      tag: '운동화 + 작은 백팩',
      items: ['S01', 'A01'],
      result: '야외 길을 걸을 때 발이 편하다. 필요한 물건도 꺼내기 쉽다.',
    },
    {
      id: 'B',
      label: '사진에 잘 나오는 신발과 가방을 고른다',
      tag: '단단한 신발 + 손가방',
      items: ['S02', 'A02'],
      result: '사진에는 마음에 드는 모습이다. 다만 길을 오래 걸으니 발이 조금 불편하다.',
    },
    {
      id: 'C',
      label: '운동화를 신고, 좋아하는 소품으로 포인트를 준다',
      tag: '운동화 + 포인트 키링',
      items: ['S01', 'A03'],
      result: '걷기 편하고, 좋아하는 소품도 눈에 띈다. 친구가 "그 색 너랑 잘 어울린다!"라고 말한다.',
    },
  ],
  getFollowUp: (answers) => scene1FollowUp[answers.scene1] ?? null,
  // 이야기1의 마무리 대사는 story1-end 전환 화면에서 보여주므로, 이 장면 자체에는
  // 별도의 다음 장면 연결 대사를 두지 않는다.
  outro: [],
};

const scene4 = {
  id: 'scene4',
  order: 4,
  story: 2,
  storyLabel: '이야기 2 · 나의 스타일',
  storyStep: 3,
  storyTotal: 4,
  location: '체험활동 장소 도착',
  title: '같은 사람, 다른 느낌',
  layout: 'compare',
  intro: [
    { speaker: '내레이션', text: '체험활동 장소에 도착했다. 안내 선생님이 스타일링 미션을 건넸다.' },
    {
      speaker: '안내 선생님',
      text: '미션 상자에 겉옷 세 가지를 준비했어요. 하나를 골라 입고, 영상에서 보여 주고 싶은 분위기를 만들어 볼까요?',
    },
    { speaker: '내레이션', text: '선, 색, 재질, 무늬가 달라지면 어떤 느낌이 들까? 준비된 겉옷 중 하나를 골라 보자.' },
  ],
  choices: [
    {
      id: 'A',
      label: '단정하고 길어 보이는 느낌',
      tag: '세로선 겉옷',
      items: ['T06'],
      result: '세로선과 이어지는 색 덕분에 시선이 위아래로 흐른다. 캐릭터의 분위기가 단정해 보인다.',
    },
    {
      id: 'B',
      label: '밝고 활기찬 느낌',
      tag: '밝은 색·무늬 겉옷',
      items: ['T07'],
      result: '밝은 색과 무늬가 눈에 들어온다. 화면 속 분위기가 경쾌해 보인다.',
    },
    {
      id: 'C',
      label: '편안하고 부드러운 느낌',
      tag: '부드러운 재질 겉옷',
      items: ['T08'],
      result: '부드러운 재질과 단순한 무늬가 차분한 느낌을 준다.',
    },
  ],
  commonAfterResult: [
    {
      speaker: '안내 선생님',
      text: '같은 사람인데도 선택한 디자인에 따라 전달되는 느낌이 달라지네요. 어떤 모습이 가장 나다운가요?',
    },
  ],
  outro: [{ speaker: '내레이션', text: '미션을 마치자 어느새 촬영 시간이 다가왔다.' }],
};

// 상황5 결과 뒤에, 이야기2의 앞선 선택에 해당하는 것만 이어 붙는 한 줄들
// (이야기1의 가디건·점퍼·신발 선택은 며칠 전 다른 날의 일이므로 여기서는 참조하지 않는다.)
const scene3TailNote = {
  A: '새로운 유행을 즐겨 본 하루였다.',
  B: '좋아하는 스타일로 참여한 하루였다.',
  C: '유행과 내 취향을 함께 표현한 하루였다.',
};
const scene3AccessoriesTailNote = {
  B: '사진에 잘 나오는 신발을 고른 마음은 좋았지만, 오래 걸을 때는 다른 신발도 생각해 보기로 했다.',
};

const scene5 = {
  id: 'scene5',
  order: 5,
  story: 2,
  storyLabel: '이야기 2 · 나의 스타일',
  storyStep: 4,
  storyTotal: 4,
  location: '체험활동 장소, 촬영 준비',
  title: '학교 소개 영상에 출연해 줄래?',
  layout: 'action',
  intro: [
    {
      speaker: '선생님',
      text: '기록 영상에 여러분의 한마디도 담으려고 해요. 촬영까지 5분! 지금 옷차림을 어떻게 정돈할까요?',
    },
    { speaker: '친구', text: '드디어 촬영이네! 나는 지금 모습도 좋은데, 조금만 정돈할래.' },
    { speaker: '내레이션', text: '지금까지 고른 옷차림을 살리면서, 카메라 앞에서 어떻게 준비할까?' },
  ],
  choices: [
    {
      id: 'A',
      label: '지금 옷차림의 옷매무새를 다듬고 촬영한다',
      tag: '옷매무새 정돈',
      action: 'tidy',
      result: '지금의 코디를 유지하면서 옷매무새를 바로잡았다. 카메라 앞에서 편하게 말할 수 있다.',
    },
    {
      id: 'B',
      label: '활동에 방해됐던 겉옷·가방을 정리하고 촬영한다',
      tag: '겉옷·가방 정리',
      action: 'declutter',
      result: '걸을 때 필요했던 물건과 촬영할 때 필요한 모습을 구분했다. 움직임이 한결 자연스럽다.',
    },
    {
      id: 'C',
      label: '내가 고른 스타일을 살려 한 가지 소품을 정돈하고 촬영한다',
      tag: '포인트 소품 정돈',
      action: 'accessorize',
      result: '내 취향이 보이는 포인트를 남기고 전체를 정돈했다. 영상에 나다운 분위기가 담겼다.',
      // 오늘(이야기2)의 신발·가방 선택에서 키링이 달린 코디(C)를 골랐을 때만
      // 실제 행동(키링을 떼어 둠)에 맞춘 대사로 바꾼다. A/B는 애초에 뗄 키링이
      // 없으므로 기존 대사를 그대로 쓴다.
      getResult: (answers) =>
        answers.scene3Accessories === 'C'
          ? '키링을 떼어 가방에 넣고, 나머지 코디는 그대로 정돈했다. 영상에 나다운 분위기가 담겼다.'
          : '내 취향이 보이는 포인트를 남기고 전체를 정돈했다. 영상에 나다운 분위기가 담겼다.',
    },
  ],
  getTailNotes: (answers) =>
    [scene3TailNote[answers.scene3], scene3AccessoriesTailNote[answers.scene3Accessories]].filter(Boolean),
  commonAfterResult: [
    { speaker: '선생님', text: '촬영 시작합니다. 하나, 둘, 셋!' },
    { speaker: '나', text: '우리 학교에서는 직접 보고, 걸어 보고, 친구들과 이야기를 나누며 배워요!' },
    { speaker: '내레이션', text: '오늘 고른 코디가 영상 프레임 안에 등장한다.' },
  ],
  outro: [],
};

export const SCENES = [scene1, scene2, scene3, scene3Accessories, scene4, scene5];

// 이야기1과 이야기2 사이에 보여줄 전환 화면 대사.
export const STORY_TRANSITION = {
  story1End: {
    title: '첫 번째 이야기 · 체험활동 준비 완료',
    lines: ['날씨도, 활동 계획도 달라졌던 하루. 직접 움직여 보니 내 옷차림의 편리한 점과 아쉬운 점을 알게 됐다.'],
    buttonLabel: '다음 이야기로',
  },
  story2Intro: {
    title: '며칠 뒤, 또 다른 체험활동 날',
    lines: ['이번에는 친구들과 사진도 찍고, 체험활동 기록 영상에도 참여할 예정이다. 오늘은 어떤 스타일로 나를 표현해 볼까?'],
    buttonLabel: '오늘의 코디 시작하기',
  },
};

export const ENDING = {
  title: '오늘의 코디, 어떤 선택이 기억에 남나요?',
  fixedLine:
    '옷은 날씨와 활동에 맞춰 몸을 보호하고, 내가 원하는 모습을 표현하며, 함께하는 상황을 배려하는 데에도 쓰여요.',
  storySummaries: [
    {
      storyLabel: '이야기 1 · 날씨와 활동',
      rows: [
        { sceneId: 'scene1', label: '날씨에 대비한 선택' },
        { sceneId: 'scene2', label: '활동에 대비한 선택' },
      ],
    },
    {
      storyLabel: '이야기 2 · 나의 스타일',
      rows: [
        { sceneId: 'scene3', label: '상의·하의' },
        { sceneId: 'scene3Accessories', label: '신발·가방' },
        { sceneId: 'scene4', label: '표현할 분위기' },
        { sceneId: 'scene5', label: '촬영 전 정돈' },
      ],
    },
  ],
  reflectQuestions: [
    '오늘 가장 만족스러운 선택은 무엇이었나요? 그 이유는요?',
    '다시 고를 수 있다면 어떤 장면의 옷차림을 바꾸고 싶나요?',
  ],
};

export function getScene(sceneId) {
  return SCENES.find((s) => s.id === sceneId);
}

export function getChoice(sceneId, choiceId) {
  return getScene(sceneId)?.choices.find((c) => c.id === choiceId);
}

// 확정된 선택이든(GameContext) 미리보기 중인 선택이든(SceneScreen) 같은
// 모양의 "옷장 항목"을 만들 때 쓰는 단 하나의 함수.
export function buildWardrobeEntry(sceneId, choice) {
  return {
    sceneId,
    tag: choice.tag,
    label: choice.label,
    items: choice.items ?? [],
    tintItem: choice.tintItem ?? null,
    action: choice.action ?? null,
  };
}

// 데이터 검증: 참조하는 아이템 ID가 실제로 존재하는지 확인
SCENES.forEach((scene) => {
  scene.choices.forEach((choice) => {
    (choice.items ?? []).forEach((id) => {
      if (!ITEMS[id]) throw new Error(`${scene.id}: 알 수 없는 아이템 ID ${id}`);
    });
  });
});

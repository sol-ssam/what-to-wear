// "이 answers로는 어떤 이미지를 보여줘야 하나"를 한 곳에서 계산하는 함수.
// CharacterDisplay(실제로 보여줄 이미지)와 SceneScreen(카드별 미리보기 후보
// 이미지를 미리 불러오기)이 똑같은 규칙을 쓰도록 이 함수 하나로 모은다.
// answers는 확정값일 수도, "확정값 + 지금 눌러본 카드 하나"를 합친 미리보기
// 값일 수도 있다 - 이 함수 입장에서는 구분하지 않는다.
import { getDisplayOutfit } from './outfitCode';
import { getStory1DisplayImage } from './story1ImageCode';
import { getDisplayImageSrc, getStory1Image } from './assetMap';

export function resolveDisplaySpec(story, answers, activeSceneId) {
  return story === 1 ? getStory1DisplayImage(answers ?? {}) : getDisplayOutfit(answers ?? {}, activeSceneId);
}

export function resolveDisplaySrc({ story, answers, activeSceneId, character, favoriteColor }) {
  const spec = resolveDisplaySpec(story, answers, activeSceneId);
  return story === 1 ? getStory1Image(spec, character) : getDisplayImageSrc(spec, character, favoriteColor);
}

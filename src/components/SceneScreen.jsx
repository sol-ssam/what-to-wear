import { getChoice, buildWardrobeEntry } from '../data/story';
import { getItemImage, getItemName } from '../data/assetMap';
import { resolveDisplaySrc } from '../data/previewImage';
import { useGame } from '../state/GameContext';
import ProgressBar from './ProgressBar';
import DialogueBox from './DialogueBox';
import ChoiceCard from './ChoiceCard';
import CharacterDisplay from './CharacterDisplay';
import SoundToggle from './SoundToggle';
import { SparkleIcon, FoldIcon, CheckBadgeIcon } from './icons';

const SCENE5_ICONS = { A: SparkleIcon, B: FoldIcon, C: CheckBadgeIcon };

// 상황 5는 새 옷을 사거나 갈아입지 않고, 지금까지 고른 아이템 중 일부를
// "정돈"하는 행동이므로 전용 이미지가 없다. 앞선 선택 결과에서 실제로
// 가지고 있는 아이템만 골라 보여주고, 없으면 대체 아이템이나 아이콘만 보여준다.
function getScene5CardItems(choiceId, answers) {
  const scene3Choice = getChoice('scene3', answers.scene3);
  const scene4Choice = getChoice('scene4', answers.scene4);
  const accessoriesChoice = getChoice('scene3Accessories', answers.scene3Accessories);
  const scene3Top = scene3Choice?.items.find((id) => id.startsWith('T'));

  if (choiceId === 'A') {
    return scene3Top ? [scene3Top] : [];
  }
  if (choiceId === 'B') {
    // 이 카드가 보여주는 "방해되는 겉옷·가방"은 상황4에서 고른 겉옷(T06/T07/T08)과
    // 오늘(이야기2) 신발·가방 선택에서 고른 가방이다. 이야기1의 가디건·점퍼는
    // 며칠 전 다른 날의 선택이므로 이 카드 이미지에는 반영하지 않는다.
    const items = [];
    const outer = scene4Choice?.items.find((id) => id.startsWith('T'));
    if (outer) items.push(outer);
    const bag = accessoriesChoice?.items.find((id) => id === 'A01' || id === 'A02');
    if (bag) items.push(bag);
    return items;
  }
  if (choiceId === 'C') {
    const hasKeyring = accessoriesChoice?.items.includes('A03');
    if (hasKeyring) return ['A03'];
    return scene3Top ? [scene3Top] : [];
  }
  return [];
}

function buildCardImages(itemIds, character, favoriteColor) {
  return itemIds.map((id) => ({
    src: getItemImage(id, character, favoriteColor),
    fallbackSrc: getItemImage(id, character),
    alt: getItemName(id),
  }));
}

export default function SceneScreen() {
  const {
    currentScene: scene,
    sceneIndex,
    totalScenes,
    phase,
    character,
    favoriteColor,
    answers,
    wardrobe,
    pendingChoiceId,
    selectChoice,
    goToChoicePhase,
    confirmChoice,
    advanceAfterResult,
    soundOn,
    toggleSound,
  } = useGame();

  const isLastScene = sceneIndex === totalScenes - 1;

  const chosenId = answers[scene.id];
  const chosenChoice = chosenId ? scene.choices.find((c) => c.id === chosenId) : null;

  // 카드를 눌러본 것만 임시로(확정하지 않고) 화면에 반영한다: 확정된 answers/wardrobe에
  // "지금 이 장면에서 눌러본 카드 하나"만 얹어서 미리보기용 값을 만든다. 실제
  // answers·wardrobe·대사는 '이 옷차림으로 선택하기'를 눌러야만 바뀐다.
  const isPreviewing = phase === 'choice' && Boolean(pendingChoiceId);
  const previewAnswers = isPreviewing ? { ...answers, [scene.id]: pendingChoiceId } : answers;
  const previewWardrobe = isPreviewing
    ? [...wardrobe, buildWardrobeEntry(scene.id, getChoice(scene.id, pendingChoiceId))]
    : wardrobe;

  // 선택 단계에서는 카드 3개 중 어느 것을 눌러도 곧바로 비교할 수 있도록,
  // 이 장면의 후보 이미지만 미리 불러와 둔다(다른 장면·색상까지 전부는 아님).
  const prefetchSrcs =
    phase === 'choice'
      ? scene.choices.map((choice) =>
          resolveDisplaySrc({
            story: scene.story,
            answers: { ...answers, [scene.id]: choice.id },
            activeSceneId: scene.id,
            character,
            favoriteColor,
          })
        )
      : [];

  const lines = [];
  if (phase === 'intro') {
    lines.push(...scene.intro);
  } else if (phase === 'result' && chosenChoice) {
    const resultText = chosenChoice.getResult ? chosenChoice.getResult(answers) : chosenChoice.result;
    lines.push({ speaker: '나', text: resultText });
    if (scene.getFollowUp) {
      const follow = scene.getFollowUp(answers);
      if (follow) lines.push({ speaker: '내레이션', text: follow });
    }
    if (scene.commonAfterResult) lines.push(...scene.commonAfterResult);
    if (scene.getTailNotes) {
      scene.getTailNotes(answers).forEach((note) => lines.push({ speaker: '내레이션', text: note }));
    }
    if (scene.outro) lines.push(...scene.outro);
  }

  return (
    <div className="screen scene-screen">
      <div className="scene-screen__topbar">
        <ProgressBar
          storyLabel={scene.storyLabel}
          current={scene.storyStep}
          total={scene.storyTotal}
          location={scene.location}
          title={scene.title}
        />
        <SoundToggle soundOn={soundOn} onToggle={toggleSound} />
      </div>

      <CharacterDisplay
        character={character}
        wardrobe={previewWardrobe}
        favoriteColor={favoriteColor}
        answers={previewAnswers}
        activeSceneId={scene.id}
        prefetchSrcs={prefetchSrcs}
        story={scene.story}
        compact
      />

      <DialogueBox lines={lines} />

      {phase === 'intro' && (
        <button type="button" className="btn btn--primary btn--large" onClick={goToChoicePhase}>
          선택하러 가기
        </button>
      )}

      {phase === 'choice' && (
        <>
          <p className="scene-screen__prompt">마음에 드는 선택을 골라 보세요.</p>
          <div className={`choice-grid${scene.layout === 'compare' ? ' choice-grid--compare' : ''}`}>
            {scene.choices.map((choice) => {
              let images = [];
              let icon = null;
              if (scene.layout === 'action') {
                const itemIds = getScene5CardItems(choice.id, answers);
                images = buildCardImages(itemIds, character, favoriteColor);
                const Icon = SCENE5_ICONS[choice.id];
                icon = Icon ? <Icon /> : null;
              } else {
                images = buildCardImages(choice.items, character, favoriteColor);
              }
              return (
                <ChoiceCard
                  key={choice.id}
                  images={images}
                  icon={icon}
                  label={choice.label}
                  selected={pendingChoiceId === choice.id}
                  compact={scene.layout === 'compare'}
                  onClick={() => selectChoice(choice.id)}
                />
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--large"
            disabled={!pendingChoiceId}
            onClick={confirmChoice}
          >
            이 옷차림으로 선택하기
          </button>
        </>
      )}

      {phase === 'result' && (
        <button type="button" className="btn btn--primary btn--large" onClick={advanceAfterResult}>
          {isLastScene ? '오늘의 기록 보러 가기' : '다음 장면으로'}
        </button>
      )}
    </div>
  );
}

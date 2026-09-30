import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTER_BASE_IMAGES, getItemImage, getItemName } from '../data/assetMap';
import { resolveDisplaySrc } from '../data/previewImage';

// 겉옷·가방·키링에 해당하는 아이템 ID (상황5 "정리"를 골랐을 때
// "지금까지 고른 것" 목록에서도 함께 감추기 위해 씀).
const OUTER_ITEM_IDS = new Set(['T06', 'T07', 'T08']); // 상황4 겉옷
const BAG_ITEM_IDS = new Set(['A01', 'A02', 'A03']); // 신발·가방 선택의 가방·키링 (신발 S01/S02는 유지)

// 이야기1(상황1~2)의 장면 ID. 이야기2가 시작되면 캐릭터 이미지가 기본
// 캐릭터로 돌아가므로, "지금까지 고른 것" 칩 목록도 현재 이야기에 해당하는
// 것만 보여준다(이야기1의 가디건·운동화 등을 이야기2에서 계속 보여주지 않는다).
const STORY1_SCENE_IDS = new Set(['scene1', 'scene2']);

// 카드를 눌러볼 때마다 이미지를 새로 요청하되, 그 이미지가 실제로 다 불러와질
// 때까지는 화면에 이전 모습을 그대로 유지한다(기본 캐릭터로 잠깐 돌아가며
// 깜빡이는 것을 막기 위함). 새 이미지 로드가 실패하면 onFail로 알려서
// 호출 쪽의 색상->무색->기본 대체 로직이 다음 후보를 시도하게 한다.
// 빠르게 여러 이미지를 연달아 요청해도(카드를 빠르게 여러 번 누름) 항상
// "마지막으로 요청한 이미지"의 로드 결과만 반영되도록 매 호출마다 순번을
// 새로 매겨 이전 요청의 결과는 무시한다.
function useStableImageSrc(targetSrc, onFail) {
  const [displayed, setDisplayed] = useState(targetSrc);
  const [loading, setLoading] = useState(false);
  const displayedRef = useRef(targetSrc);
  const seqRef = useRef(0);

  useEffect(() => {
    const mySeq = (seqRef.current += 1);

    if (!targetSrc) {
      displayedRef.current = null;
      setDisplayed(null);
      setLoading(false);
      return undefined;
    }
    if (targetSrc === displayedRef.current) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const img = new Image();
    img.onload = () => {
      if (seqRef.current !== mySeq) return; // 그 사이 다른 이미지로 또 바뀜 -> 이 결과는 버림
      displayedRef.current = targetSrc;
      setDisplayed(targetSrc);
      setLoading(false);
    };
    img.onerror = () => {
      if (seqRef.current !== mySeq) return;
      setLoading(false);
      onFail?.(targetSrc);
    };
    img.src = targetSrc;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- displayedRef로 최신값을 비교하므로 targetSrc 변화에만 반응하면 된다.
  }, [targetSrc]);

  return [displayed, loading];
}

// 캐릭터 표시 영역.
// - 코디가 아직 완성되지 않았으면(상황3·4·신발가방 선택이 다 모이기 전) 기본
//   캐릭터 그림 + 지금까지 고른 아이템의 작은 썸네일 목록을 보여준다.
// - 상의·하의 + 신발·가방까지 고르면(상황4 겉옷 전) "겉옷 없음" 이미지로 미리 보여준다.
// - 상황4까지 선택을 마치면 완성 코디 이미지로 전환한다.
// - 상황5에서 "겉옷·가방 정리"(id 'B')를 고르면, 그 순간부터 겉옷·가방·키링이
//   빠진 "정리 후" 이미지로 다시 전환한다(신발·안에 입은 상의·하의는 그대로).
// - 신발·가방 선택에서 키링이 달린 C를 고른 학생이 상황5에서 "포인트 소품
//   정돈"(id 'C')을 고르면, 키링만 빠진 모습으로 전환한다(겉옷·상의·하의·
//   신발·가방은 그대로). 어느 이미지를 보여줄지는 getDisplayOutfit() 한 곳에서만
//   결정한다.
// - 이야기1(상황1~2)에서는 상황1(겉옷) 확정 시 해당 겉옷만 반영한 이미지를,
//   상황2(신발·가방)까지 확정되면 겉옷+신발·가방을 합친 이미지를 보여준다.
//   이야기1 이미지는 T05·favoriteColor와 전혀 무관하다(색상 버전이 없다).
// - T05(선호 색 무지티)가 보이는 이미지는 favoriteColor에 맞는 색상 버전을 쓴다.
// - 색상 버전 로드에 실패하면 같은 착용 상태의 기본(무색) 이미지로, 그것도
//   실패하면 기본 캐릭터로 단계적으로 자동 복귀한다.
// - answers는 확정값이거나(장면 진행 중 intro/result), "확정값 + 지금 눌러본
//   카드 하나"를 합친 미리보기 값(선택 중 choice)일 수 있다 - 어느 쪽이든
//   이 컴포넌트는 그대로 표시만 하고, 실제 기록(wardrobe/answers)을 바꾸지
//   않는다. activeSceneId는 지금 고르고 있는 장면의 id로, 상황3의 두 단계를
//   구분하는 데 쓰인다.
export default function CharacterDisplay({
  character,
  wardrobe,
  favoriteColor,
  answers,
  activeSceneId,
  prefetchSrcs,
  story = 2,
  compact = false,
  large = false,
}) {
  const [failedSrcs, setFailedSrcs] = useState(() => new Set());
  const markFailed = useCallback(
    (src) => setFailedSrcs((prev) => (!src || prev.has(src) ? prev : new Set(prev).add(src))),
    []
  );

  const coloredSrc = resolveDisplaySrc({ story, answers, activeSceneId, character, favoriteColor });
  // 이야기1 이미지는 색상 변형이 없으므로 대체용 "무색 버전"이 따로 없다(실패하면 바로 기본 캐릭터로).
  const baseSrc = story === 1 ? null : resolveDisplaySrc({ story, answers, activeSceneId, character, favoriteColor: null });
  const targetSrc = !coloredSrc ? null : failedSrcs.has(coloredSrc) ? (baseSrc && !failedSrcs.has(baseSrc) ? baseSrc : null) : coloredSrc;

  const [displayedSrc, isLoading] = useStableImageSrc(targetSrc, markFailed);
  const showImage = Boolean(displayedSrc);

  // 선택 단계에서 비교할 후보(카드별로 눌렀을 때 나올) 이미지만 미리 불러와
  // 둔다. 이미 브라우저 캐시에 있으면 아무 일도 하지 않으므로 안전하다.
  const prefetchKey = (prefetchSrcs ?? []).filter(Boolean).join('|');
  useEffect(() => {
    if (!prefetchKey) return;
    prefetchKey.split('|').forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [prefetchKey]);

  const isDecluttered = story === 2 && answers?.scene5 === 'B';
  const isKeyringRemoved = story === 2 && answers?.scene5 === 'C' && answers?.scene3Accessories === 'C';

  const rootClass = [
    'character-display',
    compact && 'character-display--compact',
    large && 'character-display--large',
    showImage && 'character-display--outfit-ready',
  ]
    .filter(Boolean)
    .join(' ');

  const visibleWardrobe = wardrobe
    .filter((entry) => STORY1_SCENE_IDS.has(entry.sceneId) === (story === 1))
    .filter((entry) => !(isDecluttered && entry.items.some((id) => OUTER_ITEM_IDS.has(id))))
    .map((entry) => {
      if (isDecluttered) return { ...entry, items: entry.items.filter((id) => !BAG_ITEM_IDS.has(id)) };
      if (isKeyringRemoved) return { ...entry, items: entry.items.filter((id) => id !== 'A03') };
      return entry;
    });

  const imageAlt =
    story === 1
      ? '오늘 아침 옷차림'
      : isDecluttered
        ? '겉옷·가방을 정리한 오늘의 코디'
        : isKeyringRemoved
          ? '키링을 정리한 오늘의 코디'
          : '완성된 오늘의 코디';

  return (
    <div className={rootClass}>
      <div className="character-display__figure">
        {showImage ? (
          <img
            key={displayedSrc}
            className="character-display__base"
            src={displayedSrc}
            alt={`${imageAlt} (${character === 'girl' ? '여학생' : '남학생'})`}
            onError={() => markFailed(displayedSrc)}
          />
        ) : (
          <img
            className="character-display__base"
            src={CHARACTER_BASE_IMAGES[character]}
            alt={character === 'girl' ? '여학생 기본 캐릭터' : '남학생 기본 캐릭터'}
          />
        )}
        {isLoading && <span className="character-display__loading" aria-hidden="true" />}
      </div>
      {visibleWardrobe.length > 0 && (
        <div className="character-display__wardrobe">
          <p className="character-display__wardrobe-title">지금까지 고른 것</p>
          <ul className="character-display__chips">
            {visibleWardrobe.map((entry, idx) =>
              entry.items.length > 0 ? (
                entry.items.map((itemId) => {
                  const tinted = itemId === entry.tintItem;
                  const chipColoredSrc = getItemImage(itemId, character, tinted ? favoriteColor : undefined);
                  const chipBaseSrc = getItemImage(itemId, character, undefined);
                  const chipSrc = failedSrcs.has(chipColoredSrc) ? chipBaseSrc : chipColoredSrc;
                  return (
                    <li className="wardrobe-chip" key={`${idx}-${itemId}`}>
                      <img
                        src={chipSrc}
                        alt={getItemName(itemId)}
                        loading="lazy"
                        decoding="async"
                        onError={() => markFailed(chipSrc)}
                      />
                      <span>{getItemName(itemId)}</span>
                    </li>
                  );
                })
              ) : (
                <li className="wardrobe-chip wardrobe-chip--text" key={`${idx}-action`}>
                  <span>{entry.tag}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

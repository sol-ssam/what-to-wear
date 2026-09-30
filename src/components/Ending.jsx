import { useState } from 'react';
import { ENDING } from '../data/story';
import { useGame } from '../state/GameContext';
import CharacterDisplay from './CharacterDisplay';

export default function Ending() {
  const { displayName, character, favoriteColor, wardrobe, answers, restart } = useGame();
  const [reflections, setReflections] = useState(['', '']);

  return (
    <div className="screen ending-screen">
      <h2 className="ending-screen__title">{ENDING.title}</h2>
      <p className="ending-screen__hello">{displayName}님이 고른 오늘 하루예요.</p>

      {/* 최종 캐릭터는 이야기2(오늘 코디)의 최종 착용 상태를 보여준다. */}
      <CharacterDisplay
        character={character}
        wardrobe={wardrobe}
        favoriteColor={favoriteColor}
        answers={answers}
        story={2}
        large
      />

      <p className="ending-screen__fixed-line">{ENDING.fixedLine}</p>

      <div className="ending-summary-group">
        {ENDING.storySummaries.map((story) => (
          <div key={story.storyLabel} className="ending-summary-block">
            <p className="ending-summary-block__title">{story.storyLabel}</p>
            <ul className="ending-summary">
              {story.rows.map((row) => {
                const entry = wardrobe.find((w) => w.sceneId === row.sceneId);
                return (
                  <li key={row.sceneId} className="ending-summary__row">
                    <span className="ending-summary__label">{row.label}</span>
                    <span className="ending-summary__tag">{entry?.tag ?? '-'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="ending-reflect">
        {ENDING.reflectQuestions.map((q, i) => (
          <label key={i} className="field">
            <span className="field__label">{q}</span>
            <textarea
              className="field__input field__input--textarea"
              rows={2}
              value={reflections[i]}
              onChange={(e) =>
                setReflections((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
            />
          </label>
        ))}
        <p className="ending-reflect__note">이 답변은 저장되지 않아요. 생각을 정리하는 용도로만 써 보세요.</p>
      </div>

      <button type="button" className="btn btn--primary btn--large" onClick={restart}>
        다시 해 보기
      </button>
    </div>
  );
}

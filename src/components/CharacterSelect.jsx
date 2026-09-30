import { CHARACTER_BASE_IMAGES } from '../data/assetMap';
import { FAVORITE_COLORS } from '../data/colorPalette';
import { useGame } from '../state/GameContext';

export default function CharacterSelect() {
  const { character, setCharacter, nickname, setNickname, favoriteColor, setFavoriteColor, confirmCharacterSelect } =
    useGame();

  return (
    <div className="screen select-screen">
      <h2 className="select-screen__heading">캐릭터를 골라 볼까?</h2>

      <div className="character-options">
        <button
          type="button"
          className={`character-option${character === 'boy' ? ' character-option--selected' : ''}`}
          onClick={() => setCharacter('boy')}
          aria-pressed={character === 'boy'}
        >
          <img src={CHARACTER_BASE_IMAGES.boy} alt="남학생 캐릭터" />
          <span>남학생</span>
        </button>
        <button
          type="button"
          className={`character-option${character === 'girl' ? ' character-option--selected' : ''}`}
          onClick={() => setCharacter('girl')}
          aria-pressed={character === 'girl'}
        >
          <img src={CHARACTER_BASE_IMAGES.girl} alt="여학생 캐릭터" />
          <span>여학생</span>
        </button>
      </div>

      <label className="field">
        <span className="field__label">닉네임 (선택 사항)</span>
        <input
          type="text"
          className="field__input"
          placeholder="입력하지 않으면 '오늘'로 진행돼요"
          maxLength={8}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </label>

      <div className="field">
        <span className="field__label">좋아하는 색</span>
        <div className="color-options">
          {FAVORITE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`color-swatch${favoriteColor === c.id ? ' color-swatch--selected' : ''}`}
              style={{ backgroundColor: c.swatch }}
              onClick={() => setFavoriteColor(c.id)}
              aria-pressed={favoriteColor === c.id}
              aria-label={c.label}
            >
              {favoriteColor === c.id && <span className="color-swatch__check">✓</span>}
            </button>
          ))}
        </div>
        <p className="field__hint">상황 3에서 내가 좋아하는 색 상의를 고를 때 반영돼요.</p>
      </div>

      <button type="button" className="btn btn--primary btn--large" onClick={confirmCharacterSelect}>
        하루 시작하기
      </button>
    </div>
  );
}

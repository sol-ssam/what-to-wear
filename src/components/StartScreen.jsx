import { MAIN_IMAGE } from '../data/assetMap';
import { useGame } from '../state/GameContext';
import SoundToggle from './SoundToggle';

export default function StartScreen() {
  const { startGame, soundOn, toggleSound } = useGame();

  return (
    <div className="screen start-screen">
      <div className="start-screen__sound">
        <SoundToggle soundOn={soundOn} onToggle={toggleSound} />
      </div>
      <img className="start-screen__hero" src={MAIN_IMAGE} alt="오늘 뭐 입지 대표 이미지" />
      <h1 className="start-screen__title">오늘 뭐 입지?</h1>
      <p className="start-screen__subtitle">부제: 선택에 따라 달라지는 나의 하루</p>
      <p className="start-screen__desc">
        오늘은 학교 밖으로 체험활동을 가는 날! 그런데 아침부터 일정이 조금씩 달라지기 시작한다.
        상황에 맞는 옷차림을 골라 보자.
      </p>
      <button type="button" className="btn btn--primary btn--large" onClick={startGame}>
        하루 시작하기
      </button>
    </div>
  );
}

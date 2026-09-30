import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SCENES, getChoice, buildWardrobeEntry } from '../data/story';
import { playClick } from '../utils/sound';

const GameContext = createContext(null);

const DEFAULT_NICKNAME = { boy: '오늘', girl: '오늘' };

export function GameProvider({ children }) {
  const [screen, setScreen] = useState('start'); // start | select | play | story1-end | story2-intro | ending
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState('intro'); // intro | choice | result
  const [character, setCharacter] = useState('girl');
  const [nickname, setNickname] = useState('');
  const [favoriteColor, setFavoriteColor] = useState('blue');
  const [answers, setAnswers] = useState({});
  const [wardrobe, setWardrobe] = useState([]);
  const [pendingChoiceId, setPendingChoiceId] = useState(null);
  const [soundOn, setSoundOn] = useState(false);

  const currentScene = SCENES[sceneIndex];
  const displayName = nickname.trim() || DEFAULT_NICKNAME[character];

  const toggleSound = useCallback(() => setSoundOn((v) => !v), []);
  const click = useCallback(() => playClick(soundOn), [soundOn]);

  const startGame = useCallback(() => {
    click();
    setScreen('select');
  }, [click]);

  const confirmCharacterSelect = useCallback(() => {
    click();
    setScreen('play');
    setSceneIndex(0);
    setPhase('intro');
  }, [click]);

  const goToChoicePhase = useCallback(() => {
    click();
    setPendingChoiceId(null);
    setPhase('choice');
  }, [click]);

  const selectChoice = useCallback(
    (choiceId) => {
      click();
      setPendingChoiceId(choiceId);
    },
    [click]
  );

  const confirmChoice = useCallback(() => {
    if (!pendingChoiceId) return;
    click();
    const choice = getChoice(currentScene.id, pendingChoiceId);
    setAnswers((prev) => ({ ...prev, [currentScene.id]: pendingChoiceId }));
    setWardrobe((prev) => [...prev, buildWardrobeEntry(currentScene.id, choice)]);
    setPhase('result');
  }, [click, currentScene, pendingChoiceId]);

  const advanceAfterResult = useCallback(() => {
    click();
    // 상황2(이야기1의 마지막 장면)를 마치면 곧바로 다음 장면으로 넘어가지 않고,
    // 이야기1 마무리 화면을 먼저 보여준다.
    if (currentScene.id === 'scene2') {
      setScreen('story1-end');
      return;
    }
    if (sceneIndex < SCENES.length - 1) {
      setSceneIndex((i) => i + 1);
      setPhase('intro');
      setPendingChoiceId(null);
    } else {
      setScreen('ending');
    }
  }, [click, sceneIndex, currentScene]);

  const goToStory2Intro = useCallback(() => {
    click();
    setScreen('story2-intro');
  }, [click]);

  const startStory2 = useCallback(() => {
    click();
    const idx = SCENES.findIndex((s) => s.id === 'scene3');
    setSceneIndex(idx);
    setPhase('intro');
    setPendingChoiceId(null);
    setScreen('play');
  }, [click]);

  const restart = useCallback(() => {
    click();
    setScreen('start');
    setSceneIndex(0);
    setPhase('intro');
    setAnswers({});
    setWardrobe([]);
    setPendingChoiceId(null);
  }, [click]);

  const value = useMemo(
    () => ({
      screen,
      currentScene,
      sceneIndex,
      totalScenes: SCENES.length,
      phase,
      character,
      setCharacter,
      nickname,
      setNickname,
      displayName,
      favoriteColor,
      setFavoriteColor,
      answers,
      wardrobe,
      pendingChoiceId,
      soundOn,
      toggleSound,
      startGame,
      confirmCharacterSelect,
      goToChoicePhase,
      selectChoice,
      confirmChoice,
      advanceAfterResult,
      goToStory2Intro,
      startStory2,
      restart,
    }),
    [
      screen,
      currentScene,
      sceneIndex,
      phase,
      character,
      nickname,
      displayName,
      favoriteColor,
      answers,
      wardrobe,
      pendingChoiceId,
      soundOn,
      toggleSound,
      startGame,
      confirmCharacterSelect,
      goToChoicePhase,
      selectChoice,
      confirmChoice,
      advanceAfterResult,
      goToStory2Intro,
      startStory2,
      restart,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame은 GameProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}

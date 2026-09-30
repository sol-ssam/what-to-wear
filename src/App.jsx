import './App.css';
import { GameProvider, useGame } from './state/GameContext';
import { STORY_TRANSITION } from './data/story';
import StartScreen from './components/StartScreen';
import CharacterSelect from './components/CharacterSelect';
import SceneScreen from './components/SceneScreen';
import TransitionScreen from './components/TransitionScreen';
import Ending from './components/Ending';

function GameShell() {
  const { screen, goToStory2Intro, startStory2 } = useGame();

  if (screen === 'start') return <StartScreen />;
  if (screen === 'select') return <CharacterSelect />;
  if (screen === 'play') return <SceneScreen />;
  if (screen === 'story1-end') {
    return <TransitionScreen {...STORY_TRANSITION.story1End} tone="story1" onContinue={goToStory2Intro} />;
  }
  if (screen === 'story2-intro') {
    return <TransitionScreen {...STORY_TRANSITION.story2Intro} tone="story2" onContinue={startStory2} />;
  }
  return <Ending />;
}

export default function App() {
  return (
    <GameProvider>
      <div className="app-frame">
        <GameShell />
      </div>
    </GameProvider>
  );
}

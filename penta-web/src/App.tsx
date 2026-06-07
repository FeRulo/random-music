import { useGameEngine } from './hooks/useGameEngine';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';

export default function App() {
  const { state, startGame, pressKey, beat, tick, reset, togglePause } = useGameEngine();

  if (state.phase === 'menu') {
    return <MainMenu onStart={startGame} initialSettings={state.settings} />;
  }

  if (state.phase === 'playing') {
    return <GameScreen state={state} onKey={pressKey} onBeat={beat} onTick={tick} onMenu={reset} onTogglePause={togglePause} />;
  }

  // result
  return (
    <ResultScreen
      state={state}
      onPlayAgain={() => startGame(state.settings)}
      onMenu={reset}
    />
  );
}

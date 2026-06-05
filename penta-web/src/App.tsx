import { useGameEngine } from './hooks/useGameEngine';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';

export default function App() {
  const { state, startGame, pressKey, tick, reset } = useGameEngine();

  if (state.phase === 'menu') {
    return <MainMenu onStart={startGame} />;
  }

  if (state.phase === 'playing') {
    return <GameScreen state={state} onKey={pressKey} onTick={tick} onMenu={reset} />;
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

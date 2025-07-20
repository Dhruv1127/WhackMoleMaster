import { useState, useEffect, useRef, useCallback } from "react";
import { Hammer, Trophy, Clock, Play, RotateCcw, CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameState {
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  highScore: number;
  gameOver: boolean;
}

export default function WhackAMole() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 30,
    isPlaying: false,
    highScore: parseInt(localStorage.getItem('whackMoleHighScore') || '0'),
    gameOver: false
  });

  const [visibleMoles, setVisibleMoles] = useState<Set<number>>(new Set());
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Sound effects using Web Audio API
  const playHitSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const playGameStartSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const playGameEndSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const showRandomMole = useCallback(() => {
    if (!gameState.isPlaying) return;

    const holeIndex = Math.floor(Math.random() * 9);
    
    setVisibleMoles(prev => new Set([...prev, holeIndex]));

    // Auto-hide mole after random time (1-2 seconds)
    const hideTimeout = setTimeout(() => {
      setVisibleMoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(holeIndex);
        return newSet;
      });
      moleTimeoutsRef.current.delete(holeIndex);
    }, Math.random() * 1000 + 1000);

    moleTimeoutsRef.current.set(holeIndex, hideTimeout);
  }, [gameState.isPlaying]);

  const hitMole = useCallback((holeIndex: number) => {
    if (!gameState.isPlaying || !visibleMoles.has(holeIndex)) return;

    // Clear the auto-hide timeout
    const timeout = moleTimeoutsRef.current.get(holeIndex);
    if (timeout) {
      clearTimeout(timeout);
      moleTimeoutsRef.current.delete(holeIndex);
    }

    // Hide mole immediately
    setVisibleMoles(prev => {
      const newSet = new Set(prev);
      newSet.delete(holeIndex);
      return newSet;
    });

    // Increase score
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1
    }));

    // Play hit sound
    playHitSound();
  }, [gameState.isPlaying, visibleMoles, playHitSound]);

  const startGame = useCallback(() => {
    if (gameState.isPlaying) return;

    playGameStartSound();

    setGameState(prev => ({
      ...prev,
      score: 0,
      timeLeft: 30,
      isPlaying: true,
      gameOver: false
    }));

    setVisibleMoles(new Set());
    setShowGameOverModal(false);

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          return { ...prev, timeLeft: 0, isPlaying: false, gameOver: true };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);

    // Start mole spawning
    moleIntervalRef.current = setInterval(showRandomMole, 800);
  }, [gameState.isPlaying, playGameStartSound, showRandomMole]);

  const endGame = useCallback(() => {
    setGameState(prev => {
      const newHighScore = Math.max(prev.score, prev.highScore);
      if (newHighScore > prev.highScore) {
        localStorage.setItem('whackMoleHighScore', newHighScore.toString());
      }
      return {
        ...prev,
        isPlaying: false,
        gameOver: true,
        highScore: newHighScore
      };
    });

    // Clear intervals
    if (moleIntervalRef.current) {
      clearInterval(moleIntervalRef.current);
      moleIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Clear all mole timeouts
    moleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    moleTimeoutsRef.current.clear();

    // Hide all moles
    setVisibleMoles(new Set());

    // Show game over modal
    setTimeout(() => {
      setShowGameOverModal(true);
      playGameEndSound();
    }, 500);
  }, [playGameEndSound]);

  const restartGame = useCallback(() => {
    // Stop current game
    if (moleIntervalRef.current) {
      clearInterval(moleIntervalRef.current);
      moleIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Clear all mole timeouts
    moleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    moleTimeoutsRef.current.clear();

    setVisibleMoles(new Set());
    setShowGameOverModal(false);

    // Start new game
    setTimeout(() => startGame(), 100);
  }, [startGame]);

  // Effect to handle game over when timer reaches 0
  useEffect(() => {
    if (gameState.timeLeft <= 0 && gameState.isPlaying) {
      endGame();
    }
  }, [gameState.timeLeft, gameState.isPlaying, endGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      moleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const holes = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Game Header */}
      <header className="text-center py-8">
        <h1 className="text-5xl font-black text-gray-800 mb-2 flex items-center justify-center gap-3">
          <Hammer className="text-yellow-500" size={48} />
          Whack-a-Mole
        </h1>
        <p className="text-gray-600 text-lg font-medium">Test your reflexes in this classic arcade game!</p>
      </header>

      <div className="max-w-4xl mx-auto px-4">
        {/* Game Info */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <Card className="bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 border-0">
            <Trophy className="text-yellow-500" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-600">Score</p>
              <p className="text-2xl font-bold text-gray-800">{gameState.score}</p>
            </div>
          </Card>
          <Card className="bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 border-0">
            <Clock className="text-red-500" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-600">Time</p>
              <p className="text-2xl font-bold text-gray-800">{gameState.timeLeft}</p>
            </div>
          </Card>
        </div>

        {/* Game Board */}
        <div className="game-container bg-gradient-to-br from-green-200 to-green-300 rounded-3xl p-8 shadow-xl mb-8">
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            {holes.map((holeIndex) => (
              <div
                key={holeIndex}
                className="hole relative w-24 h-24 md:w-32 md:h-32 bg-amber-900 rounded-full shadow-inner border-4 border-amber-800 overflow-hidden cursor-pointer transform transition-transform duration-150 hover:scale-105"
                onClick={() => hitMole(holeIndex)}
              >
                <div className="hole-shadow absolute inset-2 bg-black bg-opacity-30 rounded-full"></div>
                <div
                  className={`mole absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 bg-yellow-400 rounded-full shadow-lg border-2 border-yellow-500 transition-transform duration-300 ease-out ${
                    visibleMoles.has(holeIndex) ? 'translate-y-0' : 'translate-y-full'
                  }`}
                >
                  {/* Mole face */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500 rounded-full relative">
                      {/* Eyes */}
                      <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full"></div>
                      {/* Nose */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full"></div>
                      {/* Smile */}
                      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-3 h-1 border-b-2 border-black rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={startGame}
            disabled={gameState.isPlaying}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="mr-2" size={20} />
            Start Game
          </Button>
          <Button
            onClick={restartGame}
            disabled={!gameState.isPlaying && !gameState.gameOver}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="mr-2" size={20} />
            Restart
          </Button>
        </div>

        {/* High Score */}
        <div className="text-center mb-8">
          <Card className="bg-white rounded-2xl shadow-lg px-6 py-4 inline-block border-0">
            <p className="text-sm font-medium text-gray-600 mb-1">High Score</p>
            <p className="text-3xl font-bold text-indigo-600">{gameState.highScore}</p>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-white rounded-2xl shadow-lg p-6 border-0">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CircleOff className="text-blue-500 mr-2" size={20} />
            How to Play
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Click "Start Game" to begin the 30-second challenge
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Moles will randomly pop up from holes - click them quickly!
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Each successful hit earns you 1 point
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Try to get the highest score before time runs out!
            </li>
          </ul>
        </Card>
      </div>

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl transform scale-100 transition-transform duration-300 border-0">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <p className="text-gray-600 mb-2">Your Score:</p>
            <p className="text-5xl font-bold text-indigo-600 mb-6">{gameState.score}</p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowGameOverModal(false);
                  setTimeout(() => startGame(), 300);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-150 hover:scale-105"
              >
                <Play className="mr-2" size={16} />
                Play Again
              </Button>
              <Button
                onClick={() => setShowGameOverModal(false)}
                variant="secondary"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transform transition-all duration-150 hover:scale-105"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

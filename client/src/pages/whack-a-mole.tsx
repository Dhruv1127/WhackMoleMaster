import { useState, useEffect, useRef, useCallback } from "react";
import { Hammer, Trophy, Clock, Play, RotateCcw, CircleOff, Home, X, Star, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

interface GameState {
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  highScore: number;
  gameOver: boolean;
  level: 'easy' | 'medium' | 'hard';
  currentView: 'home' | 'game' | 'gameOver';
}

export default function WhackAMole() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 30,
    isPlaying: false,
    highScore: parseInt(localStorage.getItem('whackMoleHighScore') || '0'),
    gameOver: false,
    level: 'easy',
    currentView: 'home'
  });

  const [visibleMoles, setVisibleMoles] = useState<Set<number>>(new Set());
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [hitMoles, setHitMoles] = useState<Set<number>>(new Set());
  const [backgroundMusic, setBackgroundMusic] = useState<boolean>(true);
  const [moleVariations, setMoleVariations] = useState<Map<number, string>>(new Map());
  
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Enhanced Audio System using Web Audio API
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playHitSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
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
  }, [getAudioContext]);

  const playMissSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playGameStartSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
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
  }, [getAudioContext]);

  const playGameEndSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
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
  }, [getAudioContext]);

  // Background music function
  const playBackgroundMusic = useCallback(() => {
    if (!backgroundMusic) return;
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 1);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 2);
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 3);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + 4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 4);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [getAudioContext, backgroundMusic]);

  // Level configuration with improved spawning rates
  const getLevelConfig = useCallback((level: 'easy' | 'medium' | 'hard') => {
    switch (level) {
      case 'easy':
        return { moleInterval: 1000, moleVisibleTime: 2500, gameTime: 30, maxConcurrentMoles: 1 };
      case 'medium':
        return { moleInterval: 700, moleVisibleTime: 1800, gameTime: 45, maxConcurrentMoles: 2 };
      case 'hard':
        return { moleInterval: 400, moleVisibleTime: 1200, gameTime: 60, maxConcurrentMoles: 3 };
      default:
        return { moleInterval: 1000, moleVisibleTime: 2500, gameTime: 30, maxConcurrentMoles: 1 };
    }
  }, []);

  const showRandomMole = useCallback(() => {
    if (!gameState.isPlaying) {
      console.log('Game not playing, skipping mole spawn');
      return;
    }

    const levelConfig = getLevelConfig(gameState.level);
    console.log('Spawning mole - current visible:', visibleMoles.size, 'max:', levelConfig.maxConcurrentMoles);
    
    // Check if we've reached maximum concurrent moles for this level
    if (visibleMoles.size >= levelConfig.maxConcurrentMoles) {
      console.log('Max moles reached, retrying in', levelConfig.moleInterval / 2, 'ms');
      setTimeout(showRandomMole, levelConfig.moleInterval / 2);
      return;
    }
    
    // Find available holes (not currently occupied)
    const availableHoles = Array.from({ length: 9 }, (_, i) => i).filter(
      index => !visibleMoles.has(index) && !moleTimeoutsRef.current.has(index)
    );
    
    console.log('Available holes:', availableHoles);
    
    // If no holes available, try again in a shorter time
    if (availableHoles.length === 0) {
      console.log('No holes available, retrying in', levelConfig.moleInterval / 3, 'ms');
      setTimeout(showRandomMole, levelConfig.moleInterval / 3);
      return;
    }
    
    // Select random hole from available ones
    const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    console.log('Spawning mole in hole:', holeIndex);
    
    // Add random mole variation
    const moleTypes = ['normal', 'angry', 'sleepy', 'surprised'];
    const randomType = moleTypes[Math.floor(Math.random() * moleTypes.length)];
    setMoleVariations(prev => new Map(prev.set(holeIndex, randomType)));
    
    setVisibleMoles(prev => {
      const newSet = new Set([...prev, holeIndex]);
      console.log('Updated visible moles:', newSet);
      return newSet;
    });

    // Auto-hide mole after level-based time
    const hideTimeout = setTimeout(() => {
      console.log('Auto-hiding mole in hole:', holeIndex);
      setVisibleMoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(holeIndex);
        return newSet;
      });
      setMoleVariations(prev => {
        const newMap = new Map(prev);
        newMap.delete(holeIndex);
        return newMap;
      });
      moleTimeoutsRef.current.delete(holeIndex);
    }, levelConfig.moleVisibleTime);

    moleTimeoutsRef.current.set(holeIndex, hideTimeout);
  }, [gameState.isPlaying, gameState.level, getLevelConfig, visibleMoles]);

  const hitMole = useCallback((holeIndex: number) => {
    if (!gameState.isPlaying || !visibleMoles.has(holeIndex)) return;

    // Clear the auto-hide timeout
    const timeout = moleTimeoutsRef.current.get(holeIndex);
    if (timeout) {
      clearTimeout(timeout);
      moleTimeoutsRef.current.delete(holeIndex);
    }

    // Add hit animation effect
    setHitMoles(prev => new Set([...prev, holeIndex]));
    setTimeout(() => {
      setHitMoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(holeIndex);
        return newSet;
      });
    }, 300);

    // Hide mole immediately
    setVisibleMoles(prev => {
      const newSet = new Set(prev);
      newSet.delete(holeIndex);
      return newSet;
    });

    // Remove mole variation
    setMoleVariations(prev => {
      const newMap = new Map(prev);
      newMap.delete(holeIndex);
      return newMap;
    });

    // Increase score (bonus points for special moles)
    const moleType = moleVariations.get(holeIndex) || 'normal';
    const scoreBonus = moleType === 'angry' ? 2 : moleType === 'sleepy' ? 3 : 1;
    setGameState(prev => ({
      ...prev,
      score: prev.score + scoreBonus
    }));

    // Play hit sound
    playHitSound();
  }, [gameState.isPlaying, visibleMoles, playHitSound]);

  const startGame = useCallback((level?: 'easy' | 'medium' | 'hard') => {
    if (gameState.isPlaying) {
      console.log('Game already playing, ignoring start request');
      return;
    }

    const selectedLevel = level || gameState.level;
    const levelConfig = getLevelConfig(selectedLevel);
    console.log('Starting game with level:', selectedLevel, 'config:', levelConfig);

    playGameStartSound();

    setGameState(prev => {
      const newState = {
        ...prev,
        score: 0,
        timeLeft: levelConfig.gameTime,
        isPlaying: true,
        gameOver: false,
        level: selectedLevel,
        currentView: 'game'
      };
      console.log('Game state updated:', newState);
      return newState;
    });

    setVisibleMoles(new Set());
    setHitMoles(new Set());
    setMoleVariations(new Map());
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

    // Note: Mole spawning will be started by useEffect when isPlaying becomes true
    console.log('Game start initiated, mole spawning will begin via useEffect');
  }, [gameState.isPlaying, gameState.level, getLevelConfig, playGameStartSound]);

  const goHome = useCallback(() => {
    // Stop current game
    if (moleIntervalRef.current) {
      clearInterval(moleIntervalRef.current);
      moleIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    moleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    moleTimeoutsRef.current.clear();

    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameOver: false,
      currentView: 'home'
    }));
    setVisibleMoles(new Set());
    setHitMoles(new Set());
    setMoleVariations(new Map());
    setShowGameOverModal(false);
  }, []);

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
    setHitMoles(new Set());
    setMoleVariations(new Map());
    setShowGameOverModal(false);

    // Start new game with same level
    setTimeout(() => startGame(gameState.level), 100);
  }, [startGame, gameState.level]);

  // Effect to handle game over when timer reaches 0
  useEffect(() => {
    if (gameState.timeLeft <= 0 && gameState.isPlaying) {
      endGame();
    }
  }, [gameState.timeLeft, gameState.isPlaying, endGame]);

  // Effect to start mole spawning when game becomes active
  useEffect(() => {
    if (gameState.isPlaying) {
      console.log('Game is now playing, starting mole spawning');
      const levelConfig = getLevelConfig(gameState.level);
      
      // Clear any existing interval
      if (moleIntervalRef.current) {
        clearInterval(moleIntervalRef.current);
      }
      
      // Start mole spawning
      moleIntervalRef.current = setInterval(showRandomMole, levelConfig.moleInterval);
      
      // Spawn first mole immediately
      setTimeout(() => {
        console.log('Spawning first mole');
        showRandomMole();
      }, 500);
    } else {
      console.log('Game stopped, clearing mole spawning');
      // Clear interval when game stops
      if (moleIntervalRef.current) {
        clearInterval(moleIntervalRef.current);
        moleIntervalRef.current = null;
      }
    }
  }, [gameState.isPlaying, gameState.level, getLevelConfig, showRandomMole]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      moleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const holes = Array.from({ length: 9 }, (_, i) => i);

  // Home Screen Component
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 font-sans relative overflow-hidden">
      {/* Floating Island Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="floating-island w-96 h-96 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-2xl animate-float">
          <div className="absolute top-8 left-8 w-16 h-16 bg-green-600 rounded-full shadow-lg"></div>
          <div className="absolute top-12 right-12 w-12 h-12 bg-green-600 rounded-full shadow-lg"></div>
          <div className="absolute bottom-16 left-16 w-20 h-20 bg-green-600 rounded-full shadow-lg"></div>
        </div>
      </div>
      
      {/* Clouds */}
      <div className="absolute top-20 left-10 w-24 h-12 bg-white rounded-full opacity-70 animate-drift-right"></div>
      <div className="absolute top-32 right-20 w-32 h-16 bg-white rounded-full opacity-60 animate-drift-left"></div>
      <div className="absolute top-48 left-1/3 w-20 h-10 bg-white rounded-full opacity-80 animate-drift-right-slow"></div>
      
      {/* Home Content */}
      <div className="relative z-10 text-center py-16">
        <h1 className="text-6xl font-black text-gray-800 mb-4 flex items-center justify-center gap-4 animate-bounce-gentle">
          <Hammer className="text-yellow-500 animate-swing" size={64} />
          Whack-a-Mole
        </h1>
        <p className="text-gray-700 text-xl font-medium mb-12">Choose your adventure on Mole Island!</p>
        
        {/* Level Selection */}
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-2">
            <Star className="text-yellow-500" size={32} />
            Select Difficulty
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Easy Level */}
            <Card className="bg-white rounded-3xl shadow-xl p-8 border-0 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl"
                  onClick={() => startGame('easy')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Target className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Easy</h3>
                <p className="text-gray-600 mb-4">30 seconds • Slow moles</p>
                <div className="text-sm text-gray-500">
                  <p>• Moles appear every 1.2s</p>
                  <p>• Stay visible for 2 seconds</p>
                  <p>• Perfect for beginners</p>
                </div>
              </div>
            </Card>
            
            {/* Medium Level */}
            <Card className="bg-white rounded-3xl shadow-xl p-8 border-0 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl"
                  onClick={() => startGame('medium')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Zap className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Medium</h3>
                <p className="text-gray-600 mb-4">45 seconds • Normal speed</p>
                <div className="text-sm text-gray-500">
                  <p>• Moles appear every 0.8s</p>
                  <p>• Stay visible for 1.5 seconds</p>
                  <p>• Good challenge</p>
                </div>
              </div>
            </Card>
            
            {/* Hard Level */}
            <Card className="bg-white rounded-3xl shadow-xl p-8 border-0 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl"
                  onClick={() => startGame('hard')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Hard</h3>
                <p className="text-gray-600 mb-4">60 seconds • Lightning fast</p>
                <div className="text-sm text-gray-500">
                  <p>• Moles appear every 0.5s</p>
                  <p>• Stay visible for 1 second</p>
                  <p>• For experts only!</p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* High Score Display */}
          <Card className="bg-white rounded-2xl shadow-lg px-8 py-6 inline-block border-0">
            <p className="text-lg font-medium text-gray-600 mb-2">Island Record</p>
            <p className="text-4xl font-bold text-purple-600">{gameState.highScore}</p>
          </Card>
        </div>
      </div>
    </div>
  );

  // Game Screen Component  
  const GameScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans relative">
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float-particle opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* Game Header */}
      <header className="text-center py-6 relative z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4">
          <Button
            onClick={goHome}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg"
          >
            <Home className="mr-2" size={16} />
            Home
          </Button>
          
          <h1 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Hammer className="text-yellow-500" size={40} />
            Whack-a-Mole
          </h1>
          
          <Button
            onClick={goHome}
            variant="destructive"
            className="font-bold py-2 px-4 rounded-xl shadow-lg"
          >
            <X className="mr-2" size={16} />
            Quit
          </Button>
        </div>
        
        <div className="mt-4">
          <span className="bg-white px-4 py-2 rounded-full shadow-md text-lg font-semibold">
            Level: <span className="capitalize text-purple-600">{gameState.level}</span>
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Game Info */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <Card className="bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 border-0 animate-pulse-glow">
            <Trophy className="text-yellow-500" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-600">Score</p>
              <p className="text-3xl font-bold text-gray-800">{gameState.score}</p>
            </div>
          </Card>
          <Card className="bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 border-0 animate-pulse-glow">
            <Clock className={`${gameState.timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-500'}`} size={20} />
            <div>
              <p className="text-sm font-medium text-gray-600">Time</p>
              <p className={`text-3xl font-bold ${gameState.timeLeft <= 10 ? 'text-red-600' : 'text-gray-800'}`}>
                {gameState.timeLeft}
              </p>
            </div>
          </Card>
        </div>

        {/* Enhanced Game Board with Island Theme */}
        <div className="game-island bg-gradient-to-br from-green-300 via-green-400 to-green-500 rounded-full p-12 shadow-2xl mb-8 relative overflow-hidden">
          {/* Grass texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-30 rounded-full"></div>
          <div className="absolute inset-4 bg-gradient-to-br from-green-200 to-green-300 opacity-40 rounded-full"></div>
          
          {/* Game grid */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto relative z-10">
            {holes.map((holeIndex) => (
              <div
                key={holeIndex}
                className={`hole relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-amber-900 to-amber-800 rounded-full shadow-2xl border-4 border-amber-700 overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-110 ${
                  hitMoles.has(holeIndex) ? 'animate-whack' : ''
                }`}
                onClick={() => hitMole(holeIndex)}
              >
                {/* Hole depth effect */}
                <div className="hole-shadow absolute inset-2 bg-gradient-to-br from-black to-gray-900 opacity-70 rounded-full"></div>
                <div className="absolute inset-4 bg-black opacity-50 rounded-full"></div>
                
                {/* Enhanced Realistic Mole */}
                <div
                  className={`mole ${visibleMoles.has(holeIndex) ? 'visible' : ''} ${hitMoles.has(holeIndex) ? 'animate-whack' : ''}`}
                >
                  {/* Mole body with realistic colors */}
                  <div className="w-full h-full bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 rounded-full shadow-xl border-2 border-amber-900 relative overflow-hidden">
                    
                    {/* Fur texture overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-transparent opacity-30 rounded-full"></div>
                    <div className="absolute inset-1 bg-gradient-to-tl from-amber-900 to-transparent opacity-20 rounded-full"></div>
                    
                    {/* Mole face */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 md:w-18 md:h-18 bg-gradient-to-br from-amber-700 to-amber-800 rounded-full relative">
                        
                        {/* Snout area */}
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full"></div>
                        
                        {/* Eyes - Dynamic based on mole type */}
                        {(() => {
                          const moleType = moleVariations.get(holeIndex) || 'normal';
                          switch (moleType) {
                            case 'angry':
                              return (
                                <>
                                  <div className="absolute top-2 left-2 w-2.5 h-2 bg-red-600 rounded-full transform -rotate-12">
                                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                  <div className="absolute top-2 right-2 w-2.5 h-2 bg-red-600 rounded-full transform rotate-12">
                                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                </>
                              );
                            case 'sleepy':
                              return (
                                <>
                                  <div className="absolute top-2 left-2 w-2.5 h-1 bg-black rounded-full">
                                    <div className="absolute top-0 left-1 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                  <div className="absolute top-2 right-2 w-2.5 h-1 bg-black rounded-full">
                                    <div className="absolute top-0 left-1 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                </>
                              );
                            case 'surprised':
                              return (
                                <>
                                  <div className="absolute top-1.5 left-2 w-3 h-3 bg-black rounded-full">
                                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                  <div className="absolute top-1.5 right-2 w-3 h-3 bg-black rounded-full">
                                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                </>
                              );
                            default:
                              return (
                                <>
                                  <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-black rounded-full animate-blink">
                                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-black rounded-full animate-blink">
                                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                                  </div>
                                </>
                              );
                          }
                        })()}
                        
                        {/* Nose */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-pink-600 rounded-full border border-pink-700"></div>
                        
                        {/* Mouth */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3 h-1 border-b-2 border-amber-900 rounded-full"></div>
                        
                        {/* Teeth (small white rectangles) */}
                        <div className="absolute top-5.5 left-1/2 transform -translate-x-1/2 -translate-x-1 w-1 h-1 bg-white rounded-sm"></div>
                        <div className="absolute top-5.5 left-1/2 transform -translate-x-1/2 translate-x-1 w-1 h-1 bg-white rounded-sm"></div>
                        
                        {/* Cheeks */}
                        <div className="absolute top-3 left-0.5 w-2 h-2 bg-amber-600 rounded-full opacity-70"></div>
                        <div className="absolute top-3 right-0.5 w-2 h-2 bg-amber-600 rounded-full opacity-70"></div>
                        
                        {/* Ears */}
                        <div className="absolute -top-1 left-1 w-2 h-3 bg-amber-800 rounded-full rotate-12 border border-amber-900"></div>
                        <div className="absolute -top-1 right-1 w-2 h-3 bg-amber-800 rounded-full -rotate-12 border border-amber-900"></div>
                        
                        {/* Whiskers */}
                        <div className="absolute top-4 -left-1 w-3 h-0.5 bg-gray-800 rounded opacity-60"></div>
                        <div className="absolute top-4.5 -left-1 w-2.5 h-0.5 bg-gray-800 rounded opacity-60"></div>
                        <div className="absolute top-4 -right-1 w-3 h-0.5 bg-gray-800 rounded opacity-60"></div>
                        <div className="absolute top-4.5 -right-1 w-2.5 h-0.5 bg-gray-800 rounded opacity-60"></div>
                      </div>
                    </div>
                    
                    {/* Paws */}
                    <div className="absolute bottom-0 left-2 w-3 h-2 bg-amber-900 rounded-full"></div>
                    <div className="absolute bottom-0 right-2 w-3 h-2 bg-amber-900 rounded-full"></div>
                    
                    {/* Hit sparkle effect */}
                    {hitMoles.has(holeIndex) && (
                      <>
                        <div className="absolute -inset-2 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50"></div>
                        {/* Sparkle particles */}
                        <div className="absolute -top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
                        <div className="absolute -top-1 right-3 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                        <div className="absolute top-1 -left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
                        <div className="absolute bottom-2 -right-1 w-1 h-1 bg-white rounded-full animate-ping"></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Decorative elements on island */}
          <div className="absolute top-8 left-8 w-4 h-6 bg-green-600 rounded-t-full"></div>
          <div className="absolute top-12 right-12 w-3 h-5 bg-green-600 rounded-t-full"></div>
          <div className="absolute bottom-16 left-16 w-5 h-7 bg-green-600 rounded-t-full"></div>
          <div className="absolute bottom-20 right-20 w-3 h-4 bg-green-600 rounded-t-full"></div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={restartGame}
            disabled={!gameState.isPlaying && !gameState.gameOver}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="mr-2" size={20} />
            Restart
          </Button>
        </div>

        {/* Current High Score */}
        <div className="text-center">
          <Card className="bg-white rounded-2xl shadow-lg px-6 py-4 inline-block border-0">
            <p className="text-sm font-medium text-gray-600 mb-1">High Score</p>
            <p className="text-3xl font-bold text-purple-600">{gameState.highScore}</p>
          </Card>
        </div>
      </div>

    </div>
  );

  // Main component return with navigation
  return (
    <>
      {gameState.currentView === 'home' && <HomeScreen />}
      {gameState.currentView === 'game' && <GameScreen />}
      
      {/* Enhanced Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl transform scale-100 transition-transform duration-300 border-0 animate-modal-appear">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Mission Complete!</h2>
            <p className="text-gray-600 mb-2">Final Score:</p>
            <p className="text-5xl font-bold text-purple-600 mb-2">{gameState.score}</p>
            
            {gameState.score === gameState.highScore && gameState.score > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg mb-4 animate-pulse">
                🏆 New Island Record!
              </div>
            )}
            
            <div className="space-y-3 mt-6">
              <Button
                onClick={() => {
                  setShowGameOverModal(false);
                  setTimeout(() => startGame(gameState.level), 300);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-150 hover:scale-105"
              >
                <Play className="mr-2" size={16} />
                Play Again ({gameState.level})
              </Button>
              <Button
                onClick={() => {
                  setShowGameOverModal(false);
                  goHome();
                }}
                variant="secondary"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transform transition-all duration-150 hover:scale-105"
              >
                <Home className="mr-2" size={16} />
                Back to Island
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

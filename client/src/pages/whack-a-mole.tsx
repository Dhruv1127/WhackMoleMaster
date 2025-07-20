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
      // Audio not supported - silent fail
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
      // Audio not supported - silent fail
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
      // Audio not supported - silent fail
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
      // Audio not supported - silent fail
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
      // Audio not supported - silent fail
    }
  }, [getAudioContext, backgroundMusic]);

  // Level configuration with balanced average speeds
  const getLevelConfig = useCallback((level: 'easy' | 'medium' | 'hard') => {
    switch (level) {
      case 'easy':
        return { moleInterval: 1500, moleVisibleTime: 2500, gameTime: 30, maxConcurrentMoles: 1 };
      case 'medium':
        return { moleInterval: 1000, moleVisibleTime: 2000, gameTime: 45, maxConcurrentMoles: 2 };
      case 'hard':
        return { moleInterval: 700, moleVisibleTime: 1500, gameTime: 60, maxConcurrentMoles: 3 };
      default:
        return { moleInterval: 1000, moleVisibleTime: 2000, gameTime: 30, maxConcurrentMoles: 1 };
    }
  }, []);

  const showRandomMole = useCallback(() => {
    if (!gameState.isPlaying) {
      return;
    }

    const levelConfig = getLevelConfig(gameState.level);
    
    // Check if we've reached maximum concurrent moles for this level
    if (visibleMoles.size >= levelConfig.maxConcurrentMoles) {
      setTimeout(showRandomMole, levelConfig.moleInterval / 2);
      return;
    }
    
    // Find available holes (not currently occupied)
    const availableHoles = Array.from({ length: 9 }, (_, i) => i).filter(
      index => !visibleMoles.has(index) && !moleTimeoutsRef.current.has(index)
    );
    
    // If no holes available, try again in a shorter time
    if (availableHoles.length === 0) {
      setTimeout(showRandomMole, levelConfig.moleInterval / 3);
      return;
    }
    
    // Select random hole from available ones
    const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    // Add random mole variation
    const moleTypes = ['normal', 'angry', 'sleepy', 'surprised'];
    const randomType = moleTypes[Math.floor(Math.random() * moleTypes.length)];
    setMoleVariations(prev => new Map(prev.set(holeIndex, randomType)));
    
    setVisibleMoles(prev => new Set([...prev, holeIndex]));

    // Auto-hide mole after level-based time
    const hideTimeout = setTimeout(() => {
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
    }, 500);

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
      return;
    }

    const selectedLevel = level || gameState.level;
    const levelConfig = getLevelConfig(selectedLevel);

    playGameStartSound();

    setGameState(prev => ({
      ...prev,
      score: 0,
      timeLeft: levelConfig.gameTime,
      isPlaying: true,
      gameOver: false,
      level: selectedLevel,
      currentView: 'game'
    }));

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
      const levelConfig = getLevelConfig(gameState.level);
      
      // Clear any existing interval
      if (moleIntervalRef.current) {
        clearInterval(moleIntervalRef.current);
      }
      
      // Start mole spawning
      moleIntervalRef.current = setInterval(showRandomMole, levelConfig.moleInterval);
      
      // Spawn first mole immediately
      setTimeout(() => {
        showRandomMole();
      }, 500);
    } else {
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

  // Enhanced Home Screen Component
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 font-sans relative overflow-hidden">
      {/* Floating Islands Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="floating-island w-96 h-96 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-2xl animate-float">
          <div className="absolute top-8 left-8 w-16 h-16 bg-green-600 rounded-full shadow-lg animate-pulse"></div>
          <div className="absolute top-12 right-12 w-12 h-12 bg-green-600 rounded-full shadow-lg animate-float-particle"></div>
          <div className="absolute bottom-16 left-16 w-20 h-20 bg-green-600 rounded-full shadow-lg animate-bounce-gentle"></div>
        </div>
        
        {/* Additional floating elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-xl animate-float opacity-60"></div>
        <div className="absolute bottom-32 left-20 w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full shadow-lg animate-swing opacity-50"></div>
      </div>
      
      {/* Animated Clouds */}
      <div className="absolute top-20 left-10 w-24 h-12 bg-white rounded-full opacity-70 animate-drift-right shadow-lg"></div>
      <div className="absolute top-32 right-20 w-32 h-16 bg-white rounded-full opacity-60 animate-drift-left shadow-lg"></div>
      <div className="absolute top-48 left-1/3 w-20 h-10 bg-white rounded-full opacity-80 animate-drift-right-slow shadow-lg"></div>
      <div className="absolute bottom-40 right-1/4 w-28 h-14 bg-white rounded-full opacity-50 animate-drift-left shadow-lg"></div>
      
      {/* Sparkle Effects */}
      <div className="absolute top-16 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
      <div className="absolute top-24 right-1/3 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center py-12">
        {/* Game Title */}
        <div className="mb-8 animate-modal-appear">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Hammer className="text-yellow-500" size={32} />
            Whack-a-Mole
            <Target className="text-red-500" size={28} />
          </h1>
          <p className="text-gray-700 text-lg font-medium mb-2">Welcome to Mole Island Adventure!</p>
          <div className="text-gray-600 text-base">
            <p>Test your reflexes and whack those pesky moles!</p>
            <p className="text-sm mt-2 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-500" size={16} />
              High Score: {gameState.highScore}
            </p>
          </div>
        </div>
        
        {/* Main Menu Options */}
        {!showLevelSelect && !showHowToPlay && (
          <div className="max-w-md mx-auto px-4 animate-modal-appear">
            <div className="grid gap-4 mb-6">
              {/* Start Game Button */}
              <Card className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-4 border-0 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl group"
                    onClick={() => setShowLevelSelect(true)}>
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-2 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-1">Start Game</h3>
                  <p className="text-green-100 text-sm">Begin your mole-whacking adventure!</p>
                </div>
              </Card>

              {/* How to Play Button */}
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 border-0 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl group"
                    onClick={() => setShowHowToPlay(true)}>
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-2 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <path d="m12 17.02.01 0"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-1">How to Play</h3>
                  <p className="text-blue-100 text-sm">Learn the rules and controls</p>
                </div>
              </Card>

              {/* Quit Game Button */}
              <Card className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-4 border-0 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl group"
                    onClick={() => window.close()}>
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-2 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="m18 6-12 12"/>
                      <path d="m6 6 12 12"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-1">Quit Game</h3>
                  <p className="text-red-100 text-sm">Exit the application</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Level Selection Screen */}
        {showLevelSelect && !showHowToPlay && (
          <div className="max-w-4xl mx-auto px-4 animate-modal-appear">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setShowLevelSelect(false)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 font-semibold hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Back to Menu
              </button>
              <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Star className="text-yellow-500 animate-pulse" size={36} />
                Select Difficulty
              </h2>
              <div className="w-32"></div>
            </div>
          
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
                  <p>• Moles appear every 1.5s</p>
                  <p>• Stay visible for 2.5 seconds</p>
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
                  <p>• Moles appear every 1.0s</p>
                  <p>• Stay visible for 2.0 seconds</p>
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
                  <p>• Moles appear every 0.7s</p>
                  <p>• Stay visible for 1.5 seconds</p>
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
        )}

        {/* How to Play Screen */}
        {showHowToPlay && (
          <div className="max-w-4xl mx-auto px-4 animate-modal-appear">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setShowHowToPlay(false)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 font-semibold hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Back to Menu
              </button>
              <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <path d="m12 17.02.01 0"/>
                </svg>
                How to Play
              </h2>
              <div className="w-32"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Game Rules */}
              <Card className="bg-white rounded-3xl shadow-xl p-8 border-0">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Trophy className="text-yellow-500" size={28} />
                  Game Rules
                </h3>
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                    <p>Click on moles as they pop out of holes to score points</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                    <p>Different mole types give different points:</p>
                  </div>
                  <div className="ml-9 space-y-2 text-sm text-gray-600">
                    <p>• Normal moles: 1 point</p>
                    <p>• Angry moles (red eyes): 2 points</p>
                    <p>• Sleepy moles (closed eyes): 3 points</p>
                    <p>• Surprised moles (wide eyes): 1 point</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                    <p>Score as many points as possible before time runs out!</p>
                  </div>
                </div>
              </Card>

              {/* Controls & Tips */}
              <Card className="bg-white rounded-3xl shadow-xl p-8 border-0">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Target className="text-red-500" size={28} />
                  Controls & Tips
                </h3>
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">🖱️</div>
                    <p>Click or tap on moles to whack them</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">⚡</div>
                    <p>Be quick! Moles disappear after a few seconds</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">🎯</div>
                    <p>Focus on sleepy moles for maximum points</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">🏆</div>
                    <p>Try different difficulty levels for varied challenges</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">🔊</div>
                    <p>Listen for sound effects to enhance gameplay</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Start Playing Button */}
            <div className="text-center mt-8">
              <button 
                onClick={() => {
                  setShowHowToPlay(false);
                  setShowLevelSelect(true);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Ready to Play! 🎮
              </button>
            </div>
          </div>
        )}
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

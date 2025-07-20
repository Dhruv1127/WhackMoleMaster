// Game State Management
class WhackAMoleGame {
    constructor() {
        this.gameState = {
            score: 0,
            timeLeft: 30,
            isPlaying: false,
            isPaused: false,
            gameOver: false,
            level: 'easy',
            currentView: 'home'
        };
        
        this.visibleMoles = new Set();
        this.hitMoles = new Set();
        this.moleVariations = new Map();
        this.moleTimeouts = new Map();
        
        this.moleInterval = null;
        this.timerInterval = null;
        this.audioContext = null;
        
        this.settings = {
            backgroundMusic: true,
            soundEffects: true
        };
        
        this.highScore = parseInt(localStorage.getItem('whackMoleHighScore') || '0');
        
        this.init();
    }
    
    // Initialize the game
    init() {
        this.updateHighScoreDisplay();
        this.createGameBoard();
        this.bindEvents();
        this.loadSettings();
    }
    
    // Create the game board with holes
    createGameBoard() {
        const holeGrid = document.querySelector('.hole-grid');
        holeGrid.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.className = 'hole';
            hole.dataset.index = i;
            
            const mole = document.createElement('div');
            mole.className = 'mole';
            mole.addEventListener('click', () => this.hitMole(i));
            
            hole.appendChild(mole);
            holeGrid.appendChild(hole);
        }
    }
    
    // Bind event listeners
    bindEvents() {
        // Settings toggles
        const backgroundMusicToggle = document.getElementById('backgroundMusicToggle');
        const soundEffectsToggle = document.getElementById('soundEffectsToggle');
        
        if (backgroundMusicToggle) {
            backgroundMusicToggle.addEventListener('change', (e) => {
                this.settings.backgroundMusic = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (soundEffectsToggle) {
            soundEffectsToggle.addEventListener('change', (e) => {
                this.settings.soundEffects = e.target.checked;
                this.saveSettings();
            });
        }
    }
    
    // Audio system using Web Audio API
    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
    
    playHitSound() {
        if (!this.settings.soundEffects) return;
        
        try {
            const audioContext = this.getAudioContext();
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
    }
    
    playMissSound() {
        if (!this.settings.soundEffects) return;
        
        try {
            const audioContext = this.getAudioContext();
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
    }
    
    playGameStartSound() {
        if (!this.settings.soundEffects) return;
        
        try {
            const audioContext = this.getAudioContext();
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
    }
    
    playGameEndSound() {
        if (!this.settings.soundEffects) return;
        
        try {
            const audioContext = this.getAudioContext();
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
    }
    
    // Get level configuration
    getLevelConfig(level) {
        const configs = {
            easy: { moleInterval: 1500, moleVisibleTime: 2500, gameTime: 30, maxConcurrentMoles: 1 },
            medium: { moleInterval: 1000, moleVisibleTime: 2000, gameTime: 45, maxConcurrentMoles: 2 },
            hard: { moleInterval: 700, moleVisibleTime: 1500, gameTime: 60, maxConcurrentMoles: 3 }
        };
        
        return configs[level] || configs.easy;
    }
    
    // Show random mole
    showRandomMole() {
        if (!this.gameState.isPlaying || this.gameState.isPaused) {
            return;
        }
        
        const levelConfig = this.getLevelConfig(this.gameState.level);
        
        // Check if we've reached maximum concurrent moles
        if (this.visibleMoles.size >= levelConfig.maxConcurrentMoles) {
            setTimeout(() => this.showRandomMole(), levelConfig.moleInterval / 2);
            return;
        }
        
        // Find available holes
        const availableHoles = Array.from({ length: 9 }, (_, i) => i).filter(
            index => !this.visibleMoles.has(index) && !this.moleTimeouts.has(index)
        );
        
        if (availableHoles.length === 0) {
            setTimeout(() => this.showRandomMole(), levelConfig.moleInterval / 3);
            return;
        }
        
        // Select random hole
        const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        
        // Add random mole variation
        const moleTypes = ['normal', 'angry', 'sleepy', 'surprised'];
        const randomType = moleTypes[Math.floor(Math.random() * moleTypes.length)];
        this.moleVariations.set(holeIndex, randomType);
        
        // Show mole
        this.visibleMoles.add(holeIndex);
        this.updateMoleDisplay(holeIndex, true, randomType);
        
        // Auto-hide mole after time
        const hideTimeout = setTimeout(() => {
            this.hideMole(holeIndex);
            this.playMissSound();
        }, levelConfig.moleVisibleTime);
        
        this.moleTimeouts.set(holeIndex, hideTimeout);
    }
    
    // Update mole display
    updateMoleDisplay(holeIndex, visible, type = 'normal') {
        const hole = document.querySelector(`[data-index="${holeIndex}"]`);
        const mole = hole.querySelector('.mole');
        
        if (visible) {
            mole.className = `mole visible ${type}`;
        } else {
            mole.className = 'mole';
        }
    }
    
    // Hide mole
    hideMole(holeIndex) {
        this.visibleMoles.delete(holeIndex);
        this.moleVariations.delete(holeIndex);
        this.moleTimeouts.delete(holeIndex);
        this.updateMoleDisplay(holeIndex, false);
    }
    
    // Hit mole
    hitMole(holeIndex) {
        if (!this.gameState.isPlaying || this.gameState.isPaused || !this.visibleMoles.has(holeIndex)) {
            return;
        }
        
        // Clear timeout
        const timeout = this.moleTimeouts.get(holeIndex);
        if (timeout) {
            clearTimeout(timeout);
            this.moleTimeouts.delete(holeIndex);
        }
        
        // Add hit animation
        const hole = document.querySelector(`[data-index="${holeIndex}"]`);
        const mole = hole.querySelector('.mole');
        mole.classList.add('hit');
        
        // Calculate score bonus
        const moleType = this.moleVariations.get(holeIndex) || 'normal';
        const scoreBonus = moleType === 'angry' ? 2 : moleType === 'sleepy' ? 3 : 1;
        
        this.gameState.score += scoreBonus;
        this.updateScoreDisplay();
        
        // Hide mole
        setTimeout(() => {
            this.hideMole(holeIndex);
            mole.classList.remove('hit');
        }, 300);
        
        this.playHitSound();
    }
    
    // Start game
    startGame(level = 'easy') {
        if (this.gameState.isPlaying) return;
        
        const levelConfig = this.getLevelConfig(level);
        
        this.gameState = {
            score: 0,
            timeLeft: levelConfig.gameTime,
            isPlaying: true,
            isPaused: false,
            gameOver: false,
            level: level,
            currentView: 'game'
        };
        
        this.visibleMoles.clear();
        this.moleVariations.clear();
        this.moleTimeouts.clear();
        
        this.showScreen('gameScreen');
        this.updateGameDisplay();
        this.playGameStartSound();
        
        // Start timer
        this.timerInterval = setInterval(() => {
            this.gameState.timeLeft--;
            this.updateTimeDisplay();
            
            if (this.gameState.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        // Start mole spawning
        this.moleInterval = setInterval(() => {
            this.showRandomMole();
        }, levelConfig.moleInterval);
        
        // Show first mole immediately
        setTimeout(() => this.showRandomMole(), 500);
    }
    
    // Pause game
    pauseGame() {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        this.gameState.isPaused = true;
        clearInterval(this.moleInterval);
        clearInterval(this.timerInterval);
        
        document.getElementById('pauseModal').classList.remove('hidden');
    }
    
    // Resume game
    resumeGame() {
        if (!this.gameState.isPlaying || !this.gameState.isPaused) return;
        
        this.gameState.isPaused = false;
        document.getElementById('pauseModal').classList.add('hidden');
        
        const levelConfig = this.getLevelConfig(this.gameState.level);
        
        // Restart timer
        this.timerInterval = setInterval(() => {
            this.gameState.timeLeft--;
            this.updateTimeDisplay();
            
            if (this.gameState.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        // Restart mole spawning
        this.moleInterval = setInterval(() => {
            this.showRandomMole();
        }, levelConfig.moleInterval);
    }
    
    // Restart game
    restartGame() {
        this.clearGame();
        setTimeout(() => {
            this.startGame(this.gameState.level);
        }, 100);
    }
    
    // End game
    endGame() {
        this.gameState.isPlaying = false;
        this.gameState.gameOver = true;
        
        this.clearGame();
        
        // Update high score
        const isNewHighScore = this.gameState.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.gameState.score;
            localStorage.setItem('whackMoleHighScore', this.highScore.toString());
            this.updateHighScoreDisplay();
        }
        
        // Show game over modal
        setTimeout(() => {
            document.getElementById('finalScore').textContent = this.gameState.score;
            document.getElementById('newHighScore').classList.toggle('hidden', !isNewHighScore);
            document.getElementById('gameOverModal').classList.remove('hidden');
            this.playGameEndSound();
        }, 500);
    }
    
    // Clear game intervals and timeouts
    clearGame() {
        if (this.moleInterval) {
            clearInterval(this.moleInterval);
            this.moleInterval = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.moleTimeouts.forEach(timeout => clearTimeout(timeout));
        this.moleTimeouts.clear();
        
        // Hide all moles
        this.visibleMoles.forEach(index => {
            this.updateMoleDisplay(index, false);
        });
        this.visibleMoles.clear();
        this.moleVariations.clear();
    }
    
    // Go home
    goHome() {
        this.clearGame();
        this.gameState.isPlaying = false;
        this.gameState.isPaused = false;
        this.gameState.currentView = 'home';
        
        // Hide modals
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('pauseModal').classList.add('hidden');
        
        this.showScreen('homeScreen');
        this.backToMainMenu();
    }
    
    // Update displays
    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.gameState.score;
    }
    
    updateTimeDisplay() {
        document.getElementById('timeLeft').textContent = this.gameState.timeLeft;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('displayHighScore').textContent = this.highScore;
        document.getElementById('gameHighScore').textContent = this.highScore;
    }
    
    updateGameDisplay() {
        this.updateScoreDisplay();
        this.updateTimeDisplay();
        this.updateHighScoreDisplay();
    }
    
    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    // Settings
    loadSettings() {
        const savedSettings = localStorage.getItem('whackMoleSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Update toggle states
        document.getElementById('backgroundMusicToggle').checked = this.settings.backgroundMusic;
        document.getElementById('soundEffectsToggle').checked = this.settings.soundEffects;
    }
    
    saveSettings() {
        localStorage.setItem('whackMoleSettings', JSON.stringify(this.settings));
    }
}

// Global game instance
let game;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    game = new WhackAMoleGame();
});

// Navigation functions
function showLevelSelect() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('levelSelect').classList.remove('hidden');
}

function showHowToPlay() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('howToPlay').classList.remove('hidden');
}

function showSettings() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('settings').classList.remove('hidden');
}

function backToMainMenu() {
    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('levelSelect').classList.add('hidden');
    document.getElementById('howToPlay').classList.add('hidden');
    document.getElementById('settings').classList.add('hidden');
}

// Game control functions
function startGame(level) {
    game.startGame(level);
}

function pauseGame() {
    game.pauseGame();
}

function resumeGame() {
    game.resumeGame();
}

function restartGame() {
    // Hide modals first
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('pauseModal').classList.add('hidden');
    game.restartGame();
}

function goHome() {
    game.goHome();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'Escape':
            if (game.gameState.isPlaying && !game.gameState.isPaused) {
                pauseGame();
            } else if (game.gameState.isPaused) {
                resumeGame();
            }
            break;
        case 'r':
        case 'R':
            if (game.gameState.isPlaying) {
                restartGame();
            }
            break;
        case 'h':
        case 'H':
            goHome();
            break;
    }
});

// Prevent context menu on moles for better mobile experience
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('mole')) {
        e.preventDefault();
    }
});

// Handle visibility change (pause when tab becomes inactive)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.gameState.isPlaying && !game.gameState.isPaused) {
        pauseGame();
    }
});
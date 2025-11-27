/**
 * Main Game Class
 * Orchestrates all game systems: rendering, physics, input, audio, and UI
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Renderer } from './renderer.js';
import { Physics } from './physics.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { UIManager } from './ui.js';
import { Playfield } from './playfield.js';
import { Cannon } from './cannon.js';
import { Flippers } from './flippers.js';
import { JackpotMachine } from './jackpot.js';
import { ScoreManager } from './score.js';
import { BallManager } from './balls.js';
import { StorageManager } from './storage.js';
import { CONFIG } from './config.js';

/**
 * Game States
 */
export const GameState = {
    LOADING: 'LOADING',
    IDLE: 'IDLE',
    PLAYING: 'PLAYING',
    JACKPOT_READY: 'JACKPOT_READY',
    JACKPOT_SPINNING: 'JACKPOT_SPINNING',
    JACKPOT_PAYOUT: 'JACKPOT_PAYOUT',
    GAME_OVER: 'GAME_OVER'
};

export class Game {
    constructor() {
        this.state = GameState.LOADING;
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        
        // Performance monitoring
        this.frameTimes = [];
        this.fpsUpdateInterval = 500;
        this.lastFpsUpdate = 0;
        
        // Systems
        this.renderer = null;
        this.physics = null;
        this.input = null;
        this.audio = null;
        this.ui = null;
        
        // Game Objects
        this.playfield = null;
        this.cannon = null;
        this.flippers = null;
        this.jackpot = null;
        this.score = null;
        this.balls = null;
        this.storage = null;
    }

    /**
     * Initialize all game systems
     */
    async init() {
        console.log('Initializing game systems...');
        
        // Initialize storage first (for settings/high scores)
        this.storage = new StorageManager();
        
        // Initialize renderer (handles WebGPU/WebGL detection)
        this.renderer = new Renderer(this);
        await this.renderer.init();
        
        // Initialize physics
        this.physics = new Physics(this);
        this.physics.init();
        
        // Initialize input manager
        this.input = new InputManager(this);
        this.input.init();
        
        // Initialize audio
        this.audio = new AudioManager(this);
        this.audio.init();
        
        // Initialize UI
        this.ui = new UIManager(this);
        this.ui.init();
        
        // Initialize score manager
        this.score = new ScoreManager(this);
        this.score.init();
        
        // Initialize ball manager
        this.balls = new BallManager(this);
        this.balls.init();
        
        // Create playfield
        this.playfield = new Playfield(this);
        this.playfield.create();
        
        // Create cannon
        this.cannon = new Cannon(this);
        this.cannon.create();
        
        // Create flippers
        this.flippers = new Flippers(this);
        this.flippers.create();
        
        // Create jackpot machine
        this.jackpot = new JackpotMachine(this);
        this.jackpot.create();
        
        // Set initial state
        this.state = GameState.IDLE;
        
        console.log('Game initialization complete');
    }

    /**
     * Start the game loop
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.state = GameState.PLAYING;
        this.gameLoop();
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, CONFIG.MAX_DELTA_TIME);
        this.lastTime = currentTime;
        
        // Track frame time for GPU-based RNG
        this.trackFrameTime(this.deltaTime * 1000);
        
        // Update all systems
        this.update(this.deltaTime);
        
        // Render
        this.render();
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        this.frameCount++;
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update all game systems
     */
    update(deltaTime) {
        // Process input
        this.input.update(deltaTime);
        
        // Update physics (with substeps)
        this.physics.update(deltaTime);
        
        // Update game objects
        this.cannon.update(deltaTime);
        this.flippers.update(deltaTime);
        this.jackpot.update(deltaTime);
        this.balls.update(deltaTime);
        
        // Update score/combo system
        this.score.update(deltaTime);
        
        // Check game state
        this.checkGameState();
        
        // Update UI
        this.ui.update(deltaTime);
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render();
    }

    /**
     * Track frame times for GPU noise RNG
     */
    trackFrameTime(frameTimeMs) {
        this.frameTimes.push(frameTimeMs);
        if (this.frameTimes.length > 12) {
            this.frameTimes.shift();
        }
    }

    /**
     * Get normalized variance for stochastic events
     * Based on GPU-normalized frame-time variance
     */
    getGPUNoiseRNG() {
        if (this.frameTimes.length < 2) return Math.random();
        
        const mean = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        const squaredDiffs = this.frameTimes.map(t => Math.pow(t - mean, 2));
        const variance = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / this.frameTimes.length);
        
        // Normalize variance to [0, 1] range (clamp to [5ms, 25ms] range)
        const normalizedVariance = Math.max(0, Math.min(1, variance / 10.0));
        
        // Add some entropy from current time
        const timeEntropy = (performance.now() % 1000) / 1000;
        
        return (normalizedVariance * 0.5 + timeEntropy * 0.5);
    }

    /**
     * Update FPS counter
     */
    updateFPS(currentTime) {
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            const fps = Math.round(1000 / (this.deltaTime * 1000));
            this.ui.updateFPS(fps);
            this.lastFpsUpdate = currentTime;
        }
    }

    /**
     * Check game state and handle transitions
     */
    checkGameState() {
        // Check for game over
        if (this.balls.totalBalls <= 0 && this.balls.activeBallCount === 0) {
            if (this.state !== GameState.GAME_OVER) {
                this.gameOver();
            }
        }
        
        // Check for jackpot ready
        if (this.jackpot.ballsInChute >= CONFIG.JACKPOT.THRESHOLD && 
            this.state === GameState.PLAYING) {
            this.state = GameState.JACKPOT_READY;
            this.ui.showJackpotReady();
        }
    }

    /**
     * Fire the cannon
     */
    fireCannon() {
        if (this.state !== GameState.PLAYING && this.state !== GameState.JACKPOT_READY) return;
        if (this.state === GameState.JACKPOT_SPINNING) return;
        
        this.cannon.fire();
    }

    /**
     * Activate left flipper
     */
    activateLeftFlipper() {
        this.flippers.activateLeft();
    }

    /**
     * Deactivate left flipper
     */
    deactivateLeftFlipper() {
        this.flippers.deactivateLeft();
    }

    /**
     * Activate right flipper
     */
    activateRightFlipper() {
        this.flippers.activateRight();
    }

    /**
     * Deactivate right flipper
     */
    deactivateRightFlipper() {
        this.flippers.deactivateRight();
    }

    /**
     * Trigger jackpot spin
     */
    triggerJackpot() {
        if (this.state !== GameState.JACKPOT_READY) return;
        
        this.state = GameState.JACKPOT_SPINNING;
        this.jackpot.spin();
    }

    /**
     * Handle jackpot complete
     */
    onJackpotComplete(result) {
        this.state = GameState.JACKPOT_PAYOUT;
        
        // Process rewards
        if (result.freeBalls > 0) {
            this.balls.addBalls(result.freeBalls);
        }
        if (result.points > 0) {
            this.score.addScore(result.points);
        }
        if (result.multiplierBonus > 0) {
            this.score.setSessionMultiplier(result.multiplierBonus);
        }
        if (result.unlockRapidFire) {
            this.cannon.enableRapidFire();
        }
        
        // Clear jackpot after payout
        setTimeout(() => {
            this.jackpot.reset();
            this.state = GameState.PLAYING;
        }, CONFIG.JACKPOT.LOCKOUT_DURATION * 1000);
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.state = GameState.GAME_OVER;
        this.audio.playSound('gameOver');
        
        const finalScore = this.score.currentScore;
        const isHighScore = this.storage.isHighScore(finalScore);
        
        this.ui.showGameOver(finalScore, isHighScore);
    }

    /**
     * Restart the game
     */
    restart() {
        // Reset all systems
        this.score.reset();
        this.balls.reset();
        this.cannon.reset();
        this.flippers.reset();
        this.jackpot.reset();
        
        // Hide game over screen
        this.ui.hideGameOver();
        
        // Reset state
        this.state = GameState.PLAYING;
    }

    /**
     * Submit high score
     */
    submitHighScore(initials) {
        this.storage.addHighScore({
            score: this.score.currentScore,
            initials: initials.toUpperCase(),
            date: new Date().toISOString().split('T')[0]
        });
        
        this.ui.refreshLeaderboard();
    }

    /**
     * Get scene (for adding objects)
     */
    get scene() {
        return this.renderer.scene;
    }

    /**
     * Get physics world
     */
    get world() {
        return this.physics.world;
    }
}

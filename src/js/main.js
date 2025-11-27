/**
 * 3D Hybrid Pachinko/Pinball Simulation
 * Main Entry Point
 * 
 * Tech Stack: Three.js (WebGL 2.0 with WebGPU detection) + Cannon-es Physics
 */

import { Game } from './game.js';

// Global game instance
let game = null;

/**
 * Initialize the game when DOM is ready
 */
async function init() {
    try {
        // Update loading text
        const loadingText = document.getElementById('loading-text');
        loadingText.textContent = 'Detecting GPU capabilities...';

        // Create and initialize game
        game = new Game();
        await game.init();

        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        
        // Start the game loop
        game.start();
        
        console.log('3D Hybrid Pachinko/Pinball initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        const loadingText = document.getElementById('loading-text');
        loadingText.textContent = 'Error initializing game: ' + error.message;
        loadingText.style.color = '#ef4444';
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.getGame = () => game;

/**
 * UI Manager
 * Handles HUD updates and overlays
 */

export class UIManager {
    constructor(game) {
        this.game = game;
        
        // DOM elements cache
        this.elements = {};
        
        // Event notification timeout
        this.eventNotificationTimeout = null;
    }

    /**
     * Initialize UI
     */
    init() {
        // Cache DOM elements
        this.elements = {
            scoreValue: document.getElementById('score-value'),
            ballsValue: document.getElementById('balls-value'),
            multiplierBadge: document.getElementById('multiplier-badge'),
            comboDisplay: document.getElementById('combo-display'),
            comboText: document.getElementById('combo-text'),
            eventNotification: document.getElementById('event-notification'),
            eventText: document.getElementById('event-text'),
            rapidFireIndicator: document.getElementById('rapid-fire-indicator'),
            fpsCounter: document.getElementById('fps-counter'),
            
            // Jackpot
            jackpotOverlay: document.getElementById('jackpot-overlay'),
            jackpotHandleContainer: document.getElementById('jackpot-handle-container'),
            jackpotCount: document.getElementById('jackpot-count'),
            reels: [
                document.getElementById('reel-1'),
                document.getElementById('reel-2'),
                document.getElementById('reel-3')
            ],
            spinButton: document.getElementById('spin-button'),
            jackpotResult: document.getElementById('jackpot-result'),
            jackpotCountdown: document.getElementById('jackpot-countdown'),
            countdownValue: document.getElementById('countdown-value'),
            
            // Game over
            gameOverScreen: document.getElementById('game-over-screen'),
            finalScore: document.getElementById('final-score'),
            highScoreForm: document.getElementById('high-score-form'),
            initialsInput: document.getElementById('initials-input'),
            highScoresList: document.getElementById('high-scores-list'),
            
            // Fire button
            fireButton: document.getElementById('fire-button')
        };
        
        console.log('UI manager initialized');
    }

    /**
     * Update UI (called every frame)
     */
    update(deltaTime) {
        // UI updates happen through specific methods
    }

    /**
     * Update score display
     */
    updateScore(score) {
        this.elements.scoreValue.textContent = this.formatNumber(score);
    }

    /**
     * Update ball count display
     */
    updateBallCount(count) {
        this.elements.ballsValue.textContent = this.formatNumber(count);
        
        // Warning animation when low on balls
        if (count < 50) {
            this.elements.ballsValue.classList.add('warning');
        } else {
            this.elements.ballsValue.classList.remove('warning');
        }
    }

    /**
     * Update multiplier badge
     */
    updateMultiplier(multiplier) {
        if (multiplier > 1) {
            this.elements.multiplierBadge.textContent = `SESSION ${multiplier}x`;
            this.elements.multiplierBadge.classList.remove('hidden');
        } else {
            this.elements.multiplierBadge.classList.add('hidden');
        }
    }

    /**
     * Update combo display
     */
    updateCombo(comboCount) {
        if (comboCount > 1) {
            this.elements.comboText.textContent = `COMBO x${comboCount}`;
            this.elements.comboDisplay.classList.remove('hidden');
        } else {
            this.elements.comboDisplay.classList.add('hidden');
        }
    }

    /**
     * Show event notification
     */
    showEventNotification(text, color = '#22c55e') {
        // Clear existing timeout
        if (this.eventNotificationTimeout) {
            clearTimeout(this.eventNotificationTimeout);
        }
        
        this.elements.eventText.textContent = text;
        this.elements.eventText.style.color = color;
        this.elements.eventNotification.classList.remove('hidden');
        
        // Hide after 1.5 seconds
        this.eventNotificationTimeout = setTimeout(() => {
            this.elements.eventNotification.classList.add('hidden');
        }, 1500);
    }

    /**
     * Show rapid fire indicator
     */
    showRapidFire() {
        this.elements.rapidFireIndicator.classList.remove('hidden');
    }

    /**
     * Hide rapid fire indicator
     */
    hideRapidFire() {
        this.elements.rapidFireIndicator.classList.add('hidden');
    }

    /**
     * Update FPS counter
     */
    updateFPS(fps) {
        this.elements.fpsCounter.textContent = `${fps} FPS`;
    }

    /**
     * Update jackpot ball count
     */
    updateJackpotCount(count, max) {
        this.elements.jackpotCount.textContent = `${count}/${max}`;
        
        if (count >= max) {
            this.elements.jackpotHandleContainer.classList.remove('disabled');
            this.elements.jackpotHandleContainer.classList.add('ready');
        } else {
            this.elements.jackpotHandleContainer.classList.add('disabled');
            this.elements.jackpotHandleContainer.classList.remove('ready');
        }
    }

    /**
     * Show jackpot ready state
     */
    showJackpotReady() {
        this.elements.jackpotHandleContainer.classList.remove('disabled');
        this.elements.jackpotHandleContainer.classList.add('ready');
        this.showEventNotification('JACKPOT READY!', '#facc15');
    }

    /**
     * Show jackpot overlay
     */
    showJackpotOverlay() {
        this.elements.jackpotOverlay.classList.remove('hidden');
        this.elements.spinButton.disabled = false;
        this.elements.jackpotResult.textContent = '';
        this.elements.jackpotResult.className = '';
        
        // Reset reels
        this.elements.reels.forEach(reel => {
            reel.textContent = '?';
            reel.classList.remove('spinning');
        });
    }

    /**
     * Hide jackpot overlay
     */
    hideJackpotOverlay() {
        this.elements.jackpotOverlay.classList.add('hidden');
        this.elements.jackpotHandleContainer.classList.add('disabled');
        this.elements.jackpotHandleContainer.classList.remove('ready');
    }

    /**
     * Start reel spinning animation
     */
    startReelSpinning(reelIndex) {
        if (this.elements.reels[reelIndex]) {
            this.elements.reels[reelIndex].classList.add('spinning');
        }
    }

    /**
     * Stop reel at symbol
     */
    stopReel(reelIndex, symbol) {
        if (this.elements.reels[reelIndex]) {
            this.elements.reels[reelIndex].classList.remove('spinning');
            this.elements.reels[reelIndex].textContent = symbol;
        }
    }

    /**
     * Show jackpot result
     */
    showJackpotResult(text, isWin, isMegaWin = false) {
        this.elements.jackpotResult.textContent = text;
        this.elements.spinButton.disabled = true;
        
        if (isMegaWin) {
            this.elements.jackpotResult.className = 'mega-win';
        } else if (isWin) {
            this.elements.jackpotResult.className = 'win';
        } else {
            this.elements.jackpotResult.className = '';
        }
    }

    /**
     * Show jackpot countdown
     */
    showJackpotCountdown(seconds) {
        this.elements.jackpotCountdown.classList.remove('hidden');
        this.elements.countdownValue.textContent = seconds;
    }

    /**
     * Hide jackpot countdown
     */
    hideJackpotCountdown() {
        this.elements.jackpotCountdown.classList.add('hidden');
    }

    /**
     * Update cannon cooldown display
     */
    updateCannonCooldown(remaining, total) {
        if (remaining > 0) {
            this.elements.fireButton.disabled = true;
            this.elements.fireButton.classList.add('cooldown');
            this.elements.fireButton.dataset.cooldown = `${remaining.toFixed(1)}s`;
        } else {
            this.elements.fireButton.disabled = false;
            this.elements.fireButton.classList.remove('cooldown');
            this.elements.fireButton.dataset.cooldown = '';
        }
    }

    /**
     * Show game over screen
     */
    showGameOver(finalScore, isHighScore) {
        this.elements.gameOverScreen.classList.remove('hidden');
        this.elements.finalScore.textContent = `Final Score: ${this.formatNumber(finalScore)}`;
        
        if (isHighScore) {
            this.elements.highScoreForm.classList.remove('hidden');
            this.elements.initialsInput.value = '';
            this.elements.initialsInput.focus();
        } else {
            this.elements.highScoreForm.classList.add('hidden');
        }
        
        this.refreshLeaderboard();
    }

    /**
     * Hide game over screen
     */
    hideGameOver() {
        this.elements.gameOverScreen.classList.add('hidden');
    }

    /**
     * Refresh leaderboard display
     */
    refreshLeaderboard() {
        const highScores = this.game.storage.getHighScores();
        this.elements.highScoresList.innerHTML = '';
        
        highScores.slice(0, 10).forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="initials">${entry.initials}</span>
                <span class="score">${this.formatNumber(entry.score)}</span>
            `;
            this.elements.highScoresList.appendChild(li);
        });
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

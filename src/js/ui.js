/**
 * UI Manager
 * Handles HUD updates, overlays, and settings modal
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
            fireButton: document.getElementById('fire-button'),
            
            // Settings
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            closeSettings: document.getElementById('close-settings'),
            masterVolume: document.getElementById('master-volume'),
            muteToggle: document.getElementById('mute-toggle')
        };
        
        // Setup settings modal
        this.setupSettingsModal();
        
        console.log('UI manager initialized');
    }
    
    /**
     * Setup settings modal event listeners
     */
    setupSettingsModal() {
        const settingsBtn = this.elements.settingsBtn;
        const settingsModal = this.elements.settingsModal;
        const closeSettings = this.elements.closeSettings;
        
        if (settingsBtn && settingsModal) {
            // Open settings
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('hidden');
            });
            
            // Close settings
            if (closeSettings) {
                closeSettings.addEventListener('click', () => {
                    settingsModal.classList.add('hidden');
                });
            }
            
            // Close on backdrop click
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.add('hidden');
                }
            });
        }
        
        // Master volume slider
        const masterVolumeSlider = this.elements.masterVolume;
        if (masterVolumeSlider) {
            masterVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                this.game.audio.setMasterVolume(volume);
                const valueDisplay = document.getElementById('master-volume-val');
                if (valueDisplay) {
                    valueDisplay.textContent = `${e.target.value}%`;
                }
            });
        }
        
        // Individual sound volume sliders
        this.setupSoundVolumeSliders();
        
        // Mute toggle
        const muteToggle = this.elements.muteToggle;
        if (muteToggle) {
            muteToggle.addEventListener('click', () => {
                const isMuted = this.game.audio.toggleMute();
                muteToggle.textContent = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
                muteToggle.classList.toggle('muted', isMuted);
            });
        }
        
        // Preset buttons
        this.setupPresetButtons();
        
        // Test buttons
        this.setupTestButtons();
    }
    
    /**
     * Setup individual sound volume sliders
     */
    setupSoundVolumeSliders() {
        const soundMappings = {
            'sfx-fire-vol': 'fire',
            'sfx-peg-vol': 'peg',
            'sfx-bumper-vol': 'bumper',
            'sfx-target-vol': 'target',
            'sfx-jackpot-vol': 'jackpotTrigger',
            'sfx-reel-vol': 'reelSpin',
            'sfx-win-vol': 'jackpotWin',
            'sfx-drain-vol': 'drain',
            'sfx-flipper-vol': 'flipper'
        };
        
        Object.entries(soundMappings).forEach(([sliderId, soundName]) => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const volume = parseInt(e.target.value) / 100;
                    this.game.audio.setSoundVolume(soundName, volume);
                    
                    // Update display
                    const parent = slider.closest('.sound-control');
                    if (parent) {
                        const display = parent.querySelector('.vol-display');
                        if (display) {
                            display.textContent = `${e.target.value}%`;
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Setup preset buttons
     */
    setupPresetButtons() {
        // Define volume presets
        const PRESETS = {
            ARCADE: { master: 100, sounds: 80 },  // Default arcade experience
            QUIET: { master: 50, sounds: 40 },     // Low volume for quieter environments
            LOUD: { master: 100, sounds: 100 }     // Maximum volume
        };
        
        // Arcade preset (default)
        const arcadeBtn = document.getElementById('preset-arcade');
        if (arcadeBtn) {
            arcadeBtn.addEventListener('click', () => {
                this.applyPreset(PRESETS.ARCADE);
            });
        }
        
        // Quiet preset
        const quietBtn = document.getElementById('preset-quiet');
        if (quietBtn) {
            quietBtn.addEventListener('click', () => {
                this.applyPreset(PRESETS.QUIET);
            });
        }
        
        // Loud preset
        const loudBtn = document.getElementById('preset-loud');
        if (loudBtn) {
            loudBtn.addEventListener('click', () => {
                this.applyPreset(PRESETS.LOUD);
            });
        }
        
        // Reset preset (same as Arcade - default settings)
        const resetBtn = document.getElementById('preset-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.applyPreset(PRESETS.ARCADE);
            });
        }
    }
    
    /**
     * Apply a volume preset
     */
    applyPreset(preset) {
        // Update master volume
        const masterSlider = document.getElementById('master-volume');
        if (masterSlider) {
            masterSlider.value = preset.master;
            this.game.audio.setMasterVolume(preset.master / 100);
            const masterDisplay = document.getElementById('master-volume-val');
            if (masterDisplay) {
                masterDisplay.textContent = `${preset.master}%`;
            }
        }
        
        // Update all sound sliders
        const soundSliders = document.querySelectorAll('[id^="sfx-"]');
        soundSliders.forEach(slider => {
            slider.value = preset.sounds;
            const parent = slider.closest('.sound-control');
            if (parent) {
                const display = parent.querySelector('.vol-display');
                if (display) {
                    display.textContent = `${preset.sounds}%`;
                }
            }
        });
        
        // Apply to audio manager
        const soundMappings = ['fire', 'peg', 'bumper', 'target', 'jackpotTrigger', 'reelSpin', 'jackpotWin', 'drain', 'flipper'];
        soundMappings.forEach(sound => {
            this.game.audio.setSoundVolume(sound, preset.sounds / 100);
        });
    }
    
    /**
     * Setup test sound buttons
     */
    setupTestButtons() {
        const testButtons = document.querySelectorAll('.test-btn');
        testButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const soundName = btn.getAttribute('data-sound');
                if (soundName) {
                    this.game.audio.playSound(soundName);
                }
            });
        });
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

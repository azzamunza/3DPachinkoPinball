/**
 * Score Manager
 * Handles scoring, combos, and multipliers
 */

import { CONFIG } from './config.js';

export class ScoreManager {
    constructor(game) {
        this.game = game;
        
        // Score state
        this.currentScore = 0;
        this.sessionMultiplier = 1;
        
        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        
        // Achievement tracking
        this.achievements = {
            firstBumper: false,
            firstRamp: false,
            allTargets: false
        };
        
        // Statistics
        this.stats = {
            pegsHit: 0,
            bumpersHit: 0,
            rampsCompleted: 0,
            targetsHit: 0,
            jackpotsWon: 0
        };
    }

    /**
     * Initialize score manager
     */
    init() {
        this.reset();
        console.log('Score manager initialized');
    }

    /**
     * Update score system
     */
    update(deltaTime) {
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
    }

    /**
     * Add score with multiplier
     */
    addScore(points) {
        const multipliedPoints = Math.floor(points * this.sessionMultiplier);
        this.currentScore += multipliedPoints;
        this.game.ui.updateScore(this.currentScore);
        return multipliedPoints;
    }

    /**
     * Add peg hit score
     */
    addPegHit() {
        const points = CONFIG.SCORING.PEG_CONTACT;
        this.addScore(points);
        this.incrementCombo();
        this.stats.pegsHit++;
    }

    /**
     * Add bumper hit score
     */
    addBumperHit() {
        const points = CONFIG.SCORING.BUMPER_HIT;
        const awarded = this.addScore(points);
        this.incrementCombo();
        this.stats.bumpersHit++;
        
        // Achievement check
        if (!this.achievements.firstBumper) {
            this.achievements.firstBumper = true;
            this.addScore(CONFIG.SCORING.ACHIEVEMENTS.FIRST_BUMPER);
            this.game.ui.showEventNotification('First Bumper! +100', '#facc15');
        }
        
        // Consecutive bumper bonus
        if (this.comboCount >= 3 && this.comboCount % 3 === 0) {
            this.addScore(CONFIG.SCORING.ACHIEVEMENTS.CONSECUTIVE_BUMPERS);
            this.game.ui.showEventNotification(`${this.comboCount}x Combo! +1000`, '#ff00ff');
        }
        
        this.game.ui.showEventNotification(`+${awarded} BUMPER!`, '#ff4400');
    }

    /**
     * Add ramp completion score
     */
    addRampCompletion() {
        const points = CONFIG.SCORING.RAMP_COMPLETION;
        const awarded = this.addScore(points);
        this.incrementCombo();
        this.stats.rampsCompleted++;
        
        // Achievement check
        if (!this.achievements.firstRamp) {
            this.achievements.firstRamp = true;
            this.addScore(CONFIG.SCORING.ACHIEVEMENTS.FIRST_RAMP);
            this.game.ui.showEventNotification('First Ramp! +500', '#facc15');
        }
        
        this.game.ui.showEventNotification(`+${awarded} RAMP!`, '#00ff00');
    }

    /**
     * Add target hit score
     */
    addTargetHit(isBonus) {
        const points = isBonus 
            ? CONFIG.SCORING.TARGET_BONUS 
            : CONFIG.SCORING.TARGET_STANDARD;
        const awarded = this.addScore(points);
        this.incrementCombo();
        this.stats.targetsHit++;
        
        const color = isBonus ? '#ff00ff' : '#00ff00';
        this.game.ui.showEventNotification(`+${awarded} TARGET!`, color);
    }

    /**
     * Add all targets complete bonus
     */
    addAllTargetsComplete() {
        const points = CONFIG.SCORING.ALL_TARGETS_BONUS;
        this.addScore(points);
        this.achievements.allTargets = true;
        
        this.game.ui.showEventNotification('+10,000 ALL TARGETS!', '#facc15');
    }

    /**
     * Add jackpot entry score
     */
    addJackpotEntry() {
        const points = CONFIG.SCORING.JACKPOT_ENTRY;
        this.addScore(points);
        
        this.game.ui.showEventNotification(`+${points} JACKPOT ENTRY!`, '#00ffff');
    }

    /**
     * Set session multiplier
     */
    setSessionMultiplier(multiplier) {
        if (multiplier > this.sessionMultiplier) {
            this.sessionMultiplier = multiplier;
            this.game.ui.updateMultiplier(this.sessionMultiplier);
            this.game.ui.showEventNotification(`SESSION ${multiplier}x ACTIVE!`, '#00ffff');
        }
    }

    /**
     * Increment combo counter
     */
    incrementCombo() {
        this.comboCount++;
        this.comboTimer = CONFIG.SCORING.COMBO_TIMEOUT;
        this.game.ui.updateCombo(this.comboCount);
    }

    /**
     * Reset combo
     */
    resetCombo() {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.game.ui.updateCombo(0);
    }

    /**
     * Get current score for jackpot calculation
     */
    getCurrentScore() {
        return this.currentScore;
    }

    /**
     * Reset score manager
     */
    reset() {
        this.currentScore = 0;
        this.sessionMultiplier = 1;
        this.comboCount = 0;
        this.comboTimer = 0;
        
        this.achievements = {
            firstBumper: false,
            firstRamp: false,
            allTargets: false
        };
        
        this.stats = {
            pegsHit: 0,
            bumpersHit: 0,
            rampsCompleted: 0,
            targetsHit: 0,
            jackpotsWon: 0
        };
        
        this.game.ui.updateScore(0);
        this.game.ui.updateMultiplier(1);
        this.game.ui.updateCombo(0);
    }
}

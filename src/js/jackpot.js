/**
 * Jackpot Machine Module
 * Handles 3D slot machine with spinning reels
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class JackpotMachine {
    constructor(game) {
        this.game = game;
        
        // State
        this.ballsInChute = 0;
        this.isSpinning = false;
        this.autoSpinCountdown = 0;
        
        // Reels
        this.reels = [];
        this.reelResults = [];
        
        // Visual components
        this.machine = null;
        this.reelMeshes = [];
    }

    /**
     * Create jackpot machine visuals
     */
    create() {
        // Machine is primarily a UI overlay, but we add a 3D representation
        this.createMachineVisual();
        
        console.log('Jackpot machine created');
    }

    /**
     * Create 3D machine visual (visible on playfield)
     */
    createMachineVisual() {
        const group = new THREE.Group();
        group.position.set(0, -5, 0);
        
        // Machine body
        const bodyGeometry = new THREE.BoxGeometry(3, 2, 1);
        const bodyMaterial = this.game.renderer.createMaterial(CONFIG.MATERIALS.JACKPOT_MACHINE);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Neon frame
        const frameGeometry = new THREE.EdgesGeometry(bodyGeometry);
        const frameMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            linewidth: 2
        });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        group.add(frame);
        
        // Add glow effect
        const glowGeometry = new THREE.BoxGeometry(3.1, 2.1, 0.1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = 0.5;
        group.add(glow);
        
        // "JACKPOT" text placeholder (using simple geometry)
        const textGeometry = new THREE.PlaneGeometry(2, 0.3);
        const textMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const text = new THREE.Mesh(textGeometry, textMaterial);
        text.position.set(0, 0.7, 0.51);
        group.add(text);
        
        this.machine = group;
        this.game.renderer.add(group);
    }

    /**
     * Update jackpot machine
     */
    update(deltaTime) {
        // Update auto-spin countdown
        if (this.ballsInChute >= CONFIG.JACKPOT.THRESHOLD && !this.isSpinning) {
            if (this.autoSpinCountdown <= 0) {
                this.autoSpinCountdown = CONFIG.JACKPOT.AUTO_SPIN_DELAY;
            } else {
                this.autoSpinCountdown -= deltaTime;
                this.game.ui.showJackpotCountdown(Math.ceil(this.autoSpinCountdown));
                
                if (this.autoSpinCountdown <= 0) {
                    this.game.triggerJackpot();
                }
            }
        }
        
        // Animate machine glow when ready
        if (this.ballsInChute >= CONFIG.JACKPOT.THRESHOLD && this.machine) {
            const time = performance.now() * 0.003;
            const intensity = 0.3 + Math.sin(time) * 0.2;
            this.machine.children[2].material.opacity = intensity;
        }
    }

    /**
     * Add ball to chute
     */
    addBall() {
        this.ballsInChute++;
        this.game.ui.updateJackpotCount(this.ballsInChute, CONFIG.JACKPOT.THRESHOLD);
        
        if (this.ballsInChute >= CONFIG.JACKPOT.THRESHOLD) {
            this.game.ui.showJackpotReady();
        }
    }

    /**
     * Spin the reels
     */
    spin() {
        if (this.isSpinning) return;
        if (this.ballsInChute < CONFIG.JACKPOT.THRESHOLD) return;
        
        this.isSpinning = true;
        this.autoSpinCountdown = 0;
        this.game.ui.hideJackpotCountdown();
        
        // Show overlay
        this.game.ui.showJackpotOverlay();
        
        // Play spin sound
        this.game.audio.playSound('reelSpin');
        
        // Start spinning animation
        this.startSpinAnimation();
    }

    /**
     * Start reel spinning animation
     */
    startSpinAnimation() {
        const spinDuration = CONFIG.JACKPOT.SPIN_DURATION * 1000;
        const symbols = CONFIG.JACKPOT.SYMBOLS;
        const weights = CONFIG.JACKPOT.SYMBOL_WEIGHTS;
        
        // Start all reels spinning
        for (let i = 0; i < 3; i++) {
            this.game.ui.startReelSpinning(i);
        }
        
        // Create spin intervals
        const spinInterval = setInterval(() => {
            // Randomize displayed symbols during spin
            for (let i = 0; i < 3; i++) {
                const randomSymbol = this.getWeightedRandomSymbol(symbols, weights);
                this.game.ui.stopReel(i, randomSymbol);
                this.game.ui.startReelSpinning(i);
            }
        }, 100);
        
        // Schedule reel stops
        const stopDelays = [
            spinDuration * 0.5,
            spinDuration * 0.75,
            spinDuration
        ];
        
        this.reelResults = [];
        
        stopDelays.forEach((delay, index) => {
            setTimeout(() => {
                // Clear spinning animation for this reel
                clearInterval(spinInterval);
                
                // Get final symbol using GPU noise RNG
                const finalSymbol = this.getRandomSymbol();
                this.reelResults[index] = finalSymbol;
                
                // Stop reel at final symbol
                this.game.ui.stopReel(index, this.getSymbolDisplay(finalSymbol));
                
                // Play stop sound
                this.game.audio.playSound('reelStop');
                
                // Check for completion
                if (index === 2) {
                    this.onSpinComplete();
                }
            }, delay);
        });
    }

    /**
     * Get weighted random symbol
     */
    getWeightedRandomSymbol(symbols, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < symbols.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return symbols[i];
            }
        }
        
        return symbols[0];
    }

    /**
     * Get random symbol using GPU noise RNG
     */
    getRandomSymbol() {
        const symbols = CONFIG.JACKPOT.SYMBOLS;
        const weights = CONFIG.JACKPOT.SYMBOL_WEIGHTS;
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        // Use GPU noise RNG
        let random = this.game.getGPUNoiseRNG() * totalWeight;
        
        for (let i = 0; i < symbols.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return symbols[i];
            }
        }
        
        return symbols[0];
    }

    /**
     * Get display string for symbol
     */
    getSymbolDisplay(symbol) {
        const displayMap = {
            '1x': '1️⃣',
            '2x': '2️⃣',
            '3x': '3️⃣',
            '4x': '4️⃣',
            '5x': '5️⃣',
            'BONUS': '🎁',
            'FREE': '🎯',
            'WILD': '⭐',
            'JACKPOT': '💎',
            'SPECIAL': '🌟'
        };
        return displayMap[symbol] || symbol;
    }

    /**
     * Handle spin completion
     */
    onSpinComplete() {
        // Calculate result
        const result = this.evaluateResult(this.reelResults);
        
        // Display result
        this.displayResult(result);
        
        // Play appropriate sound
        if (result.isMegaWin) {
            this.game.audio.playSound('jackpotWin');
        } else if (result.isWin) {
            this.game.audio.playSound('allTargets');
        }
        
        // Notify game after delay
        setTimeout(() => {
            this.game.onJackpotComplete(result);
            this.isSpinning = false;
            
            // Hide overlay
            setTimeout(() => {
                this.game.ui.hideJackpotOverlay();
            }, 1000);
        }, 2000);
    }

    /**
     * Evaluate reel results
     */
    evaluateResult(reels) {
        const [r1, r2, r3] = reels;
        const payouts = CONFIG.JACKPOT.PAYOUTS;
        
        let result = {
            isWin: false,
            isMegaWin: false,
            freeBalls: 0,
            points: 0,
            multiplierBonus: 0,
            unlockRapidFire: false,
            message: ''
        };
        
        // Check for triple JACKPOT
        if (r1 === 'JACKPOT' && r2 === 'JACKPOT' && r3 === 'JACKPOT') {
            result.isWin = true;
            result.isMegaWin = true;
            result.freeBalls = payouts.TRIPLE_JACKPOT_FREE_BALLS;
            result.points = payouts.TRIPLE_JACKPOT_POINTS;
            result.multiplierBonus = 2;
            result.message = '💎💎💎 MEGA JACKPOT! 💎💎💎';
            return result;
        }
        
        // Check for triple BONUS
        if (r1 === 'BONUS' && r2 === 'BONUS' && r3 === 'BONUS') {
            result.isWin = true;
            result.freeBalls = payouts.TRIPLE_BONUS_FREE_BALLS;
            result.points = payouts.TRIPLE_BONUS_POINTS;
            result.unlockRapidFire = true;
            result.message = '🎁🎁🎁 TRIPLE BONUS! 🎁🎁🎁';
            return result;
        }
        
        // Check for triple FREE BALL
        if (r1 === 'FREE' && r2 === 'FREE' && r3 === 'FREE') {
            result.isWin = true;
            result.freeBalls = payouts.TRIPLE_FREE_BALL_FREE_BALLS;
            result.points = payouts.TRIPLE_FREE_BALL_POINTS;
            result.message = '🎯🎯🎯 FREE BALL FRENZY! 🎯🎯🎯';
            return result;
        }
        
        // Check for matching multipliers
        const multipliers = ['1x', '2x', '3x', '4x', '5x'];
        if (multipliers.includes(r1) && multipliers.includes(r2) && multipliers.includes(r3)) {
            const m1 = parseInt(r1);
            const m2 = parseInt(r2);
            const m3 = parseInt(r3);
            const totalMultiplier = m1 * m2 * m3;
            
            result.isWin = true;
            result.freeBalls = payouts.TRIPLE_MULTIPLIER_FREE_BALLS;
            result.points = this.game.score.currentScore * totalMultiplier;
            result.message = `${totalMultiplier}x MULTIPLIER!`;
            
            if (totalMultiplier >= 60) {
                result.isMegaWin = true;
            }
            return result;
        }
        
        // Check for two JACKPOTs (with WILD)
        const jackpotCount = reels.filter(r => r === 'JACKPOT' || r === 'WILD').length;
        if (jackpotCount >= 2 && reels.includes('JACKPOT')) {
            result.isWin = true;
            result.freeBalls = payouts.TWO_JACKPOT_FREE_BALLS;
            result.points = payouts.TWO_JACKPOT_POINTS;
            result.message = '💎⭐💎 TWO JACKPOTS! 💎⭐💎';
            return result;
        }
        
        // Check for any matching (with WILD support)
        const counts = {};
        reels.forEach(r => {
            if (r === 'WILD') {
                // WILD matches everything
                Object.keys(counts).forEach(k => counts[k]++);
            } else {
                counts[r] = (counts[r] || 0) + 1;
            }
        });
        
        const maxMatch = Math.max(...Object.values(counts), 0);
        if (maxMatch >= 3) {
            result.isWin = true;
            result.freeBalls = payouts.CONSOLATION_FREE_BALLS * 3;
            result.points = payouts.CONSOLATION_POINTS * 2;
            result.message = 'TRIPLE MATCH!';
            return result;
        }
        
        // Consolation prize
        result.isWin = false;
        result.freeBalls = payouts.CONSOLATION_FREE_BALLS;
        result.points = payouts.CONSOLATION_POINTS;
        result.message = 'Better luck next time!';
        
        return result;
    }

    /**
     * Display result on UI
     */
    displayResult(result) {
        let displayText = result.message;
        
        if (result.freeBalls > 0) {
            displayText += `\n+${result.freeBalls} FREE BALLS`;
        }
        if (result.points > 0) {
            displayText += `\n+${this.formatNumber(result.points)} POINTS`;
        }
        
        this.game.ui.showJackpotResult(displayText, result.isWin, result.isMegaWin);
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Reset jackpot machine
     */
    reset() {
        this.ballsInChute = 0;
        this.isSpinning = false;
        this.autoSpinCountdown = 0;
        this.reelResults = [];
        
        this.game.ui.updateJackpotCount(0, CONFIG.JACKPOT.THRESHOLD);
        this.game.ui.hideJackpotOverlay();
        this.game.ui.hideJackpotCountdown();
    }
}

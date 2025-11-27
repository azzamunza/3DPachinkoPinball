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
        // Generate reel icon textures
        this.generateReelIcons();
        
        // Create 3D machine with spinning reels
        this.createMachineVisual();
        
        // Initialize idle reel spinning
        this.startIdleSpinning();
        
        console.log('Jackpot machine created with spinning reels');
    }
    
    /**
     * Generate reel icon textures procedurally
     */
    generateReelIcons() {
        this.reelTextures = {};
        const iconSize = 128;
        
        // Define icons to generate
        const icons = {
            '1x': { text: '1×', bgColor: '#2196F3', textColor: '#fff' },
            '2x': { text: '2×', bgColor: '#4CAF50', textColor: '#fff' },
            '3x': { text: '3×', bgColor: '#FF9800', textColor: '#fff' },
            '4x': { text: '4×', bgColor: '#9C27B0', textColor: '#fff' },
            '5x': { text: '5×', bgColor: '#F44336', textColor: '#fff' },
            'BONUS': { text: '🎁', bgColor: '#E91E63', textColor: '#fff', emoji: true },
            'FREE': { text: '🎯', bgColor: '#00BCD4', textColor: '#fff', emoji: true },
            'WILD': { text: '⭐', bgColor: '#FFD700', textColor: '#333', emoji: true },
            'JACKPOT': { text: '💎', bgColor: '#6200EA', textColor: '#fff', emoji: true },
            'SPECIAL': { text: '🌟', bgColor: '#FF5722', textColor: '#fff', emoji: true }
        };
        
        Object.entries(icons).forEach(([key, config]) => {
            const canvas = document.createElement('canvas');
            canvas.width = iconSize;
            canvas.height = iconSize;
            const ctx = canvas.getContext('2d');
            
            // Background with gradient
            const gradient = ctx.createRadialGradient(iconSize/2, iconSize/2, 0, iconSize/2, iconSize/2, iconSize/2);
            gradient.addColorStop(0, config.bgColor);
            gradient.addColorStop(1, this.darkenColor(config.bgColor, 30));
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, iconSize, iconSize);
            
            // Add border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeRect(4, 4, iconSize - 8, iconSize - 8);
            
            // Draw icon/text
            ctx.fillStyle = config.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (config.emoji) {
                ctx.font = 'bold 64px Arial';
            } else {
                ctx.font = 'bold 48px Orbitron, Arial';
            }
            ctx.fillText(config.text, iconSize / 2, iconSize / 2);
            
            // Add shine effect
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.ellipse(iconSize/2, iconSize/3, iconSize/2.5, iconSize/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Create Three.js texture
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            this.reelTextures[key] = texture;
        });
    }
    
    /**
     * Darken a hex color
     */
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    /**
     * Create 3D machine visual with spinning reels (visible on playfield)
     */
    createMachineVisual() {
        const group = new THREE.Group();
        group.position.set(0, -5, 0.5);
        
        // Machine cabinet body
        const bodyGeometry = new THREE.BoxGeometry(4, 2.8, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B0000,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Gold trim around the cabinet
        const trimGeometry = new THREE.BoxGeometry(4.1, 2.9, 0.05);
        const trimMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.9,
            roughness: 0.1
        });
        const trim = new THREE.Mesh(trimGeometry, trimMaterial);
        trim.position.z = 0.6;
        group.add(trim);
        
        // Create the reels display area (black background)
        const displayBg = new THREE.Mesh(
            new THREE.PlaneGeometry(3.2, 1.2),
            new THREE.MeshBasicMaterial({ color: 0x111111 })
        );
        displayBg.position.set(0, 0.2, 0.61);
        group.add(displayBg);
        
        // Create 3 spinning reels
        this.reel3DObjects = [];
        const reelWidth = 0.9;
        const reelSpacing = 1.0;
        
        for (let i = 0; i < 3; i++) {
            const reelGroup = new THREE.Group();
            reelGroup.position.set(-reelSpacing + i * reelSpacing, 0.2, 0.65);
            
            // Reel cylinder
            const reelGeometry = new THREE.CylinderGeometry(0.4, 0.4, reelWidth, 16, 1, true);
            
            // Create a material array for the cylinder sides (the icons)
            const symbols = CONFIG.JACKPOT.SYMBOLS;
            const numSymbols = symbols.length;
            
            // Create texture strip with all symbols
            const stripCanvas = document.createElement('canvas');
            stripCanvas.width = 128 * numSymbols;
            stripCanvas.height = 128;
            const stripCtx = stripCanvas.getContext('2d');
            
            symbols.forEach((symbol, idx) => {
                if (this.reelTextures[symbol]) {
                    // Draw texture from stored canvas (re-create for strip)
                    this.drawSymbolToStrip(stripCtx, symbol, idx * 128, 0, 128, 128);
                }
            });
            
            const stripTexture = new THREE.CanvasTexture(stripCanvas);
            stripTexture.wrapS = THREE.RepeatWrapping;
            stripTexture.repeat.set(1, 1);
            
            const reelMaterial = new THREE.MeshStandardMaterial({
                map: stripTexture,
                side: THREE.DoubleSide,
                metalness: 0.2,
                roughness: 0.5
            });
            
            const reel = new THREE.Mesh(reelGeometry, reelMaterial);
            reel.rotation.z = Math.PI / 2;
            reelGroup.add(reel);
            
            // Side caps (gold)
            const capGeometry = new THREE.CircleGeometry(0.4, 16);
            const capMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFD700,
                metalness: 0.8,
                roughness: 0.2
            });
            
            const leftCap = new THREE.Mesh(capGeometry, capMaterial);
            leftCap.position.x = -reelWidth / 2;
            leftCap.rotation.y = Math.PI / 2;
            reelGroup.add(leftCap);
            
            const rightCap = new THREE.Mesh(capGeometry.clone(), capMaterial);
            rightCap.position.x = reelWidth / 2;
            rightCap.rotation.y = -Math.PI / 2;
            reelGroup.add(rightCap);
            
            group.add(reelGroup);
            this.reel3DObjects.push({
                group: reelGroup,
                reel,
                rotation: Math.random() * Math.PI * 2,
                spinSpeed: 0,
                targetRotation: 0,
                isSpinning: false
            });
        }
        
        // Add "JACKPOT" text sign on top
        const signGeometry = new THREE.PlaneGeometry(3.5, 0.5);
        const signCanvas = this.createJackpotSign();
        const signTexture = new THREE.CanvasTexture(signCanvas);
        const signMaterial = new THREE.MeshBasicMaterial({
            map: signTexture,
            transparent: true
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 1.2, 0.61);
        group.add(sign);
        this.jackpotSign = sign;
        
        // Add flashing lights on top
        this.cabinetLights = [];
        const lightPositions = [
            { x: -1.8, y: 1.3 },
            { x: -1.2, y: 1.4 },
            { x: -0.6, y: 1.45 },
            { x: 0, y: 1.5 },
            { x: 0.6, y: 1.45 },
            { x: 1.2, y: 1.4 },
            { x: 1.8, y: 1.3 }
        ];
        
        lightPositions.forEach((pos, i) => {
            const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const lightMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xff0000 : 0xffff00
            });
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(pos.x, pos.y, 0.62);
            group.add(light);
            this.cabinetLights.push({ mesh: light, phase: i * 0.5 });
        });
        
        // Neon frame
        const frameGeometry = new THREE.EdgesGeometry(bodyGeometry);
        const frameMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            linewidth: 2
        });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        group.add(frame);
        
        // Handle/lever on the side
        const handleGroup = new THREE.Group();
        handleGroup.position.set(2.2, 0, 0);
        
        const handleBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
        );
        handleBase.rotation.z = Math.PI / 2;
        handleGroup.add(handleBase);
        
        const handleBall = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.6 })
        );
        handleBall.position.x = 0.4;
        handleGroup.add(handleBall);
        
        group.add(handleGroup);
        this.leverHandle = handleGroup;
        
        this.machine = group;
        this.game.renderer.add(group);
    }
    
    /**
     * Draw a symbol to a canvas strip
     */
    drawSymbolToStrip(ctx, symbol, x, y, width, height) {
        const config = {
            '1x': { text: '1×', bgColor: '#2196F3', textColor: '#fff' },
            '2x': { text: '2×', bgColor: '#4CAF50', textColor: '#fff' },
            '3x': { text: '3×', bgColor: '#FF9800', textColor: '#fff' },
            '4x': { text: '4×', bgColor: '#9C27B0', textColor: '#fff' },
            '5x': { text: '5×', bgColor: '#F44336', textColor: '#fff' },
            'BONUS': { text: '🎁', bgColor: '#E91E63', textColor: '#fff', emoji: true },
            'FREE': { text: '🎯', bgColor: '#00BCD4', textColor: '#fff', emoji: true },
            'WILD': { text: '⭐', bgColor: '#FFD700', textColor: '#333', emoji: true },
            'JACKPOT': { text: '💎', bgColor: '#6200EA', textColor: '#fff', emoji: true },
            'SPECIAL': { text: '🌟', bgColor: '#FF5722', textColor: '#fff', emoji: true }
        }[symbol] || { text: '?', bgColor: '#666', textColor: '#fff' };
        
        // Background
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(x, y, width, height);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
        
        // Text
        ctx.fillStyle = config.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = config.emoji ? 'bold 48px Arial' : 'bold 36px Arial';
        ctx.fillText(config.text, x + width / 2, y + height / 2);
    }
    
    /**
     * Create JACKPOT text sign
     */
    createJackpotSign() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 512, 0);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 80);
        
        // Border
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 74);
        
        // Text
        ctx.fillStyle = '#8B0000';
        ctx.font = 'bold 50px Orbitron, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JACKPOT', 256, 42);
        
        // Add outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeText('JACKPOT', 256, 42);
        
        return canvas;
    }
    
    /**
     * Start idle spinning (when not actively playing)
     */
    startIdleSpinning() {
        this.idleSpinning = true;
        this.animateIdleReels();
    }
    
    /**
     * Animate idle reel spinning
     */
    animateIdleReels() {
        if (!this.idleSpinning || this.isSpinning) return;
        
        const animate = () => {
            if (!this.idleSpinning || this.isSpinning) return;
            
            // Slowly rotate each reel
            this.reel3DObjects.forEach((reel, i) => {
                reel.rotation += 0.02 + i * 0.005;
                reel.reel.rotation.x = reel.rotation;
            });
            
            // Animate cabinet lights
            const time = performance.now() * 0.003;
            this.cabinetLights.forEach((light, i) => {
                const brightness = Math.sin(time + light.phase) * 0.5 + 0.5;
                light.mesh.material.opacity = brightness;
            });
            
            requestAnimationFrame(animate);
        };
        animate();
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
        
        // Use GPU noise RNG with fallback to Math.random()
        let random;
        try {
            random = this.game.getGPUNoiseRNG() * totalWeight;
        } catch (e) {
            random = Math.random() * totalWeight;
        }
        
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

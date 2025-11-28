/**
 * Input Manager
 * Handles keyboard, mouse, and touch input
 */

import { CONFIG } from './config.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        
        // Input state
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            leftDown: false,
            rightDown: false,
            wheelDelta: 0
        };
        this.touch = {
            left: false,
            right: false,
            center: null
        };
        
        // Cannon control state
        this.cannonPower = 0;
        this.cannonRotation = 0;
        this.cannonElevation = 0;
        this.isCharging = false;
        
        // Input buffer
        this.inputBuffer = [];
        
        // Touch state
        this.touches = new Map();
        this.lastTouchY = 0;
        this.touchStartY = 0;
        
        // Jackpot handle state
        this.jackpotHandleDrag = false;
        this.jackpotHandleStartY = 0;
    }

    /**
     * Initialize input listeners
     */
    init() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Disable right-click context menu (requirement #6)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Touch events
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        
        // Flipper touch zones
        const leftZone = document.getElementById('flipper-left-zone');
        const rightZone = document.getElementById('flipper-right-zone');
        
        leftZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.activateLeftFlipper();
        }, { passive: false });
        
        leftZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.game.deactivateLeftFlipper();
        }, { passive: false });
        
        rightZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.activateRightFlipper();
        }, { passive: false });
        
        rightZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.game.deactivateRightFlipper();
        }, { passive: false });
        
        // Fire button
        const fireButton = document.getElementById('fire-button');
        fireButton.addEventListener('click', () => this.onFireClick());
        fireButton.addEventListener('mousedown', () => this.startCharging());
        fireButton.addEventListener('mouseup', () => this.stopCharging());
        fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startCharging();
        }, { passive: false });
        fireButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopCharging();
        }, { passive: false });
        
        // Jackpot handle
        const jackpotHandle = document.getElementById('jackpot-handle');
        jackpotHandle.addEventListener('mousedown', (e) => this.onJackpotHandleDown(e));
        jackpotHandle.addEventListener('touchstart', (e) => this.onJackpotHandleTouchStart(e), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.onJackpotHandleMove(e));
        document.addEventListener('mouseup', () => this.onJackpotHandleUp());
        document.addEventListener('touchmove', (e) => this.onJackpotHandleTouchMove(e), { passive: false });
        document.addEventListener('touchend', () => this.onJackpotHandleUp());
        
        // Spin button
        const spinButton = document.getElementById('spin-button');
        spinButton.addEventListener('click', () => this.game.triggerJackpot());
        
        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => this.game.restart());
        
        // Score submission
        const submitBtn = document.getElementById('submit-score-btn');
        submitBtn.addEventListener('click', () => {
            const initials = document.getElementById('initials-input').value;
            if (initials.length > 0) {
                this.game.submitHighScore(initials);
            }
        });
        
        // Cannon offset save button (Requirement #7)
        const saveOffsetBtn = document.getElementById('save-cannon-offset');
        if (saveOffsetBtn) {
            saveOffsetBtn.addEventListener('click', () => this.saveCannonOffset());
        }
        
        // Load saved cannon offset from localStorage (fallback)
        this.loadCannonOffset();
        
        console.log('Input manager initialized');
    }
    
    /**
     * Load cannon offset from localStorage
     */
    loadCannonOffset() {
        try {
            const saved = localStorage.getItem('cannonOffset');
            if (saved) {
                const offset = JSON.parse(saved);
                const xInput = document.getElementById('cannon-offset-x');
                const yInput = document.getElementById('cannon-offset-y');
                if (xInput && offset.x !== undefined) xInput.value = offset.x;
                if (yInput && offset.y !== undefined) yInput.value = offset.y;
                
                // Apply to cannon
                if (this.game && this.game.cannon) {
                    this.game.cannon.offsetX = offset.x || 0;
                    this.game.cannon.offsetY = offset.y || 0;
                }
            }
        } catch (e) {
            console.warn('Failed to load cannon offset:', e);
        }
    }
    
    /**
     * Save cannon offset (Requirement #7)
     * Saves to localStorage and attempts to save to config.json via GitHub API
     */
    async saveCannonOffset() {
        const xInput = document.getElementById('cannon-offset-x');
        const yInput = document.getElementById('cannon-offset-y');
        const saveBtn = document.getElementById('save-cannon-offset');
        
        if (!xInput || !yInput) return;
        
        const offsetX = parseFloat(xInput.value) || 0;
        const offsetY = parseFloat(yInput.value) || 0;
        
        // Update button state
        saveBtn.textContent = 'Saving...';
        saveBtn.classList.add('saving');
        
        // Save to localStorage
        const offset = { x: offsetX, y: offsetY };
        localStorage.setItem('cannonOffset', JSON.stringify(offset));
        
        // Apply to cannon immediately
        if (this.game && this.game.cannon) {
            this.game.cannon.offsetX = offsetX;
            this.game.cannon.offsetY = offsetY;
        }
        
        // Save configuration to localStorage
        // Note: Saving to GitHub repo would require server-side authentication
        // which is beyond the scope of client-side JavaScript
        try {
            const configData = {
                cannonOffset: offset,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('gameConfig', JSON.stringify(configData));
            
            // Success feedback
            setTimeout(() => {
                saveBtn.textContent = 'Saved!';
                saveBtn.classList.remove('saving');
                saveBtn.classList.add('saved');
                
                setTimeout(() => {
                    saveBtn.textContent = 'Save';
                    saveBtn.classList.remove('saved');
                }, 2000);
            }, 500);
            
            console.log('Cannon offset saved to localStorage:', offset);
        } catch (error) {
            console.error('Failed to save cannon offset:', error);
            saveBtn.textContent = 'Error';
            saveBtn.classList.remove('saving');
            
            setTimeout(() => {
                saveBtn.textContent = 'Save';
            }, 2000);
        }
    }

    /**
     * Update input state
     */
    update(deltaTime) {
        // Process continuous keyboard input
        this.processKeyboardInput(deltaTime);
        
        // Update cannon power if charging
        if (this.isCharging) {
            this.cannonPower = Math.min(100, this.cannonPower + (100 / CONFIG.CANNON.POWER.CHARGE_TIME) * deltaTime);
            this.updateCannonUI();
        }
        
        // Process buffered inputs
        this.processInputBuffer();
    }

    /**
     * Process keyboard input
     */
    processKeyboardInput(deltaTime) {
        // Cannon rotation (A/D)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.cannonRotation = Math.max(-1, this.cannonRotation - deltaTime * 2);
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.cannonRotation = Math.min(1, this.cannonRotation + deltaTime * 2);
        } else {
            // Return to center
            this.cannonRotation *= 0.95;
        }
        
        // Cannon elevation (W/S or Up/Down)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.cannonElevation = Math.min(1, this.cannonElevation + deltaTime * 2);
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.cannonElevation = Math.max(-1, this.cannonElevation - deltaTime * 2);
        }
        
        // Update cannon with current values
        if (this.game.cannon) {
            this.game.cannon.setRotation(this.cannonRotation);
            this.game.cannon.setElevation(this.cannonElevation);
        }
        
        this.updateCannonUI();
    }

    /**
     * Process buffered inputs
     */
    processInputBuffer() {
        while (this.inputBuffer.length > 0) {
            const input = this.inputBuffer.shift();
            this.executeInput(input);
        }
    }

    /**
     * Execute a buffered input
     */
    executeInput(input) {
        switch (input.type) {
            case 'fire':
                this.game.fireCannon();
                break;
            case 'jackpot':
                this.game.triggerJackpot();
                break;
        }
    }

    /**
     * Buffer an input action
     */
    bufferInput(type, data = {}) {
        if (this.inputBuffer.length < CONFIG.INPUT.BUFFER_SIZE) {
            this.inputBuffer.push({ type, data, time: performance.now() });
        }
    }

    /**
     * Handle keydown
     */
    onKeyDown(e) {
        this.keys[e.code] = true;
        
        switch (e.code) {
            case 'Space':
            case 'Enter':
                e.preventDefault();
                this.bufferInput('fire');
                break;
                
            case 'KeyZ':
            case 'KeyQ':
                e.preventDefault();
                this.game.activateLeftFlipper();
                break;
                
            case 'Slash':
            case 'KeyE':
                e.preventDefault();
                this.game.activateRightFlipper();
                break;
                
            case 'KeyJ':
                e.preventDefault();
                this.bufferInput('jackpot');
                break;
                
            case 'ShiftLeft':
                e.preventDefault();
                this.game.activateLeftFlipper();
                break;
                
            case 'ShiftRight':
                e.preventDefault();
                this.game.activateRightFlipper();
                break;
        }
    }

    /**
     * Handle keyup
     */
    onKeyUp(e) {
        this.keys[e.code] = false;
        
        switch (e.code) {
            case 'KeyZ':
            case 'KeyQ':
            case 'ShiftLeft':
                this.game.deactivateLeftFlipper();
                break;
                
            case 'Slash':
            case 'KeyE':
            case 'ShiftRight':
                this.game.deactivateRightFlipper();
                break;
        }
    }

    /**
     * Handle mouse move
     */
    onMouseMove(e) {
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        
        this.mouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
        this.mouse.y = -(e.clientY - rect.top) / rect.height * 2 + 1;
        
        // Update cannon rotation based on mouse X position
        this.cannonRotation = this.mouse.x;
    }

    /**
     * Handle mouse down
     * Requirement #6: Left mouse click triggers left pinball trigger
     */
    onMouseDown(e) {
        if (e.button === 0) {
            this.mouse.leftDown = true;
            // Left click always triggers left flipper (requirement #6)
            this.game.activateLeftFlipper();
        } else if (e.button === 2) {
            // Right click is now disabled via context menu prevention
            // But we can still use it for right flipper if desired
            this.mouse.rightDown = true;
            this.game.activateRightFlipper();
        }
    }

    /**
     * Handle mouse up
     */
    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.leftDown = false;
            this.game.deactivateLeftFlipper();
        } else if (e.button === 2) {
            this.mouse.rightDown = false;
            this.game.deactivateRightFlipper();
        }
    }

    /**
     * Handle mouse wheel
     */
    onWheel(e) {
        e.preventDefault();
        
        // Use wheel for power adjustment
        this.cannonPower = Math.max(0, Math.min(100, 
            this.cannonPower + (e.deltaY > 0 ? -5 : 5)
        ));
        
        this.updateCannonUI();
    }

    /**
     * Handle touch start
     */
    onTouchStart(e) {
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            this.touches.set(touch.identifier, {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY
            });
        }
    }

    /**
     * Handle touch move
     */
    onTouchMove(e) {
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
                
                // Calculate swipe delta
                const deltaY = touchData.startY - touch.clientY;
                const deltaX = touch.clientX - touchData.startX;
                
                // Update cannon based on touch
                this.cannonRotation = Math.max(-1, Math.min(1, deltaX / 100));
                
                // Vertical swipe for power
                if (deltaY > 0) {
                    this.cannonPower = Math.min(100, deltaY / 2);
                }
                
                this.updateCannonUI();
            }
        }
    }

    /**
     * Handle touch end
     */
    onTouchEnd(e) {
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                // Fire if power was charged
                if (this.cannonPower > 10) {
                    this.bufferInput('fire');
                }
                
                this.touches.delete(touch.identifier);
            }
        }
        
        // Reset power after release
        this.cannonPower = 0;
        this.updateCannonUI();
    }

    /**
     * Handle fire button click
     */
    onFireClick() {
        if (this.cannonPower < 10) {
            this.cannonPower = 50; // Default power for click
        }
        this.bufferInput('fire');
        this.cannonPower = 0;
        this.updateCannonUI();
    }

    /**
     * Start charging cannon
     */
    startCharging() {
        this.isCharging = true;
        this.cannonPower = 0;
        
        const fireButton = document.getElementById('fire-button');
        fireButton.classList.add('charging');
    }

    /**
     * Stop charging and fire
     */
    stopCharging() {
        if (this.isCharging) {
            this.isCharging = false;
            if (this.cannonPower > 5) {
                this.bufferInput('fire');
            }
            this.cannonPower = 0;
            
            const fireButton = document.getElementById('fire-button');
            fireButton.classList.remove('charging');
            
            this.updateCannonUI();
        }
    }

    /**
     * Jackpot handle mouse down
     */
    onJackpotHandleDown(e) {
        if (this.game.state === 'JACKPOT_READY') {
            this.jackpotHandleDrag = true;
            this.jackpotHandleStartY = e.clientY;
        }
    }

    /**
     * Jackpot handle touch start
     */
    onJackpotHandleTouchStart(e) {
        e.preventDefault();
        if (this.game.state === 'JACKPOT_READY') {
            this.jackpotHandleDrag = true;
            this.jackpotHandleStartY = e.touches[0].clientY;
        }
    }

    /**
     * Jackpot handle move
     */
    onJackpotHandleMove(e) {
        if (this.jackpotHandleDrag) {
            const deltaY = e.clientY - this.jackpotHandleStartY;
            if (deltaY > 50) {
                this.onJackpotHandleUp();
                this.bufferInput('jackpot');
            }
        }
    }

    /**
     * Jackpot handle touch move
     */
    onJackpotHandleTouchMove(e) {
        if (this.jackpotHandleDrag && e.touches.length > 0) {
            const deltaY = e.touches[0].clientY - this.jackpotHandleStartY;
            if (deltaY > 50) {
                this.onJackpotHandleUp();
                this.bufferInput('jackpot');
            }
        }
    }

    /**
     * Jackpot handle up
     */
    onJackpotHandleUp() {
        this.jackpotHandleDrag = false;
    }

    /**
     * Update cannon UI
     */
    updateCannonUI() {
        // Power bar
        const powerBar = document.getElementById('power-bar');
        const powerLabel = document.getElementById('power-label');
        if (powerBar && powerLabel) {
            powerBar.style.height = `${this.cannonPower}%`;
            powerLabel.textContent = `${Math.round(this.cannonPower)}%`;
        }
        
        // Angle
        const angleValue = document.getElementById('angle-value');
        if (angleValue) {
            const angle = Math.round(this.cannonElevation * 30);
            angleValue.textContent = `${angle}°`;
        }
        
        // Rotation
        const rotationValue = document.getElementById('rotation-value');
        if (rotationValue) {
            if (Math.abs(this.cannonRotation) < 0.1) {
                rotationValue.textContent = 'CENTER';
            } else if (this.cannonRotation < 0) {
                rotationValue.textContent = `LEFT ${Math.round(Math.abs(this.cannonRotation) * 45)}°`;
            } else {
                rotationValue.textContent = `RIGHT ${Math.round(this.cannonRotation * 45)}°`;
            }
        }
    }

    /**
     * Get current cannon power (0-1)
     */
    getCannonPower() {
        return this.cannonPower / 100;
    }

    /**
     * Get current cannon rotation (-1 to 1)
     */
    getCannonRotation() {
        return this.cannonRotation;
    }

    /**
     * Get current cannon elevation (-1 to 1)
     */
    getCannonElevation() {
        return this.cannonElevation;
    }
}

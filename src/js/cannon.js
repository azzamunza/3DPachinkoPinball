/**
 * Cannon (Mortar) Module
 * Handles ball launching with power, rotation, and elevation controls
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Cannon {
    constructor(game) {
        this.game = game;
        
        // Cannon state
        this.power = 0;
        this.rotation = 0;
        this.elevation = 0;
        
        // Cooldown
        this.cooldownRemaining = 0;
        this.rapidFireEnabled = false;
        
        // Visual components
        this.base = null;
        this.barrel = null;
        this.barrelGroup = null;
    }

    /**
     * Create cannon visuals
     */
    create() {
        const position = CONFIG.CANNON.POSITION;
        
        // Create cannon group
        this.barrelGroup = new THREE.Group();
        this.barrelGroup.position.set(position.x, position.y, position.z + 0.5);
        
        // Cannon base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.5, 16);
        const baseMaterial = this.game.renderer.createMaterial(CONFIG.MATERIALS.CANNON);
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.rotation.x = Math.PI / 2;
        this.base.position.z = -0.25;
        this.base.castShadow = true;
        this.barrelGroup.add(this.base);
        
        // Cannon barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.35, 0.4, 1.5, 16);
        const barrelMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.CANNON,
            color: 0x555555
        });
        this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrel.position.y = -0.3;
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.castShadow = true;
        this.barrelGroup.add(this.barrel);
        
        // Barrel opening (darker inside)
        const openingGeometry = new THREE.CircleGeometry(0.3, 16);
        const openingMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const opening = new THREE.Mesh(openingGeometry, openingMaterial);
        opening.position.set(0, -1, 0);
        opening.rotation.x = Math.PI / 2;
        this.barrel.add(opening);
        
        // Add decorative rings
        this.addDecorativeRings();
        
        this.game.renderer.add(this.barrelGroup);
        
        // Create power indicator light
        this.createPowerIndicator();
        
        console.log('Cannon created');
    }

    /**
     * Add decorative rings to barrel
     */
    addDecorativeRings() {
        const ringGeometry = new THREE.TorusGeometry(0.42, 0.05, 8, 24);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = -0.3 + i * 0.4;
            ring.rotation.x = Math.PI / 2;
            this.barrel.add(ring);
        }
    }

    /**
     * Create power indicator light
     */
    createPowerIndicator() {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.powerLight = new THREE.Mesh(geometry, material);
        this.powerLight.position.set(0, 0, 0.5);
        this.barrelGroup.add(this.powerLight);
    }

    /**
     * Update cannon state
     */
    update(deltaTime) {
        // Update cooldown
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining -= deltaTime;
            this.game.ui.updateCannonCooldown(
                this.cooldownRemaining,
                this.getCurrentCooldown()
            );
        }
        
        // Update barrel orientation based on input
        this.updateBarrelOrientation();
        
        // Update power indicator color
        this.updatePowerIndicator();
    }

    /**
     * Update barrel orientation
     */
    updateBarrelOrientation() {
        // Rotation (left/right)
        const targetRotationY = this.rotation * CONFIG.CANNON.ROTATION.MAX;
        this.barrelGroup.rotation.y = THREE.MathUtils.lerp(
            this.barrelGroup.rotation.y,
            targetRotationY,
            0.1
        );
        
        // Elevation (up/down)
        const targetRotationX = this.elevation * CONFIG.CANNON.ELEVATION.MAX;
        this.barrel.rotation.x = Math.PI / 2 + targetRotationX;
    }

    /**
     * Update power indicator
     */
    updatePowerIndicator() {
        if (this.rapidFireEnabled) {
            this.powerLight.material.color.setHex(0x00ffff);
            this.powerLight.material.emissive = new THREE.Color(0x00ffff);
        } else if (this.cooldownRemaining > 0) {
            this.powerLight.material.color.setHex(0xff0000);
        } else {
            this.powerLight.material.color.setHex(0x00ff00);
        }
    }

    /**
     * Set cannon rotation (-1 to 1)
     */
    setRotation(value) {
        this.rotation = Math.max(-1, Math.min(1, value));
    }

    /**
     * Set cannon elevation (-1 to 1)
     */
    setElevation(value) {
        this.elevation = Math.max(-1, Math.min(1, value));
    }

    /**
     * Fire the cannon
     */
    fire() {
        // Check cooldown
        if (this.cooldownRemaining > 0) return false;
        
        // Check if we have balls
        if (this.game.balls.totalBalls <= 0) {
            console.log('No balls remaining!');
            return false;
        }
        
        // Get power from input
        const power = this.game.input.getCannonPower();
        const actualPower = Math.max(0.2, power); // Minimum power
        
        // Calculate launch velocity
        const velocity = this.calculateLaunchVelocity(actualPower);
        
        // Spawn and launch ball
        const spawnPos = this.getSpawnPosition();
        const ball = this.game.balls.spawnBall(spawnPos, velocity);
        
        if (ball) {
            // Start cooldown
            this.cooldownRemaining = this.getCurrentCooldown();
            
            // Play sound
            this.game.audio.playSound('fire');
            
            // Visual feedback - barrel recoil
            this.playRecoilAnimation();
            
            return true;
        }
        
        return false;
    }

    /**
     * Calculate launch velocity based on power and orientation
     */
    calculateLaunchVelocity(power) {
        const baseSpeed = power * CONFIG.CANNON.LAUNCH_VELOCITY_SCALE * 100;
        
        // Direction based on rotation and elevation
        const rotationAngle = this.rotation * CONFIG.CANNON.ROTATION.MAX;
        const elevationAngle = this.elevation * CONFIG.CANNON.ELEVATION.MAX;
        
        // Velocity components
        const vx = Math.sin(rotationAngle) * baseSpeed * 0.3;
        const vy = -baseSpeed; // Downward (into playfield)
        const vz = Math.sin(elevationAngle) * baseSpeed * 0.2;
        
        // Add slight randomness based on GPU noise
        const noise = this.game.getGPUNoiseRNG();
        const noiseAmount = 0.1;
        
        return {
            x: vx + (noise - 0.5) * noiseAmount * baseSpeed,
            y: vy,
            z: vz + (noise - 0.5) * noiseAmount * baseSpeed * 0.5
        };
    }

    /**
     * Get spawn position for new ball
     */
    getSpawnPosition() {
        const cannonPos = CONFIG.CANNON.POSITION;
        const offset = 1.5; // Distance from cannon center
        
        return {
            x: cannonPos.x + this.rotation * 1,
            y: cannonPos.y - offset,
            z: cannonPos.z + 0.5
        };
    }

    /**
     * Play barrel recoil animation
     */
    playRecoilAnimation() {
        const originalZ = this.barrel.position.z;
        this.barrel.position.z += 0.2;
        
        setTimeout(() => {
            this.barrel.position.z = originalZ;
        }, 100);
    }

    /**
     * Enable rapid fire mode
     */
    enableRapidFire() {
        if (!this.rapidFireEnabled) {
            this.rapidFireEnabled = true;
            this.game.ui.showRapidFire();
            this.game.ui.showEventNotification('RAPID-FIRE UNLOCKED!', '#00ffff');
            
            // Make barrel glow cyan
            if (this.barrel) {
                this.barrel.material.emissive = new THREE.Color(0x00ffff);
                this.barrel.material.emissiveIntensity = 0.3;
            }
        }
    }

    /**
     * Get current cooldown time
     */
    getCurrentCooldown() {
        return this.rapidFireEnabled 
            ? CONFIG.CANNON.COOLDOWN.RAPID_FIRE 
            : CONFIG.CANNON.COOLDOWN.DEFAULT;
    }

    /**
     * Reset cannon state
     */
    reset() {
        this.power = 0;
        this.rotation = 0;
        this.elevation = 0;
        this.cooldownRemaining = 0;
        this.rapidFireEnabled = false;
        
        if (this.barrel) {
            this.barrel.material.emissive = new THREE.Color(0x000000);
            this.barrel.material.emissiveIntensity = 0;
        }
        
        this.game.ui.hideRapidFire();
    }
}

/**
 * Cannon (Mortar) Module
 * Handles ball launching with power, rotation, and elevation controls
 * Updated: Centered below flippers with gimbal rotation and target dot (Requirements B.1-B.4)
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
        
        // Mouse position for aiming (Requirement B.3)
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Offset values (adjustable via UI - Requirement #7)
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Cooldown
        this.cooldownRemaining = 0;
        this.rapidFireEnabled = false;
        
        // Visual components
        this.base = null;
        this.barrel = null;
        this.barrelGroup = null;
        this.gimbalGroup = null; // For gimbal rotation (B.3)
        this.targetDot = null;   // Red target dot (B.2)
    }

    /**
     * Create cannon visuals - CENTERED below flippers (Requirement B.1)
     */
    create() {
        const position = CONFIG.CANNON.POSITION;
        
        // Apply offset values (Requirement #7)
        const effectiveX = position.x + this.offsetX;
        const effectiveY = position.y + this.offsetY;
        
        // Create gimbal group for rotation (Requirement B.3)
        this.gimbalGroup = new THREE.Group();
        this.gimbalGroup.position.set(effectiveX, effectiveY, position.z + 0.5);
        
        // Create cannon group (will be rotated by gimbal)
        this.barrelGroup = new THREE.Group();
        this.gimbalGroup.add(this.barrelGroup);
        
        // Cannon base - Gimbal mount
        const baseGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const baseMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.CANNON,
            color: 0x404040
        });
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.castShadow = true;
        this.barrelGroup.add(this.base);
        
        // Gimbal ring (visual indicator of gimbal)
        const gimbalRingGeometry = new THREE.TorusGeometry(0.6, 0.05, 8, 32);
        const gimbalMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        const gimbalRingH = new THREE.Mesh(gimbalRingGeometry, gimbalMaterial);
        gimbalRingH.rotation.x = Math.PI / 2;
        this.barrelGroup.add(gimbalRingH);
        
        const gimbalRingV = new THREE.Mesh(gimbalRingGeometry, gimbalMaterial);
        this.barrelGroup.add(gimbalRingV);
        
        // Cannon barrel - pointing upward
        const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.0, 16);
        const barrelMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.CANNON,
            color: 0x555555
        });
        this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrel.position.y = 0.5; // Positioned upward from base
        this.barrel.castShadow = true;
        this.barrelGroup.add(this.barrel);
        
        // Barrel opening (darker inside)
        const openingGeometry = new THREE.CircleGeometry(0.15, 16);
        const openingMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const opening = new THREE.Mesh(openingGeometry, openingMaterial);
        opening.position.y = 0.51;
        opening.rotation.x = -Math.PI / 2;
        this.barrel.add(opening);
        
        // Add decorative rings
        this.addDecorativeRings();
        
        this.game.renderer.add(this.gimbalGroup);
        
        // Create power indicator light
        this.createPowerIndicator();
        
        // Create red target dot (Requirement B.2)
        this.createTargetDot();
        
        console.log('Cannon created at centered position below flippers');
    }

    /**
     * Create red target dot that shows where cannon is aiming (Requirement B.2)
     */
    createTargetDot() {
        const dotConfig = CONFIG.CANNON.TARGET_DOT;
        
        // Red glowing dot
        const dotGeometry = new THREE.SphereGeometry(dotConfig.RADIUS, 16, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: dotConfig.COLOR,
            transparent: true,
            opacity: 0.8
        });
        this.targetDot = new THREE.Mesh(dotGeometry, dotMaterial);
        this.targetDot.position.set(0, 5, 0); // Initial position
        
        // Add glow ring around target dot
        const ringGeometry = new THREE.RingGeometry(dotConfig.RADIUS, dotConfig.RADIUS + 0.05, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: dotConfig.COLOR,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        this.targetDot.add(ring);
        
        // Add point light for glow effect
        const dotLight = new THREE.PointLight(dotConfig.COLOR, 0.5, 3);
        this.targetDot.add(dotLight);
        
        this.game.renderer.add(this.targetDot);
    }

    /**
     * Add decorative rings to barrel
     */
    addDecorativeRings() {
        const ringGeometry = new THREE.TorusGeometry(0.25, 0.03, 8, 24);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        
        for (let i = 0; i < 2; i++) {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = 0.2 + i * 0.25;
            ring.rotation.x = Math.PI / 2;
            this.barrel.add(ring);
        }
    }

    /**
     * Create power indicator light
     */
    createPowerIndicator() {
        const geometry = new THREE.SphereGeometry(0.12, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.powerLight = new THREE.Mesh(geometry, material);
        this.powerLight.position.set(0, -0.3, 0.3);
        this.barrelGroup.add(this.powerLight);
    }

    /**
     * Set mouse position for aiming (Requirement B.3)
     * Mouse position in normalized device coordinates (-1 to 1)
     */
    setMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
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
        
        // Update target dot position directly from mouse (Requirement #2)
        this.updateTargetDotFromMouse();
        
        // Update barrel orientation to aim at target dot (Requirement #2)
        this.updateBarrelToAimAtTarget();
        
        // Update power indicator color
        this.updatePowerIndicator();
    }

    /**
     * Update target dot position directly from mouse position (Requirement #2)
     * The mouse position should directly drive the target dot location
     */
    updateTargetDotFromMouse() {
        if (!this.targetDot) return;
        
        // Convert mouse NDC (-1 to 1) to world coordinates on the playfield
        const playfieldWidth = CONFIG.PLAYFIELD.WIDTH;
        const playfieldHeight = CONFIG.PLAYFIELD.HEIGHT;
        
        // Map mouse X/Y to playfield coordinates
        // mouseX: -1 (left) to 1 (right) -> -width/2 to width/2
        // mouseY: -1 (bottom) to 1 (top) -> -height/2 to height/2
        const targetX = this.mouseX * (playfieldWidth / 2) * 0.9;
        const targetY = this.mouseY * (playfieldHeight / 2) * 0.9;
        
        // Clamp to playfield bounds
        const maxX = playfieldWidth / 2 - 0.5;
        const maxY = playfieldHeight / 2 - 0.5;
        const minY = -playfieldHeight / 2 + 2; // Keep above the cannon
        
        this.targetDot.position.set(
            THREE.MathUtils.clamp(targetX, -maxX, maxX),
            THREE.MathUtils.clamp(targetY, minY, maxY),
            -0.3 // Slightly in front of playfield
        );
        this.targetDot.visible = true;
    }

    /**
     * Update barrel orientation to aim at target dot (Requirement #2)
     * The cannon should aim from its world space position to the target dot world space position
     */
    updateBarrelToAimAtTarget() {
        if (!this.targetDot || !this.gimbalGroup || !this.barrelGroup) return;
        
        // Get cannon and target positions
        const cannonPos = this.gimbalGroup.position.clone();
        const targetPos = this.targetDot.position.clone();
        
        // Calculate direction from cannon to target
        const direction = new THREE.Vector3().subVectors(targetPos, cannonPos);
        direction.normalize();
        
        // Calculate rotation angles to aim at target
        // Rotation around Z axis (left/right aiming)
        const targetRotationZ = Math.atan2(-direction.x, direction.y);
        
        // Rotation around X axis (up/down elevation)
        const horizontalDist = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        const targetRotationX = Math.atan2(-direction.z, horizontalDist);
        
        // Clamp rotations to allowed range
        const clampedRotationZ = THREE.MathUtils.clamp(
            targetRotationZ,
            -CONFIG.CANNON.ROTATION.MAX,
            CONFIG.CANNON.ROTATION.MAX
        );
        const clampedRotationX = THREE.MathUtils.clamp(
            targetRotationX,
            -CONFIG.CANNON.ELEVATION.MAX,
            CONFIG.CANNON.ELEVATION.MAX
        );
        
        // Apply smooth rotation
        this.barrelGroup.rotation.z = THREE.MathUtils.lerp(
            this.barrelGroup.rotation.z,
            clampedRotationZ,
            0.15
        );
        this.barrelGroup.rotation.x = THREE.MathUtils.lerp(
            this.barrelGroup.rotation.x,
            clampedRotationX,
            0.15
        );
        
        // Store normalized rotation values for launch calculations
        this.rotation = clampedRotationZ / CONFIG.CANNON.ROTATION.MAX;
        this.elevation = clampedRotationX / CONFIG.CANNON.ELEVATION.MAX;
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
     * Shoots UPWARD and INTO the tilted playfield (toward the back of the board)
     */
    calculateLaunchVelocity(power) {
        // Apply power multiplier from config (for testing)
        const powerMultiplier = CONFIG.CANNON.POWER.MULTIPLIER || 1.0;
        const baseSpeed = power * CONFIG.CANNON.LAUNCH_VELOCITY_SCALE * 100 * powerMultiplier;
        
        // Direction based on rotation and elevation
        const rotationAngle = this.rotation * CONFIG.CANNON.ROTATION.MAX;
        const elevationAngle = this.elevation * CONFIG.CANNON.ELEVATION.MAX;
        
        // Velocity components - shooting UPWARD (positive Y) and INTO the board (negative Z)
        const vx = Math.sin(rotationAngle) * baseSpeed * 0.2; // Slight horizontal bias
        const vy = baseSpeed; // UPWARD (positive, into playfield top)
        // Aim toward the back of the board (negative Z) with elevation adjustment
        const vz = -baseSpeed * 0.15 + Math.sin(elevationAngle) * baseSpeed * 0.1;
        
        // Add slight randomness based on GPU noise
        const noise = this.game.getGPUNoiseRNG();
        const noiseAmount = 0.08;
        
        return {
            x: vx + (noise - 0.5) * noiseAmount * baseSpeed,
            y: vy,
            z: vz + (noise - 0.5) * noiseAmount * baseSpeed * 0.3
        };
    }

    /**
     * Get spawn position for new ball - from cannon at bottom
     * Applies offset values (Requirement #7)
     */
    getSpawnPosition() {
        const cannonPos = CONFIG.CANNON.POSITION;
        const offset = 1.0; // Distance from cannon center
        
        return {
            x: cannonPos.x + this.offsetX + this.rotation * 0.5,
            y: cannonPos.y + this.offsetY + offset, // Slightly above cannon
            z: cannonPos.z + 0.3
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

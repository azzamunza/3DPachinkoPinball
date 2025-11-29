/**
 * Ball Manager
 * Handles ball pooling, spawning, and lifecycle
 * Updated: Enhanced CCD to prevent balls passing through surfaces (Requirement B.4)
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class BallManager {
    constructor(game) {
        this.game = game;
        
        // Ball pool
        this.pool = [];
        this.activeBalls = new Set();
        
        // Ball count
        this.totalBalls = CONFIG.BALLS.STARTING_COUNT;
    }

    /**
     * Initialize ball manager
     */
    init() {
        // Pre-create ball pool
        this.createPool();
        
        // Update UI
        this.game.ui.updateBallCount(this.totalBalls);
        
        console.log('Ball manager initialized with enhanced collision detection');
    }

    /**
     * Create ball object pool
     */
    createPool() {
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.BALL);
        // Silver/chrome balls like reference image
        material.color.setHex(0xC0C0C0);
        material.metalness = 0.95;
        material.roughness = 0.1;
        
        const geometry = new THREE.SphereGeometry(
            CONFIG.PHYSICS.BALL.RADIUS,
            16,
            16
        );
        
        for (let i = 0; i < CONFIG.BALLS.MAX_ACTIVE; i++) {
            const ball = this.createBall(geometry, material);
            ball.active = false;
            this.pool.push(ball);
        }
    }

    /**
     * Create a single ball with enhanced CCD (Requirement B.4)
     */
    createBall(geometry, material) {
        // Visual mesh
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.visible = false;
        
        this.game.renderer.add(mesh);
        
        // Physics body with enhanced CCD settings
        const body = this.game.physics.createSphere(
            CONFIG.PHYSICS.BALL.RADIUS,
            CONFIG.PHYSICS.BALL.MASS,
            { x: 0, y: 100, z: 0 }, // Off-screen
            this.game.physics.materials.ball
        );
        
        // Enhanced Continuous Collision Detection (B.4)
        body.ccdSpeedThreshold = 0.5; // Lower threshold = more CCD checks
        body.ccdIterations = 15;      // More iterations = better accuracy
        
        body.userData = { isBall: true };
        body.sleep();
        
        this.game.physics.addBody(body);
        
        return { mesh, body, active: false };
    }

    /**
     * Spawn a ball at position with velocity
     * Note: When totalBalls reaches 0, we can't spawn new balls but the game continues
     * until all active balls drain. This is intentional for gameplay continuity.
     */
    spawnBall(position, velocity) {
        // Check if we have balls remaining
        if (this.totalBalls <= 0) {
            return null;
        }
        
        // Check active ball limit
        if (this.activeBalls.size >= CONFIG.BALLS.MAX_ACTIVE) {
            console.log('Maximum active balls reached');
            return null;
        }
        
        // Get inactive ball from pool
        const ball = this.pool.find(b => !b.active);
        if (!ball) {
            return null;
        }
        
        // Activate ball
        ball.active = true;
        ball.mesh.visible = true;
        this.activeBalls.add(ball);
        
        // Set position
        this.game.physics.resetBody(ball.body, position);
        ball.mesh.position.set(position.x, position.y, position.z);
        
        // Set velocity
        this.game.physics.setVelocity(ball.body, velocity);
        
        // Decrement total balls
        this.totalBalls--;
        this.game.ui.updateBallCount(this.totalBalls);
        
        return ball;
    }

    /**
     * Return ball to pool
     */
    returnBall(ball) {
        if (!ball || !ball.active) return;
        
        ball.active = false;
        ball.mesh.visible = false;
        this.activeBalls.delete(ball);
        
        // Reset physics body
        this.game.physics.resetBody(ball.body, { x: 0, y: 100, z: 0 });
        ball.body.sleep();
    }

    /**
     * Capture ball for jackpot
     */
    captureBall(body) {
        // Find ball by body
        const ball = this.pool.find(b => b.body === body);
        if (ball) {
            this.returnBall(ball);
        }
    }

    /**
     * Drain ball (lost)
     */
    drainBall(body) {
        // Find ball by body
        const ball = this.pool.find(b => b.body === body);
        if (ball) {
            this.returnBall(ball);
            // Note: totalBalls is not decremented again - it was decremented on spawn
        }
    }

    /**
     * Add balls to inventory
     */
    addBalls(count) {
        this.totalBalls += count;
        this.game.ui.updateBallCount(this.totalBalls);
        this.game.ui.showEventNotification(`+${count} BALLS!`, '#00ff00');
    }

    /**
     * Update all active balls
     */
    update(deltaTime) {
        for (const ball of this.activeBalls) {
            // Sync mesh position with physics body
            const pos = this.game.physics.getPosition(ball.body);
            ball.mesh.position.set(pos.x, pos.y, pos.z);
            
            // Sync rotation
            const quat = this.game.physics.getQuaternion(ball.body);
            ball.mesh.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            
            // Check if ball fell too far (safety cleanup)
            if (pos.y < -15) {
                this.drainBall(ball.body);
            }
        }
    }

    /**
     * Get active ball count
     */
    get activeBallCount() {
        return this.activeBalls.size;
    }

    /**
     * Reset ball manager
     */
    reset() {
        // Return all active balls
        for (const ball of [...this.activeBalls]) {
            this.returnBall(ball);
        }
        
        // Reset total count
        this.totalBalls = CONFIG.BALLS.STARTING_COUNT;
        this.game.ui.updateBallCount(this.totalBalls);
    }
}

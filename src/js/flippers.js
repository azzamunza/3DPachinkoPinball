/**
 * Flippers Module
 * Handles dual flipper physics and controls
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG } from './config.js';

export class Flippers {
    constructor(game) {
        this.game = game;
        
        // Flipper components
        this.left = {
            mesh: null,
            body: null,
            pivot: null,
            constraint: null,
            active: false,
            angle: CONFIG.FLIPPERS.RESTING_ANGLE
        };
        
        this.right = {
            mesh: null,
            body: null,
            pivot: null,
            constraint: null,
            active: false,
            angle: -CONFIG.FLIPPERS.RESTING_ANGLE
        };
    }

    /**
     * Create flipper visuals and physics
     */
    create() {
        // Create left flipper
        this.createFlipper('left');
        
        // Create right flipper
        this.createFlipper('right');
        
        console.log('Flippers created');
    }

    /**
     * Create a single flipper - authentic pinball paddle design (Requirement #8)
     */
    createFlipper(side) {
        const isLeft = side === 'left';
        const config = isLeft ? CONFIG.FLIPPERS.LEFT : CONFIG.FLIPPERS.RIGHT;
        const flipper = isLeft ? this.left : this.right;
        
        const position = config.POSITION;
        const length = CONFIG.FLIPPERS.LENGTH;
        const width = CONFIG.FLIPPERS.WIDTH;
        const height = CONFIG.FLIPPERS.HEIGHT;
        
        // Create authentic pinball flipper shape (Requirement #8)
        // Real pinball flippers have a distinctive tapered shape with rounded ends
        const shape = new THREE.Shape();
        const baseWidth = width * 1.2;  // Wider at pivot
        const tipWidth = width * 0.35;   // Narrower at tip
        const tipRoundRadius = tipWidth / 2;
        
        if (isLeft) {
            // Base (pivot end) - rounded
            shape.moveTo(0, baseWidth/2);
            shape.absarc(0, 0, baseWidth/2, Math.PI/2, -Math.PI/2, true); // Rounded base
            
            // Bottom edge - tapered
            shape.lineTo(length - tipRoundRadius, -tipWidth/2);
            
            // Tip - rounded
            shape.absarc(length - tipRoundRadius, 0, tipWidth/2, -Math.PI/2, Math.PI/2, false);
            
            // Top edge - back to base
            shape.lineTo(0, baseWidth/2);
        } else {
            // Base (pivot end) - rounded
            shape.moveTo(0, baseWidth/2);
            shape.absarc(0, 0, baseWidth/2, Math.PI/2, -Math.PI/2, true); // Rounded base
            
            // Bottom edge - tapered (mirrored)
            shape.lineTo(-length + tipRoundRadius, -tipWidth/2);
            
            // Tip - rounded
            shape.absarc(-length + tipRoundRadius, 0, tipWidth/2, -Math.PI/2, Math.PI/2, false);
            
            // Top edge - back to base
            shape.lineTo(0, baseWidth/2);
        }
        
        const extrudeSettings = {
            depth: height * 1.5,  // Thicker flipper
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.03,
            bevelSegments: 3
        };
        
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(Math.PI / 2);
        
        // Authentic pinball flipper material - usually red or orange rubber-covered
        const flipperMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,  // Orange-red like real pinball flippers
            metalness: 0.1,
            roughness: 0.6,
            emissive: 0x331100,
            emissiveIntensity: 0.2
        });
        
        flipper.mesh = new THREE.Mesh(geometry, flipperMaterial);
        flipper.mesh.position.set(position.x, position.y, position.z + 0.1);
        flipper.mesh.castShadow = true;
        
        // Set initial rotation
        flipper.mesh.rotation.z = isLeft ? CONFIG.FLIPPERS.RESTING_ANGLE : -CONFIG.FLIPPERS.RESTING_ANGLE;
        
        this.game.renderer.add(flipper.mesh);
        
        // Create pivot point visual (metal shaft)
        const pivotGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
        const pivotMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,  // Silver/chrome
            metalness: 0.95,
            roughness: 0.1
        });
        flipper.pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
        flipper.pivot.position.set(position.x, position.y, position.z + 0.2);
        flipper.pivot.rotation.x = Math.PI / 2;
        
        this.game.renderer.add(flipper.pivot);
        
        // Add rubber band visual at tip (authentic detail)
        const rubberGeometry = new THREE.TorusGeometry(tipWidth / 2 + 0.02, 0.02, 8, 16);
        const rubberMaterial = new THREE.MeshStandardMaterial({
            color: 0xff2200,
            roughness: 0.9
        });
        const rubberBand = new THREE.Mesh(rubberGeometry, rubberMaterial);
        const tipX = isLeft ? length - tipRoundRadius : -length + tipRoundRadius;
        rubberBand.position.set(tipX, 0, height * 0.75);
        rubberBand.rotation.x = Math.PI / 2;
        flipper.mesh.add(rubberBand);
        
        // Create physics body
        this.createFlipperPhysics(side, position, length, width, height);
    }

    /**
     * Create flipper physics body
     */
    createFlipperPhysics(side, position, length, width, height) {
        const isLeft = side === 'left';
        const flipper = isLeft ? this.left : this.right;
        
        // Create box shape for flipper
        const halfExtents = {
            x: length / 2,
            y: width / 2,
            z: height / 2
        };
        
        // Offset position to account for pivot
        const bodyPos = {
            x: position.x + (isLeft ? length / 2 : -length / 2),
            y: position.y,
            z: position.z
        };
        
        flipper.body = this.game.physics.createBox(
            halfExtents,
            1, // Dynamic body with mass
            bodyPos,
            null,
            this.game.physics.materials.flipper
        );
        
        flipper.body.userData = { isFlipper: true, side };
        
        // Create static pivot body
        const pivotBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        this.game.physics.addBody(pivotBody);
        
        // Create hinge constraint
        const pivotOffset = isLeft 
            ? { x: -length / 2, y: 0, z: 0 }
            : { x: length / 2, y: 0, z: 0 };
        
        flipper.constraint = new CANNON.HingeConstraint(flipper.body, pivotBody, {
            pivotA: new CANNON.Vec3(pivotOffset.x, pivotOffset.y, pivotOffset.z),
            pivotB: new CANNON.Vec3(0, 0, 0),
            axisA: new CANNON.Vec3(0, 0, 1),
            axisB: new CANNON.Vec3(0, 0, 1)
        });
        
        this.game.physics.world.addConstraint(flipper.constraint);
        this.game.physics.addBody(flipper.body);
        
        // Add collision listener for slingshot effect
        flipper.body.addEventListener('collide', (e) => {
            this.onFlipperCollision(e, side);
        });
    }

    /**
     * Handle collision with flipper
     */
    onFlipperCollision(event, side) {
        const flipper = side === 'left' ? this.left : this.right;
        const otherBody = event.body;
        
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Check if flipper is actively swinging
        if (flipper.active) {
            // Apply slingshot effect
            const impulse = CONFIG.FLIPPERS.SLINGSHOT_IMPULSE;
            const direction = side === 'left' ? 1 : -1;
            
            this.game.physics.applyImpulse(otherBody, {
                x: impulse * direction * 0.5,
                y: impulse,
                z: 0
            });
            
            // Add restitution boost
            // This is simulated by applying extra upward velocity
            const boost = CONFIG.FLIPPERS.SWING_RESTITUTION_BOOST;
            otherBody.velocity.y += boost * Math.abs(otherBody.velocity.y);
        }
        
        // Play flipper sound
        this.game.audio.playSound('flipper', 0.5);
    }

    /**
     * Update flippers
     */
    update(deltaTime) {
        // Update left flipper
        this.updateFlipper('left', deltaTime);
        
        // Update right flipper
        this.updateFlipper('right', deltaTime);
    }

    /**
     * Update a single flipper
     */
    updateFlipper(side, deltaTime) {
        const isLeft = side === 'left';
        const flipper = isLeft ? this.left : this.right;
        const restAngle = isLeft ? CONFIG.FLIPPERS.RESTING_ANGLE : -CONFIG.FLIPPERS.RESTING_ANGLE;
        const activeAngle = isLeft ? CONFIG.FLIPPERS.ACTIVE_ANGLE : -CONFIG.FLIPPERS.ACTIVE_ANGLE;
        
        // Calculate target angle
        const targetAngle = flipper.active ? activeAngle : restAngle;
        
        // Calculate transition speed
        const transitionTime = flipper.active 
            ? CONFIG.FLIPPERS.ACTIVATION_TIME 
            : CONFIG.FLIPPERS.DEACTIVATION_TIME;
        const speed = Math.abs(activeAngle - restAngle) / transitionTime;
        
        // Interpolate angle
        const angleDiff = targetAngle - flipper.angle;
        const step = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), speed * deltaTime);
        flipper.angle += step;
        
        // Apply to mesh
        if (flipper.mesh) {
            flipper.mesh.rotation.z = flipper.angle;
        }
        
        // Apply to physics body
        if (flipper.body) {
            const quat = new CANNON.Quaternion();
            quat.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), flipper.angle);
            flipper.body.quaternion.copy(quat);
            
            // Calculate angular velocity for motor
            if (flipper.constraint) {
                const motorSpeed = flipper.active 
                    ? (isLeft ? 20 : -20)
                    : (isLeft ? -10 : 10);
                
                flipper.constraint.enableMotor();
                flipper.constraint.setMotorSpeed(motorSpeed);
                flipper.constraint.setMotorMaxForce(CONFIG.FLIPPERS.MOTOR_TORQUE);
            }
        }
    }

    /**
     * Activate left flipper
     */
    activateLeft() {
        if (!this.left.active) {
            this.left.active = true;
            this.game.audio.playSound('flipper', 0.3);
        }
    }

    /**
     * Deactivate left flipper
     */
    deactivateLeft() {
        this.left.active = false;
    }

    /**
     * Activate right flipper
     */
    activateRight() {
        if (!this.right.active) {
            this.right.active = true;
            this.game.audio.playSound('flipper', 0.3);
        }
    }

    /**
     * Deactivate right flipper
     */
    deactivateRight() {
        this.right.active = false;
    }

    /**
     * Reset flippers
     */
    reset() {
        this.left.active = false;
        this.left.angle = CONFIG.FLIPPERS.RESTING_ANGLE;
        
        this.right.active = false;
        this.right.angle = -CONFIG.FLIPPERS.RESTING_ANGLE;
        
        if (this.left.mesh) {
            this.left.mesh.rotation.z = this.left.angle;
        }
        if (this.right.mesh) {
            this.right.mesh.rotation.z = this.right.angle;
        }
    }
}

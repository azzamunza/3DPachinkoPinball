/**
 * Physics Module
 * Uses Cannon-es for 3D physics simulation
 */

import * as CANNON from 'cannon-es';
import { CONFIG } from './config.js';

export class Physics {
    constructor(game) {
        this.game = game;
        this.world = null;
        this.materials = {};
        this.contactMaterials = [];
        this.bodies = [];
        this.debugMode = false;
    }

    /**
     * Initialize physics world
     */
    init() {
        // Create physics world
        this.world = new CANNON.World();
        
        // Set gravity (adjusted for playfield tilt)
        const tiltAngle = CONFIG.PHYSICS.PLAYFIELD_TILT;
        const gravity = CONFIG.PHYSICS.GRAVITY;
        
        // Gravity vector considering playfield tilt
        this.world.gravity.set(
            0,
            gravity * Math.cos(tiltAngle),
            gravity * Math.sin(tiltAngle)
        );
        
        // Solver settings
        this.world.solver.iterations = CONFIG.PHYSICS.SOLVER_ITERATIONS;
        this.world.solver.tolerance = 0.001;
        
        // Broadphase
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        
        // Allow sleeping for performance
        this.world.allowSleep = true;
        
        // Create materials
        this.createMaterials();
        
        console.log('Physics world initialized');
    }

    /**
     * Create physics materials with different properties
     */
    createMaterials() {
        // Ball material
        this.materials.ball = new CANNON.Material('ball');
        this.materials.ball.friction = CONFIG.PHYSICS.BALL.FRICTION;
        
        // Peg material
        this.materials.peg = new CANNON.Material('peg');
        
        // Wall material
        this.materials.wall = new CANNON.Material('wall');
        
        // Bumper material
        this.materials.bumper = new CANNON.Material('bumper');
        
        // Ramp material
        this.materials.ramp = new CANNON.Material('ramp');
        
        // Flipper material
        this.materials.flipper = new CANNON.Material('flipper');
        
        // Funnel material
        this.materials.funnel = new CANNON.Material('funnel');
        
        // Create contact materials
        this.createContactMaterials();
    }

    /**
     * Create contact materials for different collision pairs
     */
    createContactMaterials() {
        // Ball-Peg contact
        const ballPegContact = new CANNON.ContactMaterial(
            this.materials.ball,
            this.materials.peg,
            {
                friction: 0.1,
                restitution: CONFIG.PHYSICS.BALL.RESTITUTION.PEG
            }
        );
        this.world.addContactMaterial(ballPegContact);
        
        // Ball-Wall contact
        const ballWallContact = new CANNON.ContactMaterial(
            this.materials.ball,
            this.materials.wall,
            {
                friction: 0.1,
                restitution: CONFIG.PHYSICS.BALL.RESTITUTION.WALL
            }
        );
        this.world.addContactMaterial(ballWallContact);
        
        // Ball-Bumper contact
        const ballBumperContact = new CANNON.ContactMaterial(
            this.materials.ball,
            this.materials.bumper,
            {
                friction: 0.05,
                restitution: CONFIG.PHYSICS.BALL.RESTITUTION.BUMPER
            }
        );
        this.world.addContactMaterial(ballBumperContact);
        
        // Ball-Ramp contact
        const ballRampContact = new CANNON.ContactMaterial(
            this.materials.ball,
            this.materials.ramp,
            {
                friction: CONFIG.PLAYFIELD.RAMPS.LEFT.FRICTION,
                restitution: CONFIG.PHYSICS.BALL.RESTITUTION.RAMP
            }
        );
        this.world.addContactMaterial(ballRampContact);
        
        // Ball-Flipper contact
        const ballFlipperContact = new CANNON.ContactMaterial(
            this.materials.ball,
            this.materials.flipper,
            {
                friction: CONFIG.FLIPPERS.FRICTION,
                restitution: 0.7
            }
        );
        this.world.addContactMaterial(ballFlipperContact);
        
        // Ball-Funnel contact
        const ballFunnelContact = new CANNON.ContactMaterial(
            this.materials.ball,
            this.materials.funnel,
            {
                friction: CONFIG.PLAYFIELD.FUNNEL.FRICTION,
                restitution: 0.3
            }
        );
        this.world.addContactMaterial(ballFunnelContact);
    }

    /**
     * Update physics simulation
     */
    update(deltaTime) {
        // Fixed timestep with substeps for stability
        const fixedTimeStep = 1 / 60;
        const maxSubSteps = CONFIG.PHYSICS.SUBSTEPS;
        
        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
    }

    /**
     * Create a sphere body
     */
    createSphere(radius, mass, position, material = null) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: material || this.materials.ball,
            linearDamping: CONFIG.PHYSICS.BALL.LINEAR_DAMPING,
            angularDamping: CONFIG.PHYSICS.BALL.ANGULAR_DAMPING
        });
        
        // Enable CCD for balls
        body.ccdSpeedThreshold = 1;
        body.ccdIterations = 10;
        
        return body;
    }

    /**
     * Create a box body
     */
    createBox(halfExtents, mass, position, rotation = null, material = null) {
        const shape = new CANNON.Box(new CANNON.Vec3(
            halfExtents.x,
            halfExtents.y,
            halfExtents.z
        ));
        
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: material || this.materials.wall
        });
        
        if (rotation) {
            body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
        }
        
        return body;
    }

    /**
     * Create a cylinder body
     */
    createCylinder(radiusTop, radiusBottom, height, numSegments, mass, position, material = null) {
        const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
        
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: material || this.materials.peg
        });
        
        // Rotate to align with Y-axis
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.quaternion.copy(q);
        
        return body;
    }

    /**
     * Create a plane body
     */
    createPlane(position, rotation = null, material = null) {
        const shape = new CANNON.Plane();
        const body = new CANNON.Body({
            mass: 0, // Static
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: material || this.materials.wall
        });
        
        if (rotation) {
            body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
        }
        
        return body;
    }

    /**
     * Create a trigger volume (sensor)
     */
    createTrigger(shape, position, callback) {
        const body = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            isTrigger: true,
            collisionResponse: false
        });
        
        body.addEventListener('collide', callback);
        
        return body;
    }

    /**
     * Add body to world
     */
    addBody(body) {
        this.world.addBody(body);
        this.bodies.push(body);
        return body;
    }

    /**
     * Remove body from world
     */
    removeBody(body) {
        this.world.removeBody(body);
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    /**
     * Apply impulse to a body
     */
    applyImpulse(body, impulse, worldPoint = null) {
        const impulseVec = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
        if (worldPoint) {
            const point = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
            body.applyImpulse(impulseVec, point);
        } else {
            body.applyImpulse(impulseVec);
        }
    }

    /**
     * Set body velocity
     */
    setVelocity(body, velocity) {
        body.velocity.set(velocity.x, velocity.y, velocity.z);
    }

    /**
     * Get body position
     */
    getPosition(body) {
        return {
            x: body.position.x,
            y: body.position.y,
            z: body.position.z
        };
    }

    /**
     * Get body quaternion
     */
    getQuaternion(body) {
        return {
            x: body.quaternion.x,
            y: body.quaternion.y,
            z: body.quaternion.z,
            w: body.quaternion.w
        };
    }

    /**
     * Create a hinge constraint (for flippers)
     */
    createHingeConstraint(bodyA, bodyB, pivotA, pivotB, axisA, axisB) {
        const constraint = new CANNON.HingeConstraint(bodyA, bodyB, {
            pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
            pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
            axisA: new CANNON.Vec3(axisA.x, axisA.y, axisA.z),
            axisB: new CANNON.Vec3(axisB.x, axisB.y, axisB.z)
        });
        
        this.world.addConstraint(constraint);
        return constraint;
    }

    /**
     * Enable motor on hinge constraint
     */
    enableMotor(constraint, speed, maxForce) {
        constraint.enableMotor();
        constraint.setMotorSpeed(speed);
        constraint.setMotorMaxForce(maxForce);
    }

    /**
     * Disable motor on hinge constraint
     */
    disableMotor(constraint) {
        constraint.disableMotor();
    }

    /**
     * Add collision event listener
     */
    addCollisionListener(body, callback) {
        body.addEventListener('collide', callback);
    }

    /**
     * Check if body is sleeping
     */
    isSleeping(body) {
        return body.sleepState === CANNON.Body.SLEEPING;
    }

    /**
     * Wake up a body
     */
    wakeUp(body) {
        body.wakeUp();
    }

    /**
     * Put body to sleep
     */
    sleep(body) {
        body.sleep();
    }

    /**
     * Set body position
     */
    setPosition(body, position) {
        body.position.set(position.x, position.y, position.z);
    }

    /**
     * Reset body state
     */
    resetBody(body, position) {
        body.position.set(position.x, position.y, position.z);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.quaternion.set(0, 0, 0, 1);
        body.wakeUp();
    }
}

/**
 * Playfield Module
 * Creates the game board with pegs, bumpers, ramps, walls, and funnel
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG } from './config.js';

export class Playfield {
    constructor(game) {
        this.game = game;
        
        // Collections
        this.pegs = [];
        this.bumpers = [];
        this.targets = [];
        this.walls = [];
        this.ramps = [];
        
        // Visual meshes
        this.meshes = [];
        
        // Bumper cooldowns
        this.bumperCooldowns = new Map();
        
        // Target completion tracking
        this.targetsHit = new Set();
    }

    /**
     * Create the entire playfield
     */
    create() {
        this.createBackboard();
        this.createWalls();
        this.createPegs();
        this.createBumpers();
        this.createTargets();
        this.createRamps();
        this.createFunnel();
        this.createDrains();
        this.createFloor();
        
        console.log('Playfield created');
    }

    /**
     * Create the backboard (playing surface)
     */
    createBackboard() {
        const width = CONFIG.PLAYFIELD.WIDTH;
        const height = CONFIG.PLAYFIELD.HEIGHT;
        
        // Visual backboard
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.2,
            roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, -0.5);
        mesh.receiveShadow = true;
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Add decorative patterns
        this.addBackboardDecorations(width, height);
    }

    /**
     * Add decorative patterns to backboard
     */
    addBackboardDecorations(width, height) {
        // Neon border lines
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        
        // Top curved area outline
        const curveGeometry = new THREE.RingGeometry(4, 4.1, 32, 1, 0, Math.PI);
        const curveMesh = new THREE.Mesh(curveGeometry, lineMaterial);
        curveMesh.position.set(0, 4, -0.45);
        this.game.renderer.add(curveMesh);
        
        // Side lines
        const lineGeometry = new THREE.PlaneGeometry(0.1, height * 0.4);
        
        const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
        leftLine.position.set(-width/2 + 0.5, -2, -0.45);
        this.game.renderer.add(leftLine);
        
        const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
        rightLine.position.set(width/2 - 0.5, -2, -0.45);
        this.game.renderer.add(rightLine);
    }

    /**
     * Create boundary walls
     */
    createWalls() {
        const width = CONFIG.PLAYFIELD.WIDTH;
        const height = CONFIG.PLAYFIELD.HEIGHT;
        const depth = CONFIG.PLAYFIELD.DEPTH;
        const wallThickness = 0.3;
        
        // Wall material
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.WALL);
        
        // Left wall
        this.createWall(
            { x: -width/2 - wallThickness/2, y: 0, z: 0 },
            { x: wallThickness/2, y: height/2, z: depth/2 },
            material
        );
        
        // Right wall
        this.createWall(
            { x: width/2 + wallThickness/2, y: 0, z: 0 },
            { x: wallThickness/2, y: height/2, z: depth/2 },
            material
        );
        
        // Top wall (curved section represented as straight for simplicity)
        this.createWall(
            { x: 0, y: height/2 + wallThickness/2, z: 0 },
            { x: width/2, y: wallThickness/2, z: depth/2 },
            material
        );
        
        // Add angled walls for the "upside-down U" shape
        this.createAngledWalls(material);
    }

    /**
     * Create a single wall
     */
    createWall(position, halfExtents, material) {
        // Visual mesh
        const geometry = new THREE.BoxGeometry(
            halfExtents.x * 2,
            halfExtents.y * 2,
            halfExtents.z * 2
        );
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Physics body
        const body = this.game.physics.createBox(
            halfExtents,
            0, // Static
            position,
            null,
            this.game.physics.materials.wall
        );
        
        this.game.physics.addBody(body);
        this.walls.push({ mesh, body });
    }

    /**
     * Create angled walls for U-shape
     */
    createAngledWalls(material) {
        const width = CONFIG.PLAYFIELD.WIDTH;
        
        // Lower left angled wall (guides toward center)
        const leftAnglePos = { x: -4, y: -6, z: 0 };
        const leftAngleHalf = { x: 1.5, y: 0.15, z: 0.5 };
        const leftAngleRot = { x: 0, y: 0, z: Math.PI / 6 };
        
        const leftAngleGeo = new THREE.BoxGeometry(3, 0.3, 1);
        const leftAngleMesh = new THREE.Mesh(leftAngleGeo, material);
        leftAngleMesh.position.set(leftAnglePos.x, leftAnglePos.y, leftAnglePos.z);
        leftAngleMesh.rotation.z = leftAngleRot.z;
        leftAngleMesh.castShadow = true;
        this.game.renderer.add(leftAngleMesh);
        
        const leftAngleBody = this.game.physics.createBox(
            leftAngleHalf, 0, leftAnglePos, leftAngleRot,
            this.game.physics.materials.wall
        );
        this.game.physics.addBody(leftAngleBody);
        
        // Lower right angled wall
        const rightAnglePos = { x: 4, y: -6, z: 0 };
        const rightAngleRot = { x: 0, y: 0, z: -Math.PI / 6 };
        
        const rightAngleMesh = new THREE.Mesh(leftAngleGeo, material);
        rightAngleMesh.position.set(rightAnglePos.x, rightAnglePos.y, rightAnglePos.z);
        rightAngleMesh.rotation.z = rightAngleRot.z;
        rightAngleMesh.castShadow = true;
        this.game.renderer.add(rightAngleMesh);
        
        const rightAngleBody = this.game.physics.createBox(
            leftAngleHalf, 0, rightAnglePos, rightAngleRot,
            this.game.physics.materials.wall
        );
        this.game.physics.addBody(rightAngleBody);
    }

    /**
     * Create peg field (Pachinko style)
     */
    createPegs() {
        const cfg = CONFIG.PLAYFIELD.PEGS;
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.PEG);
        
        // Create staggered grid of pegs
        const startY = 6; // Start from upper area
        const endY = -3;  // End before flipper area
        const spacing = cfg.VERTICAL_SPACING;
        const hSpacing = cfg.HORIZONTAL_SPACING;
        const stagger = cfg.STAGGER_OFFSET;
        
        let row = 0;
        for (let y = startY; y > endY; y -= spacing) {
            const isStaggered = row % 2 === 1;
            const offset = isStaggered ? stagger : 0;
            const numPegs = isStaggered ? 8 : 9;
            const rowWidth = (numPegs - 1) * hSpacing;
            const startX = -rowWidth / 2 + offset;
            
            for (let i = 0; i < numPegs; i++) {
                const x = startX + i * hSpacing;
                this.createPeg({ x, y, z: 0 }, material);
            }
            
            row++;
        }
        
        console.log(`Created ${this.pegs.length} pegs`);
    }

    /**
     * Create a single peg
     */
    createPeg(position, material) {
        const radius = CONFIG.PLAYFIELD.PEGS.RADIUS;
        const height = CONFIG.PLAYFIELD.PEGS.HEIGHT;
        
        // Visual mesh (cylinder)
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 8);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.x = Math.PI / 2; // Rotate to face forward
        mesh.castShadow = true;
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Physics body (use sphere for simpler collision)
        const body = this.game.physics.createCylinder(
            radius, radius, height, 8, 0, position,
            this.game.physics.materials.peg
        );
        
        // Add collision callback
        body.addEventListener('collide', (e) => {
            this.onPegHit(e, mesh);
        });
        
        this.game.physics.addBody(body);
        this.pegs.push({ mesh, body, position });
    }

    /**
     * Handle peg collision
     */
    onPegHit(event, mesh) {
        // Check if collision is with a ball
        const otherBody = event.body;
        if (otherBody.userData && otherBody.userData.isBall) {
            // Add score
            this.game.score.addPegHit();
            
            // Play sound
            this.game.audio.playSound('peg', 0.3);
            
            // Visual flash effect
            const originalColor = mesh.material.color.getHex();
            mesh.material.color.setHex(0xffffff);
            setTimeout(() => {
                mesh.material.color.setHex(originalColor);
            }, 50);
        }
    }

    /**
     * Create pop bumpers
     */
    createBumpers() {
        const cfg = CONFIG.PLAYFIELD.BUMPERS;
        
        // Bumper positions (6 bumpers symmetrically placed)
        const positions = [
            { x: -3, y: 3, z: 0 },
            { x: 0, y: 4, z: 0 },
            { x: 3, y: 3, z: 0 },
            { x: -2, y: 1, z: 0 },
            { x: 2, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 }
        ];
        
        positions.forEach((pos, index) => {
            this.createBumper(pos, index);
        });
        
        console.log(`Created ${this.bumpers.length} bumpers`);
    }

    /**
     * Create a single bumper
     */
    createBumper(position, index) {
        const radius = CONFIG.PLAYFIELD.BUMPERS.RADIUS;
        
        // Visual mesh (dome shape)
        const geometry = new THREE.SphereGeometry(radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.BUMPER);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        
        // Add ring around bumper
        const ringGeometry = new THREE.TorusGeometry(radius + 0.1, 0.05, 8, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Physics body (sphere for simplicity)
        const body = this.game.physics.createSphere(
            radius, 0, position,
            this.game.physics.materials.bumper
        );
        
        body.userData = { isBumper: true, index };
        
        // Add collision callback
        body.addEventListener('collide', (e) => {
            this.onBumperHit(e, mesh, body, index);
        });
        
        this.game.physics.addBody(body);
        this.bumpers.push({ mesh, body, position, index });
        this.bumperCooldowns.set(index, 0);
    }

    /**
     * Handle bumper collision
     */
    onBumperHit(event, mesh, body, index) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Check cooldown
        const now = performance.now();
        const lastHit = this.bumperCooldowns.get(index) || 0;
        if (now - lastHit < CONFIG.PLAYFIELD.BUMPERS.COOLDOWN * 1000) return;
        
        this.bumperCooldowns.set(index, now);
        
        // Apply impulse to ball
        const impulse = CONFIG.PLAYFIELD.BUMPERS.IMPULSE;
        const direction = new THREE.Vector3(
            otherBody.position.x - body.position.x,
            otherBody.position.y - body.position.y,
            0
        ).normalize();
        
        this.game.physics.applyImpulse(otherBody, {
            x: direction.x * impulse,
            y: direction.y * impulse,
            z: direction.z * impulse * 0.5
        });
        
        // Add score
        this.game.score.addBumperHit();
        
        // Play sound
        this.game.audio.playSound('bumper');
        
        // Visual effect
        const originalEmissive = mesh.material.emissive.getHex();
        mesh.material.emissive.setHex(CONFIG.MATERIALS.BUMPER_HIT.emissive);
        mesh.material.emissiveIntensity = 2;
        
        setTimeout(() => {
            mesh.material.emissive.setHex(originalEmissive);
            mesh.material.emissiveIntensity = 1;
        }, 200);
    }

    /**
     * Create targets
     */
    createTargets() {
        // Standard targets (3x)
        const standardPositions = [
            { x: -4, y: 0, z: 0 },
            { x: 0, y: -1, z: 0 },
            { x: 4, y: 0, z: 0 }
        ];
        
        standardPositions.forEach((pos, i) => {
            this.createTarget(pos, i, false);
        });
        
        // Bonus targets (2x)
        const bonusPositions = [
            { x: -2, y: -4, z: 0 },
            { x: 2, y: -4, z: 0 }
        ];
        
        bonusPositions.forEach((pos, i) => {
            this.createTarget(pos, i + 3, true);
        });
        
        console.log(`Created ${this.targets.length} targets`);
    }

    /**
     * Create a single target
     */
    createTarget(position, index, isBonus) {
        const size = isBonus ? 0.6 : 0.5;
        const color = isBonus ? 0xff00ff : 0x00ff00;
        
        // Visual mesh
        const geometry = new THREE.CircleGeometry(size, 16);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            metalness: 0.5,
            roughness: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z - 0.4);
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Physics body (trigger)
        const shape = new CANNON.Sphere(size);
        const body = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            collisionResponse: false
        });
        
        body.userData = { isTarget: true, index, isBonus };
        
        body.addEventListener('collide', (e) => {
            this.onTargetHit(e, mesh, index, isBonus);
        });
        
        this.game.physics.addBody(body);
        this.targets.push({ mesh, body, position, index, isBonus, hit: false });
    }

    /**
     * Handle target hit
     */
    onTargetHit(event, mesh, index, isBonus) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Check if already hit
        if (this.targetsHit.has(index)) return;
        this.targetsHit.add(index);
        
        // Add score
        this.game.score.addTargetHit(isBonus);
        
        // Play sound
        this.game.audio.playSound('target');
        
        // Visual effect - target lights up
        mesh.material.emissiveIntensity = 1;
        
        // Check if all targets complete
        if (this.targetsHit.size >= this.targets.length) {
            this.onAllTargetsComplete();
        }
    }

    /**
     * Handle all targets complete
     */
    onAllTargetsComplete() {
        this.game.score.addAllTargetsComplete();
        this.game.cannon.enableRapidFire();
        this.game.audio.playSound('allTargets');
        
        // Award bonus balls
        this.game.balls.addBalls(CONFIG.PLAYFIELD.TARGETS.FREE_BALLS_ON_COMPLETE);
        
        // Reset targets after delay
        setTimeout(() => {
            this.resetTargets();
        }, 3000);
    }

    /**
     * Reset all targets
     */
    resetTargets() {
        this.targetsHit.clear();
        this.targets.forEach(target => {
            target.hit = false;
            target.mesh.material.emissiveIntensity = 0.3;
        });
    }

    /**
     * Create ramps
     */
    createRamps() {
        // Left ramp
        this.createRamp(
            CONFIG.PLAYFIELD.RAMPS.LEFT.POSITION,
            Math.PI / 8,
            'left'
        );
        
        // Right ramp
        this.createRamp(
            CONFIG.PLAYFIELD.RAMPS.RIGHT.POSITION,
            -Math.PI / 8,
            'right'
        );
        
        console.log(`Created ${this.ramps.length} ramps`);
    }

    /**
     * Create a single ramp
     */
    createRamp(position, angle, side) {
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.RAMP);
        
        // Ramp geometry (curved surface)
        const length = 3;
        const width = 0.8;
        
        const geometry = new THREE.BoxGeometry(width, length, 0.2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.z = angle;
        mesh.rotation.x = -0.2; // Slight tilt
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Physics body
        const body = this.game.physics.createBox(
            { x: width/2, y: length/2, z: 0.1 },
            0,
            position,
            { x: -0.2, y: 0, z: angle },
            this.game.physics.materials.ramp
        );
        
        body.userData = { isRamp: true, side };
        
        body.addEventListener('collide', (e) => {
            this.onRampEnter(e, side);
        });
        
        this.game.physics.addBody(body);
        this.ramps.push({ mesh, body, position, side });
    }

    /**
     * Handle ramp entry
     */
    onRampEnter(event, side) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Play ramp sound
        this.game.audio.playSound('rampEnter');
        
        // Add score after delay (when ball exits)
        setTimeout(() => {
            this.game.score.addRampCompletion();
            this.game.audio.playSound('rampExit');
        }, 500);
    }

    /**
     * Create jackpot funnel
     */
    createFunnel() {
        const cfg = CONFIG.PLAYFIELD.FUNNEL;
        const position = { x: 0, y: -5, z: 0 };
        
        // Visual funnel (cone)
        const geometry = new THREE.ConeGeometry(
            cfg.TOP_RADIUS,
            cfg.HEIGHT,
            24,
            1,
            true
        );
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.FUNNEL);
        material.side = THREE.DoubleSide;
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.x = Math.PI; // Point down
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        this.funnelMesh = mesh;
        
        // Physics - create ring of bodies to guide balls
        const numSegments = 12;
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * Math.PI * 2;
            const radius = cfg.TOP_RADIUS;
            
            const segPos = {
                x: position.x + Math.cos(angle) * radius,
                y: position.y + cfg.HEIGHT / 2,
                z: position.z + Math.sin(angle) * radius * 0.3
            };
            
            const body = this.game.physics.createBox(
                { x: 0.2, y: cfg.HEIGHT / 2, z: 0.1 },
                0,
                segPos,
                { x: 0, y: angle, z: -Math.PI / 6 },
                this.game.physics.materials.funnel
            );
            
            this.game.physics.addBody(body);
        }
        
        // Create trigger at bottom
        this.createFunnelTrigger(position);
    }

    /**
     * Create trigger at funnel bottom
     */
    createFunnelTrigger(funnelPosition) {
        const shape = new CANNON.Sphere(CONFIG.PLAYFIELD.FUNNEL.BOTTOM_RADIUS);
        const body = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(
                funnelPosition.x,
                funnelPosition.y - CONFIG.PLAYFIELD.FUNNEL.HEIGHT,
                funnelPosition.z
            ),
            collisionResponse: false
        });
        
        body.userData = { isFunnelTrigger: true };
        
        body.addEventListener('collide', (e) => {
            this.onFunnelCapture(e);
        });
        
        this.game.physics.addBody(body);
    }

    /**
     * Handle ball entering funnel
     */
    onFunnelCapture(event) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Remove ball from play
        this.game.balls.captureBall(otherBody);
        
        // Add to jackpot
        this.game.jackpot.addBall();
        
        // Add score
        this.game.score.addJackpotEntry();
        
        // Play sound
        this.game.audio.playSound('jackpotTrigger');
    }

    /**
     * Create drain zones
     */
    createDrains() {
        const drains = CONFIG.PLAYFIELD.DRAINS;
        
        // Left drain
        this.createDrain(drains.LEFT, 'left');
        
        // Right drain
        this.createDrain(drains.RIGHT, 'right');
    }

    /**
     * Create a single drain
     */
    createDrain(position, side) {
        // Visual indicator
        const geometry = new THREE.PlaneGeometry(2, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, -0.4);
        
        this.game.renderer.add(mesh);
        
        // Physics trigger
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 1));
        const body = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, 0),
            collisionResponse: false
        });
        
        body.userData = { isDrain: true, side };
        
        body.addEventListener('collide', (e) => {
            this.onDrain(e, side);
        });
        
        this.game.physics.addBody(body);
    }

    /**
     * Handle ball drain
     */
    onDrain(event, side) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Remove ball
        this.game.balls.drainBall(otherBody);
        
        // Play sound
        this.game.audio.playSound('drain');
    }

    /**
     * Create floor (catches any escaped balls)
     */
    createFloor() {
        const body = this.game.physics.createPlane(
            { x: 0, y: -12, z: 0 },
            { x: -Math.PI / 2, y: 0, z: 0 },
            this.game.physics.materials.wall
        );
        
        body.userData = { isFloor: true };
        
        body.addEventListener('collide', (e) => {
            const otherBody = e.body;
            if (otherBody.userData && otherBody.userData.isBall) {
                this.game.balls.drainBall(otherBody);
            }
        });
        
        this.game.physics.addBody(body);
    }
}

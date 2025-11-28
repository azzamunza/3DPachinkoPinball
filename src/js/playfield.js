/**
 * Playfield Module
 * Creates the game board with pegs, bumpers, ramps, walls, and funnel
 * Now includes authentic Pachinko features: V-Pockets, Tulip Gates, Feature Zones
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
        
        // New Pachinko features
        this.vPockets = [];
        this.tulipGates = [];
        this.featureZones = [];
        
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
        this.createVPockets();      // New: Authentic Pachinko V-Pockets
        this.createTulipGates();    // New: Mechanical tulip gates
        this.createFeatureZones();  // New: Special feature zones
        this.createStartPocket();   // New: Ball entry guide
        
        console.log('Playfield created with authentic Pachinko features');
    }

    /**
     * Create the backboard (playing surface) with procedurally generated background
     * Includes starfield, arcade-style geometric patterns, neon grid lines,
     * decorative elements, and vignette effect
     */
    createBackboard() {
        const width = CONFIG.PLAYFIELD.WIDTH;
        const height = CONFIG.PLAYFIELD.HEIGHT;
        
        // Generate background texture
        const backgroundTexture = this.generateBackgroundTexture(width, height);
        
        // Visual backboard with generated texture
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshStandardMaterial({
            map: backgroundTexture,
            metalness: 0.1,
            roughness: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, -0.5);
        mesh.receiveShadow = true;
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        this.backboardMesh = mesh;
        
        // Add decorative patterns
        this.addBackboardDecorations(width, height);
    }
    
    /**
     * Generate procedural background texture
     */
    generateBackgroundTexture(width, height) {
        const canvas = document.createElement('canvas');
        const scale = 100; // Pixels per unit
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        
        // Base gradient background (dark arcade theme)
        const baseGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        baseGradient.addColorStop(0, '#0a0a1a');    // Dark blue at top
        baseGradient.addColorStop(0.3, '#1a1a3a'); // Deep purple
        baseGradient.addColorStop(0.7, '#1a0a2a'); // Dark violet
        baseGradient.addColorStop(1, '#0a0a1a');   // Back to dark
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add starfield effect
        this.drawStarfield(ctx, canvas.width, canvas.height);
        
        // Add geometric patterns (arcade style)
        this.drawArcadePatterns(ctx, canvas.width, canvas.height);
        
        // Add neon grid lines
        this.drawNeonGrid(ctx, canvas.width, canvas.height);
        
        // Add decorative elements
        this.drawDecorativeElements(ctx, canvas.width, canvas.height);
        
        // Add vignette effect
        this.drawVignette(ctx, canvas.width, canvas.height);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * Draw starfield background
     */
    drawStarfield(ctx, width, height) {
        const numStars = 200;
        for (let i = 0; i < numStars; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            const brightness = Math.random() * 0.5 + 0.3;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fill();
        }
    }
    
    /**
     * Draw arcade-style geometric patterns
     */
    drawArcadePatterns(ctx, width, height) {
        // Concentric circles at top (entry zone)
        const centerX = width / 2;
        const topY = height * 0.15;
        
        for (let i = 5; i >= 1; i--) {
            const radius = i * 80;
            ctx.beginPath();
            ctx.arc(centerX, topY, radius, 0, Math.PI);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 + i * 0.02})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Diamond pattern in middle
        ctx.save();
        ctx.translate(width / 2, height * 0.45);
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 8);
            ctx.beginPath();
            ctx.moveTo(0, -150);
            ctx.lineTo(150, 0);
            ctx.lineTo(0, 150);
            ctx.lineTo(-150, 0);
            ctx.closePath();
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.15 - i * 0.03})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
        
        // Triangle patterns at bottom (scoring zone)
        const bottomY = height * 0.85;
        for (let i = 0; i < 5; i++) {
            const x = (i + 0.5) * (width / 5);
            ctx.beginPath();
            ctx.moveTo(x, bottomY);
            ctx.lineTo(x - 60, bottomY + 80);
            ctx.lineTo(x + 60, bottomY + 80);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    /**
     * Draw neon grid effect
     */
    drawNeonGrid(ctx, width, height) {
        // Horizontal glowing lines
        const numHLines = 20;
        for (let i = 0; i < numHLines; i++) {
            const y = (i / numHLines) * height;
            const alpha = 0.05 + Math.sin(i * 0.5) * 0.03;
            
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Perspective grid at bottom
        ctx.save();
        ctx.translate(width / 2, height * 0.95);
        for (let i = -5; i <= 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(i * 120, -height * 0.4);
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }
    
    /**
     * Draw decorative elements (icons, symbols)
     */
    drawDecorativeElements(ctx, width, height) {
        // Pachinkopolis logo/text effect at top
        ctx.save();
        ctx.font = 'bold 60px Orbitron, Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillText('★ PACHINKO ★', width / 2, height * 0.08);
        ctx.restore();
        
        // Score zone labels
        ctx.font = 'bold 24px Orbitron, Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0, 255, 128, 0.2)';
        ctx.fillText('BONUS', width * 0.2, height * 0.8);
        ctx.fillText('JACKPOT', width * 0.5, height * 0.75);
        ctx.fillText('BONUS', width * 0.8, height * 0.8);
        
        // Side arrows
        const drawArrow = (x, y, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(20, 0);
            ctx.lineTo(0, 30);
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        };
        
        drawArrow(width * 0.1, height * 0.5, Math.PI / 2);
        drawArrow(width * 0.9, height * 0.5, -Math.PI / 2);
        
        // Decorative circles
        const drawGlowCircle = (x, y, radius, color) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        };
        
        drawGlowCircle(width * 0.15, height * 0.3, 100, 'rgba(0, 240, 255, 0.1)');
        drawGlowCircle(width * 0.85, height * 0.3, 100, 'rgba(255, 0, 255, 0.1)');
        drawGlowCircle(width * 0.5, height * 0.5, 150, 'rgba(255, 215, 0, 0.08)');
    }
    
    /**
     * Draw vignette effect around edges
     */
    drawVignette(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
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
        
        // Add glowing corner accents
        this.addCornerAccents(width, height);
    }
    
    /**
     * Add glowing corner accent lights
     */
    addCornerAccents(width, height) {
        const accentMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5
        });
        
        const accentGeometry = new THREE.CircleGeometry(0.3, 16);
        
        const positions = [
            { x: -width/2 + 0.5, y: height/2 - 0.5 },
            { x: width/2 - 0.5, y: height/2 - 0.5 },
            { x: -width/2 + 0.5, y: -height/2 + 0.5 },
            { x: width/2 - 0.5, y: -height/2 + 0.5 }
        ];
        
        positions.forEach(pos => {
            const accent = new THREE.Mesh(accentGeometry, accentMaterial.clone());
            accent.position.set(pos.x, pos.y, -0.45);
            this.game.renderer.add(accent);
        });
    }

    /**
     * Create boundary walls - Arch-shaped boundary as per reference image
     * The shape resembles a tombstone/arch with rounded top and straight sides
     */
    createWalls() {
        const width = CONFIG.PLAYFIELD.WIDTH;
        const height = CONFIG.PLAYFIELD.HEIGHT;
        const depth = CONFIG.PLAYFIELD.DEPTH;
        const wallThickness = 0.3;
        
        // Wall material
        const material = this.game.renderer.createMaterial(CONFIG.MATERIALS.WALL);
        
        // Calculate arch dimensions - arch takes up top portion of playfield
        const archRadius = width / 2; // Radius of the curved top
        const archCenterY = height / 2 - archRadius; // Y position where arch meets straight walls
        const straightWallHeight = height / 2 + archCenterY; // Height of the straight portion
        
        // Left straight wall (from bottom to where arch begins)
        this.createWall(
            { x: -width/2 - wallThickness/2, y: -height/4, z: 0 },
            { x: wallThickness/2, y: straightWallHeight / 2 + 1, z: depth/2 },
            material
        );
        
        // Right straight wall (from bottom to where arch begins)
        this.createWall(
            { x: width/2 + wallThickness/2, y: -height/4, z: 0 },
            { x: wallThickness/2, y: straightWallHeight / 2 + 1, z: depth/2 },
            material
        );
        
        // Create curved arch at top using multiple segments
        this.createArchWall(archCenterY, archRadius, wallThickness, material);
        
        // Add angled walls for ball funneling
        this.createAngledWalls(material);
    }
    
    /**
     * Create curved arch wall at top of playfield using segments
     */
    createArchWall(centerY, radius, thickness, material) {
        const numSegments = 16; // Number of segments to approximate the arch
        const startAngle = 0; // Start from left (pointing right)
        const endAngle = Math.PI; // End at right (half circle)
        const depth = CONFIG.PLAYFIELD.DEPTH;
        
        for (let i = 0; i < numSegments; i++) {
            const angle1 = startAngle + (endAngle - startAngle) * (i / numSegments);
            const angle2 = startAngle + (endAngle - startAngle) * ((i + 1) / numSegments);
            const midAngle = (angle1 + angle2) / 2;
            
            // Calculate position on the arc
            const x = Math.cos(midAngle) * radius;
            const y = centerY + Math.sin(midAngle) * radius;
            
            // Calculate segment length
            const segmentLength = radius * (angle2 - angle1) * 1.1;
            
            // Create wall segment
            const segmentGeo = new THREE.BoxGeometry(segmentLength, thickness, depth);
            const segmentMesh = new THREE.Mesh(segmentGeo, material);
            segmentMesh.position.set(x, y, 0);
            segmentMesh.rotation.z = midAngle + Math.PI / 2;
            segmentMesh.castShadow = true;
            segmentMesh.receiveShadow = true;
            
            this.game.renderer.add(segmentMesh);
            this.meshes.push(segmentMesh);
            
            // Physics body for the segment
            const halfExtents = { x: segmentLength / 2, y: thickness / 2, z: depth / 2 };
            const body = this.game.physics.createBox(
                halfExtents,
                0,
                { x, y, z: 0 },
                { x: 0, y: 0, z: midAngle + Math.PI / 2 },
                this.game.physics.materials.wall
            );
            
            this.game.physics.addBody(body);
            this.walls.push({ mesh: segmentMesh, body });
        }
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
     * Create peg field - Authentic Pachinko style with curved arrangements
     * Based on reference images: curved rows, denser packing, symmetrical arches, and funnel patterns
     */
    createPegs() {
        const cfg = CONFIG.PLAYFIELD.PEGS;
        
        // Create golden/brass colored pegs for authentic look
        const goldenMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.PEG,
            color: 0xd4a84b, // Golden brass color
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Silver accent pegs for special paths
        const silverMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.PEG,
            color: 0xc0c0c0, // Silver color
            metalness: 0.8,
            roughness: 0.2
        });
        
        // === TOP SYMMETRICAL ARCHES (Entry distribution area) ===
        // Create multiple symmetrical curved rows at the top like authentic Pachinko
        this.createSymmetricalArch(8.0, 5.0, 14, goldenMaterial);   // Top wide arch
        this.createSymmetricalArch(7.0, 4.5, 16, silverMaterial);   // Second arch
        this.createSymmetricalArch(6.0, 4.0, 18, goldenMaterial);   // Third arch
        this.createSymmetricalArch(5.0, 3.5, 16, silverMaterial);   // Fourth arch
        
        // === ANGLED ROWS WITH INTERMITTENT SPACES (Mid-upper zone) ===
        // Create angled rows that cause balls to drop down at intervals
        this.createAngledRowWithGaps(-4.5, 4.0, 2.5, 4.3, 10, 3, goldenMaterial, 'left');
        this.createAngledRowWithGaps(4.5, 4.0, -2.5, 4.3, 10, 3, goldenMaterial, 'right');
        this.createAngledRowWithGaps(-4.0, 3.2, 2.0, 3.5, 9, 2, silverMaterial, 'left');
        this.createAngledRowWithGaps(4.0, 3.2, -2.0, 3.5, 9, 2, silverMaterial, 'right');
        
        // === MIDDLE ZONE (Main playing field with staggered grid) ===
        const startY = 3.0;
        const endY = -1.5;
        const vSpacing = cfg.VERTICAL_SPACING * 0.9;
        const hSpacing = cfg.HORIZONTAL_SPACING * 0.85;
        
        // Skip zones for feature areas, pockets, and slot machine
        const SKIP_ZONES = {
            CENTER_FEATURE: { xRadius: 1.2, yMin: -1, yMax: 3.5 },
            // Skip area for slot machine (left of center, lower area)
            SLOT_MACHINE: { xMin: -4, xMax: -0.5, yMin: -6, yMax: -2.5 },
            // V-Pocket areas adjusted for new layout
            V_POCKET_LEFT: { xCenter: -2.5, xRadius: 0.6, yMin: -4, yMax: -2 },
            V_POCKET_CENTER: { xCenter: 1, xRadius: 0.6, yMin: -3.5, yMax: -1.5 },
            V_POCKET_RIGHT: { xCenter: 4, xRadius: 0.6, yMin: -4.5, yMax: -2.5 },
            BUMPER_ZONES: [
                { x: -3, y: 3, radius: 0.8 },
                { x: 0, y: 4, radius: 0.8 },
                { x: 3, y: 3, radius: 0.8 },
                { x: -2, y: 1, radius: 0.8 },
                { x: 2, y: 1, radius: 0.8 },
                { x: 0, y: 2, radius: 0.8 }
            ]
        };
        
        let row = 0;
        for (let y = startY; y > endY; y -= vSpacing) {
            const isStaggered = row % 2 === 1;
            const offset = isStaggered ? hSpacing / 2 : 0;
            
            // Vary row width based on position (narrower at bottom for funnel effect)
            const rowProgress = (startY - y) / (startY - endY);
            const maxPegs = Math.floor(14 - rowProgress * 4);
            const rowWidth = (maxPegs - 1) * hSpacing;
            const startX = -rowWidth / 2 + offset;
            
            for (let i = 0; i < maxPegs; i++) {
                const x = startX + i * hSpacing;
                
                // Check if we should skip this position
                let skip = false;
                
                // Skip center feature zone
                if (Math.abs(x) < SKIP_ZONES.CENTER_FEATURE.xRadius && 
                    y < SKIP_ZONES.CENTER_FEATURE.yMax && 
                    y > SKIP_ZONES.CENTER_FEATURE.yMin) skip = true;
                
                // Skip slot machine area (Requirement #2 - slot machine placement)
                if (x >= SKIP_ZONES.SLOT_MACHINE.xMin && x <= SKIP_ZONES.SLOT_MACHINE.xMax &&
                    y >= SKIP_ZONES.SLOT_MACHINE.yMin && y <= SKIP_ZONES.SLOT_MACHINE.yMax) skip = true;
                
                // Skip V-pocket areas
                if (Math.abs(x - SKIP_ZONES.V_POCKET_LEFT.xCenter) < SKIP_ZONES.V_POCKET_LEFT.xRadius && 
                    y < SKIP_ZONES.V_POCKET_LEFT.yMax && 
                    y > SKIP_ZONES.V_POCKET_LEFT.yMin) skip = true;
                if (Math.abs(x - SKIP_ZONES.V_POCKET_CENTER.xCenter) < SKIP_ZONES.V_POCKET_CENTER.xRadius && 
                    y < SKIP_ZONES.V_POCKET_CENTER.yMax && 
                    y > SKIP_ZONES.V_POCKET_CENTER.yMin) skip = true;
                if (Math.abs(x - SKIP_ZONES.V_POCKET_RIGHT.xCenter) < SKIP_ZONES.V_POCKET_RIGHT.xRadius && 
                    y < SKIP_ZONES.V_POCKET_RIGHT.yMax && 
                    y > SKIP_ZONES.V_POCKET_RIGHT.yMin) skip = true;
                
                // Skip bumper zones
                for (const bz of SKIP_ZONES.BUMPER_ZONES) {
                    const dist = Math.sqrt(Math.pow(x - bz.x, 2) + Math.pow(y - bz.y, 2));
                    if (dist < bz.radius) skip = true;
                }
                
                if (!skip) {
                    this.createPeg({ x, y, z: 0 }, goldenMaterial);
                }
            }
            row++;
        }
        
        // === SYMMETRICAL FUNNEL GUIDES (Lower zone) ===
        // Create V-shaped funnel pegs to guide balls toward center
        this.createSymmetricalFunnel(0, -2, 5.0, 3.0, 8, silverMaterial);
        
        // === SIDE CURVED CHANNELS ===
        // Create curved channel pegs on sides to direct ball flow
        this.createCurvedChannelPegs(-5.0, 4.0, -4.0, 0, 10, goldenMaterial, 'left');
        this.createCurvedChannelPegs(5.0, 4.0, 4.0, 0, 10, goldenMaterial, 'right');
        
        // === LOWER FUNNEL ZONE PEGS ===
        // Additional funnel pegs toward center and side pockets
        this.createFunnelPegs(-4.0, -2.5, goldenMaterial);
        this.createFunnelPegs(4.0, -2.5, goldenMaterial);
        
        // === BOTTOM DROP PATHS ===
        // Create paths that lead to jackpot funnel
        this.createDropPath(-1.5, -3, -0.5, -5, 6, silverMaterial);
        this.createDropPath(1.5, -3, 0.5, -5, 6, silverMaterial);
        
        console.log(`Created ${this.pegs.length} pegs (authentic Pachinko layout with symmetrical arches)`);
    }
    
    /**
     * Create a symmetrical arch of pegs (like authentic Pachinko)
     */
    createSymmetricalArch(centerY, radius, numPegs, material) {
        const startAngle = Math.PI * 0.1;
        const endAngle = Math.PI * 0.9;
        const angleStep = (endAngle - startAngle) / (numPegs - 1);
        
        for (let i = 0; i < numPegs; i++) {
            const angle = startAngle + i * angleStep;
            const x = Math.cos(angle) * radius;
            const y = centerY - Math.sin(angle) * (radius * 0.25);
            this.createPeg({ x, y, z: 0 }, material);
        }
    }
    
    /**
     * Create angled row with intermittent gaps (causes balls to drop through)
     */
    createAngledRowWithGaps(startX, startY, endX, endY, numPegs, gapEvery, material, side) {
        for (let i = 0; i < numPegs; i++) {
            // Skip every 'gapEvery' pegs to create gaps
            if ((i + 1) % gapEvery === 0) continue;
            
            const t = i / (numPegs - 1);
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            this.createPeg({ x, y, z: 0 }, material);
        }
    }
    
    /**
     * Create symmetrical V-shaped funnel to guide balls toward center
     */
    createSymmetricalFunnel(centerX, topY, width, height, pegsPerSide, material) {
        // Left side of funnel
        for (let i = 0; i < pegsPerSide; i++) {
            const t = i / (pegsPerSide - 1);
            const x = centerX - width / 2 + (width / 2) * t * 0.8;
            const y = topY - height * t;
            this.createPeg({ x, y, z: 0 }, material);
        }
        
        // Right side of funnel (mirror)
        for (let i = 0; i < pegsPerSide; i++) {
            const t = i / (pegsPerSide - 1);
            const x = centerX + width / 2 - (width / 2) * t * 0.8;
            const y = topY - height * t;
            this.createPeg({ x, y, z: 0 }, material);
        }
    }
    
    /**
     * Create a curved row of pegs (arc shape)
     */
    createCurvedPegRow(centerY, radius, numPegs, material) {
        const startAngle = Math.PI * 0.15;
        const endAngle = Math.PI * 0.85;
        const angleStep = (endAngle - startAngle) / (numPegs - 1);
        
        for (let i = 0; i < numPegs; i++) {
            const angle = startAngle + i * angleStep;
            const x = Math.cos(angle) * radius;
            const y = centerY - Math.sin(angle) * (radius * 0.3);
            this.createPeg({ x, y, z: 0 }, material);
        }
    }
    
    /**
     * Create curved channel pegs on sides
     */
    createCurvedChannelPegs(startX, startY, endX, endY, count, material, side) {
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            // Add slight curve
            const curveOffset = Math.sin(t * Math.PI) * (side === 'left' ? 0.4 : -0.4);
            this.createPeg({ x: x + curveOffset, y, z: 0 }, material);
        }
    }
    
    /**
     * Create funnel-shaped peg arrangements
     */
    createFunnelPegs(startX, startY, material) {
        const direction = startX > 0 ? -1 : 1;
        // Create V-shape pointing toward center
        for (let i = 0; i < 5; i++) {
            const x = startX + direction * i * 0.35;
            const y = startY - i * 0.35;
            this.createPeg({ x, y, z: 0 }, material);
        }
    }
    
    /**
     * Create drop path for balls to fall through
     */
    createDropPath(startX, startY, endX, endY, count, material) {
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            this.createPeg({ x, y, z: 0 }, material);
        }
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
        
        // Add emissive property for LED glow effect
        mesh.material = mesh.material.clone();
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
        
        this.game.renderer.add(mesh);
        this.meshes.push(mesh);
        
        // Physics body (use sphere for simpler collision)
        const body = this.game.physics.createCylinder(
            radius, radius, height, 8, 0, position,
            this.game.physics.materials.peg
        );
        
        // Add collision callback
        body.addEventListener('collide', (e) => {
            this.onPegHit(e, mesh, position);
        });
        
        this.game.physics.addBody(body);
        this.pegs.push({ mesh, body, position });
    }

    /**
     * Handle peg collision with LED lighting effect
     */
    onPegHit(event, mesh, position) {
        // Check if collision is with a ball
        const otherBody = event.body;
        if (otherBody.userData && otherBody.userData.isBall) {
            // Add score
            this.game.score.addPegHit();
            
            // Play sound
            this.game.audio.playSound('peg', 0.3);
            
            // Visual flash effect with LED glow
            const originalColor = mesh.material.color.getHex();
            mesh.material.color.setHex(0xffffff);
            mesh.material.emissive.setHex(0xffff00);
            mesh.material.emissiveIntensity = 1.5;
            
            // Flash nearby LED
            if (this.game.renderer.flashLED) {
                this.game.renderer.flashLED(position.x, position.y, 0xffff00);
            }
            
            setTimeout(() => {
                mesh.material.color.setHex(originalColor);
                mesh.material.emissive.setHex(0x000000);
                mesh.material.emissiveIntensity = 0;
            }, 80);
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
     * Create jackpot funnel - positioned above slot machine as per reference image
     * The ball funnel funnels balls into the slot machine area
     */
    createFunnel() {
        const cfg = CONFIG.PLAYFIELD.FUNNEL;
        // Position funnel above the slot machine (centered, in middle-lower section)
        const position = { x: -2, y: -2, z: 0 }; // Left of center, above slot machine
        
        // Visual funnel (smaller cone to guide balls)
        const geometry = new THREE.ConeGeometry(
            cfg.TOP_RADIUS * 0.6, // Smaller funnel
            cfg.HEIGHT * 0.8,
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
        
        // Create ball catcher ring visual (like the reference image shows small circles at funnel)
        this.createBallFunnelDecorations(position);
        
        // Physics - create ring of bodies to guide balls
        const numSegments = 10;
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * Math.PI * 2;
            const radius = cfg.TOP_RADIUS * 0.5;
            
            const segPos = {
                x: position.x + Math.cos(angle) * radius,
                y: position.y + cfg.HEIGHT / 3,
                z: position.z + Math.sin(angle) * radius * 0.3
            };
            
            const body = this.game.physics.createBox(
                { x: 0.15, y: cfg.HEIGHT / 3, z: 0.1 },
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
     * Create decorative balls at the funnel entrance (as shown in reference)
     */
    createBallFunnelDecorations(funnelPosition) {
        const decorBallRadius = 0.1;
        const decorMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Create small decorative balls around the funnel opening
        const numBalls = 8;
        const ringRadius = 0.8;
        
        for (let i = 0; i < numBalls; i++) {
            const angle = (i / numBalls) * Math.PI * 2;
            const x = funnelPosition.x + Math.cos(angle) * ringRadius;
            const y = funnelPosition.y + 0.6;
            const z = funnelPosition.z + Math.sin(angle) * ringRadius * 0.3;
            
            const geometry = new THREE.SphereGeometry(decorBallRadius, 8, 8);
            const mesh = new THREE.Mesh(geometry, decorMaterial);
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            
            this.game.renderer.add(mesh);
            this.meshes.push(mesh);
        }
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

    /**
     * Create V-Pockets - Special winning pockets (authentic Pachinko feature)
     */
    createVPockets() {
        const vPockets = CONFIG.PLAYFIELD.PACHINKO.V_POCKETS;
        
        vPockets.forEach((pocket, index) => {
            // Visual representation - glowing pocket
            const pocketGeometry = new THREE.CircleGeometry(0.4, 16);
            const pocketMaterial = new THREE.MeshStandardMaterial({
                color: index === 0 ? 0xff0000 : 0xffaa00, // Red for main V-pocket, orange for bonus
                emissive: index === 0 ? 0xff0000 : 0xffaa00,
                emissiveIntensity: 0.5,
                metalness: 0.3,
                roughness: 0.5
            });
            const pocketMesh = new THREE.Mesh(pocketGeometry, pocketMaterial);
            pocketMesh.position.set(pocket.x, pocket.y, -0.4);
            this.game.renderer.add(pocketMesh);
            this.meshes.push(pocketMesh);
            
            // Add rim ring
            const rimGeometry = new THREE.RingGeometry(0.35, 0.45, 24);
            const rimMaterial = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.8,
                roughness: 0.2
            });
            const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
            rimMesh.position.set(pocket.x, pocket.y, -0.38);
            this.game.renderer.add(rimMesh);
            
            // Physics trigger
            const shape = new CANNON.Sphere(0.35);
            const body = new CANNON.Body({
                mass: 0,
                shape: shape,
                position: new CANNON.Vec3(pocket.x, pocket.y, 0),
                collisionResponse: false
            });
            
            body.userData = { 
                isVPocket: true, 
                index, 
                points: pocket.points, 
                freeBalls: pocket.freeBalls,
                label: pocket.label
            };
            
            body.addEventListener('collide', (e) => {
                this.onVPocketHit(e, pocketMesh, pocket, index);
            });
            
            this.game.physics.addBody(body);
        });
        
        console.log(`Created ${vPockets.length} V-Pockets`);
    }

    /**
     * Handle V-Pocket hit
     */
    onVPocketHit(event, mesh, pocket, index) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        // Award points
        this.game.score.addScore(pocket.points);
        
        // Award free balls
        if (pocket.freeBalls > 0) {
            this.game.balls.addBalls(pocket.freeBalls);
        }
        
        // Play special sound
        this.game.audio.playSound('jackpotTrigger');
        
        // Flash effect
        const originalEmissive = mesh.material.emissiveIntensity;
        mesh.material.emissiveIntensity = 1.5;
        setTimeout(() => {
            mesh.material.emissiveIntensity = originalEmissive;
        }, 300);
        
        // Show notification
        this.game.ui.showEventNotification(`${pocket.label}! +${pocket.points} +${pocket.freeBalls} BALLS`, '#ff0000');
    }

    /**
     * Create Tulip Gates - Mechanical opening/closing gates (authentic Pachinko feature)
     */
    createTulipGates() {
        const tulipGates = CONFIG.PLAYFIELD.PACHINKO.TULIP_GATES;
        this.tulipGates = [];
        
        tulipGates.forEach((gate, index) => {
            // Create tulip gate visuals (two petals that open/close)
            const petalGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.2);
            const petalMaterial = new THREE.MeshStandardMaterial({
                color: 0x22cc66,
                metalness: 0.5,
                roughness: 0.3
            });
            
            // Left petal
            const leftPetal = new THREE.Mesh(petalGeometry, petalMaterial);
            leftPetal.position.set(gate.x - 0.25, gate.y, 0);
            this.game.renderer.add(leftPetal);
            
            // Right petal
            const rightPetal = new THREE.Mesh(petalGeometry, petalMaterial);
            rightPetal.position.set(gate.x + 0.25, gate.y, 0);
            this.game.renderer.add(rightPetal);
            
            // Base
            const baseGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.2);
            const baseMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.6,
                roughness: 0.3
            });
            const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
            baseMesh.position.set(gate.x, gate.y - 0.35, 0);
            this.game.renderer.add(baseMesh);
            
            // Physics trigger for center (when open)
            const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.3, 0.2));
            const body = new CANNON.Body({
                mass: 0,
                shape: shape,
                position: new CANNON.Vec3(gate.x, gate.y, 0),
                collisionResponse: false
            });
            body.userData = { isTulipGate: true, index, isOpen: false };
            
            body.addEventListener('collide', (e) => {
                this.onTulipGateHit(e, index);
            });
            
            this.game.physics.addBody(body);
            
            // Store gate for animation
            this.tulipGates.push({
                leftPetal,
                rightPetal,
                body,
                isOpen: false,
                openTimer: 0,
                closeTimer: 0,
                config: gate
            });
        });
        
        // Start tulip gate animation cycle
        this.startTulipGateCycle();
        
        console.log(`Created ${tulipGates.length} Tulip Gates`);
    }

    /**
     * Start tulip gate animation cycle
     */
    startTulipGateCycle() {
        setInterval(() => {
            this.tulipGates.forEach((gate, index) => {
                // Toggle gate state periodically
                gate.isOpen = !gate.isOpen;
                gate.body.userData.isOpen = gate.isOpen;
                
                // Animate petals
                if (gate.isOpen) {
                    gate.leftPetal.rotation.z = -0.5;
                    gate.rightPetal.rotation.z = 0.5;
                    gate.leftPetal.material.emissive.setHex(0x00ff00);
                    gate.leftPetal.material.emissiveIntensity = 0.3;
                    gate.rightPetal.material.emissive.setHex(0x00ff00);
                    gate.rightPetal.material.emissiveIntensity = 0.3;
                } else {
                    gate.leftPetal.rotation.z = 0;
                    gate.rightPetal.rotation.z = 0;
                    gate.leftPetal.material.emissiveIntensity = 0;
                    gate.rightPetal.material.emissiveIntensity = 0;
                }
            });
        }, 2500); // Toggle every 2.5 seconds
    }

    /**
     * Handle Tulip Gate hit
     */
    onTulipGateHit(event, index) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        const gate = this.tulipGates[index];
        if (gate && gate.isOpen) {
            // Ball went through open gate - bonus!
            this.game.score.addScore(300);
            this.game.audio.playSound('target');
            this.game.ui.showEventNotification('TULIP GATE! +300', '#22cc66');
        }
    }

    /**
     * Create Feature Zones - Special scoring zones (authentic Pachinko feature)
     */
    createFeatureZones() {
        const featureZones = CONFIG.PLAYFIELD.PACHINKO.FEATURE_ZONES;
        this.featureZones = [];
        
        featureZones.forEach((zone, index) => {
            // Visual representation
            const zoneGeometry = new THREE.CircleGeometry(0.5, 24);
            let zoneColor;
            switch(zone.type) {
                case 'MULTIPLIER': zoneColor = 0x9900ff; break;
                case 'FEVER': zoneColor = 0xff00ff; break;
                default: zoneColor = 0x00ffff;
            }
            
            const zoneMaterial = new THREE.MeshStandardMaterial({
                color: zoneColor,
                emissive: zoneColor,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.7
            });
            const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zoneMesh.position.set(zone.x, zone.y, -0.45);
            this.game.renderer.add(zoneMesh);
            this.meshes.push(zoneMesh);
            
            // Physics trigger
            const shape = new CANNON.Sphere(0.5);
            const body = new CANNON.Body({
                mass: 0,
                shape: shape,
                position: new CANNON.Vec3(zone.x, zone.y, 0),
                collisionResponse: false
            });
            body.userData = { isFeatureZone: true, index, ...zone };
            
            body.addEventListener('collide', (e) => {
                this.onFeatureZoneHit(e, zoneMesh, zone, index);
            });
            
            this.game.physics.addBody(body);
            
            this.featureZones.push({ mesh: zoneMesh, body, config: zone, cooldown: 0 });
        });
        
        console.log(`Created ${featureZones.length} Feature Zones`);
    }

    /**
     * Handle Feature Zone hit
     */
    onFeatureZoneHit(event, mesh, zone, index) {
        const otherBody = event.body;
        if (!otherBody.userData || !otherBody.userData.isBall) return;
        
        const featureZone = this.featureZones[index];
        if (!featureZone || featureZone.cooldown > 0) return;
        
        // Set cooldown
        featureZone.cooldown = 3;
        setTimeout(() => { featureZone.cooldown = 0; }, 3000);
        
        // Handle based on zone type
        switch(zone.type) {
            case 'MULTIPLIER':
                this.game.score.setSessionMultiplier(zone.value);
                this.game.ui.showEventNotification(`${zone.value}x MULTIPLIER ACTIVE!`, '#9900ff');
                break;
            case 'FEVER':
                this.activateFeverMode(zone.duration);
                break;
        }
        
        // Visual flash
        mesh.material.emissiveIntensity = 1.0;
        setTimeout(() => {
            mesh.material.emissiveIntensity = 0.4;
        }, 500);
        
        this.game.audio.playSound('allTargets');
    }

    /**
     * Activate Fever Mode - Special high-scoring mode
     */
    activateFeverMode(duration) {
        const feverConfig = CONFIG.PLAYFIELD.PACHINKO.FEVER_MODE;
        
        // Show fever notification
        this.game.ui.showEventNotification(`🔥 FEVER MODE! ${feverConfig.MULTIPLIER}x FOR ${duration}s! 🔥`, '#ff00ff');
        
        // Set high multiplier
        this.game.score.setSessionMultiplier(feverConfig.MULTIPLIER);
        
        // Award bonus balls
        this.game.balls.addBalls(feverConfig.BALL_BONUS);
        
        // Play fever sound
        this.game.audio.playSound('jackpotWin');
        
        // End fever mode after duration
        setTimeout(() => {
            this.game.score.setSessionMultiplier(1);
            this.game.ui.showEventNotification('Fever Mode Ended', '#ffffff');
        }, duration * 1000);
    }

    /**
     * Create Start Pocket - Ball entry guide at top-left (authentic Pachinko)
     */
    createStartPocket() {
        const startPocket = CONFIG.PLAYFIELD.PACHINKO.START_POCKET;
        
        // Visual guide channel
        const channelGeometry = new THREE.BoxGeometry(startPocket.WIDTH, 3, 0.2);
        const channelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.4,
            roughness: 0.6
        });
        const channelMesh = new THREE.Mesh(channelGeometry, channelMaterial);
        channelMesh.position.set(startPocket.POSITION.x, startPocket.POSITION.y, 0);
        channelMesh.rotation.z = 0.3; // Slight angle
        this.game.renderer.add(channelMesh);
        
        // Add guide rails
        const railGeometry = new THREE.BoxGeometry(0.1, 3.2, 0.3);
        const railMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const leftRail = new THREE.Mesh(railGeometry, railMaterial);
        leftRail.position.set(startPocket.POSITION.x - startPocket.WIDTH/2 - 0.05, startPocket.POSITION.y, 0.1);
        leftRail.rotation.z = 0.3;
        this.game.renderer.add(leftRail);
        
        const rightRail = new THREE.Mesh(railGeometry, railMaterial);
        rightRail.position.set(startPocket.POSITION.x + startPocket.WIDTH/2 + 0.05, startPocket.POSITION.y, 0.1);
        rightRail.rotation.z = 0.3;
        this.game.renderer.add(rightRail);
        
        // Physics bodies for rails
        const railBody1 = this.game.physics.createBox(
            { x: 0.05, y: 1.6, z: 0.15 },
            0,
            { x: startPocket.POSITION.x - startPocket.WIDTH/2 - 0.05, y: startPocket.POSITION.y, z: 0.1 },
            { x: 0, y: 0, z: 0.3 },
            this.game.physics.materials.wall
        );
        this.game.physics.addBody(railBody1);
        
        const railBody2 = this.game.physics.createBox(
            { x: 0.05, y: 1.6, z: 0.15 },
            0,
            { x: startPocket.POSITION.x + startPocket.WIDTH/2 + 0.05, y: startPocket.POSITION.y, z: 0.1 },
            { x: 0, y: 0, z: 0.3 },
            this.game.physics.materials.wall
        );
        this.game.physics.addBody(railBody2);
        
        console.log('Start Pocket created');
    }
}

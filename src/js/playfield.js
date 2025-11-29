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
     * Generate procedural background texture - Wooden with cosmic theme
     * Based on reference image: wooden texture with deep blue/purple cosmic graphics
     */
    generateBackgroundTexture(width, height) {
        const canvas = document.createElement('canvas');
        const scale = 100; // Pixels per unit
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        
        // Base wooden texture (golden/oak color like reference)
        const woodGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        woodGradient.addColorStop(0, '#8B6914');    // Golden oak
        woodGradient.addColorStop(0.3, '#A67C00');  // Lighter gold
        woodGradient.addColorStop(0.5, '#8B6914');  // Golden oak
        woodGradient.addColorStop(0.7, '#A67C00');  // Lighter gold
        woodGradient.addColorStop(1, '#8B6914');    // Golden oak
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add wood grain texture
        this.drawWoodGrain(ctx, canvas.width, canvas.height);
        
        // Add deep blue/purple cosmic accents (dragon shapes like reference)
        this.drawCosmicAccents(ctx, canvas.width, canvas.height);
        
        // Add corner cosmic zones (purple/magenta corners)
        this.drawCornerZones(ctx, canvas.width, canvas.height);
        
        // Add neon grid lines (subtle)
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
     * Draw wood grain texture
     */
    drawWoodGrain(ctx, width, height) {
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
        ctx.lineWidth = 1;
        
        // Horizontal grain lines
        for (let y = 0; y < height; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y + Math.sin(y * 0.02) * 5);
            for (let x = 0; x < width; x += 20) {
                ctx.lineTo(x, y + Math.sin((y + x) * 0.02) * 5);
            }
            ctx.stroke();
        }
    }
    
    /**
     * Draw cosmic accents (dark blue dragon-like shapes)
     */
    drawCosmicAccents(ctx, width, height) {
        // Central dark blue cosmic area (where slot machine will be)
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Draw swirling dragon-like cosmic pattern
        ctx.fillStyle = 'rgba(10, 20, 50, 0.7)';
        
        // Left wing shape
        ctx.beginPath();
        ctx.moveTo(centerX - 100, centerY);
        ctx.bezierCurveTo(
            centerX - 300, centerY - 200,
            centerX - 400, centerY + 100,
            centerX - 200, centerY + 300
        );
        ctx.bezierCurveTo(
            centerX - 100, centerY + 200,
            centerX - 50, centerY + 100,
            centerX - 100, centerY
        );
        ctx.fill();
        
        // Right wing shape
        ctx.beginPath();
        ctx.moveTo(centerX + 100, centerY);
        ctx.bezierCurveTo(
            centerX + 300, centerY - 200,
            centerX + 400, centerY + 100,
            centerX + 200, centerY + 300
        );
        ctx.bezierCurveTo(
            centerX + 100, centerY + 200,
            centerX + 50, centerY + 100,
            centerX + 100, centerY
        );
        ctx.fill();
        
        // Upper cosmic curve
        ctx.beginPath();
        ctx.moveTo(centerX - 200, centerY - 300);
        ctx.bezierCurveTo(
            centerX - 100, centerY - 400,
            centerX + 100, centerY - 400,
            centerX + 200, centerY - 300
        );
        ctx.bezierCurveTo(
            centerX + 100, centerY - 200,
            centerX - 100, centerY - 200,
            centerX - 200, centerY - 300
        );
        ctx.fill();
    }
    
    /**
     * Draw corner zones (purple/magenta cosmic corners like reference)
     */
    drawCornerZones(ctx, width, height) {
        // Top-left corner
        const gradient1 = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.3);
        gradient1.addColorStop(0, 'rgba(80, 20, 80, 0.8)');
        gradient1.addColorStop(0.5, 'rgba(60, 10, 60, 0.5)');
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, width * 0.4, height * 0.3);
        
        // Top-right corner
        const gradient2 = ctx.createRadialGradient(width, 0, 0, width, 0, width * 0.3);
        gradient2.addColorStop(0, 'rgba(80, 20, 80, 0.8)');
        gradient2.addColorStop(0.5, 'rgba(60, 10, 60, 0.5)');
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.fillRect(width * 0.6, 0, width * 0.4, height * 0.3);
        
        // Bottom corners
        const gradient3 = ctx.createRadialGradient(0, height, 0, 0, height, width * 0.25);
        gradient3.addColorStop(0, 'rgba(80, 20, 80, 0.6)');
        gradient3.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient3;
        ctx.fillRect(0, height * 0.7, width * 0.3, height * 0.3);
        
        const gradient4 = ctx.createRadialGradient(width, height, 0, width, height, width * 0.25);
        gradient4.addColorStop(0, 'rgba(80, 20, 80, 0.6)');
        gradient4.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient4;
        ctx.fillRect(width * 0.7, height * 0.7, width * 0.3, height * 0.3);
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
     * Draw neon grid effect (subtle for Pachinko style)
     */
    drawNeonGrid(ctx, width, height) {
        // Subtle horizontal glowing lines
        const numHLines = 12;
        for (let i = 0; i < numHLines; i++) {
            const y = (i / numHLines) * height;
            const alpha = 0.02 + Math.sin(i * 0.5) * 0.01;
            
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    /**
     * Draw decorative elements (icons, symbols) - Updated for Pachinko style
     */
    drawDecorativeElements(ctx, width, height) {
        // PACHINKO header text (prominent, metallic style)
        ctx.save();
        ctx.font = 'bold 80px Orbitron, Arial';
        ctx.textAlign = 'center';
        
        // Metallic gradient for text
        const textGradient = ctx.createLinearGradient(width * 0.3, 0, width * 0.7, 0);
        textGradient.addColorStop(0, '#C0C0C0');
        textGradient.addColorStop(0.3, '#FFFFFF');
        textGradient.addColorStop(0.5, '#E0E0E0');
        textGradient.addColorStop(0.7, '#FFFFFF');
        textGradient.addColorStop(1, '#C0C0C0');
        ctx.fillStyle = textGradient;
        ctx.fillText('PACHINKO', width / 2, height * 0.06);
        
        // Add glow/shadow
        ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillText('PACHINKO', width / 2, height * 0.06);
        ctx.restore();
        
        // Catcher zone labels at bottom
        ctx.font = 'bold 28px Orbitron, Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fillText('50', width * 0.12, height * 0.92);
        ctx.fillText('100', width * 0.30, height * 0.92);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.fillText('JACKPOT', width * 0.5, height * 0.92);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fillText('100', width * 0.70, height * 0.92);
        ctx.fillText('50', width * 0.88, height * 0.92);
        
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
            width / 2, height / 2, Math.max(width, height) * 0.65
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.6, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Add decorative patterns to backboard - Metallic silver frame with LED backlighting
     * Based on reference image
     */
    addBackboardDecorations(width, height) {
        // Create metallic silver frame
        this.createMetallicFrame(width, height);
        
        // Add LED strip lighting around frame (blue, magenta, cyan)
        this.createFrameLEDs(width, height);
        
        // Add ball entry hole at top center
        this.createBallEntryHole();
        
        // Add ball rails (gold colored)
        this.createBallRails(width, height);
        
        // Add illuminated geometric targets
        this.createGeometricTargets();
    }
    
    /**
     * Create metallic silver frame around playfield
     */
    createMetallicFrame(width, height) {
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0A0A0, // Brushed silver
            metalness: 0.9,
            roughness: 0.3
        });
        
        const frameThickness = 0.4;
        const frameDepth = 0.8;
        
        // Top frame bar
        const topBarGeometry = new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, frameDepth);
        const topBar = new THREE.Mesh(topBarGeometry, frameMaterial);
        topBar.position.set(0, height / 2 + frameThickness / 2, 0);
        topBar.castShadow = true;
        this.game.renderer.add(topBar);
        this.meshes.push(topBar);
        
        // Bottom frame bar
        const bottomBar = new THREE.Mesh(topBarGeometry, frameMaterial);
        bottomBar.position.set(0, -height / 2 - frameThickness / 2, 0);
        bottomBar.castShadow = true;
        this.game.renderer.add(bottomBar);
        this.meshes.push(bottomBar);
        
        // Left frame bar
        const sideBarGeometry = new THREE.BoxGeometry(frameThickness, height, frameDepth);
        const leftBar = new THREE.Mesh(sideBarGeometry, frameMaterial);
        leftBar.position.set(-width / 2 - frameThickness / 2, 0, 0);
        leftBar.castShadow = true;
        this.game.renderer.add(leftBar);
        this.meshes.push(leftBar);
        
        // Right frame bar
        const rightBar = new THREE.Mesh(sideBarGeometry, frameMaterial);
        rightBar.position.set(width / 2 + frameThickness / 2, 0, 0);
        rightBar.castShadow = true;
        this.game.renderer.add(rightBar);
        this.meshes.push(rightBar);
        
        // Corner spheres (like reference image)
        const cornerGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const cornerMaterial = new THREE.MeshStandardMaterial({
            color: 0x505050,
            metalness: 0.95,
            roughness: 0.2
        });
        
        const cornerPositions = [
            { x: -width / 2, y: height / 2 },
            { x: width / 2, y: height / 2 },
            { x: -width / 2, y: -height / 2 },
            { x: width / 2, y: -height / 2 }
        ];
        
        cornerPositions.forEach(pos => {
            const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
            corner.position.set(pos.x, pos.y, 0.3);
            corner.castShadow = true;
            this.game.renderer.add(corner);
            this.meshes.push(corner);
        });
    }
    
    /**
     * Create LED strip lighting around frame
     */
    createFrameLEDs(width, height) {
        const ledColors = [0x00f0ff, 0xff00ff, 0x00f0ff, 0xff00ff];
        const ledSpacing = 1.0;
        
        // Top edge LEDs
        for (let x = -width / 2 + 1; x <= width / 2 - 1; x += ledSpacing) {
            const colorIndex = Math.floor((x + width / 2) / ledSpacing) % ledColors.length;
            this.createLED(x, height / 2 + 0.3, ledColors[colorIndex]);
        }
        
        // Bottom edge LEDs
        for (let x = -width / 2 + 1; x <= width / 2 - 1; x += ledSpacing) {
            const colorIndex = Math.floor((x + width / 2) / ledSpacing) % ledColors.length;
            this.createLED(x, -height / 2 - 0.3, ledColors[colorIndex]);
        }
        
        // Left edge LEDs
        for (let y = -height / 2 + 1; y <= height / 2 - 1; y += ledSpacing) {
            const colorIndex = Math.floor((y + height / 2) / ledSpacing) % ledColors.length;
            this.createLED(-width / 2 - 0.3, y, ledColors[colorIndex]);
        }
        
        // Right edge LEDs
        for (let y = -height / 2 + 1; y <= height / 2 - 1; y += ledSpacing) {
            const colorIndex = Math.floor((y + height / 2) / ledSpacing) % ledColors.length;
            this.createLED(width / 2 + 0.3, y, ledColors[colorIndex]);
        }
    }
    
    /**
     * Create single LED light
     */
    createLED(x, y, color) {
        const ledGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const ledMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(x, y, 0.3);
        this.game.renderer.add(led);
        this.meshes.push(led);
        
        // Add point light for glow effect
        const light = new THREE.PointLight(color, 0.15, 2);
        light.position.set(x, y, 0.5);
        this.game.renderer.add(light);
    }
    
    /**
     * Create ball entry hole at top center
     */
    createBallEntryHole() {
        const holeRadius = 0.4;
        
        // Dark hole visual
        const holeGeometry = new THREE.CircleGeometry(holeRadius, 24);
        const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.set(0, CONFIG.PLAYFIELD.HEIGHT / 2 - 0.5, -0.4);
        this.game.renderer.add(hole);
        
        // Gold ring around hole
        const ringGeometry = new THREE.RingGeometry(holeRadius, holeRadius + 0.1, 24);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(0, CONFIG.PLAYFIELD.HEIGHT / 2 - 0.5, -0.38);
        this.game.renderer.add(ring);
    }
    
    /**
     * Create ball rails (gold colored curved rails like reference)
     */
    createBallRails(width, height) {
        const railMaterial = new THREE.MeshStandardMaterial({
            color: 0xD4A84B, // Gold
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Create curved outer rails
        this.createCurvedRail(-width / 2 + 0.5, height / 2 - 2, -width / 2 + 2, -height / 2 + 3, railMaterial);
        this.createCurvedRail(width / 2 - 0.5, height / 2 - 2, width / 2 - 2, -height / 2 + 3, railMaterial);
        
        // Create inner funnel rails toward slot machine
        this.createCurvedRail(-3, 2, -1.5, 0, railMaterial);
        this.createCurvedRail(3, 2, 1.5, 0, railMaterial);
    }
    
    /**
     * Create a curved rail segment
     */
    createCurvedRail(startX, startY, endX, endY, material) {
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(startX, startY, 0),
            new THREE.Vector3((startX + endX) / 2, (startY + endY) / 2, 0.2),
            new THREE.Vector3(endX, endY, 0)
        );
        
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
        const rail = new THREE.Mesh(tubeGeometry, material);
        rail.castShadow = true;
        this.game.renderer.add(rail);
        this.meshes.push(rail);
    }
    
    /**
     * Create geometric illuminated targets (like reference image)
     */
    createGeometricTargets() {
        // Round illuminated targets (bumpers) positioned like reference
        const targetPositions = [
            { x: -3, y: 4, color: 0xFFD700 },  // Gold/orange left
            { x: 3, y: 4, color: 0x9370DB }   // Purple/lavender right
        ];
        
        targetPositions.forEach(target => {
            // Target glow ring
            const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: target.color,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(target.x, target.y, -0.3);
            this.game.renderer.add(ring);
            
            // Inner lit area
            const innerGeometry = new THREE.CircleGeometry(0.5, 32);
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.5
            });
            const inner = new THREE.Mesh(innerGeometry, innerMaterial);
            inner.position.set(target.x, target.y, -0.32);
            this.game.renderer.add(inner);
        });
        
        // Slot machine triggers (glowing geometric)
        const triggerGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.1);
        const triggerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.8
        });
        
        // Position triggers near the slot machine
        const triggerPositions = [
            { x: -2.5, y: 1.5 },
            { x: 2.5, y: 1.5 }
        ];
        
        triggerPositions.forEach(pos => {
            const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
            trigger.position.set(pos.x, pos.y, -0.3);
            this.game.renderer.add(trigger);
        });
    }
    
    /**
     * Add glowing corner accent lights
     */
    addCornerAccents(width, height) {
        // Handled by createFrameLEDs now
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
        // Segment overlap factor to ensure no gaps between wall segments
        const SEGMENT_OVERLAP_FACTOR = 1.1;
        
        for (let i = 0; i < numSegments; i++) {
            const angle1 = startAngle + (endAngle - startAngle) * (i / numSegments);
            const angle2 = startAngle + (endAngle - startAngle) * ((i + 1) / numSegments);
            const midAngle = (angle1 + angle2) / 2;
            
            // Calculate position on the arc
            const x = Math.cos(midAngle) * radius;
            const y = centerY + Math.sin(midAngle) * radius;
            
            // Calculate segment length with overlap to prevent gaps
            const segmentLength = radius * (angle2 - angle1) * SEGMENT_OVERLAP_FACTOR;
            
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
     * Create peg field - Dense silver Pachinko pins like reference image
     * Reference: small silver pins densely packed across central area
     */
    createPegs() {
        const cfg = CONFIG.PLAYFIELD.PEGS;
        const width = CONFIG.PLAYFIELD.WIDTH;
        const height = CONFIG.PLAYFIELD.HEIGHT;
        
        // Silver pins (like reference image)
        const silverMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.PEG,
            color: 0xC0C0C0, // Silver
            metalness: 0.9,
            roughness: 0.15
        });
        
        // Gold accent pins for rails/guides
        const goldMaterial = this.game.renderer.createMaterial({
            ...CONFIG.MATERIALS.PEG,
            color: 0xD4A84B, // Gold
            metalness: 0.85,
            roughness: 0.2
        });
        
        // Skip zones for slot machine, bumpers, and pockets
        const SKIP_ZONES = {
            // Central slot machine area
            SLOT_MACHINE: { 
                xMin: -2.2, 
                xMax: 2.2, 
                yMin: -1.8, 
                yMax: 1.8 
            },
            // Bumper positions
            BUMPERS: [
                { x: -3, y: 4, radius: 0.7 },
                { x: 3, y: 4, radius: 0.7 }
            ],
            // V-Pocket catchment areas
            V_POCKETS: [
                { x: -3, y: -2, radius: 0.6 },
                { x: 0, y: -1.5, radius: 0.8 },
                { x: 3, y: -2, radius: 0.6 }
            ]
        };
        
        // === DENSE PIN GRID (Main playfield) ===
        const vSpacing = cfg.VERTICAL_SPACING;
        const hSpacing = cfg.HORIZONTAL_SPACING;
        const startY = height / 2 - 2;  // Start from top (below header)
        const endY = -height / 2 + 3;   // End above catchers
        
        let row = 0;
        for (let y = startY; y > endY; y -= vSpacing) {
            const isStaggered = row % 2 === 1;
            const offset = isStaggered ? hSpacing / 2 : 0;
            
            // Narrower at top and bottom, wider in middle
            const rowProgress = Math.abs(y) / (height / 2);
            const rowWidth = (width - 2) * (1 - rowProgress * 0.3);
            const numPegs = Math.floor(rowWidth / hSpacing);
            const startX = -(numPegs - 1) * hSpacing / 2 + offset;
            
            for (let i = 0; i < numPegs; i++) {
                const x = startX + i * hSpacing;
                
                // Check if should skip this position
                let skip = false;
                
                // Skip slot machine area
                if (x >= SKIP_ZONES.SLOT_MACHINE.xMin && 
                    x <= SKIP_ZONES.SLOT_MACHINE.xMax &&
                    y >= SKIP_ZONES.SLOT_MACHINE.yMin && 
                    y <= SKIP_ZONES.SLOT_MACHINE.yMax) {
                    skip = true;
                }
                
                // Skip bumper zones
                for (const bz of SKIP_ZONES.BUMPERS) {
                    const dist = Math.sqrt(Math.pow(x - bz.x, 2) + Math.pow(y - bz.y, 2));
                    if (dist < bz.radius) skip = true;
                }
                
                // Skip V-pocket zones
                for (const vp of SKIP_ZONES.V_POCKETS) {
                    const dist = Math.sqrt(Math.pow(x - vp.x, 2) + Math.pow(y - vp.y, 2));
                    if (dist < vp.radius) skip = true;
                }
                
                // Skip outer edges
                if (Math.abs(x) > width / 2 - 1) skip = true;
                
                if (!skip) {
                    this.createPeg({ x, y, z: 0 }, silverMaterial);
                }
            }
            row++;
        }
        
        // === TOP CURVED ARCHES (Entry distribution) ===
        this.createCurvedPegArch(height / 2 - 1.5, width / 2 - 1, 16, goldMaterial);
        this.createCurvedPegArch(height / 2 - 2.2, width / 2 - 1.5, 14, silverMaterial);
        
        // === FUNNEL GUIDES toward slot machine ===
        // Left funnel
        for (let i = 0; i < 6; i++) {
            const t = i / 5;
            const x = -4 + t * 1.5;
            const y = 3 - t * 3;
            this.createPeg({ x, y, z: 0 }, goldMaterial);
        }
        // Right funnel
        for (let i = 0; i < 6; i++) {
            const t = i / 5;
            const x = 4 - t * 1.5;
            const y = 3 - t * 3;
            this.createPeg({ x, y, z: 0 }, goldMaterial);
        }
        
        // === LOWER GUIDES toward catchers ===
        // Left guide
        for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const x = -4 + t * 0.5;
            const y = -3 - t * 2;
            this.createPeg({ x, y, z: 0 }, goldMaterial);
        }
        // Right guide
        for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const x = 4 - t * 0.5;
            const y = -3 - t * 2;
            this.createPeg({ x, y, z: 0 }, goldMaterial);
        }
        // Center guides
        for (let i = 0; i < 4; i++) {
            const t = i / 3;
            this.createPeg({ x: -1.5 - t * 0.3, y: -2 - t * 2.5, z: 0 }, goldMaterial);
            this.createPeg({ x: 1.5 + t * 0.3, y: -2 - t * 2.5, z: 0 }, goldMaterial);
        }
        
        console.log(`Created ${this.pegs.length} silver pins (dense Pachinko layout)`);
    }
    
    /**
     * Create curved arch of pegs at top
     */
    createCurvedPegArch(centerY, radius, numPegs, material) {
        const startAngle = Math.PI * 0.15;
        const endAngle = Math.PI * 0.85;
        const angleStep = (endAngle - startAngle) / (numPegs - 1);
        
        for (let i = 0; i < numPegs; i++) {
            const angle = startAngle + i * angleStep;
            const x = Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * (radius * 0.2);
            this.createPeg({ x, y, z: 0 }, material);
        }
    }

    /**
     * Create a single peg (silver pin)
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

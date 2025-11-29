/**
 * Renderer Module
 * Handles WebGPU detection with WebGL 2.0 fallback using Three.js
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Renderer {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.rendererType = 'Unknown';
        this.qualityLevel = 'high';
        
        // Post-processing
        this.composer = null;
        this.bloomPass = null;
        
        // Adaptive quality
        this.lowFpsCount = 0;
    }

    /**
     * Initialize the renderer
     */
    async init() {
        this.canvas = document.getElementById('game-canvas');
        
        // Detect WebGPU availability
        const gpuResult = await this.detectWebGPU();
        
        // Create Three.js renderer (WebGL 2.0)
        this.createRenderer();
        
        // Create scene
        this.createScene();
        
        // Create camera
        this.createCamera();
        
        // Setup lighting
        this.setupLighting();
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
        
        // Update renderer info UI
        document.getElementById('renderer-type').textContent = this.rendererType;
        
        console.log(`Renderer initialized: ${this.rendererType}`);
    }

    /**
     * Detect WebGPU availability
     */
    async detectWebGPU() {
        if (navigator.gpu) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    const device = await adapter.requestDevice();
                    if (device) {
                        this.rendererType = 'WebGPU (detected, using WebGL2)';
                        return true;
                    }
                }
            } catch (e) {
                console.warn('WebGPU initialization failed:', e);
            }
        }
        
        // Check WebGL 2.0
        const testCanvas = document.createElement('canvas');
        const gl2 = testCanvas.getContext('webgl2');
        if (gl2) {
            this.rendererType = 'WebGL 2.0';
            return false;
        }
        
        // Check WebGL 1.0 (fallback)
        const gl1 = testCanvas.getContext('webgl');
        if (gl1) {
            this.rendererType = 'WebGL 1.0 (Limited)';
            console.warn('WebGL 1.0 detected - performance may be limited');
            return false;
        }
        
        throw new Error('No WebGL support detected');
    }

    /**
     * Create Three.js WebGL renderer
     */
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.renderer.setClearColor(0x0d1117);
    }

    /**
     * Create the scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0d1117, 30, 50);
    }

    /**
     * Create the camera
     */
    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.FOV,
            aspect,
            CONFIG.CAMERA.NEAR,
            CONFIG.CAMERA.FAR
        );
        
        this.camera.position.set(
            CONFIG.CAMERA.POSITION.x,
            CONFIG.CAMERA.POSITION.y,
            CONFIG.CAMERA.POSITION.z
        );
        
        this.camera.lookAt(
            CONFIG.CAMERA.LOOK_AT.x,
            CONFIG.CAMERA.LOOK_AT.y,
            CONFIG.CAMERA.LOOK_AT.z
        );
    }

    /**
     * Setup scene lighting - Requirement #7: No direct light, only backlit LEDs
     * Based on pinball machine lighting reference
     */
    setupLighting() {
        // NO directional light - only backlit LEDs (Requirement #7)
        // Remove direct lights and use only ambient and LED backlighting
        
        // Very dim ambient light (simulates darkness with LED illumination)
        const ambientLight = new THREE.AmbientLight(0x0a0a15, 0.15);
        this.scene.add(ambientLight);
        
        // Backlit LED lighting under the playfield (Requirement #7)
        this.addBacklitLEDs();
        
        // Add neon accent lights for arcade feel
        this.addNeonLights();
        
        // Add LED strip lighting around edges
        this.addLEDLighting();
        
        // Store a dummy reference for quality adjustment
        this.directionalLight = { shadow: { mapSize: { width: 0, height: 0 }, map: null } };
        
        // Disable shadows since we're using LED lighting
        this.renderer.shadowMap.enabled = false;
    }
    
    /**
     * Add backlit LEDs under the playfield (Requirement #7)
     * Creates vibrant, illuminating effect like pinball machines
     */
    addBacklitLEDs() {
        this.backlitLEDs = [];
        
        // Vibrant LED colors for pinball-style illumination
        const ledColors = [
            0xff0066, // Hot pink
            0x00ff66, // Neon green
            0x6600ff, // Purple
            0xff6600, // Orange
            0x00ffff, // Cyan
            0xffff00, // Yellow
            0xff00ff, // Magenta
            0x00ff00  // Green
        ];
        
        // Create grid of backlit LEDs under the playfield
        const width = CONFIG.PLAYFIELD.WIDTH;
        const height = CONFIG.PLAYFIELD.HEIGHT;
        const spacing = 1.5;
        
        for (let x = -width/2 + 1; x <= width/2 - 1; x += spacing) {
            for (let y = -height/2 + 2; y <= height/2 - 2; y += spacing) {
                const colorIndex = Math.floor(Math.random() * ledColors.length);
                const color = ledColors[colorIndex];
                
                // LED light from behind the backboard
                const led = new THREE.PointLight(color, 0.8, 3);
                led.position.set(x, y, -0.8); // Behind the backboard
                this.scene.add(led);
                
                this.backlitLEDs.push({
                    light: led,
                    baseColor: color,
                    phase: Math.random() * Math.PI * 2,
                    baseIntensity: 0.5 + Math.random() * 0.5
                });
            }
        }
        
        // Add brighter center LEDs for focus areas
        const centerLEDs = [
            { x: 0, y: 3, color: 0xff00ff, intensity: 1.5 },  // Upper center
            { x: -3, y: 0, color: 0x00ffff, intensity: 1.2 }, // Left mid
            { x: 3, y: 0, color: 0x00ffff, intensity: 1.2 },  // Right mid
            { x: 0, y: -2, color: 0xffff00, intensity: 1.5 }, // Lower center (jackpot area)
            { x: -2, y: -5, color: 0xff6600, intensity: 1.0 }, // Left flipper
            { x: 2, y: -5, color: 0xff6600, intensity: 1.0 }   // Right flipper
        ];
        
        centerLEDs.forEach(cfg => {
            const led = new THREE.PointLight(cfg.color, cfg.intensity, 5);
            led.position.set(cfg.x, cfg.y, -0.6);
            this.scene.add(led);
            
            this.backlitLEDs.push({
                light: led,
                baseColor: cfg.color,
                phase: Math.random() * Math.PI * 2,
                baseIntensity: cfg.intensity
            });
        });
        
        // Start backlit LED animation
        this.animateBacklitLEDs();
    }
    
    /**
     * Animate backlit LEDs with pulsing effect
     */
    animateBacklitLEDs() {
        const animate = () => {
            const time = performance.now() * 0.001;
            
            this.backlitLEDs.forEach((led, index) => {
                // Create subtle pulsing effect
                const pulse = Math.sin(time * 2 + led.phase) * 0.3 + 0.7;
                led.light.intensity = led.baseIntensity * pulse;
            });
            
            requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Add neon accent lights
     */
    addNeonLights() {
        // Cyan neon rim light (brighter for LED-only lighting)
        const cyanLight = new THREE.PointLight(0x00f0ff, 1.2, 18);
        cyanLight.position.set(-6, 0, 2);
        this.scene.add(cyanLight);
        
        // Magenta neon rim light
        const magentaLight = new THREE.PointLight(0xff00ff, 1.2, 18);
        magentaLight.position.set(6, 0, 2);
        this.scene.add(magentaLight);
        
        // Add top edge neon
        const topNeon = new THREE.PointLight(0xffff00, 0.8, 12);
        topNeon.position.set(0, 8, 1);
        this.scene.add(topNeon);
        
        // Bottom neon near flippers
        const bottomNeon1 = new THREE.PointLight(0xff6600, 1.0, 8);
        bottomNeon1.position.set(-3, -6, 1);
        this.scene.add(bottomNeon1);
        
        const bottomNeon2 = new THREE.PointLight(0xff6600, 1.0, 8);
        bottomNeon2.position.set(3, -6, 1);
        this.scene.add(bottomNeon2);
    }
    
    /**
     * Add LED strip lighting around the board
     */
    addLEDLighting() {
        this.ledLights = [];
        
        // Create LED strip lights around the board edges
        const ledColors = [0x00f0ff, 0xff00ff, 0x00ff00, 0xffff00];
        const positions = [
            // Top edge LEDs
            { x: -5, y: 9, z: 0.5 },
            { x: -2.5, y: 9.5, z: 0.5 },
            { x: 0, y: 9.5, z: 0.5 },
            { x: 2.5, y: 9.5, z: 0.5 },
            { x: 5, y: 9, z: 0.5 },
            // Left edge LEDs
            { x: -5.5, y: 5, z: 0.5 },
            { x: -5.5, y: 0, z: 0.5 },
            { x: -5.5, y: -5, z: 0.5 },
            // Right edge LEDs
            { x: 5.5, y: 5, z: 0.5 },
            { x: 5.5, y: 0, z: 0.5 },
            { x: 5.5, y: -5, z: 0.5 },
            // Bottom edge LEDs
            { x: -3, y: -8, z: 0.5 },
            { x: 0, y: -8, z: 0.5 },
            { x: 3, y: -8, z: 0.5 }
        ];
        
        positions.forEach((pos, index) => {
            const color = ledColors[index % ledColors.length];
            const light = new THREE.PointLight(color, 0.3, 4);
            light.position.set(pos.x, pos.y, pos.z);
            this.scene.add(light);
            
            // Store for animation
            this.ledLights.push({
                light,
                baseIntensity: 0.3,
                color,
                phase: Math.random() * Math.PI * 2
            });
            
            // Add visual LED mesh (small glowing sphere)
            const ledGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const ledMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            const ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
            ledMesh.position.set(pos.x, pos.y, pos.z);
            this.scene.add(ledMesh);
            this.ledLights[this.ledLights.length - 1].mesh = ledMesh;
        });
        
        // Start LED animation
        this.animateLEDs();
    }
    
    /**
     * Animate LED lights (pulsing effect)
     */
    animateLEDs() {
        const animate = () => {
            const time = performance.now() * 0.002;
            
            this.ledLights.forEach((led, index) => {
                // Create wave pattern along the LEDs
                const wave = Math.sin(time + led.phase + index * 0.3) * 0.5 + 0.5;
                led.light.intensity = led.baseIntensity * (0.5 + wave * 0.8);
                
                if (led.mesh) {
                    led.mesh.material.opacity = 0.5 + wave * 0.5;
                }
            });
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Flash a specific LED color (called when peg is hit)
     */
    flashLED(x, y, color = 0xffffff) {
        // Find nearest LED and flash it
        let nearestLED = null;
        let nearestDist = Infinity;
        
        this.ledLights.forEach(led => {
            const dist = Math.sqrt(
                Math.pow(led.light.position.x - x, 2) + 
                Math.pow(led.light.position.y - y, 2)
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestLED = led;
            }
        });
        
        if (nearestLED && nearestDist < 3) {
            const originalIntensity = nearestLED.light.intensity;
            nearestLED.light.intensity = 2.0;
            nearestLED.light.color.setHex(color);
            
            setTimeout(() => {
                nearestLED.light.intensity = originalIntensity;
                nearestLED.light.color.setHex(nearestLED.color);
            }, 100);
        }
    }

    /**
     * Handle window resize
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Adaptive quality adjustment based on FPS
     */
    adjustQuality(fps) {
        if (!CONFIG.RENDERING.ADAPTIVE_QUALITY) return;
        
        if (fps < CONFIG.RENDERING.FPS_THRESHOLD_CRITICAL) {
            this.lowFpsCount++;
            if (this.lowFpsCount > 30 && this.qualityLevel !== 'critical') {
                this.setQualityLevel('critical');
            }
        } else if (fps < CONFIG.RENDERING.FPS_THRESHOLD_LOW) {
            this.lowFpsCount++;
            if (this.lowFpsCount > 30 && this.qualityLevel !== 'low') {
                this.setQualityLevel('low');
            }
        } else if (fps < CONFIG.RENDERING.FPS_THRESHOLD_MEDIUM) {
            this.lowFpsCount++;
            if (this.lowFpsCount > 30 && this.qualityLevel !== 'medium') {
                this.setQualityLevel('medium');
            }
        } else {
            this.lowFpsCount = 0;
        }
    }

    /**
     * Set quality level
     */
    setQualityLevel(level) {
        console.log(`Adjusting quality to: ${level}`);
        this.qualityLevel = level;
        
        switch (level) {
            case 'critical':
                this.directionalLight.shadow.mapSize.width = 512;
                this.directionalLight.shadow.mapSize.height = 512;
                this.renderer.shadowMap.enabled = false;
                break;
            case 'low':
                this.directionalLight.shadow.mapSize.width = CONFIG.RENDERING.SHADOW_MAP_SIZE_LOW;
                this.directionalLight.shadow.mapSize.height = CONFIG.RENDERING.SHADOW_MAP_SIZE_LOW;
                break;
            case 'medium':
                this.directionalLight.shadow.mapSize.width = CONFIG.RENDERING.SHADOW_MAP_SIZE_LOW;
                this.directionalLight.shadow.mapSize.height = CONFIG.RENDERING.SHADOW_MAP_SIZE_LOW;
                break;
            default:
                this.directionalLight.shadow.mapSize.width = CONFIG.RENDERING.SHADOW_MAP_SIZE;
                this.directionalLight.shadow.mapSize.height = CONFIG.RENDERING.SHADOW_MAP_SIZE;
                this.renderer.shadowMap.enabled = true;
        }
        
        // Need to update shadow map
        this.directionalLight.shadow.map?.dispose();
        this.directionalLight.shadow.map = null;
    }

    /**
     * Create a standard PBR material
     */
    createMaterial(config) {
        return new THREE.MeshStandardMaterial({
            color: config.color || 0xffffff,
            metalness: config.metalness || 0.5,
            roughness: config.roughness || 0.5,
            emissive: config.emissive || 0x000000,
            emissiveIntensity: config.emissiveIntensity || 1,
            transparent: config.transparent || false,
            opacity: config.opacity || 1,
            side: config.side || THREE.FrontSide
        });
    }

    /**
     * Add object to scene
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Remove object from scene
     */
    remove(object) {
        this.scene.remove(object);
    }
}

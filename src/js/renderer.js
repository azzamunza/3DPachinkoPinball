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
     * Setup scene lighting
     */
    setupLighting() {
        // Directional Light (Primary - Arcade Spotlight)
        const dirLight = new THREE.DirectionalLight(
            CONFIG.LIGHTING.DIRECTIONAL.COLOR,
            CONFIG.LIGHTING.DIRECTIONAL.INTENSITY
        );
        dirLight.position.set(
            CONFIG.LIGHTING.DIRECTIONAL.POSITION.x,
            CONFIG.LIGHTING.DIRECTIONAL.POSITION.y,
            CONFIG.LIGHTING.DIRECTIONAL.POSITION.z
        );
        
        // Shadow settings
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = CONFIG.RENDERING.SHADOW_MAP_SIZE;
        dirLight.shadow.mapSize.height = CONFIG.RENDERING.SHADOW_MAP_SIZE;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -15;
        dirLight.shadow.camera.right = 15;
        dirLight.shadow.camera.top = 15;
        dirLight.shadow.camera.bottom = -15;
        dirLight.shadow.bias = -0.001;
        dirLight.shadow.normalBias = 0.02;
        
        this.scene.add(dirLight);
        this.directionalLight = dirLight;
        
        // Fill Light (Secondary)
        const fillLight = new THREE.DirectionalLight(
            CONFIG.LIGHTING.FILL.COLOR,
            CONFIG.LIGHTING.FILL.INTENSITY
        );
        fillLight.position.set(
            CONFIG.LIGHTING.FILL.POSITION.x,
            CONFIG.LIGHTING.FILL.POSITION.y,
            CONFIG.LIGHTING.FILL.POSITION.z
        );
        this.scene.add(fillLight);
        
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(
            CONFIG.LIGHTING.AMBIENT.COLOR,
            CONFIG.LIGHTING.AMBIENT.INTENSITY
        );
        this.scene.add(ambientLight);
        
        // Add some neon accent lights for arcade feel
        this.addNeonLights();
    }

    /**
     * Add neon accent lights
     */
    addNeonLights() {
        // Cyan neon rim light
        const cyanLight = new THREE.PointLight(0x00f0ff, 0.5, 15);
        cyanLight.position.set(-6, 0, 2);
        this.scene.add(cyanLight);
        
        // Magenta neon rim light
        const magentaLight = new THREE.PointLight(0xff00ff, 0.5, 15);
        magentaLight.position.set(6, 0, 2);
        this.scene.add(magentaLight);
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

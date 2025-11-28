/**
 * Dancing Dragons Jackpot Machine
 * Audio Manager - Procedural Sound Generation
 */

import { CONFIG } from './config.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;
        
        // Initialize on first user interaction using a single handler
        const initHandler = () => {
            this.init();
            // Remove both listeners after first successful initialization
            document.removeEventListener('click', initHandler);
            document.removeEventListener('keydown', initHandler);
        };
        document.addEventListener('click', initHandler);
        document.addEventListener('keydown', initHandler);
    }
    
    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = CONFIG.AUDIO.MASTER_VOLUME;
            this.isInitialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.warn('Audio initialization failed:', e);
        }
    }
    
    playSound(soundName) {
        if (!this.isInitialized || this.isMuted || !CONFIG.AUDIO.ENABLED) return;
        
        const soundConfig = CONFIG.AUDIO.SOUNDS[soundName];
        if (!soundConfig) return;
        
        try {
            this.generateSound(soundConfig);
        } catch (e) {
            console.warn(`Failed to play sound ${soundName}:`, e);
        }
    }
    
    generateSound(config) {
        const { frequency, duration, type } = config;
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Create oscillator
        const oscillator = ctx.createOscillator();
        oscillator.type = type || 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        
        // Create envelope
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.3, now + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        // Connect
        oscillator.connect(envelope);
        envelope.connect(this.masterGain);
        
        // Play
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : CONFIG.AUDIO.MASTER_VOLUME;
        }
    }
    
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

export default AudioManager;

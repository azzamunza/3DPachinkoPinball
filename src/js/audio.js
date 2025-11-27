/**
 * Audio Manager
 * Uses jsfxr-style synthesis for procedural sound generation
 * Includes individual sound volume and parameter controls (sfxr.me style)
 */

export class AudioManager {
    constructor(game) {
        this.game = game;
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 1.0;
        this.sfxVolume = 0.8;
        this.muted = false;
        
        // Individual sound volumes (0-1)
        this.soundVolumes = {
            fire: 0.8,
            peg: 0.8,
            bumper: 0.8,
            rampEnter: 0.8,
            rampExit: 0.8,
            target: 0.8,
            allTargets: 0.8,
            jackpotTrigger: 0.8,
            reelSpin: 0.8,
            reelStop: 0.8,
            jackpotWin: 0.8,
            drain: 0.8,
            gameOver: 0.8,
            uiClick: 0.8,
            flipper: 0.8
        };
        
        // SFXR-style sound parameters for each sound (allows customization)
        this.soundParams = {
            fire: {
                type: 'square',
                frequency: 440,
                duration: 0.15,
                attack: 0.01,
                decay: 0.1,
                sustain: 0.02,
                release: 0.02,
                frequencySlide: 0.3,
                sustainLevel: 0.7
            },
            peg: {
                type: 'square',
                frequency: 800,
                duration: 0.08,
                attack: 0.001,
                decay: 0.05,
                sustain: 0.01,
                release: 0.02,
                frequencySlide: -0.2,
                sustainLevel: 0.7
            },
            bumper: {
                type: 'sawtooth',
                frequency: 200,
                duration: 0.25,
                attack: 0.001,
                decay: 0.1,
                sustain: 0.1,
                release: 0.05,
                frequencySlide: 0.5,
                sustainLevel: 0.7
            },
            rampEnter: {
                type: 'sine',
                frequency: 300,
                duration: 0.2,
                attack: 0.01,
                decay: 0.1,
                sustain: 0.05,
                release: 0.05,
                frequencySlide: 0.2,
                sustainLevel: 0.7
            },
            rampExit: {
                type: 'square',
                frequency: 600,
                duration: 0.15,
                attack: 0.001,
                decay: 0.05,
                sustain: 0.05,
                release: 0.05,
                frequencySlide: 0.4,
                sustainLevel: 0.7
            },
            target: {
                type: 'sine',
                frequency: 523,
                duration: 0.2,
                attack: 0.01,
                decay: 0.1,
                sustain: 0.05,
                release: 0.05,
                frequencySlide: 0.3,
                sustainLevel: 0.7
            },
            jackpotTrigger: {
                type: 'square',
                frequency: 880,
                duration: 0.3,
                attack: 0.01,
                decay: 0.1,
                sustain: 0.15,
                release: 0.05,
                frequencySlide: 0,
                sustainLevel: 0.7
            },
            reelSpin: {
                type: 'sawtooth',
                frequency: 100,
                duration: 0.5,
                attack: 0.1,
                decay: 0.2,
                sustain: 0.15,
                release: 0.05,
                frequencySlide: 0.1,
                sustainLevel: 0.7
            },
            reelStop: {
                type: 'square',
                frequency: 150,
                duration: 0.1,
                attack: 0.001,
                decay: 0.05,
                sustain: 0.02,
                release: 0.02,
                frequencySlide: -0.3,
                sustainLevel: 0.7
            },
            drain: {
                type: 'sawtooth',
                frequency: 200,
                duration: 0.4,
                attack: 0.01,
                decay: 0.2,
                sustain: 0.15,
                release: 0.05,
                frequencySlide: -0.5,
                sustainLevel: 0.7
            },
            gameOver: {
                type: 'sawtooth',
                frequency: 150,
                duration: 0.8,
                attack: 0.1,
                decay: 0.4,
                sustain: 0.2,
                release: 0.1,
                frequencySlide: -0.3,
                sustainLevel: 0.7
            },
            uiClick: {
                type: 'sine',
                frequency: 600,
                duration: 0.08,
                attack: 0.01,
                decay: 0.04,
                sustain: 0.02,
                release: 0.01,
                frequencySlide: 0,
                sustainLevel: 0.7
            },
            flipper: {
                type: 'square',
                frequency: 250,
                duration: 0.06,
                attack: 0.001,
                decay: 0.03,
                sustain: 0.02,
                release: 0.01,
                frequencySlide: 0.2,
                sustainLevel: 0.7
            }
        };
    }

    /**
     * Initialize audio system
     */
    init() {
        // Create audio context on first user interaction
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate all sounds
        this.generateSounds();
        
        // Handle audio context state
        if (this.audioContext.state === 'suspended') {
            const resumeAudio = () => {
                this.audioContext.resume();
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('touchstart', resumeAudio);
            };
            document.addEventListener('click', resumeAudio);
            document.addEventListener('touchstart', resumeAudio);
        }
        
        console.log('Audio manager initialized');
    }

    /**
     * Generate all game sounds using jsfxr-style synthesis
     */
    generateSounds() {
        // Generate all sounds from stored parameters
        for (const soundName of Object.keys(this.soundParams)) {
            this.sounds[soundName] = this.createSound(this.soundParams[soundName]);
        }
        
        // Special sounds that need custom generation
        this.sounds.allTargets = this.createFanfare();
        this.sounds.jackpotWin = this.createTriumph();
    }
    
    /**
     * Regenerate a specific sound with new parameters
     */
    regenerateSound(name) {
        if (this.soundParams[name]) {
            this.sounds[name] = this.createSound(this.soundParams[name]);
        }
    }
    
    /**
     * Get sound parameters for a specific sound
     */
    getSoundParams(name) {
        return this.soundParams[name] ? { ...this.soundParams[name] } : null;
    }
    
    /**
     * Set sound parameters for a specific sound and regenerate
     */
    setSoundParams(name, params) {
        if (this.soundParams[name]) {
            // Update individual parameters
            for (const key of Object.keys(params)) {
                if (key in this.soundParams[name]) {
                    this.soundParams[name][key] = params[key];
                }
            }
            // Regenerate the sound
            this.regenerateSound(name);
        }
    }
    
    /**
     * Set a single parameter for a sound
     */
    setSoundParam(name, param, value) {
        if (this.soundParams[name] && param in this.soundParams[name]) {
            this.soundParams[name][param] = value;
            this.regenerateSound(name);
        }
    }
    
    /**
     * Get list of editable sounds
     */
    getEditableSounds() {
        return Object.keys(this.soundParams);
    }
    
    /**
     * Get list of available waveform types
     */
    getWaveformTypes() {
        return ['sine', 'square', 'sawtooth', 'triangle'];
    }

    /**
     * Create a simple synthesized sound
     */
    createSound(params) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = params.duration || 0.5;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        
        const attack = params.attack || 0.01;
        const decay = params.decay || 0.1;
        const sustain = params.sustain || 0.5;
        const release = params.release || 0.1;
        const sustainLevel = params.sustainLevel || 0.7;
        
        const frequency = params.frequency || 440;
        const frequencySlide = params.frequencySlide || 0;
        const type = params.type || 'sine';
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            
            // Calculate frequency with slide
            const currentFreq = frequency * (1 + frequencySlide * t);
            
            // Generate waveform
            let sample = 0;
            const phase = t * currentFreq * 2 * Math.PI;
            
            switch (type) {
                case 'sine':
                    sample = Math.sin(phase);
                    break;
                case 'square':
                    sample = Math.sin(phase) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    sample = 2 * ((t * currentFreq) % 1) - 1;
                    break;
                case 'triangle':
                    sample = Math.abs(4 * ((t * currentFreq) % 1) - 2) - 1;
                    break;
            }
            
            // Apply ADSR envelope
            let envelope = 0;
            const attackSamples = attack * sampleRate;
            const decaySamples = decay * sampleRate;
            const sustainSamples = sustain * sampleRate;
            const releaseSamples = release * sampleRate;
            
            if (i < attackSamples) {
                envelope = i / attackSamples;
            } else if (i < attackSamples + decaySamples) {
                const decayProgress = (i - attackSamples) / decaySamples;
                envelope = 1 - (1 - sustainLevel) * decayProgress;
            } else if (i < attackSamples + decaySamples + sustainSamples) {
                envelope = sustainLevel;
            } else {
                const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
                envelope = sustainLevel * (1 - releaseProgress);
            }
            
            data[i] = sample * envelope * 0.5;
        }
        
        return buffer;
    }

    /**
     * Create victory fanfare
     */
    createFanfare() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        const noteDuration = duration / notes.length;
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration);
            const noteT = (t % noteDuration) / noteDuration;
            
            if (noteIndex < notes.length) {
                const freq = notes[noteIndex];
                const sample = Math.sin(t * freq * 2 * Math.PI);
                const envelope = noteT < 0.1 ? noteT / 0.1 : (1 - noteT) / 0.9;
                data[i] = sample * envelope * 0.4;
            }
        }
        
        return buffer;
    }

    /**
     * Create triumph sound
     */
    createTriumph() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.5;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        
        const notes = [523, 659, 784, 1047, 1318];
        const noteDuration = 0.25;
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            for (let n = 0; n < notes.length; n++) {
                const noteStart = n * noteDuration * 0.8;
                if (t >= noteStart) {
                    const noteT = t - noteStart;
                    const freq = notes[n];
                    const noteSample = Math.sin(noteT * freq * 2 * Math.PI);
                    const envelope = Math.exp(-noteT * 2);
                    sample += noteSample * envelope * 0.2;
                }
            }
            
            data[i] = sample;
        }
        
        return buffer;
    }

    /**
     * Play a sound
     */
    playSound(name, volume = 1.0) {
        if (this.muted || !this.sounds[name]) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            
            // Get individual sound volume
            const individualVolume = this.soundVolumes[name] || 0.8;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.masterVolume * this.sfxVolume * individualVolume * volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    /**
     * Set individual sound volume
     */
    setSoundVolume(name, volume) {
        if (Object.prototype.hasOwnProperty.call(this.soundVolumes, name)) {
            this.soundVolumes[name] = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Get individual sound volume
     */
    getSoundVolume(name) {
        return this.soundVolumes[name] || 0.8;
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set SFX volume
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    /**
     * Set mute state
     */
    setMuted(muted) {
        this.muted = muted;
    }
}

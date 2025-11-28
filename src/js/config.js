/**
 * Game Configuration Constants
 * Based on specification from 3DHybridPachinkoPinball-Prompt.md
 */

export const CONFIG = {
    // Frame & Performance
    TARGET_FPS: 60,
    MAX_DELTA_TIME: 1/30, // Cap at 30fps minimum to prevent physics explosion
    
    // Physics Constants
    PHYSICS: {
        GRAVITY: -9.81,
        PLAYFIELD_TILT: -6.5 * (Math.PI / 180), // -6.5 degrees in radians (tilted BACKWARD so balls roll down toward player)
        SUBSTEPS: 8,
        CCD_ENABLED: true,
        SOLVER_ITERATIONS: 12,
        
        // Ball Properties
        BALL: {
            RADIUS: 0.1, // Reduced to 1/3 of original size (was 0.3)
            MASS: 0.33, // Reduced proportionally
            FRICTION: 0.05,
            LINEAR_DAMPING: 0.08,
            ANGULAR_DAMPING: 0.25,
            RESTITUTION: {
                PEG: 0.88,
                WALL: 0.72,
                BUMPER: 0.95,
                RAMP: 0.45
            }
        },
        
        // Collision Groups
        COLLISION_GROUPS: {
            BALL: 1,
            STATIC: 2,
            DYNAMIC: 4,
            TRIGGER: 8
        }
    },
    
    // Playfield Dimensions (scaled units)
    PLAYFIELD: {
        WIDTH: 12,
        HEIGHT: 20,
        DEPTH: 2,
        
        // Peg Configuration - Authentic Pachinko Style
        PEGS: {
            COUNT: 120, // More pegs for authentic Pachinko feel
            RADIUS: 0.08, // Smaller pegs (reduced from 0.15)
            HEIGHT: 0.4,
            RESTITUTION: 0.88,
            ROWS: 15,
            HORIZONTAL_SPACING: 0.8, // Tighter spacing
            VERTICAL_SPACING: 0.9,
            STAGGER_OFFSET: 0.4
        },
        
        // Pop-Bumpers
        BUMPERS: {
            COUNT: 6,
            RADIUS: 0.5,
            IMPULSE: 25,
            COOLDOWN: 0.15,
            RESTITUTION: 0.95
        },
        
        // Ramps
        RAMPS: {
            LEFT: {
                POSITION: { x: -4, y: 5, z: 0 },
                EXIT_VELOCITY: 18,
                FRICTION: 0.6
            },
            RIGHT: {
                POSITION: { x: 4, y: 5, z: 0 },
                EXIT_VELOCITY: 18,
                FRICTION: 0.6
            }
        },
        
        // Targets
        TARGETS: {
            STANDARD_POINTS: 100,
            BONUS_POINTS: 500,
            COMPLETION_BONUS: 5000,
            FREE_BALLS_ON_COMPLETE: 5
        },
        
        // Jackpot Funnel
        FUNNEL: {
            TOP_RADIUS: 1.5,
            BOTTOM_RADIUS: 0.8,
            HEIGHT: 2,
            FRICTION: 0.3
        },
        
        // Drains
        DRAINS: {
            LEFT: { x: -5, y: -9 },
            RIGHT: { x: 5, y: -9 },
            CENTER: { x: 0, y: -9 }
        },
        
        // Authentic Pachinko Features (based on Wikipedia: https://en.wikipedia.org/wiki/Pachinko#Design)
        PACHINKO: {
            // Start Pocket - Ball entry point at top
            START_POCKET: {
                POSITION: { x: -5, y: 8, z: 0 },
                WIDTH: 1.5,
                POINTS: 0
            },
            // V-Pockets (Chuckers) - Special winning pockets that trigger slot machine
            // In authentic Pachinko, balls landing in chuckers trigger the slot machine
            V_POCKETS: [
                { x: -2.5, y: -3, points: 500, freeBalls: 3, label: 'V-POCKET', triggersSlot: true },
                { x: 1, y: -2.5, points: 200, freeBalls: 1, label: 'BONUS' },
                { x: 4, y: -3.5, points: 200, freeBalls: 1, label: 'BONUS' }
            ],
            // Tulip Gates (Yakumono) - Opening/Closing mechanical gates
            // These are characteristic of Pachinko - they open temporarily to allow balls through
            TULIP_GATES: [
                { x: -3.5, y: 1, openTime: 2.0, closeTime: 3.0 },
                { x: 3.5, y: 1, openTime: 2.0, closeTime: 3.0 },
                { x: 0, y: 0, openTime: 2.5, closeTime: 2.5 }
            ],
            // Feature Zones - Trigger special events (Koatari, Oatari)
            FEATURE_ZONES: [
                { x: -4.5, y: 2, type: 'MULTIPLIER', value: 2 },
                { x: 4.5, y: 2, type: 'MULTIPLIER', value: 2 },
                { x: 0, y: 4, type: 'FEVER', duration: 10 }
            ],
            // Fever Mode (Kakuhen) - Probability change state from Wikipedia
            FEVER_MODE: {
                DURATION: 15, // seconds
                MULTIPLIER: 5,
                BALL_BONUS: 10
            },
            // Slot Machine Area - Where the jackpot machine is placed
            SLOT_MACHINE_AREA: {
                POSITION: { x: -2, y: -4.5, z: 0.5 },
                WIDTH: 3.5,
                HEIGHT: 2.5
            }
        }
    },
    
    // Cannon Configuration - At BOTTOM, shooting UPWARD
    CANNON: {
        POSITION: { x: 5.5, y: -8, z: 0 }, // Bottom-right position (like real Pachinko)
        POWER: {
            MIN: 0,
            MAX: 100,
            CHARGE_TIME: 2.0, // seconds to full charge
            MULTIPLIER: 1.0 // Power multiplier for testing (user adjustable, unlimited)
        },
        ROTATION: {
            MIN: -45 * (Math.PI / 180),
            MAX: 45 * (Math.PI / 180)
        },
        ELEVATION: {
            MIN: -30 * (Math.PI / 180),
            MAX: 30 * (Math.PI / 180)
        },
        COOLDOWN: {
            DEFAULT: 1.0,
            RAPID_FIRE: 0.4
        },
        LAUNCH_VELOCITY_SCALE: 0.35 // Slightly higher for upward launch
    },
    
    // Flipper Configuration
    FLIPPERS: {
        LEFT: {
            POSITION: { x: -3, y: -7, z: 0 },
            PIVOT_OFFSET: -60
        },
        RIGHT: {
            POSITION: { x: 3, y: -7, z: 0 },
            PIVOT_OFFSET: 60
        },
        LENGTH: 2.5,
        WIDTH: 0.4,
        HEIGHT: 0.15,
        ANGULAR_LIMIT: 75 * (Math.PI / 180),
        RESTING_ANGLE: -35 * (Math.PI / 180),
        ACTIVE_ANGLE: 35 * (Math.PI / 180),
        MOTOR_TORQUE: 50,
        ACTIVATION_TIME: 0.12,
        DEACTIVATION_TIME: 0.10,
        FRICTION: 0.7,
        SWING_RESTITUTION_BOOST: 0.15,
        SLINGSHOT_IMPULSE: 5
    },
    
    // Jackpot Machine
    JACKPOT: {
        THRESHOLD: 10, // Balls needed to activate
        CHUTE_CAPACITY: 15,
        AUTO_SPIN_DELAY: 3.0,
        SPIN_DURATION: 2.0,
        LOCKOUT_DURATION: 2.5,
        
        SYMBOLS: ['1x', '2x', '3x', '4x', '5x', 'BONUS', 'FREE', 'WILD', 'JACKPOT', 'SPECIAL'],
        SYMBOL_WEIGHTS: [15, 15, 12, 10, 8, 10, 10, 8, 7, 5], // Higher = more common
        
        PAYOUTS: {
            TRIPLE_MULTIPLIER_FREE_BALLS: 15,
            TRIPLE_BONUS_FREE_BALLS: 50,
            TRIPLE_BONUS_POINTS: 10000,
            TRIPLE_FREE_BALL_FREE_BALLS: 20,
            TRIPLE_FREE_BALL_POINTS: 5000,
            TRIPLE_JACKPOT_FREE_BALLS: 100,
            TRIPLE_JACKPOT_POINTS: 50000,
            TWO_JACKPOT_FREE_BALLS: 30,
            TWO_JACKPOT_POINTS: 20000,
            CONSOLATION_POINTS: 5000,
            CONSOLATION_FREE_BALLS: 3
        }
    },
    
    // Scoring
    SCORING: {
        PEG_CONTACT: 50,
        BUMPER_HIT: 500,
        RAMP_COMPLETION: 1000,
        TARGET_STANDARD: 100,
        TARGET_BONUS: 500,
        JACKPOT_ENTRY: 2000,
        JACKPOT_WIN_BASE: 5000,
        ALL_TARGETS_BONUS: 10000,
        
        COMBO_TIMEOUT: 1.5, // seconds
        
        ACHIEVEMENTS: {
            FIRST_BUMPER: 100,
            FIRST_RAMP: 500,
            CONSECUTIVE_BUMPERS: 1000
        }
    },
    
    // Ball Economy
    BALLS: {
        STARTING_COUNT: 2000,
        MAX_ACTIVE: 15,
        RAPID_FIRE_UNLOCK_BALLS: 10,
        WARNING_THRESHOLD: 50
    },
    
    // Rendering
    RENDERING: {
        SHADOW_MAP_SIZE: 2048,
        SHADOW_MAP_SIZE_LOW: 1024,
        ADAPTIVE_QUALITY: true,
        FPS_THRESHOLD_MEDIUM: 55,
        FPS_THRESHOLD_LOW: 50,
        FPS_THRESHOLD_CRITICAL: 45,
        BLOOM_ENABLED: true,
        BLOOM_THRESHOLD: 0.5,
        BLOOM_BLUR_RADIUS: 8,
        BLOOM_STRENGTH: 0.3
    },
    
    // Camera
    CAMERA: {
        FOV: 60,
        NEAR: 0.1,
        FAR: 100,
        POSITION: { x: 0, y: 5, z: 20 },
        LOOK_AT: { x: 0, y: 0, z: 0 }
    },
    
    // Lighting
    LIGHTING: {
        DIRECTIONAL: {
            POSITION: { x: -8, y: 20, z: 12 },
            INTENSITY: 1.5,
            COLOR: 0xFFF2D9 // Warm white
        },
        FILL: {
            POSITION: { x: 10, y: 8, z: -8 },
            INTENSITY: 0.5,
            COLOR: 0xCCE6FF // Cool blue
        },
        AMBIENT: {
            INTENSITY: 0.25,
            COLOR: 0x4D4D59 // Dark blue-tint
        }
    },
    
    // Materials (PBR properties)
    MATERIALS: {
        PEG: { metalness: 0.3, roughness: 0.4, color: 0x888888 },
        BUMPER: { metalness: 0.8, roughness: 0.2, color: 0xff4400, emissive: 0x000000 },
        BUMPER_HIT: { emissive: 0xff3333 },
        RAMP: { metalness: 0.2, roughness: 0.6, color: 0x444488 },
        WALL: { metalness: 0.1, roughness: 0.8, color: 0x2a2a3a },
        BALL: { metalness: 0.8, roughness: 0.15, color: 0xcccccc },
        FLIPPER: { metalness: 0.6, roughness: 0.3, color: 0x22cc66 },
        CANNON: { metalness: 0.7, roughness: 0.3, color: 0x666666 },
        FUNNEL: { metalness: 0.5, roughness: 0.3, color: 0xffcc00, transparent: true, opacity: 0.3 },
        JACKPOT_MACHINE: { metalness: 0.9, roughness: 0.2, color: 0xcccccc }
    },
    
    // Input
    INPUT: {
        POLLING_RATE: 60,
        BUFFER_SIZE: 5,
        TOUCH_DEADZONE: 10
    }
};

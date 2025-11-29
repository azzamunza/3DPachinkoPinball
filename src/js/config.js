/**
 * Game Configuration Constants
 * Based on specification from 3DHybridPachinkoPinball-Prompt.md
 * Updated to match reference image: Gemini_Generated_Image_tyo0gwtyo0gwtyo0.png
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
            RADIUS: 0.08, // Smaller pachinko-style balls
            MASS: 0.25,
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
    
    // Playfield Dimensions (scaled units) - More square-ish like reference image
    PLAYFIELD: {
        WIDTH: 14,  // Wider for Pachinko style
        HEIGHT: 16, // Slightly shorter ratio
        DEPTH: 1.5, // Contained depth for 3D space
        
        // Peg Configuration - Dense Pachinko Style (silver pins)
        PEGS: {
            COUNT: 180, // Much denser for authentic Pachinko
            RADIUS: 0.06, // Smaller silver pins
            HEIGHT: 0.35,
            RESTITUTION: 0.88,
            ROWS: 20,
            HORIZONTAL_SPACING: 0.6, // Tighter horizontal spacing
            VERTICAL_SPACING: 0.7,   // Tighter vertical spacing
            STAGGER_OFFSET: 0.3
        },
        
        // Pop-Bumpers - Round illuminated targets
        BUMPERS: {
            COUNT: 4,
            RADIUS: 0.45,
            IMPULSE: 25,
            COOLDOWN: 0.15,
            RESTITUTION: 0.95
        },
        
        // Geometric Illuminated Targets (Pinball-style)
        TARGETS: {
            STANDARD_POINTS: 100,
            BONUS_POINTS: 500,
            COMPLETION_BONUS: 5000,
            FREE_BALLS_ON_COMPLETE: 5
        },
        
        // Ball Entry Hole at Top Center
        BALL_ENTRY: {
            POSITION: { x: 0, y: 7.5, z: 0 },
            RADIUS: 0.3
        },
        
        // Ball Rails (gold-colored guide rails like reference)
        RAILS: {
            LEFT_OUTER: { startX: -6.5, startY: 6, endX: -4, endY: -2 },
            RIGHT_OUTER: { startX: 6.5, startY: 6, endX: 4, endY: -2 },
            CENTER_FUNNEL_LEFT: { startX: -3, startY: 1, endX: -1.5, endY: -1 },
            CENTER_FUNNEL_RIGHT: { startX: 3, startY: 1, endX: 1.5, endY: -1 }
        },
        
        // Ramps configuration
        RAMPS: {
            LEFT: {
                POSITION: { x: -5, y: 2, z: 0 },
                FRICTION: 0.3
            },
            RIGHT: {
                POSITION: { x: 5, y: 2, z: 0 },
                FRICTION: 0.3
            }
        },
        
        // Jackpot Funnel - Leads to slot machine
        FUNNEL: {
            TOP_RADIUS: 1.8,
            BOTTOM_RADIUS: 0.6,
            HEIGHT: 1.5,
            FRICTION: 0.3
        },
        
        // Payout/Catchment Areas at Bottom
        CATCHERS: {
            COUNT: 5,
            WIDTH: 2.2,
            POSITIONS: [
                { x: -5.5, y: -7.5, points: 50 },
                { x: -2.75, y: -7.5, points: 100 },
                { x: 0, y: -7.5, points: 500, isJackpot: true },
                { x: 2.75, y: -7.5, points: 100 },
                { x: 5.5, y: -7.5, points: 50 }
            ]
        },
        
        // Drains (only center now, no side drains for Pachinko style)
        DRAINS: {
            LEFT: { x: -6.5, y: -7.5 },
            RIGHT: { x: 6.5, y: -7.5 },
            CENTER: { x: 0, y: -8 }
        },
        
        // Authentic Pachinko Features (based on reference image)
        PACHINKO: {
            // Start Pocket - Ball entry point at top center (circular hole)
            START_POCKET: {
                POSITION: { x: 0, y: 7.5, z: 0 },
                WIDTH: 0.8,
                POINTS: 0
            },
            // V-Pockets - Catchment areas that trigger slot machine
            V_POCKETS: [
                { x: -3, y: -2, points: 500, freeBalls: 3, label: 'V-POCKET', triggersSlot: true },
                { x: 0, y: -1.5, points: 1000, freeBalls: 5, label: 'JACKPOT', triggersSlot: true },
                { x: 3, y: -2, points: 500, freeBalls: 3, label: 'V-POCKET', triggersSlot: true }
            ],
            // Tulip Gates - Opening/Closing mechanical gates
            TULIP_GATES: [
                { x: -4, y: 2, openTime: 2.0, closeTime: 3.0 },
                { x: 4, y: 2, openTime: 2.0, closeTime: 3.0 }
            ],
            // Feature Zones - Trigger special events
            FEATURE_ZONES: [
                { x: -5.5, y: 3, type: 'MULTIPLIER', value: 2 },
                { x: 5.5, y: 3, type: 'MULTIPLIER', value: 2 }
            ],
            // Fever Mode
            FEVER_MODE: {
                DURATION: 15,
                MULTIPLIER: 5,
                BALL_BONUS: 10
            },
            // Slot Machine Area - CENTERED in the playfield (per reference image)
            SLOT_MACHINE_AREA: {
                POSITION: { x: 0, y: 0, z: 0.5 },
                WIDTH: 4,
                HEIGHT: 3
            }
        }
    },
    
    // Cannon Configuration - CENTERED below flippers (Requirement B.1)
    CANNON: {
        POSITION: { x: 0, y: -7, z: 0.5 }, // Centered below flippers
        POWER: {
            MIN: 0,
            MAX: 100,
            CHARGE_TIME: 2.0,
            MULTIPLIER: 2.0, // Default power set to 2.0 (Requirement #3)
            DEFAULT: 2.0  // Default power value
        },
        ROTATION: {
            MIN: -60 * (Math.PI / 180), // Wider rotation range
            MAX: 60 * (Math.PI / 180)
        },
        ELEVATION: {
            MIN: 0 * (Math.PI / 180),   // Only shoots upward
            MAX: 45 * (Math.PI / 180)
        },
        COOLDOWN: {
            DEFAULT: 0.8,
            RAPID_FIRE: 0.3
        },
        LAUNCH_VELOCITY_SCALE: 0.4,
        // Target dot for aiming (Requirement B.2)
        TARGET_DOT: {
            RADIUS: 0.15,
            COLOR: 0xff0000 // Red
        }
    },
    
    // Flipper Configuration - positioned symmetrically
    FLIPPERS: {
        LEFT: {
            POSITION: { x: -2.5, y: -6, z: 0 },
            PIVOT_OFFSET: -60
        },
        RIGHT: {
            POSITION: { x: 2.5, y: -6, z: 0 },
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

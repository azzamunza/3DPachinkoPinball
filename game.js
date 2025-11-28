// Module aliases for Matter.js
const { Engine, Render, World, Bodies, Body, Events, Constraint, Runner } = Matter;

// --- GLOBAL CONFIGURATION ---
const CANVAS_WIDTH = 1000;  // Wider game area
const CANVAS_HEIGHT = 900;
const BALL_RADIUS = 8;
const BALL_POOL_SIZE = 50;
const JACKPOT_THRESHOLD = 10;
const GRAVITY_SCALE = 1;

// Jackpot Machine positioning constants
const JACKPOT_MACHINE_X = 200;
const JACKPOT_MACHINE_Y = 480;
const JACKPOT_MACHINE_WIDTH = 150;
const JACKPOT_MACHINE_HEIGHT = 180;
const JACKPOT_ZONE_LEFT = 110;
const JACKPOT_ZONE_RIGHT = 290;
const JACKPOT_ZONE_BOTTOM = 580;

// --- GAME STATE ---
let engine, world, render;
let ballPool = [];
let activeBalls = 0;
let score = 0;
let ballsInHopper = 10;
let ballsToJackpot = 0;

// Mouse tracking for mortar aiming
let mouseX = CANVAS_WIDTH / 2;
let mouseY = CANVAS_HEIGHT / 2;

// LED lights array for illumination
let ledLights = [];
let ledAnimationInterval = null; // Store interval ID for cleanup

// Spinning wheels for mini-games
let spinningWheels = [];

// JACKPOT STATE MACHINE
const JACKPOT_STATE = {
    IDLE: 'IDLE',
    COLLECTING: 'COLLECTING',
    JACKPOT_MODE: 'JACKPOT_MODE',
    PAYOUT: 'PAYOUT'
};
let currentJackpotState = JACKPOT_STATE.IDLE;
let flipperA, flipperB, flipperC, flipperL, flipperR;
let flipperLAxis, flipperRAxis;
let leftFlipperPressed = false;
let rightFlipperPressed = false;

// DOM Elements
let scoreValueEl, statusEl, ballCountEl, fireButton, jackpotPullButton, jackpotOverlay, gameCanvas;

// --- PHYSICS INITIALIZATION ---
function initPhysics() {
    engine = Engine.create({
        gravity: { scale: GRAVITY_SCALE }
    });
    world = engine.world;
    engine.gravity.y = 1;

    // Custom Renderer (Better than Matter.Render.run)
    gameCanvas = document.getElementById('game-canvas');
    render = Render.create({
        canvas: gameCanvas,
        engine: engine,
        options: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            wireframes: false,
            background: '#010409'
        }
    });
    Render.run(render);

    // Runner (to update the engine)
    const runner = Runner.create();
    Runner.run(runner, engine);

    createPlayfield();
    createBallPool();
    createLEDLights();
    createSpinningWheels();
    createBonusCatchers();
    
    // Update spinning wheels on each engine tick
    Events.on(engine, 'beforeUpdate', updateSpinningWheels);
    
    // --- COLLISION LOGIC AND OBJECTIVES ---
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            const ball = (bodyA.label === 'Ball') ? bodyA : (bodyB.label === 'Ball') ? bodyB : null;
            const other = ball === bodyA ? bodyB : bodyA;

            if (ball) {
                // 1. DRAIN (Ball lost)
                if (other.label === 'Drain') {
                    returnBallToHopper(ball);
                    return;
                }

                // 2. BUMPER (Score objective)
                if (other.label === 'Bumper') {
                    score += 100;
                    // Flash the bumper color on hit
                    other.render.fillStyle = '#fef08a';
                    setTimeout(() => other.render.fillStyle = '#f97316', 50);
                    flashNearbyLEDs(other.position.x, other.position.y);
                    updateUI();
                }

                // 3. JACKPOT INTAKE
                if (other.label === 'JackpotIntake' && currentJackpotState === JACKPOT_STATE.IDLE) {
                    ballsToJackpot++;
                    returnBallToHopper(ball); // Ball is consumed by the jackpot module
                    checkJackpotTrigger();
                }
                
                // 4. BONUS CATCHER
                if (other.label === 'BonusCatcher') {
                    score += 250;
                    other.render.fillStyle = '#00ff00';
                    setTimeout(() => other.render.fillStyle = '#22c55e', 100);
                    flashNearbyLEDs(other.position.x, other.position.y);
                    updateUI();
                }
                
                // 5. SPINNING WHEEL interaction
                if (other.label === 'SpinningWheel') {
                    score += 50;
                    flashNearbyLEDs(other.position.x, other.position.y);
                    updateUI();
                }
            }
        });
    });
}

// --- PLAYFIELD CONSTRUCTION ---
function createPlayfield() {
    const centerX = CANVAS_WIDTH / 2;
    
    // Create semi-circular top boundary with colliders
    const semiCirclePins = [];
    const semiCircleRadius = CANVAS_WIDTH / 2 - 20;
    const semiCircleCenterY = semiCircleRadius + 10;
    const numArcSegments = 40;
    
    // Create arc boundary using small static bodies
    for (let i = 0; i <= numArcSegments; i++) {
        const angle = Math.PI + (Math.PI * i / numArcSegments);
        const x = centerX + Math.cos(angle) * semiCircleRadius;
        const y = semiCircleCenterY + Math.sin(angle) * semiCircleRadius;
        
        const arcSegment = Bodies.circle(x, y, 8, {
            isStatic: true,
            render: { fillStyle: '#6366f1' },
            restitution: 0.8
        });
        semiCirclePins.push(arcSegment);
    }
    World.add(world, semiCirclePins);
    
    // Boundaries - including BACK surface for collision
    const boundaries = [
        // Bottom Drain (always active)
        Bodies.rectangle(centerX, CANVAS_HEIGHT + 30, CANVAS_WIDTH, 60, { 
            isStatic: true, 
            label: 'Drain', 
            render: { fillStyle: '#b91c1c' } 
        }),
        // Left Wall
        Bodies.rectangle(20, CANVAS_HEIGHT / 2 + semiCircleRadius/2, 20, CANVAS_HEIGHT - semiCircleRadius, { 
            isStatic: true, 
            render: { fillStyle: '#374151' } 
        }),
        // Right Wall
        Bodies.rectangle(CANVAS_WIDTH - 20, CANVAS_HEIGHT / 2 + semiCircleRadius/2, 20, CANVAS_HEIGHT - semiCircleRadius, { 
            isStatic: true, 
            render: { fillStyle: '#374151' } 
        }),
        // BACK surface (invisible but provides collision)
        Bodies.rectangle(centerX, CANVAS_HEIGHT / 2, CANVAS_WIDTH - 60, CANVAS_HEIGHT, { 
            isStatic: true, 
            isSensor: false,
            collisionFilter: { 
                category: 0x0001,
                mask: 0xFFFFFFFF
            },
            render: { 
                fillStyle: 'transparent',
                visible: false
            }
        }),
    ];
    World.add(world, boundaries);

    // Create Jackpot Machine area (left side based on reference image)
    createJackpotMachine();

    // Create curved funnel pins leading to Jackpot Machine
    createJackpotFunnel();

    // Create pachinko-style pin layout (based on hqdefault.jpg reference)
    createPachinkoGridPins();

    // Create bumpers in strategic positions
    const bumpers = [
        // Upper bumpers arranged in triangle
        Bodies.circle(centerX, 200, 20, { 
            isStatic: true, 
            label: 'Bumper', 
            restitution: 1.5, 
            render: { fillStyle: '#f97316' } 
        }),
        Bodies.circle(centerX - 80, 280, 20, { 
            isStatic: true, 
            label: 'Bumper', 
            restitution: 1.5, 
            render: { fillStyle: '#f97316' } 
        }),
        Bodies.circle(centerX + 80, 280, 20, { 
            isStatic: true, 
            label: 'Bumper', 
            restitution: 1.5, 
            render: { fillStyle: '#f97316' } 
        }),
        // Side bumpers
        Bodies.circle(150, 400, 18, { 
            isStatic: true, 
            label: 'Bumper', 
            restitution: 1.5, 
            render: { fillStyle: '#ec4899' } 
        }),
        Bodies.circle(CANVAS_WIDTH - 150, 400, 18, { 
            isStatic: true, 
            label: 'Bumper', 
            restitution: 1.5, 
            render: { fillStyle: '#ec4899' } 
        }),
    ];
    World.add(world, bumpers);

    // Bottom Tier - Flippers and Drain
    createFlippers();
}

// Create Jackpot Machine visual area
function createJackpotMachine() {
    const machineX = JACKPOT_MACHINE_X;
    const machineY = JACKPOT_MACHINE_Y;
    const machineWidth = JACKPOT_MACHINE_WIDTH;
    const machineHeight = JACKPOT_MACHINE_HEIGHT;
    
    // Machine frame (visual only - hollow for ball entry)
    const machineFrame = [
        // Left side
        Bodies.rectangle(machineX - machineWidth/2, machineY, 10, machineHeight, {
            isStatic: true,
            render: { fillStyle: '#8b5cf6' }
        }),
        // Right side
        Bodies.rectangle(machineX + machineWidth/2, machineY, 10, machineHeight, {
            isStatic: true,
            render: { fillStyle: '#8b5cf6' }
        }),
        // Bottom
        Bodies.rectangle(machineX, machineY + machineHeight/2, machineWidth, 10, {
            isStatic: true,
            render: { fillStyle: '#8b5cf6' }
        }),
    ];
    World.add(world, machineFrame);
    
    // Jackpot intake sensor at top of machine (coin slot)
    const jackpotIntake = Bodies.rectangle(machineX, machineY - machineHeight/2 + 10, machineWidth - 30, 15, { 
        isStatic: true, 
        isSensor: true, 
        label: 'JackpotIntake', 
        render: { fillStyle: '#facc15' } 
    });
    World.add(world, jackpotIntake);
    
    // Inner decorative elements
    const innerDecor = [
        Bodies.circle(machineX - 30, machineY - 20, 15, {
            isStatic: true,
            render: { fillStyle: '#f97316' }
        }),
        Bodies.circle(machineX + 30, machineY - 20, 15, {
            isStatic: true,
            render: { fillStyle: '#f97316' }
        }),
        Bodies.circle(machineX, machineY + 30, 20, {
            isStatic: true,
            render: { fillStyle: '#fbbf24' }
        }),
    ];
    World.add(world, innerDecor);
}

// Create curved funnel pins leading balls to Jackpot Machine
function createJackpotFunnel() {
    const machineX = JACKPOT_MACHINE_X;
    const machineY = JACKPOT_MACHINE_Y - 90; // Just above the machine
    const funnelPins = [];
    
    // Create curved funnel shape with pins
    // Left curve of funnel
    for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 0.3 + (Math.PI * 0.4 * i / 7);
        const radius = 80 + i * 5;
        const x = machineX - 50 + Math.cos(angle) * radius;
        const y = machineY - 60 + Math.sin(angle) * radius;
        
        const pin = Bodies.circle(x, y, 4, {
            isStatic: true,
            restitution: 0.8,
            render: { fillStyle: '#a78bfa' }
        });
        funnelPins.push(pin);
    }
    
    // Right curve of funnel
    for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 0.7 - (Math.PI * 0.4 * i / 7);
        const radius = 80 + i * 5;
        const x = machineX + 50 + Math.cos(angle) * radius;
        const y = machineY - 60 + Math.sin(angle) * radius;
        
        const pin = Bodies.circle(x, y, 4, {
            isStatic: true,
            restitution: 0.8,
            render: { fillStyle: '#a78bfa' }
        });
        funnelPins.push(pin);
    }
    
    // Inner guide pins
    for (let i = 0; i < 5; i++) {
        const x = machineX - 30 + i * 15;
        const y = machineY - 20;
        const pin = Bodies.circle(x, y, 3, {
            isStatic: true,
            restitution: 0.8,
            render: { fillStyle: '#c4b5fd' }
        });
        funnelPins.push(pin);
    }
    
    World.add(world, funnelPins);
}

// Create proper pachinko-style pin grid (based on reference image)
function createPachinkoGridPins() {
    const pins = [];
    const centerX = CANVAS_WIDTH / 2;
    
    // Main pin field - curved rows following semi-circle shape
    // Upper section with radial layout
    for (let ring = 0; ring < 6; ring++) {
        const ringRadius = 150 + ring * 45;
        const ringY = 180 + ring * 40;
        const numPinsInRing = 8 + ring * 2;
        
        for (let i = 0; i < numPinsInRing; i++) {
            // Skip pins in jackpot machine area
            const angle = Math.PI + (Math.PI * (i + 0.5) / numPinsInRing);
            const x = centerX + Math.cos(angle) * ringRadius * 0.7;
            const y = ringY;
            
            // Skip if in jackpot machine zone (using constants with margin)
            const jackpotZoneMargin = 20;
            if (x < (JACKPOT_ZONE_LEFT + jackpotZoneMargin) || x > (JACKPOT_ZONE_RIGHT - jackpotZoneMargin) || y > (JACKPOT_MACHINE_Y - 100)) {
                if (x > 40 && x < CANVAS_WIDTH - 40) {
                    const pin = Bodies.circle(x, y, 4, {
                        isStatic: true,
                        restitution: 0.8,
                        render: { fillStyle: '#6b7280' }
                    });
                    pins.push(pin);
                }
            }
        }
    }
    
    // Lower section - traditional staggered grid
    const startY = 450;
    const endY = 700;
    const pinRows = 8;
    const spacingY = (endY - startY) / pinRows;
    
    for (let row = 0; row < pinRows; row++) {
        const y = startY + row * spacingY;
        const pinsInRow = 12 + Math.floor(row / 2);
        const startX = 80;
        const endX = CANVAS_WIDTH - 80;
        const spacingX = (endX - startX) / (pinsInRow - 1);
        const offsetX = (row % 2 === 0) ? 0 : spacingX / 2;
        
        for (let col = 0; col < pinsInRow; col++) {
            const x = startX + col * spacingX + offsetX;
            
            // Skip jackpot machine area using constants
            if (!(x > JACKPOT_ZONE_LEFT && x < JACKPOT_ZONE_RIGHT && y < JACKPOT_ZONE_BOTTOM)) {
                const pin = Bodies.circle(x, y, 4, {
                    isStatic: true,
                    restitution: 0.8,
                    render: { fillStyle: '#4b5563' }
                });
                pins.push(pin);
            }
        }
    }
    
    // V-shaped guide rails
    const guideRails = [
        Bodies.rectangle(centerX + 200, 500, 150, 8, {
            isStatic: true,
            angle: Math.PI / 5,
            restitution: 0.9,
            render: { fillStyle: '#3b82f6' }
        }),
        Bodies.rectangle(centerX + 300, 500, 150, 8, {
            isStatic: true,
            angle: -Math.PI / 5,
            restitution: 0.9,
            render: { fillStyle: '#3b82f6' }
        }),
    ];
    
    World.add(world, pins);
    World.add(world, guideRails);
}

// Create flippers at bottom
function createFlippers() {
    const flipperOptions = {
        isStatic: true,
        friction: 0.001,
        restitution: 0.8,
        render: { fillStyle: '#10b981' }
    };

    const centerX = CANVAS_WIDTH / 2;
    const flipperY = CANVAS_HEIGHT - 100;

    // Left Flipper
    flipperL = Bodies.trapezoid(centerX - 120, flipperY, 130, 22, 0.5, flipperOptions);
    flipperLAxis = Bodies.circle(centerX - 185, flipperY, 5, { 
        isStatic: true, 
        label: 'FlipperPivot',
        render: { fillStyle: '#059669' }
    });
    const flipperLConstraint = Constraint.create({
        bodyA: flipperL,
        pointA: { x: -65, y: 0 },
        bodyB: flipperLAxis,
        stiffness: 0.9,
        length: 0
    });

    // Right Flipper
    flipperR = Bodies.trapezoid(centerX + 120, flipperY, 130, 22, 0.5, { ...flipperOptions, angle: Math.PI });
    flipperRAxis = Bodies.circle(centerX + 185, flipperY, 5, { 
        isStatic: true, 
        label: 'FlipperPivot',
        render: { fillStyle: '#059669' }
    });
    const flipperRConstraint = Constraint.create({
        bodyA: flipperR,
        pointA: { x: 65, y: 0 },
        bodyB: flipperRAxis,
        stiffness: 0.9,
        length: 0
    });

    // Flipper guards
    const guards = [
        Bodies.rectangle(centerX - 250, flipperY + 30, 80, 15, {
            isStatic: true,
            angle: Math.PI / 4,
            render: { fillStyle: '#374151' }
        }),
        Bodies.rectangle(centerX + 250, flipperY + 30, 80, 15, {
            isStatic: true,
            angle: -Math.PI / 4,
            render: { fillStyle: '#374151' }
        }),
    ];

    World.add(world, [flipperL, flipperLAxis, flipperLConstraint, flipperR, flipperRAxis, flipperRConstraint, ...guards]);
}

// Create LED lights for illumination
function createLEDLights() {
    ledLights = [];
    const positions = [
        // Top arc lights
        { x: 200, y: 100 }, { x: 400, y: 80 }, { x: 600, y: 80 }, { x: 800, y: 100 },
        // Middle section
        { x: 100, y: 300 }, { x: 300, y: 350 }, { x: 500, y: 300 }, { x: 700, y: 350 }, { x: 900, y: 300 },
        // Lower section
        { x: 150, y: 550 }, { x: 350, y: 600 }, { x: 500, y: 550 }, { x: 650, y: 600 }, { x: 850, y: 550 },
        // Near jackpot machine
        { x: 200, y: 380 }, { x: 200, y: 580 },
    ];
    
    positions.forEach((pos, index) => {
        const light = {
            x: pos.x,
            y: pos.y,
            radius: 25,
            intensity: 0,
            maxIntensity: 1,
            color: index % 3 === 0 ? '#ff0066' : index % 3 === 1 ? '#00ff66' : '#6600ff',
            body: Bodies.circle(pos.x, pos.y, 5, {
                isStatic: true,
                isSensor: true,
                render: { 
                    fillStyle: '#333',
                    opacity: 0.5
                }
            })
        };
        ledLights.push(light);
        World.add(world, light.body);
    });
    
    // Start ambient LED animation
    animateLEDs();
}

// Animate LED lights
function animateLEDs() {
    // Clear any existing animation interval
    if (ledAnimationInterval) {
        clearInterval(ledAnimationInterval);
    }
    
    ledAnimationInterval = setInterval(() => {
        ledLights.forEach((light, index) => {
            // Random ambient flicker
            if (Math.random() < 0.1) {
                light.intensity = 0.3 + Math.random() * 0.3;
                light.body.render.fillStyle = light.color;
                
                // Create glow effect by updating body render
                setTimeout(() => {
                    if (light.intensity > 0) {
                        light.intensity *= 0.8;
                        light.body.render.fillStyle = adjustColorBrightness(light.color, light.intensity);
                    }
                }, 100);
            }
        });
    }, 100);
}

// Flash LEDs near a point
function flashNearbyLEDs(x, y) {
    ledLights.forEach(light => {
        const dist = Math.sqrt(Math.pow(light.x - x, 2) + Math.pow(light.y - y, 2));
        if (dist < 150) {
            light.intensity = 1;
            light.body.render.fillStyle = light.color;
            
            // Decay
            const decay = setInterval(() => {
                light.intensity *= 0.85;
                if (light.intensity < 0.1) {
                    light.intensity = 0;
                    light.body.render.fillStyle = '#333';
                    clearInterval(decay);
                } else {
                    light.body.render.fillStyle = adjustColorBrightness(light.color, light.intensity);
                }
            }, 50);
        }
    });
}

// Adjust color brightness
function adjustColorBrightness(hexColor, brightness) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    const nr = Math.floor(r * brightness);
    const ng = Math.floor(g * brightness);
    const nb = Math.floor(b * brightness);
    
    return `rgb(${nr}, ${ng}, ${nb})`;
}

// Create spinning wheels (pachinko mini-game element)
function createSpinningWheels() {
    spinningWheels = [];
    
    const wheelPositions = [
        { x: 700, y: 350, radius: 35, speed: 0.02 },
        { x: 850, y: 450, radius: 30, speed: -0.025 },
        { x: 750, y: 550, radius: 32, speed: 0.018 },
    ];
    
    wheelPositions.forEach(wheel => {
        // Create wheel hub
        const hub = Bodies.circle(wheel.x, wheel.y, wheel.radius, {
            isStatic: true,
            label: 'SpinningWheel',
            restitution: 1.0,
            render: { fillStyle: '#14b8a6' }
        });
        
        // Create wheel spokes/paddles
        const spokes = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const spoke = Bodies.rectangle(
                wheel.x + Math.cos(angle) * (wheel.radius + 15),
                wheel.y + Math.sin(angle) * (wheel.radius + 15),
                30, 8,
                {
                    isStatic: true,
                    angle: angle,
                    restitution: 1.2,
                    render: { fillStyle: '#0d9488' }
                }
            );
            spokes.push(spoke);
        }
        
        spinningWheels.push({
            hub: hub,
            spokes: spokes,
            x: wheel.x,
            y: wheel.y,
            radius: wheel.radius,
            speed: wheel.speed,
            currentAngle: 0
        });
        
        World.add(world, [hub, ...spokes]);
    });
}

// Update spinning wheels animation
function updateSpinningWheels() {
    spinningWheels.forEach(wheel => {
        wheel.currentAngle += wheel.speed;
        
        wheel.spokes.forEach((spoke, i) => {
            const angle = wheel.currentAngle + (Math.PI * 2 * i) / 6;
            const x = wheel.x + Math.cos(angle) * (wheel.radius + 15);
            const y = wheel.y + Math.sin(angle) * (wheel.radius + 15);
            
            Body.setPosition(spoke, { x, y });
            Body.setAngle(spoke, angle);
        });
    });
}

// Create bonus catchers
function createBonusCatchers() {
    const catchers = [
        // Pocket catchers at various positions
        Bodies.rectangle(500, 750, 50, 15, {
            isStatic: true,
            label: 'BonusCatcher',
            render: { fillStyle: '#22c55e' }
        }),
        Bodies.rectangle(350, 720, 40, 15, {
            isStatic: true,
            label: 'BonusCatcher',
            render: { fillStyle: '#22c55e' }
        }),
        Bodies.rectangle(650, 720, 40, 15, {
            isStatic: true,
            label: 'BonusCatcher',
            render: { fillStyle: '#22c55e' }
        }),
    ];
    
    World.add(world, catchers);
}

// --- BALL MANAGEMENT (POOLING) ---
function createBallPool() {
    for (let i = 0; i < BALL_POOL_SIZE; i++) {
        const ball = Bodies.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 100, BALL_RADIUS, {
            restitution: 0.9,
            friction: 0.005,
            density: 0.04,
            label: 'Ball',
            isSleeping: true,
            render: { fillStyle: '#cbd5e1' }
        });
        ballPool.push(ball);
    }
    World.add(world, ballPool);
}

function getInactiveBall() {
    const ball = ballPool.find(b => b.isSleeping);
    if (ball) {
        Body.setSleeping(ball, false);
        activeBalls++;
        return ball;
    }
    return null;
}

function returnBallToHopper(ball) {
    Body.setSleeping(ball, true);
    Body.setPosition(ball, { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT + 100 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
    activeBalls--;
    ballsInHopper++;
    updateUI();
}

// --- MORTAR SYSTEM ---
let lastFireTime = 0;
const FIRE_COOLDOWN = 100; // 0.1 second cooldown (10 shots per second)

function fireMortar() {
    if (currentJackpotState === JACKPOT_STATE.JACKPOT_MODE) return;

    const now = performance.now();
    if (now - lastFireTime < FIRE_COOLDOWN) return;
    if (ballsInHopper <= 0) {
        console.log("Out of balls!");
        return;
    }

    const ball = getInactiveBall();
    if (!ball) return;

    ballsInHopper--;
    lastFireTime = now;

    // Use mouse position for targeting
    const startX = CANVAS_WIDTH / 2;
    const startY = CANVAS_HEIGHT - 50;
    
    // Calculate direction vector from mortar to mouse cursor
    const dx = mouseX - startX;
    const dy = mouseY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and scale for power
    const power = parseFloat(document.getElementById('mortar-power').value);
    const randomness = parseFloat(document.getElementById('audio-randomness').value) * 0.5;
    
    // Apply audio randomness offsets
    const randomPower = (Math.random() - 0.5) * randomness * 3;
    const randomAngle = (Math.random() - 0.5) * randomness * 0.2;
    
    const adjustedPower = Math.max(5, Math.min(15, power + randomPower));
    const forceMagnitude = adjustedPower * 0.004;
    
    // Calculate normalized direction with randomness
    let forceX = (dx / distance) * forceMagnitude;
    let forceY = (dy / distance) * forceMagnitude;
    
    // Apply random angle offset
    const cosR = Math.cos(randomAngle);
    const sinR = Math.sin(randomAngle);
    const newForceX = forceX * cosR - forceY * sinR;
    const newForceY = forceX * sinR + forceY * cosR;
    
    // Ensure we're always shooting upward (negative Y in screen coords)
    if (newForceY > -0.01) {
        forceY = -Math.abs(forceMagnitude);
        forceX = newForceX;
    } else {
        forceX = newForceX;
        forceY = newForceY;
    }

    // Set initial position at the bottom (Mortar zone)
    Body.setPosition(ball, { x: startX, y: startY });

    // Apply the launch impulse toward mouse cursor
    Body.applyForce(ball, ball.position, { x: forceX, y: forceY });

    // Update UI
    updateUI();
}

// --- FLIPPER CONTROL LOGIC ---
function activateFlippers(isLeft) {
    const flipper = isLeft ? flipperL : flipperR;
    const angle = isLeft ? -Math.PI / 4 : Math.PI / 4;
    Body.setAngle(flipper, angle);
}

function deactivateFlippers(isLeft) {
    const flipper = isLeft ? flipperL : flipperR;
    const angle = isLeft ? 0 : Math.PI;
    Body.setAngle(flipper, angle);
}

// --- JACKPOT STATE MACHINE ---
function checkJackpotTrigger() {
    statusEl.textContent = `Balls to Jackpot: ${JACKPOT_THRESHOLD - ballsToJackpot} / ${JACKPOT_THRESHOLD}`;
    if (ballsToJackpot >= JACKPOT_THRESHOLD && currentJackpotState === JACKPOT_STATE.IDLE) {
        enterJackpotMode();
    }
}

function enterJackpotMode() {
    currentJackpotState = JACKPOT_STATE.JACKPOT_MODE;
    jackpotOverlay.style.opacity = '1';
    jackpotOverlay.style.pointerEvents = 'auto';
    fireButton.disabled = true;
    jackpotPullButton.disabled = false;
    console.log("JACKPOT MODE ACTIVATED!");
}

function exitJackpotMode() {
    currentJackpotState = JACKPOT_STATE.IDLE;
    jackpotOverlay.style.opacity = '0';
    jackpotOverlay.style.pointerEvents = 'none';
    fireButton.disabled = false;
    ballsToJackpot = 0;
    updateUI();
    console.log("Jackpot mode ended.");
}

let reelSymbols = ['🍒', '🔔', '⭐', '7️⃣'];
let spinIntervals = [];

function pullSlotArm() {
    if (currentJackpotState !== JACKPOT_STATE.JACKPOT_MODE) return;

    jackpotPullButton.disabled = true;
    const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];
    const results = [];
    let stopDelay = 0;

    // Start spinning
    spinIntervals = reels.map((reel, index) => {
        return setInterval(() => {
            reel.textContent = reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
        }, 50);
    });

    // Stop reels sequentially
    reels.forEach((reel, index) => {
        stopDelay += (index === 0 ? 1000 : 500); // 1.0s, 1.5s, 2.0s total

        setTimeout(() => {
            clearInterval(spinIntervals[index]);
            const finalSymbol = reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
            reel.textContent = finalSymbol;
            results.push(finalSymbol);

            // Check win condition after the last reel stops
            if (index === reels.length - 1) {
                processJackpotResult(results);
            }
        }, stopDelay);
    });
}

function processJackpotResult(results) {
    const reelResultEl = document.getElementById('jackpot-result');
    const r1 = results[0], r2 = results[1], r3 = results[2];
    let payout = 0;

    if (r1 === r2 && r2 === r3 && r1 === '7️⃣') {
        payout = 50; // Grand Jackpot
        reelResultEl.textContent = "JACKPOT! 50 BALLS!";
        reelResultEl.className = "text-xl text-center mt-4 font-bold text-red-500";
    } else if (r1 === r2 && r2 === r3) {
        payout = 15; // Triple Match
        reelResultEl.textContent = `TRIPLE ${r1}! 15 BALLS!`;
        reelResultEl.className = "text-xl text-center mt-4 font-bold text-yellow-500";
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        payout = 5; // Double Match
        reelResultEl.textContent = "DOUBLE MATCH! 5 BALLS!";
        reelResultEl.className = "text-xl text-center mt-4 font-bold text-green-500";
    } else {
        payout = 0;
        reelResultEl.textContent = "NO LUCK. Try again!";
        reelResultEl.className = "text-xl text-center mt-4 font-semibold text-white";
    }

    setTimeout(() => {
        if (payout > 0) {
            currentJackpotState = JACKPOT_STATE.PAYOUT;
            payoutBalls(payout);
        } else {
            exitJackpotMode();
        }
    }, 2000); // Wait for result display
}

function payoutBalls(count) {
    let ballsFired = 0;
    const interval = setInterval(() => {
        if (ballsFired >= count || !ballPool.some(b => b.isSleeping)) {
            clearInterval(interval);
            setTimeout(exitJackpotMode, 1000); // Wait for balls to drop
            return;
        }

        const ball = getInactiveBall();
        if (ball) {
            Body.setPosition(ball, {
                x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 100,
                y: 50 // Payout from the top feeder
            });
            ballsFired++;
        }
    }, 50); // Rain down balls
}


// --- UI UPDATES & CONTROLS ---
function updateUI() {
    scoreValueEl.textContent = score.toLocaleString();
    statusEl.textContent = `Balls to Jackpot: ${JACKPOT_THRESHOLD - ballsToJackpot} / ${JACKPOT_THRESHOLD}`;
    ballCountEl.textContent = `Balls in Hopper: ${ballsInHopper}`;
}

function setupControls() {
    // Mortar Dial Slider Updates
    const dialControls = ['mortar-x', 'mortar-power', 'mortar-angle', 'audio-randomness'];
    dialControls.forEach(id => {
        const input = document.getElementById(id);
        const output = document.getElementById(id + '-val');
        if (input && output) {
            input.addEventListener('input', () => {
                output.textContent = id === 'mortar-angle' ? `${input.value}°` : input.value;
            });
        }
    });

    // Mouse tracking for mortar aiming
    gameCanvas.addEventListener('mousemove', (e) => {
        const rect = gameCanvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
        mouseY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    });

    // Prevent right-click context menu on canvas and document
    document.addEventListener('contextmenu', (e) => {
        if (e.target === gameCanvas) {
            e.preventDefault();
            return false;
        }
    });

    // Mouse button controls for flippers and cannon
    gameCanvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        
        if (e.button === 0) { // Left click - Left flipper
            leftFlipperPressed = true;
            if (currentJackpotState === JACKPOT_STATE.IDLE) {
                activateFlippers(true);
            }
        } else if (e.button === 2) { // Right click - Right flipper
            rightFlipperPressed = true;
            if (currentJackpotState === JACKPOT_STATE.IDLE) {
                activateFlippers(false);
            }
        } else if (e.button === 1) { // Middle click - Fire cannon
            e.preventDefault();
            if (!fireButton.disabled) {
                fireMortar();
            }
        }
    });

    gameCanvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) { // Left click release
            leftFlipperPressed = false;
            if (currentJackpotState === JACKPOT_STATE.IDLE) {
                deactivateFlippers(true);
            }
        } else if (e.button === 2) { // Right click release
            rightFlipperPressed = false;
            if (currentJackpotState === JACKPOT_STATE.IDLE) {
                deactivateFlippers(false);
            }
        }
    });
    
    // Prevent middle mouse button scroll behavior
    gameCanvas.addEventListener('auxclick', (e) => {
        if (e.button === 1) {
            e.preventDefault();
        }
    });

    // Fire Button Click/Spacebar
    fireButton.addEventListener('click', fireMortar);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !fireButton.disabled) {
            fireMortar();
            e.preventDefault(); // Prevent scrolling
        }
    });

    // Flipper Controls (Left Shift / Right Shift / Touch)
    document.addEventListener('keydown', (e) => {
        if (currentJackpotState !== JACKPOT_STATE.IDLE) return;
        // Use key codes for better reliability (e.location is 1 for left shift, 2 for right shift)
        if (e.key === 'Shift' && e.location === 1) { // Left Shift
            activateFlippers(true);
        } else if (e.key === 'Shift' && e.location === 2) { // Right Shift
            activateFlippers(false);
        }
    });
    document.addEventListener('keyup', (e) => {
        if (currentJackpotState !== JACKPOT_STATE.IDLE) return;
        if (e.key === 'Shift' && e.location === 1) {
            deactivateFlippers(true);
        } else if (e.key === 'Shift' && e.location === 2) {
            deactivateFlippers(false);
        }
    });

    // Jackpot Pull Arm
    jackpotPullButton.addEventListener('click', pullSlotArm);
    jackpotPullButton.disabled = true; // Disabled until Jackpot Mode
}

// --- START GAME ---
function initGame() {
    // Get DOM elements
    scoreValueEl = document.getElementById('score-value');
    statusEl = document.getElementById('jackpot-status');
    ballCountEl = document.getElementById('ball-count');
    fireButton = document.getElementById('fire-button');
    jackpotPullButton = document.getElementById('jackpot-pull');
    jackpotOverlay = document.getElementById('jackpot-overlay');
    gameCanvas = document.getElementById('game-canvas');
    
    initPhysics();
    setupControls();
    updateUI();
    
    // Initial message
    console.log("Game Loaded. Use mouse to aim, middle-click to fire. Left/Right click for flippers.");
    console.log("Controls: Mouse cursor = aim target, Middle click = fire cannon");
    console.log("Left click = left flipper, Right click = right flipper");
    console.log("Keyboard: Space = fire, Left Shift = left flipper, Right Shift = right flipper");
}

// Initialize when DOM is ready
window.onload = initGame;

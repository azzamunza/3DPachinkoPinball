// Module aliases for Matter.js
const { Engine, Render, World, Bodies, Body, Events, Constraint, Runner } = Matter;

// --- GLOBAL CONFIGURATION ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const BALL_RADIUS = 8;
const BALL_POOL_SIZE = 50;
const JACKPOT_THRESHOLD = 10;
const GRAVITY_SCALE = 1;

// --- GAME STATE ---
let engine, world, render;
let ballPool = [];
let activeBalls = 0;
let score = 0;
let ballsInHopper = 10;
let ballsToJackpot = 0;

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

// DOM Elements
let scoreValueEl, statusEl, ballCountEl, fireButton, jackpotPullButton, jackpotOverlay;

// --- PHYSICS INITIALIZATION ---
function initPhysics() {
    engine = Engine.create({
        gravity: { scale: GRAVITY_SCALE }
    });
    world = engine.world;
    engine.gravity.y = 1;

    // Custom Renderer (Better than Matter.Render.run)
    const canvas = document.getElementById('game-canvas');
    render = Render.create({
        canvas: canvas,
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
                    updateUI();
                }

                // 3. JACKPOT INTAKE
                if (other.label === 'JackpotIntake' && currentJackpotState === JACKPOT_STATE.IDLE) {
                    ballsToJackpot++;
                    returnBallToHopper(ball); // Ball is consumed by the jackpot module
                    checkJackpotTrigger();
                }
            }
        });
    });
}

// --- PLAYFIELD CONSTRUCTION ---
function createPlayfield() {
    // Boundaries
    const boundaries = [
        // Bottom Drain (always active)
        Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 30, CANVAS_WIDTH, 60, { isStatic: true, label: 'Drain', render: { fillStyle: '#b91c1c' } }),
        // Walls
        Bodies.rectangle(0, CANVAS_HEIGHT / 2, 5, CANVAS_HEIGHT, { isStatic: true, render: { fillStyle: '#374151' } }),
        Bodies.rectangle(CANVAS_WIDTH, CANVAS_HEIGHT / 2, 5, CANVAS_HEIGHT, { isStatic: true, render: { fillStyle: '#374151' } }),
        Bodies.rectangle(CANVAS_WIDTH / 2, 0, CANVAS_WIDTH, 5, { isStatic: true, render: { fillStyle: '#374151' } }),
    ];
    World.add(world, boundaries);

    // 1. Top Catching Area (Y: 0-200)
    const catchingArea = [
        // Central V-funnel
        Bodies.rectangle(CANVAS_WIDTH / 2 - 100, 150, 200, 10, { isStatic: true, angle: Math.PI / 6, restitution: 0.9, render: { fillStyle: '#3b82f6' } }),
        Bodies.rectangle(CANVAS_WIDTH / 2 + 100, 150, 200, 10, { isStatic: true, angle: -Math.PI / 6, restitution: 0.9, render: { fillStyle: '#3b82f6' } }),
        // Target Bumper 1
        Bodies.circle(CANVAS_WIDTH / 4, 100, 15, { isStatic: true, isSensor: true, label: 'Bumper', restitution: 1.5, render: { fillStyle: '#f97316' } }),
        // Target Bumper 2
        Bodies.circle(CANVAS_WIDTH * 3 / 4, 100, 15, { isStatic: true, isSensor: true, label: 'Bumper', restitution: 1.5, render: { fillStyle: '#f97316' } }),
    ];
    World.add(world, catchingArea);

    // 2. Upper-Mid Tier (Y: 200-400) - Pin Field
    // Create pins manually in a grid pattern
    const pins = [];
    const pinRows = 5;
    const pinCols = 10;
    const startX = 200;
    const startY = 250;
    const spacingX = 40;
    const spacingY = 30;
    
    for (let row = 0; row < pinRows; row++) {
        for (let col = 0; col < pinCols; col++) {
            // Offset every other row for pachinko-style layout
            const offsetX = (row % 2 === 0) ? 0 : spacingX / 2;
            const x = startX + col * spacingX + offsetX;
            const y = startY + row * spacingY;
            
            const pin = Bodies.circle(x, y, 4, { 
                isStatic: true, 
                restitution: 0.8, 
                render: { fillStyle: '#4b5563' } 
            });
            pins.push(pin);
        }
    }
    World.add(world, pins);

    // 3. Lower-Mid Tier (Y: 400-600)
    // Jackpot Intake Chute (Entry Gate)
    const jackpotGate = Bodies.rectangle(CANVAS_WIDTH / 2, 550, 100, 5, { 
        isStatic: true, 
        isSensor: true, 
        label: 'JackpotIntake', 
        render: { fillStyle: '#facc15' } 
    });
    World.add(world, jackpotGate);

    // 4. Bottom Tier (Y: 600-800) - Flippers and Drain
    const flipperOptions = {
        isStatic: true,
        friction: 0.001,
        restitution: 0.8,
        render: { fillStyle: '#10b981' }
    };

    // Left Flipper
    flipperL = Bodies.trapezoid(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 100, 120, 20, 0.5, flipperOptions);
    flipperLAxis = Bodies.circle(CANVAS_WIDTH / 2 - 160, CANVAS_HEIGHT - 100, 5, { isStatic: true, label: 'FlipperPivot' });
    const flipperLConstraint = Constraint.create({
        bodyA: flipperL,
        pointA: { x: -60, y: 0 },
        bodyB: flipperLAxis,
        stiffness: 0.9,
        length: 0
    });

    // Right Flipper
    flipperR = Bodies.trapezoid(CANVAS_WIDTH / 2 + 100, CANVAS_HEIGHT - 100, 120, 20, 0.5, { ...flipperOptions, angle: Math.PI });
    flipperRAxis = Bodies.circle(CANVAS_WIDTH / 2 + 160, CANVAS_HEIGHT - 100, 5, { isStatic: true, label: 'FlipperPivot' });
    const flipperRConstraint = Constraint.create({
        bodyA: flipperR,
        pointA: { x: 60, y: 0 },
        bodyB: flipperRAxis,
        stiffness: 0.9,
        length: 0
    });

    World.add(world, [flipperL, flipperLAxis, flipperLConstraint, flipperR, flipperRAxis, flipperRConstraint]);
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
const FIRE_COOLDOWN = 250; // 4 shots per second

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

    // Get Dial Inputs
    const xPos = parseFloat(document.getElementById('mortar-x').value);
    let power = parseFloat(document.getElementById('mortar-power').value);
    let angleDeg = parseFloat(document.getElementById('mortar-angle').value);

    // Get Audio Randomization Factor
    const randomness = parseFloat(document.getElementById('audio-randomness').value) * 0.5;

    // Apply Audio Randomness Offsets (capped to prevent missed shots)
    const randomX = (Math.random() - 0.5) * randomness * 5;
    const randomPower = (Math.random() - 0.5) * randomness * 3;
    const randomAngle = (Math.random() - 0.5) * randomness * 15;

    power += randomPower;
    angleDeg += randomAngle;

    // Ensure shot lands in top tier (cap parameters)
    power = Math.max(5, Math.min(15, power));
    angleDeg = Math.max(45, Math.min(135, angleDeg));

    const angleRad = angleDeg * (Math.PI / 180);

    // Calculate force vector
    const forceMagnitude = power * 0.005; // Scaling factor for Matter.js
    const forceX = forceMagnitude * Math.cos(angleRad);
    const forceY = forceMagnitude * Math.sin(angleRad);

    // Set initial position at the bottom (Mortar zone)
    Body.setPosition(ball, { x: xPos, y: CANVAS_HEIGHT - 50 });

    // Apply the launch impulse (Force is applied in the opposite direction of the angle)
    Body.applyForce(ball, ball.position, { x: -forceX, y: -forceY });

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
        input.addEventListener('input', () => {
            output.textContent = id === 'mortar-angle' ? `${input.value}°` : input.value;
        });
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
    
    initPhysics();
    setupControls();
    updateUI();
    // Initial message
    console.log("Game Loaded. Use the dial controls and 'FIRE' to launch balls.");
}

// Initialize when DOM is ready
window.onload = initGame;

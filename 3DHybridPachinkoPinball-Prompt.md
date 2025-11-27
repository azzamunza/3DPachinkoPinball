# Advanced Technical Prompt: 3D Hybrid Pachinko/Pinball Simulation (REVISED)

## 1. ROLE/PERSONA

Act as a Senior Software Engineer specialising in high-performance browser-based 3D game development with expertise in WebGPU architecture, real-time physics simulation, GPU-driven rendering optimization, and cross-platform mobile/desktop game implementation. Your expertise must focus on robust, production-grade code generation, technical accuracy, physics fidelity, and meeting strict performance constraints for contemporary GPU-accelerated environments.

---

## 2. TASK/GOAL (What)

Generate complete, fully functional source code for a high-performance, physics-based 3D simulation of a hybrid Pachinko/Pinball arcade machine with portrait orientation. The output must be:
- Ready for immediate browser testing and execution
- Optimised for Samsung Galaxy S24 Ultra and Windows 11 (NVIDIA RTX 2080 Ti)
- Fully functional across Chrome, Edge, Firefox, and Safari (latest versions)
- Capable of sustaining 60 FPS performance on specified target hardware
- Implement advanced physics simulation with 15+ concurrent balls
- Include an embedded 3D jackpot slot machine with ball capture system
- Integrate rapid-fire cannon capability unlocked via reward triggers

---

## 3. CONTEXT (Why & Background)

The objective is to create an advanced web-based arcade simulation demonstrating:
- Modern GPU-accelerated rendering (WebGPU architecture)
- Sophisticated real-time physics with accurate gravity, friction, and collision detection
- Complex state management (multi-phase jackpot system with ball persistence)
- Authentic Pachinko/Pinball hybrid gameplay with hybrid board layout (circular top, square bottom "upside-down U")
- Cross-platform compatibility (mobile portrait + desktop landscape support)
- Integration of proven arcade mechanics (pop-bumpers, ramps, targets, rails) with innovative Pachinko/Pinball fusion design

---

## 4. TARGET HARDWARE & BROWSER SPECIFICATIONS

### Primary Target Devices:
- **Mobile Primary:** Samsung Galaxy S24 Ultra (Snapdragon 8 Gen 3 Leading Version, Adreno GPU, 12GB+ RAM)
- **Desktop Primary:** Windows 11, NVIDIA RTX 2080 Ti (12GB VRAM), Intel i7/i9 9th gen+, 16GB+ RAM
- **Secondary (Verified Support):** Latest Chrome, Edge, Firefox, Safari (macOS/iOS)

### GPU API Selection: WebGPU (Primary) with WebGL 2.0 Fallback
**Rationale for WebGPU:**
- Explicit GPU control enables custom compute shaders for physics acceleration
- Superior draw-call batching (reduces CPU overhead by ~60% vs WebGL)
- Native support for WebAssembly (WASM) physics engines (Rapier3D compatibility)
- Better memory management for large datasets (15+ ball bodies)
- Supports modern GPU features (texture streaming, async compute)

**WebGPU Browser Support Status (2025):**
- Chrome 120+: Full support (stable)
- Edge 120+: Full support (stable)
- Firefox 130+: Under experimental flag ("dom.webgpu.enabled")
- Safari 17.2+: Experimental support (macOS 14.4+, iPad OS 17.4+)
- Android Chrome (S24 Ultra): Full support

**Fallback Strategy:**
- Detect WebGPU availability at startup
- If unavailable: Fall back to WebGL 2.0 with Three.js (performance reduced but functional)
- Include feature detection; warn users on incompatible browsers

**Rendering Pipeline:**
- Primary: WebGPU with custom compute shaders
- Fallback: Three.js WebGL 2.0 backend
- Never attempt WebGL 1.0 (too limiting for requirements)

---

## 5. PHYSICAL DYNAMICS SYSTEM

### Gravity & Ball Behaviour:
- **Gravity constant:** -9.81 m/s² (1x Earth gravity—normalized to game units)
- **Playfield tilt:** Surface inclined at 6.5° from vertical (slight slow-down effect on rolling balls)
- **Ball properties:**
  - Material: Steel spheres (simulated)
  - Mass: 1.0 units (normalised)
  - Radius: 0.3 units
  - Friction coefficient: 0.05 (very low—steel on polished surface)
  - Restitution (bounce):
    - Peg collisions: 0.88 (high bounce, energetic)
    - Wall collisions: 0.72 (moderate damping)
    - Bumper collisions: 0.95 (very energetic, arcade-authentic)
    - Ramp collisions: 0.45 (absorbed energy, guides ball)
  - Linear damping: 0.08
  - Angular damping: 0.25

### Physics Engine Selection: Rapier3D (Primary) with Cannon-es Fallback
**Rationale:**
- Rapier3D (WASM-compiled Rust physics engine) offers ~50-70% performance improvement over Cannon.js for 15+ bodies
- Supports GPU-driven constraint solving (critical for flipper responsiveness)
- Compatible with WebGPU compute shaders for potential future physics acceleration
- Cannon-es fallback if Rapier3D proves incompatible with target devices

### Physics Simulation Parameters:
- **Substeps:** 8 per frame (at 60 FPS = 480 substeps/second) to prevent ball tunnelling through pegs
- **Continuous collision detection (CCD):** Enabled for all balls (prevents fast-moving projectiles from clipping geometry)
- **Constraint solver iterations:** 12 (high accuracy for flipper locks and ramp guides)
- **Gravity application:** Per-substep (not just per-frame)
- **Collision groups:**
  - Group 0: Balls (collide with all)
  - Group 1: Static geometry (pegs, walls, bumpers, ramps)
  - Group 2: Dynamic interactive (flippers, cannon)
  - Group 3: Triggers (jackpot funnel, win/loss zones)

### Tilt Mechanic (Physics Integration):
- Playfield base plane rotated 6.5° toward player (slight downward slope)
- This tilt is a **fixed geometry property**, not a dynamic tilt feature
- Mathematically: Gravity vector is NOT rotated; instead, all playfield geometry is rotated in world space
- Effect: Balls naturally accelerate toward the bottom-centre due to the combined gravity + geometry tilt

---

## 6. BOARD LAYOUT: PACHINKO/PINBALL HYBRID (UPSIDE-DOWN U SHAPE)

### Inspiration & Design Philosophy:
Based on traditional Pachinko machines and Pinball arcade designs, this board features:
- **Top section (Circular):** Cannon entry point, wide ball distribution area
- **Middle section (Hybrid Circular→Square Transition):** Pin lanes, pop-bumpers, ramp entry points
- **Lower section (Square):** Pinball-style ramps, targets, railings, jackpot funnel centre
- **Base section (Square):** Ball drain zones, jackpot machine interface

### Specific Board Features:

#### Pin Layout (Pachinko-Inspired):
- **Pin count:** 45-50 cylindrical pegs arranged in staggered offset grid
- **Stagger pattern:** Rows offset by 0.5 units horizontally; vertical spacing 1.2 units
- **Pin material:** Steel cylinders (radius 0.15 units, height 0.5 units)
- **Pin restitution:** 0.88 (high bounce)
- **Pin distribution zones:**
  - Upper wide zone (20 pins): Entry distribution—guides balls toward middle lanes
  - Middle narrow zone (15 pins): Lane separation—directs balls toward targets/bumpers
  - Lower zone (10-15 pins): Convergence zone—funnels toward jackpot/ramps

#### Pop-Bumpers (Pinball-Inspired):
- **Count:** 6 pop-bumpers positioned symmetrically
- **Locations:** Upper-middle area (3 on each side of centre axis)
- **Mechanism:** On ball contact, apply 25-unit impulse upward + outward
- **Cooldown:** 0.15s between activations (prevents multi-hit spam)
- **Score reward:** +500 points per bump
- **Visual feedback:** Bumper flashes red + plays "bump" SFX

#### Ramps (Pinball-Inspired):
- **Ramp count:** 2 main ramps (left and right)
- **Ramp function:** Catch ball at mid-playfield, guide to elevated area, launch back into play
- **Left ramp:** Launches toward upper-right quadrant
- **Right ramp:** Launches toward upper-left quadrant
- **Launch impulse:** 18-unit velocity at ramp exit
- **Ramp entry friction:** 0.6 (high—slows ball on entry, guides smoothly)
- **Score reward:** +1000 points per ramp completion

#### Targets (Pinball-Inspired):
- **Target count:** 5 targets distributed across playfield
- **Target types:** 
  - **3x standard targets:** 100-point triggers (positioned left/centre/right at mid-height)
  - **2x bonus targets:** 500-point triggers (positioned lower, harder to hit)
- **Target mechanism:** On contact, increment the target completion counter
- **Cascading reward:** When all 5 targets hit, award +5000 bonus + unlock rapid-fire cannon

#### Rails & Guides:
- **Centre rail:** Vertical divider from top to mid-playfield (guides balls left/right distribution)
- **Side rails:** Angled sidewalls preventing ball escape
- **Bottom rails:** V-shaped channel guiding balls toward jackpot funnel or drain zones

#### Jackpot Funnel (Centre-Bottom):
- **Funnel geometry:** Cone-shaped capture zone (opening radius 1.5 units at surface, narrowing to 0.8 units at base)
- **Funnel entry:** Triggered by ball contact with funnel top surface
- **Funnel behaviour:**
  - Ball enters funnel → rolls down interior cone → deposits into jackpot machine input chute
  - Funnel applies 0.3 friction coefficient (guides smoothly, no abrupt stops)
  - No ball can escape the funnel once entered
- **Ball capture requirement:** 10 balls must accumulate in the jackpot input chute before the machine activates
- **Visual feedback:** Balls visible rolling down funnel (transparent cone rendering)

#### Drain Zones:
- **Left drain:** Bottom-left corner (balls exit playfield, subtract from ball count)
- **Right drain:** Bottom-right corner (balls exit playfield, subtract from ball count)
- **Centre drain (post-jackpot win):** Balls exiting jackpot win return area automatically re-enter at top cannon (no loss)

---

## 7. MORTAR CANNON SYSTEM

### Cannon Positioning:
- **Location:** Top-center of playfield
- **Orientation:** Vertical axis (can rotate horizontally left/right); vertical angle adjustment (upward/downward tilt)
- **Fire zone:** Launches balls into the top-circular distribution area

### Cannon Control Parameters:
- **Power/Charge:**
  - Range: 0-100% over a 2.0-second maximum charge window
  - Input: Mouse wheel (desktop) / Touch swipe vertical (mobile) / Keyboard W/S keys
  - Visual feedback: Charge bar fills (0-100%)
  - Fire on release or explicit fire command

- **Horizontal rotation (left-right shift):**
  - Range: ±45° (full left to full right)
  - Input: Mouse X-axis displacement / Touch horizontal drag / Keyboard A/D keys
  - Adjusts cannon azimuth within the launch zone
  - Neutral position: Dead centre

- **Vertical angle adjustment (elevation):**
  - Range: -30° to +30° (down-angled to up-angled)
  - Input: Mouse Y-axis / Touch vertical drag above cannon / Keyboard Up/Down arrows
  - Controls ball trajectory arc
  - Default: 0° (horizontal)

- **Rapid-Fire Mode (Unlocked Reward):**
  - **Activation trigger:** Complete all 5 targets (achievement unlock)
  - **Effect:** Reduces cooldown from 1.0s to 0.4s between successive fires
  - **Duration:** Active for entire game session (permanent once unlocked)
  - **Visual indication:** Cannon barrel glows cyan when rapid-fire is active
  - **Ammo source:** Balls returned from jackpot win zone automatically feed into cannon ammo reservoir

### Cannon Cooldown & Firing Logic:
- **Default cooldown:** 1.0 second between fires
- **Rapid-fire cooldown:** 0.4 seconds (after target completion)
- **Charge time:** Configurable 0.5-2.0 seconds (player controls via input)
- **Firing:** Locks all controls until cooldown completes
- **Misfire prevention:** Cannot fire while charging or during cooldown

### Cannon Ball Feed System:
- **Primary ammo source:** Balls drained from jackpot win return area (fed via rail to cannon base)
- **Alternate ammo source:** Initial ball inventory (2000 balls at game start)
- **Ammo counter:** Display current ball inventory in UI
- **Ammo depletion:** Game ends when ball count reaches 0 and no balls remain on the playfield

---

## 8. JACKPOT MACHINE MODULE (EMBEDDED)

### Jackpot Funnel & Input:
- **Funnel-to-chute transition:** Balls roll down cone funnel → accumulate in input chute at base
- **Accumulation requirement:** 10 balls must be collected in the chute before the machine activates
- **Chute capacity:** 15 balls (visual stack in UI showing current count)
- **Activation trigger:** When 10 balls are in the chute, the player can manually activate or auto-activate after 3.0 seconds

### 3D Spinning Reels:
- **Reel count:** 3 independent reels
- **Reel symbols:** Each reel displays 10 symbols (indexed 0-9):
  - **Symbols:** 1x, 2x, 3x, 4x, 5x (multipliers), BONUS, FREE BALL, WILD, JACKPOT, SPECIAL
- **Reel geometry:** 3D cylinders with textured sidewalls (symbol sprites arranged around circumference)
- **Symbol size:** 0.5 units × 0.5 units per face

### Reel Spinning Animation:
- **Spin duration:** 2.0 seconds total
- **Spin speed curve:** 
  - 0.0-0.3s: Accelerate to max RPM (10 rotations/second)
  - 0.3-1.7s: Constant max RPM
  - 1.7-2.0s: Decelerate (ease-out using THREE.Easing.Quintic.InOut)
- **Final symbol alignment:** Snap to nearest symbol index (0-9) with 1.15x overshoot scale, then elastically settle to rest
- **Symbol randomisation:** Use GPU-normalised average of frame-time variance over last 200ms as RNG seed (see Section 11: Stochastic GPU Noise)

### Payout Logic & Win Conditions:

**Win Scenarios:**
1. **Three Matching Multipliers (e.g., 3×3×3):**
   - Payout: Multiply current session score by result
   - Example: If reels show 3×4×5, multiply score by 3×4×5 = 60x
   - Max multiplier: 5×5×5 = 125x
   - Award: +15 free balls to the ammo reservoir

2. **Three Matching BONUS:**
   - Payout: +50 free balls
   - Award: +10,000 bonus points
   - Unlock: Rapid-fire cannon (if not already unlocked)

3. **Three Matching FREE BALL:**
   - Payout: +20 free balls
   - Award: +5,000 bonus points

4. **WILD/JACKPOT Combos (any WILD symbol acts as a wildcard):**
   - Three JACKPOT: +100 free balls + 50,000 points + permanent 2x score multiplier
   - Two JACKPOT + any other: +30 free balls + 20,000 points

5. **Mixed Non-Matching Symbols:**
   - Payout: +5,000 base points
   - Consolation: +3 free balls

**Payout Delivery:**
- Free balls awarded exit jackpot machine via dedicated return chute/rail
- Return chute delivers balls to cannon ammo reservoir automatically
- Balls can be visually seen travelling on the rail from the jackpot to the cannon
- Display payout summary in UI overlay for 3.0 seconds (shows multiplier, balls won, points awarded)

### Jackpot State Machine:
```
State: IDLE
  - Waiting for 10 balls in chute
  - Display: "10 balls required" indicator

State: READY
  - 10+ balls accumulated, waiting for activation
  - Display: "Ready to spin" button / Auto-activate after 3s countdown

State: SPINNING
  - Reels actively spinning
  - Player cannot interact
  - Duration: 2.0 seconds

State: PAYOUT
  - Reels stopped, evaluating win condition
  - Display: Result calculation (0.5s pause)
  - Trigger: Balls exit chute into return rail

State: LOCKOUT
  - Machine disabled for 2.5 seconds (prevent spam)
  - Display: "Machine cooling down..." countdown

State: RESET
  - Return to IDLE state
  - Clear the chute if fewer than 10 balls remain
```

### Jackpot Visual Design:
- **Machine body:** 3D box with metallic chrome finish (reflective shader)
- **Reel viewport:** Transparent acrylic front (show all 3 spinning reels)
- **Reel lighting:** Internal glow beneath reels (cyan + magenta neon accent lights)
- **Win animation:** When jackpot triggered, entire machine flashes bright yellow + plays triumphant SFX
- **Return chute:** Visible 3D tube/rail leading from machine output to cannon base (balls roll through visibly)

---

## 9. INPUT CONTROL SYSTEM

### Desktop Controls (Mouse/Keyboard):

| **Function** | **Primary Input** | **Secondary Input** | **Tertiary Input** |
|---|---|---|---|
| **Cannon Power (Charge)** | Mouse Wheel Up/Down | Keyboard W/S | Click + Drag vertically |
| **Cannon Rotation (L/R)** | Mouse X-position (relative to canvas center) | Keyboard A/D | Click + Drag horizontally |
| **Cannon Angle (Elevation)** | Mouse Y-position (relative to cannon) | Keyboard ↑/↓ | Scroll wheel (alt) |
| **Fire Cannon** | Left-Click | Spacebar | Enter Key |
| **Left Flipper** | Z Key | Left Mouse Button (held) | Q Key |
| **Right Flipper** | ? / (forward slash) | Right Mouse Button (held) | E Key |
| **Jackpot Activate** | J Key | UI Button Click | (Auto-trigger after 3s) |

### Mobile Controls (Touch):

| **Function** | **Touch Gesture** | **Alternative** |
|---|---|---|
| **Cannon Power** | Vertical swipe (upward = charge, downward = fire) | Drag vertical slider on left edge |
| **Cannon Rotation** | Horizontal swipe (left/right bias) | Drag dial widget beneath cannon |
| **Cannon Angle** | Two-finger vertical pinch (spread = up-angle, pinch = down-angle) | Tilt device (gyro—optional) |
| **Fire Cannon** | Tap button (center bottom) OR release swipe | Double-tap anywhere |
| **Left Flipper** | Tap left side of screen (hold for sustained activation) | Slide UP on left edge |
| **Right Flipper** | Tap right side of screen (hold for sustained activation) | Slide UP on right edge |
| **Jackpot Handle** | Slide DOWN on right edge of canvas (jackpot handle metaphor) | UI Button |

### Input Timing & Latency Requirements:
- **Input polling rate:** Every requestAnimationFrame (60 Hz = 16.67ms max latency)
- **Input → visual feedback:** < 16ms (1 frame)
- **Input → physics response (flipper activation):** < 33ms (2 frames max)
- **Cannon response time:** < 50ms from charge release to ball fire
- **Simultaneous input support:** Both flippers + cannon controls active simultaneously (no mutual exclusivity)

### Input Buffering:
- Buffer up to 5 queued actions (flipper presses, cannon fires, jackpot activations)
- Execute in FIFO order on the next physics frame
- Discard buffered cannon fires if a new cannon charge begins mid-queue

### Touch Specifics:
- Prevent default browser scrolling on canvas area (`event.preventDefault()` on touchstart/touchmove)
- Support both single-touch and multi-touch (flippers can be dual-touch simultaneous)
- No pointer-lock or fullscreen requirement (responsive to browser standard behaviour)

---

## 10. FLIPPER SYSTEM

### Flipper Positioning & Geometry:
- **Left flipper:** Base pivot at coordinates (-3.0, 1.5, 0)
- **Right flipper:** Base pivot at coordinates (+3.0, 1.5, 0)
- **Flipper length:** 2.5 units (extended)
- **Flipper width:** 0.4 units
- **Flipper height:** 0.15 units (thin paddle)
- **Flipper material:** Metallic texture with glossy specular highlight

### Flipper Physics:
- **Joint type:** Revolute (pin) joint at base
- **Angular limits:** ±75° rotation around pivot axis
- **Resting angle:** -35° (tilted downward, ready to push ball upward)
- **Active angle:** +35° (raised, pushing ball)
- **Motor torque:** 50 N⋅m (arcade-authentic response strength)
- **Activation responsiveness:**
  - Idle → active: 0.12 seconds (zippy arcade feel)
  - Active → idle: 0.10 seconds (snappy return)
  - No lag or momentum (instant response to input release)
- **Restitution boost:** When ball contacts flipper mid-swing (velocity > 2 units/s), apply +0.15 restitution bonus (simulate "active hit" energy transfer)

### Flipper Ball Interaction:
- **Contact zone:** Entire flipper paddle surface (no sweet-spot—arcade simplicity)
- **Collision response:** High-friction contact (μ = 0.7 on flipper surface)
- **Impulse direction:** Primarily upward-outward (along flipper normal vector), redirecting ball trajectory
- **Slingshot effect:** If the ball contacts the flipper while the flipper is swinging, apply an additional 5-unit impulse multiplier

---

## 11. STOCHASTIC GPU NOISE GENERATION (Advanced RNG)

### GPU-Normalised Frame-Time Variance as RNG Seed:

Instead of traditional Math.random(), use GPU performance metrics to generate pseudo-random values:

**Algorithm:**
1. Track frame render time over a rolling 200ms window (12 frames at 60 FPS)
2. Calculate statistical variance of frame times (standard deviation from the mean)
3. Normalise variance to range [0.0, 1.0]
4. Use normalised value as seed for next stochastic event (reel symbol selection, target hit random offset, etc.)

**Rationale:**
- GPU load naturally varies frame-to-frame (driver overhead, thermal throttling, background processes)
- This variance is unpredictable and genuinely random from a cryptographic perspective
- Advantage over Math.random(): Seed correlates with actual system performance, creating organic difficulty scaling
- Bias toward lower variance (easier RNG) when the system is calm; higher variance (more "chaotic" RNG) under load

**Implementation Pseudocode:**
```
frameTimes = [] // circular buffer, size 12
variance = 0.0

onFrameComplete(frameTimeMs) {
  frameTimes.push(frameTimeMs)
  if (frameTimes.length > 12) frameTimes.shift()
  
  mean = average(frameTimes)
  variance = standardDeviation(frameTimes, mean)
  
  //Normalise variance to [0, 1] range (clamp to [5ms, 25ms] range)
  normalizedVariance = clamp(variance / 10.0, 0.0, 1.0)
  
  // Use for next RNG event:
  if (nextReelSpinNeeded) {
    randomSymbol = floor(normalizedVariance * 10) // 0-9 index
  }
}
```

**Applications:**
- Reel symbol randomisation (jackpot machine)
- Target hit detection variance (±5% accuracy variation)
- Bump vector noise (prevent identical bumper trajectories)
- Pinball ball spawn variations (slight initial velocity offset)

---

## 12. RENDERING PIPELINE

### WebGPU Rendering Architecture:

#### Render Passes:
1. **Depth Pass:** Render all opaque geometry to depth texture (shadow mapping alternative)
2. **G-Buffer Pass:** Render normal + metallic + roughness + emissive maps to offscreen targets
3. **Lighting Pass:** Compute per-pixel lighting using G-buffers
4. **Post-Process Pass:** Apply bloom, tone-mapping, UI overlay
5. **Present Pass:** Copy to screen

#### Lighting Setup:
- **Directional Light (Primary Arcade Spotlight):**
  - Position: (-8, 20, 12) (raking angle from upper-left-back)
  - Direction: Normalized(-8, -20, -12)
  - Intensity: 1.5
  - Color: RGB(1.0, 0.95, 0.85) (warm white, slight yellow arcade tint)

- **Fill Light (Secondary):**
  - Position: (10, 8, -8)
  - Intensity: 0.5
  - Color: RGB(0.8, 0.9, 1.0) (cool blue accent)

- **Ambient Light:**
  - Intensity: 0.25
  - Color: RGB(0.3, 0.3, 0.35) (dark blue-tinted, no pure black)

#### Shadow Mapping:
- **Shadow map resolution:** 2048×2048 (primary directional light only)
- **Shadow map blur:** Gaussian blur, radius 2.0 pixels (soft shadows)
- **Bias:** 0.001 (prevent shadow acne)
- **Adaptive quality:** If average FPS < 55 over 30 frames, reduce to 1024×1024 or disable entirely

#### Material Properties (Vertex/Fragment Shaders):

**Standard PBR Materials (all playfield objects):**
- **Metallic:** Range 0.0 (diffuse) to 1.0 (mirror)
  - Pegs: 0.3 (matte steel)
  - Bumpers: 0.8 (polished chrome)
  - Ramps: 0.2 (rubberised surface)
  - Walls: 0.1 (painted arcade cabinet)
  
- **Roughness:** Range 0.0 (mirror-smooth) to 1.0 (diffuse)
  - Pegs: 0.4
  - Bumpers: 0.2 (shiny)
  - Ramps: 0.6 (grippy surface)
  - Balls: 0.15 (polished steel spheres)

- **Specular:** RGB colour (highlight tint)
  - All objects: RGB(1.0, 1.0, 1.0) (neutral white specular)

- **Emissive:** RGB colour (self-illumination, no external light needed)
  - Inactive bumpers: RGB(0.0, 0.0, 0.0)
  - Active bumpers (hit state): RGB(1.0, 0.2, 0.2) (red glow, 0.2s duration)
  - Jackpot machine border: RGB(0.0, 0.8, 1.0) (cyan neon, always on)
  - Rapid-fire cannon barrel (when active): RGB(0.0, 1.0, 1.0) (cyan glow)

- **Transparency (Alpha Blending):**
  - Jackpot funnel: 0.3 (semi-transparent cone, see balls inside)
  - Return chute: 0.2 (highly transparent tube, see balls rolling)
  - UI overlay: 0.8 (semi-transparent HUD background)

- **Reflectivity:**
  - Bumpers: High reflectivity (0.9) for metallic mirror effect
  - Balls: Moderate reflectivity (0.6) for realistic sphere sheen
  - Walls: Low reflectivity (0.1) for matte cabinet finish

#### Procedural Texture Generation (No External Assets):
All textures generated procedurally via fragment shaders or canvas 2D:

1. **Pegs:** Cylinder with circular highlights (specular reflection)
2. **Bumpers:** Dome with rim lighting + edge glow
3. **Ramps:** Striped texture (alternating dark/light bands for depth perception)
4. **Walls:** Wood-grain pattern (Perlin noise simulation)
5. **Balls:** Sphere with sun-position-relative specular highlight
6. **Reels (Jackpot):** Symbol sprites rendered as canvas 2D, then uploaded as WebGPU texture
7. **Floor/Surface:** Checkered pattern with metallic sheen (arcade aesthetic)

#### Post-Processing Effects (Performance-Conscious):
- **Bloom:** Applied to emissive surfaces only (bumpers hit state, neon trim)
  - Bloom threshold: Emissive value > 0.5
  - Blur radius: 8 pixels
  - Blend strength: 0.3x

- **Tone Mapping:** ACES filmic tone-map (converts HDR → SDR)
  - Prevents blown-out highlights
  - Preserves arcade colour vibrancy

- **Color Grading:** 3D LUT (Look-Up Table) texture
  - Arcade-warm colour grade (slightly boosted reds/yellows)
  - LUT resolution: 16×16×16 (minimal memory overhead)

- **NO additional effects:** Skip SSAO, motion blur, chromatic aberration (too expensive for target performance)

#### Draw Call Optimisation:
- **Peg rendering:** Instanced rendering (30 pegs = 1 draw call via WebGPU instancing)
- **Ball rendering:** Instanced geometry (15 balls = 1 draw call with dynamic transform buffers)
- **Static geometry:** Merged into a single VBO per material type (walls, bumpers, ramps = 3 draw calls max)
- **UI overlay:** Rendered via separate pass (orthographic projection, billboarded text)

#### Adaptive Quality Detection:
```
FPS Monitoring Loop:
- If avgFPS (last 30 frames) < 55:
  → Reduce shadow map: 2048×2048 → 1024×1024
- If avgFPS < 50:
  → Disable shadow mapping entirely; use flat shading
- If avgFPS < 45:
  → Disable bloom post-process
  → Reduce draw distance for non-critical geometry
- If avgFPS < 40:
  → Switch to WebGL 2.0 fallback (user notified)
```

---

## 13. SCORING SYSTEM

### Base Scoring Mechanics:

| **Event** | **Base Points** | **Multiplier** | **Frequency** |
|---|---|---|---|
| **Peg contact** | +50 | Session 2x (if active) | Frequent |
| **Pop-bumper hit** | +500 | Session multiplier | Moderate |
| **Ramp completion** | +1,000 | Session multiplier | Occasional |
| **Target hit** | +100 (standard) / +500 (bonus) | Session multiplier | Frequent |
| **Jackpot entry** | +2,000 | Session multiplier | Rare (10-ball requirement) |
| **Jackpot win (base)** | +5,000 | Win multiplier (1x-125x) | Rare |
| **Bonus target completion (all 5)** | +10,000 | Session multiplier | Moderate |

### Session Multiplier Mechanics:
- **Default session multiplier:** 1.0x (no boost)
- **Activation trigger:** Complete all 5 targets OR win jackpot with 3x+ multiplier match
- **Effect:** All subsequent score events multiplied by session multiplier (1.0x to 5.0x)
- **Multiplier decay:** Does NOT decay—persists entire game session once activated
- **UI display:** "SESSION 2x" indicator when active (appears below score counter)

### Jackpot Multiplier Impact:
- **Reel match multiplier** (e.g., 3×4×5 = 60x) applies ONLY to current session score snapshot
- **Score calculation:** Current_Session_Score × Reel_Result = Payout
- **Example:** If session score is 50,000 and reel result is 3×4×5 (60x):
  - Payout = 50,000 × 60 = 3,000,000 points awarded
  - Session score is NOT multiplied; only the payout bonus is calculated

### Scoring Display:
- **Main score counter:** Always visible, centre-top of UI (large font, white)
- **Combo counter:** Displays current multi-hit combo (resets 1.5s after last event)
- **Multiplier badge:** "SESSION 2x / 3x / 4x / 5x" indicator (glows when active)
- **Last event notification:** Recent score event displayed temporarily (e.g., "+500 BUMPER!")

---

## 14. BALL ECONOMY & GAME LIFECYCLE

### Initial Ball Inventory:
- **Starting ball count:** 2,000 balls
- **Rationale:** Based on real Pachinko arcade sessions, players typically receive 1,500-3,000 balls per play session. 2,000 represents mid-range engagement (~15-30 minute session at constant fire rate)

### Ball Depletion Rules:
- **Ball loss:** -1 ball per drain event (left/right drain zones at bottom of playfield)
- **Ball gain sources:**
  - Jackpot free ball awards (see Section 8: Jackpot Machine)
  - Bonus target completion (+5 free balls)
  - Rapid-fire unlock bonus (+10 bonus balls awarded immediately)

### Game End Conditions:
- **Loss condition:** Ball count reaches 0 AND no balls currently on playfield
  - Consequence: Game Over screen displayed; offer score submission to leaderboard
  - Suggestion: "Game Over. Final Score: 2,500,000. Submit to Leaderboard? [Yes/No]"

- **Continuous play option:** If player drains last ball but completes jackpot spin in same session, continue game (new balls awarded via jackpot win keep game alive)

### Ball Visibility & Inventory Tracking:
- **UI element:** Ball counter displays current inventory in the top-left corner
  - Format: "BALLS: 1,847" (updates real-time)
  - Colour: White (red alert flash if count < 50)
  - Size: 24pt font

- **Reserve ammo zone:** Visual indicator showing queued balls ready for next cannon fire (stack display or number badge)

---

## 15. WIN/LOSS & ACHIEVEMENT SYSTEM

### Achievement Milestones:
- **First Bumper Hit:** +100 bonus points (one-time)
- **First Ramp Completion:** +500 bonus points (one-time)
- **All Targets Completed:** Unlock rapid-fire cannon + +10,000 points (one-time per session)
- **Jackpot Win (any):** +5,000 base bonus (repeatable)
- **Mega Jackpot (5×5×5):** +50,000 bonus + permanent 2x session multiplier (one-time per session)
- **Consecutive Bumper Hits (3x):** +1,000 combo bonus (repeatable)

### High Score Persistence:
- **Storage method:** Browser localStorage (persistent across sessions)
- **Data structure:**
  ```json
  {
    "highScores": [
      {"rank": 1, "score": 5000000, "date": "2025-01-15", "playerInitials": "AAA"},
      {"rank": 2, "score": 3500000, "date": "2025-01-14", "playerInitials": "BBB"},
      ...
    ],
    "sessionStats": {
      "totalGamesPlayed": 42,
      "totalBallsFired": 84000,
      "totalJackpotsWon": 8,
      "bestRapidFireStreak": 23
    }
  }
  ```
- **Leaderboard display:** Top 10 high scores shown on game-over screen
- **Player initials:** Prompt for 3-character initials on new high score (localStorage persistence)

---

## 16. AUDIO & SOUND EFFECTS

### Audio Technology:
- **Library:** jsfxr (GitHub: chr15m/jsfxr) for procedurally generated SFX
- **Playback API:** Web Audio API (AudioContext)
- **Mixing:** Simple linear mixing (no spatial audio required)

### Sound Effects Library:

| **Event** | **SFX Type** | **Duration** | **Frequency** |
|---|---|---|---|
| **Ball fire** | Digital beep + whoosh | 0.3s | Per cannon fire |
| **Peg contact** | Crisp click (metallic) | 0.1s | Frequent |
| **Bumper hit** | Loud impact + boing | 0.4s | Moderate |
| **Ramp enter** | Smooth slide tone | 0.2s | Occasional |
| **Ramp exit** | Launch spring release | 0.3s | Occasional |
| **Target hit** | Chime tone (ascending) | 0.25s | Frequent |
| **All targets complete** | Victory fanfare (melody) | 1.0s | Rare |
| **Jackpot trigger** | Alarm/alert beep (repeating) | 0.5s | Rare |
| **Reel spin start** | Mechanical whirr | 2.0s (loop) | Per jackpot |
| **Reel spin end** | Mechanical stop/clack | 0.3s | Per jackpot |
| **Jackpot win** | Triumph horn + applause | 2.0s | Rare |
| **Drain/loss** | Sad trombone | 0.5s | Frequent |
| **Game over** | Dramatic end chord | 1.0s | Per game |
| **UI button click** | Soft beep | 0.15s | Per interaction |

### SFX Generation (jsfxr Examples):
```JavaScript
// Peg contact sound
const pegClick = jsfxr([3,0.4,,0.1,0.1,,0.2,0.3,,,,,,0.1,0.1,0.3,0.1,0.3]);

// Bumper hit sound
const bumperImpact = jsfxr([1,0.8,,0.2,0.3,,0.3,0.6,,,,,,0.3,0.2,0.5,0.2]);

// Jackpot win fanfare
const jackpotWin = jsfxr([2,0.5,,0.4,0.5,,0.4,0.8,,0.1,0.1,0.3,0.1,0.5]);
```

### Audio Settings:
- **Master volume:** 1.0 (100%)—modifiable via settings UI (future)
- **SFX volume:** 0.8 (80%)
- **Music volume:** 0.0 (no background music—arcade simplicity)
- **Mute option:** Available (stored in localStorage)

---

## 17. UI/UX LAYOUT (Portrait Mode)

### Screen Layout Structure:
```
┌─────────────────────────────────┐
│  SCORE: 2,500,000  BALLS: 1,847 │  ← Top-left/right info bar
├─────────────────────────────────┤
│                                 │
│       [3D GAME CANVAS]          │  ← Main 3D playfield (circular top, square bottom)
│       (ASPECT 9:16 PORTRAIT)    │
│                                 │
│                                 │
├─────────────────────────────────┤
│  [DIAL CONTROL WIDGET]          │  ← Centred dial input (power/angle/rotation)
│  PWR: ████░░░░░░ 40%            │
│  LEFT/RIGHT indicator           │
├─────────────────────────────────┤
│ [FIRE BUTTON]  [RAPID-FIRE: ON] │  ← Action buttons
│    [JACKPOT HANDLE]             │  ← Right-side slide handle
└─────────────────────────────────┘
```

### Specific UI Elements:

#### Top Info Bar:
- **Left side:** "SCORE: X,XXX,XXX" (white text, 18pt)
- **Right side:** "BALLS: X,XXX" (white text, 18pt)
- **Multiplier badge:** "SESSION 2x" glows cyan if active (14pt)
- **Background:** Semi-transparent dark overlay (rgba 0,0,0,0.5)

#### Dial Control Widget (Bottom-Centre):
- **Visual:** Radial dial graphic (circle with 8 directional indicators)
- **Power bar:** Vertical bar showing 0-100% charge (left side of dial)
- **Angle display:** Small arrow showing -30° to +30° elevation
- **Rotation display:** Left/Right bias indicator (L←→R)
- **Responsive feedback:** Dial rotates in real-time as player adjusts
- **Tap zones:** Inner circle = fire button; outer ring = rotation/angle adjust

#### Fire Button:
- **Visual:** Large circular button (bottom-centre, below dial)
- **Label:** "FIRE" (bold white text)
- **State:** 
  - Default: Grey, clickable
  - During cooldown: Red, "READY IN: 0.8s" countdown text
  - Charging: Orange, pulsing glow
- **Size:** 60px diameter (touch-friendly)

#### Rapid-Fire Indicator:
- **Display:** "RAPID-FIRE: ON/OFF" badge (top-right, next to multiplier)
- **Colour:** Cyan glow if ON, grey if OFF
- **Activation:** Automatically updates when all targets are completed

#### Jackpot Handle (Right Side):
- **Visual:** 3D lever/handle graphic (right edge of canvas)
- **Interaction:** Slide downward to activate jackpot spin (haptic feedback on mobile)
- **State indicator:** Pulsing glow when jackpot is ready (10 balls accumulated)
- **Disabled appearance:** Greyed-out, non-interactive until 10 balls in chute

#### Jackpot Ball Count Display (if activated):
- **Position:** Lower-center, below dial
- **Display:** "JACKPOT: 8/10 BALLS" (progress bar)
- **Auto-hide:** Disappears when game is in normal play (show only when jackpot chute has balls)

### Mobile Touch Zones:
```
┌──────────────────────────┐
│ [Top Info Area]          │  ← Read-only (no touch interaction)
├──────────────────────────┤
│                          │
│   [Playfield Canvas]     │  ← Drag gestures for cannon control
│   Left 1/3: Left flipper │
│   Right 1/3: Right flipper
│   Centre: Cannon angle/rotation
│                          │
├──────────────────────────┤
│ [Control Zone]           │
│ Centre: Fire button      │  ← Tap-friendly buttons
│ Right: Jackpot handle    │
│ Bottom: Dial widget      │
└──────────────────────────┘
```

---

## 18. PERFORMANCE OPTIMIZATION STRATEGIES

### WebGPU-Specific Optimisations:
1. **Compute shaders for physics pre-culling:** Pre-calculate collision candidates on GPU before CPU broad-phase
2. **Texture atlasing:** Pack all material maps into a single atlas (reduces bind-group switches)
3. **Ring buffers for dynamic data:** Ball transforms updated via ring buffer (avoid repeated allocations)
4. **Async readback:** Physics results read back asynchronously (don't stall GPU)

### Memory Management:
- **Object pooling:** Maintain pool of 15 ball bodies; reuse rather than create/destroy
- **Geometry instancing:** All peg geometry shared; use transform matrices for variations
- **LOD (Level of Detail):** Simplify reel models if distance > 5 units (rarely triggered at playfield scale)

### Frame Rate Management:
- **requestAnimationFrame sync:** Lock to 60 FPS (or lower on inconsistent hardware)
- **Adaptive timestep:** If frame exceeds 33ms, clamp to 2 physics substeps instead of 8
- **Telemetry:** Log frame times, GPU usage (if available via WebGPU extensions)

### Target Performance Benchmarks:
- **Samsung Galaxy S24 Ultra:** 55-60 FPS at 1440p (portrait)
- **Windows 11 + RTX 2080 Ti:** 120+ FPS at 1440p (capable of higher; capped at 60 for consistency)
- **Fallback (WebGL 2.0 on older hardware):** 45-50 FPS at 1080p

---

## 19. RENDERING FALLBACK STRATEGY

### Fallback Chain:
1. **Attempt WebGPU initialization** (Chrome 120+, Edge 120+, Firefox 130+)
   - If successful: Use a full WebGPU pipeline
   - If unavailable or error: Log warning, proceed to fallback

2. **Fallback to WebGL 2.0 with Three.js**
   - Three.js r128+ with WebGL 2.0 backend
   - Use Cannon-es physics (not Rapier3D, which is WebGPU-optimised)
   - Reduce shadow map resolution to 1024×1024
   - Disable compute shader optimisations

3. **Final fallback: WebGL 1.0 (if WebGL 2.0 unavailable)**
   - **NOT recommended** but supported for extreme legacy browsers
   - Use deferred lighting via texture lookups
   - Reduce geometry complexity (fewer pegs, simplified bumpers)

### Feature Detection Code Pattern:
```javascript
async function initializeGraphics() {
  if (navigator.gpu) {
    try {
      adapter = await navigator.gpu.requestAdapter();
      device = await adapter.requestDevice();
      return 'WebGPU';
    } catch (e) {
      console.warn('WebGPU initialization failed:', e);
    }
  }
  
  // Fallback to WebGL 2.0
  const canvas = document.getElementById('gameCanvas');
  const gl = canvas.getContext('webgl2');
  if (gl) {
    return 'WebGL2';
  }
  
  // Final fallback
  const gl1 = canvas.getContext('webgl');
  return gl1 ? 'WebGL1' : 'UNSUPPORTED';
}
```

---

## 20. BROWSER COMPATIBILITY MATRIX

| **Browser** | **OS** | **WebGPU** | **WebGL 2.0** | **Status** | **Target FPS** |
|---|---|---|---|---|---|
| Chrome 120+ | Windows 11 | ✅ Full | ✅ Full | Primary | 60 FPS |
| Edge 120+ | Windows 11 | ✅ Full | ✅ Full | Primary | 60 FPS |
| Firefox 130+ | Windows 11 | ⚠️ Experimental | ✅ Full | Secondary | 55 FPS |
| Safari 17.2+ | macOS 14.4+ | ⚠️ Experimental | ✅ Full | Secondary | 50 FPS |
| Chrome | Android S24 | ✅ Full | ✅ Full | Primary Mobile | 55 FPS |
| Safari | iPad OS 17.4+ | ⚠️ Experimental | ✅ Full | Secondary Mobile | 48 FPS |

---

## 21. DEVELOPMENT CONSTRAINTS & LIMITATIONS

### Mandatory:
- Do NOT use external 3D model files (.fbx, .gltf, .obj). All geometry is procedurally generated.
- Do NOT use external texture assets. All textures are procedurally generated or canvas 2D-rendered.
- Do NOT use localStorage for physics state or frame data. Only for high scores + settings (immutable during gameplay).
- Do NOT include any conversational preamble or explanation before code output.
- Do NOT use placeholder comments (// ... rest of code). Provide complete, compilable code.
- Do NOT rely on polyfills or compatibility libraries beyond jsfxr (audio generation) and Cannon-es/Rapier3D (physics).

### Code Quality:
- **Language:** Modern JavaScript (ES6+ syntax, arrow functions, async/await)
- **Module structure:** Organise code into logical sections (Rendering, Physics, Input, UI, Audio, State Management)
- **Commenting:** Include brief JSDoc comments for major functions; avoid redundant inline comments
- **Error handling:** Graceful degradation on WebGPU unavailability; warn user via UI

---

## 22. DELIVERABLES (Output Format)

The response must contain the complete, fully functional, production-ready source code:

### Required File Components:
1. **HTML file** (single `index.html`)
   - Canvas element setup (9:16 portrait aspect ratio)
   - UI overlay HTML structure (score counter, dial widget, buttons)
   - No external dependencies in `<head>` except CDN-hosted libraries

2. **JavaScript Game Engine** (complete inline in `<script>`)
   - **Graphics System:** WebGPU initialization + WebGL 2.0 fallback
   - **Three.js integration:** R128+ WebGL 2.0 renderer (if fallback needed)
   - **Physics Engine:** Rapier3D WASM + Cannon-es fallback
   - **Game Loop:** Main render/update cycle with requestAnimationFrame
   - **State Machine:** Game states (IDLE, PLAYING, JACKPOT_SPINNING, GAME_OVER)

3. **Physics & Collision System**
   - Ball body creation + pooling
   - Peg/bumper/ramp static geometry
   - Flipper joint constraints + motor control
   - Continuous collision detection (CCD) settings
   - Collision callbacks (scoring events, drain detection)

4. **Input Handling System**
   - Keyboard event listeners (A/D, W/S, Z, ?, ↑/↓, Spacebar)
   - Mouse event listeners (wheel, movement, clicks)
   - Touch event listeners (swipe, tap, drag, handle)
   - Input buffering queue
   - Mobile vs. desktop input routing logic

5. **3D Rendering Pipeline (WebGPU Primary)**
   - Render pass setup (depth, G-buffer, lighting, post-process)
   - Custom shaders (vertex + fragment) for PBR materials
   - Shadow mapping implementation
   - Bloom post-process
   - Instanced rendering for pegs/balls
   - Procedurally generated textures (canvas 2D → WebGPU texture upload)

6. **Cannon/Mortar System**
   - Charge/power accumulation logic
   - Angle/rotation control (mouse, touch, keyboard)
   - Fire mechanics (impulse calculation, cooldown)
   - Rapid-fire unlock conditions + activation
   - Visual feedback (charge bar, orientation glow)

7. **Flipper Control System**
   - Revolute joint physics
   - Activation/deactivation animation
   - Restitution boost on swing contact
   - Input debouncing (prevent hyper-flipping)

8. **Jackpot Machine Module**
   - Reel 3D model generation + spinning animation
   - Symbol randomisation (GPU noise-based RNG)
   - Payout calculation logic
   - Win condition evaluation (multipliers, free balls)
   - State machine (IDLE, READY, SPINNING, PAYOUT, LOCKOUT)
   - Visual feedback (glow, animations, sound)

9. **Scoring System**
   - Event-based scoring (peg, bumper, ramp, target, jackpot)
   - Session multiplier tracking
   - Combo detection + display
   - Score accumulation

10. **Ball Economy & Lifecycle**
    - Ball pool management
    - Drain detection + count decrement
    - Jackpot ball award distribution
    - Game-over condition check

11. **Audio System** (jsfxr-based)
    - SFX library generation (all procedural)
    - Playback via Web Audio API
    - Volume mixing
    - Mute toggle

12. **UI & HUD Overlay**
    - Score display + real-time updates
    - Ball counter
    - Multiplier badge
    - Rapid-fire indicator
    - Dial control widget (SVG or canvas 2D)
    - Fire button + Jackpot handle
    - Game-over screen + leaderboard
    - High score form (initials input)

13. **Persistence Layer**
    - High score save/load (localStorage)
    - Session statistics tracking
    - Settings storage (volume, mute, etc.)

14. **Performance Monitoring**
    - FPS counter (optional on-screen display)
    - Adaptive quality detection + fallback logic
    - GPU load tracking (if available)

### Code Organisation:
- Single HTML file with embedded `<script>` (no external JS files)
- CSS embedded in `<style>` tag (responsive portrait layout)
- Modular function architecture (init, update, render, input handlers, physics callbacks)
- Clear separation of concerns (no monolithic 5000-line functions)

### Compilation & Execution Requirements:
- Code must execute in the browser immediately with no build step
- No npm install, webpack, or transpilation required
- Must work on first page load (no async initialisation delays > 2s)
- All dependencies loaded from CDN (Three.js, Cannon-es, jsfxr)

---

## 23. SUCCESS CRITERIA

The generated code is successful if it demonstrates:

✅ **Functional Gameplay:**
- Cannon fires balls into the circular top area
- Balls collide realistically with 30+ pegs (staggered layout)
- Pop-bumpers activate on contact + apply impulses
- Ramps catch + redirect balls smoothly
- Targets register hits + accumulate completion counter
- Flippers respond to input (< 33ms latency)
- Balls drain into left/right zones (decrement count)

✅ **Jackpot Integration:**
- Funnel captures balls; 10-ball accumulation triggers ready state
- Reel spinning animation plays smoothly (2.0s duration)
- Win condition evaluates correctly (multiplier math verified)
- Free balls awarded exit machine → feed into cannon reservoir
- Payout display + SFX plays on win

✅ **Performance:**
- Sustained 60 FPS on Samsung S24 Ultra (portrait, 1440p)
- Sustained 55+ FPS on Windows 11 + RTX 2080 Ti
- No frame drops during intense collision moments (10+ balls active)
- Rapid-fire cannon (0.4s cooldown) maintains frame rate

✅ **Rendering Quality:**
- WebGPU active on compatible browsers (confirmed via console log)
- Realistic metallic/specular materials (bumpers shine, balls reflect)
- Shadow mapping creates arcade-authentic depth
- Neon glow effects on bumper hits + jackpot machine
- UI readable on portrait layout (text scales appropriately)

✅ **Input Responsiveness:**
- Keyboard/mouse input (desktop): Instant feedback
- Touch input (mobile): Dial control responsive, no lag
- Simultaneous flipper + cannon input handled correctly
- Input buffering prevents missed commands

✅ **Audio:**
- SFX plays on ball fire, peg contact, bumper hit, ramp entry, jackpot win
- No audio glitches or dropped frames during playback
- Volume levels appropriate (not ear-splitting)

✅ **Persistence:**
- High scores saved to localStorage + loaded on page refresh
- Leaderboard displays top 10 scores correctly
- Game-over screen allows initials input

---

## 24. TECHNICAL REFERENCE & RESEARCH SUMMARY

### Pachinko Machine Mechanics (Research-Based):
- Pachinko machines feature vertically oriented playing fields with hundreds of small pegs arranged in deliberate patterns to create complex ball trajectories
- Traditional playfield is entirely vertical; this hybrid adapts to portrait mobile orientation
- Ball economics: Players typically purchase 1,500-3,000 balls per session, with most games lasting 15-30 minutes
- Pin spacing typically 12-20mm; adapted here to ~1.2 game units

### Pinball Mechanics Integration:
- Modern pinball machines incorporate pop-bumpers (which generate additional points upon contact), ramps (inclined sections that guide balls to upper playfield areas), and targets (stationary objects that trigger bonus scoring when struck)
- Flippers are standard (2x flippers at ~120° angle); adapted here to simultaneous dual-activation
- Ramp designs in premium pinball include loop ramps, orbit shots, and multi-stage ramps that award increasing points for completion sequences

### WebGPU Advantages for This Project:
- WebGPU provides explicit GPU control, enabling custom compute shaders for physics pre-processing and reducing CPU bottlenecks compared to WebGL
- WebGPU support is stable in Chrome 120+ and Edge 120+, with experimental support in Firefox 130+ and Safari 17.2+
- For mobile, Android Chrome on Samsung Galaxy S24 Ultra includes full WebGPU support, enabling optimised rendering on the target device

### Physics Engine Selection:
- Rapier3D (Rust-based physics engine compiled to WebAssembly) provides 50-70% performance improvement over JavaScript-based engines like Cannon.js for scenarios with 15+ dynamic bodies
- Cannon-es is an actively maintained ES6 fork of Cannon.js with better module support and compatibility for WebGL fallback scenarios

---

## 25. FINAL CHECKLIST FOR COPILOT PROMPT

Before submitting to GitHub Copilot, verify:

- [ ] WebGPU + WebGL 2.0 fallback architecture specified clearly
- [ ] Target hardware explicitly defined (S24 Ultra + RTX 2080 Ti)
- [ ] Physics engine: Rapier3D (primary) + Cannon-es (fallback) selected
- [ ] Playfield layout fully defined (circular top, square bottom "upside-down U")
- [ ] Pin layout with 45-50 pegs in a staggered grid specified
- [ ] Pop-bumpers (6x), ramps (2x), targets (5x) positioned and parameterized
- [ ] Jackpot funnel + 10-ball accumulation requirement detailed
- [ ] Mortar cannon: power/angle/rotation controls mapped to input devices
- [ ] Rapid-fire unlock: all 5 targets completed trigger (0.4s cooldown enabled)
- [ ] Flippers: activation timing (< 5ms latency), restitution boost, motor torque specified
- [ ] Scoring system: per-event points, session multiplier, jackpot multiplier logic detailed
- [ ] Ball economy: 2000 starting balls, drain detection, free ball awards specified
- [ ] Reel spinning: 2.0s duration, easing curve, symbol randomisation (GPU noise RNG) specified
- [ ] Input mapping: keyboard (W/S/A/D/Z/?/↑↓/Spacebar), mouse (wheel/XY/clicks), touch (swipe/tap/drag), all listed
- [ ] UI layout: portrait mode, dial widget, fire button, jackpot handle positioned
- [ ] Rendering pipeline: WebGPU passes, shadow mapping, PBR materials, post-process effects specified
- [ ] Audio: jsfxr library, 14 SFX types, Web Audio API integration specified
- [ ] Persistence: localStorage for high scores + leaderboard detailed
- [ ] Fallback strategy: WebGPU → WebGL 2.0 → error handling specified
- [ ] Performance targets: 60 FPS S24 Ultra, 55+ FPS RTX 2080 Ti specified
- [ ] No external assets (all procedural generation) reinforced
- [ ] Complete source code deliverables listed (HTML, JavaScript, physics, rendering, audio, UI, persistence)

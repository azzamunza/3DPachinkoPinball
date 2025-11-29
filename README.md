# 3D Hybrid Pachinko/Pinball Simulation

Demo: (https://azzamunza.github.io/3DPachinkoPinball/src/)

A high-performance browser-based 3D game combining Pachinko and Pinball mechanics.

![Game Screenshot](https://github.com/user-attachments/assets/b1f04ce1-2a83-45d1-abec-7b04caf392b0)

## Features

- **3D Graphics**: WebGPU detection with WebGL 2.0 fallback using Three.js
- **Physics**: Cannon-es physics engine with realistic ball physics
- **Gameplay**: Hybrid Pachinko/Pinball with tilted playing surface
- **15+ Concurrent Balls**: Object pooling for optimal performance
- **Mortar Cannon**: Mouse-driven targeting with adjustable power
- **Dual Flippers**: Authentic pinball-style paddles with rubber tips
- **Jackpot Slot Machine**: Embedded digital slot machine flush with playing surface
- **LED Backlighting**: Vibrant pinball-style illumination (no direct lights)
- **Return Ramps**: Balls can travel back to top via flipper-aligned ramps
- **Authentic Pachinko Layout**: Vintage-style pin patterns with arcs and diamond formations
- **Scoring System**: Combos, multipliers, and achievements
- **Ball Economy**: 2000 starting balls with various ways to earn more
- **High Scores**: localStorage persistence for leaderboard
- **Responsive Design**: Works on desktop and mobile devices

## Recent Updates

### Gameplay Improvements
- **Mouse-Driven Targeting**: Target dot now follows mouse position directly; cannon automatically aims from its world position to the target
- **Middle Mouse Button Firing**: Click fires cannon; click and hold for rapid fire (10 balls at 5 balls/second)
- **Default Power**: Mortar cannon power set to 2.0 by default
- **Tilted Playing Surface**: Playfield tilts back at the top with a ball catcher section for the mortar cannon
- **Semi-Circular Top**: Decorative arch-shaped top with LED lights

### Visual Improvements
- **LED Backlighting**: All direct lighting replaced with backlit LEDs for authentic pinball illumination
- **Authentic Flipper Design**: Proper pinball paddle shapes with tapered ends and rubber tips
- **Flush Jackpot Machine**: Digital jackpot machine surface is flush with the playing surface
- **Pins Contact Surface**: All Pachinko pins/pegs positioned at the back playing surface

## Project Structure

```
src/
├── index.html          # Main HTML file with canvas and UI
├── css/
│   └── main.css        # Styling and responsive layout
└── js/
    ├── main.js         # Entry point
    ├── game.js         # Main game orchestration
    ├── config.js       # Configuration constants
    ├── renderer.js     # Three.js rendering
    ├── physics.js      # Cannon-es physics
    ├── playfield.js    # Game board creation
    ├── cannon.js       # Mortar cannon system
    ├── flippers.js     # Flipper controls
    ├── jackpot.js      # Slot machine
    ├── score.js        # Scoring system
    ├── balls.js        # Ball management
    ├── audio.js        # Sound effects
    ├── input.js        # Input handling
    ├── ui.js           # UI management
    └── storage.js      # localStorage persistence
```

## How to Play

### Controls (Desktop)
- **Fire Cannon**: Middle Mouse Button (rapid fire when held)
- **Cannon Rotation**: A/D or Mouse X movement
- **Cannon Elevation**: W/S or Arrow Keys
- **Cannon Power**: Mouse Wheel or hold Fire button
- **Cannon Aiming**: Move mouse to position target dot
- **Left Flipper**: Z, Q, Left Shift, or Left Click
- **Right Flipper**: /, E, Right Shift, or Right Click
- **Jackpot**: J key or click handle when ready

### Controls (Mobile)
- **Fire**: Tap fire button or swipe up on screen
- **Cannon Aim**: Swipe/drag on screen
- **Flippers**: Tap left/right side of screen
- **Jackpot**: Drag handle down when ready

## Running the Game

1. Serve the files using any HTTP server:
   ```bash
   python3 -m http.server 8080
   ```

2. Open in browser:
   ```
   http://localhost:8080/src/
   ```

## Technical Details

- **Rendering**: Three.js r160 with PBR materials
- **Physics**: Cannon-es with 8 substeps for accurate simulation
- **Audio**: Procedural sound generation (jsfxr-style)
- **Target Performance**: 60 FPS on modern devices

## Limitations & Notes

### AI Image Generation (Requirement #12)
I am unable to generate AI images directly. As a code-focused assistant, I cannot create or generate image files. However, the game uses procedurally generated textures through JavaScript Canvas API which provide:
- Wooden background with cosmic accents
- Symbol textures for the jackpot machine
- LED and neon effects

For custom textures, you would need to:
1. Use an external AI image generation service (DALL-E, Midjourney, Stable Diffusion)
2. Create textures manually in image editing software
3. Use royalty-free texture libraries

### Other Considerations
- The YouTube reference video for lighting could not be accessed directly, but pinball-style LED backlighting has been implemented based on known pinball machine aesthetics
- The vintage Pachinko reference image was used as a guide for pin layout patterns

## Browser Support

- Chrome 120+ (Full WebGPU/WebGL2)
- Edge 120+ (Full WebGPU/WebGL2)
- Firefox 130+ (WebGL2, WebGPU experimental)
- Safari 17.2+ (WebGL2, WebGPU experimental)

# 3D Hybrid Pachinko/Pinball Simulation

Demo: (https://azzamunza.github.io/3DPachinkoPinball/src/)

A high-performance browser-based 3D game combining Pachinko and Pinball mechanics.

![Game Screenshot](https://github.com/user-attachments/assets/b1f04ce1-2a83-45d1-abec-7b04caf392b0)

## Features

- **3D Graphics**: WebGPU detection with WebGL 2.0 fallback using Three.js
- **Physics**: Cannon-es physics engine with realistic ball physics
- **Gameplay**: Hybrid Pachinko/Pinball with "Upside-Down U" layout
- **15+ Concurrent Balls**: Object pooling for optimal performance
- **Mortar Cannon**: Adjustable power, rotation, and elevation
- **Dual Flippers**: Responsive physics-based flippers
- **Jackpot Slot Machine**: 3D spinning reels with various payouts
- **Scoring System**: Combos, multipliers, and achievements
- **Ball Economy**: 2000 starting balls with various ways to earn more
- **High Scores**: localStorage persistence for leaderboard
- **Responsive Design**: Works on desktop and mobile devices

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
- **Fire Cannon**: Space or Left Click
- **Cannon Rotation**: A/D or Mouse X movement
- **Cannon Elevation**: W/S or Arrow Keys
- **Cannon Power**: Mouse Wheel or hold Fire button
- **Left Flipper**: Z, Q, or Left Shift
- **Right Flipper**: /, E, or Right Shift
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

## Browser Support

- Chrome 120+ (Full WebGPU/WebGL2)
- Edge 120+ (Full WebGPU/WebGL2)
- Firefox 130+ (WebGL2, WebGPU experimental)
- Safari 17.2+ (WebGL2, WebGPU experimental)

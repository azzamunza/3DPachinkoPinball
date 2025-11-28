# Dancing Dragons Jackpot Machine
## Pachinko Pinball Edition

A slot machine game based on CT Interactive's "Dancing Dragons" slot, 
redesigned with Pachinko and Pinball themed visuals.

## Features

- **5x3 Reel Grid**: Classic 5-reel, 3-row slot layout
- **10 Fixed Paylines**: Standard payline configuration
- **Expanding Wilds**: Dragon wild symbols expand to cover entire reels
- **Scatter Pays**: Yin Yang scatter symbols pay anywhere on the reels
- **Gamble Feature**: Double your wins with red/black card game
- **Pachinko/Pinball Theme**: Custom AI-generated symbols with neon arcade aesthetics

## Symbols

| Symbol | Name | Type | Description |
|--------|------|------|-------------|
| 🐉 | Dragon | Wild | Expands to cover reel (reels 2-4 only) |
| ☯️ | Yin Yang | Scatter | Pays anywhere, 3+ for scatter win |
| 🏮 | Red Lantern | High | Highest paying regular symbol |
| 🪙 | Gold Ingot | High | High value symbol |
| 💰 | Ancient Coin | High | High value symbol |
| 🪭 | Golden Fan | Medium | Medium value symbol |
| 🗿 | Golden Buddha | Medium | Medium value symbol |
| A, K, Q, J, 10 | Card Values | Low | Low value symbols |

## Game Logic Reference

This implementation is based on the game logic structure from:
- slotopol/server (https://github.com/slotopol/server)
- Specifically the CT Interactive game templates

## How to Play

1. Set your bet amount using +/- buttons
2. Click SPIN or press SPACEBAR to spin the reels
3. Match 3+ symbols on a payline to win
4. Dragon wilds substitute for all symbols except scatters
5. Land 3+ Yin Yang scatters anywhere for scatter pays
6. After a win, optionally use the Gamble feature to double your winnings

## Running the Game

Serve the files using any HTTP server:

```bash
cd JackpotMachine
python3 -m http.server 8080
```

Then open: http://localhost:8080/

## Credits

- Original Dancing Dragons concept by CT Interactive
- Pachinko/Pinball themed adaptation for 3DPachinkoPinball project
- Symbol artwork procedurally generated with canvas API

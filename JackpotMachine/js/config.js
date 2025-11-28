/**
 * Dancing Dragons Jackpot Machine
 * Configuration and Constants
 * 
 * Based on CT Interactive's Dancing Dragons slot machine
 * Adapted for Pachinko Pinball themed visuals
 * Reference: https://www.slotsmate.com/software/ct-interactive/dancing-dragons
 * Using slotopol/server game logic structure
 */

export const CONFIG = {
    // Game Info
    GAME_NAME: 'Dancing Dragons',
    GAME_SUBTITLE: 'Pachinko Pinball Edition',
    VERSION: '1.0.0',
    
    // Reel Configuration (5x3 grid like Dancing Dragons)
    REELS: {
        COUNT: 5,
        ROWS: 3,
        SYMBOL_HEIGHT: 100,
        SPIN_DURATION: 2000,
        REEL_DELAY: 200, // ms between each reel stopping
        EXTRA_SPINS: 3,   // Extra rotations during spin
    },
    
    // Symbol Definitions
    // Based on Dancing Dragons: Dragon (wild), Yin Yang (scatter), themed symbols
    SYMBOLS: {
        // Wild - Dragon (appears on reels 2, 3, 4 only, can expand)
        DRAGON: {
            id: 1,
            name: 'Dragon',
            type: 'wild',
            image: 'dragon.svg',
            expandingWild: true,
            reels: [1, 2, 3], // 0-indexed: reels 2, 3, 4
            pays: [0, 0, 0, 0, 0], // Wild doesn't pay on its own in Dancing Dragons
        },
        // Scatter - Yin Yang
        YIN_YANG: {
            id: 2,
            name: 'Yin Yang',
            type: 'scatter',
            image: 'yinyang.svg',
            pays: [0, 0, 5, 20, 100], // Scatter pays (multiplied by total bet)
        },
        // High Value Symbols
        LANTERN: {
            id: 3,
            name: 'Red Lantern',
            type: 'high',
            image: 'lantern.svg',
            pays: [0, 10, 50, 200, 1000], // Highest paying regular symbol
        },
        GOLD_INGOT: {
            id: 4,
            name: 'Gold Ingot',
            type: 'high',
            image: 'ingot.svg',
            pays: [0, 5, 30, 100, 500],
        },
        COIN: {
            id: 5,
            name: 'Ancient Coin',
            type: 'high',
            image: 'coin.svg',
            pays: [0, 5, 30, 100, 500],
        },
        FAN: {
            id: 6,
            name: 'Golden Fan',
            type: 'medium',
            image: 'fan.svg',
            pays: [0, 0, 20, 50, 200],
        },
        BUDDHA: {
            id: 7,
            name: 'Golden Buddha',
            type: 'medium',
            image: 'buddha.svg',
            pays: [0, 0, 20, 50, 200],
        },
        // Low Value Symbols (Card Values)
        ACE: {
            id: 8,
            name: 'Ace',
            type: 'low',
            image: 'ace.svg',
            pays: [0, 0, 10, 30, 100],
        },
        KING: {
            id: 9,
            name: 'King',
            type: 'low',
            image: 'king.svg',
            pays: [0, 0, 10, 30, 100],
        },
        QUEEN: {
            id: 10,
            name: 'Queen',
            type: 'low',
            image: 'queen.svg',
            pays: [0, 0, 10, 30, 100],
        },
        JACK: {
            id: 11,
            name: 'Jack',
            type: 'low',
            image: 'jack.svg',
            pays: [0, 0, 10, 30, 100],
        },
        TEN: {
            id: 12,
            name: 'Ten',
            type: 'low',
            image: 'ten.svg',
            pays: [0, 0, 10, 30, 100],
        },
    },
    
    // Symbol order by ID for quick lookup
    SYMBOL_ORDER: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    
    // Reel Strips (weighted symbol distribution)
    // Based on typical CT Interactive RTP ~95%
    REEL_STRIPS: [
        // Reel 1 (no wild)
        [3, 8, 5, 9, 7, 10, 4, 11, 6, 12, 3, 8, 5, 9, 2, 10, 4, 11, 6, 12, 
         3, 8, 5, 9, 7, 10, 4, 11, 6, 12, 3, 8],
        // Reel 2 (has wild)
        [3, 8, 1, 9, 7, 10, 4, 11, 6, 12, 3, 8, 5, 9, 2, 10, 4, 11, 1, 12,
         3, 8, 5, 9, 7, 10, 4, 11, 6, 12, 3, 8],
        // Reel 3 (has wild)
        [3, 8, 5, 9, 1, 10, 4, 11, 6, 12, 3, 8, 5, 9, 2, 10, 4, 11, 6, 12,
         3, 8, 1, 9, 7, 10, 4, 11, 6, 12, 3, 8],
        // Reel 4 (has wild)
        [3, 8, 5, 9, 7, 10, 1, 11, 6, 12, 3, 8, 5, 9, 2, 10, 4, 11, 6, 12,
         3, 8, 5, 1, 7, 10, 4, 11, 6, 12, 3, 8],
        // Reel 5 (no wild)
        [3, 8, 5, 9, 7, 10, 4, 11, 6, 12, 3, 8, 5, 9, 2, 10, 4, 11, 6, 12,
         3, 8, 5, 9, 7, 10, 4, 11, 6, 12, 3, 8],
    ],
    
    // Paylines (10 fixed lines like Dancing Dragons)
    // Format: [reel1_row, reel2_row, reel3_row, reel4_row, reel5_row] (0-indexed)
    PAYLINES: [
        [1, 1, 1, 1, 1], // Line 1: Middle horizontal
        [0, 0, 0, 0, 0], // Line 2: Top horizontal
        [2, 2, 2, 2, 2], // Line 3: Bottom horizontal
        [0, 1, 2, 1, 0], // Line 4: V shape
        [2, 1, 0, 1, 2], // Line 5: Inverted V
        [0, 0, 1, 2, 2], // Line 6: Diagonal down
        [2, 2, 1, 0, 0], // Line 7: Diagonal up
        [1, 0, 0, 0, 1], // Line 8: Top bump
        [1, 2, 2, 2, 1], // Line 9: Bottom bump
        [1, 0, 1, 0, 1], // Line 10: Zigzag
    ],
    
    // Payline Colors (for visual display)
    PAYLINE_COLORS: [
        '#ff0000', // Line 1 - Red
        '#00ff00', // Line 2 - Green
        '#0000ff', // Line 3 - Blue
        '#ffff00', // Line 4 - Yellow
        '#ff00ff', // Line 5 - Magenta
        '#00ffff', // Line 6 - Cyan
        '#ff8800', // Line 7 - Orange
        '#88ff00', // Line 8 - Lime
        '#8800ff', // Line 9 - Purple
        '#00ff88', // Line 10 - Teal
    ],
    
    // Betting Configuration
    BETTING: {
        LINES: 10, // Fixed 10 lines
        MIN_BET: 1,
        MAX_BET: 100,
        BET_LEVELS: [1, 2, 5, 10, 20, 50, 100],
        DEFAULT_BET: 10,
        STARTING_BALANCE: 10000,
    },
    
    // Gamble Feature
    GAMBLE: {
        ENABLED: true,
        MAX_GAMBLE_AMOUNT: 50000,
        HISTORY_SIZE: 6,
        CARDS: ['♠', '♥', '♦', '♣'],
        RED_CARDS: ['♥', '♦'],
        BLACK_CARDS: ['♠', '♣'],
    },
    
    // Win Thresholds (multiplied by total bet)
    WIN_THRESHOLDS: {
        SMALL: 5,      // Small win animation
        MEDIUM: 20,    // Medium win animation
        BIG: 50,       // Big win celebration
        MEGA: 100,     // Mega win celebration
        JACKPOT: 500,  // Jackpot celebration
    },
    
    // Audio Configuration
    AUDIO: {
        ENABLED: true,
        MASTER_VOLUME: 0.7,
        SOUNDS: {
            spin: { frequency: 200, duration: 0.1, type: 'square' },
            reelStop: { frequency: 150, duration: 0.05, type: 'sine' },
            win: { frequency: 600, duration: 0.3, type: 'sine' },
            bigWin: { frequency: 800, duration: 0.5, type: 'sawtooth' },
            scatter: { frequency: 1000, duration: 0.4, type: 'triangle' },
            button: { frequency: 400, duration: 0.05, type: 'square' },
            gambleWin: { frequency: 700, duration: 0.3, type: 'sine' },
            gambleLose: { frequency: 150, duration: 0.5, type: 'sawtooth' },
        },
    },
    
    // Visual Effects
    EFFECTS: {
        EXPANDING_WILD_DURATION: 500,
        WIN_ANIMATION_DURATION: 2000,
        CELEBRATION_DURATION: 3000,
        PAYLINE_FLASH_DURATION: 1000,
    },
};

// Symbol lookup helper
export function getSymbolById(id) {
    const symbols = CONFIG.SYMBOLS;
    for (const key in symbols) {
        if (symbols[key].id === id) {
            return { key, ...symbols[key] };
        }
    }
    return null;
}

// Get symbol pays
export function getSymbolPays(symbolId, count) {
    const symbol = getSymbolById(symbolId);
    if (symbol && symbol.pays && count >= 1 && count <= 5) {
        return symbol.pays[count - 1];
    }
    return 0;
}

// Check if symbol is wild
export function isWild(symbolId) {
    const symbol = getSymbolById(symbolId);
    return symbol && symbol.type === 'wild';
}

// Check if symbol is scatter
export function isScatter(symbolId) {
    const symbol = getSymbolById(symbolId);
    return symbol && symbol.type === 'scatter';
}

export default CONFIG;

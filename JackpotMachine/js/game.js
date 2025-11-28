/**
 * Dancing Dragons Jackpot Machine
 * Main Game Logic
 * 
 * Based on CT Interactive's Dancing Dragons slot machine
 * Reference: slotopol/server game structure
 */

import { CONFIG, getSymbolById, getSymbolPays, isWild, isScatter } from './config.js';
import { AudioManager } from './audio.js';
import { SymbolRenderer } from './symbols.js';

class DancingDragonsGame {
    constructor() {
        // Game State
        this.balance = CONFIG.BETTING.STARTING_BALANCE;
        this.bet = CONFIG.BETTING.DEFAULT_BET;
        this.totalBet = this.bet * CONFIG.BETTING.LINES;
        this.isSpinning = false;
        this.autoSpinActive = false;
        this.autoSpinCount = 0;
        
        // Reel State
        this.reels = [];
        this.displayedSymbols = []; // 5x3 grid of currently displayed symbols
        this.reelPositions = [0, 0, 0, 0, 0];
        
        // Win State
        this.currentWin = 0;
        this.winningLines = [];
        this.expandingWilds = [];
        
        // Gamble State
        this.gambleWin = 0;
        this.gambleHistory = [];
        
        // Managers
        this.audio = null;
        this.symbolRenderer = null;
        
        // DOM Elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log(`Initializing ${CONFIG.GAME_NAME} v${CONFIG.VERSION}`);
        
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize audio
        this.audio = new AudioManager();
        
        // Initialize symbol renderer
        this.symbolRenderer = new SymbolRenderer();
        await this.symbolRenderer.generateAllSymbols();
        
        // Setup reels
        this.setupReels();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial UI update
        this.updateUI();
        
        // Hide loading screen
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
        }, 2500);
        
        console.log('Game initialized successfully');
    }
    
    cacheElements() {
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            balanceValue: document.getElementById('balance-value'),
            betValue: document.getElementById('bet-value'),
            linesValue: document.getElementById('lines-value'),
            totalBetValue: document.getElementById('total-bet-value'),
            winDisplay: document.getElementById('win-display'),
            winAmount: document.getElementById('win-amount'),
            reelsContainer: document.getElementById('reels-container'),
            reels: [],
            paylinesSvg: document.getElementById('paylines-svg'),
            btnSpin: document.getElementById('btn-spin'),
            btnBetUp: document.getElementById('btn-bet-up'),
            btnBetDown: document.getElementById('btn-bet-down'),
            btnAutoSpin: document.getElementById('btn-auto-spin'),
            btnMaxBet: document.getElementById('btn-max-bet'),
            btnSettings: document.getElementById('btn-settings'),
            btnPaytable: document.getElementById('btn-paytable'),
            btnSound: document.getElementById('btn-sound'),
            gambleModal: document.getElementById('gamble-modal'),
            gambleCard: document.getElementById('gamble-card'),
            gambleWin: document.getElementById('gamble-win'),
            gamblePotential: document.getElementById('gamble-potential'),
            gambleHistory: document.getElementById('gamble-history-cards'),
            btnGambleRed: document.getElementById('btn-gamble-red'),
            btnGambleBlack: document.getElementById('btn-gamble-black'),
            btnCollect: document.getElementById('btn-collect'),
            paytableModal: document.getElementById('paytable-modal'),
            paytableGrid: document.getElementById('paytable-grid'),
            closePaytable: document.getElementById('close-paytable'),
            celebrationOverlay: document.getElementById('celebration-overlay'),
            celebrationTitle: document.getElementById('celebration-title'),
            celebrationAmount: document.getElementById('celebration-amount'),
            paylineIndicators: document.querySelectorAll('.payline-indicator'),
        };
        
        // Cache reel elements
        for (let i = 0; i < CONFIG.REELS.COUNT; i++) {
            this.elements.reels.push(document.getElementById(`reel-${i}`));
        }
    }
    
    setupReels() {
        // Initialize displayed symbols with random positions
        for (let i = 0; i < CONFIG.REELS.COUNT; i++) {
            const strip = CONFIG.REEL_STRIPS[i];
            const startPos = Math.floor(Math.random() * strip.length);
            this.reelPositions[i] = startPos;
            
            // Create reel strip elements
            this.createReelStrip(i);
        }
        
        // Update display
        this.updateReelDisplay();
    }
    
    createReelStrip(reelIndex) {
        const reel = this.elements.reels[reelIndex];
        const strip = reel.querySelector('.reel-strip');
        strip.innerHTML = '';
        
        const reelStrip = CONFIG.REEL_STRIPS[reelIndex];
        const symbolsToShow = CONFIG.REELS.ROWS + 2; // Extra for smooth scrolling
        
        // Create symbol elements
        for (let i = 0; i < reelStrip.length + symbolsToShow; i++) {
            const symbolId = reelStrip[i % reelStrip.length];
            const symbolEl = this.createSymbolElement(symbolId);
            strip.appendChild(symbolEl);
        }
    }
    
    createSymbolElement(symbolId) {
        const symbolData = getSymbolById(symbolId);
        const div = document.createElement('div');
        div.className = 'symbol';
        div.dataset.symbolId = symbolId;
        
        // Use canvas-generated symbol image
        const canvas = this.symbolRenderer.getSymbolCanvas(symbolId);
        if (canvas) {
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.className = 'symbol-image';
            img.alt = symbolData.name;
            div.appendChild(img);
        } else {
            // Fallback to emoji representation
            div.innerHTML = `<span class="symbol-image">${this.getSymbolEmoji(symbolId)}</span>`;
        }
        
        return div;
    }
    
    getSymbolEmoji(symbolId) {
        const emojiMap = {
            1: '🐉', // Dragon (Wild)
            2: '☯️', // Yin Yang (Scatter)
            3: '🏮', // Lantern
            4: '🪙', // Gold Ingot
            5: '💰', // Coin
            6: '🪭', // Fan
            7: '🗿', // Buddha
            8: '🅰️', // Ace
            9: '🔷', // King
            10: '👸', // Queen
            11: '🃏', // Jack
            12: '🔟', // Ten
        };
        return emojiMap[symbolId] || '❓';
    }
    
    updateReelDisplay() {
        for (let i = 0; i < CONFIG.REELS.COUNT; i++) {
            const strip = this.elements.reels[i].querySelector('.reel-strip');
            const pos = this.reelPositions[i];
            const offset = pos * CONFIG.REELS.SYMBOL_HEIGHT;
            strip.style.transform = `translateY(-${offset}px)`;
        }
        
        // Update displayed symbols grid
        this.displayedSymbols = [];
        for (let col = 0; col < CONFIG.REELS.COUNT; col++) {
            this.displayedSymbols[col] = [];
            const reelStrip = CONFIG.REEL_STRIPS[col];
            const pos = this.reelPositions[col];
            
            for (let row = 0; row < CONFIG.REELS.ROWS; row++) {
                const idx = (pos + row) % reelStrip.length;
                this.displayedSymbols[col][row] = reelStrip[idx];
            }
        }
    }
    
    setupEventListeners() {
        // Spin button
        this.elements.btnSpin.addEventListener('click', () => this.spin());
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.spin();
            }
        });
        
        // Bet controls
        this.elements.btnBetUp.addEventListener('click', () => this.changeBet(1));
        this.elements.btnBetDown.addEventListener('click', () => this.changeBet(-1));
        this.elements.btnMaxBet.addEventListener('click', () => this.setMaxBet());
        
        // Auto spin
        this.elements.btnAutoSpin.addEventListener('click', () => this.toggleAutoSpin());
        
        // Sound toggle
        this.elements.btnSound.addEventListener('click', () => this.toggleSound());
        
        // Paytable
        this.elements.btnPaytable.addEventListener('click', () => this.showPaytable());
        this.elements.closePaytable.addEventListener('click', () => this.hidePaytable());
        
        // Gamble buttons
        this.elements.btnGambleRed.addEventListener('click', () => this.gamble('red'));
        this.elements.btnGambleBlack.addEventListener('click', () => this.gamble('black'));
        this.elements.btnCollect.addEventListener('click', () => this.collectGamble());
    }
    
    changeBet(direction) {
        if (this.isSpinning) return;
        
        const levels = CONFIG.BETTING.BET_LEVELS;
        const currentIndex = levels.indexOf(this.bet);
        const newIndex = Math.max(0, Math.min(levels.length - 1, currentIndex + direction));
        
        this.bet = levels[newIndex];
        this.totalBet = this.bet * CONFIG.BETTING.LINES;
        
        this.audio.playSound('button');
        this.updateUI();
    }
    
    setMaxBet() {
        if (this.isSpinning) return;
        
        this.bet = CONFIG.BETTING.MAX_BET;
        this.totalBet = this.bet * CONFIG.BETTING.LINES;
        
        this.audio.playSound('button');
        this.updateUI();
    }
    
    toggleAutoSpin() {
        this.autoSpinActive = !this.autoSpinActive;
        this.elements.btnAutoSpin.classList.toggle('active', this.autoSpinActive);
        
        if (this.autoSpinActive && !this.isSpinning) {
            this.spin();
        }
        
        this.audio.playSound('button');
    }
    
    toggleSound() {
        this.audio.toggleMute();
        this.elements.btnSound.classList.toggle('muted');
        this.elements.btnSound.textContent = this.audio.isMuted ? '🔇' : '🔊';
    }
    
    async spin() {
        if (this.isSpinning) return;
        if (this.balance < this.totalBet) {
            this.showMessage('Insufficient balance!');
            return;
        }
        
        // Deduct bet
        this.balance -= this.totalBet;
        this.currentWin = 0;
        this.winningLines = [];
        this.expandingWilds = [];
        
        // Update UI
        this.hideWinDisplay();
        this.clearWinningSymbols();
        this.updateUI();
        
        // Start spinning
        this.isSpinning = true;
        this.elements.btnSpin.classList.add('spinning');
        this.elements.btnSpin.disabled = true;
        
        this.audio.playSound('spin');
        
        // Animate reels
        await this.animateReels();
        
        // Check for expanding wilds
        await this.handleExpandingWilds();
        
        // Calculate wins
        this.calculateWins();
        
        // Show results
        await this.showResults();
        
        // End spin
        this.isSpinning = false;
        this.elements.btnSpin.classList.remove('spinning');
        this.elements.btnSpin.disabled = false;
        
        // Handle auto spin
        if (this.autoSpinActive && this.balance >= this.totalBet) {
            setTimeout(() => this.spin(), 1000);
        }
    }
    
    async animateReels() {
        const promises = [];
        
        for (let i = 0; i < CONFIG.REELS.COUNT; i++) {
            const delay = i * CONFIG.REELS.REEL_DELAY;
            
            promises.push(new Promise(resolve => {
                setTimeout(() => {
                    this.spinReel(i).then(resolve);
                }, delay);
            }));
        }
        
        await Promise.all(promises);
    }
    
    async spinReel(reelIndex) {
        return new Promise(resolve => {
            const reel = this.elements.reels[reelIndex];
            const strip = reel.querySelector('.reel-strip');
            const reelStrip = CONFIG.REEL_STRIPS[reelIndex];
            
            // Calculate new position
            const extraSpins = CONFIG.REELS.EXTRA_SPINS * reelStrip.length;
            const newPos = Math.floor(Math.random() * reelStrip.length);
            const totalMove = extraSpins + newPos - this.reelPositions[reelIndex];
            
            // Add spinning class
            reel.classList.add('spinning');
            
            // Animate
            const targetOffset = (this.reelPositions[reelIndex] + totalMove) * CONFIG.REELS.SYMBOL_HEIGHT;
            strip.style.transition = `transform ${CONFIG.REELS.SPIN_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
            strip.style.transform = `translateY(-${targetOffset}px)`;
            
            // Wait for animation
            setTimeout(() => {
                reel.classList.remove('spinning');
                this.reelPositions[reelIndex] = newPos;
                this.audio.playSound('reelStop');
                
                // Reset position for loop
                strip.style.transition = 'none';
                const offset = newPos * CONFIG.REELS.SYMBOL_HEIGHT;
                strip.style.transform = `translateY(-${offset}px)`;
                
                resolve();
            }, CONFIG.REELS.SPIN_DURATION);
        });
    }
    
    async handleExpandingWilds() {
        // Update displayed symbols first
        this.updateReelDisplay();
        
        // Check for wilds on reels 2, 3, 4 (indices 1, 2, 3)
        for (let col = 1; col <= 3; col++) {
            for (let row = 0; row < CONFIG.REELS.ROWS; row++) {
                if (isWild(this.displayedSymbols[col][row])) {
                    // Expand wild to cover entire reel
                    this.expandingWilds.push(col);
                    
                    // Mark all positions in this reel as wild
                    for (let r = 0; r < CONFIG.REELS.ROWS; r++) {
                        this.displayedSymbols[col][r] = CONFIG.SYMBOLS.DRAGON.id;
                    }
                    
                    break; // Only expand once per reel
                }
            }
        }
        
        // Animate expanding wilds
        if (this.expandingWilds.length > 0) {
            await this.animateExpandingWilds();
        }
    }
    
    async animateExpandingWilds() {
        return new Promise(resolve => {
            this.audio.playSound('scatter');
            
            // Add expanding wild animation
            for (const col of this.expandingWilds) {
                const reel = this.elements.reels[col];
                const symbols = reel.querySelectorAll('.symbol');
                
                symbols.forEach((sym, idx) => {
                    if (idx >= this.reelPositions[col] && idx < this.reelPositions[col] + CONFIG.REELS.ROWS) {
                        sym.classList.add('expanding-wild');
                        
                        // Replace with dragon symbol
                        const canvas = this.symbolRenderer.getSymbolCanvas(CONFIG.SYMBOLS.DRAGON.id);
                        if (canvas) {
                            const img = sym.querySelector('.symbol-image');
                            if (img) {
                                img.src = canvas.toDataURL();
                            }
                        }
                    }
                });
            }
            
            setTimeout(resolve, CONFIG.EFFECTS.EXPANDING_WILD_DURATION);
        });
    }
    
    calculateWins() {
        let totalWin = 0;
        this.winningLines = [];
        
        // Check each payline
        for (let lineIdx = 0; lineIdx < CONFIG.PAYLINES.length; lineIdx++) {
            const line = CONFIG.PAYLINES[lineIdx];
            const result = this.evaluateLine(line, lineIdx);
            
            if (result.win > 0) {
                totalWin += result.win * this.bet;
                this.winningLines.push({
                    line: lineIdx,
                    ...result,
                    totalWin: result.win * this.bet,
                });
            }
        }
        
        // Check scatter wins
        const scatterResult = this.evaluateScatters();
        if (scatterResult.win > 0) {
            totalWin += scatterResult.win * this.totalBet;
            this.winningLines.push({
                line: -1, // Scatter indicator
                ...scatterResult,
                totalWin: scatterResult.win * this.totalBet,
            });
        }
        
        this.currentWin = totalWin;
    }
    
    evaluateLine(line, lineIdx) {
        // Get symbols on this line
        const symbols = [];
        const positions = [];
        
        for (let col = 0; col < CONFIG.REELS.COUNT; col++) {
            const row = line[col];
            symbols.push(this.displayedSymbols[col][row]);
            positions.push({ col, row });
        }
        
        // Count matching symbols from left
        let firstSymbol = null;
        let count = 0;
        let wildCount = 0;
        
        for (let i = 0; i < symbols.length; i++) {
            const sym = symbols[i];
            
            if (isWild(sym)) {
                // Wild substitutes for any symbol
                wildCount++;
                count++;
            } else if (isScatter(sym)) {
                // Scatter doesn't count on lines
                break;
            } else if (firstSymbol === null) {
                firstSymbol = sym;
                count++;
            } else if (sym === firstSymbol) {
                count++;
            } else {
                break;
            }
        }
        
        // Calculate pay
        if (count >= 3 && firstSymbol !== null) {
            const pay = getSymbolPays(firstSymbol, count);
            if (pay > 0) {
                return {
                    symbol: firstSymbol,
                    count,
                    wildCount,
                    positions: positions.slice(0, count),
                    win: pay,
                };
            }
        }
        
        // Check for wild-only wins (count >= 2 wilds from left)
        if (wildCount >= 2 && count === wildCount) {
            // Wilds on their own don't pay in Dancing Dragons
            return { win: 0 };
        }
        
        return { win: 0 };
    }
    
    evaluateScatters() {
        // Count scatter symbols anywhere on the reels
        let scatterCount = 0;
        const positions = [];
        
        for (let col = 0; col < CONFIG.REELS.COUNT; col++) {
            for (let row = 0; row < CONFIG.REELS.ROWS; row++) {
                if (isScatter(this.displayedSymbols[col][row])) {
                    scatterCount++;
                    positions.push({ col, row });
                }
            }
        }
        
        // Scatter pays for 3+ anywhere
        if (scatterCount >= 3) {
            const pay = getSymbolPays(CONFIG.SYMBOLS.YIN_YANG.id, scatterCount);
            return {
                symbol: CONFIG.SYMBOLS.YIN_YANG.id,
                count: scatterCount,
                positions,
                win: pay,
                isScatter: true,
            };
        }
        
        return { win: 0 };
    }
    
    async showResults() {
        if (this.currentWin > 0) {
            // Update balance
            this.balance += this.currentWin;
            
            // Show win display
            this.showWinDisplay(this.currentWin);
            
            // Highlight winning symbols
            this.highlightWinningSymbols();
            
            // Play win sound
            const winRatio = this.currentWin / this.totalBet;
            if (winRatio >= CONFIG.WIN_THRESHOLDS.BIG) {
                await this.showCelebration(winRatio);
            } else {
                this.audio.playSound('win');
            }
            
            // Show gamble option
            if (CONFIG.GAMBLE.ENABLED && this.currentWin <= CONFIG.GAMBLE.MAX_GAMBLE_AMOUNT) {
                this.gambleWin = this.currentWin;
                // Could show gamble prompt here
            }
        }
        
        this.updateUI();
    }
    
    showWinDisplay(amount) {
        this.elements.winAmount.textContent = this.formatNumber(amount);
        this.elements.winDisplay.classList.remove('hidden');
    }
    
    hideWinDisplay() {
        this.elements.winDisplay.classList.add('hidden');
    }
    
    highlightWinningSymbols() {
        // Clear previous highlights
        this.clearWinningSymbols();
        
        // Add payline indicators
        for (const win of this.winningLines) {
            if (win.line >= 0) {
                // Highlight payline indicator
                this.elements.paylineIndicators[win.line].classList.add('active');
                
                // Highlight winning symbols
                for (const pos of win.positions) {
                    const reel = this.elements.reels[pos.col];
                    const symbols = reel.querySelectorAll('.symbol');
                    const symIdx = this.reelPositions[pos.col] + pos.row;
                    if (symbols[symIdx]) {
                        symbols[symIdx].classList.add('winning');
                    }
                }
            } else {
                // Scatter win - highlight all scatter positions
                for (const pos of win.positions) {
                    const reel = this.elements.reels[pos.col];
                    const symbols = reel.querySelectorAll('.symbol');
                    const symIdx = this.reelPositions[pos.col] + pos.row;
                    if (symbols[symIdx]) {
                        symbols[symIdx].classList.add('winning');
                    }
                }
            }
        }
    }
    
    clearWinningSymbols() {
        // Clear payline indicators
        this.elements.paylineIndicators.forEach(ind => ind.classList.remove('active'));
        
        // Clear symbol highlights
        for (const reel of this.elements.reels) {
            reel.querySelectorAll('.symbol').forEach(sym => {
                sym.classList.remove('winning', 'expanding-wild');
            });
        }
    }
    
    async showCelebration(winRatio) {
        let title = 'WIN!';
        
        if (winRatio >= CONFIG.WIN_THRESHOLDS.JACKPOT) {
            title = '🐉 JACKPOT! 🐉';
        } else if (winRatio >= CONFIG.WIN_THRESHOLDS.MEGA) {
            title = '💎 MEGA WIN! 💎';
        } else if (winRatio >= CONFIG.WIN_THRESHOLDS.BIG) {
            title = '🌟 BIG WIN! 🌟';
        }
        
        this.elements.celebrationTitle.textContent = title;
        this.elements.celebrationAmount.textContent = this.formatNumber(this.currentWin);
        this.elements.celebrationOverlay.classList.remove('hidden');
        
        this.audio.playSound('bigWin');
        
        return new Promise(resolve => {
            setTimeout(() => {
                this.elements.celebrationOverlay.classList.add('hidden');
                resolve();
            }, CONFIG.EFFECTS.CELEBRATION_DURATION);
        });
    }
    
    // Gamble Feature
    showGamble() {
        if (!CONFIG.GAMBLE.ENABLED || this.gambleWin <= 0) return;
        
        this.elements.gambleWin.textContent = this.formatNumber(this.gambleWin);
        this.elements.gamblePotential.textContent = this.formatNumber(this.gambleWin * 2);
        this.elements.gambleCard.textContent = '?';
        this.elements.gambleCard.className = 'gamble-card';
        this.elements.gambleModal.classList.remove('hidden');
    }
    
    gamble(choice) {
        if (this.gambleWin <= 0) return;
        
        // Pick random card
        const cards = CONFIG.GAMBLE.CARDS;
        const card = cards[Math.floor(Math.random() * cards.length)];
        const isRed = CONFIG.GAMBLE.RED_CARDS.includes(card);
        const isBlack = CONFIG.GAMBLE.BLACK_CARDS.includes(card);
        
        // Show card
        this.elements.gambleCard.textContent = card;
        this.elements.gambleCard.classList.add(isRed ? 'red' : 'black');
        
        // Add to history
        this.gambleHistory.unshift({ card, isRed });
        if (this.gambleHistory.length > CONFIG.GAMBLE.HISTORY_SIZE) {
            this.gambleHistory.pop();
        }
        this.updateGambleHistory();
        
        // Check result
        const win = (choice === 'red' && isRed) || (choice === 'black' && isBlack);
        
        if (win) {
            this.gambleWin *= 2;
            this.audio.playSound('gambleWin');
            this.elements.gambleWin.textContent = this.formatNumber(this.gambleWin);
            this.elements.gamblePotential.textContent = this.formatNumber(this.gambleWin * 2);
        } else {
            this.audio.playSound('gambleLose');
            this.gambleWin = 0;
            setTimeout(() => this.hideGamble(), 1000);
        }
    }
    
    collectGamble() {
        if (this.gambleWin > 0) {
            this.balance += this.gambleWin;
            this.currentWin = this.gambleWin;
            this.showWinDisplay(this.currentWin);
        }
        this.gambleWin = 0;
        this.hideGamble();
        this.updateUI();
    }
    
    hideGamble() {
        this.elements.gambleModal.classList.add('hidden');
    }
    
    updateGambleHistory() {
        this.elements.gambleHistory.innerHTML = '';
        for (const item of this.gambleHistory) {
            const div = document.createElement('div');
            div.className = `history-card ${item.isRed ? 'red' : 'black'}`;
            div.textContent = item.card;
            this.elements.gambleHistory.appendChild(div);
        }
    }
    
    // Paytable
    showPaytable() {
        this.generatePaytable();
        this.elements.paytableModal.classList.remove('hidden');
        this.audio.playSound('button');
    }
    
    hidePaytable() {
        this.elements.paytableModal.classList.add('hidden');
    }
    
    generatePaytable() {
        this.elements.paytableGrid.innerHTML = '';
        
        const symbols = Object.values(CONFIG.SYMBOLS);
        for (const symbol of symbols) {
            const item = document.createElement('div');
            item.className = 'paytable-item';
            
            const symbolEmoji = this.getSymbolEmoji(symbol.id);
            const pays = symbol.pays || [];
            const payText = pays.map((p, i) => p > 0 ? `${i + 1}× = ${p}` : '').filter(Boolean).join('<br>');
            
            item.innerHTML = `
                <div class="paytable-symbol">${symbolEmoji}</div>
                <div class="paytable-name">${symbol.name}</div>
                <div class="paytable-pays">${payText || (symbol.type === 'wild' ? 'Substitutes all (except scatter)' : '')}</div>
            `;
            
            this.elements.paytableGrid.appendChild(item);
        }
    }
    
    // UI Updates
    updateUI() {
        this.elements.balanceValue.textContent = this.formatNumber(this.balance);
        this.elements.betValue.textContent = this.bet;
        this.elements.linesValue.textContent = CONFIG.BETTING.LINES;
        this.elements.totalBetValue.textContent = this.totalBet;
    }
    
    formatNumber(num) {
        return num.toLocaleString();
    }
    
    showMessage(msg) {
        console.log(msg);
        // Could implement a toast notification here
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DancingDragonsGame();
});

export default DancingDragonsGame;

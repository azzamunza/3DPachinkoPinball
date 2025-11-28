/**
 * Dancing Dragons Jackpot Machine
 * Symbol Renderer - Generates Pachinko/Pinball Themed Symbol Images
 * 
 * Creates custom AI-style generated images for slot symbols
 * with Pachinko and Pinball visual themes
 */

import { CONFIG } from './config.js';

export class SymbolRenderer {
    constructor() {
        this.symbols = new Map();
        this.symbolDataURLs = new Map(); // Cache for data URLs to avoid repeated conversion
        this.canvasSize = 200;
    }
    
    async generateAllSymbols() {
        const symbolConfigs = Object.values(CONFIG.SYMBOLS);
        
        for (const symbol of symbolConfigs) {
            const canvas = this.generateSymbol(symbol);
            this.symbols.set(symbol.id, canvas);
            // Pre-generate data URL for performance
            this.symbolDataURLs.set(symbol.id, canvas.toDataURL());
        }
        
        console.log(`Generated ${this.symbols.size} symbol images`);
    }
    
    getSymbolCanvas(symbolId) {
        return this.symbols.get(symbolId);
    }
    
    // Get cached data URL for better performance
    getSymbolDataURL(symbolId) {
        return this.symbolDataURLs.get(symbolId);
    }
    
    generateSymbol(symbol) {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvasSize;
        canvas.height = this.canvasSize;
        const ctx = canvas.getContext('2d');
        
        // Call appropriate generator based on symbol
        switch (symbol.id) {
            case 1: this.drawDragonWild(ctx); break;
            case 2: this.drawYinYangScatter(ctx); break;
            case 3: this.drawLantern(ctx); break;
            case 4: this.drawGoldIngot(ctx); break;
            case 5: this.drawAncientCoin(ctx); break;
            case 6: this.drawGoldenFan(ctx); break;
            case 7: this.drawBuddha(ctx); break;
            case 8: this.drawCardAce(ctx); break;
            case 9: this.drawCardKing(ctx); break;
            case 10: this.drawCardQueen(ctx); break;
            case 11: this.drawCardJack(ctx); break;
            case 12: this.drawCardTen(ctx); break;
            default: this.drawDefault(ctx, symbol);
        }
        
        return canvas;
    }
    
    // Helper: Draw Pachinko-style neon glow background
    drawNeonBackground(ctx, color1, color2) {
        const size = this.canvasSize;
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.7, color2);
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }
    
    // Helper: Draw metallic pinball-style border
    drawMetallicBorder(ctx, color = '#ffd700') {
        const size = this.canvasSize;
        const margin = 10;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        // Rounded rectangle border (with fallback for browsers without roundRect)
        ctx.beginPath();
        const x = margin, y = margin, w = size - margin*2, h = size - margin*2, r = 15;
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            // Fallback for older browsers
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    // Helper: Draw neon glow text
    drawNeonText(ctx, text, x, y, fontSize, color) {
        ctx.font = `bold ${fontSize}px Orbitron, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        
        // Inner bright
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y);
        
        ctx.shadowBlur = 0;
    }
    
    // Symbol 1: Dragon Wild (Expanding Wild with metallic dragon)
    drawDragonWild(ctx) {
        const size = this.canvasSize;
        
        // Dark red background with fire gradient
        const bgGradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size);
        bgGradient.addColorStop(0, '#ff4500');
        bgGradient.addColorStop(0.5, '#8b0000');
        bgGradient.addColorStop(1, '#1a0000');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, size, size);
        
        // Fire particles effect
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 4 + 1;
            ctx.fillStyle = `rgba(255, ${100 + Math.random()*155}, 0, ${Math.random()*0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Metallic dragon silhouette (stylized)
        ctx.save();
        ctx.translate(size/2, size/2);
        
        // Dragon body (serpentine shape)
        const dragonGradient = ctx.createLinearGradient(-60, -60, 60, 60);
        dragonGradient.addColorStop(0, '#ffd700');
        dragonGradient.addColorStop(0.5, '#ff8c00');
        dragonGradient.addColorStop(1, '#ffd700');
        
        ctx.fillStyle = dragonGradient;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        
        // Draw stylized dragon
        ctx.beginPath();
        // Head
        ctx.ellipse(-30, -30, 25, 20, -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Body coils
        ctx.beginPath();
        ctx.ellipse(0, 0, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(25, 25, 30, 20, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Dragon eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-35, -40, 5, 0, Math.PI * 2);
        ctx.arc(-25, -35, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Horns/whiskers
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-40, -50);
        ctx.quadraticCurveTo(-60, -70, -50, -80);
        ctx.moveTo(-20, -45);
        ctx.quadraticCurveTo(-10, -70, -20, -80);
        ctx.stroke();
        
        ctx.restore();
        
        // WILD text with neon effect
        this.drawNeonText(ctx, 'WILD', size/2, size - 30, 24, '#ff4500');
        
        // Metallic border
        this.drawMetallicBorder(ctx, '#ffd700');
    }
    
    // Symbol 2: Yin Yang Scatter
    drawYinYangScatter(ctx) {
        const size = this.canvasSize;
        const center = size / 2;
        const radius = 60;
        
        // Mystical purple/blue background
        this.drawNeonBackground(ctx, '#8b5cf6', '#1e1b4b');
        
        // Yin Yang with neon glow
        ctx.save();
        ctx.translate(center, center);
        
        // Outer glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30;
        
        // White half
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, radius, -Math.PI/2, Math.PI/2);
        ctx.arc(0, -radius/2, radius/2, Math.PI/2, -Math.PI/2, true);
        ctx.arc(0, radius/2, radius/2, -Math.PI/2, Math.PI/2);
        ctx.fill();
        
        // Black half
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(0, 0, radius, Math.PI/2, -Math.PI/2);
        ctx.arc(0, -radius/2, radius/2, -Math.PI/2, Math.PI/2);
        ctx.arc(0, radius/2, radius/2, Math.PI/2, -Math.PI/2, true);
        ctx.fill();
        
        // Dots
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(0, -radius/2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, radius/2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer ring
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        // SCATTER text
        this.drawNeonText(ctx, 'SCATTER', center, size - 25, 16, '#00ffff');
        
        // Border
        this.drawMetallicBorder(ctx, '#8b5cf6');
    }
    
    // Symbol 3: Red Lantern (Highest paying)
    drawLantern(ctx) {
        const size = this.canvasSize;
        const center = size / 2;
        
        // Dark background with red glow
        this.drawNeonBackground(ctx, '#ff2222', '#2a0a0a');
        
        // Lantern body
        const lanternGradient = ctx.createLinearGradient(center - 40, 0, center + 40, 0);
        lanternGradient.addColorStop(0, '#cc0000');
        lanternGradient.addColorStop(0.5, '#ff4444');
        lanternGradient.addColorStop(1, '#cc0000');
        
        ctx.fillStyle = lanternGradient;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        
        // Lantern shape
        ctx.beginPath();
        ctx.moveTo(center - 35, 50);
        ctx.quadraticCurveTo(center - 50, center, center - 35, size - 60);
        ctx.lineTo(center + 35, size - 60);
        ctx.quadraticCurveTo(center + 50, center, center + 35, 50);
        ctx.closePath();
        ctx.fill();
        
        // Gold decorations
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        
        // Top cap
        ctx.fillRect(center - 25, 40, 50, 15);
        ctx.fillRect(center - 15, 25, 30, 20);
        
        // Bottom cap
        ctx.fillRect(center - 25, size - 65, 50, 10);
        
        // Hanging loop
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(center, 20, 10, Math.PI, 0);
        ctx.stroke();
        
        // Tassels
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(center - 5, size - 55);
        ctx.lineTo(center, size - 30);
        ctx.lineTo(center + 5, size - 55);
        ctx.fill();
        
        // Chinese character (福 - fortune)
        ctx.font = 'bold 40px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillText('福', center, center);
        
        this.drawMetallicBorder(ctx, '#ffd700');
    }
    
    // Symbol 4: Gold Ingot
    drawGoldIngot(ctx) {
        const size = this.canvasSize;
        const center = size / 2;
        
        // Dark background
        this.drawNeonBackground(ctx, '#ffd700', '#1a1a00');
        
        // Gold ingot shape (boat-shaped)
        const goldGradient = ctx.createLinearGradient(center - 50, center - 30, center + 50, center + 30);
        goldGradient.addColorStop(0, '#ffd700');
        goldGradient.addColorStop(0.3, '#ffec8b');
        goldGradient.addColorStop(0.5, '#fff8dc');
        goldGradient.addColorStop(0.7, '#ffd700');
        goldGradient.addColorStop(1, '#b8860b');
        
        ctx.fillStyle = goldGradient;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25;
        
        // Main ingot body
        ctx.beginPath();
        ctx.moveTo(center - 60, center + 20);
        ctx.quadraticCurveTo(center - 50, center - 30, center - 30, center - 30);
        ctx.lineTo(center + 30, center - 30);
        ctx.quadraticCurveTo(center + 50, center - 30, center + 60, center + 20);
        ctx.lineTo(center + 50, center + 40);
        ctx.lineTo(center - 50, center + 40);
        ctx.closePath();
        ctx.fill();
        
        // Top surface shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(center, center - 20, 35, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center - 20, center - 10);
        ctx.lineTo(center - 10, center + 10);
        ctx.moveTo(center + 10, center - 10);
        ctx.lineTo(center + 20, center + 10);
        ctx.stroke();
        
        // Sparkles
        this.drawSparkles(ctx, center, center - 20, 5, '#fff');
        
        this.drawMetallicBorder(ctx, '#b8860b');
    }
    
    // Symbol 5: Ancient Coin
    drawAncientCoin(ctx) {
        const size = this.canvasSize;
        const center = size / 2;
        
        // Dark background
        this.drawNeonBackground(ctx, '#cd7f32', '#1a0a00');
        
        // Coin outer
        const coinGradient = ctx.createRadialGradient(center - 20, center - 20, 0, center, center, 65);
        coinGradient.addColorStop(0, '#ffd700');
        coinGradient.addColorStop(0.5, '#cd7f32');
        coinGradient.addColorStop(1, '#8b4513');
        
        ctx.fillStyle = coinGradient;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.arc(center, center, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Square hole in center
        ctx.fillStyle = '#1a0a00';
        ctx.fillRect(center - 15, center - 15, 30, 30);
        
        // Inner ring
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(center, center, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        // Characters around coin
        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('招', center - 35, center);
        ctx.fillText('財', center + 35, center);
        ctx.fillText('進', center, center - 35);
        ctx.fillText('寶', center, center + 35);
        
        this.drawMetallicBorder(ctx, '#cd7f32');
    }
    
    // Symbol 6: Golden Fan
    drawGoldenFan(ctx) {
        const size = this.canvasSize;
        const center = size / 2;
        
        // Purple/pink background
        this.drawNeonBackground(ctx, '#ff69b4', '#2a0a2a');
        
        ctx.save();
        ctx.translate(center, center + 30);
        
        // Fan ribs and fabric
        const numRibs = 12;
        const fanRadius = 70;
        const startAngle = -Math.PI * 0.7;
        const endAngle = -Math.PI * 0.3;
        const angleStep = (endAngle - startAngle) / numRibs;
        
        // Fan fabric
        for (let i = 0; i < numRibs; i++) {
            const angle = startAngle + i * angleStep;
            const nextAngle = angle + angleStep;
            
            const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * fanRadius, Math.sin(angle) * fanRadius);
            gradient.addColorStop(0, '#8b0000');
            gradient.addColorStop(1, i % 2 === 0 ? '#ff4444' : '#cc0000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, fanRadius, angle, nextAngle);
            ctx.closePath();
            ctx.fill();
        }
        
        // Gold ribs
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 5;
        
        for (let i = 0; i <= numRibs; i++) {
            const angle = startAngle + i * angleStep;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * fanRadius, Math.sin(angle) * fanRadius);
            ctx.stroke();
        }
        
        // Fan pivot
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Cherry blossom decoration
        this.drawCherryBlossom(ctx, center - 20, center - 20);
        this.drawCherryBlossom(ctx, center + 25, center);
        
        this.drawMetallicBorder(ctx, '#ff69b4');
    }
    
    // Helper: Draw cherry blossom
    drawCherryBlossom(ctx, x, y) {
        ctx.fillStyle = '#ffb6c1';
        ctx.shadowColor = '#ff69b4';
        ctx.shadowBlur = 5;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(angle) * 8,
                y + Math.sin(angle) * 8,
                6, 4, angle, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Center
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    // Symbol 7: Golden Buddha
    drawBuddha(ctx) {
        const size = this.canvasSize;
        const center = size / 2;
        
        // Dark green/gold background
        this.drawNeonBackground(ctx, '#228b22', '#0a1a0a');
        
        // Buddha silhouette with gold
        const buddhaGradient = ctx.createLinearGradient(center - 50, 0, center + 50, size);
        buddhaGradient.addColorStop(0, '#ffd700');
        buddhaGradient.addColorStop(0.5, '#ffec8b');
        buddhaGradient.addColorStop(1, '#b8860b');
        
        ctx.fillStyle = buddhaGradient;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        
        // Head
        ctx.beginPath();
        ctx.arc(center, center - 35, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair bumps
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(center - 20 + i * 10, center - 55 + j * 8, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Body (meditation pose)
        ctx.beginPath();
        ctx.ellipse(center, center + 30, 45, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.ellipse(center - 30, center - 30, 8, 15, 0, 0, Math.PI * 2);
        ctx.ellipse(center + 30, center - 30, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Face features (peaceful expression)
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        
        // Eyes (closed)
        ctx.beginPath();
        ctx.arc(center - 10, center - 35, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(center + 10, center - 35, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        // Smile
        ctx.beginPath();
        ctx.arc(center, center - 25, 10, 0.3, Math.PI - 0.3);
        ctx.stroke();
        
        // Halo
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(center, center - 35, 45, 0, Math.PI * 2);
        ctx.stroke();
        
        this.drawMetallicBorder(ctx, '#228b22');
    }
    
    // Card symbols with pinball bumper style
    drawCardSymbol(ctx, letter, mainColor, accentColor) {
        const size = this.canvasSize;
        const center = size / 2;
        
        // Neon background
        this.drawNeonBackground(ctx, mainColor, '#0a0a1a');
        
        // Pinball bumper ring effect
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 8;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(center, center, 55, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner circle
        const innerGradient = ctx.createRadialGradient(center - 20, center - 20, 0, center, center, 50);
        innerGradient.addColorStop(0, mainColor);
        innerGradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(center, center, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Letter with neon glow
        this.drawNeonText(ctx, letter, center, center, 48, accentColor);
        
        // Corner decorations (pachinko style)
        const corners = [[25, 25], [size-25, 25], [25, size-25], [size-25, size-25]];
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        corners.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        this.drawMetallicBorder(ctx, accentColor);
    }
    
    drawCardAce(ctx) {
        this.drawCardSymbol(ctx, 'A', '#4a90d9', '#00ffff');
    }
    
    drawCardKing(ctx) {
        this.drawCardSymbol(ctx, 'K', '#9b59b6', '#ff00ff');
    }
    
    drawCardQueen(ctx) {
        this.drawCardSymbol(ctx, 'Q', '#27ae60', '#00ff88');
    }
    
    drawCardJack(ctx) {
        this.drawCardSymbol(ctx, 'J', '#e74c3c', '#ff4444');
    }
    
    drawCardTen(ctx) {
        this.drawCardSymbol(ctx, '10', '#f39c12', '#ffaa00');
    }
    
    // Helper: Draw sparkles
    drawSparkles(ctx, x, y, count, color) {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 15 + Math.random() * 20;
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist;
            
            // 4-point star
            ctx.beginPath();
            ctx.moveTo(sx, sy - 5);
            ctx.lineTo(sx + 2, sy);
            ctx.lineTo(sx, sy + 5);
            ctx.lineTo(sx - 2, sy);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
    }
    
    // Default fallback
    drawDefault(ctx, symbol) {
        const size = this.canvasSize;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol.name, size/2, size/2);
    }
}

export default SymbolRenderer;

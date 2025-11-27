/**
 * Storage Manager
 * Handles localStorage for high scores and settings
 */

export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'pachinkoPinball_v1';
        this.data = this.load();
    }

    /**
     * Load data from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load saved data:', e);
        }
        
        return this.getDefaultData();
    }

    /**
     * Get default data structure
     */
    getDefaultData() {
        return {
            highScores: [],
            sessionStats: {
                totalGamesPlayed: 0,
                totalBallsFired: 0,
                totalJackpotsWon: 0,
                bestRapidFireStreak: 0
            },
            settings: {
                masterVolume: 1.0,
                sfxVolume: 0.8,
                muted: false
            }
        };
    }

    /**
     * Save data to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    }

    /**
     * Check if score qualifies for high score list
     */
    isHighScore(score) {
        if (this.data.highScores.length < 10) return true;
        
        const lowestScore = this.data.highScores[this.data.highScores.length - 1].score;
        return score > lowestScore;
    }

    /**
     * Add high score
     */
    addHighScore(entry) {
        this.data.highScores.push({
            score: entry.score,
            initials: entry.initials.toUpperCase().substring(0, 3),
            date: entry.date || new Date().toISOString().split('T')[0]
        });
        
        // Sort by score descending
        this.data.highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        this.data.highScores = this.data.highScores.slice(0, 10);
        
        // Assign ranks
        this.data.highScores.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        this.save();
    }

    /**
     * Get high scores
     */
    getHighScores() {
        return this.data.highScores;
    }

    /**
     * Update session stats
     */
    updateStats(stats) {
        Object.assign(this.data.sessionStats, stats);
        this.save();
    }

    /**
     * Get session stats
     */
    getStats() {
        return this.data.sessionStats;
    }

    /**
     * Increment games played
     */
    incrementGamesPlayed() {
        this.data.sessionStats.totalGamesPlayed++;
        this.save();
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.data.settings;
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        Object.assign(this.data.settings, settings);
        this.save();
    }

    /**
     * Clear all data
     */
    clear() {
        this.data = this.getDefaultData();
        this.save();
    }
}

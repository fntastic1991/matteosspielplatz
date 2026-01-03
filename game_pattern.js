// game_pattern.js - 🧩 COSMIC PATTERN - Muster merken!
import { audioManager } from './audio_utils.js';

export class PatternGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.buttons = [];
        this.pattern = [];
        this.playerInput = [];
        this.isShowingPattern = false;
        this.isPlayerTurn = false;
        this.currentShowIndex = 0;
        
        this.score = 0;
        this.level = 1;
        this.maxLevel = 20;
        this.stars = [];
        this.particles = [];
        this.time = 0;
        
        this.buttonColors = [
            { base: '#ff0055', light: '#ff4488', glow: '#ff0055', freq: 261.63 },
            { base: '#00ff88', light: '#66ffaa', glow: '#00ff88', freq: 329.63 },
            { base: '#ffff00', light: '#ffff66', glow: '#ffff00', freq: 392.00 },
            { base: '#00ffff', light: '#66ffff', glow: '#00ffff', freq: 523.25 }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.level = 1;
        this.pattern = [];
        this.playerInput = [];
        this.particles = [];
        this.time = 0;
        
        this.setupButtons();
        this.generateStars();
        
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        // Erstes Muster nach kurzer Verzögerung
        setTimeout(() => this.addToPattern(), 1000);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
    }
    
    setupButtons() {
        const buttonSize = Math.min(120, (this.canvas.width - 60) / 2);
        const gap = 20;
        const startX = (this.canvas.width - buttonSize * 2 - gap) / 2;
        const startY = 180;
        
        this.buttons = [];
        
        for (let i = 0; i < 4; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            
            this.buttons.push({
                x: startX + col * (buttonSize + gap),
                y: startY + row * (buttonSize + gap),
                width: buttonSize,
                height: buttonSize,
                color: this.buttonColors[i],
                lit: false,
                litProgress: 0,
                index: i
            });
        }
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    addToPattern() {
        // Zufällige Taste hinzufügen
        const newButton = Math.floor(Math.random() * 4);
        this.pattern.push(newButton);
        
        // Muster zeigen
        this.showPattern();
    }
    
    showPattern() {
        this.isShowingPattern = true;
        this.isPlayerTurn = false;
        this.currentShowIndex = 0;
        
        const showNext = () => {
            if (this.currentShowIndex >= this.pattern.length) {
                // Muster fertig gezeigt
                setTimeout(() => {
                    this.isShowingPattern = false;
                    this.isPlayerTurn = true;
                    this.playerInput = [];
                }, 500);
                return;
            }
            
            const buttonIndex = this.pattern[this.currentShowIndex];
            this.lightButton(buttonIndex);
            this.currentShowIndex++;
            
            setTimeout(showNext, 600);
        };
        
        setTimeout(showNext, 500);
    }
    
    lightButton(index) {
        const button = this.buttons[index];
        button.lit = true;
        button.litProgress = 1;
        
        // Sound spielen
        audioManager.playNote(button.color.freq, 'sine', 0.3);
        
        // Partikel
        this.createButtonParticles(button);
        
        // Nach kurzer Zeit ausschalten
        setTimeout(() => {
            button.lit = false;
        }, 400);
    }
    
    handleClick = (e) => {
        if (!this.isPlayerTurn || this.isShowingPattern) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        // Button geklickt?
        for (let button of this.buttons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.handleButtonPress(button.index);
                break;
            }
        }
    }
    
    handleButtonPress(index) {
        this.lightButton(index);
        this.playerInput.push(index);
        
        // Prüfe Eingabe
        const currentIndex = this.playerInput.length - 1;
        
        if (this.playerInput[currentIndex] !== this.pattern[currentIndex]) {
            // Falsch!
            this.gameOver();
            return;
        }
        
        if (this.playerInput.length === this.pattern.length) {
            // Richtig! Nächstes Level
            this.score += this.pattern.length * 10;
            this.level++;
            
            if (this.level > this.maxLevel) {
                setTimeout(() => {
                    this.stop();
                    if (this.onExit) this.onExit();
                }, 1000);
            } else {
                this.isPlayerTurn = false;
                this.createSuccessParticles();
                
                setTimeout(() => {
                    this.addToPattern();
                }, 1500);
            }
        }
    }
    
    gameOver() {
        this.isPlayerTurn = false;
        this.createErrorParticles();
        audioManager.playErrorSound();
        
        // Kurze Pause, dann neu starten
        setTimeout(() => {
            this.pattern = [];
            this.playerInput = [];
            this.level = 1;
            this.addToPattern();
        }, 2000);
    }
    
    createButtonParticles(button) {
        const cx = button.x + button.width / 2;
        const cy = button.y + button.height / 2;
        
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: button.color.glow,
                size: 4 + Math.random() * 4
            });
        }
    }
    
    createSuccessParticles() {
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: ['#ff00ff', '#00ffff', '#ffff00', '#00ff88'][Math.floor(Math.random() * 4)],
                size: 6 + Math.random() * 8
            });
        }
    }
    
    createErrorParticles() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: '#ff0055',
                size: 5 + Math.random() * 6
            });
        }
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        this.time += 0.016;
        
        // Button-Animationen
        for (let button of this.buttons) {
            if (button.litProgress > 0) {
                button.litProgress -= 0.05;
            }
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#050520');
        gradient.addColorStop(0.5, '#100540');
        gradient.addColorStop(1, '#050520');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne
        for (let star of this.stars) {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.4;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // UI
        this.ctx.save();
        
        // Titel
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🧩 COSMIC PATTERN 🧩', this.canvas.width / 2, 40);
        
        // Level
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, 75);
        
        // Muster-Länge
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`Muster: ${this.pattern.length} Töne`, this.canvas.width / 2, 105);
        
        // Score
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`⭐ ${this.score}`, 20, 40);
        
        // Status
        this.ctx.textAlign = 'center';
        if (this.isShowingPattern) {
            this.ctx.shadowColor = '#ff8800';
            this.ctx.fillStyle = '#ff8800';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillText('👀 Schau genau hin!', this.canvas.width / 2, 145);
        } else if (this.isPlayerTurn) {
            this.ctx.shadowColor = '#00ff88';
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillText(`👆 Dein Zug! (${this.playerInput.length}/${this.pattern.length})`, this.canvas.width / 2, 145);
        }
        
        this.ctx.restore();
        
        // Buttons
        for (let button of this.buttons) {
            this.drawButton(button);
        }
        
        // Partikel
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        this.ctx.shadowBlur = 0;
        
        // Anleitung
        this.ctx.save();
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Merke dir das Muster und wiederhole es!', this.canvas.width / 2, this.canvas.height - 20);
        this.ctx.restore();
    }
    
    drawButton(button) {
        this.ctx.save();
        
        const isLit = button.lit || button.litProgress > 0.5;
        const glowIntensity = isLit ? 35 : 15;
        
        // Glow
        this.ctx.shadowColor = button.color.glow;
        this.ctx.shadowBlur = glowIntensity;
        
        // Button Gradient
        const grad = this.ctx.createRadialGradient(
            button.x + button.width / 2,
            button.y + button.height / 2,
            0,
            button.x + button.width / 2,
            button.y + button.height / 2,
            button.width / 1.5
        );
        
        if (isLit) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, button.color.light);
            grad.addColorStop(1, button.color.base);
        } else {
            grad.addColorStop(0, button.color.light);
            grad.addColorStop(0.5, button.color.base);
            grad.addColorStop(1, this.darkenColor(button.color.base, 0.4));
        }
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.roundRect(button.x, button.y, button.width, button.height, 20);
        this.ctx.fill();
        
        // Highlight
        if (!isLit) {
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.roundRect(button.x + 10, button.y + 10, button.width - 20, button.height * 0.35, 15);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    darkenColor(hex, factor) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.floor(((num >> 16) & 255) * (1 - factor));
        const g = Math.floor(((num >> 8) & 255) * (1 - factor));
        const b = Math.floor((num & 255) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}


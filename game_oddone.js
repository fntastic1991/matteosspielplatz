// game_oddone.js - 🌌 COSMIC Finde den Unterschied Spiel
import { audioManager } from './audio_utils.js';

export class OddOneGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.items = [];
        this.oddIndex = -1;
        this.level = 1;
        this.maxLevel = 15;
        this.score = 0;
        this.particles = [];
        this.stars = [];
        this.time = 0;
        this.feedback = null;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
        this.score = 0;
        this.particles = [];
        this.time = 0;
        
        this.generateStars();
        this.generateLevel();
        
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 90; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.04
            });
        }
    }
    
    generateLevel() {
        this.items = [];
        this.feedback = null;
        
        const categories = [
            { normal: ['🍎', '🍎', '🍎', '🍎'], odd: '🍐' },
            { normal: ['🐶', '🐶', '🐶', '🐶'], odd: '🐱' },
            { normal: ['⭐', '⭐', '⭐', '⭐'], odd: '🌙' },
            { normal: ['🚗', '🚗', '🚗', '🚗'], odd: '🚌' },
            { normal: ['🎈', '🎈', '🎈', '🎈'], odd: '🎁' },
            { normal: ['🌸', '🌸', '🌸', '🌸'], odd: '🌻' },
            { normal: ['🐟', '🐟', '🐟', '🐟'], odd: '🐙' },
            { normal: ['🍕', '🍕', '🍕', '🍕'], odd: '🍔' },
            { normal: ['🦋', '🦋', '🦋', '🦋'], odd: '🐝' },
            { normal: ['🎸', '🎸', '🎸', '🎸'], odd: '🎹' }
        ];
        
        const numItems = Math.min(4 + Math.floor(this.level / 3), 9);
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        this.oddIndex = Math.floor(Math.random() * numItems);
        
        const itemSize = numItems <= 4 ? 75 : (numItems <= 6 ? 65 : 55);
        const cols = numItems <= 4 ? 2 : (numItems <= 6 ? 3 : 3);
        const rows = Math.ceil(numItems / cols);
        
        const spacing = 20;
        const totalWidth = cols * itemSize + (cols - 1) * spacing;
        const totalHeight = rows * itemSize + (rows - 1) * spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = 180;
        
        for (let i = 0; i < numItems; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            this.items.push({
                x: startX + col * (itemSize + spacing),
                y: startY + row * (itemSize + spacing),
                size: itemSize,
                emoji: i === this.oddIndex ? category.odd : category.normal[0],
                isOdd: i === this.oddIndex,
                scale: 1,
                glow: Math.random() * Math.PI * 2,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }
    
    handleClick = (e) => {
        if (this.feedback) return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        for (let item of this.items) {
            if (x >= item.x && x <= item.x + item.size && y >= item.y && y <= item.y + item.size) {
                this.checkAnswer(item);
                break;
            }
        }
    }
    
    checkAnswer(item) {
        if (item.isOdd) {
            this.feedback = { correct: true, item };
            this.score += 10 * this.level;
            this.createSuccessParticles(item.x + item.size / 2, item.y + item.size / 2);
            this.animateSuccess(item);
            audioManager.playSuccessSound();
            
            setTimeout(() => {
                if (this.level >= this.maxLevel) {
                    this.stop();
                    if (this.onExit) this.onExit();
                } else {
                    this.level++;
                    this.generateLevel();
                }
            }, 1200);
        } else {
            this.feedback = { correct: false, item };
            this.animateShake(item);
            audioManager.playErrorSound();
            
            setTimeout(() => {
                this.feedback = null;
            }, 600);
        }
    }
    
    animateSuccess(item) {
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            item.scale = progress < 0.4 ? 1 + progress * 0.6 : 1.24 - (progress - 0.4) * 0.6;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                item.scale = 1;
            }
        };
        animate();
    }
    
    animateShake(item) {
        const startTime = Date.now();
        const duration = 350;
        const startX = item.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            item.x = startX + Math.sin(progress * Math.PI * 5) * 10 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                item.x = startX;
            }
        };
        animate();
    }
    
    createSuccessParticles(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff00ff', '#00ffff', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 5 + Math.random() * 5
            });
        }
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        this.time += 0.016;
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#100520');
        gradient.addColorStop(0.5, '#1a0840');
        gradient.addColorStop(1, '#100520');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne
        for (let star of this.stars) {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Nebel
        this.ctx.save();
        this.ctx.globalAlpha = 0.06;
        const nebulaGrad = this.ctx.createRadialGradient(
            this.canvas.width * 0.3, this.canvas.height * 0.5, 0,
            this.canvas.width * 0.3, this.canvas.height * 0.5, 250
        );
        nebulaGrad.addColorStop(0, '#ff00ff');
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // UI
        this.ctx.save();
        
        // Titel
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔍 Finde den Anderen! 🔍', this.canvas.width / 2, 35);
        
        // Level & Score
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, this.canvas.width / 2, 70);
        
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText(`⭐ ${this.score}`, this.canvas.width / 2, 100);
        
        // Anweisung
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText('Welches ist anders?', this.canvas.width / 2, 140);
        
        this.ctx.restore();
        
        // Items
        for (let item of this.items) {
            this.ctx.save();
            
            item.glow += 0.04;
            item.wobble += 0.02;
            const glowIntensity = 12 + Math.sin(item.glow) * 8;
            const yOffset = Math.sin(item.wobble) * 2;
            
            // Karte
            let cardColor = '#2a1060';
            let glowColor = '#8800ff';
            
            if (this.feedback && this.feedback.item === item) {
                if (this.feedback.correct) {
                    cardColor = '#0a4020';
                    glowColor = '#00ff88';
                } else {
                    cardColor = '#400a20';
                    glowColor = '#ff0055';
                }
            }
            
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = glowIntensity;
            
            const grad = this.ctx.createLinearGradient(item.x, item.y, item.x, item.y + item.size);
            grad.addColorStop(0, this.lightenColor(cardColor, 0.3));
            grad.addColorStop(1, cardColor);
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.roundRect(item.x, item.y, item.size * item.scale, item.size * item.scale, 15);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Emoji
            this.ctx.shadowBlur = 0;
            this.ctx.font = `${item.size * 0.5 * item.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.emoji, item.x + item.size / 2, item.y + item.size / 2 + yOffset);
            
            this.ctx.restore();
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            
            if (p.life > 0) {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
                this.ctx.shadowBlur = 0;
            } else {
                this.particles.splice(i, 1);
            }
        }
    }
    
    lightenColor(hex, factor) {
        if (hex.startsWith('#')) {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = Math.min(255, ((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * factor);
            const g = Math.min(255, ((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * factor);
            const b = Math.min(255, (num & 255) + (255 - (num & 255)) * factor);
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
        return hex;
    }
}

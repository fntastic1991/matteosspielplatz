// game_catch.js - 🧺 COSMIC CATCH - Fange die Sterne!
import { audioManager } from './audio_utils.js';

export class CatchGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.basket = { x: 0, y: 0, width: 80, height: 50, glow: 0 };
        this.fallingItems = [];
        this.particles = [];
        this.stars = [];
        
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.maxLevel = 10;
        this.itemsCaught = 0;
        this.itemsNeeded = 10;
        this.time = 0;
        this.spawnTimer = 0;
        
        this.goodItems = ['⭐', '🌟', '💎', '🎁', '🍬', '🍪', '🧁'];
        this.badItems = ['💣', '☠️', '🔥'];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.itemsCaught = 0;
        this.itemsNeeded = 10;
        this.particles = [];
        this.fallingItems = [];
        this.time = 0;
        this.spawnTimer = 0;
        
        this.basket = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 90,
            height: 60,
            glow: 0
        };
        
        this.generateStars();
        
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('touchmove', this.handleMove);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('touchmove', this.handleMove);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    handleMove = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        
        this.basket.x = Math.max(this.basket.width / 2, Math.min(this.canvas.width - this.basket.width / 2, x));
    }
    
    spawnItem() {
        const isGood = Math.random() > 0.2; // 80% gute Items
        const items = isGood ? this.goodItems : this.badItems;
        const emoji = items[Math.floor(Math.random() * items.length)];
        
        this.fallingItems.push({
            x: 40 + Math.random() * (this.canvas.width - 80),
            y: -50,
            emoji: emoji,
            isGood: isGood,
            size: 40 + Math.random() * 15,
            speed: 2 + this.level * 0.3 + Math.random() * 1.5,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            glow: Math.random() * Math.PI * 2
        });
    }
    
    update() {
        this.time += 0.016;
        
        // Items spawnen
        this.spawnTimer++;
        const spawnRate = Math.max(30, 60 - this.level * 3);
        if (this.spawnTimer >= spawnRate) {
            this.spawnItem();
            this.spawnTimer = 0;
        }
        
        // Items bewegen
        for (let i = this.fallingItems.length - 1; i >= 0; i--) {
            const item = this.fallingItems[i];
            item.y += item.speed;
            item.rotation += item.rotationSpeed;
            item.glow += 0.05;
            
            // Kollision mit Korb
            if (item.y + item.size / 2 > this.basket.y - this.basket.height / 2 &&
                item.y - item.size / 2 < this.basket.y + this.basket.height / 2 &&
                Math.abs(item.x - this.basket.x) < this.basket.width / 2 + item.size / 4) {
                
                if (item.isGood) {
                    this.score += 10 * this.level;
                    this.itemsCaught++;
                    this.createCatchParticles(item.x, item.y, '#ffff00');
                    audioManager.playSuccessSound();
                    
                    if (this.itemsCaught >= this.itemsNeeded) {
                        this.levelUp();
                    }
                } else {
                    this.lives--;
                    this.createCatchParticles(item.x, item.y, '#ff0055');
                    audioManager.playErrorSound();
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
                
                this.fallingItems.splice(i, 1);
                continue;
            }
            
            // Aus dem Bildschirm gefallen (gutes Item verpasst)
            if (item.y > this.canvas.height + 50) {
                if (item.isGood) {
                    // Kein Leben verlieren, nur verpasst
                }
                this.fallingItems.splice(i, 1);
            }
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.025;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    levelUp() {
        if (this.level >= this.maxLevel) {
            this.stop();
            if (this.onExit) this.onExit();
        } else {
            this.level++;
            this.itemsCaught = 0;
            this.itemsNeeded = 10 + this.level * 2;
            this.lives = Math.min(this.lives + 1, 5); // Bonus-Leben
            this.createLevelParticles();
            audioManager.playLevelUpSound();
        }
    }
    
    gameOver() {
        this.stop();
        if (this.onExit) this.onExit();
    }
    
    createCatchParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15 - Math.PI / 2;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 5 + Math.random() * 5
            });
        }
    }
    
    createLevelParticles() {
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
    
    gameLoop = () => {
        if (!this.isRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000025');
        gradient.addColorStop(0.5, '#0a0045');
        gradient.addColorStop(1, '#000025');
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
        
        // Fallende Items
        for (let item of this.fallingItems) {
            this.ctx.save();
            this.ctx.translate(item.x, item.y);
            this.ctx.rotate(item.rotation);
            
            const glowIntensity = 15 + Math.sin(item.glow) * 8;
            const glowColor = item.isGood ? '#ffff00' : '#ff0055';
            
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = glowIntensity;
            
            this.ctx.font = `${item.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        // Korb
        this.drawBasket();
        
        // Partikel
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        this.ctx.shadowBlur = 0;
        
        // UI
        this.ctx.save();
        
        // Titel
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🧺 CATCH THE STARS! 🧺', this.canvas.width / 2, 40);
        
        // Level
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, 70);
        
        // Score
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`⭐ ${this.score}`, 20, 40);
        
        // Fortschritt
        this.ctx.fillText(`${this.itemsCaught}/${this.itemsNeeded}`, 20, 65);
        
        // Leben
        this.ctx.textAlign = 'right';
        this.ctx.shadowColor = '#ff0055';
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText('❤️'.repeat(this.lives), this.canvas.width - 20, 40);
        
        this.ctx.restore();
        
        // Anleitung
        this.ctx.save();
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Bewege den Korb! Fange ⭐ - Vermeide 💣', this.canvas.width / 2, this.canvas.height - 15);
        this.ctx.restore();
    }
    
    drawBasket() {
        const x = this.basket.x;
        const y = this.basket.y;
        const w = this.basket.width;
        const h = this.basket.height;
        
        this.basket.glow += 0.05;
        const glowIntensity = 15 + Math.sin(this.basket.glow) * 8;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Glow
        this.ctx.shadowColor = '#ff8800';
        this.ctx.shadowBlur = glowIntensity;
        
        // Korb-Körper
        const basketGrad = this.ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
        basketGrad.addColorStop(0, '#ff8800');
        basketGrad.addColorStop(0.5, '#ffaa44');
        basketGrad.addColorStop(1, '#cc6600');
        
        this.ctx.fillStyle = basketGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(-w/2, -h/3);
        this.ctx.lineTo(-w/2 + 10, h/2);
        this.ctx.lineTo(w/2 - 10, h/2);
        this.ctx.lineTo(w/2, -h/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Korb-Rand
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#cc5500';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -h/3, w/2, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ff9933';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -h/3 - 3, w/2 - 5, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Korbmuster (Streifen)
        this.ctx.strokeStyle = '#aa5500';
        this.ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 15, -h/3 + 5);
            this.ctx.lineTo(i * 12, h/2 - 5);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}


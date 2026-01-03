// game_dodging.js - 🌌 COSMIC Ausweichspiel
import { audioManager } from './audio_utils.js';

export class DodgingGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.player = { x: 0, y: 0, width: 50, height: 50, targetX: 0, glow: 0 };
        this.fallingObjects = [];
        this.baseSpeed = 1;
        this.spawnRate = 80;
        this.spawnTimer = 0;
        
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.gameOver = false;
        
        this.particles = [];
        this.stars = [];
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 100;
        this.player.targetX = this.player.x;
        
        this.fallingObjects = [];
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.baseSpeed = 1;
        this.spawnRate = 80;
        this.spawnTimer = 0;
        this.particles = [];
        this.time = 0;
        
        this.generateStars();
        
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
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
    
    handleMouseMove = (e) => {
        if (this.gameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        this.player.targetX = e.clientX - rect.left;
    }
    
    handleTouchMove = (e) => {
        if (this.gameOver) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.player.targetX = e.touches[0].clientX - rect.left;
    }
    
    handleClick = (e) => {
        if (this.gameOver) {
            this.restart();
        }
    }
    
    restart() {
        this.player.x = this.canvas.width / 2;
        this.player.targetX = this.player.x;
        this.fallingObjects = [];
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.baseSpeed = 1;
        this.spawnRate = 80;
        this.spawnTimer = 0;
        this.particles = [];
        this.generateStars();
    }
    
    spawnObject() {
        const types = [
            { emoji: '☄️', color: '#ff0055', size: 35 },
            { emoji: '🌑', color: '#666', size: 40 },
            { emoji: '💫', color: '#ffff00', size: 30 },
            { emoji: '🛸', color: '#00ff88', size: 35 },
            { emoji: '⚡', color: '#ff8800', size: 30 }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.fallingObjects.push({
            x: 30 + Math.random() * (this.canvas.width - 60),
            y: -50,
            width: type.size,
            height: type.size,
            speed: this.baseSpeed + Math.random() * 0.5,
            emoji: type.emoji,
            color: type.color,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            glow: Math.random() * Math.PI * 2
        });
    }
    
    update() {
        if (this.gameOver) return;
        
        this.time += 0.016;
        
        // Spieler bewegen
        this.player.x += (this.player.targetX - this.player.x) * 0.15;
        this.player.x = Math.max(30, Math.min(this.canvas.width - 30, this.player.x));
        
        // Spawn
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnObject();
            this.spawnTimer = 0;
        }
        
        // Objekte fallen lassen
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            obj.y += obj.speed;
            obj.rotation += obj.rotationSpeed;
            obj.glow += 0.05;
            
            // Vorbei geflogen
            if (obj.y > this.canvas.height + 50) {
                this.fallingObjects.splice(i, 1);
                this.score++;
                this.createPassParticles();
                
                if (this.score % 10 === 0) {
                    this.levelUp();
                }
                continue;
            }
            
            // Kollision
            const dx = Math.abs(obj.x - this.player.x);
            const dy = Math.abs(obj.y - this.player.y);
            if (dx < 30 && dy < 30) {
                this.gameOver = true;
                this.createExplosionParticles();
                audioManager.playGameOverSound();
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                }
            }
        }
    }
    
    levelUp() {
        this.level++;
        this.baseSpeed += 0.15;
        this.spawnRate = Math.max(40, this.spawnRate - 3);
        this.createLevelUpEffect();
        audioManager.playLevelUpSound();
    }
    
    createPassParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: this.canvas.height - 30,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                life: 1,
                color: '#00ff88',
                size: 4 + Math.random() * 4
            });
        }
    }
    
    createExplosionParticles() {
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff0055', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 5 + Math.random() * 6
            });
        }
    }
    
    createLevelUpEffect() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: '#ffff00',
                size: 6 + Math.random() * 6
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
        gradient.addColorStop(0, '#000020');
        gradient.addColorStop(0.5, '#0a0040');
        gradient.addColorStop(1, '#150050');
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
        
        // Nebel-Effekte
        this.ctx.save();
        this.ctx.globalAlpha = 0.08;
        for (let i = 0; i < 3; i++) {
            const y = (this.time * 20 + i * 200) % (this.canvas.height + 200) - 100;
            const grad = this.ctx.createRadialGradient(
                this.canvas.width / 2 + Math.sin(this.time + i) * 100, y,
                0, this.canvas.width / 2, y, 200
            );
            grad.addColorStop(0, '#ff00ff');
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.restore();
        
        // Fallende Objekte
        for (let obj of this.fallingObjects) {
            this.ctx.save();
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation);
            
            // Glow
            const glowIntensity = 15 + Math.sin(obj.glow) * 8;
            this.ctx.shadowColor = obj.color;
            this.ctx.shadowBlur = glowIntensity;
            
            // Hintergrund
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width / 2);
            grad.addColorStop(0, obj.color);
            grad.addColorStop(1, 'rgba(0,0,0,0.5)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Emoji
            this.ctx.shadowBlur = 0;
            this.ctx.font = `${obj.width * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obj.emoji, 0, 2);
            
            this.ctx.restore();
        }
        
        // Spieler
        if (!this.gameOver) {
            this.ctx.save();
            this.player.glow = (this.player.glow || 0) + 0.05;
            const glowIntensity = 20 + Math.sin(this.player.glow) * 10;
            
            this.ctx.translate(this.player.x, this.player.y);
            
            // Glow
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = glowIntensity;
            
            // Körper
            const playerGrad = this.ctx.createRadialGradient(0, -10, 0, 0, 0, 30);
            playerGrad.addColorStop(0, '#88ffff');
            playerGrad.addColorStop(0.5, '#00ffff');
            playerGrad.addColorStop(1, '#0088aa');
            
            this.ctx.fillStyle = playerGrad;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -30);
            this.ctx.lineTo(25, 30);
            this.ctx.lineTo(-25, 30);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Cockpit
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#003344';
            this.ctx.beginPath();
            this.ctx.ellipse(0, -5, 10, 12, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Auge
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Triebwerke
            this.ctx.fillStyle = '#ff8800';
            this.ctx.shadowColor = '#ff8800';
            this.ctx.shadowBlur = 15;
            const flicker = Math.random() * 5 + 10;
            this.ctx.beginPath();
            this.ctx.moveTo(-15, 30);
            this.ctx.lineTo(-10, 30 + flicker);
            this.ctx.lineTo(-5, 30);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(5, 30);
            this.ctx.lineTo(10, 30 + flicker);
            this.ctx.lineTo(15, 30);
            this.ctx.closePath();
            this.ctx.fill();
            
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
        
        // UI
        this.ctx.save();
        
        // Level
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 24px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⚡ Level ${this.level}`, 20, 35);
        
        // Score
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText(`⭐ ${this.score}`, 20, 65);
        
        // High Score
        if (this.highScore > 0) {
            this.ctx.shadowColor = '#00ff88';
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 18px sans-serif';
            this.ctx.fillText(`🏆 ${this.highScore}`, 20, 90);
        }
        
        // Anleitung
        if (!this.gameOver && this.score < 3) {
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 22px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👆 Bewege das Schiff! 👆', this.canvas.width / 2, 50);
        }
        
        this.ctx.restore();
        
        // Game Over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.save();
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 40;
            this.ctx.fillStyle = '#ff0055';
            this.ctx.font = 'bold 44px "Fredoka One", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💥 BUMM! 💥', this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.fillText(`⭐ ${this.score} Punkte`, this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.font = 'bold 26px sans-serif';
            this.ctx.fillText(`⚡ Level ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 45);
            
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillText('Tippe zum Neustarten', this.canvas.width / 2, this.canvas.height / 2 + 100);
            this.ctx.restore();
        }
    }
}

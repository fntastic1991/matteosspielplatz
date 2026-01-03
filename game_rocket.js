// game_rocket.js - 🚀 ROCKET LAUNCH - Sterne sammeln im Weltall!
import { audioManager } from './audio_utils.js';

export class RocketGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.rocket = {
            x: 0, y: 0,
            targetX: 0, targetY: 0,
            rotation: 0,
            speed: 0,
            trail: [],
            flame: 0,
            boost: false
        };
        
        this.stars = [];
        this.collectStars = [];
        this.asteroids = [];
        this.particles = [];
        this.nebulas = [];
        
        this.score = 0;
        this.level = 1;
        this.maxLevel = 10;
        this.starsCollected = 0;
        this.starsNeeded = 5;
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.level = 1;
        this.starsCollected = 0;
        this.starsNeeded = 5;
        this.particles = [];
        this.time = 0;
        
        this.rocket = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            targetX: this.canvas.width / 2,
            targetY: this.canvas.height - 100,
            rotation: -Math.PI / 2,
            speed: 0,
            trail: [],
            flame: 0,
            boost: false,
            size: 45
        };
        
        this.generateBackground();
        this.generateCollectStars();
        
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('touchmove', this.handleMove);
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('touchmove', this.handleMove);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
    }
    
    generateBackground() {
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.04
            });
        }
        
        this.nebulas = [];
        for (let i = 0; i < 3; i++) {
            this.nebulas.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 150 + Math.random() * 150,
                color: ['#ff00ff', '#00ffff', '#8800ff'][i],
                alpha: 0.03 + Math.random() * 0.04
            });
        }
    }
    
    generateCollectStars() {
        this.collectStars = [];
        const numStars = this.starsNeeded + this.level;
        
        for (let i = 0; i < numStars; i++) {
            this.collectStars.push({
                x: 50 + Math.random() * (this.canvas.width - 100),
                y: 80 + Math.random() * (this.canvas.height - 250),
                size: 30 + Math.random() * 15,
                collected: false,
                glow: Math.random() * Math.PI * 2,
                pulse: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05
            });
        }
    }
    
    handleMove = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        this.rocket.targetX = x;
        this.rocket.targetY = y;
    }
    
    handleClick = (e) => {
        e.preventDefault();
        // Boost aktivieren
        this.rocket.boost = true;
        setTimeout(() => { this.rocket.boost = false; }, 500);
        this.createBoostParticles();
        audioManager.playClickSound();
    }
    
    update() {
        this.time += 0.016;
        
        // Rakete bewegt sich zum Ziel
        const dx = this.rocket.targetX - this.rocket.x;
        const dy = this.rocket.targetY - this.rocket.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Rotation zur Zielrichtung
            const targetRotation = Math.atan2(dy, dx);
            let rotDiff = targetRotation - this.rocket.rotation;
            
            // Kürzester Weg
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            
            this.rocket.rotation += rotDiff * 0.1;
            
            // Bewegung
            const speed = this.rocket.boost ? 12 : 6;
            this.rocket.x += Math.cos(this.rocket.rotation) * speed;
            this.rocket.y += Math.sin(this.rocket.rotation) * speed;
            
            // Grenzen
            this.rocket.x = Math.max(30, Math.min(this.canvas.width - 30, this.rocket.x));
            this.rocket.y = Math.max(60, Math.min(this.canvas.height - 30, this.rocket.y));
        }
        
        // Trail
        this.rocket.trail.push({ x: this.rocket.x, y: this.rocket.y });
        if (this.rocket.trail.length > 20) this.rocket.trail.shift();
        
        // Flamme animieren
        this.rocket.flame += 0.3;
        
        // Triebwerks-Partikel
        if (Math.random() < 0.5) {
            const angle = this.rocket.rotation + Math.PI;
            this.particles.push({
                x: this.rocket.x + Math.cos(angle) * 25,
                y: this.rocket.y + Math.sin(angle) * 25,
                vx: Math.cos(angle) * (2 + Math.random() * 3) + (Math.random() - 0.5),
                vy: Math.sin(angle) * (2 + Math.random() * 3) + (Math.random() - 0.5),
                life: 1,
                color: this.rocket.boost ? '#00ffff' : '#ff8800',
                size: 4 + Math.random() * 5
            });
        }
        
        // Sterne sammeln
        for (let star of this.collectStars) {
            if (star.collected) continue;
            
            star.glow += 0.06;
            star.pulse += 0.04;
            star.rotation += star.rotationSpeed;
            
            const dx = this.rocket.x - star.x;
            const dy = this.rocket.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < star.size / 2 + this.rocket.size / 2) {
                star.collected = true;
                this.starsCollected++;
                this.score += 10 * this.level;
                this.createCollectParticles(star.x, star.y);
                audioManager.playSuccessSound();
                
                if (this.starsCollected >= this.starsNeeded) {
                    this.levelComplete();
                }
            }
        }
        
        // Partikel updaten
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    levelComplete() {
        this.createLevelParticles();
        
        setTimeout(() => {
            if (this.level >= this.maxLevel) {
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                this.level++;
                this.starsCollected = 0;
                this.starsNeeded = 5 + this.level;
                this.generateCollectStars();
                audioManager.playLevelUpSound();
            }
        }, 1500);
    }
    
    createCollectParticles(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: '#ffff00',
                size: 5 + Math.random() * 5
            });
        }
    }
    
    createBoostParticles() {
        const angle = this.rocket.rotation + Math.PI;
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.rocket.x + Math.cos(angle) * 25,
                y: this.rocket.y + Math.sin(angle) * 25,
                vx: Math.cos(angle + (Math.random() - 0.5)) * (5 + Math.random() * 5),
                vy: Math.sin(angle + (Math.random() - 0.5)) * (5 + Math.random() * 5),
                life: 1,
                color: '#00ffff',
                size: 6 + Math.random() * 6
            });
        }
    }
    
    createLevelParticles() {
        for (let i = 0; i < 60; i++) {
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
        gradient.addColorStop(0, '#000015');
        gradient.addColorStop(0.5, '#0a0035');
        gradient.addColorStop(1, '#000015');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Nebel
        for (let nebula of this.nebulas) {
            const grad = this.ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.size);
            grad.addColorStop(0, nebula.color);
            grad.addColorStop(1, 'transparent');
            this.ctx.globalAlpha = nebula.alpha;
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }
        
        // Sterne
        for (let star of this.stars) {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Sammel-Sterne
        for (let star of this.collectStars) {
            if (star.collected) continue;
            
            const glowIntensity = 15 + Math.sin(star.glow) * 10;
            const pulseScale = 1 + Math.sin(star.pulse) * 0.15;
            
            this.ctx.save();
            this.ctx.translate(star.x, star.y);
            this.ctx.rotate(star.rotation);
            this.ctx.scale(pulseScale, pulseScale);
            
            // Glow
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = glowIntensity;
            
            // Stern zeichnen
            this.ctx.fillStyle = '#ffff00';
            this.drawStar(0, 0, 5, star.size / 2, star.size / 4);
            
            // Innerer Glanz
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 0;
            this.drawStar(0, 0, 5, star.size / 4, star.size / 8);
            
            this.ctx.restore();
        }
        
        // Raketen-Trail
        for (let i = 0; i < this.rocket.trail.length; i++) {
            const t = this.rocket.trail[i];
            const alpha = (i / this.rocket.trail.length) * 0.4;
            const size = (i / this.rocket.trail.length) * 12 + 3;
            
            this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
        
        // Rakete
        this.drawRocket();
        
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
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 ROCKET LAUNCH! 🚀', this.canvas.width / 2, 35);
        
        // Level & Score
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level}`, 20, 35);
        
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`⭐ ${this.starsCollected}/${this.starsNeeded}`, this.canvas.width - 20, 35);
        
        // Score
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`${this.score} Punkte`, this.canvas.width - 20, 60);
        
        this.ctx.restore();
        
        // Anleitung
        this.ctx.save();
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👆 Bewege die Rakete & tippe für Boost!', this.canvas.width / 2, this.canvas.height - 20);
        this.ctx.restore();
    }
    
    drawRocket() {
        const x = this.rocket.x;
        const y = this.rocket.y;
        const rot = this.rocket.rotation;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rot + Math.PI / 2);
        
        // Triebwerks-Flamme
        const flameSize = 20 + Math.sin(this.rocket.flame) * 8;
        const flameColor = this.rocket.boost ? '#00ffff' : '#ff8800';
        
        this.ctx.shadowColor = flameColor;
        this.ctx.shadowBlur = 25;
        
        const flameGrad = this.ctx.createLinearGradient(0, 20, 0, 20 + flameSize);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, flameColor);
        flameGrad.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = flameGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 20);
        this.ctx.lineTo(0, 20 + flameSize);
        this.ctx.lineTo(10, 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Raketen-Körper
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        
        const bodyGrad = this.ctx.createLinearGradient(-15, 0, 15, 0);
        bodyGrad.addColorStop(0, '#ff0055');
        bodyGrad.addColorStop(0.3, '#ff88aa');
        bodyGrad.addColorStop(0.7, '#ff88aa');
        bodyGrad.addColorStop(1, '#ff0055');
        
        this.ctx.fillStyle = bodyGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -25);
        this.ctx.lineTo(-15, 20);
        this.ctx.lineTo(15, 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Spitze
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -25);
        this.ctx.lineTo(-8, -10);
        this.ctx.lineTo(8, -10);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Flügel
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.beginPath();
        this.ctx.moveTo(-15, 15);
        this.ctx.lineTo(-25, 25);
        this.ctx.lineTo(-15, 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(15, 15);
        this.ctx.lineTo(25, 25);
        this.ctx.lineTo(15, 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Fenster
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
}


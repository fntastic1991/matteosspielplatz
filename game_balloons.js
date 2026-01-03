// game_balloons.js - 🌌 COSMIC Ballon-Spiel
import { audioManager } from './audio_utils.js';

export class BalloonGame {
    constructor() {
        this.balloons = [];
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        this.score = 0;
        this.level = 1;
        this.maxLevel = 10;
        this.balloonsPopped = 0;
        this.balloonsNeeded = 5;
        this.particles = [];
        this.stars = [];
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.level = 1;
        this.balloonsPopped = 0;
        this.balloonsNeeded = 5;
        this.particles = [];
        this.time = 0;
        
        this.generateStars();
        this.spawnBalloons();
        
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
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.04
            });
        }
    }
    
    spawnBalloons() {
        const colors = [
            { hex: '#ff0055', glow: '#ff0055' },
            { hex: '#00ffff', glow: '#00ffff' },
            { hex: '#00ff88', glow: '#00ff88' },
            { hex: '#ffff00', glow: '#ffff00' },
            { hex: '#ff00ff', glow: '#ff00ff' },
            { hex: '#ff8800', glow: '#ff8800' }
        ];
        
        const numBalloons = Math.min(4 + this.level, 10);
        
        for (let i = 0; i < numBalloons; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 40 + Math.random() * 25;
            
            this.balloons.push({
                x: 50 + Math.random() * (this.canvas.width - 100),
                y: this.canvas.height + 50 + Math.random() * 200,
                width: size,
                height: size * 1.3,
                color: color,
                speed: 0.5 + Math.random() * 0.8 + this.level * 0.15,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.03 + Math.random() * 0.02,
                wobbleAmount: 1 + Math.random() * 2,
                popping: false,
                scale: 1,
                glow: Math.random() * Math.PI * 2
            });
        }
    }
    
    handleClick = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const b = this.balloons[i];
            if (b.popping) continue;
            
            const dx = x - b.x;
            const dy = y - b.y;
            if (dx * dx / ((b.width / 2) ** 2) + dy * dy / ((b.height / 2) ** 2) <= 1) {
                this.popBalloon(b, i);
                break;
            }
        }
    }
    
    popBalloon(balloon, index) {
        balloon.popping = true;
        this.score += 10 * this.level;
        this.balloonsPopped++;
        this.createPopParticles(balloon.x, balloon.y, balloon.color.hex);
        audioManager.playPopSound();
        
        setTimeout(() => {
            const idx = this.balloons.indexOf(balloon);
            if (idx > -1) this.balloons.splice(idx, 1);
        }, 200);
        
        if (this.balloonsPopped >= this.balloonsNeeded) {
            this.levelUp();
        }
    }
    
    levelUp() {
        if (this.level >= this.maxLevel) {
            setTimeout(() => {
                this.stop();
                if (this.onExit) this.onExit();
            }, 1000);
        } else {
            this.level++;
            this.balloonsPopped = 0;
            this.balloonsNeeded = 5 + this.level;
            audioManager.playLevelUpSound();
        }
    }
    
    createPopParticles(x, y, color) {
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = 4 + Math.random() * 6;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 5 + Math.random() * 6
            });
        }
    }
    
    update() {
        this.time += 0.016;
        
        for (let balloon of this.balloons) {
            if (balloon.popping) {
                balloon.scale *= 1.15;
                continue;
            }
            
            balloon.y -= balloon.speed;
            balloon.wobble += balloon.wobbleSpeed;
            balloon.x += Math.sin(balloon.wobble) * balloon.wobbleAmount;
            balloon.glow += 0.04;
            
            if (balloon.y < -100) {
                balloon.y = this.canvas.height + 50;
                balloon.x = 50 + Math.random() * (this.canvas.width - 100);
            }
        }
        
        // Neue Ballons spawnen
        if (this.balloons.length < 4 + this.level) {
            this.spawnBalloons();
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
        gradient.addColorStop(0, '#0a0020');
        gradient.addColorStop(0.4, '#150040');
        gradient.addColorStop(0.7, '#200050');
        gradient.addColorStop(1, '#100030');
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
        
        // Nebel-Effekt
        this.ctx.save();
        this.ctx.globalAlpha = 0.08;
        const nebulaX = this.canvas.width / 2 + Math.sin(this.time * 0.3) * 50;
        const nebulaY = this.canvas.height / 2 + Math.cos(this.time * 0.2) * 30;
        const nebulaGrad = this.ctx.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, 300);
        nebulaGrad.addColorStop(0, '#ff00ff');
        nebulaGrad.addColorStop(0.5, '#8800ff');
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Ballons
        for (let balloon of this.balloons) {
            this.drawBalloon(balloon);
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.025;
            
            if (p.life > 0) {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 12;
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
        
        // Titel
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎈 Ballons platzen! 🎈', this.canvas.width / 2, 40);
        
        // Level
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, this.canvas.width / 2, 75);
        
        // Fortschritt
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`${this.balloonsPopped}/${this.balloonsNeeded} 💥`, this.canvas.width / 2, 105);
        
        // Score
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 26px "Fredoka One", sans-serif';
        this.ctx.fillText(`⭐ ${this.score}`, this.canvas.width / 2, this.canvas.height - 25);
        
        this.ctx.restore();
    }
    
    drawBalloon(balloon) {
        this.ctx.save();
        this.ctx.translate(balloon.x, balloon.y);
        this.ctx.scale(balloon.scale, balloon.scale);
        
        const glowIntensity = 15 + Math.sin(balloon.glow) * 10;
        
        // Schnur
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, balloon.height / 2);
        this.ctx.quadraticCurveTo(5, balloon.height / 2 + 30, -5, balloon.height / 2 + 60);
        this.ctx.stroke();
        
        // Glow
        this.ctx.shadowColor = balloon.color.glow;
        this.ctx.shadowBlur = glowIntensity;
        
        // Gradient
        const grad = this.ctx.createRadialGradient(
            -balloon.width * 0.2, -balloon.height * 0.2, 0,
            0, 0, balloon.height / 2
        );
        grad.addColorStop(0, this.lightenColor(balloon.color.hex, 0.5));
        grad.addColorStop(0.5, balloon.color.hex);
        grad.addColorStop(1, this.darkenColor(balloon.color.hex, 0.3));
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, balloon.width / 2, balloon.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Highlight
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            -balloon.width * 0.2, -balloon.height * 0.2,
            balloon.width * 0.2, balloon.height * 0.15,
            -0.5, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Knoten
        this.ctx.fillStyle = balloon.color.hex;
        this.ctx.beginPath();
        this.ctx.moveTo(-5, balloon.height / 2 - 5);
        this.ctx.lineTo(5, balloon.height / 2 - 5);
        this.ctx.lineTo(0, balloon.height / 2 + 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    lightenColor(hex, factor) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, ((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * factor);
        const g = Math.min(255, ((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * factor);
        const b = Math.min(255, (num & 255) + (255 - (num & 255)) * factor);
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    
    darkenColor(hex, factor) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.floor(((num >> 16) & 255) * (1 - factor));
        const g = Math.floor(((num >> 8) & 255) * (1 - factor));
        const b = Math.floor((num & 255) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

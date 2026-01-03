// game_numbers.js - 🌌 COSMIC Zahlen-Spiel
import { audioManager } from './audio_utils.js';

export class NumbersGame {
    constructor() {
        this.numbers = [];
        this.currentNumber = 1;
        this.maxNumber = 5;
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        this.level = 1;
        this.maxLevel = 10;
        this.particles = [];
        this.stars = [];
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
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
        for (let i = 0; i < 100; i++) {
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
        this.maxNumber = Math.min(5 + this.level, 12);
        this.currentNumber = 1;
        this.numbers = [];
        
        const circleSize = Math.min(60, (this.canvas.width - 80) / 4);
        const colors = [
            { hex: '#ff0055', glow: '#ff0055' },
            { hex: '#00ffff', glow: '#00ffff' },
            { hex: '#00ff88', glow: '#00ff88' },
            { hex: '#ffff00', glow: '#ffff00' },
            { hex: '#ff00ff', glow: '#ff00ff' },
            { hex: '#ff8800', glow: '#ff8800' }
        ];
        
        const positions = [];
        for (let i = 1; i <= this.maxNumber; i++) {
            let x, y, valid;
            let attempts = 0;
            
            do {
                x = circleSize + Math.random() * (this.canvas.width - circleSize * 2);
                y = 180 + Math.random() * (this.canvas.height - 280);
                valid = positions.every(pos => Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2) > circleSize * 1.8);
                attempts++;
            } while (!valid && attempts < 50);
            
            positions.push({ x, y });
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.numbers.push({
                value: i, x, y,
                radius: circleSize / 2,
                color: color,
                found: false,
                scale: 1,
                glow: Math.random() * Math.PI * 2,
                pulse: 1
            });
        }
    }
    
    handleClick = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        for (let num of this.numbers) {
            if (num.found) continue;
            const distance = Math.sqrt((x - num.x) ** 2 + (y - num.y) ** 2);
            if (distance <= num.radius * num.scale) {
                if (num.value === this.currentNumber) {
                    this.handleCorrect(num);
                } else {
                    this.handleWrong(num);
                }
                break;
            }
        }
    }
    
    handleCorrect(num) {
        num.found = true;
        this.animateSuccess(num);
        this.createSuccessParticles(num.x, num.y, num.color.hex);
        audioManager.playSuccessSound();
        
        this.currentNumber++;
        
        if (this.currentNumber > this.maxNumber) {
            this.levelComplete();
        }
    }
    
    handleWrong(num) {
        this.animateShake(num);
        audioManager.playErrorSound();
    }
    
    animateSuccess(num) {
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            num.scale = progress < 0.4 ? 1 + progress * 0.7 : 1.28 - (progress - 0.4) * 0.7;
            num.pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                num.scale = 1;
                num.pulse = 1;
            }
        };
        animate();
    }
    
    animateShake(num) {
        const startTime = Date.now();
        const duration = 350;
        const startX = num.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            num.x = startX + Math.sin(progress * Math.PI * 5) * 12 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                num.x = startX;
            }
        };
        animate();
    }
    
    levelComplete() {
        this.createLevelParticles();
        
        setTimeout(() => {
            if (this.level >= this.maxLevel) {
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                this.level++;
                this.generateLevel();
                audioManager.playLevelUpSound();
            }
        }, 1500);
    }
    
    createSuccessParticles(x, y, color) {
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 4 + Math.random() * 5
            });
        }
    }
    
    createLevelParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: ['#ff00ff', '#00ffff', '#ffff00', '#00ff88'][Math.floor(Math.random() * 4)],
                size: 5 + Math.random() * 6
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
        gradient.addColorStop(0, '#0a0025');
        gradient.addColorStop(0.5, '#150045');
        gradient.addColorStop(1, '#0a0025');
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
        this.ctx.globalAlpha = 0.07;
        const nebulaGrad = this.ctx.createRadialGradient(
            this.canvas.width * 0.5, this.canvas.height * 0.5, 0,
            this.canvas.width * 0.5, this.canvas.height * 0.5, 300
        );
        nebulaGrad.addColorStop(0, '#ffff00');
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // UI
        this.ctx.save();
        
        // Titel
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔢 Zahlen Galaxie! 🔢', this.canvas.width / 2, 35);
        
        // Level
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, this.canvas.width / 2, 70);
        
        // Nächste Zahl
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 26px "Fredoka One", sans-serif';
        const nextText = this.currentNumber <= this.maxNumber ? `Finde: ${this.currentNumber}` : '🎉 Geschafft!';
        this.ctx.fillText(nextText, this.canvas.width / 2, 110);
        
        // Fortschritt
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`${Math.min(this.currentNumber - 1, this.maxNumber)}/${this.maxNumber} ✨`, this.canvas.width / 2, 145);
        
        this.ctx.restore();
        
        // Zahlen
        for (let num of this.numbers) {
            this.drawNumber(num);
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            
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
    }
    
    drawNumber(num) {
        this.ctx.save();
        
        num.glow += 0.04;
        const baseGlow = num.found ? 25 : (15 + Math.sin(num.glow) * 10);
        const glowIntensity = baseGlow * num.pulse;
        
        // Glow
        this.ctx.shadowColor = num.color.glow;
        this.ctx.shadowBlur = glowIntensity;
        
        // Gradient
        const grad = this.ctx.createRadialGradient(
            num.x - num.radius * 0.3, num.y - num.radius * 0.3, 0,
            num.x, num.y, num.radius * num.scale
        );
        
        if (num.found) {
            grad.addColorStop(0, 'rgba(150, 150, 150, 0.8)');
            grad.addColorStop(1, 'rgba(80, 80, 80, 0.6)');
        } else {
            grad.addColorStop(0, this.lightenColor(num.color.hex, 0.4));
            grad.addColorStop(0.6, num.color.hex);
            grad.addColorStop(1, this.darkenColor(num.color.hex, 0.3));
        }
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(num.x, num.y, num.radius * num.scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ring
        if (!num.found && num.value === this.currentNumber) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(num.x, num.y, num.radius * num.scale * 1.15, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Highlight
        if (!num.found) {
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            this.ctx.beginPath();
            this.ctx.ellipse(
                num.x - num.radius * 0.2, num.y - num.radius * 0.2,
                num.radius * 0.35 * num.scale, num.radius * 0.2 * num.scale,
                -0.5, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Zahl
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = num.found ? '#666' : '#ffffff';
        this.ctx.font = `bold ${num.radius * 0.9 * num.scale}px "Fredoka One", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(num.value, num.x, num.y + 3);
        
        // Häkchen für gefundene
        if (num.found) {
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = `${num.radius * 0.6}px Arial`;
            this.ctx.fillText('✓', num.x + num.radius * 0.5, num.y - num.radius * 0.5);
        }
        
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

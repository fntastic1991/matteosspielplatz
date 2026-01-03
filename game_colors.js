// game_colors.js - 🌌 COSMIC Farben-Spiel
import { audioManager } from './audio_utils.js';

export class ColorGame {
    constructor() {
        this.colors = [
            { name: 'Rot', hex: '#ff0055', glow: '#ff0055' },
            { name: 'Blau', hex: '#0088ff', glow: '#00aaff' },
            { name: 'Gelb', hex: '#ffdd00', glow: '#ffff00' },
            { name: 'Grün', hex: '#00ff88', glow: '#00ff88' },
            { name: 'Lila', hex: '#aa00ff', glow: '#cc00ff' },
            { name: 'Orange', hex: '#ff8800', glow: '#ffaa00' },
            { name: 'Pink', hex: '#ff00aa', glow: '#ff44cc' },
            { name: 'Türkis', hex: '#00ffff', glow: '#00ffff' }
        ];
        this.currentColor = null;
        this.circles = [];
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        this.score = 0;
        this.level = 1;
        this.maxLevel = 15;
        this.particles = [];
        this.stars = [];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.level = 1;
        this.particles = [];
        
        this.generateStars();
        this.generateNewRound();
        
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        this.render();
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
    
    generateNewRound() {
        const numCircles = Math.min(3 + Math.floor(this.level / 2), 8);
        const selectedColors = [...this.colors].sort(() => Math.random() - 0.5).slice(0, numCircles);
        
        this.currentColor = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        this.circles = [];
        
        const rows = numCircles <= 4 ? 2 : (numCircles <= 6 ? 2 : 3);
        const cols = Math.ceil(numCircles / rows);
        const circleSize = Math.min(80, (this.canvas.width - 100) / cols / 1.5);
        const spacingX = (this.canvas.width - circleSize * cols) / (cols + 1);
        const spacingY = 100;
        const startY = 180;
        
        for (let i = 0; i < numCircles; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const itemsInRow = row === rows - 1 ? numCircles - row * cols : cols;
            const rowOffset = (cols - itemsInRow) * (circleSize + spacingX) / 2;
            
            this.circles.push({
                x: spacingX + col * (circleSize + spacingX) + circleSize / 2 + rowOffset,
                y: startY + row * spacingY,
                radius: circleSize / 2,
                color: selectedColors[i],
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
        
        for (let circle of this.circles) {
            const distance = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
            if (distance <= circle.radius * circle.scale) {
                if (circle.color.name === this.currentColor.name) {
                    this.handleCorrect(circle);
                } else {
                    this.handleWrong(circle);
                }
                break;
            }
        }
    }
    
    handleCorrect(circle) {
        this.score += 10 * this.level;
        this.createSuccessParticles(circle.x, circle.y, circle.color.hex);
        this.animateSuccess(circle);
        audioManager.playSuccessSound();
        
        setTimeout(() => {
            if (this.level >= this.maxLevel) {
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                this.level++;
                this.generateNewRound();
            }
        }, 800);
    }
    
    handleWrong(circle) {
        this.animateShake(circle);
        audioManager.playErrorSound();
    }
    
    animateSuccess(circle) {
        const startTime = Date.now();
        const duration = 600;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            circle.scale = progress < 0.4 ? 1 + progress * 0.8 : 1.32 - (progress - 0.4) * 0.8;
            circle.pulse = 1 + Math.sin(progress * Math.PI * 3) * 0.3;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                circle.scale = 1;
                circle.pulse = 1;
            }
        };
        animate();
    }
    
    animateShake(circle) {
        const startTime = Date.now();
        const duration = 400;
        const startX = circle.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            circle.x = startX + Math.sin(progress * Math.PI * 6) * 15 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                circle.x = startX;
            }
        };
        animate();
    }
    
    createSuccessParticles(x, y, color) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 5 + Math.random() * 6
            });
        }
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#050515');
        gradient.addColorStop(0.5, '#100530');
        gradient.addColorStop(1, '#050515');
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
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.6
        );
        nebulaGrad.addColorStop(0, this.currentColor ? this.currentColor.glow : '#ff00ff');
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Titel mit Neon-Glow
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎨 Finde die Farbe! 🎨', this.canvas.width / 2, 40);
        this.ctx.restore();
        
        // Level
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, this.canvas.width / 2, 70);
        this.ctx.restore();
        
        // Gesuchte Farbe
        if (this.currentColor) {
            this.ctx.save();
            this.ctx.shadowColor = this.currentColor.glow;
            this.ctx.shadowBlur = 25;
            this.ctx.fillStyle = this.currentColor.hex;
            this.ctx.font = 'bold 36px "Fredoka One", sans-serif';
            this.ctx.fillText(this.currentColor.name, this.canvas.width / 2, 120);
            this.ctx.restore();
        }
        
        // Kreise
        for (let circle of this.circles) {
            this.ctx.save();
            
            circle.glow += 0.04;
            const glowIntensity = 20 + Math.sin(circle.glow) * 12;
            
            // Outer Glow
            this.ctx.shadowColor = circle.color.glow;
            this.ctx.shadowBlur = glowIntensity * circle.pulse;
            
            // Gradient
            const grad = this.ctx.createRadialGradient(
                circle.x - circle.radius * 0.3, circle.y - circle.radius * 0.3, 0,
                circle.x, circle.y, circle.radius * circle.scale
            );
            grad.addColorStop(0, this.lightenColor(circle.color.hex, 0.4));
            grad.addColorStop(0.6, circle.color.hex);
            grad.addColorStop(1, this.darkenColor(circle.color.hex, 0.3));
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius * circle.scale, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            this.ctx.beginPath();
            this.ctx.ellipse(
                circle.x - circle.radius * 0.25,
                circle.y - circle.radius * 0.25,
                circle.radius * 0.35 * circle.scale,
                circle.radius * 0.2 * circle.scale,
                -0.5, 0, Math.PI * 2
            );
            this.ctx.fill();
            
            // Neon-Ring
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius * circle.scale * 0.85, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
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
        
        // Score
        this.ctx.save();
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 26px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`⭐ ${this.score}`, this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.restore();
        
        requestAnimationFrame(this.render);
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

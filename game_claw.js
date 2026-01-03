// game_claw.js - 🌌 COSMIC Greifautomat Spiel
import { audioManager } from './audio_utils.js';

export class ClawGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.box = { x: 0, y: 0, width: 0, height: 0 };
        this.claw = { x: 0, y: 100, targetX: 0, state: 'idle', openAmount: 30, grabbedToy: null };
        this.toys = [];
        this.score = 0;
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
        this.particles = [];
        this.time = 0;
        
        this.box = {
            x: 30, y: 90,
            width: this.canvas.width - 60,
            height: this.canvas.height - 180
        };
        
        this.claw = {
            x: this.box.x + this.box.width / 2,
            y: this.box.y + 40,
            targetX: this.box.x + this.box.width / 2,
            state: 'idle',
            openAmount: 30,
            grabbedToy: null,
            glow: 0
        };
        
        this.generateStars();
        this.generateToys();
        
        this.canvas.addEventListener('click', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
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
    
    generateToys() {
        this.toys = [];
        const colors = ['#ff0055', '#00ffff', '#00ff88', '#ffff00', '#ff00ff', '#ff8800'];
        const emojis = ['🌟', '💎', '🎮', '🎈', '🎁', '🧸', '🌈', '🍬', '⚽', '🎪'];
        
        const toyAreaBottom = this.box.y + this.box.height - 40;
        const toyAreaTop = toyAreaBottom - 200;
        
        for (let i = 0; i < 12; i++) {
            const size = 35 + Math.random() * 15;
            let x, y, overlapping;
            let attempts = 0;
            
            do {
                x = this.box.x + 50 + Math.random() * (this.box.width - 100);
                y = toyAreaTop + Math.random() * (toyAreaBottom - toyAreaTop);
                overlapping = this.toys.some(t => 
                    Math.abs(t.x - x) < size && Math.abs(t.y - y) < size
                );
                attempts++;
            } while (overlapping && attempts < 20);
            
            this.toys.push({
                x, y, size,
                color: colors[Math.floor(Math.random() * colors.length)],
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                caught: false,
                glow: Math.random() * Math.PI * 2
            });
        }
    }
    
    handleInput = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        // "Greifen"-Button
        if (y > this.canvas.height - 80) {
            if (this.claw.state === 'idle') {
                this.claw.state = 'moving_down';
                audioManager.playClickSound();
            }
            return;
        }
        
        // Greifer horizontal bewegen (nur oben)
        if (this.claw.state === 'idle' && y < 120) {
            const minX = this.box.x + 40;
            const maxX = this.box.x + this.box.width - 40;
            const clampedX = Math.max(minX, Math.min(maxX, x));
            this.claw.x = clampedX;
            this.claw.targetX = clampedX;
        }
    }
    
    update() {
        this.time += 0.016;
        
        const speed = 4;
        
        switch (this.claw.state) {
            case 'moving_down':
                this.claw.y += speed;
                if (this.claw.y >= this.box.y + this.box.height - 90) {
                    this.claw.y = this.box.y + this.box.height - 90;
                    this.claw.state = 'closing';
                }
                break;
                
            case 'closing':
                this.claw.openAmount -= 2;
                if (this.claw.openAmount <= 0) {
                    this.claw.openAmount = 0;
                    this.tryGrab();
                    this.claw.state = 'moving_up';
                }
                break;
                
            case 'moving_up':
                this.claw.y -= speed;
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                    this.claw.grabbedToy.y = this.claw.y + 45;
                }
                if (this.claw.y <= this.box.y + 40) {
                    this.claw.y = this.box.y + 40;
                    this.claw.state = 'returning';
                }
                break;
                
            case 'returning':
                const dropX = this.box.x + 50;
                this.claw.x += (dropX - this.claw.x) * 0.12;
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                }
                
                if (Math.abs(this.claw.x - dropX) < 3) {
                    this.claw.openAmount = 30;
                    if (this.claw.grabbedToy) {
                        this.score++;
                        this.createParticles(this.claw.x, this.claw.y + 50, this.claw.grabbedToy.color);
                        const index = this.toys.indexOf(this.claw.grabbedToy);
                        if (index > -1) this.toys.splice(index, 1);
                        this.claw.grabbedToy = null;
                        audioManager.playSuccessSound();
                    }
                    this.claw.x = this.box.x + this.box.width / 2;
                    this.claw.state = 'idle';
                    
                    if (this.toys.filter(t => !t.caught).length === 0) {
                        setTimeout(() => { if (this.onExit) this.onExit(); }, 2000);
                    }
                }
                break;
        }
    }
    
    tryGrab() {
        let bestToy = null;
        let bestDistance = Infinity;
        
        for (let toy of this.toys) {
            if (toy.caught) continue;
            const dx = Math.abs(toy.x - this.claw.x);
            const dy = Math.abs(toy.y - (this.claw.y + 45));
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (dx < toy.size / 2 + 50 && dy < toy.size + 30) {
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestToy = toy;
                }
            }
        }
        
        if (bestToy) {
            bestToy.caught = true;
            this.claw.grabbedToy = bestToy;
            this.createParticles(bestToy.x, bestToy.y, bestToy.color);
        } else {
            audioManager.playErrorSound();
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 4 + Math.random() * 4
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
        gradient.addColorStop(0, '#0a0020');
        gradient.addColorStop(0.5, '#150040');
        gradient.addColorStop(1, '#0a0020');
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
        
        // Automat-Rahmen (Neon-Glas)
        this.ctx.save();
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 25;
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.roundRect(this.box.x, this.box.y, this.box.width, this.box.height, 20);
        this.ctx.stroke();
        
        // Glaseffekt
        this.ctx.fillStyle = 'rgba(100, 0, 150, 0.15)';
        this.ctx.fill();
        this.ctx.restore();
        
        // Schiene
        this.ctx.fillStyle = '#333';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(this.box.x + 10, this.box.y + 20, this.box.width - 20, 12);
        this.ctx.shadowBlur = 0;
        
        // Neon-Linie auf Schiene
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.box.x + 10, this.box.y + 26);
        this.ctx.lineTo(this.box.x + this.box.width - 10, this.box.y + 26);
        this.ctx.stroke();
        
        // Spielzeuge
        for (let toy of this.toys) {
            if (toy.caught && toy !== this.claw.grabbedToy) continue;
            
            toy.glow += 0.05;
            const glowIntensity = 12 + Math.sin(toy.glow) * 6;
            
            this.ctx.save();
            this.ctx.translate(toy.x, toy.y);
            
            // Glow
            this.ctx.shadowColor = toy.color;
            this.ctx.shadowBlur = glowIntensity;
            
            // Hintergrund-Kreis
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, toy.size / 2);
            grad.addColorStop(0, toy.color);
            grad.addColorStop(1, this.darkenColor(toy.color, 0.4));
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, toy.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Emoji
            this.ctx.shadowBlur = 0;
            this.ctx.font = `${toy.size * 0.7}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(toy.emoji, 0, 2);
            
            this.ctx.restore();
        }
        
        // Greifer
        this.drawClaw();
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.025;
            
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
        
        // UI - Titel
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 26px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎪 COSMIC CLAW 🎪', this.canvas.width / 2, 35);
        
        // Score
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`⭐ ${this.score} gefangen!`, this.canvas.width / 2, 70);
        this.ctx.restore();
        
        // Greifen-Button
        this.ctx.save();
        const buttonY = this.canvas.height - 60;
        const buttonWidth = 200;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        
        const isActive = this.claw.state === 'idle';
        const buttonColor = isActive ? '#00ff88' : '#444';
        const glowColor = isActive ? '#00ff88' : 'transparent';
        
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = isActive ? 20 : 0;
        
        const btnGrad = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + 50);
        btnGrad.addColorStop(0, buttonColor);
        btnGrad.addColorStop(1, this.darkenColor(buttonColor, 0.3));
        this.ctx.fillStyle = btnGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, 50, 25);
        this.ctx.fill();
        
        this.ctx.fillStyle = isActive ? '#003322' : '#222';
        this.ctx.font = 'bold 22px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText(isActive ? '⬇️ GREIFEN!' : '⏳ Warte...', this.canvas.width / 2, buttonY + 25);
        this.ctx.restore();
        
        // Anleitung
        if (this.claw.state === 'idle') {
            this.ctx.save();
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👆 Tippe oben um den Greifer zu bewegen!', this.canvas.width / 2, this.box.y + this.box.height + 30);
            this.ctx.restore();
        }
    }
    
    drawClaw() {
        const x = this.claw.x;
        const y = this.claw.y;
        
        this.claw.glow = (this.claw.glow || 0) + 0.05;
        const glowIntensity = 15 + Math.sin(this.claw.glow) * 8;
        
        // Seil
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x, this.box.y + 32);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Greifer-Kopf
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = glowIntensity;
        
        const headGrad = this.ctx.createLinearGradient(x - 25, y, x + 25, y);
        headGrad.addColorStop(0, '#ff00ff');
        headGrad.addColorStop(0.5, '#ff88ff');
        headGrad.addColorStop(1, '#ff00ff');
        this.ctx.fillStyle = headGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(x - 25, y, 50, 25, 8);
        this.ctx.fill();
        this.ctx.restore();
        
        // Greifarme
        const armLength = 45;
        const openAmount = this.claw.openAmount;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 10;
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        // Linker Arm
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y + 25);
        this.ctx.lineTo(x - 15 - openAmount, y + 25 + armLength);
        this.ctx.stroke();
        
        // Rechter Arm
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y + 25);
        this.ctx.lineTo(x + 15 + openAmount, y + 25 + armLength);
        this.ctx.stroke();
        
        // Greifer-Krallen
        this.ctx.lineWidth = 6;
        
        // Linke Kralle
        this.ctx.beginPath();
        this.ctx.arc(x - 15 - openAmount, y + 25 + armLength, 10, Math.PI * 0.5, Math.PI * 1.5);
        this.ctx.stroke();
        
        // Rechte Kralle
        this.ctx.beginPath();
        this.ctx.arc(x + 15 + openAmount, y + 25 + armLength, 10, -Math.PI * 0.5, Math.PI * 0.5);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Wagen auf Schiene
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.roundRect(x - 20, this.box.y + 15, 40, 20, 5);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substring(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substring(2, 4), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substring(4, 6), 16) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

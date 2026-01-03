// game_claw.js - 🎪 COSMIC CLAW - Komplett überarbeitet!
import { audioManager } from './audio_utils.js';

export class ClawGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.box = { x: 0, y: 0, width: 0, height: 0 };
        this.claw = { 
            x: 0, 
            y: 100, 
            targetX: 0, 
            state: 'idle', 
            openAmount: 35, 
            grabbedToy: null,
            swingAngle: 0,
            glow: 0
        };
        this.toys = [];
        this.score = 0;
        this.particles = [];
        this.stars = [];
        this.time = 0;
        this.grabbedCount = 0;
        this.totalToys = 10;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.grabbedCount = 0;
        this.particles = [];
        this.time = 0;
        
        // Box nimmt den gesamten Bereich ein
        this.box = {
            x: 20,
            y: 100,
            width: this.canvas.width - 40,
            height: this.canvas.height - 200
        };
        
        // Greifer startet oben in der Mitte
        this.claw = {
            x: this.box.x + this.box.width / 2,
            y: this.box.y + 50,
            targetX: this.box.x + this.box.width / 2,
            state: 'idle',
            openAmount: 35,
            grabbedToy: null,
            swingAngle: 0,
            glow: 0
        };
        
        this.generateStars();
        this.generateToys();
        
        // Event Listeners
        this.canvas.addEventListener('click', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput);
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('touchmove', this.handleMove);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('touchmove', this.handleMove);
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
        const emojis = ['🧸', '⭐', '💎', '🎁', '🌟', '🎈', '🍬', '🎮', '🏀', '🎪'];
        const colors = ['#ff0055', '#00ffff', '#00ff88', '#ffff00', '#ff00ff', '#ff8800'];
        
        // Spielzeuge im unteren Bereich der Box verteilen
        const toyAreaTop = this.box.y + this.box.height - 180;
        const toyAreaBottom = this.box.y + this.box.height - 30;
        
        this.totalToys = 10;
        
        for (let i = 0; i < this.totalToys; i++) {
            const size = 40 + Math.random() * 15;
            let x, y, overlapping;
            let attempts = 0;
            
            do {
                x = this.box.x + 40 + Math.random() * (this.box.width - 80);
                y = toyAreaTop + Math.random() * (toyAreaBottom - toyAreaTop);
                overlapping = this.toys.some(t => 
                    Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < (size + t.size) * 0.6
                );
                attempts++;
            } while (overlapping && attempts < 30);
            
            this.toys.push({
                x, y, size,
                color: colors[i % colors.length],
                emoji: emojis[i % emojis.length],
                caught: false,
                removed: false,
                glow: Math.random() * Math.PI * 2,
                bounce: Math.random() * Math.PI * 2
            });
        }
    }
    
    handleMove = (e) => {
        if (this.claw.state !== 'idle') return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        
        // Greifer folgt der Maus/Touch horizontal
        const minX = this.box.x + 35;
        const maxX = this.box.x + this.box.width - 35;
        this.claw.targetX = Math.max(minX, Math.min(maxX, x));
    }
    
    handleInput = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        // Greifen-Button geklickt
        const buttonY = this.canvas.height - 55;
        const buttonWidth = 220;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        
        if (y >= buttonY - 10 && y <= buttonY + 60 &&
            x >= buttonX && x <= buttonX + buttonWidth) {
            if (this.claw.state === 'idle') {
                this.claw.state = 'moving_down';
                audioManager.playClickSound();
            }
            return;
        }
        
        // Sonst: Greifer positionieren und sofort greifen!
        if (this.claw.state === 'idle') {
            const minX = this.box.x + 35;
            const maxX = this.box.x + this.box.width - 35;
            this.claw.x = Math.max(minX, Math.min(maxX, x));
            this.claw.targetX = this.claw.x;
            
            // Sofort greifen
            this.claw.state = 'moving_down';
            audioManager.playClickSound();
        }
    }
    
    update() {
        this.time += 0.016;
        
        // Greifer bewegt sich sanft zur Zielposition
        if (this.claw.state === 'idle') {
            this.claw.x += (this.claw.targetX - this.claw.x) * 0.2;
        }
        
        // Greifer schwingt leicht
        this.claw.swingAngle = Math.sin(this.time * 2) * 0.05;
        
        const speed = 5;
        const clawBottomY = this.box.y + this.box.height - 100;
        
        switch (this.claw.state) {
            case 'moving_down':
                this.claw.y += speed;
                if (this.claw.y >= clawBottomY) {
                    this.claw.y = clawBottomY;
                    this.claw.state = 'closing';
                }
                break;
                
            case 'closing':
                this.claw.openAmount -= 3;
                if (this.claw.openAmount <= 5) {
                    this.claw.openAmount = 5;
                    this.tryGrab();
                    this.claw.state = 'moving_up';
                }
                break;
                
            case 'moving_up':
                this.claw.y -= speed;
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                    this.claw.grabbedToy.y = this.claw.y + 60;
                }
                if (this.claw.y <= this.box.y + 50) {
                    this.claw.y = this.box.y + 50;
                    this.claw.state = 'returning';
                }
                break;
                
            case 'returning':
                // Zum Abwurf-Bereich fahren (links)
                const dropX = this.box.x + 60;
                this.claw.x += (dropX - this.claw.x) * 0.15;
                
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                }
                
                if (Math.abs(this.claw.x - dropX) < 5) {
                    // Spielzeug loslassen
                    this.claw.openAmount = 35;
                    
                    if (this.claw.grabbedToy) {
                        this.score += 10;
                        this.grabbedCount++;
                        this.createSuccessParticles(this.claw.x, this.claw.y + 60, this.claw.grabbedToy.color);
                        this.claw.grabbedToy.removed = true;
                        this.claw.grabbedToy = null;
                        audioManager.playSuccessSound();
                        
                        // Alle gefangen?
                        if (this.grabbedCount >= this.totalToys) {
                            setTimeout(() => {
                                if (this.onExit) this.onExit();
                            }, 2000);
                        }
                    }
                    
                    // Zurück zur Mitte
                    this.claw.targetX = this.box.x + this.box.width / 2;
                    this.claw.state = 'idle';
                }
                break;
        }
        
        // Spielzeuge animieren
        for (let toy of this.toys) {
            if (!toy.removed) {
                toy.glow += 0.05;
                toy.bounce += 0.03;
            }
        }
    }
    
    tryGrab() {
        // SUPER GROSSZÜGIGES GREIFEN!
        // Finde das nächste Spielzeug in Reichweite
        let bestToy = null;
        let bestDistance = Infinity;
        
        const clawGrabX = this.claw.x;
        const clawGrabY = this.claw.y + 60; // Greifer-Spitze
        
        for (let toy of this.toys) {
            if (toy.caught || toy.removed) continue;
            
            const dx = Math.abs(toy.x - clawGrabX);
            const dy = Math.abs(toy.y - clawGrabY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Sehr großzügiger Greifbereich: 80 Pixel!
            if (distance < 80) {
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestToy = toy;
                }
            }
        }
        
        if (bestToy) {
            bestToy.caught = true;
            this.claw.grabbedToy = bestToy;
            this.createGrabParticles(bestToy.x, bestToy.y, bestToy.color);
            audioManager.playScoreSound();
        } else {
            // Nichts erwischt
            audioManager.playErrorSound();
            this.createMissParticles(clawGrabX, clawGrabY);
        }
    }
    
    createGrabParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 5 + Math.random() * 5
            });
        }
    }
    
    createSuccessParticles(x, y, color) {
        for (let i = 0; i < 35; i++) {
            const angle = (Math.PI * 2 * i) / 35;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1, 
                color: ['#ffff00', '#00ff88', '#ff00ff', color][Math.floor(Math.random() * 4)],
                size: 6 + Math.random() * 6
            });
        }
    }
    
    createMissParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3,
                life: 1,
                color: '#666',
                size: 4 + Math.random() * 3
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
        gradient.addColorStop(0, '#0a0025');
        gradient.addColorStop(0.5, '#150045');
        gradient.addColorStop(1, '#0a0025');
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
        
        // Titel
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎪 COSMIC CLAW 🎪', this.canvas.width / 2, 40);
        
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`⭐ ${this.grabbedCount}/${this.totalToys} gefangen!`, this.canvas.width / 2, 75);
        this.ctx.restore();
        
        // Glaskasten
        this.ctx.save();
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 20;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(this.box.x, this.box.y, this.box.width, this.box.height, 15);
        this.ctx.stroke();
        
        // Glaseffekt
        this.ctx.fillStyle = 'rgba(100, 0, 150, 0.1)';
        this.ctx.fill();
        this.ctx.restore();
        
        // Schiene oben
        this.ctx.save();
        this.ctx.fillStyle = '#222';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(this.box.x + 5, this.box.y + 25, this.box.width - 10, 15);
        
        // Neon-Linie auf Schiene
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.box.x + 10, this.box.y + 32);
        this.ctx.lineTo(this.box.x + this.box.width - 10, this.box.y + 32);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Spielzeuge
        for (let toy of this.toys) {
            if (toy.removed) continue;
            
            const glowIntensity = 12 + Math.sin(toy.glow) * 6;
            const bounceY = Math.sin(toy.bounce) * 3;
            
            this.ctx.save();
            this.ctx.translate(toy.x, toy.y + bounceY);
            
            // Glow
            this.ctx.shadowColor = toy.color;
            this.ctx.shadowBlur = glowIntensity;
            
            // Hintergrund-Kreis
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, toy.size / 2);
            grad.addColorStop(0, this.lightenColor(toy.color, 0.3));
            grad.addColorStop(0.7, toy.color);
            grad.addColorStop(1, this.darkenColor(toy.color, 0.4));
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, toy.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Emoji
            this.ctx.shadowBlur = 0;
            this.ctx.font = `${toy.size * 0.6}px Arial`;
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
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.02;
            
            if (p.life > 0) {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 8;
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
        
        // GREIFEN Button
        this.drawGrabButton();
        
        // Anleitung
        if (this.claw.state === 'idle') {
            this.ctx.save();
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 18px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👆 Tippe wo du greifen willst!', this.canvas.width / 2, this.box.y + this.box.height + 25);
            this.ctx.restore();
        }
    }
    
    drawClaw() {
        const x = this.claw.x;
        const y = this.claw.y;
        
        this.claw.glow = (this.claw.glow || 0) + 0.05;
        const glowIntensity = 18 + Math.sin(this.claw.glow) * 10;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.claw.swingAngle);
        this.ctx.translate(-x, -y);
        
        // Seil
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 12;
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(x, this.box.y + 40);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        // Greifer-Motor
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = glowIntensity;
        
        const motorGrad = this.ctx.createLinearGradient(x - 30, y, x + 30, y);
        motorGrad.addColorStop(0, '#ff00ff');
        motorGrad.addColorStop(0.5, '#ff88ff');
        motorGrad.addColorStop(1, '#ff00ff');
        this.ctx.fillStyle = motorGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(x - 30, y, 60, 30, 10);
        this.ctx.fill();
        
        // Greifarme
        const armLength = 50;
        const openAmount = this.claw.openAmount;
        
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 12;
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        
        // Linker Arm
        this.ctx.beginPath();
        this.ctx.moveTo(x - 18, y + 30);
        this.ctx.lineTo(x - 18 - openAmount, y + 30 + armLength);
        this.ctx.stroke();
        
        // Rechter Arm
        this.ctx.beginPath();
        this.ctx.moveTo(x + 18, y + 30);
        this.ctx.lineTo(x + 18 + openAmount, y + 30 + armLength);
        this.ctx.stroke();
        
        // Greifer-Klauen (Halbkreise)
        this.ctx.lineWidth = 8;
        
        // Linke Klaue
        this.ctx.beginPath();
        this.ctx.arc(x - 18 - openAmount, y + 30 + armLength, 12, Math.PI * 0.5, Math.PI * 1.5);
        this.ctx.stroke();
        
        // Rechte Klaue
        this.ctx.beginPath();
        this.ctx.arc(x + 18 + openAmount, y + 30 + armLength, 12, -Math.PI * 0.5, Math.PI * 0.5);
        this.ctx.stroke();
        
        // Wagen auf Schiene
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 18;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.roundRect(x - 25, this.box.y + 20, 50, 25, 8);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawGrabButton() {
        const buttonY = this.canvas.height - 55;
        const buttonWidth = 220;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        
        const isActive = this.claw.state === 'idle';
        
        this.ctx.save();
        
        if (isActive) {
            // Pulsierender Glow
            const pulse = Math.sin(this.time * 4) * 0.3 + 0.7;
            this.ctx.shadowColor = '#00ff88';
            this.ctx.shadowBlur = 25 * pulse;
        }
        
        // Button Hintergrund
        const btnGrad = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + 55);
        if (isActive) {
            btnGrad.addColorStop(0, '#00ff88');
            btnGrad.addColorStop(1, '#00aa55');
        } else {
            btnGrad.addColorStop(0, '#444');
            btnGrad.addColorStop(1, '#222');
        }
        
        this.ctx.fillStyle = btnGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, 55, 28);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = isActive ? '#ffffff' : '#555';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = isActive ? '#003322' : '#666';
        this.ctx.font = 'bold 24px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(isActive ? '⬇️ GREIFEN!' : '⏳ Warte...', this.canvas.width / 2, buttonY + 28);
        
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

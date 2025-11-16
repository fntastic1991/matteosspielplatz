// game_claw.js - Einfacher Greifautomat (von oben gesehen)
import { audioManager } from './audio_utils.js';

export class ClawGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Spielfeld
        this.box = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        
        // Greifer
        this.claw = {
            x: 0,
            y: 0,
            width: 80,
            height: 80,
            targetX: 0,
            baseY: 0,
            state: 'idle', // idle, moving_down, closing, moving_up, returning
            openAmount: 1, // 1 = offen, 0 = geschlossen
            grabbedToy: null
        };
        
        // Plüschtiere
        this.toys = [];
        this.caughtToys = 0;
        this.targetCount = 5;
        
        // Score
        this.score = 0;
        
        // Effekte
        this.particles = [];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        
        // Box-Setup (80% der Canvas-Größe)
        this.box.width = this.canvas.width * 0.8;
        this.box.height = this.canvas.height * 0.7;
        this.box.x = (this.canvas.width - this.box.width) / 2;
        this.box.y = 100;
        
        // Greifer-Start (oben, mitte)
        this.claw.x = this.canvas.width / 2;
        this.claw.y = 60;
        this.claw.targetX = this.claw.x;
        this.claw.baseY = this.claw.y;
        this.claw.state = 'idle';
        this.claw.openAmount = 1;
        this.claw.grabbedToy = null;
        
        // Reset
        this.caughtToys = 0;
        this.score = 0;
        this.toys = [];
        
        // Toys generieren
        this.generateToys();
        
        // Event Listeners
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleTouch);
        
        // Game Loop
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
    
    generateToys() {
        const toyTypes = [
            { emoji: '🧸', color: '#f59e0b', size: 50, points: 10 },
            { emoji: '🐻', color: '#92400e', size: 50, points: 10 },
            { emoji: '🐰', color: '#ec4899', size: 45, points: 10 },
            { emoji: '🦁', color: '#fbbf24', size: 50, points: 15 },
            { emoji: '🐯', color: '#f97316', size: 50, points: 15 },
            { emoji: '🐼', color: '#1e293b', size: 50, points: 15 },
            { emoji: '⭐', color: '#fbbf24', size: 45, points: 30 },
            { emoji: '💎', color: '#3b82f6', size: 40, points: 50 }
        ];
        
        // 10 Toys erstellen
        for (let i = 0; i < 10; i++) {
            const type = toyTypes[Math.floor(Math.random() * toyTypes.length)];
            const padding = type.size / 2 + 20;
            
            this.toys.push({
                x: this.box.x + padding + Math.random() * (this.box.width - padding * 2),
                y: this.box.y + padding + Math.random() * (this.box.height - padding * 2),
                emoji: type.emoji,
                color: type.color,
                size: type.size,
                points: type.points,
                caught: false,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }
    
    handleClick = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleInput(x, y);
    }
    
    handleTouch = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.handleInput(x, y);
    }
    
    handleInput(x, y) {
        // Wenn Greifer beschäftigt ist, ignoriere Klicks
        if (this.claw.state !== 'idle') return;
        
        // Check Grab-Button
        const buttonWidth = 150;
        const buttonHeight = 60;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height - 80;
        
        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            this.startGrab();
            return;
        }
        
        // Bewege Greifer zu geklickter Position (nur horizontal)
        if (y < 90) { // Nur klicks im oberen Bereich
            const minX = this.box.x + 40;
            const maxX = this.box.x + this.box.width - 40;
            this.claw.targetX = Math.max(minX, Math.min(maxX, x));
        }
    }
    
    startGrab() {
        if (this.claw.state !== 'idle') return;
        
        this.claw.state = 'moving_down';
        this.claw.openAmount = 1;
        audioManager.playClickSound();
    }
    
    update() {
        // Bewege Greifer horizontal (nur im Idle-Zustand)
        if (this.claw.state === 'idle') {
            const dx = this.claw.targetX - this.claw.x;
            if (Math.abs(dx) > 1) {
                this.claw.x += dx * 0.15;
            }
        }
        
        // Animations-Logik je nach Zustand
        switch (this.claw.state) {
            case 'moving_down': {
                const targetY = this.box.y + 50; // in die Box hinein
                if (this.claw.y < targetY) {
                    this.claw.y += 8;
                    if (this.claw.y >= targetY) {
                        this.claw.y = targetY;
                        this.claw.state = 'closing';
                    }
                }
                break;
            }
            case 'closing': {
                // Greifer schliessen
                this.claw.openAmount = Math.max(0, this.claw.openAmount - 0.12);
                if (this.claw.openAmount <= 0) {
                    this.tryGrab();
                    this.claw.state = 'moving_up';
                }
                break;
            }
            case 'moving_up': {
                // Greifer wieder nach oben
                if (this.claw.y > this.claw.baseY) {
                    this.claw.y -= 8;
                    if (this.claw.y <= this.claw.baseY) {
                        this.claw.y = this.claw.baseY;
                        this.claw.state = 'returning';
                    }
                }
                
                // Gefangenes Toy mitbewegen
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                    this.claw.grabbedToy.y = this.claw.y + 60;
                }
                break;
            }
            case 'returning': {
                // Öffne Greifer langsam wieder
                this.claw.openAmount = Math.min(1, this.claw.openAmount + 0.05);
                
                // Bewege zur Mitte
                const centerX = this.canvas.width / 2;
                const dx = centerX - this.claw.x;
                
                if (Math.abs(dx) > 2) {
                    this.claw.x += dx * 0.1;
                    
                    // Gefangenes Toy mitbewegen
                    if (this.claw.grabbedToy) {
                        this.claw.grabbedToy.x = this.claw.x;
                        this.claw.grabbedToy.y = this.claw.y + 60;
                    }
                } else {
                    // Angekommen - Toy einsammeln (falls vorhanden)
                    if (this.claw.grabbedToy) {
                        this.collectToy(this.claw.grabbedToy);
                        this.claw.grabbedToy = null;
                    }
                    this.claw.state = 'idle';
                    this.claw.openAmount = 1;
                }
                break;
            }
        }
        
        // Toy wobble
        for (let toy of this.toys) {
            if (!toy.caught) {
                toy.wobble += 0.03;
            }
        }
        
        // Partikel updaten
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    tryGrab() {
        let closestToy = null;
        let closestDist = Infinity;
        
        // Position des Greifers am unteren Ende
        const clawX = this.claw.x;
        const clawY = this.claw.y + 40;
        
        // Finde nächstes Toy direkt unter dem Greifer
        for (let toy of this.toys) {
            if (toy.caught) continue;
            
            const dx = toy.x - clawX;
            const dy = toy.y - clawY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestToy = toy;
            }
        }
        
        // SEHR großzügige Hitbox (100px!)
        if (closestToy && closestDist < 100) {
            closestToy.caught = true;
            this.claw.grabbedToy = closestToy;
            audioManager.playSuccessSound();
            this.createParticles(closestToy.x, closestToy.y, closestToy.color);
        } else {
            audioManager.playErrorSound();
        }
    }
    
    collectToy(toy) {
        this.caughtToys++;
        this.score += toy.points;
        
        // Entferne aus Array
        const index = this.toys.indexOf(toy);
        if (index > -1) {
            this.toys.splice(index, 1);
        }
        
        // Partikel-Effekt
        this.createParticles(this.claw.x, this.claw.y + 20, toy.color);
        audioManager.playScoreSound();
        
        // Gewonnen?
        if (this.caughtToys >= this.targetCount) {
            setTimeout(() => {
                this.stop();
                if (this.onExit) this.onExit();
            }, 1000);
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color: color,
                size: 3 + Math.random() * 4
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
        // Hintergrund
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#1e1b4b');
        bgGradient.addColorStop(0.5, '#5b21b6');
        bgGradient.addColorStop(1, '#7c3aed');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Titel
        this.ctx.save();
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('🎪 GREIFAUTOMAT 🎪', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Score
        this.ctx.save();
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⭐ ${this.score}`, 15, 70);
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(`${this.caughtToys}/${this.targetCount}`, this.canvas.width - 80, 70);
        this.ctx.restore();
        
        // Box zeichnen
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.fillRect(this.box.x, this.box.y, this.box.width, this.box.height);
        
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeRect(this.box.x, this.box.y, this.box.width, this.box.height);
        
        // Gitter
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 0;
        
        const gridSize = 60;
        for (let x = this.box.x; x <= this.box.x + this.box.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.box.y);
            this.ctx.lineTo(x, this.box.y + this.box.height);
            this.ctx.stroke();
        }
        for (let y = this.box.y; y <= this.box.y + this.box.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.box.x, y);
            this.ctx.lineTo(this.box.x + this.box.width, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
        
        // Toys zeichnen
        for (let toy of this.toys) {
            if (toy.caught && toy !== this.claw.grabbedToy) continue;
            
            this.ctx.save();
            
            const wobbleX = Math.sin(toy.wobble) * 2;
            const wobbleY = Math.cos(toy.wobble * 1.2) * 1;
            
            this.ctx.translate(toy.x + wobbleX, toy.y + wobbleY);
            
            // Schatten
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, toy.size / 2 + 5, toy.size / 3, toy.size / 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Toy Körper
            const gradient = this.ctx.createRadialGradient(-10, -10, 0, 0, 0, toy.size / 2);
            gradient.addColorStop(0, this.lightenColor(toy.color, 50));
            gradient.addColorStop(0.6, toy.color);
            gradient.addColorStop(1, this.darkenColor(toy.color, 20));
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetY = 8;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, toy.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            // Glanz
            const gloss = this.ctx.createRadialGradient(-toy.size / 4, -toy.size / 4, 0, 0, 0, toy.size / 3);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gloss;
            this.ctx.beginPath();
            this.ctx.arc(-toy.size / 6, -toy.size / 6, toy.size / 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Emoji
            this.ctx.font = `${toy.size * 0.7}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(toy.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        // Greifer zeichnen
        this.drawClaw();
        
        // Partikel
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Grab-Button nur im Idle-Zustand
        if (this.claw.state === 'idle') {
            this.drawGrabButton();
        }
        
        // Anleitung
        if (this.caughtToys === 0 && this.claw.state === 'idle') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText('👆 Tippe oben um Greifer zu bewegen! 👆', this.canvas.width / 2, 95);
            this.ctx.restore();
        }
    }
    
    drawClaw() {
        this.ctx.save();
        
        const width = this.claw.width;
        const height = this.claw.height;
        const x = this.claw.x;
        const y = this.claw.y;
        
        // Seil
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 10);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.ctx.translate(x, y);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        
        // Greifer-Körper
        const bodyGradient = this.ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
        bodyGradient.addColorStop(0, '#94a3b8');
        bodyGradient.addColorStop(1, '#64748b');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(-width / 3, -15, width * 0.66, 30);
        
        this.ctx.shadowBlur = 0;
        
        // Klauen (links und rechts)
        const openWidth = width / 2 * this.claw.openAmount;
        
        // Linke Klaue
        this.ctx.fillStyle = '#475569';
        this.ctx.beginPath();
        this.ctx.moveTo(-openWidth, 15);
        this.ctx.lineTo(-openWidth - 20, 15);
        this.ctx.lineTo(-openWidth - 25, 45);
        this.ctx.lineTo(-openWidth - 10, 45);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Rechte Klaue
        this.ctx.beginPath();
        this.ctx.moveTo(openWidth, 15);
        this.ctx.lineTo(openWidth + 20, 15);
        this.ctx.lineTo(openWidth + 25, 45);
        this.ctx.lineTo(openWidth + 10, 45);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Glanz
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-width / 3 + 3, -12, width * 0.2, 25);
        
        // Gefangenes Toy anzeigen, wenn es am Greifer hängt
        if (this.claw.grabbedToy && (this.claw.state === 'moving_up' || this.claw.state === 'returning')) {
            const toy = this.claw.grabbedToy;
            this.ctx.font = `${toy.size * 0.9}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(toy.emoji, 0, 70);
        }
        
        this.ctx.restore();
    }
    
    drawGrabButton() {
        const buttonWidth = 150;
        const buttonHeight = 60;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height - 80;
        
        this.ctx.save();
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        
        // Button
        const btnGradient = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        btnGradient.addColorStop(0, '#10b981');
        btnGradient.addColorStop(1, '#059669');
        
        this.ctx.fillStyle = btnGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Glanz
        const gloss = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight / 2);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gloss;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight / 2, 15);
        this.ctx.fill();
        
        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 26px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText('GREIFEN! 👇', this.canvas.width / 2, buttonY + buttonHeight / 2);
        
        this.ctx.restore();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

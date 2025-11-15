// game_claw.js - Greifautomat Spiel
import { audioManager } from './audio_utils.js';

export class ClawGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Greifer
        this.claw = {
            x: 200,
            y: 50,
            targetX: 200,
            targetY: 50,
            width: 60,
            height: 40,
            speed: 3,
            state: 'idle', // idle, moving_down, grabbing, moving_up, returning
            grabbedToy: null,
            openAmount: 1, // 0 = geschlossen, 1 = offen
            rope: 0 // Seil-Länge
        };
        
        // Spielfeld (Box mit Plüschtieren)
        this.box = {
            x: 50,
            y: 150,
            width: 0,
            height: 300,
            depth: 200 // für 3D-Effekt
        };
        
        // Plüschtiere
        this.toys = [];
        this.caughtToys = 0;
        this.totalToysNeeded = 5;
        
        // Toy-Typen
        this.toyTypes = [
            { emoji: '🧸', name: 'Teddy', color: '#f59e0b', size: 50 },
            { emoji: '🐻', name: 'Bär', color: '#92400e', size: 50 },
            { emoji: '🐰', name: 'Hase', color: '#ec4899', size: 45 },
            { emoji: '🦁', name: 'Löwe', color: '#fbbf24', size: 50 },
            { emoji: '🐯', name: 'Tiger', color: '#f97316', size: 50 },
            { emoji: '🐼', name: 'Panda', color: '#1e293b', size: 50 },
            { emoji: '🦊', name: 'Fuchs', color: '#ea580c', size: 45 },
            { emoji: '🐶', name: 'Hund', color: '#84cc16', size: 45 }
        ];
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        
        // Touch-Steuerung
        this.targetPosition = { x: 200, y: 100 };
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.caughtToys = 0;
        
        // Box-Größe basierend auf Canvas
        this.box.width = Math.min(this.canvas.width - 100, 400);
        this.box.x = (this.canvas.width - this.box.width) / 2;
        
        // Greifer-Startposition
        this.claw.x = this.canvas.width / 2;
        this.claw.targetX = this.claw.x;
        this.claw.y = 50;
        this.claw.targetY = 50;
        this.claw.state = 'idle';
        this.claw.grabbedToy = null;
        this.claw.openAmount = 1;
        this.claw.rope = 0;
        
        // Plüschtiere generieren
        this.generateToys();
        
        // Sterne generieren
        this.generateStars();
        
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
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 100,
                size: 1 + Math.random() * 2,
                opacity: Math.random(),
                speed: 0.3 + Math.random() * 0.3
            });
        }
    }
    
    generateToys() {
        this.toys = [];
        const numToys = 12;
        
        for (let i = 0; i < numToys; i++) {
            const type = this.toyTypes[Math.floor(Math.random() * this.toyTypes.length)];
            const x = this.box.x + 30 + Math.random() * (this.box.width - 60);
            const z = this.box.y + 30 + Math.random() * (this.box.depth - 60); // z = "Tiefe"
            
            this.toys.push({
                x: x,
                z: z,
                emoji: type.emoji,
                name: type.name,
                color: type.color,
                size: type.size,
                rotation: Math.random() * 360,
                wobble: Math.random() * Math.PI * 2,
                caught: false,
                y: 0 // wird für Animation verwendet
            });
        }
        
        // Nach "Tiefe" sortieren für korrektes Zeichnen
        this.toys.sort((a, b) => a.z - b.z);
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
        if (this.claw.state === 'idle') {
            // Greifer-Position setzen (nur in der Box)
            const minX = this.box.x + 30;
            const maxX = this.box.x + this.box.width - 30;
            
            this.claw.targetX = Math.max(minX, Math.min(maxX, x));
            this.targetPosition.x = this.claw.targetX;
        }
    }
    
    updateClaw() {
        // Horizontale Bewegung (wenn idle)
        if (this.claw.state === 'idle') {
            const dx = this.claw.targetX - this.claw.x;
            if (Math.abs(dx) > 1) {
                this.claw.x += Math.sign(dx) * Math.min(Math.abs(dx), this.claw.speed);
            } else {
                this.claw.x = this.claw.targetX;
            }
        }
        
        // Greifer-Automatik
        if (this.claw.state === 'moving_down') {
            this.claw.rope += 4;
            const targetRope = this.box.y + this.box.depth / 2 - this.claw.y;
            
            if (this.claw.rope >= targetRope) {
                this.claw.rope = targetRope;
                this.claw.state = 'grabbing';
                this.tryGrabToy();
                
                setTimeout(() => {
                    if (this.isRunning) {
                        this.claw.state = 'moving_up';
                    }
                }, 500);
            }
        }
        
        if (this.claw.state === 'grabbing') {
            // Greifer schließen
            this.claw.openAmount = Math.max(0, this.claw.openAmount - 0.05);
        }
        
        if (this.claw.state === 'moving_up') {
            this.claw.rope = Math.max(0, this.claw.rope - 4);
            
            // Toy mit hochziehen
            if (this.claw.grabbedToy) {
                this.claw.grabbedToy.y = -(this.claw.rope * 0.8);
            }
            
            if (this.claw.rope <= 0) {
                this.claw.state = 'returning';
            }
        }
        
        if (this.claw.state === 'returning') {
            // Greifer zur Mitte bewegen
            const centerX = this.canvas.width / 2;
            const dx = centerX - this.claw.x;
            
            if (Math.abs(dx) > 2) {
                this.claw.x += Math.sign(dx) * 4;
                
                // Toy mitbewegen
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                }
            } else {
                // Angekommen - Toy abwerfen
                if (this.claw.grabbedToy) {
                    this.collectToy(this.claw.grabbedToy);
                    this.claw.grabbedToy = null;
                    this.caughtToys++;
                    
                    audioManager.playSuccessSound();
                    this.createSuccessParticles(this.claw.x, this.claw.y);
                    
                    // Gewonnen?
                    if (this.caughtToys >= this.totalToysNeeded) {
                        setTimeout(() => {
                            this.stop();
                            if (this.onExit) this.onExit();
                        }, 1500);
                    }
                }
                
                // Greifer öffnen und zurücksetzen
                this.claw.openAmount = 1;
                this.claw.state = 'idle';
            }
        }
    }
    
    tryGrabToy() {
        if (this.claw.grabbedToy) return;
        
        // Suche nach Toy in der Nähe
        const clawBottomX = this.claw.x;
        const clawBottomZ = this.claw.y + this.claw.rope;
        
        for (let toy of this.toys) {
            if (toy.caught) continue;
            
            const dx = toy.x - clawBottomX;
            const dz = toy.z - clawBottomZ;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Großzügige Hitbox für 4-Jährige!
            if (distance < 50) {
                this.claw.grabbedToy = toy;
                toy.caught = true;
                audioManager.playClickSound();
                break;
            }
        }
        
        if (!this.claw.grabbedToy) {
            // Nichts gefangen
            audioManager.playErrorSound();
        }
    }
    
    collectToy(toy) {
        // Toy aus Array entfernen
        const index = this.toys.indexOf(toy);
        if (index > -1) {
            this.toys.splice(index, 1);
        }
    }
    
    createSuccessParticles(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#fbbf24', '#f59e0b', '#ec4899', '#10b981'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 4
            });
        }
    }
    
    drawBox() {
        const { x, y, width, height, depth } = this.box;
        
        // Boden der Box (Perspektive)
        this.ctx.save();
        
        // Vordere Wand (transparent)
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
        
        // Rahmen
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x, y, width, height);
        
        // Boden-Gitter (für Tiefeneffekt)
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.lineWidth = 2;
        
        // Horizontale Linien
        for (let i = 1; i < 5; i++) {
            const lineY = y + (height / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, lineY);
            this.ctx.lineTo(x + width, lineY);
            this.ctx.stroke();
        }
        
        // Vertikale Linien
        for (let i = 1; i < 5; i++) {
            const lineX = x + (width / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, y);
            this.ctx.lineTo(lineX, y + height);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawToy(toy) {
        if (toy === this.claw.grabbedToy && this.claw.state !== 'idle') return;
        
        // Position basierend auf Tiefe (z)
        const scale = 0.7 + ((toy.z - this.box.y) / this.box.depth) * 0.3;
        const displaySize = toy.size * scale;
        
        // Leichtes Wackeln
        toy.wobble += 0.05;
        const wobbleX = Math.sin(toy.wobble) * 2;
        const wobbleY = Math.cos(toy.wobble * 1.5) * 1;
        
        this.ctx.save();
        this.ctx.translate(toy.x + wobbleX, toy.z + wobbleY);
        this.ctx.rotate((toy.rotation * Math.PI) / 180);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        // Toy Körper (Kreis/Ellipse als Basis)
        const bodyGradient = this.ctx.createRadialGradient(-5, -5, 0, 0, 0, displaySize / 2);
        bodyGradient.addColorStop(0, this.lightenColor(toy.color, 40));
        bodyGradient.addColorStop(0.7, toy.color);
        bodyGradient.addColorStop(1, this.darkenColor(toy.color, 20));
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, displaySize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Emoji darauf
        this.ctx.font = `${displaySize * 0.7}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(toy.emoji, 0, 0);
        
        this.ctx.restore();
    }
    
    drawClaw() {
        const { x, y, width, height, openAmount, rope } = this.claw;
        
        this.ctx.save();
        
        // Seil
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + rope);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Greifer-Position
        const clawY = y + rope;
        
        // Greifer selbst (zwei Klauen)
        this.ctx.translate(x, clawY);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        // Oberer Teil (Verbindung)
        const topGradient = this.ctx.createLinearGradient(-width / 4, 0, width / 4, height / 4);
        topGradient.addColorStop(0, '#94a3b8');
        topGradient.addColorStop(1, '#64748b');
        
        this.ctx.fillStyle = topGradient;
        this.ctx.fillRect(-width / 4, 0, width / 2, height / 4);
        
        // Linke Klaue
        const leftX = -width / 2 * openAmount;
        this.drawClawArm(leftX, height / 4, -1);
        
        // Rechte Klaue
        const rightX = width / 2 * openAmount;
        this.drawClawArm(rightX, height / 4, 1);
        
        // Gefangenes Toy
        if (this.claw.grabbedToy) {
            const toy = this.claw.grabbedToy;
            const toyY = toy.y || 0;
            
            this.ctx.shadowBlur = 10;
            this.ctx.font = `${toy.size * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(toy.emoji, 0, height + 20 + toyY);
        }
        
        this.ctx.restore();
    }
    
    drawClawArm(x, y, direction) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Arm mit Verlauf
        const armGradient = this.ctx.createLinearGradient(0, 0, 0, 25);
        armGradient.addColorStop(0, '#64748b');
        armGradient.addColorStop(1, '#475569');
        
        this.ctx.fillStyle = armGradient;
        this.ctx.fillRect(-5, 0, 10, 25);
        
        // Klauen-Spitze
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 25);
        this.ctx.lineTo(5, 25);
        this.ctx.lineTo(direction * 10, 35);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Glanz-Effekt
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-4, 2, 3, 20);
        
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
    
    gameLoop = () => {
        if (!this.isRunning) return;
        
        // Update
        this.updateClaw();
        
        // Render
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // Hintergrund (Jahrmarkt-Atmosphäre)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#c084fc');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Titel
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎪 Greifautomat 🎪', this.canvas.width / 2, 30);
        
        // Fortschritt
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillStyle = '#fde047';
        this.ctx.fillText(
            `Gefangen: ${this.caughtToys} / ${this.totalToysNeeded}`,
            this.canvas.width / 2,
            65
        );
        this.ctx.restore();
        
        // Anleitung
        if (this.claw.state === 'idle' && this.caughtToys === 0) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillText('👆 Tippe, um den Greifer zu bewegen! 👆', this.canvas.width / 2, 105);
            this.ctx.restore();
        }
        
        // Button um zu greifen
        if (this.claw.state === 'idle') {
            this.drawGrabButton();
        }
        
        // Box zeichnen
        this.drawBox();
        
        // Plüschtiere zeichnen (von hinten nach vorne)
        for (let toy of this.toys) {
            this.drawToy(toy);
        }
        
        // Greifer zeichnen (immer oben)
        this.drawClaw();
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // Gravity
            p.life -= 0.02;
            
            if (p.life > 0) {
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            } else {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawGrabButton() {
        const buttonWidth = 120;
        const buttonHeight = 50;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height - 80;
        
        this.ctx.save();
        
        // Button-Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        // Button
        const btnGradient = this.ctx.createLinearGradient(
            buttonX, buttonY, buttonX, buttonY + buttonHeight
        );
        btnGradient.addColorStop(0, '#10b981');
        btnGradient.addColorStop(1, '#059669');
        this.ctx.fillStyle = btnGradient;
        
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
        this.ctx.fill();
        
        // Button-Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GREIFEN!', this.canvas.width / 2, buttonY + buttonHeight / 2);
        
        // Click-Handler für Button
        const checkButtonClick = (ex, ey) => {
            if (ex >= buttonX && ex <= buttonX + buttonWidth &&
                ey >= buttonY && ey <= buttonY + buttonHeight &&
                this.claw.state === 'idle') {
                this.claw.state = 'moving_down';
                audioManager.playClickSound();
            }
        };
        
        // Temporäre Event Listener für diesen Frame
        this.buttonClickHandler = checkButtonClick;
        
        this.ctx.restore();
    }
}

// Button-Click für das Grab-Button erweitern
const originalHandleInput = ClawGame.prototype.handleInput;
ClawGame.prototype.handleInput = function(x, y) {
    // Prüfe Grab-Button
    const buttonWidth = 120;
    const buttonHeight = 50;
    const buttonX = this.canvas.width / 2 - buttonWidth / 2;
    const buttonY = this.canvas.height - 80;
    
    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight &&
        this.claw.state === 'idle') {
        this.claw.state = 'moving_down';
        audioManager.playClickSound();
        return;
    }
    
    // Ansonsten normale Input-Behandlung
    originalHandleInput.call(this, x, y);
};


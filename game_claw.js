// game_claw.js - SUPER Greifautomat Spiel mit isometrischer 3D-Perspektive
import { audioManager } from './audio_utils.js';

export class ClawGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Greifer mit verbesserter Steuerung
        this.claw = {
            x: 200,
            z: 150, // Tiefe (y-Achse in 3D)
            y: 0, // Höhe
            targetX: 200,
            targetZ: 150,
            width: 70,
            height: 50,
            speed: 4,
            state: 'idle', // idle, moving_down, grabbing, moving_up, returning, celebrating
            grabbedToy: null,
            openAmount: 1, // 0 = geschlossen, 1 = offen
            ropeLength: 0,
            swing: 0, // Pendel-Effekt
            grabStrength: 1.0 // Wie stark der Greifer zupackt
        };
        
        // Box mit isometrischer Perspektive
        this.box = {
            x: 100,
            y: 180,
            width: 0,
            height: 0,
            depth: 400,
            floorY: 580
        };
        
        // Plüschtiere mit Physik
        this.toys = [];
        this.caughtToys = 0;
        this.totalToysNeeded = 5;
        this.combo = 0;
        this.maxCombo = 0;
        this.score = 0;
        
        // Special Toys (größer!)
        this.toyTypes = [
            { emoji: '🧸', name: 'Teddy', color: '#f59e0b', size: 70, points: 10, special: false },
            { emoji: '🐻', name: 'Bär', color: '#92400e', size: 70, points: 10, special: false },
            { emoji: '🐰', name: 'Hase', color: '#ec4899', size: 65, points: 10, special: false },
            { emoji: '🦁', name: 'Löwe', color: '#fbbf24', size: 70, points: 15, special: false },
            { emoji: '🐯', name: 'Tiger', color: '#f97316', size: 70, points: 15, special: false },
            { emoji: '🐼', name: 'Panda', color: '#1e293b', size: 70, points: 15, special: false },
            { emoji: '🦊', name: 'Fuchs', color: '#ea580c', size: 65, points: 10, special: false },
            { emoji: '🐶', name: 'Hund', color: '#84cc16', size: 65, points: 10, special: false },
            { emoji: '⭐', name: 'Gold-Star', color: '#fbbf24', size: 60, points: 50, special: true },
            { emoji: '💎', name: 'Diamant', color: '#3b82f6', size: 55, points: 30, special: true }
        ];
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        this.floatingTexts = [];
        this.lightBeams = [];
        
        // Steuerung
        this.joystickActive = false;
        this.joystickStart = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        
        // Animation
        this.animationTime = 0;
        this.celebrationMode = false;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.caughtToys = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.score = 0;
        this.celebrationMode = false;
        
        // Box-Größe (viel größer!)
        this.box.width = Math.min(this.canvas.width - 80, 600);
        this.box.height = 400;
        this.box.x = (this.canvas.width - this.box.width) / 2;
        this.box.y = 180; // Etwas tiefer
        
        // Greifer zurücksetzen (über der Box!)
        this.claw.x = this.canvas.width / 2;
        this.claw.z = this.box.y - 30; // ÜBER der Box
        this.claw.targetX = this.claw.x;
        this.claw.targetZ = this.claw.z;
        this.claw.y = 0;
        this.claw.state = 'idle';
        this.claw.grabbedToy = null;
        this.claw.openAmount = 1;
        this.claw.ropeLength = 0;
        this.claw.swing = 0;
        
        // Plüschtiere generieren
        this.generateToys();
        
        // Effekte
        this.generateStars();
        
        // Event Listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('click', this.handleClick);
        
        // Game Loop
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('click', this.handleClick);
    }
    
    resetClaw() {
        this.claw.x = this.canvas.width / 2;
        this.claw.z = this.box.y - 30; // ÜBER der Box, nicht mittendrin!
        this.claw.targetX = this.claw.x;
        this.claw.targetZ = this.claw.z;
        this.claw.y = 0;
        this.claw.state = 'idle';
        this.claw.grabbedToy = null;
        this.claw.openAmount = 1;
        this.claw.ropeLength = 0;
        this.claw.swing = 0;
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 120,
                size: 1 + Math.random() * 2.5,
                opacity: Math.random(),
                speed: 0.2 + Math.random() * 0.4,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    generateToys() {
        this.toys = [];
        const numToys = 12; // Weniger Toys für bessere Übersicht
        const numSpecial = 2; // 2 Special Toys
        
        // Normale Toys
        for (let i = 0; i < numToys - numSpecial; i++) {
            const normalTypes = this.toyTypes.filter(t => !t.special);
            const type = normalTypes[Math.floor(Math.random() * normalTypes.length)];
            this.addToy(type);
        }
        
        // Special Toys
        for (let i = 0; i < numSpecial; i++) {
            const specialTypes = this.toyTypes.filter(t => t.special);
            const type = specialTypes[Math.floor(Math.random() * specialTypes.length)];
            this.addToy(type);
        }
        
        // Nach Tiefe sortieren
        this.toys.sort((a, b) => a.z - b.z);
    }
    
    addToy(type) {
        const padding = type.size / 2 + 10;
        const x = this.box.x + padding + Math.random() * (this.box.width - padding * 2);
        const z = this.box.y + padding + Math.random() * (this.box.depth - padding * 2);
        
        this.toys.push({
            x: x,
            z: z,
            y: 0,
            emoji: type.emoji,
            name: type.name,
            color: type.color,
            size: type.size,
            points: type.points,
            special: type.special,
            rotation: Math.random() * 360,
            wobble: Math.random() * Math.PI * 2,
            bouncePhase: Math.random() * Math.PI * 2,
            caught: false,
            highlight: false,
            glowIntensity: type.special ? 1 : 0
        });
    }
    
    // Event Handlers
    handleMouseDown = (e) => {
        if (this.claw.state !== 'idle') return;
        const rect = this.canvas.getBoundingClientRect();
        this.joystickStart.x = e.clientX - rect.left;
        this.joystickStart.y = e.clientY - rect.top;
        this.joystickActive = true;
    }
    
    handleMouseMove = (e) => {
        if (!this.joystickActive) return;
        const rect = this.canvas.getBoundingClientRect();
        this.joystickCurrent.x = e.clientX - rect.left;
        this.joystickCurrent.y = e.clientY - rect.top;
        this.updateClawFromJoystick();
    }
    
    handleMouseUp = (e) => {
        this.joystickActive = false;
    }
    
    handleTouchStart = (e) => {
        e.preventDefault();
        if (this.claw.state !== 'idle') return;
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.joystickStart.x = touch.clientX - rect.left;
        this.joystickStart.y = touch.clientY - rect.top;
        this.joystickActive = true;
    }
    
    handleTouchMove = (e) => {
        e.preventDefault();
        if (!this.joystickActive) return;
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.joystickCurrent.x = touch.clientX - rect.left;
        this.joystickCurrent.y = touch.clientY - rect.top;
        this.updateClawFromJoystick();
    }
    
    handleTouchEnd = (e) => {
        e.preventDefault();
        this.joystickActive = false;
    }
    
    handleClick = (e) => {
        // Grab-Button Check
        if (this.claw.state === 'idle') {
            const buttonWidth = 140;
            const buttonHeight = 60;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            const buttonY = this.canvas.height - 90;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.startGrab();
            }
        }
    }
    
    updateClawFromJoystick() {
        const dx = this.joystickCurrent.x - this.joystickStart.x;
        
        // Nur X-Bewegung (horizontal) - Greifer bleibt OBEN!
        const minX = this.box.x + 40;
        const maxX = this.box.x + this.box.width - 40;
        this.claw.targetX = Math.max(minX, Math.min(maxX, this.claw.x + dx * 0.5));
    }
    
    startGrab() {
        this.claw.state = 'moving_down';
        audioManager.playClickSound();
        this.vibrate(50);
    }
    
    vibrate(duration) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    updateClaw() {
        this.animationTime += 0.016;
        
        // Bewegung wenn idle
        if (this.claw.state === 'idle') {
            // Smooth Movement
            const dx = this.claw.targetX - this.claw.x;
            const dz = this.claw.targetZ - this.claw.z;
            
            if (Math.abs(dx) > 0.5) {
                this.claw.x += dx * 0.15;
            }
            if (Math.abs(dz) > 0.5) {
                this.claw.z += dz * 0.15;
            }
            
            // Leichtes Schwingen
            this.claw.swing = Math.sin(this.animationTime * 2) * 2;
            
            // Highlight toys in range
            this.highlightToysInRange();
        }
        
        // Runterfahren
        if (this.claw.state === 'moving_down') {
            this.claw.ropeLength += 5;
            this.claw.swing = Math.sin(this.claw.ropeLength * 0.1) * 3;
            
            // Fahre bis zum Boden der Box
            const maxRope = this.box.y + this.box.height - 60;
            
            if (this.claw.ropeLength >= maxRope) {
                this.claw.ropeLength = maxRope;
                this.claw.state = 'grabbing';
                this.claw.swing = 0;
                
                setTimeout(() => {
                    if (this.isRunning) {
                        this.tryGrabToy();
                        this.claw.state = 'moving_up';
                    }
                }, 400);
            }
        }
        
        // Greifen
        if (this.claw.state === 'grabbing') {
            this.claw.openAmount = Math.max(0, this.claw.openAmount - 0.08);
        }
        
        // Hochfahren
        if (this.claw.state === 'moving_up') {
            this.claw.ropeLength = Math.max(0, this.claw.ropeLength - 5);
            
            // Toy mit hochziehen
            if (this.claw.grabbedToy) {
                this.claw.grabbedToy.y = -(this.claw.ropeLength * 0.7);
                
                // Wackel-Effekt beim Hochziehen
                this.claw.grabbedToy.wobble += 0.15;
                this.claw.swing = Math.sin(this.animationTime * 3) * 4;
            } else {
                this.claw.swing = Math.sin(this.animationTime * 2) * 2;
            }
            
            if (this.claw.ropeLength <= 0) {
                if (this.claw.grabbedToy) {
                    this.claw.state = 'celebrating';
                    this.createCelebrationEffect();
                    
                    setTimeout(() => {
                        if (this.isRunning) {
                            this.claw.state = 'returning';
                        }
                    }, 800);
                } else {
                    this.claw.state = 'returning';
                }
            }
        }
        
        // Celebration
        if (this.claw.state === 'celebrating') {
            this.claw.swing = Math.sin(this.animationTime * 8) * 8;
        }
        
        // Zurückkehren
        if (this.claw.state === 'returning') {
            const centerX = this.canvas.width / 2;
            
            const dx = centerX - this.claw.x;
            
            if (Math.abs(dx) > 3) {
                this.claw.x += dx * 0.1;
                
                // Toy mitbewegen
                if (this.claw.grabbedToy) {
                    this.claw.grabbedToy.x = this.claw.x;
                }
            } else {
                // Angekommen - Toy abwerfen
                if (this.claw.grabbedToy) {
                    this.collectToy(this.claw.grabbedToy);
                    this.claw.grabbedToy = null;
                }
                
                // Reset
                this.claw.openAmount = 1;
                this.claw.state = 'idle';
                this.claw.swing = 0;
            }
        }
    }
    
    highlightToysInRange() {
        for (let toy of this.toys) {
            if (toy.caught) continue;
            
            // Highlight wenn Greifer über dem Toy ist
            const dx = toy.x - this.claw.x;
            const distance = Math.abs(dx);
            
            toy.highlight = distance < 90; // Großer Highlight-Bereich
        }
    }
    
    tryGrabToy() {
        const clawX = this.claw.x;
        const clawY = this.claw.z + this.claw.ropeLength; // Y-Position des Greifers am Boden
        
        let closestToy = null;
        let closestDistance = Infinity;
        
        // Finde nächstes Toy
        for (let toy of this.toys) {
            if (toy.caught) continue;
            
            // Vergleiche Position in der Box
            const dx = toy.x - clawX;
            const dy = toy.z - clawY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestToy = toy;
            }
        }
        
        // SEHR großzügige Hitbox für 4-Jährige!
        if (closestToy && closestDistance < 90) {
            this.claw.grabbedToy = closestToy;
            closestToy.caught = true;
            audioManager.playSuccessSound();
            this.vibrate(100);
            
            // Combo erhöhen
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
        } else {
            // Nichts gefangen - Combo zurücksetzen
            audioManager.playErrorSound();
            this.combo = 0;
            this.vibrate([50, 50, 50]);
        }
    }
    
    collectToy(toy) {
        // Punkte berechnen
        let points = toy.points;
        if (this.combo > 1) {
            points *= this.combo; // Combo-Multiplikator
        }
        
        this.score += points;
        this.caughtToys++;
        
        // Floating Text
        this.createFloatingText(`+${points}`, this.claw.x, this.box.y - 50, toy.color);
        
        if (this.combo > 1) {
            this.createFloatingText(`${this.combo}x COMBO!`, this.claw.x, this.box.y - 80, '#fbbf24');
        }
        
        // Toy aus Array entfernen
        const index = this.toys.indexOf(toy);
        if (index > -1) {
            this.toys.splice(index, 1);
        }
        
        // Special Effects
        if (toy.special) {
            this.createSpecialEffect(this.claw.x, this.box.y);
        } else {
            this.createSuccessParticles(this.claw.x, this.box.y);
        }
        
        audioManager.playScoreSound();
        this.vibrate(200);
        
        // Gewonnen?
        if (this.caughtToys >= this.totalToysNeeded) {
            this.celebrationMode = true;
            this.createWinEffect();
            
            setTimeout(() => {
                this.stop();
                if (this.onExit) this.onExit();
            }, 2000);
        }
    }
    
    createCelebrationEffect() {
        if (!this.claw.grabbedToy) return;
        
        const x = this.claw.x;
        const y = this.box.y - 20;
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 3 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color: this.claw.grabbedToy.color,
                size: 4 + Math.random() * 3,
                gravity: 0.2
            });
        }
    }
    
    createSuccessParticles(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                life: 1,
                color: ['#fbbf24', '#f59e0b', '#ec4899', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)],
                size: 3 + Math.random() * 4,
                gravity: 0.25
            });
        }
    }
    
    createSpecialEffect(x, y) {
        // Großer Burst für Special Toys
        for (let i = 0; i < 60; i++) {
            const angle = (Math.PI * 2 * i) / 60;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4,
                life: 1.5,
                color: i % 2 === 0 ? '#fbbf24' : '#fff',
                size: 5 + Math.random() * 5,
                gravity: 0.15
            });
        }
        
        // Lichtstrahl
        this.lightBeams.push({
            x: x,
            y: y,
            life: 1,
            maxLife: 1
        });
    }
    
    createWinEffect() {
        // Feuerwerk überall
        for (let j = 0; j < 5; j++) {
            setTimeout(() => {
                const x = Math.random() * this.canvas.width;
                const y = 100 + Math.random() * 200;
                
                for (let i = 0; i < 50; i++) {
                    const angle = (Math.PI * 2 * i) / 50;
                    const speed = 2 + Math.random() * 6;
                    this.particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1,
                        color: ['#fbbf24', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 6)],
                        size: 4 + Math.random() * 6,
                        gravity: 0.1
                    });
                }
                audioManager.playSuccessSound();
            }, j * 300);
        }
    }
    
    createFloatingText(text, x, y, color) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            life: 1,
            color: color,
            size: 28
        });
    }
    
    // Koordinaten-Umrechnung (vereinfacht)
    toIsoX(x, z) {
        return x;
    }
    
    toIsoY(x, z) {
        return z;
    }
    
    // Zeichnen-Funktionen
    drawBox() {
        const { x, y, width, height, depth } = this.box;
        
        this.ctx.save();
        
        // Boden (isometrisch)
        const floorGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        floorGradient.addColorStop(0, 'rgba(100, 116, 139, 0.1)');
        floorGradient.addColorStop(1, 'rgba(71, 85, 105, 0.3)');
        
        this.ctx.fillStyle = floorGradient;
        this.ctx.fillRect(x, y, width, height);
        
        // Gitter mit Perspektive
        this.ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        this.ctx.lineWidth = 2;
        
        const gridSize = 50;
        for (let i = 0; i <= width; i += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + i, y);
            this.ctx.lineTo(x + i, y + height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= height; i += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + i);
            this.ctx.lineTo(x + width, y + i);
            this.ctx.stroke();
        }
        
        // Rahmen mit Glanz
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 6;
        this.ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.shadowBlur = 0;
        
        // Innerer Rahmen
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
        
        this.ctx.restore();
    }
    
    drawToy(toy) {
        if (toy === this.claw.grabbedToy && this.claw.state !== 'idle') return;
        
        // Position im Behälter (einfacher - nicht isometrisch)
        const screenX = toy.x;
        const screenY = toy.z + toy.y;
        
        // Perspektiven-Skalierung basierend auf Tiefe
        const depth = (toy.z - this.box.y) / this.box.depth;
        const scale = 0.8 + depth * 0.2;
        const displaySize = toy.size * scale;
        
        // Bounce Animation
        toy.bouncePhase += 0.03;
        const bounce = Math.sin(toy.bouncePhase) * 2;
        
        // Wobble
        toy.wobble += 0.04;
        const wobbleX = Math.sin(toy.wobble) * 1.5;
        const wobbleY = Math.cos(toy.wobble * 1.3) * 1;
        
        this.ctx.save();
        this.ctx.translate(screenX + wobbleX, screenY + bounce + wobbleY);
        
        // Highlight Effect
        if (toy.highlight) {
            this.ctx.shadowColor = '#fbbf24';
            this.ctx.shadowBlur = 25;
            
            // Pulsierender Ring
            const pulseSize = displaySize / 2 + Math.sin(this.animationTime * 5) * 5;
            this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Special Glow
        if (toy.special) {
            toy.glowIntensity = 0.5 + Math.sin(this.animationTime * 3) * 0.5;
            this.ctx.shadowColor = toy.color;
            this.ctx.shadowBlur = 30 * toy.glowIntensity;
        }
        
        // Schatten auf Boden
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, displaySize / 2 + 5, displaySize / 3, displaySize / 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Toy Körper mit 3D-Effekt
        const gradient = this.ctx.createRadialGradient(-10, -10, 0, 0, 0, displaySize / 2);
        gradient.addColorStop(0, this.lightenColor(toy.color, 50));
        gradient.addColorStop(0.4, toy.color);
        gradient.addColorStop(1, this.darkenColor(toy.color, 30));
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, displaySize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Glanz-Highlight
        const gloss = this.ctx.createRadialGradient(-displaySize / 4, -displaySize / 4, 0, -displaySize / 6, -displaySize / 6, displaySize / 3);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gloss;
        this.ctx.beginPath();
        this.ctx.arc(-displaySize / 6, -displaySize / 6, displaySize / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Emoji
        this.ctx.font = `${displaySize * 0.75}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(toy.emoji, 0, 2);
        
        // Special Sparkle
        if (toy.special) {
            const sparkleCount = 4;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (Math.PI * 2 * i) / sparkleCount + this.animationTime * 2;
                const distance = displaySize / 2 + 10;
                const sx = Math.cos(angle) * distance;
                const sy = Math.sin(angle) * distance;
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, ' + toy.glowIntensity + ')';
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }
    
    drawClaw() {
        const { x, z, y, width, height, openAmount, ropeLength, swing } = this.claw;
        
        // Position (einfacher - nicht isometrisch)
        const screenX = x + swing;
        const screenY = z + ropeLength + y;
        
        this.ctx.save();
        
        // Seil mit Animation
        const ropeStartX = x + swing * 0.3;
        const ropeStartY = z - 50;
        
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        
        // Geschwungenes Seil
        this.ctx.beginPath();
        this.ctx.moveTo(ropeStartX, ropeStartY);
        
        const segments = 5;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const sx = ropeStartX + (screenX - ropeStartX) * t + Math.sin(t * Math.PI * 2 + this.animationTime * 3) * swing * 0.5;
            const sy = ropeStartY + (screenY - ropeStartY) * t;
            this.ctx.lineTo(sx, sy);
        }
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        // Greifer-Position
        this.ctx.translate(screenX, screenY);
        
        // Oberer Teil (Verbindung)
        const topGradient = this.ctx.createLinearGradient(-width / 3, 0, width / 3, height / 3);
        topGradient.addColorStop(0, '#cbd5e1');
        topGradient.addColorStop(0.5, '#94a3b8');
        topGradient.addColorStop(1, '#64748b');
        
        this.ctx.fillStyle = topGradient;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        
        // Top-Box
        this.ctx.fillRect(-width / 3, -10, width * 0.66, height / 3);
        
        // Glanz auf Top
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-width / 3 + 3, -8, width * 0.2, height / 4);
        
        // Klauen
        const leftX = -width / 2 * openAmount;
        const rightX = width / 2 * openAmount;
        
        this.drawClawArm(leftX, height / 3, -1, openAmount);
        this.drawClawArm(rightX, height / 3, 1, openAmount);
        
        // Gefangenes Toy
        if (this.claw.grabbedToy) {
            const toy = this.claw.grabbedToy;
            const toyY = toy.y || 0;
            const toySize = toy.size * 0.9;
            
            this.ctx.save();
            this.ctx.translate(0, height + 25 + toyY);
            
            // Toy-Glow wenn special
            if (toy.special) {
                this.ctx.shadowColor = toy.color;
                this.ctx.shadowBlur = 30;
            }
            
            // Toy Emoji
            this.ctx.font = `${toySize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(toy.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawClawArm(x, y, direction, openAmount) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        const angle = direction * openAmount * 0.3;
        this.ctx.rotate(angle);
        
        // Arm mit Verlauf
        const armGradient = this.ctx.createLinearGradient(-8, 0, 8, 35);
        armGradient.addColorStop(0, '#94a3b8');
        armGradient.addColorStop(0.5, '#64748b');
        armGradient.addColorStop(1, '#475569');
        
        this.ctx.fillStyle = armGradient;
        this.ctx.fillRect(-8, 0, 16, 35);
        
        // Klauen-Spitze
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 35);
        this.ctx.lineTo(8, 35);
        this.ctx.lineTo(direction * 12, 45);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Glanz-Effekt
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(-6, 2, 4, 30);
        
        // Schrauben-Details
        this.ctx.fillStyle = '#334155';
        this.ctx.beginPath();
        this.ctx.arc(0, 8, 3, 0, Math.PI * 2);
        this.ctx.arc(0, 20, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
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
        
        this.updateClaw();
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // Hintergrund mit Farbverlauf (Jahrmarkt-Atmosphäre)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(0.3, '#5b21b6');
        gradient.addColorStop(0.7, '#7c3aed');
        gradient.addColorStop(1, '#a855f7');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animierte Sterne
        for (let star of this.stars) {
            star.twinkle += star.speed * 0.05;
            star.opacity = 0.3 + Math.abs(Math.sin(star.twinkle)) * 0.7;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Twinkle-Strahlen
            if (star.opacity > 0.8) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.5})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(star.x - star.size * 2, star.y);
                this.ctx.lineTo(star.x + star.size * 2, star.y);
                this.ctx.moveTo(star.x, star.y - star.size * 2);
                this.ctx.lineTo(star.x, star.y + star.size * 2);
                this.ctx.stroke();
            }
        }
        
        // Licht-Strahlen
        for (let i = this.lightBeams.length - 1; i >= 0; i--) {
            const beam = this.lightBeams[i];
            beam.life -= 0.02;
            
            if (beam.life > 0) {
                const alpha = beam.life / beam.maxLife;
                const beamGradient = this.ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, 150);
                beamGradient.addColorStop(0, `rgba(251, 191, 36, ${alpha * 0.8})`);
                beamGradient.addColorStop(0.5, `rgba(251, 191, 36, ${alpha * 0.3})`);
                beamGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
                
                this.ctx.fillStyle = beamGradient;
                this.ctx.fillRect(beam.x - 150, beam.y - 150, 300, 300);
            } else {
                this.lightBeams.splice(i, 1);
            }
        }
        
        // Titel mit Animation
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        
        const titleGradient = this.ctx.createLinearGradient(0, 20, 0, 50);
        titleGradient.addColorStop(0, '#fde047');
        titleGradient.addColorStop(1, '#fbbf24');
        this.ctx.fillStyle = titleGradient;
        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎪 GREIFAUTOMAT 🎪', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Score und Info
        this.ctx.save();
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'left';
        
        // Score
        this.ctx.fillStyle = '#fde047';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText(`⭐ ${this.score}`, 15, 30);
        
        // Fortschritt
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(`${this.caughtToys}/${this.totalToysNeeded}`, 15, 60);
        
        // Combo
        if (this.combo > 1) {
            const comboScale = 1 + Math.sin(this.animationTime * 5) * 0.1;
            this.ctx.save();
            this.ctx.translate(this.canvas.width - 80, 45);
            this.ctx.scale(comboScale, comboScale);
            this.ctx.fillStyle = '#ec4899';
            this.ctx.font = 'bold 28px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.combo}x`, 0, 0);
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.fillText('COMBO', 0, 20);
            this.ctx.restore();
        }
        
        this.ctx.restore();
        
        // Anleitung
        if (this.claw.state === 'idle' && this.caughtToys === 0 && !this.joystickActive) {
            this.ctx.save();
            const alpha = 0.7 + Math.sin(this.animationTime * 2) * 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = 'bold 22px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText('👆 Ziehe zum Bewegen! 👆', this.canvas.width / 2, 95);
            this.ctx.restore();
        }
        
        // Box zeichnen
        this.drawBox();
        
        // Plüschtiere zeichnen
        for (let toy of this.toys) {
            this.drawToy(toy);
        }
        
        // Greifer zeichnen
        this.drawClaw();
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0.3;
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
        
        // Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 2;
            ft.life -= 0.015;
            
            if (ft.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = ft.life;
                this.ctx.fillStyle = ft.color;
                this.ctx.font = `bold ${ft.size}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                this.ctx.shadowBlur = 5;
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.restore();
            } else {
                this.floatingTexts.splice(i, 1);
            }
        }
        
        // Grab-Button
        if (this.claw.state === 'idle') {
            this.drawGrabButton();
        }
        
        // Progress Bar
        this.drawProgressBar();
    }
    
    drawGrabButton() {
        const buttonWidth = 140;
        const buttonHeight = 60;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height - 90;
        
        this.ctx.save();
        
        // Pulse-Animation
        const pulse = 1 + Math.sin(this.animationTime * 4) * 0.05;
        this.ctx.translate(this.canvas.width / 2, buttonY + buttonHeight / 2);
        this.ctx.scale(pulse, pulse);
        this.ctx.translate(-this.canvas.width / 2, -(buttonY + buttonHeight / 2));
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        
        // Button mit Verlauf
        const btnGradient = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        btnGradient.addColorStop(0, '#10b981');
        btnGradient.addColorStop(1, '#059669');
        
        this.ctx.fillStyle = btnGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
        this.ctx.fill();
        
        // Glanz
        this.ctx.shadowBlur = 0;
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
    
    drawProgressBar() {
        const barWidth = 200;
        const barHeight = 25;
        const barX = this.canvas.width / 2 - barWidth / 2;
        const barY = 75;
        
        this.ctx.save();
        
        // Hintergrund
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(barX, barY, barWidth, barHeight, 12);
        this.ctx.fill();
        
        // Fortschritt
        const progress = this.caughtToys / this.totalToysNeeded;
        const progressWidth = (barWidth - 6) * progress;
        
        if (progressWidth > 0) {
            const progressGradient = this.ctx.createLinearGradient(barX + 3, barY, barX + 3 + progressWidth, barY);
            progressGradient.addColorStop(0, '#10b981');
            progressGradient.addColorStop(0.5, '#34d399');
            progressGradient.addColorStop(1, '#6ee7b7');
            
            this.ctx.fillStyle = progressGradient;
            this.ctx.shadowColor = '#10b981';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.roundRect(barX + 3, barY + 3, progressWidth, barHeight - 6, 10);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
}

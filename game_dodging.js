// game_dodging.js - Ausweichen Spiel
import { audioManager } from './audio_utils.js';

export class DodgingGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Spieler
        this.player = {
            x: 0,
            y: 0,
            width: 60,
            height: 60,
            lane: 1, // 0 = links, 1 = mitte, 2 = rechts
            targetLane: 1,
            emoji: '🚗',
            color: '#3b82f6'
        };
        
        // Spielfeld
        this.lanes = 3;
        this.laneWidth = 0;
        
        // Fallende Objekte
        this.fallingObjects = [];
        this.objectSpeed = 2;
        this.spawnInterval = 100;
        this.frameCount = 0;
        
        // Level & Score
        this.score = 0;
        this.level = 1;
        this.maxLevel = 10;
        this.highScore = 0;
        this.gameOver = false;
        
        // Objekt-Typen
        this.objectTypes = [
            { emoji: '🚙', color: '#ef4444', points: 1 },
            { emoji: '🚕', color: '#f59e0b', points: 1 },
            { emoji: '🚌', color: '#10b981', points: 2 },
            { emoji: '🚛', color: '#8b5cf6', points: 2 },
            { emoji: '🏍️', color: '#ec4899', points: 1 },
            { emoji: '🚑', color: '#ef4444', points: 2 }
        ];
        
        // Visuelle Effekte
        this.particles = [];
        this.passedObjects = 0;
    }
    
    start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        
        this.reset();
        
        // Event Listener
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('keydown', this.handleKeyDown);
        
        // Game Loop
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('keydown', this.handleKeyDown);
    }
    
    reset() {
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.frameCount = 0;
        this.fallingObjects = [];
        this.particles = [];
        this.passedObjects = 0;
        
        // Spieler Position
        this.laneWidth = this.canvas.width / this.lanes;
        this.player.lane = 1;
        this.player.targetLane = 1;
        this.player.x = this.laneWidth * this.player.lane + this.laneWidth / 2;
        this.player.y = this.canvas.height - 100;
        
        // Level-Einstellungen
        this.updateLevelSettings();
    }
    
    updateLevelSettings() {
        // Geschwindigkeit und Spawn-Rate erhöhen mit Level
        this.objectSpeed = 2 + (this.level - 1) * 0.3;
        this.spawnInterval = Math.max(60, 100 - (this.level - 1) * 5);
    }
    
    handleClick = (e) => {
        if (this.gameOver) {
            this.reset();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Klick auf linker oder rechter Hälfte
        if (x < this.canvas.width / 2) {
            this.moveLeft();
        } else {
            this.moveRight();
        }
    }
    
    handleTouchStart = (e) => {
        e.preventDefault();
        
        if (this.gameOver) {
            this.reset();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        
        // Touch auf linker oder rechter Hälfte
        if (x < this.canvas.width / 2) {
            this.moveLeft();
        } else {
            this.moveRight();
        }
    }
    
    handleKeyDown = (e) => {
        if (this.gameOver) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            this.moveLeft();
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            this.moveRight();
        }
    }
    
    moveLeft() {
        if (this.player.targetLane > 0) {
            this.player.targetLane--;
            audioManager.playClickSound();
        }
    }
    
    moveRight() {
        if (this.player.targetLane < this.lanes - 1) {
            this.player.targetLane++;
            audioManager.playClickSound();
        }
    }
    
    spawnObject() {
        const lane = Math.floor(Math.random() * this.lanes);
        const type = this.objectTypes[Math.floor(Math.random() * this.objectTypes.length)];
        
        this.fallingObjects.push({
            x: this.laneWidth * lane + this.laneWidth / 2,
            y: -50,
            width: 50,
            height: 50,
            lane: lane,
            emoji: type.emoji,
            color: type.color,
            points: type.points,
            rotation: 0
        });
    }
    
    updateGame() {
        if (this.gameOver) return;
        
        this.frameCount++;
        
        // Spawn neue Objekte
        if (this.frameCount % this.spawnInterval === 0) {
            this.spawnObject();
        }
        
        // Spieler Bewegung (sanft zur Zielspur)
        const targetX = this.laneWidth * this.player.targetLane + this.laneWidth / 2;
        this.player.x += (targetX - this.player.x) * 0.2;
        this.player.lane = this.player.targetLane;
        
        // Fallende Objekte bewegen
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            obj.y += this.objectSpeed;
            obj.rotation += 0.02;
            
            // Kollision mit Spieler prüfen
            if (this.checkCollision(this.player, obj)) {
                this.handleCollision();
                this.fallingObjects.splice(i, 1);
                continue;
            }
            
            // Objekt hat Bildschirm verlassen (erfolgreich ausgewichen)
            if (obj.y > this.canvas.height) {
                this.score += obj.points;
                this.passedObjects++;
                this.createPassParticles(obj.x, this.canvas.height - 50);
                audioManager.playScoreSound();
                this.fallingObjects.splice(i, 1);
                
                // Level-Up
                if (this.passedObjects % 15 === 0 && this.level < this.maxLevel) {
                    this.level++;
                    this.updateLevelSettings();
                    this.createLevelUpEffect();
                }
            }
        }
        
        // Partikel aktualisieren
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollision(player, obj) {
        // Großzügige Kollisionserkennung
        const playerLeft = player.x - player.width / 2 + 10;
        const playerRight = player.x + player.width / 2 - 10;
        const playerTop = player.y - player.height / 2 + 10;
        const playerBottom = player.y + player.height / 2 - 10;
        
        const objLeft = obj.x - obj.width / 2;
        const objRight = obj.x + obj.width / 2;
        const objTop = obj.y - obj.height / 2;
        const objBottom = obj.y + obj.height / 2;
        
        return playerLeft < objRight &&
               playerRight > objLeft &&
               playerTop < objBottom &&
               playerBottom > objTop;
    }
    
    handleCollision() {
        this.gameOver = true;
        this.highScore = Math.max(this.highScore, this.score);
        
        // Explosions-Partikel
        this.createExplosionParticles(this.player.x, this.player.y);
        audioManager.playGameOverSound();
    }
    
    createPassParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color: '#10b981',
                size: 3 + Math.random() * 3
            });
        }
    }
    
    createExplosionParticles(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ef4444', '#f59e0b', '#fbbf24'][Math.floor(Math.random() * 3)],
                size: 4 + Math.random() * 6
            });
        }
    }
    
    createLevelUpEffect() {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#fbbf24', '#f59e0b', '#10b981'][Math.floor(Math.random() * 3)],
                size: 5 + Math.random() * 5
            });
        }
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        
        this.updateGame();
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // Hintergrund (Straße) - heller für bessere Sichtbarkeit
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#6b7280');
        gradient.addColorStop(1, '#4b5563');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grüne Seitenstreifen (Gras)
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(0, 0, 30, this.canvas.height);
        this.ctx.fillRect(this.canvas.width - 30, 0, 30, this.canvas.height);
        
        // Straßenmarkierungen
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([20, 20]);
        this.ctx.lineDashOffset = (this.frameCount * 3) % 40;
        
        for (let i = 1; i < this.lanes; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.laneWidth * i, 0);
            this.ctx.lineTo(this.laneWidth * i, this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
        
        // UI Oben
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, 80);
        
        // Level
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level}`, 20, 30);
        
        // Score
        this.ctx.fillStyle = '#10b981';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Punkte: ${this.score}`, this.canvas.width / 2, 30);
        
        // High Score
        this.ctx.fillStyle = '#ec4899';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Beste: ${this.highScore}`, this.canvas.width - 20, 30);
        
        // Anweisungen
        this.ctx.fillStyle = '#e5e7eb';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⬅️ Tippe links/rechts zum Ausweichen ➡️', this.canvas.width / 2, 60);
        this.ctx.restore();
        
        // Fallende Objekte zeichnen
        for (let obj of this.fallingObjects) {
            this.ctx.save();
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation);
            
            // Heller Hintergrund für bessere Sichtbarkeit
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width * 0.8);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, obj.width * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Weißer Kreis als Hintergrund
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, obj.width * 0.55, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Farbiger Rand
            this.ctx.strokeStyle = obj.color;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // Schatten
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetY = 8;
            
            // Emoji
            this.ctx.font = `${obj.width * 0.7}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obj.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        // Spieler zeichnen
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        if (!this.gameOver) {
            // Schatten
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetY = 8;
            
            // Glow-Effekt
            const glow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.player.width);
            glow.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
            glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.width, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Emoji
            this.ctx.font = `${this.player.width}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.player.emoji, 0, 0);
        }
        
        this.ctx.restore();
        
        // Partikel zeichnen
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        
        // Game Over Bildschirm
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 48px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💥 Autsch! 💥', this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.fillText(`Punkte: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.fillStyle = '#e5e7eb';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.fillText('Tippe zum Neustarten', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
    }
}


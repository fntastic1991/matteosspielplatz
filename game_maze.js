// game_maze.js - Labyrinth-Pfad finden Spiel
import { audioManager } from './audio_utils.js';

export class MazeGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.player = { x: 0, y: 0, radius: 15 };
        this.start_pos = { x: 0, y: 0 };
        this.goal = { x: 0, y: 0, radius: 25 };
        this.walls = [];
        this.isDragging = false;
        this.attempts = 0;
        this.level = 1;
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        this.pathTrail = [];
        this.successAnimation = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.attempts = 0;
        this.level = 1;
        this.particles = [];
        this.pathTrail = [];
        this.successAnimation = 0;
        
        // Dekorative Sterne generieren
        this.generateStars();
        
        // Labyrinth erstellen
        this.createMaze();
        
        // Touch/Mouse Events
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        
        // Render-Loop
        this.render();
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                opacity: Math.random(),
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    createMaze() {
        this.walls = [];
        const margin = 60;
        const width = this.canvas.width - margin * 2;
        const height = this.canvas.height - margin * 2 - 100; // Platz für Header
        const startX = margin;
        const startY = margin + 100;
        
        // Äussere Wände mit abgerundeten Ecken
        const borderRadius = 20;
        this.walls.push(
            // Oben
            { x1: startX + borderRadius, y1: startY, x2: startX + width - borderRadius, y2: startY, color: '#3b82f6' },
            // Rechts
            { x1: startX + width, y1: startY + borderRadius, x2: startX + width, y2: startY + height - borderRadius, color: '#ec4899' },
            // Unten
            { x1: startX + width - borderRadius, y1: startY + height, x2: startX + borderRadius, y2: startY + height, color: '#10b981' },
            // Links
            { x1: startX, y1: startY + height - borderRadius, x2: startX, y2: startY + borderRadius, color: '#f59e0b' }
        );
        
        // 10 verschiedene Level mit steigendem Schwierigkeitsgrad
        switch(this.level) {
            case 1:
                // Level 1: Sehr einfach - nur 2 Wände
                this.walls.push(
                    { x1: startX + width * 0.3, y1: startY, x2: startX + width * 0.3, y2: startY + height * 0.7, color: '#8b5cf6' },
                    { x1: startX + width * 0.7, y1: startY + height * 0.3, x2: startX + width * 0.7, y2: startY + height, color: '#06b6d4' }
                );
                break;
                
            case 2:
                // Level 2: 3 Wände
                this.walls.push(
                    { x1: startX + width * 0.25, y1: startY, x2: startX + width * 0.25, y2: startY + height * 0.6, color: '#8b5cf6' },
                    { x1: startX + width * 0.5, y1: startY + height * 0.4, x2: startX + width * 0.5, y2: startY + height, color: '#06b6d4' },
                    { x1: startX + width * 0.75, y1: startY, x2: startX + width * 0.75, y2: startY + height * 0.6, color: '#f59e0b' }
                );
                break;
                
            case 3:
                // Level 3: Zickzack-Muster
                this.walls.push(
                    { x1: startX + width * 0.2, y1: startY, x2: startX + width * 0.2, y2: startY + height * 0.5, color: '#8b5cf6' },
                    { x1: startX + width * 0.4, y1: startY + height * 0.3, x2: startX + width * 0.4, y2: startY + height, color: '#06b6d4' },
                    { x1: startX + width * 0.6, y1: startY, x2: startX + width * 0.6, y2: startY + height * 0.7, color: '#f59e0b' },
                    { x1: startX + width * 0.8, y1: startY + height * 0.3, x2: startX + width * 0.8, y2: startY + height, color: '#ec4899' }
                );
                break;
                
            case 4:
                // Level 4: Horizontale und vertikale Wände
                this.walls.push(
                    { x1: startX + width * 0.3, y1: startY, x2: startX + width * 0.3, y2: startY + height * 0.45, color: '#8b5cf6' },
                    { x1: startX, y1: startY + height * 0.3, x2: startX + width * 0.5, y2: startY + height * 0.3, color: '#06b6d4' },
                    { x1: startX + width * 0.6, y1: startY + height * 0.5, x2: startX + width * 0.6, y2: startY + height, color: '#f59e0b' },
                    { x1: startX + width * 0.4, y1: startY + height * 0.7, x2: startX + width, y2: startY + height * 0.7, color: '#ec4899' }
                );
                break;
                
            case 5:
                // Level 5: Engere Gänge
                this.walls.push(
                    { x1: startX + width * 0.2, y1: startY, x2: startX + width * 0.2, y2: startY + height * 0.6, color: '#8b5cf6' },
                    { x1: startX + width * 0.35, y1: startY + height * 0.4, x2: startX + width * 0.35, y2: startY + height, color: '#06b6d4' },
                    { x1: startX + width * 0.5, y1: startY, x2: startX + width * 0.5, y2: startY + height * 0.7, color: '#f59e0b' },
                    { x1: startX + width * 0.65, y1: startY + height * 0.3, x2: startX + width * 0.65, y2: startY + height, color: '#ec4899' },
                    { x1: startX + width * 0.8, y1: startY, x2: startX + width * 0.8, y2: startY + height * 0.6, color: '#14b8a6' }
                );
                break;
                
            case 6:
                // Level 6: Doppel-Labyrint mit Kreuzungen
                this.walls.push(
                    { x1: startX + width * 0.25, y1: startY, x2: startX + width * 0.25, y2: startY + height * 0.5, color: '#8b5cf6' },
                    { x1: startX, y1: startY + height * 0.25, x2: startX + width * 0.4, y2: startY + height * 0.25, color: '#06b6d4' },
                    { x1: startX + width * 0.5, y1: startY + height * 0.4, x2: startX + width * 0.5, y2: startY + height, color: '#f59e0b' },
                    { x1: startX + width * 0.6, y1: startY + height * 0.75, x2: startX + width, y2: startY + height * 0.75, color: '#ec4899' },
                    { x1: startX + width * 0.75, y1: startY, x2: startX + width * 0.75, y2: startY + height * 0.6, color: '#14b8a6' }
                );
                break;
                
            case 7:
                // Level 7: S-Kurven
                this.walls.push(
                    { x1: startX + width * 0.15, y1: startY, x2: startX + width * 0.15, y2: startY + height * 0.4, color: '#8b5cf6' },
                    { x1: startX, y1: startY + height * 0.35, x2: startX + width * 0.4, y2: startY + height * 0.35, color: '#06b6d4' },
                    { x1: startX + width * 0.4, y1: startY + height * 0.25, x2: startX + width * 0.4, y2: startY + height * 0.65, color: '#f59e0b' },
                    { x1: startX + width * 0.3, y1: startY + height * 0.65, x2: startX + width * 0.7, y2: startY + height * 0.65, color: '#ec4899' },
                    { x1: startX + width * 0.7, y1: startY + height * 0.35, x2: startX + width * 0.7, y2: startY + height, color: '#14b8a6' },
                    { x1: startX + width * 0.6, y1: startY + height * 0.35, x2: startX + width, y2: startY + height * 0.35, color: '#a855f7' }
                );
                break;
                
            case 8:
                // Level 8: Komplex mit vielen Wendungen
                this.walls.push(
                    { x1: startX + width * 0.2, y1: startY, x2: startX + width * 0.2, y2: startY + height * 0.35, color: '#8b5cf6' },
                    { x1: startX, y1: startY + height * 0.3, x2: startX + width * 0.35, y2: startY + height * 0.3, color: '#06b6d4' },
                    { x1: startX + width * 0.35, y1: startY + height * 0.2, x2: startX + width * 0.35, y2: startY + height * 0.55, color: '#f59e0b' },
                    { x1: startX + width * 0.25, y1: startY + height * 0.55, x2: startX + width * 0.55, y2: startY + height * 0.55, color: '#ec4899' },
                    { x1: startX + width * 0.55, y1: startY + height * 0.45, x2: startX + width * 0.55, y2: startY + height * 0.8, color: '#14b8a6' },
                    { x1: startX + width * 0.45, y1: startY + height * 0.8, x2: startX + width * 0.8, y2: startY + height * 0.8, color: '#a855f7' },
                    { x1: startX + width * 0.7, y1: startY, x2: startX + width * 0.7, y2: startY + height * 0.7, color: '#f97316' }
                );
                break;
                
            case 9:
                // Level 9: Sehr eng und verwinkelt
                this.walls.push(
                    { x1: startX + width * 0.15, y1: startY, x2: startX + width * 0.15, y2: startY + height * 0.4, color: '#8b5cf6' },
                    { x1: startX + width * 0.3, y1: startY + height * 0.25, x2: startX + width * 0.3, y2: startY + height * 0.55, color: '#06b6d4' },
                    { x1: startX, y1: startY + height * 0.5, x2: startX + width * 0.45, y2: startY + height * 0.5, color: '#f59e0b' },
                    { x1: startX + width * 0.45, y1: startY + height * 0.35, x2: startX + width * 0.45, y2: startY + height * 0.7, color: '#ec4899' },
                    { x1: startX + width * 0.35, y1: startY + height * 0.7, x2: startX + width * 0.65, y2: startY + height * 0.7, color: '#14b8a6' },
                    { x1: startX + width * 0.6, y1: startY, x2: startX + width * 0.6, y2: startY + height * 0.45, color: '#a855f7' },
                    { x1: startX + width * 0.55, y1: startY + height * 0.3, x2: startX + width * 0.8, y2: startY + height * 0.3, color: '#f97316' },
                    { x1: startX + width * 0.75, y1: startY + height * 0.5, x2: startX + width * 0.75, y2: startY + height, color: '#0ea5e9' }
                );
                break;
                
            case 10:
                // Level 10: Master-Level - sehr schwierig!
                this.walls.push(
                    { x1: startX + width * 0.12, y1: startY, x2: startX + width * 0.12, y2: startY + height * 0.35, color: '#8b5cf6' },
                    { x1: startX, y1: startY + height * 0.25, x2: startX + width * 0.25, y2: startY + height * 0.25, color: '#06b6d4' },
                    { x1: startX + width * 0.25, y1: startY + height * 0.15, x2: startX + width * 0.25, y2: startY + height * 0.5, color: '#f59e0b' },
                    { x1: startX + width * 0.15, y1: startY + height * 0.45, x2: startX + width * 0.4, y2: startY + height * 0.45, color: '#ec4899' },
                    { x1: startX + width * 0.4, y1: startY + height * 0.35, x2: startX + width * 0.4, y2: startY + height * 0.65, color: '#14b8a6' },
                    { x1: startX + width * 0.3, y1: startY + height * 0.65, x2: startX + width * 0.6, y2: startY + height * 0.65, color: '#a855f7' },
                    { x1: startX + width * 0.55, y1: startY, x2: startX + width * 0.55, y2: startY + height * 0.4, color: '#f97316' },
                    { x1: startX + width * 0.5, y1: startY + height * 0.3, x2: startX + width * 0.75, y2: startY + height * 0.3, color: '#0ea5e9' },
                    { x1: startX + width * 0.7, y1: startY + height * 0.5, x2: startX + width * 0.7, y2: startY + height * 0.85, color: '#84cc16' },
                    { x1: startX + width * 0.6, y1: startY + height * 0.8, x2: startX + width, y2: startY + height * 0.8, color: '#f43f5e' }
                );
                break;
        }
        
        // Start- und Zielpositionen
        this.start_pos = { x: startX + 30, y: startY + height / 2 };
        this.goal = { 
            x: startX + width - 30, 
            y: startY + height / 2,
            radius: 25,
            pulse: 0,
            rotation: 0
        };
        
        // Spieler auf Start setzen
        this.player.x = this.start_pos.x;
        this.player.y = this.start_pos.y;
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    handleMouseDown = (e) => {
        const pos = this.getMousePos(e);
        const dx = pos.x - this.player.x;
        const dy = pos.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.player.radius + 10) {
            this.isDragging = true;
        }
    }
    
    handleMouseMove = (e) => {
        if (this.isDragging) {
            const pos = this.getMousePos(e);
            this.movePlayer(pos.x, pos.y);
        }
    }
    
    handleMouseUp = (e) => {
        this.isDragging = false;
    }
    
    handleTouchStart = (e) => {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        const dx = pos.x - this.player.x;
        const dy = pos.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.player.radius + 10) {
            this.isDragging = true;
        }
    }
    
    handleTouchMove = (e) => {
        e.preventDefault();
        if (this.isDragging) {
            const pos = this.getTouchPos(e);
            this.movePlayer(pos.x, pos.y);
        }
    }
    
    handleTouchEnd = (e) => {
        e.preventDefault();
        this.isDragging = false;
    }
    
    movePlayer(newX, newY) {
        // Pfad-Trail hinzufügen
        if (this.isDragging) {
            this.pathTrail.push({
                x: this.player.x,
                y: this.player.y,
                life: 1
            });
            
            // Nur letzte 20 Punkte behalten
            if (this.pathTrail.length > 20) {
                this.pathTrail.shift();
            }
        }
        
        // Prüfe Kollision mit Wänden
        if (this.checkWallCollision(newX, newY)) {
            // Kollision! Zurück zum Start
            this.resetToStart();
            this.playErrorSound();
            this.createErrorParticles();
            return;
        }
        
        // Bewege Spieler
        this.player.x = newX;
        this.player.y = newY;
        
        // Prüfe ob Ziel erreicht
        const dx = this.player.x - this.goal.x;
        const dy = this.player.y - this.goal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.player.radius + this.goal.radius) {
            // Ziel erreicht!
            this.isDragging = false;
            this.playSuccessSound();
            this.createSuccessParticles();
            this.successAnimation = 1;
            
            // Nächstes Level oder beenden
            if (this.level < 10) {
                this.level++;
                setTimeout(() => {
                    this.successAnimation = 0;
                    this.pathTrail = [];
                    this.createMaze();
                }, 1500);
            } else {
                setTimeout(() => {
                    this.stop();
                    if (this.onExit) this.onExit();
                }, 2000);
            }
        }
    }
    
    createSuccessParticles() {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: this.goal.x,
                y: this.goal.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 5
            });
        }
    }
    
    createErrorParticles() {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: '#ef4444',
                size: 2 + Math.random() * 3
            });
        }
    }
    
    checkWallCollision(x, y) {
        for (let wall of this.walls) {
            // Berechne Abstand zwischen Punkt und Liniensegment
            const distance = this.pointToLineDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
            
            if (distance < this.player.radius) {
                return true;
            }
        }
        return false;
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Berechne den kürzesten Abstand zwischen Punkt (px, py) und Linie (x1,y1)-(x2,y2)
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq !== 0) {
            param = dot / len_sq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    resetToStart() {
        this.player.x = this.start_pos.x;
        this.player.y = this.start_pos.y;
        this.attempts++;
        this.pathTrail = [];
        this.animateShake();
    }
    
    animateShake() {
        let startTime = Date.now();
        const duration = 300;
        const originalX = this.player.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.player.x = originalX + Math.sin(progress * Math.PI * 6) * 10 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                this.player.x = originalX;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    playSuccessSound() {
        audioManager.playSuccessSound();
    }
    
    playErrorSound() {
        audioManager.playErrorSound();
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund mit Verlauf
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e0f2fe');
        gradient.addColorStop(1, '#f0fdf4');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dekorative Sterne
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            this.ctx.fillStyle = `rgba(147, 51, 234, ${star.opacity * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Anweisung mit Schatten
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 26px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌀 Ziehe den Punkt zum Ziel! 🌀', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Level Badge
        this.ctx.save();
        const badgeX = this.canvas.width / 2;
        const badgeY = 65;
        
        // Badge Hintergrund
        const badgeGradient = this.ctx.createLinearGradient(badgeX - 60, badgeY - 15, badgeX + 60, badgeY + 15);
        badgeGradient.addColorStop(0, '#a78bfa');
        badgeGradient.addColorStop(1, '#8b5cf6');
        this.ctx.fillStyle = badgeGradient;
        this.ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
        this.ctx.shadowBlur = 15;
        this.roundRect(badgeX - 60, badgeY - 15, 120, 30, 15);
        this.ctx.fill();
        
        // Badge Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`⭐ Level ${this.level}/10`, badgeX, badgeY + 5);
        this.ctx.restore();
        
        // Versuche
        if (this.attempts > 0) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Versuche: ${this.attempts}`, this.canvas.width / 2, 95);
        }
        
        // Pfad-Trail zeichnen
        for (let i = 0; i < this.pathTrail.length; i++) {
            const point = this.pathTrail[i];
            point.life -= 0.05;
            
            if (point.life > 0) {
                const alpha = point.life * 0.3;
                const size = 8 * point.life;
                this.ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Trail aufräumen
        this.pathTrail = this.pathTrail.filter(p => p.life > 0);
        
        // Ziel mit aufwendiger Animation
        this.goal.pulse = (this.goal.pulse + 0.08) % (Math.PI * 2);
        this.goal.rotation = (this.goal.rotation + 0.02) % (Math.PI * 2);
        const goalRadius = this.goal.radius + Math.sin(this.goal.pulse) * 5;
        
        // Ziel äusserer Ring
        for (let i = 0; i < 3; i++) {
            const ringRadius = goalRadius + 10 + i * 8;
            const alpha = (1 - i / 3) * 0.3 * Math.abs(Math.sin(this.goal.pulse + i));
            this.ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.goal.x, this.goal.y, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Ziel Hauptkreis
        const goalGradient = this.ctx.createRadialGradient(
            this.goal.x - 10, this.goal.y - 10, 0,
            this.goal.x, this.goal.y, goalRadius
        );
        goalGradient.addColorStop(0, '#6ee7b7');
        goalGradient.addColorStop(1, '#10b981');
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = goalGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.goal.x, this.goal.y, goalRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ziel-Symbol mit Rotation
        this.ctx.translate(this.goal.x, this.goal.y);
        this.ctx.rotate(this.goal.rotation);
        this.ctx.shadowBlur = 0;
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🎯', 0, 0);
        this.ctx.restore();
        
        // Start-Position schöner
        const startGradient = this.ctx.createRadialGradient(
            this.start_pos.x - 5, this.start_pos.y - 5, 0,
            this.start_pos.x, this.start_pos.y, 25
        );
        startGradient.addColorStop(0, '#93c5fd');
        startGradient.addColorStop(1, '#3b82f6');
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = startGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.start_pos.x, this.start_pos.y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🏠', this.start_pos.x, this.start_pos.y);
        this.ctx.restore();
        
        // Wände mit Farbverläufen zeichnen
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        for (let wall of this.walls) {
            // Schatten
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetY = 3;
            
            // Verlauf für Wand
            const wallGradient = this.ctx.createLinearGradient(wall.x1, wall.y1, wall.x2, wall.y2);
            const baseColor = wall.color || '#1e293b';
            wallGradient.addColorStop(0, this.lightenColor(baseColor, 20));
            wallGradient.addColorStop(0.5, baseColor);
            wallGradient.addColorStop(1, this.darkenColor(baseColor, 20));
            
            this.ctx.strokeStyle = wallGradient;
            this.ctx.lineWidth = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x1, wall.y1);
            this.ctx.lineTo(wall.x2, wall.y2);
            this.ctx.stroke();
            
            // Highlight auf Wänden
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x1, wall.y1);
            this.ctx.lineTo(wall.x2, wall.y2);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
        
        // Partikel zeichnen und aktualisieren
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
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
        
        // Spieler zeichnen mit Glow-Effekt
        const playerGradient = this.ctx.createRadialGradient(
            this.player.x - 5, this.player.y - 5, 0,
            this.player.x, this.player.y, this.player.radius
        );
        
        if (this.isDragging) {
            playerGradient.addColorStop(0, '#fda4af');
            playerGradient.addColorStop(1, '#f43f5e');
            this.ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
        } else {
            playerGradient.addColorStop(0, '#fbbf24');
            playerGradient.addColorStop(1, '#f59e0b');
            this.ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        }
        
        this.ctx.save();
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = playerGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Weisser Highlight auf Spieler
        this.ctx.shadowBlur = 0;
        const highlightGradient = this.ctx.createRadialGradient(
            this.player.x - 5, this.player.y - 5, 0,
            this.player.x, this.player.y, this.player.radius
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();
        this.ctx.restore();
        
        // Erfolgsanimation
        if (this.successAnimation > 0) {
            this.successAnimation -= 0.02;
            const scale = 1 + (1 - this.successAnimation) * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = this.successAnimation;
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(scale, scale);
            this.ctx.font = 'bold 60px sans-serif';
            this.ctx.fillStyle = '#10b981';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🎉', 0, 0);
            this.ctx.restore();
        }
        
        requestAnimationFrame(this.render);
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
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


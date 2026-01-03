// game_paint.js - 🎨 COSMIC PAINT - Kreativ malen!
import { audioManager } from './audio_utils.js';

export class PaintGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.paintCanvas = null;
        this.paintCtx = null;
        
        this.currentColor = '#ff00ff';
        this.brushSize = 15;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.colors = [
            '#ff0055', '#ff8800', '#ffff00', '#00ff88', 
            '#00ffff', '#0088ff', '#8800ff', '#ff00ff',
            '#ffffff', '#000000'
        ];
        
        this.brushSizes = [8, 15, 25, 40];
        this.currentSizeIndex = 1;
        
        this.stars = [];
        this.sparkles = [];
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.time = 0;
        this.sparkles = [];
        
        // Mal-Canvas erstellen
        this.paintCanvas = document.createElement('canvas');
        this.paintCanvas.width = this.canvas.width;
        this.paintCanvas.height = this.canvas.height - 150;
        this.paintCtx = this.paintCanvas.getContext('2d');
        
        // Weißer Hintergrund
        this.paintCtx.fillStyle = '#1a0a30';
        this.paintCtx.fillRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);
        
        this.generateStars();
        
        this.canvas.addEventListener('mousedown', this.handleStart);
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('mouseup', this.handleEnd);
        this.canvas.addEventListener('mouseleave', this.handleEnd);
        this.canvas.addEventListener('touchstart', this.handleStart);
        this.canvas.addEventListener('touchmove', this.handleMove);
        this.canvas.addEventListener('touchend', this.handleEnd);
        this.canvas.addEventListener('click', this.handleClick);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousedown', this.handleStart);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('mouseup', this.handleEnd);
        this.canvas.removeEventListener('mouseleave', this.handleEnd);
        this.canvas.removeEventListener('touchstart', this.handleStart);
        this.canvas.removeEventListener('touchmove', this.handleMove);
        this.canvas.removeEventListener('touchend', this.handleEnd);
        this.canvas.removeEventListener('click', this.handleClick);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 60,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    }
    
    handleStart = (e) => {
        e.preventDefault();
        const pos = this.getPos(e);
        
        // Im Malbereich?
        if (pos.y > 70 && pos.y < this.canvas.height - 80) {
            this.isDrawing = true;
            this.lastX = pos.x;
            this.lastY = pos.y - 70;
            
            // Punkt malen
            this.paintCtx.fillStyle = this.currentColor;
            this.paintCtx.shadowColor = this.currentColor;
            this.paintCtx.shadowBlur = 15;
            this.paintCtx.beginPath();
            this.paintCtx.arc(this.lastX, this.lastY, this.brushSize / 2, 0, Math.PI * 2);
            this.paintCtx.fill();
            this.paintCtx.shadowBlur = 0;
            
            this.createSparkle(pos.x, pos.y);
        }
    }
    
    handleMove = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        const pos = this.getPos(e);
        const x = pos.x;
        const y = pos.y - 70;
        
        if (pos.y > 70 && pos.y < this.canvas.height - 80) {
            // Linie malen
            this.paintCtx.strokeStyle = this.currentColor;
            this.paintCtx.shadowColor = this.currentColor;
            this.paintCtx.shadowBlur = 12;
            this.paintCtx.lineWidth = this.brushSize;
            this.paintCtx.lineCap = 'round';
            this.paintCtx.lineJoin = 'round';
            
            this.paintCtx.beginPath();
            this.paintCtx.moveTo(this.lastX, this.lastY);
            this.paintCtx.lineTo(x, y);
            this.paintCtx.stroke();
            this.paintCtx.shadowBlur = 0;
            
            this.lastX = x;
            this.lastY = y;
            
            // Gelegentlich Sparkles
            if (Math.random() < 0.3) {
                this.createSparkle(pos.x, pos.y);
            }
        }
    }
    
    handleEnd = (e) => {
        this.isDrawing = false;
    }
    
    handleClick = (e) => {
        e.preventDefault();
        const pos = this.getPos(e);
        
        // Farb-Buttons (unten)
        const buttonY = this.canvas.height - 50;
        const buttonSize = 35;
        const startX = (this.canvas.width - this.colors.length * (buttonSize + 5)) / 2;
        
        for (let i = 0; i < this.colors.length; i++) {
            const bx = startX + i * (buttonSize + 5);
            if (pos.x >= bx && pos.x <= bx + buttonSize &&
                pos.y >= buttonY && pos.y <= buttonY + buttonSize) {
                this.currentColor = this.colors[i];
                audioManager.playClickSound();
                return;
            }
        }
        
        // Pinselgröße (oben rechts)
        const sizeY = 25;
        const sizeButtonWidth = 40;
        for (let i = 0; i < this.brushSizes.length; i++) {
            const sx = this.canvas.width - 180 + i * (sizeButtonWidth + 5);
            if (pos.x >= sx && pos.x <= sx + sizeButtonWidth &&
                pos.y >= sizeY && pos.y <= sizeY + 35) {
                this.currentSizeIndex = i;
                this.brushSize = this.brushSizes[i];
                audioManager.playClickSound();
                return;
            }
        }
        
        // Löschen-Button (oben links)
        if (pos.x >= 20 && pos.x <= 100 && pos.y >= 25 && pos.y <= 55) {
            this.paintCtx.fillStyle = '#1a0a30';
            this.paintCtx.fillRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);
            this.createClearParticles();
            audioManager.playClickSound();
        }
    }
    
    createSparkle(x, y) {
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 1,
                color: this.currentColor,
                size: 3 + Math.random() * 4
            });
        }
    }
    
    createClearParticles() {
        for (let i = 0; i < 30; i++) {
            this.sparkles.push({
                x: Math.random() * this.canvas.width,
                y: 70 + Math.random() * (this.canvas.height - 150),
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: 5 + Math.random() * 8
            });
        }
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        this.time += 0.016;
        
        // Sparkles updaten
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.03;
            
            if (s.life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
        
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0025');
        gradient.addColorStop(1, '#150045');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne im Header
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
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 24px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎨 COSMIC PAINT 🎨', this.canvas.width / 2, 45);
        this.ctx.restore();
        
        // Löschen-Button
        this.ctx.save();
        this.ctx.shadowColor = '#ff0055';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ff0055';
        this.ctx.beginPath();
        this.ctx.roundRect(20, 25, 80, 30, 8);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🗑️ Neu', 60, 45);
        this.ctx.restore();
        
        // Pinselgröße-Buttons
        for (let i = 0; i < this.brushSizes.length; i++) {
            const sx = this.canvas.width - 180 + i * 45;
            const isSelected = i === this.currentSizeIndex;
            
            this.ctx.save();
            this.ctx.shadowColor = isSelected ? '#00ffff' : '#666';
            this.ctx.shadowBlur = isSelected ? 15 : 5;
            this.ctx.fillStyle = isSelected ? '#00ffff' : '#333';
            this.ctx.beginPath();
            this.ctx.roundRect(sx, 25, 40, 35, 8);
            this.ctx.fill();
            
            // Größe anzeigen
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = isSelected ? '#003333' : '#888';
            this.ctx.beginPath();
            this.ctx.arc(sx + 20, 42, this.brushSizes[i] / 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Mal-Canvas (Rahmen)
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(0, 70, this.canvas.width, this.canvas.height - 150, 0);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Mal-Canvas zeichnen
        this.ctx.drawImage(this.paintCanvas, 0, 70);
        
        // Sparkles
        for (let s of this.sparkles) {
            this.ctx.fillStyle = s.color;
            this.ctx.shadowColor = s.color;
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = s.life;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        this.ctx.shadowBlur = 0;
        
        // Farb-Palette
        const buttonY = this.canvas.height - 50;
        const buttonSize = 35;
        const startX = (this.canvas.width - this.colors.length * (buttonSize + 5)) / 2;
        
        for (let i = 0; i < this.colors.length; i++) {
            const bx = startX + i * (buttonSize + 5);
            const isSelected = this.colors[i] === this.currentColor;
            
            this.ctx.save();
            
            if (isSelected) {
                this.ctx.shadowColor = this.colors[i];
                this.ctx.shadowBlur = 20;
            }
            
            // Hintergrund
            this.ctx.fillStyle = this.colors[i];
            this.ctx.beginPath();
            this.ctx.roundRect(bx, buttonY, buttonSize, buttonSize, 8);
            this.ctx.fill();
            
            // Ausgewählt?
            if (isSelected) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
        
        // Pinsel-Vorschau
        this.ctx.save();
        this.ctx.fillStyle = this.currentColor;
        this.ctx.shadowColor = this.currentColor;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 25, this.canvas.height - 32, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}


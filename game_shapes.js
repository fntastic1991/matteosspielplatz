// game_shapes.js - Formen sortieren Spiel
// Grafiken von https://www.svgrepo.com (CC0 lizenziert)

import { loadImageWithFallback } from './main.js';

export class ShapeGame {
    constructor() {
        this.shapes = [];
        this.dropZones = [];
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        this.draggedShape = null;
        this.dragOffset = { x: 0, y: 0 };
        this.completedShapes = 0;
        this.totalShapes = 6;
        
        // Form-Definitionen
        this.shapeTypes = [
            { type: 'circle', name: 'Kreis', color: '#ef4444' },
            { type: 'square', name: 'Quadrat', color: '#3b82f6' },
            { type: 'triangle', name: 'Dreieck', color: '#10b981' }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.completedShapes = 0;
        
        // Drop-Zones erstellen
        this.createDropZones();
        
        // Formen erstellen
        this.createShapes();
        
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
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    createDropZones() {
        this.dropZones = [];
        const zoneWidth = 120;
        const zoneHeight = 120;
        const spacing = 20;
        const totalWidth = (zoneWidth * 3) + (spacing * 2);
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = 80;
        
        for (let i = 0; i < 3; i++) {
            this.dropZones.push({
                x: startX + (zoneWidth + spacing) * i,
                y: y,
                width: zoneWidth,
                height: zoneHeight,
                type: this.shapeTypes[i].type,
                name: this.shapeTypes[i].name,
                color: this.shapeTypes[i].color,
                hasShape: false
            });
        }
    }
    
    createShapes() {
        this.shapes = [];
        const shapeSize = 60;
        const startY = this.canvas.height - 200;
        
        // Jede Form zweimal
        for (let i = 0; i < this.totalShapes; i++) {
            const shapeType = this.shapeTypes[i % 3];
            const col = i % 3;
            const row = Math.floor(i / 3);
            
            this.shapes.push({
                x: 60 + col * 120,
                y: startY + row * 100,
                size: shapeSize,
                type: shapeType.type,
                color: shapeType.color,
                originalX: 60 + col * 120,
                originalY: startY + row * 100,
                placed: false,
                dragging: false,
                scale: 1
            });
        }
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
        this.startDrag(pos.x, pos.y);
    }
    
    handleMouseMove = (e) => {
        if (this.draggedShape) {
            const pos = this.getMousePos(e);
            this.updateDrag(pos.x, pos.y);
        }
    }
    
    handleMouseUp = (e) => {
        const pos = this.getMousePos(e);
        this.endDrag(pos.x, pos.y);
    }
    
    handleTouchStart = (e) => {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.startDrag(pos.x, pos.y);
    }
    
    handleTouchMove = (e) => {
        e.preventDefault();
        if (this.draggedShape) {
            const pos = this.getTouchPos(e);
            this.updateDrag(pos.x, pos.y);
        }
    }
    
    handleTouchEnd = (e) => {
        e.preventDefault();
        if (this.draggedShape) {
            this.endDrag(this.draggedShape.x, this.draggedShape.y);
        }
    }
    
    startDrag(x, y) {
        // Finde Form unter dem Mauszeiger (von oben nach unten)
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (shape.placed) continue;
            
            const dx = x - shape.x;
            const dy = y - shape.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= shape.size / 2) {
                this.draggedShape = shape;
                this.draggedShape.dragging = true;
                this.dragOffset.x = dx;
                this.dragOffset.y = dy;
                
                // Form nach vorne bringen
                this.shapes.splice(i, 1);
                this.shapes.push(shape);
                break;
            }
        }
    }
    
    updateDrag(x, y) {
        if (this.draggedShape) {
            this.draggedShape.x = x - this.dragOffset.x;
            this.draggedShape.y = y - this.dragOffset.y;
        }
    }
    
    endDrag(x, y) {
        if (!this.draggedShape) return;
        
        // Prüfe ob Form in richtiger Zone
        let snapped = false;
        
        for (let zone of this.dropZones) {
            if (zone.hasShape) continue;
            
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                
                if (this.draggedShape.type === zone.type) {
                    // Richtige Zone!
                    this.draggedShape.x = centerX;
                    this.draggedShape.y = centerY;
                    this.draggedShape.placed = true;
                    zone.hasShape = true;
                    this.completedShapes++;
                    
                    this.animateSuccess(this.draggedShape);
                    this.playSuccessSound();
                    
                    // Alle Formen platziert?
                    if (this.completedShapes >= this.totalShapes) {
                        setTimeout(() => {
                            this.stop();
                            if (this.onExit) this.onExit();
                        }, 1000);
                    }
                    
                    snapped = true;
                } else {
                    // Falsche Zone
                    this.animateShake(this.draggedShape);
                    this.playWrongSound();
                }
                break;
            }
        }
        
        // Zurück zur Originalposition wenn nicht gepasst
        if (!snapped && !this.draggedShape.placed) {
            this.draggedShape.x = this.draggedShape.originalX;
            this.draggedShape.y = this.draggedShape.originalY;
        }
        
        this.draggedShape.dragging = false;
        this.draggedShape = null;
    }
    
    animateSuccess(shape) {
        let startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                shape.scale = 1 + progress * 0.4;
            } else {
                shape.scale = 1.2 - (progress - 0.5) * 0.4;
            }
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                shape.scale = 1;
            }
        };
        
        animate();
    }
    
    animateShake(shape) {
        let startTime = Date.now();
        const duration = 300;
        const startX = shape.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            shape.x = startX + Math.sin(progress * Math.PI * 4) * 10 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                shape.x = startX;
            }
        };
        
        animate();
    }
    
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 523.25;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    playWrongSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    drawShape(shape) {
        this.ctx.save();
        this.ctx.translate(shape.x, shape.y);
        this.ctx.scale(shape.scale, shape.scale);
        
        // Schatten
        if (!shape.placed) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 5;
        }
        
        this.ctx.fillStyle = shape.color;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        
        const size = shape.size;
        
        switch(shape.type) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;
                
            case 'square':
                this.ctx.fillRect(-size / 2, -size / 2, size, size);
                this.ctx.strokeRect(-size / 2, -size / 2, size, size);
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size / 2);
                this.ctx.lineTo(size / 2, size / 2);
                this.ctx.lineTo(-size / 2, size / 2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }
    
    drawDropZone(zone) {
        this.ctx.save();
        
        // Zone Hintergrund
        this.ctx.fillStyle = zone.hasShape ? '#e0f2fe' : 'rgba(255, 255, 255, 0.5)';
        this.ctx.strokeStyle = zone.color;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 5]);
        
        this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        this.ctx.setLineDash([]);
        
        // Symbol in der Zone
        if (!zone.hasShape) {
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = zone.color;
            
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            const size = 50;
            
            this.ctx.translate(centerX, centerY);
            
            switch(zone.type) {
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'square':
                    this.ctx.fillRect(-size / 2, -size / 2, size, size);
                    break;
                    
                case 'triangle':
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -size / 2);
                    this.ctx.lineTo(size / 2, size / 2);
                    this.ctx.lineTo(-size / 2, size / 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
            }
        }
        
        this.ctx.restore();
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Anweisung
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔺 Ziehe jede Form in das richtige Feld! 🔺', this.canvas.width / 2, 30);
        
        // Fortschritt anzeigen
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(
            `${this.completedShapes} von ${this.totalShapes} geschafft! 🌟`,
            this.canvas.width / 2,
            60
        );
        
        // Drop-Zones zeichnen
        for (let zone of this.dropZones) {
            this.drawDropZone(zone);
        }
        
        // Formen zeichnen
        for (let shape of this.shapes) {
            this.drawShape(shape);
        }
        
        requestAnimationFrame(this.render);
    }
}


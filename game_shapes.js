// game_shapes.js - Formen sortieren Spiel
// Grafiken von https://www.svgrepo.com (CC0 lizenziert)
import { audioManager } from './audio_utils.js';

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
        this.currentLevel = 1;
        this.maxLevel = 10;
        this.particles = [];
        
        // Alle Form-Definitionen
        this.allShapeTypes = [
            { type: 'circle', name: 'Kreis', color: '#ef4444' },
            { type: 'square', name: 'Quadrat', color: '#3b82f6' },
            { type: 'triangle', name: 'Dreieck', color: '#10b981' },
            { type: 'star', name: 'Stern', color: '#fbbf24' },
            { type: 'heart', name: 'Herz', color: '#ec4899' },
            { type: 'diamond', name: 'Diamant', color: '#8b5cf6' }
        ];
        
        this.shapeTypes = [];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.currentLevel = 1;
        
        this.startLevel();
        
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
    
    startLevel() {
        this.completedShapes = 0;
        this.particles = [];
        
        // Level-spezifische Einstellungen
        if (this.currentLevel <= 2) {
            // Level 1-2: 3 Formen, 6 Stück
            this.shapeTypes = this.allShapeTypes.slice(0, 3);
            this.totalShapes = 6;
        } else if (this.currentLevel <= 4) {
            // Level 3-4: 4 Formen, 8 Stück
            this.shapeTypes = this.allShapeTypes.slice(0, 4);
            this.totalShapes = 8;
        } else if (this.currentLevel <= 6) {
            // Level 5-6: 5 Formen, 10 Stück
            this.shapeTypes = this.allShapeTypes.slice(0, 5);
            this.totalShapes = 10;
        } else {
            // Level 7-10: 6 Formen, 12 Stück
            this.shapeTypes = this.allShapeTypes.slice(0, 6);
            this.totalShapes = 12;
        }
        
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
        const numTypes = this.shapeTypes.length;
        const zoneWidth = Math.min(120, (this.canvas.width - 40) / (numTypes + 0.5));
        const zoneHeight = 120;
        const spacing = 15;
        const totalWidth = (zoneWidth * numTypes) + (spacing * (numTypes - 1));
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = 100;
        
        for (let i = 0; i < numTypes; i++) {
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
        const shapeSize = 55;
        const numTypes = this.shapeTypes.length;
        const cols = Math.min(6, numTypes);
        const rows = Math.ceil(this.totalShapes / cols);
        const spacing = Math.min(100, (this.canvas.width - 80) / cols);
        const startY = this.canvas.height - (rows * 90) - 40;
        const startX = (this.canvas.width - (cols * spacing)) / 2 + spacing / 2;
        
        // Forme verteilt auf alle Typen
        for (let i = 0; i < this.totalShapes; i++) {
            const shapeType = this.shapeTypes[i % numTypes];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = startX + col * spacing;
            const y = startY + row * 90;
            
            this.shapes.push({
                x: x,
                y: y,
                size: shapeSize,
                type: shapeType.type,
                color: shapeType.color,
                originalX: x,
                originalY: y,
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
                    this.createSuccessParticles(centerX, centerY, zone.color);
                    
                    // Alle Formen platziert?
                    if (this.completedShapes >= this.totalShapes) {
                        this.levelComplete();
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
        audioManager.playSuccessSound();
    }
    
    playWrongSound() {
        audioManager.playErrorSound();
    }
    
    levelComplete() {
        setTimeout(() => {
            if (this.currentLevel >= this.maxLevel) {
                // Alle Level geschafft!
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                // Nächstes Level
                this.currentLevel++;
                this.startLevel();
            }
        }, 1500);
    }
    
    createSuccessParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: 3 + Math.random() * 4
            });
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
                
            case 'star':
                this.drawStar(0, 0, 5, size / 2, size / 4);
                break;
                
            case 'heart':
                this.drawHeart(0, 0, size / 2);
                break;
                
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size / 2);
                this.ctx.lineTo(size / 2, 0);
                this.ctx.lineTo(0, size / 2);
                this.ctx.lineTo(-size / 2, 0);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }
    
    drawStar(x, y, points, outer, inner) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outer : inner;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        
        // Linke Seite
        this.ctx.bezierCurveTo(
            x, y - size * 0.3,
            x - size, y - size * 0.3,
            x - size, y + topCurveHeight
        );
        this.ctx.bezierCurveTo(
            x - size, y + size * 0.6,
            x, y + size,
            x, y + size * 1.3
        );
        
        // Rechte Seite
        this.ctx.bezierCurveTo(
            x, y + size,
            x + size, y + size * 0.6,
            x + size, y + topCurveHeight
        );
        this.ctx.bezierCurveTo(
            x + size, y - size * 0.3,
            x, y - size * 0.3,
            x, y + topCurveHeight
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
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
            this.ctx.strokeStyle = 'transparent';
            
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            const size = Math.min(50, zone.width * 0.6);
            
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
                    
                case 'star':
                    this.drawStar(0, 0, 5, size / 2, size / 4);
                    break;
                    
                case 'heart':
                    this.drawHeart(0, 0, size / 2);
                    break;
                    
                case 'diamond':
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -size / 2);
                    this.ctx.lineTo(size / 2, 0);
                    this.ctx.lineTo(0, size / 2);
                    this.ctx.lineTo(-size / 2, 0);
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
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(1, '#fed7aa');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Level-Anzeige
        this.ctx.fillStyle = '#7c2d12';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.currentLevel}/${this.maxLevel}`, this.canvas.width / 2, 35);
        
        // Anweisung
        this.ctx.fillStyle = '#78350f';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText('🔺 Ziehe jede Form in das richtige Feld! 🔺', this.canvas.width / 2, 65);
        
        // Fortschritt anzeigen
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(
            `${this.completedShapes} von ${this.totalShapes} geschafft! 🌟`,
            this.canvas.width / 2,
            this.canvas.height - 20
        );
        
        // Drop-Zones zeichnen
        for (let zone of this.dropZones) {
            this.drawDropZone(zone);
        }
        
        // Formen zeichnen
        for (let shape of this.shapes) {
            this.drawShape(shape);
        }
        
        // Partikel zeichnen
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
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
        
        requestAnimationFrame(this.render);
    }
}


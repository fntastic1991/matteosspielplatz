// game_shapes.js - 🌌 COSMIC Formen sortieren Spiel
import { audioManager } from './audio_utils.js';

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
        this.stars = [];
        
        this.allShapeTypes = [
            { type: 'circle', name: 'Kreis', color: '#ff0055' },
            { type: 'square', name: 'Quadrat', color: '#00ffff' },
            { type: 'triangle', name: 'Dreieck', color: '#00ff88' },
            { type: 'star', name: 'Stern', color: '#ffff00' },
            { type: 'heart', name: 'Herz', color: '#ff00ff' },
            { type: 'diamond', name: 'Diamant', color: '#8800ff' }
        ];
        
        this.shapeTypes = [];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.currentLevel = 1;
        
        this.generateStars();
        this.startLevel();
        
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        
        this.render();
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    startLevel() {
        this.completedShapes = 0;
        this.particles = [];
        
        if (this.currentLevel <= 2) {
            this.shapeTypes = this.allShapeTypes.slice(0, 3);
            this.totalShapes = 6;
        } else if (this.currentLevel <= 4) {
            this.shapeTypes = this.allShapeTypes.slice(0, 4);
            this.totalShapes = 8;
        } else if (this.currentLevel <= 6) {
            this.shapeTypes = this.allShapeTypes.slice(0, 5);
            this.totalShapes = 10;
        } else {
            this.shapeTypes = this.allShapeTypes.slice(0, 6);
            this.totalShapes = 12;
        }
        
        this.createDropZones();
        this.createShapes();
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
        const zoneWidth = Math.min(115, (this.canvas.width - 50) / (numTypes + 0.5));
        const zoneHeight = 115;
        const spacing = 12;
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
                hasShape: false,
                glow: i * 0.5
            });
        }
    }
    
    createShapes() {
        this.shapes = [];
        const shapeSize = 50;
        const numTypes = this.shapeTypes.length;
        const cols = Math.min(6, numTypes);
        const rows = Math.ceil(this.totalShapes / cols);
        const spacing = Math.min(95, (this.canvas.width - 80) / cols);
        const startY = this.canvas.height - (rows * 85) - 50;
        const startX = (this.canvas.width - (cols * spacing)) / 2 + spacing / 2;
        
        for (let i = 0; i < this.totalShapes; i++) {
            const shapeType = this.shapeTypes[i % numTypes];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = startX + col * spacing;
            const y = startY + row * 85;
            
            this.shapes.push({
                x, y,
                size: shapeSize,
                type: shapeType.type,
                color: shapeType.color,
                originalX: x,
                originalY: y,
                placed: false,
                dragging: false,
                scale: 1,
                glow: Math.random() * Math.PI * 2
            });
        }
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    
    handleMouseDown = (e) => { this.startDrag(this.getMousePos(e).x, this.getMousePos(e).y); }
    handleMouseMove = (e) => { if (this.draggedShape) this.updateDrag(this.getMousePos(e).x, this.getMousePos(e).y); }
    handleMouseUp = (e) => { this.endDrag(this.getMousePos(e).x, this.getMousePos(e).y); }
    handleTouchStart = (e) => { e.preventDefault(); this.startDrag(this.getTouchPos(e).x, this.getTouchPos(e).y); }
    handleTouchMove = (e) => { e.preventDefault(); if (this.draggedShape) this.updateDrag(this.getTouchPos(e).x, this.getTouchPos(e).y); }
    handleTouchEnd = (e) => { e.preventDefault(); if (this.draggedShape) this.endDrag(this.draggedShape.x, this.draggedShape.y); }
    
    startDrag(x, y) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (shape.placed) continue;
            
            const distance = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
            if (distance <= shape.size / 2 + 10) {
                this.draggedShape = shape;
                shape.dragging = true;
                this.dragOffset.x = x - shape.x;
                this.dragOffset.y = y - shape.y;
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
        
        let snapped = false;
        
        for (let zone of this.dropZones) {
            if (zone.hasShape) continue;
            
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                
                if (this.draggedShape.type === zone.type) {
                    this.draggedShape.x = centerX;
                    this.draggedShape.y = centerY;
                    this.draggedShape.placed = true;
                    zone.hasShape = true;
                    this.completedShapes++;
                    
                    this.animateSuccess(this.draggedShape);
                    this.playSuccessSound();
                    this.createSuccessParticles(centerX, centerY, zone.color);
                    
                    if (this.completedShapes >= this.totalShapes) {
                        this.levelComplete();
                    }
                    snapped = true;
                } else {
                    this.animateShake(this.draggedShape);
                    this.playWrongSound();
                }
                break;
            }
        }
        
        if (!snapped && !this.draggedShape.placed) {
            this.draggedShape.x = this.draggedShape.originalX;
            this.draggedShape.y = this.draggedShape.originalY;
        }
        
        this.draggedShape.dragging = false;
        this.draggedShape = null;
    }
    
    animateSuccess(shape) {
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            shape.scale = progress < 0.5 ? 1 + progress * 0.5 : 1.25 - (progress - 0.5) * 0.5;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                shape.scale = 1;
            }
        };
        animate();
    }
    
    animateShake(shape) {
        const startTime = Date.now();
        const duration = 300;
        const startX = shape.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            shape.x = startX + Math.sin(progress * Math.PI * 4) * 12 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                shape.x = startX;
            }
        };
        animate();
    }
    
    playSuccessSound() { audioManager.playSuccessSound(); }
    playWrongSound() { audioManager.playErrorSound(); }
    
    levelComplete() {
        setTimeout(() => {
            if (this.currentLevel >= this.maxLevel) {
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                this.currentLevel++;
                this.startLevel();
            }
        }, 1500);
    }
    
    createSuccessParticles(x, y, color) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color, size: 4 + Math.random() * 5
            });
        }
    }
    
    drawShape(shape) {
        this.ctx.save();
        this.ctx.translate(shape.x, shape.y);
        this.ctx.scale(shape.scale, shape.scale);
        
        shape.glow += 0.03;
        const glowIntensity = shape.placed ? 10 : (15 + Math.sin(shape.glow) * 8);
        
        this.ctx.shadowColor = shape.color;
        this.ctx.shadowBlur = glowIntensity;
        
        this.ctx.fillStyle = shape.color;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
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
        
        // Glanz
        if (!shape.placed) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.ellipse(-size * 0.15, -size * 0.15, size * 0.15, size * 0.1, -0.5, 0, Math.PI * 2);
            this.ctx.fill();
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
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        this.ctx.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.3, x - size, y + topCurveHeight);
        this.ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size * 1.3);
        this.ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + topCurveHeight);
        this.ctx.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.3, x, y + topCurveHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawDropZone(zone) {
        this.ctx.save();
        
        zone.glow += 0.03;
        const glowIntensity = zone.hasShape ? 5 : (12 + Math.sin(zone.glow) * 6);
        
        // Glasmorphism
        this.ctx.fillStyle = zone.hasShape ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
        this.ctx.shadowColor = zone.color;
        this.ctx.shadowBlur = glowIntensity;
        
        this.ctx.beginPath();
        this.ctx.roundRect(zone.x, zone.y, zone.width, zone.height, 15);
        this.ctx.fill();
        
        // Neon Border
        this.ctx.strokeStyle = zone.color;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash(zone.hasShape ? [] : [10, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Ghost-Form
        if (!zone.hasShape) {
            this.ctx.globalAlpha = 0.25;
            this.ctx.fillStyle = zone.color;
            this.ctx.strokeStyle = 'transparent';
            this.ctx.shadowBlur = 5;
            
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            const size = Math.min(45, zone.width * 0.5);
            
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
        
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#050510');
        gradient.addColorStop(0.5, '#0f0525');
        gradient.addColorStop(1, '#050510');
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
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 26px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🔷 Level ${this.currentLevel}/${this.maxLevel} 🔷`, this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Anweisung
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText('Ziehe jede Form ins richtige Feld!', this.canvas.width / 2, 65);
        this.ctx.restore();
        
        // Fortschritt
        this.ctx.save();
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 15;
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillText(`${this.completedShapes}/${this.totalShapes} geschafft! 🌟`, this.canvas.width / 2, this.canvas.height - 20);
        this.ctx.restore();
        
        // Drop-Zones
        for (let zone of this.dropZones) {
            this.drawDropZone(zone);
        }
        
        // Formen
        for (let shape of this.shapes) {
            this.drawShape(shape);
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            
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
        
        requestAnimationFrame(this.render);
    }
}

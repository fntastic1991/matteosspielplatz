// game_oddone.js - Finde den Unterschied Spiel

export class OddOneGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.shapes = [];
        this.level = 1;
        this.totalLevels = 10;
        this.score = 0;
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        this.successAnimation = 0;
        
        // Form-Typen
        this.shapeTypes = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
        this.colors = ['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#a855f7', '#ec4899', '#f97316', '#14b8a6'];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
        this.score = 0;
        this.particles = [];
        this.successAnimation = 0;
        
        // Dekorative Sterne generieren
        this.generateStars();
        
        // Level erstellen
        this.createLevel();
        
        // Touch/Click Event
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleTouch);
        
        // Render-Loop
        this.render();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 25; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                opacity: Math.random(),
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    createLevel() {
        this.shapes = [];
        
        // Wähle zufällige Form und Farbe für die normalen Formen
        const normalShape = this.shapeTypes[Math.floor(Math.random() * this.shapeTypes.length)];
        const normalColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        const normalSize = 80;
        
        // Wähle unterschiedliche Form/Farbe für das Odd One
        let oddShape, oddColor, oddSize;
        
        // Level bestimmt Schwierigkeit - ABER immer gut sichtbar!
        if (this.level <= 4) {
            // Level 1-4: Nur unterschiedliche Form (sehr einfach)
            do {
                oddShape = this.shapeTypes[Math.floor(Math.random() * this.shapeTypes.length)];
            } while (oddShape === normalShape);
            oddColor = normalColor;
            oddSize = normalSize;
        } else if (this.level <= 7) {
            // Level 5-7: Nur unterschiedliche Farbe (gut sichtbar)
            oddShape = normalShape;
            do {
                oddColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            } while (oddColor === normalColor);
            oddSize = normalSize;
        } else {
            // Level 8-10: BEIDES unterschiedlich - Form UND Farbe! (extra offensichtlich)
            do {
                oddShape = this.shapeTypes[Math.floor(Math.random() * this.shapeTypes.length)];
            } while (oddShape === normalShape);
            do {
                oddColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            } while (oddColor === normalColor);
            oddSize = normalSize;
        }
        
        // 4 Formen erstellen
        const shapeConfigs = [
            { type: normalShape, color: normalColor, size: normalSize, isOdd: false },
            { type: normalShape, color: normalColor, size: normalSize, isOdd: false },
            { type: normalShape, color: normalColor, size: normalSize, isOdd: false },
            { type: oddShape, color: oddColor, size: oddSize, isOdd: true }
        ];
        
        // Mischen
        shapeConfigs.sort(() => Math.random() - 0.5);
        
        // Positionieren (2x2 Grid mit mehr Abstand für Karten)
        const spacing = 200;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 20;
        
        const positions = [
            { x: centerX - spacing / 2, y: centerY - spacing / 2 },
            { x: centerX + spacing / 2, y: centerY - spacing / 2 },
            { x: centerX - spacing / 2, y: centerY + spacing / 2 },
            { x: centerX + spacing / 2, y: centerY + spacing / 2 }
        ];
        
        for (let i = 0; i < 4; i++) {
            this.shapes.push({
                x: positions[i].x,
                y: positions[i].y,
                type: shapeConfigs[i].type,
                color: shapeConfigs[i].color,
                size: shapeConfigs[i].size,
                isOdd: shapeConfigs[i].isOdd,
                scale: 1,
                rotation: 0,
                pulse: Math.random() * Math.PI * 2
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
    
    handleClick = (e) => {
        const pos = this.getMousePos(e);
        this.checkShapeClick(pos.x, pos.y);
    }
    
    handleTouch = (e) => {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.checkShapeClick(pos.x, pos.y);
    }
    
    checkShapeClick(x, y) {
        for (let shape of this.shapes) {
            // Karten-Hit-Box (140x160)
            const cardWidth = 140;
            const cardHeight = 160;
            
            if (x >= shape.x - cardWidth / 2 && x <= shape.x + cardWidth / 2 &&
                y >= shape.y - cardHeight / 2 && y <= shape.y + cardHeight / 2) {
                if (shape.isOdd) {
                    // Richtig!
                    this.score++;
                    this.playSuccessSound();
                    this.createSuccessParticles(shape);
                    this.animateSuccess(shape);
                    this.successAnimation = 1;
                    
                    // Nächstes Level
                    if (this.level < this.totalLevels) {
                        this.level++;
                        setTimeout(() => {
                            this.successAnimation = 0;
                            this.createLevel();
                        }, 1500);
                    } else {
                        // Alle Level geschafft!
                        setTimeout(() => {
                            this.stop();
                            if (this.onExit) this.onExit();
                        }, 2000);
                    }
                } else {
                    // Falsch!
                    this.playErrorSound();
                    this.animateShake(shape);
                }
                break;
            }
        }
    }
    
    animateSuccess(shape) {
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                shape.scale = 1 + progress * 0.8;
            } else {
                shape.scale = 1.4 - (progress - 0.5) * 0.8;
            }
            
            shape.rotation += 0.1;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                shape.scale = 1;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animateShake(shape) {
        const startTime = Date.now();
        const duration = 300;
        const originalX = shape.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            shape.x = originalX + Math.sin(progress * Math.PI * 6) * 10 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                shape.x = originalX;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    createSuccessParticles(shape) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: shape.x,
                y: shape.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 5
            });
        }
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
    
    playErrorSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    drawShape(shape) {
        this.ctx.save();
        
        this.ctx.translate(shape.x, shape.y);
        this.ctx.scale(shape.scale, shape.scale);
        
        // Pulsierender Effekt
        shape.pulse += 0.05;
        const pulseScale = 1 + Math.sin(shape.pulse) * 0.03;
        this.ctx.scale(pulseScale, pulseScale);
        
        // Karten-Container
        const cardWidth = 140;
        const cardHeight = 160;
        const cardRadius = 20;
        
        // Karten-Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        // Karten-Hintergrund (weiss)
        this.ctx.fillStyle = 'white';
        this.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cardRadius);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Innerer Rahmen (farbig)
        const borderGradient = this.ctx.createLinearGradient(
            -cardWidth / 2, -cardHeight / 2,
            -cardWidth / 2, cardHeight / 2
        );
        borderGradient.addColorStop(0, this.lightenColor(shape.color, 40));
        borderGradient.addColorStop(1, this.lightenColor(shape.color, 10));
        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 5;
        this.roundRect(-cardWidth / 2 + 8, -cardHeight / 2 + 8, cardWidth - 16, cardHeight - 16, cardRadius - 5);
        this.ctx.stroke();
        
        // Form in der Mitte zeichnen
        this.ctx.rotate(shape.rotation);
        
        // Form zeichnen mit Verlauf
        const gradient = this.ctx.createRadialGradient(-15, -15, 0, 0, 0, shape.size / 2);
        gradient.addColorStop(0, this.lightenColor(shape.color, 30));
        gradient.addColorStop(1, shape.color);
        this.ctx.fillStyle = gradient;
        
        this.ctx.shadowColor = shape.color;
        this.ctx.shadowBlur = 15;
        
        const size = shape.size / 2;
        
        switch(shape.type) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'square':
                this.ctx.fillRect(-size, -size, size * 2, size * 2);
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size, size);
                this.ctx.lineTo(-size, size);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'star':
                this.drawStar(0, 0, 5, size, size * 0.5);
                break;
                
            case 'heart':
                this.drawHeart(0, 0, size);
                break;
                
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size * 0.6, 0);
                this.ctx.lineTo(0, size);
                this.ctx.lineTo(-size * 0.6, 0);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        // Glanz-Effekt auf Form
        this.ctx.shadowBlur = 0;
        const glowGradient = this.ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glowGradient;
        
        // Glanz nur für die Form selbst
        switch(shape.type) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'square':
                this.ctx.fillRect(-size, -size, size * 2, size * 2);
                break;
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size, size);
                this.ctx.lineTo(-size, size);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'star':
                this.drawStar(0, 0, 5, size, size * 0.5);
                break;
            case 'heart':
                this.drawHeart(0, 0, size);
                break;
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size * 0.6, 0);
                this.ctx.lineTo(0, size);
                this.ctx.lineTo(-size * 0.6, 0);
                this.ctx.closePath();
                this.ctx.fill();
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
    }
    
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        
        // Left side
        this.ctx.bezierCurveTo(
            x, y,
            x - size / 2, y,
            x - size / 2, y + topCurveHeight
        );
        this.ctx.bezierCurveTo(
            x - size / 2, y + (size + topCurveHeight) / 2,
            x, y + (size + topCurveHeight) / 1.5,
            x, y + size
        );
        
        // Right side
        this.ctx.bezierCurveTo(
            x, y + (size + topCurveHeight) / 1.5,
            x + size / 2, y + (size + topCurveHeight) / 2,
            x + size / 2, y + topCurveHeight
        );
        this.ctx.bezierCurveTo(
            x + size / 2, y,
            x, y,
            x, y + topCurveHeight
        );
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund mit Verlauf (wärmer und freundlicher)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#ddd6fe');
        gradient.addColorStop(1, '#e9d5ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dekorative Sterne
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            this.ctx.fillStyle = `rgba(168, 85, 247, ${star.opacity * 0.25})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Titel
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔍 Welche Form ist anders? 🔍', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Level Badge
        this.ctx.save();
        const badgeX = this.canvas.width / 2;
        const badgeY = 70;
        
        const badgeGradient = this.ctx.createLinearGradient(badgeX - 60, badgeY - 15, badgeX + 60, badgeY + 15);
        badgeGradient.addColorStop(0, '#c084fc');
        badgeGradient.addColorStop(1, '#a855f7');
        this.ctx.fillStyle = badgeGradient;
        this.ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
        this.ctx.shadowBlur = 15;
        this.roundRect(badgeX - 60, badgeY - 15, 120, 30, 15);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`⭐ Level ${this.level}/${this.totalLevels}`, badgeX, badgeY + 5);
        this.ctx.restore();
        
        // Formen zeichnen
        for (let shape of this.shapes) {
            this.drawShape(shape);
        }
        
        // Partikel zeichnen
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
}


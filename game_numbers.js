// game_numbers.js - Zahlen entdecken Spiel

export class NumbersGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.circles = [];
        this.currentNumber = 1;
        this.maxNumber = 5;
        this.level = 1;
        this.totalLevels = 10;
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        this.successAnimation = 0;
        this.confetti = [];
        
        // Farben für die Zahlen-Kreise
        this.colors = [
            '#ef4444', // Rot
            '#3b82f6', // Blau
            '#10b981', // Grün
            '#fbbf24', // Gelb
            '#a855f7', // Lila
            '#ec4899', // Rosa
            '#f97316', // Orange
            '#14b8a6'  // Türkis
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
        this.particles = [];
        this.confetti = [];
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
    
    createLevel() {
        this.circles = [];
        this.currentNumber = 1;
        
        // Schwierigkeit steigt mit Level
        if (this.level <= 3) {
            this.maxNumber = 3;
        } else if (this.level <= 6) {
            this.maxNumber = 4;
        } else {
            this.maxNumber = 5;
        }
        
        // Zahlen-Kreise erstellen
        const positions = this.generateRandomPositions(this.maxNumber);
        
        for (let i = 0; i < this.maxNumber; i++) {
            this.circles.push({
                number: i + 1,
                x: positions[i].x,
                y: positions[i].y,
                radius: 60,
                color: this.colors[i % this.colors.length],
                completed: false,
                scale: 1,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    generateRandomPositions(count) {
        const positions = [];
        const margin = 100;
        const minDistance = 150;
        const maxAttempts = 100;
        
        for (let i = 0; i < count; i++) {
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            while (!validPosition && attempts < maxAttempts) {
                x = margin + Math.random() * (this.canvas.width - margin * 2);
                y = margin + 120 + Math.random() * (this.canvas.height - margin * 2 - 120);
                
                validPosition = true;
                
                // Prüfe Abstand zu anderen Kreisen
                for (let pos of positions) {
                    const dx = x - pos.x;
                    const dy = y - pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            positions.push({ x, y });
        }
        
        return positions;
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
        this.checkCircleClick(pos.x, pos.y);
    }
    
    handleTouch = (e) => {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.checkCircleClick(pos.x, pos.y);
    }
    
    checkCircleClick(x, y) {
        for (let circle of this.circles) {
            if (circle.completed) continue;
            
            const dx = x - circle.x;
            const dy = y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= circle.radius) {
                if (circle.number === this.currentNumber) {
                    // Richtig!
                    circle.completed = true;
                    this.animateSuccess(circle);
                    this.createSuccessParticles(circle);
                    this.playSuccessSound();
                    this.currentNumber++;
                    
                    // Alle Zahlen richtig?
                    if (this.currentNumber > this.maxNumber) {
                        this.successAnimation = 1;
                        this.createLevelCompleteConfetti();
                        
                        if (this.level < this.totalLevels) {
                            this.level++;
                            setTimeout(() => {
                                this.successAnimation = 0;
                                this.createLevel();
                            }, 2000);
                        } else {
                            // Alle Level geschafft!
                            setTimeout(() => {
                                this.stop();
                                if (this.onExit) this.onExit();
                            }, 2500);
                        }
                    }
                } else {
                    // Falsch!
                    this.animateShake(circle);
                    this.playErrorSound();
                }
                break;
            }
        }
    }
    
    animateSuccess(circle) {
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                circle.scale = 1 + progress * 0.6;
            } else {
                circle.scale = 1.3 - (progress - 0.5) * 0.6;
            }
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                circle.scale = 1;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animateShake(circle) {
        const startTime = Date.now();
        const duration = 300;
        const originalX = circle.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            circle.x = originalX + Math.sin(progress * Math.PI * 6) * 15 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                circle.x = originalX;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    createSuccessParticles(circle) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: circle.x,
                y: circle.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: circle.color,
                size: 3 + Math.random() * 4
            });
        }
    }
    
    createLevelCompleteConfetti() {
        for (let i = 0; i < 50; i++) {
            this.confetti.push({
                x: Math.random() * this.canvas.width,
                y: -20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: 8 + Math.random() * 8,
                life: 1
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
            
            oscillator.frequency.value = 523.25 + (this.currentNumber - 1) * 100;
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
    
    drawCircle(circle) {
        this.ctx.save();
        
        this.ctx.translate(circle.x, circle.y);
        this.ctx.scale(circle.scale, circle.scale);
        
        // Pulsierender Effekt (nur wenn nicht completed)
        if (!circle.completed) {
            circle.pulse += 0.05;
            const pulseScale = 1 + Math.sin(circle.pulse) * 0.05;
            this.ctx.scale(pulseScale, pulseScale);
        }
        
        // Schatten
        this.ctx.shadowColor = circle.completed ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 8;
        
        // Kreis-Hintergrund mit Verlauf
        const gradient = this.ctx.createRadialGradient(-20, -20, 0, 0, 0, circle.radius);
        if (circle.completed) {
            // Grau wenn completed
            gradient.addColorStop(0, '#d1d5db');
            gradient.addColorStop(1, '#9ca3af');
        } else {
            gradient.addColorStop(0, this.lightenColor(circle.color, 30));
            gradient.addColorStop(1, circle.color);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Weisser Ring
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, circle.radius - 5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Glanz-Effekt
        const glowGradient = this.ctx.createRadialGradient(
            -circle.radius * 0.3, -circle.radius * 0.3, 0,
            0, 0, circle.radius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fill();
        
        // Zahl in der Mitte
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = circle.completed ? '#6b7280' : 'white';
        this.ctx.font = 'bold 48px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText(circle.number, 0, 0);
        
        // Häkchen wenn completed
        if (circle.completed) {
            this.ctx.shadowBlur = 0;
            this.ctx.font = 'bold 40px sans-serif';
            this.ctx.fillStyle = '#10b981';
            this.ctx.fillText('✓', 0, -5);
        }
        
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
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund mit Verlauf
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(1, '#fed7aa');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dekorative Sterne
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            this.ctx.fillStyle = `rgba(245, 158, 11, ${star.opacity * 0.25})`;
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
        this.ctx.fillText('🔢 Tippe die Zahlen der Reihe nach! 🔢', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Level Badge und nächste Zahl
        this.ctx.save();
        const badgeX = this.canvas.width / 2 - 80;
        const badgeY = 70;
        
        // Level Badge
        const badgeGradient = this.ctx.createLinearGradient(badgeX - 60, badgeY - 15, badgeX + 60, badgeY + 15);
        badgeGradient.addColorStop(0, '#fbbf24');
        badgeGradient.addColorStop(1, '#f59e0b');
        this.ctx.fillStyle = badgeGradient;
        this.ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
        this.ctx.shadowBlur = 15;
        this.roundRect(badgeX - 60, badgeY - 15, 120, 30, 15);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`⭐ Level ${this.level}/${this.totalLevels}`, badgeX, badgeY + 5);
        
        // Nächste Zahl Anzeige
        if (this.currentNumber <= this.maxNumber) {
            const nextX = this.canvas.width / 2 + 80;
            const nextGradient = this.ctx.createLinearGradient(nextX - 60, badgeY - 15, nextX + 60, badgeY + 15);
            nextGradient.addColorStop(0, '#34d399');
            nextGradient.addColorStop(1, '#10b981');
            this.ctx.fillStyle = nextGradient;
            this.ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
            this.ctx.shadowBlur = 15;
            this.roundRect(nextX - 60, badgeY - 15, 120, 30, 15);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`Nächste: ${this.currentNumber}`, nextX, badgeY + 5);
        }
        
        this.ctx.restore();
        
        // Kreise zeichnen
        for (let circle of this.circles) {
            this.drawCircle(circle);
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
        
        // Konfetti zeichnen
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.3; // Gravity
            c.rotation += c.rotationSpeed;
            c.life -= 0.01;
            
            if (c.life > 0 && c.y < this.canvas.height + 20) {
                this.ctx.save();
                this.ctx.translate(c.x, c.y);
                this.ctx.rotate(c.rotation);
                this.ctx.fillStyle = c.color;
                this.ctx.globalAlpha = c.life;
                this.ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
                this.ctx.globalAlpha = 1;
                this.ctx.restore();
            } else {
                this.confetti.splice(i, 1);
            }
        }
        
        // Erfolgsanimation
        if (this.successAnimation > 0) {
            this.successAnimation -= 0.015;
            const scale = 1 + (1 - this.successAnimation) * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = this.successAnimation;
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(scale, scale);
            this.ctx.font = 'bold 60px sans-serif';
            this.ctx.fillStyle = '#10b981';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🎉 Super! 🎉', 0, 0);
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


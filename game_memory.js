// game_memory.js - Memory-Farben Spiel

export class MemoryGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 6;
        this.canFlip = true;
        this.moves = 0;
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        
        // Farben für die Karten
        this.colors = [
            { name: 'Rot', color: '#ef4444', light: '#fca5a5' },
            { name: 'Blau', color: '#3b82f6', light: '#93c5fd' },
            { name: 'Grün', color: '#10b981', light: '#6ee7b7' },
            { name: 'Gelb', color: '#fbbf24', light: '#fde68a' },
            { name: 'Lila', color: '#a855f7', light: '#d8b4fe' },
            { name: 'Rosa', color: '#ec4899', light: '#f9a8d4' }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.matchedPairs = 0;
        this.moves = 0;
        this.flippedCards = [];
        this.canFlip = true;
        this.particles = [];
        
        // Dekorative Sterne generieren
        this.generateStars();
        
        // Karten erstellen
        this.createCards();
        
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
        for (let i = 0; i < 20; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                opacity: Math.random(),
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    createCards() {
        this.cards = [];
        
        // Paare erstellen
        const pairs = [];
        for (let i = 0; i < this.totalPairs; i++) {
            const colorData = this.colors[i];
            pairs.push({ ...colorData, id: i });
            pairs.push({ ...colorData, id: i });
        }
        
        // Mischen
        pairs.sort(() => Math.random() - 0.5);
        
        // Karten positionieren
        const cols = 4;
        const rows = 3;
        const cardWidth = 100;
        const cardHeight = 130;
        const spacing = 20;
        
        const totalWidth = cols * cardWidth + (cols - 1) * spacing;
        const totalHeight = rows * cardHeight + (rows - 1) * spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = (this.canvas.height - totalHeight) / 2 + 30;
        
        for (let i = 0; i < pairs.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            this.cards.push({
                x: startX + col * (cardWidth + spacing),
                y: startY + row * (cardHeight + spacing),
                width: cardWidth,
                height: cardHeight,
                color: pairs[i].color,
                lightColor: pairs[i].light,
                name: pairs[i].name,
                id: pairs[i].id,
                isFlipped: false,
                isMatched: false,
                flipProgress: 0,
                matchAnimation: 0,
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
    
    handleClick = (e) => {
        const pos = this.getMousePos(e);
        this.checkCardClick(pos.x, pos.y);
    }
    
    handleTouch = (e) => {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.checkCardClick(pos.x, pos.y);
    }
    
    checkCardClick(x, y) {
        if (!this.canFlip) return;
        if (this.flippedCards.length >= 2) return;
        
        for (let card of this.cards) {
            if (card.isMatched || card.isFlipped) continue;
            
            if (x >= card.x && x <= card.x + card.width &&
                y >= card.y && y <= card.y + card.height) {
                
                this.flipCard(card);
                this.playFlipSound();
                break;
            }
        }
    }
    
    flipCard(card) {
        card.isFlipped = true;
        this.flippedCards.push(card);
        this.animateFlip(card, true);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.canFlip = false;
            
            setTimeout(() => {
                this.checkMatch();
            }, 800);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.id === card2.id) {
            // Match gefunden!
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            this.animateMatch(card1);
            this.animateMatch(card2);
            this.createMatchParticles(card1);
            this.createMatchParticles(card2);
            this.playSuccessSound();
            
            this.flippedCards = [];
            this.canFlip = true;
            
            // Alle Paare gefunden?
            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => {
                    this.stop();
                    if (this.onExit) this.onExit();
                }, 1500);
            }
        } else {
            // Kein Match - zurückdrehen
            this.playErrorSound();
            
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                this.animateFlip(card1, false);
                this.animateFlip(card2, false);
                
                this.flippedCards = [];
                this.canFlip = true;
            }, 500);
        }
    }
    
    animateFlip(card, toFlipped) {
        const startTime = Date.now();
        const duration = 300;
        const startProgress = card.flipProgress;
        const targetProgress = toFlipped ? 1 : 0;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            card.flipProgress = startProgress + (targetProgress - startProgress) * progress;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animateMatch(card) {
        card.matchAnimation = 1;
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                card.scale = 1 + progress * 0.4;
            } else {
                card.scale = 1.2 - (progress - 0.5) * 0.4;
            }
            
            card.matchAnimation = 1 - progress;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                card.scale = 1;
                card.matchAnimation = 0;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    createMatchParticles(card) {
        const centerX = card.x + card.width / 2;
        const centerY = card.y + card.height / 2;
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: card.color,
                size: 3 + Math.random() * 4
            });
        }
    }
    
    playFlipSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio nicht unterstützt
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
    
    drawCard(card) {
        this.ctx.save();
        
        const centerX = card.x + card.width / 2;
        const centerY = card.y + card.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(card.scale, card.scale);
        
        // 3D Flip-Effekt
        const scaleX = Math.abs(Math.cos(card.flipProgress * Math.PI));
        const isBackVisible = card.flipProgress < 0.5;
        
        this.ctx.scale(scaleX, 1);
        this.ctx.translate(-card.width / 2, -card.height / 2);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        if (isBackVisible) {
            // Rückseite (verdeckt)
            const backGradient = this.ctx.createLinearGradient(0, 0, 0, card.height);
            backGradient.addColorStop(0, '#6366f1');
            backGradient.addColorStop(1, '#4f46e5');
            
            this.ctx.fillStyle = backGradient;
            this.roundRect(0, 0, card.width, card.height, 15);
            this.ctx.fill();
            
            // Muster auf Rückseite
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 3;
            
            // Diagonale Linien
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * 25, 0);
                this.ctx.lineTo(i * 25 + 50, card.height);
                this.ctx.stroke();
            }
            
            // Fragezeichen
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.font = 'bold 40px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('?', card.width / 2, card.height / 2);
            
        } else {
            // Vorderseite (Farbe)
            const frontGradient = this.ctx.createLinearGradient(0, 0, 0, card.height);
            frontGradient.addColorStop(0, card.lightColor);
            frontGradient.addColorStop(1, card.color);
            
            this.ctx.fillStyle = frontGradient;
            this.roundRect(0, 0, card.width, card.height, 15);
            this.ctx.fill();
            
            // Weisser Rand innen
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 4;
            this.roundRect(5, 5, card.width - 10, card.height - 10, 12);
            this.ctx.stroke();
            
            // Farbiger Kreis in der Mitte
            const circleGradient = this.ctx.createRadialGradient(
                card.width / 2 - 10,
                card.height / 2 - 10,
                0,
                card.width / 2,
                card.height / 2,
                30
            );
            circleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            circleGradient.addColorStop(0.5, card.color);
            circleGradient.addColorStop(1, this.darkenColor(card.color, 20));
            
            this.ctx.fillStyle = circleGradient;
            this.ctx.beginPath();
            this.ctx.arc(card.width / 2, card.height / 2, 30, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Glanz-Effekt
            const glowGradient = this.ctx.createRadialGradient(
                card.width / 2 - 10,
                card.height / 2 - 10,
                0,
                card.width / 2,
                card.height / 2,
                25
            );
            glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();
        }
        
        // Match-Glow-Effekt
        if (card.matchAnimation > 0) {
            this.ctx.shadowColor = card.color;
            this.ctx.shadowBlur = 30 * card.matchAnimation;
            this.ctx.strokeStyle = card.color;
            this.ctx.lineWidth = 5;
            this.roundRect(0, 0, card.width, card.height, 15);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
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
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund mit Verlauf
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(1, '#fde68a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dekorative Sterne
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            this.ctx.fillStyle = `rgba(251, 146, 60, ${star.opacity * 0.3})`;
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
        this.ctx.fillText('🎴 Finde alle Paare! 🎴', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Info-Bereich
        this.ctx.save();
        const infoY = 70;
        
        // Züge
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillStyle = '#f97316';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Züge: ${this.moves}`, this.canvas.width / 2 - 80, infoY);
        
        // Paare gefunden
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(`Paare: ${this.matchedPairs}/${this.totalPairs}`, this.canvas.width / 2 + 80, infoY);
        this.ctx.restore();
        
        // Karten zeichnen
        for (let card of this.cards) {
            this.drawCard(card);
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
        
        requestAnimationFrame(this.render);
    }
}


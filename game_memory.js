// game_memory.js - 🌌 COSMIC Memory-Spiel
import { audioManager } from './audio_utils.js';

export class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        this.isChecking = false;
        this.level = 1;
        this.maxLevel = 5;
        this.moves = 0;
        this.particles = [];
        this.stars = [];
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
        this.moves = 0;
        this.particles = [];
        this.time = 0;
        
        this.generateStars();
        this.initLevel();
        
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
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
    
    initLevel() {
        const emojis = ['🌟', '🚀', '🎈', '🎮', '🌈', '🍕', '🐱', '🦄', '🎪', '💎', '🌙', '⚡'];
        const pairs = 3 + this.level;
        const selectedEmojis = emojis.slice(0, pairs);
        
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isChecking = false;
        
        const cardEmojis = [...selectedEmojis, ...selectedEmojis].sort(() => Math.random() - 0.5);
        
        const cols = pairs <= 4 ? 4 : (pairs <= 6 ? 4 : 6);
        const rows = Math.ceil(cardEmojis.length / cols);
        const cardWidth = Math.min(75, (this.canvas.width - 60) / cols);
        const cardHeight = cardWidth * 1.2;
        const spacingX = (this.canvas.width - cols * cardWidth) / (cols + 1);
        const spacingY = 15;
        const startY = 130;
        
        for (let i = 0; i < cardEmojis.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            this.cards.push({
                x: spacingX + col * (cardWidth + spacingX),
                y: startY + row * (cardHeight + spacingY),
                width: cardWidth,
                height: cardHeight,
                emoji: cardEmojis[i],
                flipped: false,
                matched: false,
                flipProgress: 0,
                glow: Math.random() * Math.PI * 2,
                matchGlow: 0
            });
        }
    }
    
    handleClick = (e) => {
        if (this.isChecking) return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        for (let card of this.cards) {
            if (x >= card.x && x <= card.x + card.width &&
                y >= card.y && y <= card.y + card.height &&
                !card.flipped && !card.matched) {
                this.flipCard(card);
                break;
            }
        }
    }
    
    flipCard(card) {
        card.flipped = true;
        this.animateFlip(card, true);
        this.flippedCards.push(card);
        audioManager.playClickSound();
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.isChecking = true;
            
            setTimeout(() => {
                this.checkMatch();
            }, 800);
        }
    }
    
    animateFlip(card, toFront) {
        const startTime = Date.now();
        const duration = 300;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            card.flipProgress = toFront ? progress : 1 - progress;
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.emoji === card2.emoji) {
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;
            this.createMatchParticles(card1);
            this.createMatchParticles(card2);
            audioManager.playSuccessSound();
            
            if (this.matchedPairs >= this.cards.length / 2) {
                this.levelComplete();
            }
        } else {
            this.animateFlip(card1, false);
            this.animateFlip(card2, false);
            setTimeout(() => {
                card1.flipped = false;
                card2.flipped = false;
            }, 300);
            audioManager.playErrorSound();
        }
        
        this.flippedCards = [];
        this.isChecking = false;
    }
    
    levelComplete() {
        setTimeout(() => {
            if (this.level >= this.maxLevel) {
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                this.level++;
                this.initLevel();
                audioManager.playLevelUpSound();
            }
        }, 1500);
    }
    
    createMatchParticles(card) {
        const centerX = card.x + card.width / 2;
        const centerY = card.y + card.height / 2;
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: centerX, y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff00ff', '#00ffff', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 4 + Math.random() * 5
            });
        }
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        this.time += 0.016;
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#050520');
        gradient.addColorStop(0.5, '#100540');
        gradient.addColorStop(1, '#050520');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne
        for (let star of this.stars) {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Nebel
        this.ctx.save();
        this.ctx.globalAlpha = 0.06;
        const nebulaGrad = this.ctx.createRadialGradient(
            this.canvas.width * 0.3, this.canvas.height * 0.4, 0,
            this.canvas.width * 0.3, this.canvas.height * 0.4, 250
        );
        nebulaGrad.addColorStop(0, '#ff00ff');
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const nebulaGrad2 = this.ctx.createRadialGradient(
            this.canvas.width * 0.7, this.canvas.height * 0.6, 0,
            this.canvas.width * 0.7, this.canvas.height * 0.6, 200
        );
        nebulaGrad2.addColorStop(0, '#00ffff');
        nebulaGrad2.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad2;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // UI
        this.ctx.save();
        
        // Titel
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🧠 Memory Match! 🧠', this.canvas.width / 2, 35);
        
        // Level
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, this.canvas.width / 2, 65);
        
        // Paare & Züge
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`✨ ${this.matchedPairs}/${this.cards.length / 2} Paare | ${this.moves} Züge`, this.canvas.width / 2, 95);
        
        this.ctx.restore();
        
        // Karten
        for (let card of this.cards) {
            this.drawCard(card);
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.025;
            
            if (p.life > 0) {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 12;
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
    }
    
    drawCard(card) {
        this.ctx.save();
        
        const centerX = card.x + card.width / 2;
        const centerY = card.y + card.height / 2;
        
        card.glow += 0.03;
        const glowIntensity = card.matched ? 25 : (10 + Math.sin(card.glow) * 5);
        const glowColor = card.matched ? '#00ff88' : '#ff00ff';
        
        // 3D Flip Transformation
        this.ctx.translate(centerX, centerY);
        const scaleX = Math.abs(Math.cos(card.flipProgress * Math.PI));
        this.ctx.scale(scaleX || 0.01, 1);
        this.ctx.translate(-card.width / 2, -card.height / 2);
        
        // Schatten
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = glowIntensity;
        
        // Karte
        const isShowingFront = card.flipProgress > 0.5;
        
        if (isShowingFront && (card.flipped || card.matched)) {
            // Vorderseite
            const frontGrad = this.ctx.createLinearGradient(0, 0, card.width, card.height);
            frontGrad.addColorStop(0, '#2a1050');
            frontGrad.addColorStop(1, '#1a0030');
            this.ctx.fillStyle = frontGrad;
        } else {
            // Rückseite
            const backGrad = this.ctx.createLinearGradient(0, 0, card.width, card.height);
            backGrad.addColorStop(0, '#ff00ff');
            backGrad.addColorStop(1, '#8800aa');
            this.ctx.fillStyle = backGrad;
        }
        
        this.ctx.beginPath();
        this.ctx.roundRect(0, 0, card.width, card.height, 12);
        this.ctx.fill();
        
        // Rahmen
        this.ctx.strokeStyle = isShowingFront ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        if (isShowingFront && (card.flipped || card.matched)) {
            // Emoji
            this.ctx.font = `${card.width * 0.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(card.emoji, card.width / 2, card.height / 2);
        } else {
            // Fragezeichen auf Rückseite
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = `bold ${card.width * 0.5}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('?', card.width / 2, card.height / 2);
        }
        
        // Highlight oben
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.roundRect(3, 3, card.width - 6, card.height * 0.3, [10, 10, 0, 0]);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}

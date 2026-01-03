// game_bubbles.js - 🫧 COSMIC BUBBLES - Bunte Blasen platzen!
import { audioManager } from './audio_utils.js';

export class BubblesGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.bubbles = [];
        this.particles = [];
        this.stars = [];
        
        this.score = 0;
        this.combo = 0;
        this.level = 1;
        this.maxLevel = 10;
        this.bubblesPopped = 0;
        this.bubblesNeeded = 15;
        this.time = 0;
        
        this.colors = [
            { hex: '#ff0055', glow: '#ff0055', name: 'rot' },
            { hex: '#00ffff', glow: '#00ffff', name: 'cyan' },
            { hex: '#00ff88', glow: '#00ff88', name: 'grün' },
            { hex: '#ffff00', glow: '#ffff00', name: 'gelb' },
            { hex: '#ff00ff', glow: '#ff00ff', name: 'pink' },
            { hex: '#ff8800', glow: '#ff8800', name: 'orange' }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.combo = 0;
        this.level = 1;
        this.bubblesPopped = 0;
        this.bubblesNeeded = 15;
        this.particles = [];
        this.time = 0;
        
        this.generateStars();
        this.generateBubbles();
        
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
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    generateBubbles() {
        this.bubbles = [];
        const numColors = Math.min(3 + Math.floor(this.level / 2), 6);
        const numBubbles = 20 + this.level * 3;
        
        const cols = 6;
        const bubbleSize = (this.canvas.width - 40) / cols;
        const rows = Math.ceil(numBubbles / cols);
        const startY = 120;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.bubbles.length >= numBubbles) break;
                
                const color = this.colors[Math.floor(Math.random() * numColors)];
                const offsetX = (row % 2) * (bubbleSize / 2);
                
                this.bubbles.push({
                    x: 20 + col * bubbleSize + bubbleSize / 2 + offsetX,
                    y: startY + row * (bubbleSize * 0.85),
                    size: bubbleSize * 0.45,
                    color: color,
                    popping: false,
                    popProgress: 0,
                    glow: Math.random() * Math.PI * 2,
                    wobble: Math.random() * Math.PI * 2
                });
            }
        }
    }
    
    handleClick = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        // Finde geklickte Blase
        for (let bubble of this.bubbles) {
            if (bubble.popping) continue;
            
            const dx = x - bubble.x;
            const dy = y - bubble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < bubble.size) {
                this.popBubbleChain(bubble);
                break;
            }
        }
    }
    
    popBubbleChain(startBubble) {
        // Finde alle verbundenen Blasen der gleichen Farbe
        const toCheck = [startBubble];
        const chain = [];
        const checked = new Set();
        
        while (toCheck.length > 0) {
            const bubble = toCheck.pop();
            if (checked.has(bubble)) continue;
            checked.add(bubble);
            
            if (bubble.color.hex === startBubble.color.hex && !bubble.popping) {
                chain.push(bubble);
                
                // Finde Nachbarn
                for (let other of this.bubbles) {
                    if (checked.has(other) || other.popping) continue;
                    
                    const dx = other.x - bubble.x;
                    const dy = other.y - bubble.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < bubble.size * 2.5 && other.color.hex === startBubble.color.hex) {
                        toCheck.push(other);
                    }
                }
            }
        }
        
        // Mindestens 2 Blasen für Combo
        if (chain.length >= 2) {
            this.combo = chain.length;
            const points = chain.length * 10 * (1 + Math.floor(chain.length / 3));
            this.score += points;
            
            // Alle Blasen in der Kette platzen lassen
            for (let i = 0; i < chain.length; i++) {
                setTimeout(() => {
                    if (chain[i] && !chain[i].popping) {
                        chain[i].popping = true;
                        this.createPopParticles(chain[i].x, chain[i].y, chain[i].color.hex);
                        this.bubblesPopped++;
                        
                        if (i === 0) audioManager.playPopSound();
                    }
                }, i * 50);
            }
            
            // Level check
            setTimeout(() => {
                this.checkLevel();
            }, chain.length * 50 + 300);
        } else {
            // Nur eine Blase - kleine Animation
            this.animateShake(startBubble);
            audioManager.playErrorSound();
        }
    }
    
    animateShake(bubble) {
        const startX = bubble.x;
        const startTime = Date.now();
        const duration = 300;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            bubble.x = startX + Math.sin(progress * Math.PI * 4) * 8 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                bubble.x = startX;
            }
        };
        animate();
    }
    
    checkLevel() {
        // Entferne geplatzte Blasen
        this.bubbles = this.bubbles.filter(b => !b.popping);
        
        // Blasen nach unten fallen lassen
        this.dropBubbles();
        
        // Level geschafft?
        if (this.bubblesPopped >= this.bubblesNeeded || this.bubbles.length < 5) {
            if (this.level >= this.maxLevel) {
                setTimeout(() => {
                    this.stop();
                    if (this.onExit) this.onExit();
                }, 1000);
            } else {
                this.level++;
                this.bubblesPopped = 0;
                this.bubblesNeeded = 15 + this.level * 2;
                this.generateBubbles();
                audioManager.playLevelUpSound();
            }
        }
    }
    
    dropBubbles() {
        // Sortiere Blasen nach Y-Position (unten zuerst)
        this.bubbles.sort((a, b) => b.y - a.y);
        
        // Lass Blasen fallen
        for (let bubble of this.bubbles) {
            let canDrop = true;
            let dropDistance = 0;
            
            while (canDrop && dropDistance < 200) {
                dropDistance += bubble.size * 0.85;
                const newY = bubble.y + dropDistance;
                
                // Prüfe Kollision mit anderen Blasen
                for (let other of this.bubbles) {
                    if (other === bubble) continue;
                    const dx = other.x - bubble.x;
                    const dy = other.y - newY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < bubble.size * 1.8) {
                        canDrop = false;
                        break;
                    }
                }
                
                // Bodenbegrenzung
                if (newY > this.canvas.height - 100) {
                    canDrop = false;
                }
            }
            
            if (dropDistance > 0) {
                bubble.y += dropDistance - bubble.size * 0.85;
            }
        }
    }
    
    createPopParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color,
                size: 5 + Math.random() * 5
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
        gradient.addColorStop(0, '#0a0025');
        gradient.addColorStop(0.5, '#150045');
        gradient.addColorStop(1, '#0a0025');
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
        
        // UI
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🫧 BUBBLE POP! 🫧', this.canvas.width / 2, 40);
        
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, 70);
        
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⭐ ${this.score}`, 20, 40);
        
        if (this.combo > 2) {
            this.ctx.shadowColor = '#00ff88';
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 18px sans-serif';
            this.ctx.fillText(`${this.combo}x Combo!`, 20, 65);
        }
        
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`${this.bubblesPopped}/${this.bubblesNeeded}`, this.canvas.width - 20, 40);
        this.ctx.restore();
        
        // Blasen
        for (let bubble of this.bubbles) {
            if (bubble.popping) continue;
            
            bubble.glow += 0.04;
            bubble.wobble += 0.02;
            const glowIntensity = 12 + Math.sin(bubble.glow) * 6;
            const wobbleX = Math.sin(bubble.wobble) * 2;
            const wobbleY = Math.cos(bubble.wobble * 1.3) * 1.5;
            
            this.ctx.save();
            this.ctx.translate(bubble.x + wobbleX, bubble.y + wobbleY);
            
            // Glow
            this.ctx.shadowColor = bubble.color.glow;
            this.ctx.shadowBlur = glowIntensity;
            
            // Blase
            const grad = this.ctx.createRadialGradient(
                -bubble.size * 0.3, -bubble.size * 0.3, 0,
                0, 0, bubble.size
            );
            grad.addColorStop(0, this.lightenColor(bubble.color.hex, 0.5));
            grad.addColorStop(0.5, bubble.color.hex);
            grad.addColorStop(1, this.darkenColor(bubble.color.hex, 0.3));
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, bubble.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.ellipse(-bubble.size * 0.3, -bubble.size * 0.3, bubble.size * 0.35, bubble.size * 0.2, -0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.03;
            
            if (p.life > 0) {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 8;
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
        
        // Anleitung
        this.ctx.save();
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Tippe auf 2+ gleiche Farben nebeneinander!', this.canvas.width / 2, this.canvas.height - 20);
        this.ctx.restore();
    }
    
    lightenColor(hex, factor) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, ((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * factor);
        const g = Math.min(255, ((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * factor);
        const b = Math.min(255, (num & 255) + (255 - (num & 255)) * factor);
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    
    darkenColor(hex, factor) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.floor(((num >> 16) & 255) * (1 - factor));
        const g = Math.floor(((num >> 8) & 255) * (1 - factor));
        const b = Math.floor((num & 255) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}


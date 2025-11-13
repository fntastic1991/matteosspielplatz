// game_colors.js - Farben antippen Spiel
// Grafiken von https://www.svgrepo.com (CC0 lizenziert)
import { audioManager } from './audio_utils.js';

import { loadImageWithFallback } from './main.js';

export class ColorGame {
    constructor() {
        this.circles = [];
        this.targetColor = null;
        this.score = 0;
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Farben für das Spiel
        this.colors = [
            { name: 'rot', color: '#ef4444' },
            { name: 'blau', color: '#3b82f6' },
            { name: 'grün', color: '#10b981' },
            { name: 'gelb', color: '#fbbf24' },
            { name: 'rosa', color: '#ec4899' }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        
        // Zielfarbe auswählen
        this.targetColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Kreise generieren
        this.generateCircles();
        
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
    
    generateCircles() {
        this.circles = [];
        const numCircles = 8;
        const numTarget = 3; // Anzahl der richtigen Kreise
        
        // Zielkreise hinzufügen
        for (let i = 0; i < numTarget; i++) {
            this.circles.push({
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                radius: 40 + Math.random() * 20,
                color: this.targetColor.color,
                colorName: this.targetColor.name,
                isTarget: true,
                collected: false,
                scale: 1
            });
        }
        
        // Andere Kreise hinzufügen
        for (let i = numTarget; i < numCircles; i++) {
            let randomColor;
            do {
                randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            } while (randomColor.name === this.targetColor.name);
            
            this.circles.push({
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                radius: 40 + Math.random() * 20,
                color: randomColor.color,
                colorName: randomColor.name,
                isTarget: false,
                collected: false,
                scale: 1
            });
        }
        
        // Kreise mischen
        this.circles.sort(() => Math.random() - 0.5);
    }
    
    handleClick = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.checkClick(x, y);
    }
    
    handleTouch = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.checkClick(x, y);
    }
    
    checkClick(x, y) {
        for (let circle of this.circles) {
            if (circle.collected) continue;
            
            const dx = x - circle.x;
            const dy = y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= circle.radius) {
                if (circle.isTarget) {
                    // Richtiger Treffer!
                    circle.collected = true;
                    this.score++;
                    this.animatePulse(circle);
                    this.playCorrectSound();
                    
                    // Prüfen ob alle gefunden
                    const remaining = this.circles.filter(c => c.isTarget && !c.collected).length;
                    if (remaining === 0) {
                        setTimeout(() => {
                            this.stop();
                            if (this.onExit) this.onExit();
                        }, 500);
                    }
                } else {
                    // Falscher Treffer
                    this.animateShake(circle);
                    this.playWrongSound();
                }
                break;
            }
        }
    }
    
    animatePulse(circle) {
        let startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                circle.scale = 1 + progress * 0.4;
            } else {
                circle.scale = 1.2 - (progress - 0.5) * 2.4;
            }
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    animateShake(circle) {
        let startTime = Date.now();
        const duration = 300;
        const originalX = circle.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            circle.x = originalX + Math.sin(progress * Math.PI * 4) * 10 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                circle.x = originalX;
            }
        };
        
        animate();
    }
    
    playCorrectSound() {
        // Einfacher Ton für richtigen Treffer (Web Audio API)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    playWrongSound() {
        // Einfacher Ton für falschen Treffer
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200; // Tiefer Ton
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Anweisung - größer und kindlicher
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `🎨 Finde alle ${this.targetColor.name}en Kreise! 🎨`, 
            this.canvas.width / 2, 
            40
        );
        
        // Zähler anzeigen
        const remaining = this.circles.filter(c => c.isTarget && !c.collected).length;
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(
            `Noch ${remaining} ${remaining === 1 ? 'Kreis' : 'Kreise'}!`,
            this.canvas.width / 2,
            75
        );
        
        // Kreise zeichnen
        for (let circle of this.circles) {
            if (circle.collected) continue;
            
            this.ctx.save();
            this.ctx.translate(circle.x, circle.y);
            this.ctx.scale(circle.scale, circle.scale);
            
            // Schatten
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 5;
            
            // Kreis
            this.ctx.fillStyle = circle.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            const gradient = this.ctx.createRadialGradient(
                -circle.radius * 0.3, 
                -circle.radius * 0.3, 
                0, 
                0, 
                0, 
                circle.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        requestAnimationFrame(this.render);
    }
}


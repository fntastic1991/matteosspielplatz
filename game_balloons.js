// game_balloons.js - Ballon platzen Spiel
// Grafiken von https://www.svgrepo.com (CC0 lizenziert)
import { audioManager } from './audio_utils.js';

import { loadImageWithFallback } from './main.js';

export class BalloonGame {
    constructor() {
        this.balloons = [];
        this.score = 0;
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        this.startTime = null;
        this.duration = 30000; // 30 Sekunden
        this.balloonImages = {};
        this.clouds = [];
        
        // Balloon Farben
        this.balloonColors = ['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#ec4899', '#8b5cf6'];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.startTime = Date.now();
        this.balloons = [];
        
        // Wolken generieren
        this.generateClouds();
        
        // Touch/Click Event
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleTouch);
        
        // Balloon Spawner
        this.spawnInterval = setInterval(() => {
            if (this.isRunning) {
                this.spawnBalloon();
            }
        }, 1000);
        
        // Render-Loop
        this.render();
    }
    
    stop() {
        this.isRunning = false;
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
    
    generateClouds() {
        this.clouds = [];
        const numClouds = 5;
        
        for (let i = 0; i < numClouds; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.4,
                size: 40 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }
    
    spawnBalloon() {
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const color = this.balloonColors[Math.floor(Math.random() * this.balloonColors.length)];
        
        this.balloons.push({
            x: x,
            y: this.canvas.height + 50,
            width: 50,
            height: 70,
            color: color,
            speed: 1 + Math.random() * 1.5,
            rotation: Math.random() * 0.2 - 0.1,
            popped: false,
            popScale: 1
        });
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
        // Von hinten nach vorne durchgehen (neueste Ballons zuerst)
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            if (balloon.popped) continue;
            
            // Grosszügige Rechteck-Kollision
            // Der Ballon reicht von (x-width/2, y-height) bis (x+width/2, y+30)
            const padding = 10; // Extra Klickbereich
            const left = balloon.x - balloon.width / 2 - padding;
            const right = balloon.x + balloon.width / 2 + padding;
            const top = balloon.y - balloon.height - padding;
            const bottom = balloon.y + 30 + padding; // Inklusive Schnur
            
            if (x >= left && x <= right && y >= top && y <= bottom) {
                balloon.popped = true;
                this.score++;
                this.animatePop(balloon);
                this.playPopSound();
                
                // Score-Anzeige aktualisieren
                document.getElementById('score').textContent = this.score;
                return; // Nur einen Ballon pro Klick
            }
        }
    }
    
    animatePop(balloon) {
        let startTime = Date.now();
        const duration = 300;
        balloon.opacity = 1; // Initialisieren
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            balloon.popScale = 1 + progress * 0.5;
            balloon.opacity = 1 - progress;
            
            if (progress < 1) {
                // Animation fortsetzen
                requestAnimationFrame(animate);
            } else {
                // Ballon aus Array entfernen
                const index = this.balloons.indexOf(balloon);
                if (index > -1) {
                    this.balloons.splice(index, 1);
                }
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    playPopSound() {
        audioManager.playPopSound();
    }
    
    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Drei Kreise für Wolke
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBalloon(balloon) {
        this.ctx.save();
        
        if (balloon.popped) {
            this.ctx.globalAlpha = balloon.opacity || 1;
        }
        
        this.ctx.translate(balloon.x, balloon.y);
        this.ctx.rotate(balloon.rotation);
        
        if (balloon.popped) {
            this.ctx.scale(balloon.popScale, balloon.popScale);
        }
        
        // Schnur
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, 30);
        this.ctx.stroke();
        
        // Ballon (Ellipse)
        this.ctx.fillStyle = balloon.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -balloon.height / 2, balloon.width / 2, balloon.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Highlight
        const gradient = this.ctx.createRadialGradient(
            -balloon.width * 0.2,
            -balloon.height * 0.6,
            0,
            0,
            -balloon.height / 2,
            balloon.height / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Knoten
        this.ctx.fillStyle = '#475569';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, Math.ceil((this.duration - elapsed) / 1000));
        
        // Zeit abgelaufen?
        if (elapsed >= this.duration) {
            this.stop();
            if (this.onExit) this.onExit();
            return;
        }
        
        // Himmel-Hintergrund
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#BFDBFE');
        gradient.addColorStop(1, '#E0F2FE');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Wolken zeichnen und bewegen
        for (let cloud of this.clouds) {
            cloud.x += cloud.speed;
            if (cloud.x > this.canvas.width + cloud.size) {
                cloud.x = -cloud.size;
            }
            this.drawCloud(cloud.x, cloud.y, cloud.size);
        }
        
        // Zeit-Anzeige
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🎈 Platze die Ballons! 🎈`, this.canvas.width / 2, 35);
        
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText(`⏰ Noch ${remaining} Sekunden!`, this.canvas.width / 2, 70);
        
        // Balloons bewegen und zeichnen
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            
            if (!balloon.popped) {
                balloon.y -= balloon.speed;
                balloon.rotation += 0.02;
                
                // Ballon aus Bildschirm entfernt?
                if (balloon.y < -100) {
                    this.balloons.splice(i, 1);
                    continue;
                }
            }
            
            this.drawBalloon(balloon);
        }
        
        requestAnimationFrame(this.render);
    }
}


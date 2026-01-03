// game_spacerace.js - 🏁 SPACE RACE - Weltraum-Rennen!
import { audioManager } from './audio_utils.js';

export class SpaceRaceGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.rocket = {
            x: 0, y: 0,
            lane: 1, // 0, 1, 2 (links, mitte, rechts)
            targetLane: 1,
            tilt: 0,
            flame: 0,
            invincible: false
        };
        
        this.lanes = [];
        this.obstacles = [];
        this.powerups = [];
        this.stars = [];
        this.particles = [];
        this.warpLines = [];
        
        this.score = 0;
        this.highScore = 0;
        this.speed = 3;
        this.distance = 0;
        this.gameOver = false;
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.score = 0;
        this.speed = 3;
        this.distance = 0;
        this.gameOver = false;
        this.particles = [];
        this.obstacles = [];
        this.powerups = [];
        this.time = 0;
        
        // Bahnen berechnen
        const laneWidth = this.canvas.width / 3;
        this.lanes = [
            laneWidth / 2,
            laneWidth * 1.5,
            laneWidth * 2.5
        ];
        
        this.rocket = {
            x: this.lanes[1],
            y: this.canvas.height - 120,
            lane: 1,
            targetLane: 1,
            tilt: 0,
            flame: 0,
            invincible: false,
            size: 50
        };
        
        this.generateBackground();
        
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        document.addEventListener('keydown', this.handleKey);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
        document.removeEventListener('keydown', this.handleKey);
    }
    
    generateBackground() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: 1 + Math.random() * 3
            });
        }
        
        this.warpLines = [];
        for (let i = 0; i < 30; i++) {
            this.warpLines.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: 20 + Math.random() * 40,
                speed: 5 + Math.random() * 10
            });
        }
    }
    
    handleClick = (e) => {
        e.preventDefault();
        
        if (this.gameOver) {
            this.restart();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        
        // Links oder rechts geklickt?
        if (x < this.canvas.width / 2) {
            this.moveLane(-1);
        } else {
            this.moveLane(1);
        }
    }
    
    handleKey = (e) => {
        if (this.gameOver) {
            if (e.key === ' ' || e.key === 'Enter') this.restart();
            return;
        }
        
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            this.moveLane(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            this.moveLane(1);
        }
    }
    
    moveLane(direction) {
        const newLane = this.rocket.lane + direction;
        if (newLane >= 0 && newLane <= 2) {
            this.rocket.targetLane = newLane;
            this.rocket.lane = newLane;
            this.rocket.tilt = direction * 0.4;
            audioManager.playClickSound();
        }
    }
    
    restart() {
        this.score = 0;
        this.speed = 3;
        this.distance = 0;
        this.gameOver = false;
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.rocket.lane = 1;
        this.rocket.targetLane = 1;
        this.rocket.x = this.lanes[1];
        this.rocket.invincible = false;
        this.generateBackground();
    }
    
    spawnObstacle() {
        const lane = Math.floor(Math.random() * 3);
        const types = [
            { emoji: '☄️', color: '#ff0055', size: 45 },
            { emoji: '🌑', color: '#666', size: 50 },
            { emoji: '🛸', color: '#00ff88', size: 40 },
            { emoji: '💫', color: '#ffff00', size: 35 }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push({
            x: this.lanes[lane],
            y: -60,
            lane: lane,
            ...type,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
    
    spawnPowerup() {
        const lane = Math.floor(Math.random() * 3);
        
        this.powerups.push({
            x: this.lanes[lane],
            y: -50,
            lane: lane,
            emoji: '⭐',
            color: '#ffff00',
            size: 35,
            glow: 0
        });
    }
    
    update() {
        if (this.gameOver) return;
        
        this.time += 0.016;
        this.distance += this.speed;
        
        // Score erhöhen
        this.score = Math.floor(this.distance / 10);
        
        // Geschwindigkeit erhöhen
        this.speed = 3 + Math.floor(this.distance / 500) * 0.5;
        this.speed = Math.min(this.speed, 10);
        
        // Rakete zur Zielbahn bewegen
        const targetX = this.lanes[this.rocket.targetLane];
        this.rocket.x += (targetX - this.rocket.x) * 0.15;
        
        // Neigung zurücksetzen
        this.rocket.tilt *= 0.9;
        
        // Flamme animieren
        this.rocket.flame += 0.4;
        
        // Hintergrund bewegen
        for (let star of this.stars) {
            star.y += star.speed * (this.speed / 3);
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }
        
        for (let line of this.warpLines) {
            line.y += line.speed * (this.speed / 3);
            if (line.y > this.canvas.height) {
                line.y = 0;
                line.x = Math.random() * this.canvas.width;
            }
        }
        
        // Hindernisse spawnen
        if (Math.random() < 0.02 + this.speed * 0.003) {
            this.spawnObstacle();
        }
        
        // Powerups spawnen
        if (Math.random() < 0.008) {
            this.spawnPowerup();
        }
        
        // Hindernisse bewegen
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += this.speed;
            obs.rotation += obs.rotationSpeed;
            
            if (obs.y > this.canvas.height + 50) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Kollision prüfen
            if (!this.rocket.invincible) {
                const dx = Math.abs(obs.x - this.rocket.x);
                const dy = Math.abs(obs.y - this.rocket.y);
                
                if (dx < 35 && dy < 35) {
                    this.gameOver = true;
                    this.createExplosion(this.rocket.x, this.rocket.y);
                    audioManager.playGameOverSound();
                    
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                    }
                }
            }
        }
        
        // Powerups bewegen und einsammeln
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.y += this.speed;
            pu.glow += 0.1;
            
            if (pu.y > this.canvas.height + 50) {
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Einsammeln
            const dx = Math.abs(pu.x - this.rocket.x);
            const dy = Math.abs(pu.y - this.rocket.y);
            
            if (dx < 40 && dy < 40) {
                this.score += 50;
                this.createCollectParticles(pu.x, pu.y);
                this.powerups.splice(i, 1);
                audioManager.playSuccessSound();
            }
        }
        
        // Triebwerks-Partikel
        if (Math.random() < 0.7) {
            this.particles.push({
                x: this.rocket.x + (Math.random() - 0.5) * 15,
                y: this.rocket.y + 30,
                vx: (Math.random() - 0.5) * 2,
                vy: 3 + Math.random() * 3,
                life: 1,
                color: ['#ff8800', '#ffff00', '#00ffff'][Math.floor(Math.random() * 3)],
                size: 4 + Math.random() * 5
            });
        }
        
        // Partikel updaten
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createCollectParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: '#ffff00',
                size: 5 + Math.random() * 5
            });
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 3 + Math.random() * 8;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff0055', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 6 + Math.random() * 8
            });
        }
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000020');
        gradient.addColorStop(0.5, '#0a0040');
        gradient.addColorStop(1, '#000020');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Warp-Linien (Geschwindigkeitseffekt)
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        for (let line of this.warpLines) {
            this.ctx.beginPath();
            this.ctx.moveTo(line.x, line.y);
            this.ctx.lineTo(line.x, line.y + line.length * (this.speed / 3));
            this.ctx.stroke();
        }
        
        // Sterne
        for (let star of this.stars) {
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Bahn-Linien
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 20]);
        
        for (let i = 1; i < 3; i++) {
            const x = (this.canvas.width / 3) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 80);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
        
        // Hindernisse
        for (let obs of this.obstacles) {
            this.ctx.save();
            this.ctx.translate(obs.x, obs.y);
            this.ctx.rotate(obs.rotation);
            
            // Glow
            this.ctx.shadowColor = obs.color;
            this.ctx.shadowBlur = 15;
            
            this.ctx.font = `${obs.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obs.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        // Powerups
        for (let pu of this.powerups) {
            const glowIntensity = 15 + Math.sin(pu.glow) * 10;
            
            this.ctx.save();
            this.ctx.translate(pu.x, pu.y);
            
            this.ctx.shadowColor = pu.color;
            this.ctx.shadowBlur = glowIntensity;
            
            this.ctx.font = `${pu.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(pu.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        // Partikel
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        this.ctx.shadowBlur = 0;
        
        // Rakete (wenn nicht Game Over)
        if (!this.gameOver) {
            this.drawRocket();
        }
        
        // UI
        this.ctx.save();
        
        // Titel
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 28px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏁 SPACE RACE! 🏁', this.canvas.width / 2, 35);
        
        // Score
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⭐ ${this.score}`, 20, 75);
        
        // High Score
        if (this.highScore > 0) {
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.font = 'bold 18px sans-serif';
            this.ctx.fillText(`🏆 ${this.highScore}`, 20, 100);
        }
        
        // Speed
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`⚡ ${this.speed.toFixed(1)}x`, this.canvas.width - 20, 75);
        
        this.ctx.restore();
        
        // Anleitung
        if (!this.gameOver && this.score < 100) {
            this.ctx.save();
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 18px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👈 Links tippen | Rechts tippen 👉', this.canvas.width / 2, this.canvas.height - 20);
            this.ctx.restore();
        }
        
        // Game Over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.save();
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 40;
            this.ctx.fillStyle = '#ff0055';
            this.ctx.font = 'bold 44px "Fredoka One", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💥 CRASH! 💥', this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 36px sans-serif';
            this.ctx.fillText(`⭐ ${this.score} Punkte`, this.canvas.width / 2, this.canvas.height / 2);
            
            if (this.score === this.highScore && this.highScore > 0) {
                this.ctx.shadowColor = '#00ff88';
                this.ctx.fillStyle = '#00ff88';
                this.ctx.font = 'bold 24px sans-serif';
                this.ctx.fillText('🏆 NEUER REKORD! 🏆', this.canvas.width / 2, this.canvas.height / 2 + 45);
            }
            
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillText('Tippe zum Neustarten', this.canvas.width / 2, this.canvas.height / 2 + 100);
            this.ctx.restore();
        }
    }
    
    drawRocket() {
        const x = this.rocket.x;
        const y = this.rocket.y;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.rocket.tilt);
        
        // Triebwerks-Flamme
        const flameSize = 25 + Math.sin(this.rocket.flame) * 10;
        
        this.ctx.shadowColor = '#ff8800';
        this.ctx.shadowBlur = 25;
        
        const flameGrad = this.ctx.createLinearGradient(0, 25, 0, 25 + flameSize);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#ffff00');
        flameGrad.addColorStop(0.6, '#ff8800');
        flameGrad.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = flameGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, 25);
        this.ctx.lineTo(0, 25 + flameSize);
        this.ctx.lineTo(12, 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Raketen-Körper
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 25;
        
        const bodyGrad = this.ctx.createLinearGradient(-18, 0, 18, 0);
        bodyGrad.addColorStop(0, '#00aaff');
        bodyGrad.addColorStop(0.3, '#66ddff');
        bodyGrad.addColorStop(0.7, '#66ddff');
        bodyGrad.addColorStop(1, '#00aaff');
        
        this.ctx.fillStyle = bodyGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -30);
        this.ctx.lineTo(-18, 25);
        this.ctx.lineTo(18, 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Spitze
        this.ctx.fillStyle = '#ff0055';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -30);
        this.ctx.lineTo(-10, -12);
        this.ctx.lineTo(10, -12);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Flügel
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.beginPath();
        this.ctx.moveTo(-18, 18);
        this.ctx.lineTo(-30, 30);
        this.ctx.lineTo(-18, 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(18, 18);
        this.ctx.lineTo(30, 30);
        this.ctx.lineTo(18, 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Fenster
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 2, 7, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}


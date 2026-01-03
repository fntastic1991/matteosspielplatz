// game_jumping.js - 🌌 COSMIC Space Jump Spiel
import { audioManager } from './audio_utils.js';

export class JumpingGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.player = {
            x: 100, y: 0, width: 50, height: 50,
            velocityY: 0, isJumping: false, rotation: 0,
            trail: []
        };
        
        this.gravity = 0.4;
        this.jumpForce = -15;
        this.groundY = 0;
        
        this.obstacles = [];
        this.obstacleSpeed = 1.5;
        this.obstacleTimer = 0;
        this.obstacleInterval = 200;
        
        this.score = 0;
        this.highScore = 0;
        this.gameOver = false;
        
        this.particles = [];
        this.stars = [];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        
        this.groundY = this.canvas.height - 100;
        this.player.y = this.groundY - this.player.height;
        
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.obstacleTimer = 0;
        this.obstacleSpeed = 1.5;
        this.obstacleInterval = 200;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.rotation = 0;
        this.player.trail = [];
        this.particles = [];
        
        this.generateStars();
        
        this.canvas.removeEventListener('click', this.handleJump);
        this.canvas.removeEventListener('touchstart', this.handleJump);
        this.canvas.addEventListener('click', this.handleJump);
        this.canvas.addEventListener('touchstart', this.handleJump);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleJump);
        this.canvas.removeEventListener('touchstart', this.handleJump);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.groundY),
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 1.5
            });
        }
    }
    
    handleJump = (e) => {
        if (e) e.preventDefault();
        
        if (this.gameOver) {
            this.obstacles = [];
            this.score = 0;
            this.gameOver = false;
            this.obstacleTimer = 0;
            this.obstacleSpeed = 1.5;
            this.obstacleInterval = 200;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
            this.player.y = this.groundY - this.player.height;
            this.player.trail = [];
            this.particles = [];
            this.generateStars();
            return;
        }
        
        if (!this.player.isJumping || this.player.velocityY > -5) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.playJumpSound();
            this.createJumpParticles();
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * -4 + 2,
                life: 1,
                color: '#00ffff',
                size: 4 + Math.random() * 4
            });
        }
    }
    
    createCollisionParticles() {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff0055', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 5 + Math.random() * 6
            });
        }
    }
    
    spawnObstacle() {
        const types = [
            { width: 30, height: 30, color: '#ff0055', emoji: '🌑' },
            { width: 30, height: 30, color: '#00ff88', emoji: '☄️' },
            { width: 30, height: 30, color: '#ffff00', emoji: '⭐' },
            { width: 30, height: 30, color: '#ff00ff', emoji: '💫' },
            { width: 30, height: 30, color: '#00ffff', emoji: '🛸' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push({
            x: this.canvas.width,
            y: this.groundY - type.height,
            width: type.width,
            height: type.height,
            color: type.color,
            emoji: type.emoji,
            passed: false,
            wobble: 0,
            glow: 0
        });
    }
    
    updatePlayer() {
        // Trail
        this.player.trail.push({ x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 });
        if (this.player.trail.length > 12) this.player.trail.shift();
        
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        if (this.player.isJumping) {
            this.player.rotation += 0.15;
        } else {
            this.player.rotation = 0;
        }
        
        if (this.player.y >= this.groundY - this.player.height) {
            this.player.y = this.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.obstacleSpeed;
            obstacle.glow += 0.05;
            
            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
                this.score++;
                this.playScoreSound();
            }
            
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = 180 + Math.random() * 120;
        }
    }
    
    checkCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.player.x < obstacle.x + obstacle.width &&
                this.player.x + this.player.width > obstacle.x &&
                this.player.y < obstacle.y + obstacle.height &&
                this.player.y + this.player.height > obstacle.y) {
                
                this.gameOver = true;
                this.createCollisionParticles();
                this.playGameOverSound();
                
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                }
            }
        }
    }
    
    playJumpSound() { audioManager.playJumpSound(); }
    playScoreSound() { audioManager.playScoreSound(); }
    playGameOverSound() { audioManager.playGameOverSound(); }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        
        if (!this.gameOver) {
            this.updatePlayer();
            this.updateObstacles();
            this.checkCollisions();
        }
        
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // 🌌 COSMIC HINTERGRUND
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000010');
        gradient.addColorStop(0.4, '#0a0030');
        gradient.addColorStop(0.8, '#150050');
        gradient.addColorStop(1, '#200040');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Bewegende Sterne (Hyperspace)
        for (let star of this.stars) {
            star.twinkle += 0.03;
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.groundY;
            }
            
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.4;
            
            // Geschwindigkeitsstreifen
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
            this.ctx.lineWidth = star.size * 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(star.x + star.speed * 4, star.y);
            this.ctx.stroke();
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Neon-Boden (Platform)
        const groundGrad = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        groundGrad.addColorStop(0, '#ff00ff');
        groundGrad.addColorStop(0.1, '#8800aa');
        groundGrad.addColorStop(1, '#220033');
        this.ctx.fillStyle = groundGrad;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Neon-Linie am Boden
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 20;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Grid auf Boden
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            const offset = (Date.now() * 0.1 + i) % 50;
            this.ctx.beginPath();
            this.ctx.moveTo(i - offset, this.groundY);
            this.ctx.lineTo(i - offset + 30, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Hindernisse
        for (let obstacle of this.obstacles) {
            this.ctx.save();
            this.ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
            
            // Neon-Glow
            const glowIntensity = 15 + Math.sin(obstacle.glow) * 8;
            this.ctx.shadowColor = obstacle.color;
            this.ctx.shadowBlur = glowIntensity;
            
            this.ctx.font = `${obstacle.width}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obstacle.emoji, 0, 0);
            
            this.ctx.restore();
        }
        
        // Spieler-Trail
        if (!this.gameOver) {
            for (let i = 0; i < this.player.trail.length; i++) {
                const t = this.player.trail[i];
                const alpha = (i / this.player.trail.length) * 0.5;
                const size = (i / this.player.trail.length) * 15 + 5;
                
                this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.shadowBlur = 0;
        }
        
        // Spieler
        this.ctx.save();
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.player.rotation);
        
        if (!this.gameOver) {
            // Glow
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 30;
            
            // Neon-Körper
            const grad = this.ctx.createRadialGradient(0, -10, 0, 0, 0, this.player.width / 2);
            grad.addColorStop(0, '#88ffff');
            grad.addColorStop(0.5, '#00ffff');
            grad.addColorStop(1, '#0088aa');
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.roundRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height, 12);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            // Gesicht
            this.ctx.fillStyle = '#003344';
            this.ctx.beginPath();
            this.ctx.arc(-10, -5, 5, 0, Math.PI * 2);
            this.ctx.arc(10, -5, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Augen-Glow
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(-9, -6, 2, 0, Math.PI * 2);
            this.ctx.arc(11, -6, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Lächeln
            this.ctx.strokeStyle = '#003344';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 2, 12, 0.2, Math.PI - 0.2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
            
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
        
        // UI
        this.ctx.save();
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 30px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⭐ ${this.score}`, 20, 40);
        
        if (this.highScore > 0) {
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillText(`🏆 ${this.highScore}`, 20, 70);
        }
        
        if (!this.gameOver) {
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👆 Tippe zum Springen! 👆', this.canvas.width / 2, 80);
        }
        this.ctx.restore();
        
        // Game Over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.save();
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 40;
            this.ctx.fillStyle = '#ff0055';
            this.ctx.font = 'bold 44px "Fredoka One", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💥 BUMM! 💥', this.canvas.width / 2, this.canvas.height / 2 - 50);
            
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 36px sans-serif';
            this.ctx.fillText(`⭐ ${this.score} Punkte`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 22px sans-serif';
            this.ctx.fillText('Tippe zum Neustarten', this.canvas.width / 2, this.canvas.height / 2 + 70);
            this.ctx.restore();
        }
    }
}

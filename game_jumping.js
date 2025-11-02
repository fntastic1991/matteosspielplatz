// game_jumping.js - Spring über die Blöcke Spiel

export class JumpingGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Spieler
        this.player = {
            x: 100,
            y: 0,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            rotation: 0
        };
        
        // Physik
        this.gravity = 0.4; // Sehr sanft
        this.jumpForce = -15; // Sehr hoher Sprung
        this.groundY = 0;
        
        // Hindernisse
        this.obstacles = [];
        this.obstacleSpeed = 1.5; // Sehr langsam für 4-Jährige
        this.obstacleTimer = 0;
        this.obstacleInterval = 200; // Viel Zeit zwischen Hindernissen
        
        // Score
        this.score = 0;
        this.highScore = 0;
        this.gameOver = false;
        
        // Visuelle Effekte
        this.particles = [];
        this.clouds = [];
        this.stars = [];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        
        // Ground-Position
        this.groundY = this.canvas.height - 100;
        this.player.y = this.groundY - this.player.height;
        
        // Reset
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.obstacleTimer = 0;
        this.obstacleSpeed = 1.5; // WICHTIG: Sehr langsame Geschwindigkeit!
        this.obstacleInterval = 200;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.rotation = 0;
        this.particles = [];
        
        // Wolken und Sterne generieren
        this.generateClouds();
        this.generateStars();
        
        // Event Listener entfernen falls vorhanden und neu hinzufügen
        this.canvas.removeEventListener('click', this.handleJump);
        this.canvas.removeEventListener('touchstart', this.handleJump);
        this.canvas.addEventListener('click', this.handleJump);
        this.canvas.addEventListener('touchstart', this.handleJump);
        
        // Render-Loop
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleJump);
        this.canvas.removeEventListener('touchstart', this.handleJump);
    }
    
    generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.groundY * 0.5),
                size: 30 + Math.random() * 30,
                speed: 0.3 + Math.random() * 0.5
            });
        }
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 20; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.groundY * 0.6),
                size: 1 + Math.random() * 2,
                opacity: Math.random(),
                speed: 0.3 + Math.random() * 0.3
            });
        }
    }
    
    handleJump = (e) => {
        if (e) e.preventDefault();
        
        if (this.gameOver) {
            // Neustart: NUR Werte zurücksetzen, keine neue Loop starten!
            this.obstacles = [];
            this.score = 0;
            this.gameOver = false;
            this.obstacleTimer = 0;
            this.obstacleSpeed = 2.5;  // Zurück auf Start-Geschwindigkeit!
            this.obstacleInterval = 150;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
            this.player.y = this.groundY - this.player.height;
            this.particles = [];
            
            // Wolken und Sterne neu generieren
            this.generateClouds();
            this.generateStars();
            
            // KEINE neue gameLoop starten - die läuft bereits weiter!
            return;
        }
        
        // Springen nur vom Boden aus
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.playJumpSound();
            this.createJumpParticles();
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3,
                life: 1,
                color: '#fbbf24',
                size: 3 + Math.random() * 3
            });
        }
    }
    
    createCollisionParticles() {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: '#ef4444',
                size: 3 + Math.random() * 4
            });
        }
    }
    
    spawnObstacle() {
        // Sehr kleine Hindernisse für 4-Jährige (maximal 25 Pixel hoch und breit)
        const types = [
            { width: 25, height: 25, color: '#10b981', emoji: '🌳' },
            { width: 25, height: 25, color: '#3b82f6', emoji: '🪨' },
            { width: 25, height: 25, color: '#a855f7', emoji: '🌺' },
            { width: 25, height: 25, color: '#f59e0b', emoji: '🍄' },
            { width: 25, height: 25, color: '#ec4899', emoji: '🦋' }
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
            wobble: 0 // Für Animation
        });
    }
    
    updatePlayer() {
        // Schwerkraft anwenden
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Rotation beim Springen
        if (this.player.isJumping) {
            this.player.rotation += 0.15;
        } else {
            this.player.rotation = 0;
        }
        
        // Boden-Kollision
        if (this.player.y >= this.groundY - this.player.height) {
            this.player.y = this.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
        }
    }
    
    updateObstacles() {
        // Hindernisse bewegen
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.obstacleSpeed;
            
            // Score erhöhen wenn Hindernis passiert
            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
                this.score++;
                this.playScoreSound();
                
                // Geschwindigkeit nur ganz minimal erhöhen
                if (this.score % 20 === 0 && this.obstacleSpeed < 2.5) {
                    this.obstacleSpeed += 0.1; // Sehr sanft und niedriges Maximum
                }
            }
            
            // Hindernis entfernen wenn aus dem Bildschirm
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Neues Hindernis spawnen
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
            
            // Interval anpassen für mehr Variation (längere Pausen)
            this.obstacleInterval = 180 + Math.random() * 120; // Sehr viel Zeit zwischen Hindernissen
        }
    }
    
    checkCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.player.x < obstacle.x + obstacle.width &&
                this.player.x + this.player.width > obstacle.x &&
                this.player.y < obstacle.y + obstacle.height &&
                this.player.y + this.player.height > obstacle.y) {
                
                // Kollision!
                this.gameOver = true;
                this.createCollisionParticles();
                this.playGameOverSound();
                
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                }
            }
        }
    }
    
    playJumpSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    playScoreSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    playGameOverSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    drawCloud(cloud) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPlayer() {
        this.ctx.save();
        
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.player.rotation);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        // Spieler (süsser Charakter mit Farbverlauf)
        const gradient = this.ctx.createRadialGradient(0, -5, 5, 0, 0, this.player.width / 2);
        gradient.addColorStop(0, '#fde047');
        gradient.addColorStop(0.7, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
        
        this.ctx.fillStyle = gradient;
        
        // Abgerundeter Körper
        const radius = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.player.width / 2 + radius, -this.player.height / 2);
        this.ctx.lineTo(this.player.width / 2 - radius, -this.player.height / 2);
        this.ctx.quadraticCurveTo(this.player.width / 2, -this.player.height / 2, this.player.width / 2, -this.player.height / 2 + radius);
        this.ctx.lineTo(this.player.width / 2, this.player.height / 2 - radius);
        this.ctx.quadraticCurveTo(this.player.width / 2, this.player.height / 2, this.player.width / 2 - radius, this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 2 + radius, this.player.height / 2);
        this.ctx.quadraticCurveTo(-this.player.width / 2, this.player.height / 2, -this.player.width / 2, this.player.height / 2 - radius);
        this.ctx.lineTo(-this.player.width / 2, -this.player.height / 2 + radius);
        this.ctx.quadraticCurveTo(-this.player.width / 2, -this.player.height / 2, -this.player.width / 2 + radius, -this.player.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Weisser Glanz
        const gloss = this.ctx.createRadialGradient(-5, -8, 0, -5, -8, 12);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gloss;
        this.ctx.beginPath();
        this.ctx.arc(-5, -8, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Gesicht
        if (!this.gameOver) {
            // Augen (grösser und niedlicher)
            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.arc(-9, -5, 4, 0, Math.PI * 2);
            this.ctx.arc(9, -5, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Weisse Glanzpunkte in den Augen
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(-8, -6, 1.5, 0, Math.PI * 2);
            this.ctx.arc(10, -6, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fröhliches Lächeln
            this.ctx.strokeStyle = '#1e293b';
            this.ctx.lineWidth = 2.5;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(0, 2, 10, 0.2, Math.PI - 0.2);
            this.ctx.stroke();
            
            // Rosige Wangen
            this.ctx.fillStyle = 'rgba(251, 113, 133, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(-13, 3, 5, 0, Math.PI * 2);
            this.ctx.arc(13, 3, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // X-Augen (Game Over)
            this.ctx.strokeStyle = '#1e293b';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(-11, -8);
            this.ctx.lineTo(-7, -3);
            this.ctx.moveTo(-7, -8);
            this.ctx.lineTo(-11, -3);
            this.ctx.moveTo(7, -8);
            this.ctx.lineTo(11, -3);
            this.ctx.moveTo(11, -8);
            this.ctx.lineTo(7, -3);
            this.ctx.stroke();
            
            // Trauriger Mund
            this.ctx.beginPath();
            this.ctx.arc(0, 8, 8, Math.PI + 0.3, Math.PI * 2 - 0.3);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawObstacle(obstacle) {
        this.ctx.save();
        
        // Wackel-Animation
        obstacle.wobble += 0.1;
        const wobbleOffset = Math.sin(obstacle.wobble) * 2;
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 8;
        
        // Hindernis mit Verlauf (abgerundete Ecken)
        const gradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y,
            obstacle.x, obstacle.y + obstacle.height
        );
        gradient.addColorStop(0, this.lightenColor(obstacle.color, 30));
        gradient.addColorStop(1, obstacle.color);
        
        this.ctx.fillStyle = gradient;
        
        // Abgerundetes Rechteck
        const radius = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + radius, obstacle.y + wobbleOffset);
        this.ctx.lineTo(obstacle.x + obstacle.width - radius, obstacle.y + wobbleOffset);
        this.ctx.quadraticCurveTo(obstacle.x + obstacle.width, obstacle.y + wobbleOffset, obstacle.x + obstacle.width, obstacle.y + radius + wobbleOffset);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height - radius + wobbleOffset);
        this.ctx.quadraticCurveTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height + wobbleOffset, obstacle.x + obstacle.width - radius, obstacle.y + obstacle.height + wobbleOffset);
        this.ctx.lineTo(obstacle.x + radius, obstacle.y + obstacle.height + wobbleOffset);
        this.ctx.quadraticCurveTo(obstacle.x, obstacle.y + obstacle.height + wobbleOffset, obstacle.x, obstacle.y + obstacle.height - radius + wobbleOffset);
        this.ctx.lineTo(obstacle.x, obstacle.y + radius + wobbleOffset);
        this.ctx.quadraticCurveTo(obstacle.x, obstacle.y + wobbleOffset, obstacle.x + radius, obstacle.y + wobbleOffset);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Weisser Highlight-Rand
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Emoji auf dem Hindernis
        this.ctx.font = `${obstacle.height * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(
            obstacle.emoji, 
            obstacle.x + obstacle.width / 2, 
            obstacle.y + obstacle.height / 2 + wobbleOffset
        );
        
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
    
    gameLoop = () => {
        if (!this.isRunning) return;
        
        // Update
        if (!this.gameOver) {
            this.updatePlayer();
            this.updateObstacles();
            this.checkCollisions();
        }
        
        // Render
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // Himmel-Hintergrund
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#93c5fd');
        gradient.addColorStop(0.6, '#bfdbfe');
        gradient.addColorStop(1, '#dbeafe');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne (nur oben)
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = this.canvas.width;
            }
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Wolken
        for (let cloud of this.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x < -cloud.size) {
                cloud.x = this.canvas.width + cloud.size;
            }
            this.drawCloud(cloud);
        }
        
        // Boden mit Verlauf
        const groundGradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#22c55e');
        groundGradient.addColorStop(0.3, '#16a34a');
        groundGradient.addColorStop(1, '#15803d');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Gras-Details (animiert)
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = '#4ade80';
        for (let i = 0; i < this.canvas.width; i += 15) {
            const grassHeight = 8 + Math.sin(time + i * 0.1) * 3;
            this.ctx.fillRect(i, this.groundY - grassHeight, 8, grassHeight);
        }
        
        // Blümchen auf dem Boden
        this.ctx.font = '16px Arial';
        for (let i = 0; i < this.canvas.width; i += 80) {
            const flowerY = this.groundY + 15 + Math.sin(time * 2 + i * 0.2) * 2;
            this.ctx.fillText(['🌼', '🌻', '🌸', '🌺'][Math.floor(i / 80) % 4], i, flowerY);
        }
        
        // Hindernisse zeichnen
        for (let obstacle of this.obstacles) {
            this.drawObstacle(obstacle);
        }
        
        // Spieler zeichnen
        this.drawPlayer();
        
        // Partikel zeichnen
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // Gravity
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
        
        // UI - Punkte
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Punkte: ${this.score}`, 20, 40);
        
        if (this.highScore > 0) {
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.fillText(`Beste: ${this.highScore}`, 20, 70);
        }
        
        // Anleitung
        if (this.score === 0 && !this.gameOver) {
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.fillStyle = '#1e293b';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🦘 Tippe zum Springen! 🦘', this.canvas.width / 2, 100);
        }
        
        this.ctx.restore();
        
        // Game Over Screen
        if (this.gameOver) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Schade!', this.canvas.width / 2, this.canvas.height / 2 - 40);
            
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.fillText(`Punkte: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.fillText('Tippe zum Neustart', this.canvas.width / 2, this.canvas.height / 2 + 60);
            
            this.ctx.restore();
        }
    }
}


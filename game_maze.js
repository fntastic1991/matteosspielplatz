// game_maze.js - 🌌 COSMIC Labyrinth-Spiel
import { audioManager } from './audio_utils.js';

export class MazeGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.maze = [];
        this.player = { x: 0, y: 0, targetX: 0, targetY: 0, glow: 0 };
        this.goal = { x: 0, y: 0, glow: 0 };
        this.cellSize = 40;
        this.level = 1;
        this.maxLevel = 10;
        this.particles = [];
        this.stars = [];
        this.pathTrail = [];
        this.time = 0;
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
        this.particles = [];
        this.time = 0;
        
        this.generateStars();
        this.generateMaze();
        
        this.canvas.addEventListener('click', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput);
        document.addEventListener('keydown', this.handleKeyDown);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
        document.removeEventListener('keydown', this.handleKeyDown);
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
    
    generateMaze() {
        const mazeWidth = 5 + Math.floor(this.level / 2);
        const mazeHeight = 5 + Math.floor(this.level / 2);
        
        this.cellSize = Math.min(
            (this.canvas.width - 60) / mazeWidth,
            (this.canvas.height - 180) / mazeHeight
        );
        
        this.maze = [];
        for (let y = 0; y < mazeHeight; y++) {
            this.maze[y] = [];
            for (let x = 0; x < mazeWidth; x++) {
                this.maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
            }
        }
        
        // DFS maze generation
        const stack = [];
        let current = { x: 0, y: 0 };
        this.maze[0][0].visited = true;
        
        const getUnvisitedNeighbors = (x, y) => {
            const neighbors = [];
            if (y > 0 && !this.maze[y - 1][x].visited) neighbors.push({ x, y: y - 1, dir: 'top' });
            if (x < mazeWidth - 1 && !this.maze[y][x + 1].visited) neighbors.push({ x: x + 1, y, dir: 'right' });
            if (y < mazeHeight - 1 && !this.maze[y + 1][x].visited) neighbors.push({ x, y: y + 1, dir: 'bottom' });
            if (x > 0 && !this.maze[y][x - 1].visited) neighbors.push({ x: x - 1, y, dir: 'left' });
            return neighbors;
        };
        
        while (true) {
            const neighbors = getUnvisitedNeighbors(current.x, current.y);
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                stack.push(current);
                
                if (next.dir === 'top') { this.maze[current.y][current.x].top = false; this.maze[next.y][next.x].bottom = false; }
                else if (next.dir === 'right') { this.maze[current.y][current.x].right = false; this.maze[next.y][next.x].left = false; }
                else if (next.dir === 'bottom') { this.maze[current.y][current.x].bottom = false; this.maze[next.y][next.x].top = false; }
                else if (next.dir === 'left') { this.maze[current.y][current.x].left = false; this.maze[next.y][next.x].right = false; }
                
                this.maze[next.y][next.x].visited = true;
                current = next;
            } else if (stack.length > 0) {
                current = stack.pop();
            } else {
                break;
            }
        }
        
        this.player = { x: 0, y: 0, targetX: 0, targetY: 0, glow: 0 };
        this.goal = { x: mazeWidth - 1, y: mazeHeight - 1, glow: 0 };
        this.pathTrail = [{ x: 0, y: 0 }];
    }
    
    handleInput = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const clickX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const clickY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        const startX = (this.canvas.width - this.maze[0].length * this.cellSize) / 2;
        const startY = 130;
        
        const playerCenterX = startX + this.player.x * this.cellSize + this.cellSize / 2;
        const playerCenterY = startY + this.player.y * this.cellSize + this.cellSize / 2;
        
        const dx = clickX - playerCenterX;
        const dy = clickY - playerCenterY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) this.movePlayer(1, 0);
            else this.movePlayer(-1, 0);
        } else {
            if (dy > 0) this.movePlayer(0, 1);
            else this.movePlayer(0, -1);
        }
    }
    
    handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowUp': case 'w': this.movePlayer(0, -1); break;
            case 'ArrowDown': case 's': this.movePlayer(0, 1); break;
            case 'ArrowLeft': case 'a': this.movePlayer(-1, 0); break;
            case 'ArrowRight': case 'd': this.movePlayer(1, 0); break;
        }
    }
    
    movePlayer(dx, dy) {
        const cell = this.maze[this.player.y][this.player.x];
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        let canMove = false;
        if (dx === 1 && !cell.right) canMove = true;
        if (dx === -1 && !cell.left) canMove = true;
        if (dy === 1 && !cell.bottom) canMove = true;
        if (dy === -1 && !cell.top) canMove = true;
        
        if (canMove && newX >= 0 && newX < this.maze[0].length && newY >= 0 && newY < this.maze.length) {
            this.player.x = newX;
            this.player.y = newY;
            this.pathTrail.push({ x: newX, y: newY });
            if (this.pathTrail.length > 50) this.pathTrail.shift();
            audioManager.playMoveSound();
            
            if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
                this.levelComplete();
            }
        } else {
            this.animateShake();
        }
    }
    
    animateShake() {
        audioManager.playErrorSound();
    }
    
    levelComplete() {
        this.createSuccessParticles();
        audioManager.playSuccessSound();
        
        setTimeout(() => {
            if (this.level >= this.maxLevel) {
                this.stop();
                if (this.onExit) this.onExit();
            } else {
                this.level++;
                this.generateMaze();
                audioManager.playLevelUpSound();
            }
        }, 1500);
    }
    
    createSuccessParticles() {
        const startX = (this.canvas.width - this.maze[0].length * this.cellSize) / 2;
        const startY = 130;
        const x = startX + this.goal.x * this.cellSize + this.cellSize / 2;
        const y = startY + this.goal.y * this.cellSize + this.cellSize / 2;
        
        for (let i = 0; i < 35; i++) {
            const angle = (Math.PI * 2 * i) / 35;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ffff00', '#00ff88', '#ff00ff'][Math.floor(Math.random() * 3)],
                size: 5 + Math.random() * 6
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
        gradient.addColorStop(0.5, '#0a0535');
        gradient.addColorStop(1, '#050520');
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
        this.ctx.fillText('🌌 Space Maze! 🌌', this.canvas.width / 2, 35);
        
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, this.canvas.width / 2, 70);
        
        this.ctx.shadowColor = '#ffff00';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText('Finde den Weg zum Stern! ⭐', this.canvas.width / 2, 100);
        this.ctx.restore();
        
        // Labyrinth
        const startX = (this.canvas.width - this.maze[0].length * this.cellSize) / 2;
        const startY = 130;
        
        // Hintergrund des Labyrinths
        this.ctx.fillStyle = 'rgba(20, 10, 50, 0.8)';
        this.ctx.beginPath();
        this.ctx.roundRect(startX - 10, startY - 10, this.maze[0].length * this.cellSize + 20, this.maze.length * this.cellSize + 20, 15);
        this.ctx.fill();
        
        // Pfad-Trail
        this.ctx.save();
        for (let i = 0; i < this.pathTrail.length; i++) {
            const p = this.pathTrail[i];
            const alpha = (i / this.pathTrail.length) * 0.4;
            const size = (i / this.pathTrail.length) * 8 + 3;
            
            this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(
                startX + p.x * this.cellSize + this.cellSize / 2,
                startY + p.y * this.cellSize + this.cellSize / 2,
                size, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        this.ctx.restore();
        
        // Wände
        this.ctx.save();
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const cell = this.maze[y][x];
                const cellX = startX + x * this.cellSize;
                const cellY = startY + y * this.cellSize;
                
                if (cell.top) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(cellX, cellY);
                    this.ctx.lineTo(cellX + this.cellSize, cellY);
                    this.ctx.stroke();
                }
                if (cell.right) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(cellX + this.cellSize, cellY);
                    this.ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
                    this.ctx.stroke();
                }
                if (cell.bottom) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(cellX, cellY + this.cellSize);
                    this.ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
                    this.ctx.stroke();
                }
                if (cell.left) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(cellX, cellY);
                    this.ctx.lineTo(cellX, cellY + this.cellSize);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.restore();
        
        // Ziel
        this.goal.glow += 0.06;
        const goalX = startX + this.goal.x * this.cellSize + this.cellSize / 2;
        const goalY = startY + this.goal.y * this.cellSize + this.cellSize / 2;
        const goalGlow = 15 + Math.sin(this.goal.glow) * 10;
        const goalScale = 1 + Math.sin(this.goal.glow * 2) * 0.1;
        
        this.ctx.save();
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = goalGlow;
        this.ctx.font = `${this.cellSize * 0.6 * goalScale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⭐', goalX, goalY);
        this.ctx.restore();
        
        // Spieler
        this.player.glow += 0.08;
        const playerX = startX + this.player.x * this.cellSize + this.cellSize / 2;
        const playerY = startY + this.player.y * this.cellSize + this.cellSize / 2;
        const playerGlow = 20 + Math.sin(this.player.glow) * 12;
        
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = playerGlow;
        
        const playerGrad = this.ctx.createRadialGradient(playerX, playerY - 5, 0, playerX, playerY, this.cellSize * 0.35);
        playerGrad.addColorStop(0, '#88ffff');
        playerGrad.addColorStop(0.6, '#00ffff');
        playerGrad.addColorStop(1, '#0088aa');
        
        this.ctx.fillStyle = playerGrad;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, this.cellSize * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Gesicht
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#003344';
        const eyeSize = this.cellSize * 0.06;
        this.ctx.beginPath();
        this.ctx.arc(playerX - eyeSize * 2, playerY - eyeSize, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(playerX + eyeSize * 2, playerY - eyeSize, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Lächeln
        this.ctx.strokeStyle = '#003344';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY + eyeSize, this.cellSize * 0.12, 0.1, Math.PI - 0.1);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            
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
        
        // Steuerung Hinweis
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👆 Tippe in eine Richtung oder nutze Pfeiltasten', this.canvas.width / 2, this.canvas.height - 20);
        this.ctx.restore();
    }
}

// main.js - 🚀 COSMIC ARCADE - Hauptsteuerung
import { ColorGame } from './game_colors.js';
import { BalloonGame } from './game_balloons.js';
import { ShapeGame } from './game_shapes.js';
import { MazeGame } from './game_maze.js';
import { MemoryGame } from './game_memory.js';
import { OddOneGame } from './game_oddone.js';
import { NumbersGame } from './game_numbers.js';
import { CountingGame } from './game_counting.js';
import { JumpingGame } from './game_jumping.js';
import { MusicGame } from './game_music.js';
import { DodgingGame } from './game_dodging.js';
import { ClawGame } from './game_claw.js';
import { audioManager } from './audio_utils.js';

// ========================================
// 🌟 Partikel-System für Hintergrund
// ========================================
class CosmicParticles {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.stars = [];
        this.shootingStars = [];
        this.resize();
        this.initParticles();
        this.initStars();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    initParticles() {
        this.particles = [];
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff88', '#ff8800'];
        
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                alpha: Math.random() * 0.5 + 0.2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    spawnShootingStar() {
        if (Math.random() < 0.005) { // 0.5% Chance pro Frame
            this.shootingStars.push({
                x: Math.random() * this.canvas.width,
                y: 0,
                length: 50 + Math.random() * 100,
                speed: 8 + Math.random() * 8,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
                alpha: 1
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne zeichnen
        for (let star of this.stars) {
            star.twinkle += star.twinkleSpeed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.4;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        }
        
        // Leuchtende Partikel
        for (let p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += 0.05;
            
            // Wrap around
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.2;
            const pulseSize = p.size + Math.sin(p.pulse) * 1;
            
            // Glow
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseSize * 3);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(0.5, p.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, pulseSize * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = pulseAlpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Sternschnuppen
        this.spawnShootingStar();
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const ss = this.shootingStars[i];
            
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.alpha -= 0.02;
            
            if (ss.alpha <= 0) {
                this.shootingStars.splice(i, 1);
                continue;
            }
            
            // Sternschnuppe zeichnen
            const gradient = this.ctx.createLinearGradient(
                ss.x, ss.y,
                ss.x - Math.cos(ss.angle) * ss.length,
                ss.y - Math.sin(ss.angle) * ss.length
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${ss.alpha})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.moveTo(ss.x, ss.y);
            this.ctx.lineTo(
                ss.x - Math.cos(ss.angle) * ss.length,
                ss.y - Math.sin(ss.angle) * ss.length
            );
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// 🎊 Konfetti-System
// ========================================
class ConfettiSystem {
    constructor() {
        this.particles = [];
        this.colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff88', '#ff8800', '#ff6b6b', '#48dbfb'];
    }
    
    burst(x, y, count = 50) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const velocity = 5 + Math.random() * 10;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 8 + Math.random() * 8,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 20,
                gravity: 0.3,
                alpha: 1,
                shape: Math.random() > 0.5 ? 'circle' : 'rect'
            });
        }
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.99;
            p.rotation += p.rotationSpeed;
            p.alpha -= 0.015;
            
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            }
            
            ctx.restore();
        }
    }
}

// ========================================
// 🎮 Haupt-App
// ========================================
class GameApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.score = 0;
        this.confetti = new ConfettiSystem();
        
        this.initCanvas();
        this.attachEventListeners();
        this.initMenuAnimation();
    }
    
    initMenuAnimation() {
        const menuCanvas = document.getElementById('menu-canvas');
        if (!menuCanvas) return;
        
        // Cosmic Particles initialisieren
        this.cosmicParticles = new CosmicParticles(menuCanvas);
    }
    
    initCanvas() {
        const resizeCanvas = () => {
            const gameScreen = document.getElementById('game-screen');
            const header = document.querySelector('.game-header');
            const headerHeight = header ? header.offsetHeight : 0;
            
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - headerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    attachEventListeners() {
        // Menü-Buttons
        const gameButtons = document.querySelectorAll('.game-button');
        console.log(`🎮 Gefunden: ${gameButtons.length} Spiel-Buttons`);
        
        gameButtons.forEach(button => {
            // Ripple-Effekt bei Klick
            button.addEventListener('click', async (e) => {
                // Visueller Feedback
                this.createRipple(e, button);
                
                const gameType = e.currentTarget.dataset.game;
                console.log('🎯 Button geklickt:', gameType);
                
                // Audio aktivieren
                try {
                    await audioManager.init();
                    await audioManager.ensureRunning();
                    console.log('🔊 Audio aktiviert!');
                } catch (err) {
                    console.warn('⚠️ Audio konnte nicht aktiviert werden:', err);
                }
                
                // Kurze Verzögerung für Animation
                setTimeout(() => {
                    this.startGame(gameType);
                }, 150);
            });
        });
        
        // Zurück-Button
        document.getElementById('back-button').addEventListener('click', () => {
            this.exitGame();
        });
        
        // Erfolgsbildschirm Buttons
        document.getElementById('replay-button').addEventListener('click', () => {
            this.hideSuccess();
            if (this.currentGame) {
                this.currentGame.start(this.ctx, () => this.showSuccess());
            }
        });
        
        document.getElementById('menu-button').addEventListener('click', () => {
            this.hideSuccess();
            this.exitGame();
        });
    }
    
    createRipple(e, button) {
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out forwards;
            pointer-events: none;
        `;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    startGame(gameType) {
        console.log('🚀 startGame aufgerufen mit:', gameType);
        this.score = 0;
        this.updateScore();
        
        // Spiel initialisieren
        switch(gameType) {
            case 'colors':
                this.currentGame = new ColorGame();
                break;
            case 'balloons':
                this.currentGame = new BalloonGame();
                break;
            case 'shapes':
                this.currentGame = new ShapeGame();
                break;
            case 'maze':
                this.currentGame = new MazeGame();
                break;
            case 'memory':
                this.currentGame = new MemoryGame();
                break;
            case 'oddone':
                this.currentGame = new OddOneGame();
                break;
            case 'numbers':
                this.currentGame = new NumbersGame();
                break;
            case 'counting':
                this.currentGame = new CountingGame();
                break;
            case 'jumping':
                this.currentGame = new JumpingGame();
                break;
            case 'music':
                this.currentGame = new MusicGame();
                break;
            case 'dodging':
                this.currentGame = new DodgingGame();
                break;
            case 'claw':
                this.currentGame = new ClawGame();
                break;
            default:
                console.error('Unbekanntes Spiel:', gameType);
                return;
        }
        
        // Bildschirm wechseln
        console.log('📺 Wechsle zu game-screen');
        this.showScreen('game-screen');
        
        // Spiel starten
        if (this.currentGame) {
            console.log('✅ Spiel wird gestartet:', this.currentGame.constructor.name);
            this.currentGame.start(this.ctx, () => this.showSuccess());
        } else {
            console.error('❌ Kein Spiel wurde initialisiert!');
        }
    }
    
    exitGame() {
        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
        }
        this.currentGame = null;
        this.showScreen('menu');
        
        // Canvas leeren
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    updateScore(points = 0) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }
    
    showSuccess() {
        this.createConfetti();
        document.getElementById('success-title').textContent = '🎉 Super gemacht!';
        document.getElementById('success-message').textContent = 'Du bist ein Star! ⭐';
        this.showScreen('success-screen');
        
        // Vibration auf mobilen Geräten
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
    }
    
    hideSuccess() {
        this.showScreen('game-screen');
    }
    
    createConfetti() {
        const container = document.getElementById('confetti-canvas');
        container.innerHTML = '';
        
        // Canvas für Konfetti erstellen
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const confetti = new ConfettiSystem();
        
        // Mehrere Konfetti-Bursts
        confetti.burst(canvas.width / 2, canvas.height / 3, 80);
        setTimeout(() => confetti.burst(canvas.width / 4, canvas.height / 2, 40), 200);
        setTimeout(() => confetti.burst(canvas.width * 3/4, canvas.height / 2, 40), 400);
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confetti.update();
            confetti.render(ctx);
            
            if (confetti.particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };
        
        animate();
    }
}

// ========================================
// 🚀 App starten
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Ripple-Animation CSS hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    const app = new GameApp();
    window.gameApp = app;
    window.audioManager = audioManager;
    console.log('✅ 🚀 COSMIC ARCADE initialisiert und bereit!');
});

// Hilfsfunktion für Bildladen mit Fallback
export function loadImageWithFallback(url, fallbackDraw) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            resolve({ type: 'image', data: img });
        };
        
        img.onerror = () => {
            console.log(`Bild konnte nicht geladen werden: ${url}, verwende Fallback`);
            resolve({ type: 'fallback', data: fallbackDraw });
        };
        
        img.src = url;
        
        // Timeout nach 5 Sekunden
        setTimeout(() => {
            if (!img.complete) {
                resolve({ type: 'fallback', data: fallbackDraw });
            }
        }, 5000);
    });
}

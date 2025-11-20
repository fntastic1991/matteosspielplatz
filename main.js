// main.js - Hauptsteuerung der Webapp
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

class GameApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.score = 0;
        
        this.initCanvas();
        this.attachEventListeners();
        this.initMenuAnimation();
    }
    
    initMenuAnimation() {
        const menuCanvas = document.getElementById('menu-canvas');
        if (!menuCanvas) return;
        
        const ctx = menuCanvas.getContext('2d');
        menuCanvas.width = window.innerWidth;
        menuCanvas.height = window.innerHeight;
        
        // Animierte Formen im Hintergrund
        const shapes = [];
        const colors = ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#FCA5A5'];
        
        for (let i = 0; i < 15; i++) {
            shapes.push({
                x: Math.random() * menuCanvas.width,
                y: Math.random() * menuCanvas.height,
                size: 20 + Math.random() * 40,
                type: Math.floor(Math.random() * 3), // 0: Kreis, 1: Quadrat, 2: Stern
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: 0.2 + Math.random() * 0.5,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: 0.01 + Math.random() * 0.02
            });
        }
        
        const animateMenu = () => {
            ctx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
            
            for (let shape of shapes) {
                ctx.save();
                ctx.translate(shape.x, shape.y);
                ctx.rotate(shape.angle);
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = shape.color;
                
                if (shape.type === 0) {
                    // Kreis
                    ctx.beginPath();
                    ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (shape.type === 1) {
                    // Quadrat
                    ctx.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
                } else {
                    // Stern
                    this.drawStar(ctx, 0, 0, 5, shape.size / 2, shape.size / 4);
                }
                
                ctx.restore();
                
                // Bewegung
                shape.y -= shape.speed;
                shape.angle += shape.rotationSpeed;
                
                if (shape.y < -shape.size) {
                    shape.y = menuCanvas.height + shape.size;
                    shape.x = Math.random() * menuCanvas.width;
                }
            }
            
            requestAnimationFrame(animateMenu);
        };
        
        animateMenu();
        
        window.addEventListener('resize', () => {
            menuCanvas.width = window.innerWidth;
            menuCanvas.height = window.innerHeight;
        });
    }
    
    drawStar(ctx, x, y, points, outer, inner) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outer : inner;
            const angle = (i * Math.PI) / points;
            ctx.lineTo(
                x + radius * Math.sin(angle),
                y - radius * Math.cos(angle)
            );
        }
        ctx.closePath();
        ctx.fill();
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
        // Audio beim ersten Klick initialisieren (wichtig für iOS/Safari)
        document.addEventListener('click', () => {
            audioManager.unlock();
        }, { once: true });
        
        document.addEventListener('touchstart', () => {
            audioManager.unlock();
        }, { once: true });
        
        // Menü-Buttons
        const gameButtons = document.querySelectorAll('.game-button');
        console.log(`🎮 Gefunden: ${gameButtons.length} Spiel-Buttons`);
        
        gameButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const gameType = e.currentTarget.dataset.game;
                console.log('🎯 Button geklickt:', gameType);
                this.startGame(gameType);
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
    
    startGame(gameType) {
        console.log('🚀 startGame aufgerufen mit:', gameType);
        this.score = 0;
        this.updateScore();
        
        // Audio im Hintergrund aktivieren (nicht warten!)
        audioManager.ensureRunning().catch(e => console.warn('⚠️ Audio-Start Fehler:', e));
        
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
        document.getElementById('success-title').textContent = 'Super gemacht!';
        document.getElementById('success-message').textContent = 'Du bist toll!';
        this.showScreen('success-screen');
    }
    
    hideSuccess() {
        this.showScreen('game-screen');
    }
    
    createConfetti() {
        const confettiContainer = document.getElementById('confetti-canvas');
        confettiContainer.innerHTML = '';
        
        const colors = ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#FCA5A5'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.opacity = '1';
            confetti.style.pointerEvents = 'none';
            confetti.style.transition = 'all 3s ease-out';
            
            confettiContainer.appendChild(confetti);
            
            // Animation starten
            setTimeout(() => {
                confetti.style.top = '100vh';
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                confetti.style.opacity = '0';
            }, 10);
            
            // Nach Animation entfernen
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }
}

// App initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const app = new GameApp();
    window.gameApp = app; // Global verfügbar machen für parental control
    console.log('✅ GameApp initialisiert und bereit!');
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


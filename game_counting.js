// game_counting.js - Tiere zählen Spiel
import { audioManager } from './audio_utils.js';

export class CountingGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.animals = [];
        this.answerButtons = [];
        this.currentQuestion = null;
        this.level = 1;
        this.totalLevels = 10;
        this.score = 0;
        
        // Visuelle Effekte
        this.particles = [];
        this.stars = [];
        this.successAnimation = 0;
        
        // Tier-Definitionen mit Emojis
        this.animalTypes = [
            { emoji: '🐱', name: 'Katzen', color: '#f97316' },
            { emoji: '🐶', name: 'Hunde', color: '#f59e0b' },
            { emoji: '🐟', name: 'Fische', color: '#3b82f6' },
            { emoji: '🐦', name: 'Vögel', color: '#14b8a6' },
            { emoji: '🐰', name: 'Hasen', color: '#a855f7' },
            { emoji: '🐸', name: 'Frösche', color: '#10b981' },
            { emoji: '🦋', name: 'Schmetterlinge', color: '#ec4899' },
            { emoji: '🐢', name: 'Schildkröten', color: '#84cc16' }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.level = 1;
        this.score = 0;
        this.particles = [];
        this.successAnimation = 0;
        
        // Dekorative Sterne generieren
        this.generateStars();
        
        // Level erstellen
        this.createLevel();
        
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
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 25; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                opacity: Math.random(),
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    createLevel() {
        this.animals = [];
        this.answerButtons = [];
        
        // Schwierigkeit steigt mit Level (max Anzahl pro Tier)
        const maxCount = Math.min(2 + this.level, 7);
        
        // Wähle 2-3 verschiedene Tiere
        const numTypes = this.level <= 3 ? 2 : 3;
        const selectedTypes = [];
        const availableTypes = [...this.animalTypes];
        
        for (let i = 0; i < numTypes; i++) {
            const index = Math.floor(Math.random() * availableTypes.length);
            selectedTypes.push(availableTypes[index]);
            availableTypes.splice(index, 1);
        }
        
        // Erstelle Tiere mit zufälligen Anzahlen
        const animalCounts = {};
        
        for (let type of selectedTypes) {
            const count = 1 + Math.floor(Math.random() * maxCount);
            animalCounts[type.emoji] = count;
            
            for (let i = 0; i < count; i++) {
                this.animals.push({
                    type: type.emoji,
                    name: type.name,
                    color: type.color,
                    x: 0,
                    y: 0,
                    size: 50,
                    scale: 1,
                    rotation: (Math.random() - 0.5) * 0.3,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }
        
        // Mische die Tiere
        this.animals.sort(() => Math.random() - 0.5);
        
        // Positioniere Tiere
        this.positionAnimals();
        
        // Wähle ein Tier zum Zählen
        const questionType = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
        this.currentQuestion = {
            emoji: questionType.emoji,
            name: questionType.name,
            correctAnswer: animalCounts[questionType.emoji],
            color: questionType.color
        };
        
        // Erstelle Antwort-Buttons
        this.createAnswerButtons();
    }
    
    positionAnimals() {
        const margin = 50;
        const spacing = 80;
        const startY = 180;
        const availableWidth = this.canvas.width - margin * 2;
        const availableHeight = this.canvas.height - startY - 200;
        
        const cols = Math.ceil(Math.sqrt(this.animals.length * (availableWidth / availableHeight)));
        const rows = Math.ceil(this.animals.length / cols);
        
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        
        for (let i = 0; i < this.animals.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            // Zufälliger Offset innerhalb der Zelle
            const offsetX = (Math.random() - 0.5) * (cellWidth * 0.3);
            const offsetY = (Math.random() - 0.5) * (cellHeight * 0.3);
            
            this.animals[i].x = margin + col * cellWidth + cellWidth / 2 + offsetX;
            this.animals[i].y = startY + row * cellHeight + cellHeight / 2 + offsetY;
        }
    }
    
    createAnswerButtons() {
        this.answerButtons = [];
        
        // Erstelle 4 Antwortmöglichkeiten
        const correctAnswer = this.currentQuestion.correctAnswer;
        const options = new Set([correctAnswer]);
        
        // Füge falsche Antworten hinzu
        while (options.size < 4) {
            let option;
            if (Math.random() > 0.5) {
                option = correctAnswer + Math.floor(Math.random() * 3) + 1;
            } else {
                option = Math.max(1, correctAnswer - Math.floor(Math.random() * 3) - 1);
            }
            if (option <= 10) {
                options.add(option);
            }
        }
        
        const optionsArray = Array.from(options).sort(() => Math.random() - 0.5);
        
        // Positioniere Buttons
        const buttonWidth = 80;
        const buttonHeight = 80;
        const spacing = 20;
        const totalWidth = buttonWidth * 4 + spacing * 3;
        const startX = (this.canvas.width - totalWidth) / 2;
        const buttonY = this.canvas.height - 120;
        
        for (let i = 0; i < optionsArray.length; i++) {
            this.answerButtons.push({
                number: optionsArray[i],
                x: startX + i * (buttonWidth + spacing),
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                isCorrect: optionsArray[i] === correctAnswer,
                scale: 1
            });
        }
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    handleClick = (e) => {
        const pos = this.getMousePos(e);
        this.checkButtonClick(pos.x, pos.y);
    }
    
    handleTouch = (e) => {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.checkButtonClick(pos.x, pos.y);
    }
    
    checkButtonClick(x, y) {
        for (let button of this.answerButtons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                
                if (button.isCorrect) {
                    // Richtig!
                    this.score++;
                    this.animateSuccess(button);
                    this.createSuccessParticles(button);
                    this.playSuccessSound();
                    this.successAnimation = 1;
                    
                    // Nächstes Level
                    if (this.level < this.totalLevels) {
                        this.level++;
                        setTimeout(() => {
                            this.successAnimation = 0;
                            this.createLevel();
                        }, 2000);
                    } else {
                        // Alle Level geschafft!
                        setTimeout(() => {
                            this.stop();
                            if (this.onExit) this.onExit();
                        }, 2500);
                    }
                } else {
                    // Falsch!
                    this.animateShake(button);
                    this.playErrorSound();
                }
                break;
            }
        }
    }
    
    animateSuccess(button) {
        const startTime = Date.now();
        const duration = 500;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                button.scale = 1 + progress * 0.4;
            } else {
                button.scale = 1.2 - (progress - 0.5) * 0.4;
            }
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                button.scale = 1;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animateShake(button) {
        const startTime = Date.now();
        const duration = 300;
        const originalX = button.x;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            button.x = originalX + Math.sin(progress * Math.PI * 6) * 10 * (1 - progress);
            
            if (progress < 1 && this.isRunning) {
                requestAnimationFrame(animate);
            } else {
                button.x = originalX;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    createSuccessParticles(button) {
        const centerX = button.x + button.width / 2;
        const centerY = button.y + button.height / 2;
        
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 5
            });
        }
    }
    
    playSuccessSound() {
        audioManager.playSuccessSound();
    }
    
    playErrorSound() {
        audioManager.playErrorSound();
    }
    
    drawAnimal(animal) {
        this.ctx.save();
        
        this.ctx.translate(animal.x, animal.y);
        this.ctx.scale(animal.scale, animal.scale);
        this.ctx.rotate(animal.rotation);
        
        // Pulsierender Effekt
        animal.pulse += 0.03;
        const pulseScale = 1 + Math.sin(animal.pulse) * 0.05;
        this.ctx.scale(pulseScale, pulseScale);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        // Emoji zeichnen
        this.ctx.font = `${animal.size}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(animal.type, 0, 0);
        
        this.ctx.restore();
    }
    
    drawButton(button) {
        this.ctx.save();
        
        const centerX = button.x + button.width / 2;
        const centerY = button.y + button.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(button.scale, button.scale);
        this.ctx.translate(-button.width / 2, -button.height / 2);
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        // Button-Hintergrund
        const gradient = this.ctx.createLinearGradient(0, 0, 0, button.height);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
        this.ctx.fillStyle = gradient;
        this.roundRect(0, 0, button.width, button.height, 15);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Weisser Rand
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.roundRect(3, 3, button.width - 6, button.height - 6, 12);
        this.ctx.stroke();
        
        // Zahl in der Mitte
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 36px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(button.number, button.width / 2, button.height / 2);
        
        this.ctx.restore();
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    render = () => {
        if (!this.isRunning) return;
        
        // Hintergrund mit Verlauf
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#d9f99d');
        gradient.addColorStop(1, '#bef264');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dekorative Sterne
        for (let star of this.stars) {
            star.opacity = Math.abs(Math.sin(Date.now() * 0.001 * star.speed));
            this.ctx.fillStyle = `rgba(132, 204, 22, ${star.opacity * 0.25})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Titel
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐾 Zähle die Tiere! 🐾', this.canvas.width / 2, 35);
        this.ctx.restore();
        
        // Level Badge
        this.ctx.save();
        const badgeX = this.canvas.width / 2;
        const badgeY = 70;
        
        const badgeGradient = this.ctx.createLinearGradient(badgeX - 60, badgeY - 15, badgeX + 60, badgeY + 15);
        badgeGradient.addColorStop(0, '#a3e635');
        badgeGradient.addColorStop(1, '#84cc16');
        this.ctx.fillStyle = badgeGradient;
        this.ctx.shadowColor = 'rgba(132, 204, 22, 0.5)';
        this.ctx.shadowBlur = 15;
        this.roundRect(badgeX - 60, badgeY - 15, 120, 30, 15);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(`⭐ Level ${this.level}/${this.totalLevels}`, badgeX, badgeY + 5);
        this.ctx.restore();
        
        // Frage anzeigen
        if (this.currentQuestion) {
            this.ctx.save();
            this.ctx.fillStyle = '#1e293b';
            this.ctx.font = 'bold 26px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(
                `Wie viele ${this.currentQuestion.name} siehst du?`,
                this.canvas.width / 2,
                130
            );
            
            // Tier-Emoji zur Frage
            this.ctx.font = '40px sans-serif';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText(this.currentQuestion.emoji, this.canvas.width / 2, 160);
            this.ctx.restore();
        }
        
        // Tiere zeichnen
        for (let animal of this.animals) {
            this.drawAnimal(animal);
        }
        
        // Antwort-Buttons zeichnen
        for (let button of this.answerButtons) {
            this.drawButton(button);
        }
        
        // Partikel zeichnen
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
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
        
        // Erfolgsanimation
        if (this.successAnimation > 0) {
            this.successAnimation -= 0.015;
            const scale = 1 + (1 - this.successAnimation) * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = this.successAnimation;
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(scale, scale);
            this.ctx.font = 'bold 60px sans-serif';
            this.ctx.fillStyle = '#10b981';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🎉 Richtig! 🎉', 0, 0);
            this.ctx.restore();
        }
        
        requestAnimationFrame(this.render);
    }
}


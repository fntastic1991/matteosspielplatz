// game_music.js - Musik machen Spiel

export class MusicGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        // Audio Context
        this.audioContext = null;
        
        // Aktuelles Instrument
        this.currentInstrument = 'piano'; // piano, guitar, drums, xylophone
        
        // Instrumente
        this.instruments = [
            { id: 'piano', name: 'Klavier', emoji: '🎹', color: '#3b82f6' },
            { id: 'guitar', name: 'Gitarre', emoji: '🎸', color: '#ec4899' },
            { id: 'drums', name: 'Schlagzeug', emoji: '🥁', color: '#f59e0b' },
            { id: 'xylophone', name: 'Xylophon', emoji: '🎵', color: '#10b981' }
        ];
        
        // Noten/Tasten
        this.keys = [];
        
        // Visuelle Effekte
        this.particles = [];
        this.notes = []; // Fliegende Noten
        
        // Touch-Tracking
        this.activeNotes = new Set();
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        
        // Audio Context initialisieren
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // UI Setup
        this.setupInstrumentButtons();
        this.setupKeys();
        
        // Event Listener
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        
        // Render-Loop
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
    
    setupInstrumentButtons() {
        const buttonWidth = 80;
        const buttonHeight = 80;
        const spacing = 20;
        const totalWidth = (buttonWidth + spacing) * this.instruments.length - spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = 40;
        
        this.instrumentButtons = this.instruments.map((instrument, i) => ({
            ...instrument,
            x: startX + i * (buttonWidth + spacing),
            y: y,
            width: buttonWidth,
            height: buttonHeight,
            scale: 1
        }));
    }
    
    setupKeys() {
        this.keys = [];
        
        if (this.currentInstrument === 'piano') {
            // Klavier: 8 bunte Tasten (C, D, E, F, G, A, H, C)
            const keyWidth = Math.min(80, this.canvas.width / 9);
            const keyHeight = 180;
            const startX = (this.canvas.width - keyWidth * 8) / 2;
            const y = this.canvas.height - keyHeight - 40;
            
            const notes = [
                { note: 'C', freq: 261.63, color: '#ef4444' },
                { note: 'D', freq: 293.66, color: '#f59e0b' },
                { note: 'E', freq: 329.63, color: '#fbbf24' },
                { note: 'F', freq: 349.23, color: '#84cc16' },
                { note: 'G', freq: 392.00, color: '#10b981' },
                { note: 'A', freq: 440.00, color: '#3b82f6' },
                { note: 'H', freq: 493.88, color: '#8b5cf6' },
                { note: 'C', freq: 523.25, color: '#ec4899' }
            ];
            
            this.keys = notes.map((note, i) => ({
                ...note,
                x: startX + i * keyWidth,
                y: y,
                width: keyWidth - 4,
                height: keyHeight,
                pressed: false
            }));
            
        } else if (this.currentInstrument === 'guitar') {
            // Gitarre: 6 Saiten
            const stringHeight = 50;
            const startY = 200;
            
            const strings = [
                { note: 'E', freq: 329.63, color: '#ef4444' },
                { note: 'A', freq: 220.00, color: '#f59e0b' },
                { note: 'D', freq: 146.83, color: '#fbbf24' },
                { note: 'G', freq: 196.00, color: '#10b981' },
                { note: 'H', freq: 246.94, color: '#3b82f6' },
                { note: 'E', freq: 82.41, color: '#8b5cf6' }
            ];
            
            this.keys = strings.map((string, i) => ({
                ...string,
                x: 50,
                y: startY + i * stringHeight,
                width: this.canvas.width - 100,
                height: stringHeight - 10,
                pressed: false
            }));
            
        } else if (this.currentInstrument === 'drums') {
            // Schlagzeug: 6 verschiedene Drums
            const drumSize = Math.min(120, (this.canvas.width - 60) / 3);
            const startX = (this.canvas.width - drumSize * 3 - 40) / 2;
            
            const drums = [
                { note: 'Kick', freq: 60, color: '#ef4444', emoji: '🥁' },
                { note: 'Snare', freq: 200, color: '#f59e0b', emoji: '🥁' },
                { note: 'Tom', freq: 150, color: '#fbbf24', emoji: '🥁' },
                { note: 'Hi-Hat', freq: 800, color: '#10b981', emoji: '🎵' },
                { note: 'Crash', freq: 1000, color: '#3b82f6', emoji: '💥' },
                { note: 'Ride', freq: 900, color: '#8b5cf6', emoji: '✨' }
            ];
            
            this.keys = drums.map((drum, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                return {
                    ...drum,
                    x: startX + col * (drumSize + 20),
                    y: 200 + row * (drumSize + 20),
                    width: drumSize,
                    height: drumSize,
                    pressed: false
                };
            });
            
        } else if (this.currentInstrument === 'xylophone') {
            // Xylophon: 8 bunte Stäbe
            const barWidth = Math.min(60, this.canvas.width / 9);
            const barHeight = 150;
            const startX = (this.canvas.width - barWidth * 8) / 2;
            const baseY = this.canvas.height - 200;
            
            const notes = [
                { note: 'C', freq: 523.25, color: '#ef4444', height: 1.0 },
                { note: 'D', freq: 587.33, color: '#f59e0b', height: 0.9 },
                { note: 'E', freq: 659.25, color: '#fbbf24', height: 0.8 },
                { note: 'F', freq: 698.46, color: '#84cc16', height: 0.7 },
                { note: 'G', freq: 783.99, color: '#10b981', height: 0.6 },
                { note: 'A', freq: 880.00, color: '#3b82f6', height: 0.7 },
                { note: 'H', freq: 987.77, color: '#8b5cf6', height: 0.8 },
                { note: 'C', freq: 1046.50, color: '#ec4899', height: 0.9 }
            ];
            
            this.keys = notes.map((note, i) => ({
                ...note,
                x: startX + i * barWidth,
                y: baseY - (note.height * barHeight - barHeight * 0.6),
                width: barWidth - 4,
                height: note.height * barHeight,
                pressed: false
            }));
        }
    }
    
    handleClick = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.handleInteraction(x, y);
    }
    
    handleTouchStart = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        
        for (let touch of e.touches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleInteraction(x, y, touch.identifier);
        }
    }
    
    handleTouchMove = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        
        for (let touch of e.touches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleInteraction(x, y, touch.identifier);
        }
    }
    
    handleTouchEnd = (e) => {
        e.preventDefault();
        // Alle gepressten Tasten zurücksetzen
        this.keys.forEach(key => key.pressed = false);
        this.activeNotes.clear();
    }
    
    handleInteraction(x, y, touchId = null) {
        // Instrument-Buttons prüfen
        for (let button of this.instrumentButtons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                
                if (this.currentInstrument !== button.id) {
                    this.currentInstrument = button.id;
                    this.setupKeys();
                    this.createSwitchParticles(button.x + button.width / 2, button.y + button.height / 2, button.color);
                    this.playClickSound();
                }
                return;
            }
        }
        
        // Tasten/Instrumente prüfen
        for (let key of this.keys) {
            if (x >= key.x && x <= key.x + key.width &&
                y >= key.y && y <= key.y + key.height) {
                
                const noteId = `${key.note}-${key.freq}`;
                
                // Verhindere mehrfaches Abspielen derselben Note
                if (!this.activeNotes.has(noteId)) {
                    this.activeNotes.add(noteId);
                    key.pressed = true;
                    
                    setTimeout(() => {
                        key.pressed = false;
                        if (!touchId) {
                            this.activeNotes.delete(noteId);
                        }
                    }, 200);
                    
                    this.playNote(key.freq, this.currentInstrument);
                    this.createNoteParticles(x, y, key.color);
                    this.createFlyingNote(x, y, key.emoji || key.note);
                }
                return;
            }
        }
    }
    
    playNote(frequency, instrument) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            
            // Instrumenten-spezifische Wellenformen
            switch(instrument) {
                case 'piano':
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    break;
                case 'guitar':
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                    break;
                case 'drums':
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    break;
                case 'xylophone':
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    break;
            }
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    }
    
    playClickSound() {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio nicht unterstützt
        }
    }
    
    createNoteParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: 3 + Math.random() * 4
            });
        }
    }
    
    createSwitchParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: 4 + Math.random() * 5
            });
        }
    }
    
    createFlyingNote(x, y, text) {
        this.notes.push({
            x: x,
            y: y,
            text: text,
            life: 1,
            vy: -2
        });
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    render() {
        // Hintergrund mit Verlauf
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0e7ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Musikalische Dekoration im Hintergrund
        this.ctx.globalAlpha = 0.1;
        this.ctx.font = '60px Arial';
        for (let i = 0; i < 8; i++) {
            this.ctx.fillText('♪', 50 + i * 100, 150 + Math.sin(Date.now() * 0.001 + i) * 20);
            this.ctx.fillText('♫', 80 + i * 100, 180 + Math.cos(Date.now() * 0.001 + i) * 20);
        }
        this.ctx.globalAlpha = 1;
        
        // Titel
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 36px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎵 Musik machen 🎵', this.canvas.width / 2, 40);
        this.ctx.restore();
        
        // Instrument-Buttons zeichnen
        for (let button of this.instrumentButtons) {
            this.drawInstrumentButton(button);
        }
        
        // Aktives Instrument Name
        const activeInstrument = this.instruments.find(i => i.id === this.currentInstrument);
        this.ctx.save();
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Aktuell: ${activeInstrument.name} ${activeInstrument.emoji}`, this.canvas.width / 2, 160);
        this.ctx.restore();
        
        // Tasten/Instrumente zeichnen
        for (let key of this.keys) {
            this.drawKey(key);
        }
        
        // Partikel zeichnen
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
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
        
        // Fliegende Noten zeichnen
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.y += note.vy;
            note.life -= 0.01;
            
            if (note.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = note.life;
                this.ctx.font = 'bold 32px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = '#1e293b';
                this.ctx.fillText(note.text, note.x, note.y);
                this.ctx.restore();
            } else {
                this.notes.splice(i, 1);
            }
        }
    }
    
    drawInstrumentButton(button) {
        this.ctx.save();
        
        const isActive = button.id === this.currentInstrument;
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = isActive ? 20 : 10;
        this.ctx.shadowOffsetY = 5;
        
        // Button-Hintergrund
        const gradient = this.ctx.createLinearGradient(
            button.x, button.y,
            button.x, button.y + button.height
        );
        gradient.addColorStop(0, this.lightenColor(button.color, 20));
        gradient.addColorStop(1, button.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(button.x, button.y, button.width, button.height, 15);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Aktiver Rand
        if (isActive) {
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Emoji
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(button.emoji, button.x + button.width / 2, button.y + button.height / 2 - 5);
        
        // Name
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(button.name, button.x + button.width / 2, button.y + button.height - 12);
        
        this.ctx.restore();
    }
    
    drawKey(key) {
        this.ctx.save();
        
        const scale = key.pressed ? 0.95 : 1;
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = key.pressed ? 5 : 15;
        this.ctx.shadowOffsetY = key.pressed ? 2 : 8;
        
        // Taste mit Verlauf
        const gradient = this.ctx.createLinearGradient(
            key.x, key.y,
            key.x, key.y + key.height
        );
        gradient.addColorStop(0, this.lightenColor(key.color, 30));
        gradient.addColorStop(1, key.color);
        
        this.ctx.fillStyle = gradient;
        
        const centerX = key.x + key.width / 2;
        const centerY = key.y + key.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-centerX, -centerY);
        
        if (this.currentInstrument === 'drums') {
            // Runde Drums
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, key.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // Emoji auf Drum
            if (key.emoji) {
                this.ctx.font = `${key.width * 0.4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillText(key.emoji, centerX, centerY);
            }
        } else {
            // Rechteckige Tasten
            this.ctx.beginPath();
            this.ctx.roundRect(key.x, key.y, key.width, key.height, 10);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // Notennamen
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(key.note, centerX, centerY);
        
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
}


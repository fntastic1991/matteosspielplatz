// game_music.js - 🌌 COSMIC Musik-Spiel
import { audioManager } from './audio_utils.js';

export class MusicGame {
    constructor() {
        this.isRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.onExit = null;
        
        this.currentInstrument = 'piano';
        this.keys = [];
        this.particles = [];
        this.flyingNotes = [];
        this.stars = [];
        this.time = 0;
        
        this.instruments = [
            { id: 'piano', name: '🎹', color: '#00ffff' },
            { id: 'drums', name: '🥁', color: '#ff00ff' },
            { id: 'xylophone', name: '🎵', color: '#ffff00' }
        ];
    }
    
    async start(ctx, onExit) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.onExit = onExit;
        this.isRunning = true;
        this.particles = [];
        this.flyingNotes = [];
        this.time = 0;
        
        this.generateStars();
        this.setupInstrument();
        
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick);
        
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.04
            });
        }
    }
    
    setupInstrument() {
        this.keys = [];
        
        if (this.currentInstrument === 'piano') {
            const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
            const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
            const keyWidth = (this.canvas.width - 50) / notes.length;
            const keyHeight = 180;
            const startY = this.canvas.height - keyHeight - 50;
            
            for (let i = 0; i < notes.length; i++) {
                const hue = (i / notes.length) * 300;
                this.keys.push({
                    x: 25 + i * keyWidth,
                    y: startY,
                    width: keyWidth - 8,
                    height: keyHeight,
                    note: notes[i],
                    frequency: frequencies[i],
                    color: `hsl(${hue}, 100%, 50%)`,
                    glow: `hsl(${hue}, 100%, 60%)`,
                    pressed: false,
                    pressAnim: 0,
                    glowAnim: Math.random() * Math.PI * 2
                });
            }
        } else if (this.currentInstrument === 'drums') {
            const drums = [
                { name: '🥁', freq: 100, color: '#ff0055' },
                { name: '🔔', freq: 800, color: '#00ffff' },
                { name: '🎵', freq: 400, color: '#00ff88' },
                { name: '⚡', freq: 200, color: '#ffff00' }
            ];
            const drumSize = 90;
            const spacing = 30;
            const totalWidth = drums.length * drumSize + (drums.length - 1) * spacing;
            const startX = (this.canvas.width - totalWidth) / 2;
            const startY = this.canvas.height - 200;
            
            for (let i = 0; i < drums.length; i++) {
                this.keys.push({
                    x: startX + i * (drumSize + spacing),
                    y: startY,
                    width: drumSize,
                    height: drumSize,
                    note: drums[i].name,
                    frequency: drums[i].freq,
                    color: drums[i].color,
                    glow: drums[i].color,
                    isDrum: true,
                    pressed: false,
                    pressAnim: 0,
                    glowAnim: Math.random() * Math.PI * 2
                });
            }
        } else if (this.currentInstrument === 'xylophone') {
            const notes = ['C', 'D', 'E', 'F', 'G', 'A'];
            const frequencies = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00];
            const barWidth = (this.canvas.width - 80) / notes.length;
            const startY = this.canvas.height - 220;
            
            for (let i = 0; i < notes.length; i++) {
                const barHeight = 140 - i * 12;
                const hue = (i / notes.length) * 300;
                this.keys.push({
                    x: 40 + i * barWidth,
                    y: startY + (140 - barHeight) / 2,
                    width: barWidth - 15,
                    height: barHeight,
                    note: notes[i],
                    frequency: frequencies[i],
                    color: `hsl(${hue}, 100%, 50%)`,
                    glow: `hsl(${hue}, 100%, 60%)`,
                    isBar: true,
                    pressed: false,
                    pressAnim: 0,
                    glowAnim: Math.random() * Math.PI * 2
                });
            }
        }
    }
    
    handleClick = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        // Instrument wechseln
        const instY = 100;
        const instSpacing = 80;
        const startX = (this.canvas.width - this.instruments.length * instSpacing) / 2;
        
        for (let i = 0; i < this.instruments.length; i++) {
            const instX = startX + i * instSpacing;
            if (x >= instX && x <= instX + 60 && y >= instY - 30 && y <= instY + 30) {
                this.currentInstrument = this.instruments[i].id;
                this.setupInstrument();
                this.createSwitchParticles(instX + 30, instY);
                return;
            }
        }
        
        // Tasten spielen
        for (let key of this.keys) {
            if (x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height) {
                this.playKey(key);
                break;
            }
        }
    }
    
    playKey(key) {
        key.pressed = true;
        key.pressAnim = 1;
        
        audioManager.playNote(key.frequency, this.currentInstrument === 'drums' ? 'square' : 'sine', 0.3);
        this.createNoteParticles(key.x + key.width / 2, key.y);
        this.createFlyingNote(key.x + key.width / 2, key.y, key.color);
        
        setTimeout(() => {
            key.pressed = false;
        }, 150);
    }
    
    createNoteParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff00ff', '#00ffff', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 4 + Math.random() * 4
            });
        }
    }
    
    createSwitchParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: '#ffffff',
                size: 3 + Math.random() * 3
            });
        }
    }
    
    createFlyingNote(x, y, color) {
        const notes = ['♪', '♫', '♬', '🎵', '🎶'];
        this.flyingNotes.push({
            x, y,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 - Math.random() * 2,
            note: notes[Math.floor(Math.random() * notes.length)],
            color,
            life: 1,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
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
        gradient.addColorStop(0, '#0a0030');
        gradient.addColorStop(0.5, '#150050');
        gradient.addColorStop(1, '#0a0030');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sterne
        for (let star of this.stars) {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Nebel
        this.ctx.save();
        this.ctx.globalAlpha = 0.08;
        const nebulaX = this.canvas.width / 2 + Math.sin(this.time * 0.3) * 50;
        const nebulaY = this.canvas.height * 0.4;
        const nebulaGrad = this.ctx.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, 300);
        nebulaGrad.addColorStop(0, '#ff00ff');
        nebulaGrad.addColorStop(0.5, '#8800ff');
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Titel
        this.ctx.save();
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.font = 'bold 32px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎹 Cosmic Music! 🎹', this.canvas.width / 2, 45);
        this.ctx.restore();
        
        // Instrument Auswahl
        const instY = 100;
        const instSpacing = 80;
        const startX = (this.canvas.width - this.instruments.length * instSpacing) / 2;
        
        for (let i = 0; i < this.instruments.length; i++) {
            const inst = this.instruments[i];
            const instX = startX + i * instSpacing;
            const isActive = this.currentInstrument === inst.id;
            
            this.ctx.save();
            
            if (isActive) {
                this.ctx.shadowColor = inst.color;
                this.ctx.shadowBlur = 20;
            }
            
            // Button
            const btnGrad = this.ctx.createLinearGradient(instX, instY - 25, instX, instY + 25);
            if (isActive) {
                btnGrad.addColorStop(0, inst.color);
                btnGrad.addColorStop(1, this.darkenColor(inst.color, 0.4));
            } else {
                btnGrad.addColorStop(0, '#333');
                btnGrad.addColorStop(1, '#111');
            }
            
            this.ctx.fillStyle = btnGrad;
            this.ctx.beginPath();
            this.ctx.roundRect(instX, instY - 25, 60, 50, 12);
            this.ctx.fill();
            
            this.ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Emoji
            this.ctx.shadowBlur = 0;
            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(inst.name, instX + 30, instY);
            
            this.ctx.restore();
        }
        
        // Tasten/Drums/Xylophone
        for (let key of this.keys) {
            this.ctx.save();
            
            key.glowAnim += 0.04;
            if (key.pressAnim > 0) key.pressAnim -= 0.1;
            
            const glowIntensity = key.pressed ? 30 : (12 + Math.sin(key.glowAnim) * 6);
            const pressOffset = key.pressAnim * 5;
            
            this.ctx.shadowColor = key.glow;
            this.ctx.shadowBlur = glowIntensity;
            
            const grad = this.ctx.createLinearGradient(key.x, key.y, key.x, key.y + key.height);
            grad.addColorStop(0, this.lightenColor(key.color, 0.3));
            grad.addColorStop(0.5, key.color);
            grad.addColorStop(1, this.darkenColor(key.color, 0.3));
            
            this.ctx.fillStyle = grad;
            
            if (key.isDrum) {
                // Drum
                this.ctx.beginPath();
                this.ctx.arc(key.x + key.width / 2, key.y + key.height / 2 + pressOffset, key.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                // Emoji
                this.ctx.shadowBlur = 0;
                this.ctx.font = `${key.width * 0.5}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(key.note, key.x + key.width / 2, key.y + key.height / 2 + pressOffset);
            } else {
                // Piano/Xylophone Taste
                this.ctx.beginPath();
                this.ctx.roundRect(key.x, key.y + pressOffset, key.width, key.height, key.isBar ? 8 : [8, 8, 15, 15]);
                this.ctx.fill();
                
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Highlight
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                this.ctx.beginPath();
                this.ctx.roundRect(key.x + 5, key.y + pressOffset + 5, key.width - 10, key.height * 0.3, 5);
                this.ctx.fill();
                
                // Note
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 18px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(key.note, key.x + key.width / 2, key.y + key.height - 20 + pressOffset);
            }
            
            this.ctx.restore();
        }
        
        // Fliegende Noten
        for (let i = this.flyingNotes.length - 1; i >= 0; i--) {
            const note = this.flyingNotes[i];
            note.x += note.vx;
            note.y += note.vy;
            note.rotation += note.rotationSpeed;
            note.life -= 0.015;
            
            if (note.life > 0) {
                this.ctx.save();
                this.ctx.translate(note.x, note.y);
                this.ctx.rotate(note.rotation);
                this.ctx.globalAlpha = note.life;
                this.ctx.shadowColor = note.color;
                this.ctx.shadowBlur = 15;
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(note.note, 0, 0);
                this.ctx.restore();
            } else {
                this.flyingNotes.splice(i, 1);
            }
        }
        
        // Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.025;
            
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
        
        // Anleitung
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Tippe auf die Tasten! 🎵', this.canvas.width / 2, 160);
        this.ctx.restore();
    }
    
    lightenColor(color, factor) {
        if (color.startsWith('hsl')) {
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                const h = parseInt(match[1]);
                const s = parseInt(match[2]);
                const l = Math.min(100, parseInt(match[3]) + factor * 50);
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        }
        if (color.startsWith('#')) {
            const num = parseInt(color.replace('#', ''), 16);
            const r = Math.min(255, ((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * factor);
            const g = Math.min(255, ((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * factor);
            const b = Math.min(255, (num & 255) + (255 - (num & 255)) * factor);
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
        return color;
    }
    
    darkenColor(color, factor) {
        if (color.startsWith('hsl')) {
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                const h = parseInt(match[1]);
                const s = parseInt(match[2]);
                const l = Math.max(0, parseInt(match[3]) - factor * 50);
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        }
        if (color.startsWith('#')) {
            const num = parseInt(color.replace('#', ''), 16);
            const r = Math.floor(((num >> 16) & 255) * (1 - factor));
            const g = Math.floor(((num >> 8) & 255) * (1 - factor));
            const b = Math.floor((num & 255) * (1 - factor));
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
}

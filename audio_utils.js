// audio_utils.js - Zentrale Audio-Verwaltung für alle Spiele

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isUnlocked = false;
    }
    
    // Initialisiere den AudioContext (nur einmal)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 AudioContext erstellt, Status:', this.audioContext.state);
            
            // Versuche AudioContext zu entsperren
            this.unlock();
        }
        return this.audioContext;
    }
    
    // Entsperre AudioContext (iOS/Safari benötigen User-Interaktion)
    unlock() {
        if (this.isUnlocked) return Promise.resolve();
        
        const unlockAudio = () => {
            if (!this.audioContext) {
                this.init();
            }
            
            if (this.audioContext.state === 'suspended') {
                console.log('🔊 Versuche AudioContext zu entsperren...');
                
                this.audioContext.resume().then(() => {
                    console.log('✅ AudioContext entsperrt! Status:', this.audioContext.state);
                    this.isUnlocked = true;
                    
                    // Spiele stummen Ton zur Aktivierung (wichtig für iOS)
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    gainNode.gain.value = 0.001;
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(0);
                    oscillator.stop(0.001);
                }).catch(err => {
                    console.error('❌ AudioContext konnte nicht entsperrt werden:', err);
                });
            } else {
                this.isUnlocked = true;
                console.log('✅ AudioContext bereits aktiv');
            }
        };
        
        // Event-Listener für erste User-Interaktion
        const events = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, unlockAudio, { once: true });
        });
    }
    
    // Stelle sicher, dass AudioContext läuft
    async ensureRunning() {
        if (!this.audioContext) {
            this.init();
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log('⚠️ AudioContext suspended, versuche resume...');
            try {
                await this.audioContext.resume();
                console.log('✅ AudioContext resumed');
            } catch (err) {
                console.error('❌ Resume fehlgeschlagen:', err);
            }
        }
    }
    
    // Spiele einen Ton mit gegebenen Parametern
    async playSound({ frequency = 440, type = 'sine', duration = 0.3, volume = 0.3, rampDown = true }) {
        try {
            await this.ensureRunning();
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(volume, now);
            
            if (rampDown) {
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            }
            
            oscillator.start(now);
            oscillator.stop(now + duration);
            
        } catch (err) {
            console.error('Fehler beim Sound abspielen:', err);
        }
    }
    
    // Spezielle Sound-Funktionen für häufig verwendete Sounds
    async playSuccessSound() {
        await this.playSound({
            frequency: 523.25, // C5
            type: 'sine',
            duration: 0.3,
            volume: 0.3
        });
    }
    
    async playErrorSound() {
        await this.playSound({
            frequency: 165, // E3
            type: 'sawtooth',
            duration: 0.3,
            volume: 0.2
        });
    }
    
    async playClickSound() {
        await this.playSound({
            frequency: 600,
            type: 'sine',
            duration: 0.1,
            volume: 0.2
        });
    }
    
    async playJumpSound() {
        await this.playSound({
            frequency: 400,
            type: 'square',
            duration: 0.15,
            volume: 0.25
        });
    }
    
    async playScoreSound() {
        await this.playSound({
            frequency: 800,
            type: 'sine',
            duration: 0.15,
            volume: 0.25
        });
    }
    
    async playGameOverSound() {
        await this.playSound({
            frequency: 150,
            type: 'sawtooth',
            duration: 0.5,
            volume: 0.2
        });
    }
    
    async playPopSound() {
        await this.playSound({
            frequency: 300,
            type: 'sine',
            duration: 0.1,
            volume: 0.3
        });
    }
    
    async playFlipSound() {
        await this.playSound({
            frequency: 400,
            type: 'square',
            duration: 0.1,
            volume: 0.2
        });
    }
    
    // Für Musik-Spiel: Spiele eine Note mit Instrument
    async playNote(frequency, instrument = 'piano') {
        try {
            await this.ensureRunning();
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            
            const now = this.audioContext.currentTime;
            
            // Instrumenten-spezifische Wellenformen
            switch(instrument) {
                case 'piano':
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    break;
                case 'guitar':
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                    break;
                case 'drums':
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.4, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    break;
                case 'xylophone':
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    break;
            }
            
            oscillator.start(now);
            oscillator.stop(now + 1);
        } catch (err) {
            console.error('Fehler beim Note abspielen:', err);
        }
    }
    
    // Get AudioContext für erweiterte Nutzung
    getContext() {
        if (!this.audioContext) {
            this.init();
        }
        return this.audioContext;
    }
}

// Exportiere eine Singleton-Instanz
export const audioManager = new AudioManager();

// Initialisiere beim Laden
audioManager.init();


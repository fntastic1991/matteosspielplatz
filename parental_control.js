// parental_control.js - Kinderschutz-System

class ParentalControl {
    constructor() {
        this.PIN_CODE = '2552';
        this.selectedMinutes = 0;
        this.remainingSeconds = 0;
        this.timerInterval = null;
        this.isTimerRunning = false;
        
        this.currentPuzzle = null;
        this.isCheckingAnswer = false; // Verhindert mehrfaches Klicken
        
        this.init();
    }
    
    init() {
        // Audio beim ersten Klick aktivieren (wichtig für Browser-Policy)
        document.addEventListener('click', () => {
            if (window.audioManager) {
                window.audioManager.init();
                window.audioManager.ensureRunning().catch(e => console.log('Audio-Init:', e));
            }
        }, { once: true });
        
        // Event Listener für PIN-Eingabe
        const pinInput = document.getElementById('pin-input');
        const pinSubmit = document.getElementById('pin-submit');
        
        pinSubmit.addEventListener('click', () => this.checkPIN());
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkPIN();
            }
        });
        
        // Focus auf PIN-Input
        pinInput.focus();
        
        // Event Listener für Zeitauswahl
        document.querySelectorAll('.time-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const minutes = parseInt(btn.dataset.minutes);
                this.selectTime(minutes);
            });
        });
        
        // Start-Button
        document.getElementById('start-play-button').addEventListener('click', () => {
            this.startPlaySession();
        });
        
        // Eltern fragen Button
        document.getElementById('ask-parent-button').addEventListener('click', () => {
            this.showPuzzle();
        });
    }
    
    checkPIN() {
        const input = document.getElementById('pin-input');
        const error = document.getElementById('pin-error');
        
        if (input.value === this.PIN_CODE) {
            // Korrekter PIN
            error.textContent = '';
            input.value = '';
            this.showParentDashboard();
        } else {
            // Falscher PIN
            error.textContent = '❌ Falscher Code! Versuche es nochmal.';
            input.value = '';
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        }
    }
    
    showParentDashboard() {
        this.hideAllScreens();
        document.getElementById('parent-screen').classList.add('active');
    }
    
    selectTime(minutes) {
        this.selectedMinutes = minutes;
        
        // Alle Buttons deaktivieren
        document.querySelectorAll('.time-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Ausgewählten Button markieren
        document.querySelector(`[data-minutes="${minutes}"]`).classList.add('selected');
        
        // Start-Button aktivieren
        document.getElementById('start-play-button').disabled = false;
        
        // Anzeige aktualisieren
        document.getElementById('selected-time-text').textContent = 
            `✅ ${minutes} Minuten ausgewählt`;
    }
    
    startPlaySession() {
        this.remainingSeconds = this.selectedMinutes * 60;
        this.isTimerRunning = true;
        
        // Zum Menü wechseln
        this.hideAllScreens();
        document.getElementById('menu').classList.add('active');
        
        // Timer starten
        this.startTimer();
    }
    
    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            this.updateTimerDisplay();
            
            // Warnung bei 1 Minute
            if (this.remainingSeconds === 60) {
                this.showTimeWarning();
            }
            
            // Zeit abgelaufen
            if (this.remainingSeconds <= 0) {
                this.timeExpired();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timeElement = document.getElementById('time-remaining-value');
        if (timeElement) {
            timeElement.textContent = display;
            
            // Farbe ändern bei wenig Zeit
            if (this.remainingSeconds <= 60) {
                timeElement.style.color = '#ef4444';
                timeElement.style.fontWeight = 'bold';
            } else {
                timeElement.style.color = '#1e293b';
                timeElement.style.fontWeight = 'normal';
            }
        }
    }
    
    showTimeWarning() {
        // Visueller Hinweis dass nur noch 1 Minute bleibt
        const timeElement = document.getElementById('time-remaining-value');
        if (timeElement) {
            timeElement.classList.add('pulse');
            setTimeout(() => timeElement.classList.remove('pulse'), 1000);
        }
    }
    
    timeExpired() {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;
        
        // Spiel stoppen falls aktiv
        if (window.gameApp && window.gameApp.currentGame) {
            window.gameApp.currentGame.stop();
        }
        
        // Timeout-Screen anzeigen
        this.hideAllScreens();
        document.getElementById('timeout-screen').classList.add('active');
    }
    
    showPuzzle() {
        this.hideAllScreens();
        document.getElementById('puzzle-screen').classList.add('active');
        
        // Neues Rätsel generieren
        this.generatePuzzle();
    }
    
    generatePuzzle() {
        const puzzleTypes = ['addition', 'subtraction', 'largest', 'smallest'];
        const type = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];
        
        const questionDiv = document.getElementById('puzzle-question');
        const answersDiv = document.getElementById('puzzle-answers');
        const errorDiv = document.getElementById('puzzle-error');
        
        answersDiv.innerHTML = '';
        errorDiv.textContent = '';
        
        let question, correctAnswer, answers;
        
        if (type === 'addition') {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            question = `Was ist ${a} + ${b}?`;
            correctAnswer = a + b;
            answers = this.generateNumberAnswers(correctAnswer, 4);
            
        } else if (type === 'subtraction') {
            const a = Math.floor(Math.random() * 15) + 5;
            const b = Math.floor(Math.random() * (a - 1)) + 1;
            question = `Was ist ${a} − ${b}?`;
            correctAnswer = a - b;
            answers = this.generateNumberAnswers(correctAnswer, 4);
            
        } else if (type === 'largest') {
            answers = [];
            for (let i = 0; i < 4; i++) {
                answers.push(Math.floor(Math.random() * 20) + 1);
            }
            correctAnswer = Math.max(...answers);
            question = `Tippe auf die grösste Zahl:`;
            
        } else { // smallest
            answers = [];
            for (let i = 0; i < 4; i++) {
                answers.push(Math.floor(Math.random() * 20) + 1);
            }
            correctAnswer = Math.min(...answers);
            question = `Tippe auf die kleinste Zahl:`;
        }
        
        this.currentPuzzle = { correctAnswer };
        questionDiv.textContent = question;
        
        // Antwort-Buttons erstellen
        this.shuffleArray(answers);
        answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.className = 'puzzle-answer-button';
            btn.textContent = answer;
            btn.addEventListener('click', () => this.checkPuzzleAnswer(answer));
            answersDiv.appendChild(btn);
        });
    }
    
    generateNumberAnswers(correct, count) {
        const answers = [correct];
        while (answers.length < count) {
            const offset = Math.floor(Math.random() * 6) - 3; // -3 bis +3
            const candidate = correct + offset;
            if (candidate > 0 && !answers.includes(candidate)) {
                answers.push(candidate);
            }
        }
        return answers;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    checkPuzzleAnswer(answer) {
        // Verhindere mehrfaches Klicken während der Überprüfung
        if (this.isCheckingAnswer) {
            return;
        }
        this.isCheckingAnswer = true;
        
        const errorDiv = document.getElementById('puzzle-error');
        
        // WICHTIG: Alle Buttons sofort deaktivieren, damit nicht weiter geklickt werden kann
        const answerButtons = document.querySelectorAll('.puzzle-answer-button');
        answerButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        if (answer === this.currentPuzzle.correctAnswer) {
            // Richtige Antwort
            errorDiv.textContent = '✅ Richtig!';
            errorDiv.style.color = '#10b981';
            
            setTimeout(() => {
                this.isCheckingAnswer = false;
                this.showParentDashboard();
            }, 1000);
            
        } else {
            // Falsche Antwort - SOFORT neues Rätsel generieren
            errorDiv.textContent = '❌ Falsch! Neue Aufgabe...';
            errorDiv.style.color = '#ef4444';
            
            // Sehr kurze Wartezeit, dann sofort neue Aufgabe
            setTimeout(() => {
                this.isCheckingAnswer = false;
                this.generatePuzzle();
            }, 800);
        }
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    isPlayTimeActive() {
        return this.isTimerRunning;
    }
}

// Instanz erstellen
const parentalControl = new ParentalControl();
window.parentalControl = parentalControl;


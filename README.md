# 🎮 Matteo's Spielplatz

Eine kinderfreundliche Lern-App mit 10 verschiedenen Spielen für Kinder ab 4 Jahren.

![App Icon](https://i.postimg.cc/dQr5ZBY0/Chat-GPT-Image-2-Nov-2025-08-57-55.png)

## 🎯 Features

### 10 Lustige Spiele
1. **🎨 Farben finden** - Finde alle gleichen Farben
2. **🎈 Ballons platzen** - Platze so viele Ballons wie möglich
3. **🔺 Formen sortieren** - Ziehe Formen an den richtigen Ort
4. **🌀 Labyrinth-Pfad** - Finde den Weg durch 10 Level
5. **🎴 Memory-Farben** - Klassisches Memory mit bunten Karten
6. **🔍 Finde den Unterschied** - Erkenne welche Form anders ist
7. **🔢 Zahlen entdecken** - Tippe Zahlen in der richtigen Reihenfolge
8. **🐾 Tiere zählen** - Zähle die Tiere richtig
9. **🦘 Spring über Blöcke** - Klassischer 2D-Plattformer
10. **🎵 Musik machen** - Spiele Klavier, Gitarre, Schlagzeug & Xylophon

### 🔒 Kinderschutz-System
- **PIN-Schutz** (Code: 2552)
- **Zeitlimit** einstellbar (5, 10, 15, 30 Minuten)
- **Countdown-Timer** während des Spielens
- **Eltern-Rätsel** nach Ablauf der Zeit
- Automatische Spielpause bei Zeitablauf

### 📱 Progressive Web App (PWA)
- **Offline-fähig** - Funktioniert ohne Internet
- **Installierbar** - Kann zum Home-Screen hinzugefügt werden
- **Vollbild-Modus** - Keine Browser-UI
- **Nur Querformat** - Optimiert für Tablets und Handys im Landscape-Modus

### 🎨 Design
- Kinderfreundliche, bunte Oberfläche
- Große, leicht bedienbare Buttons
- Animationen und Soundeffekte
- Pastel-Farben und weiche Schatten
- Responsive Design

## 🚀 Installation

### Option 1: Direkt im Browser
Öffne einfach die `index.html` in einem modernen Browser.

### Option 2: Als PWA installieren
1. Öffne die App im Browser
2. Klicke auf "Zum Home-Screen hinzufügen"
3. Die App verhält sich wie eine native App

### Option 3: Lokaler Server
```bash
# Python 3
python3 -m http.server 8000

# oder Node.js
npx serve
```

Dann öffne `http://localhost:8000`

## 🛠️ Technologie

- **HTML5** - Struktur
- **CSS3** - Styling mit modernen Features
- **Vanilla JavaScript** - Keine Frameworks
- **HTML5 Canvas** - Spiele-Rendering
- **Web Audio API** - Sounds und Musik
- **Service Worker** - Offline-Support
- **Web App Manifest** - PWA-Funktionalität

## 📂 Projektstruktur

```
Kinderspiel/
├── index.html              # Hauptdatei
├── style.css              # Alle Styles
├── main.js                # App-Controller
├── parental_control.js    # Kinderschutz-System
├── service-worker.js      # Offline-Caching
├── manifest.json          # PWA-Manifest
├── game_colors.js         # Farben-Spiel
├── game_balloons.js       # Ballons-Spiel
├── game_shapes.js         # Formen-Spiel
├── game_maze.js           # Labyrinth-Spiel
├── game_memory.js         # Memory-Spiel
├── game_oddone.js         # Unterschied-Spiel
├── game_numbers.js        # Zahlen-Spiel
├── game_counting.js       # Zähl-Spiel
├── game_jumping.js        # Jump-Spiel
└── game_music.js          # Musik-Spiel
```

## 🔐 Kinderschutz

Der Eltern-Code ist **2552**. Dieser wird beim ersten Start benötigt und kann verwendet werden um:
- Spielzeit einzustellen
- Die App zu entsperren
- Nach Zeitablauf wieder Zugang zu gewähren

## 🎮 Steuerung

- **Maus/Touch** - Alle Spiele sind touch-optimiert
- **Querformat** - App funktioniert nur im Landscape-Modus
- **Zurück-Button** - Immer verfügbar zum Hauptmenü

## 🌐 Browser-Kompatibilität

- ✅ Chrome/Chromium (empfohlen)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Edge

Mindestanforderung: Moderner Browser mit ES6-Support

## 📝 Lizenz

Dieses Projekt ist für private Zwecke erstellt.

## 👨‍💻 Entwicklung

Erstellt mit ❤️ für Matteo

---

**Viel Spass beim Spielen! 🎉**


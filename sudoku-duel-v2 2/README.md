# 🎮 Sudoku Duel — Multiplayer Sudoku Battle

Real-time multiplayer Sudoku where the first player to solve the puzzle wins.

## Tech Stack
- **Backend**: Node.js + Socket.io (WebSockets)
- **Frontend**: Vanilla HTML/CSS/JS
- **Hosting**: Railway (free tier)

---

## 🚀 Deploy to Railway (Free) — Step by Step

### Step 1 — Push to GitHub
1. Go to https://github.com and create a new repository (e.g. `sudoku-duel`)
2. Upload all project files (or use git):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/sudoku-duel.git
   git push -u origin main
   ```

### Step 2 — Deploy on Railway
1. Go to https://railway.app and sign up (free, no credit card needed)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub account and select `sudoku-duel`
4. Railway auto-detects Node.js and runs `npm start`
5. Wait ~1 minute for deployment

### Step 3 — Get Your Public URL
1. Click on your project → **"Settings"** → **"Domains"**
2. Click **"Generate Domain"**
3. You get a URL like: `https://sudoku-duel-production.up.railway.app`
4. **Share this URL with friends — anyone can join from anywhere!**

---

## 🎮 How to Play
1. Open the URL in your browser
2. Enter your name
3. **Host**: Click "Create Room" → share the 4-letter code
4. **Friends**: Enter the code → click "Join Room"
5. Host clicks "Start Game" (need 2+ players)
6. Everyone gets the same puzzle — first to finish wins! 🏆

## ⌨️ Keyboard Shortcuts (in game)
- **1-9** — fill number
- **Backspace/Delete** — erase
- **Arrow keys** — navigate cells
- **N** — toggle notes mode

---

## 🛠 Run Locally
```bash
npm install
npm start
# Open http://localhost:3000
# Open another tab to play with yourself!
```

## 📁 Project Structure
```
sudoku-duel/
├── server.js          # Node.js + Socket.io backend
├── package.json       # Dependencies
├── .gitignore
└── public/
    └── index.html     # Full frontend (single file)
```

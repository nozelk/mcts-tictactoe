# MCTS Tic-Tac-Toe Visualization

Interactive visualization of the Monte Carlo Tree Search (MCTS) algorithm for Tic-Tac-Toe.

🎮 **[Live Demo](https://nozelk.github.io/mcts-tictactoe/)**

## Features

- Step-by-step MCTS algorithm visualization
- Interactive game board - play against the AI
- Multiple themes (Dark, Light, Blue, Forest, Sunset, Purple, Ocean, Glass)
- Multi-language support (Slovenian, English, German)
- UCB1 calculator with live formula display
- Adjustable iteration count (50-1000+)

## How MCTS Works

MCTS has 4 phases in each iteration:

1. **Selection** 🔴 - Navigate tree using UCB1 formula
2. **Expansion** 🟢 - Add new node (possible move)
3. **Simulation** 🔵 - Play random game to the end
4. **Backpropagation** 🟣 - Update statistics back to root

### UCB1 Formula

$$UCB1 = \frac{w_i}{n_i} + \sqrt{\frac{2 \ln N}{n_i}}$$

Where:
- $w_i$ = wins for the node
- $n_i$ = visits for the node
- $N$ = visits for the parent node

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, HTML5 Canvas
- **Backend**: Python 3, Bottle
- **Hosting**: GitHub Pages (frontend), Render (backend)

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```
Runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:3000`

## Project Structure

```
├── backend/
│   ├── app.py          # API server
│   ├── mcts.py         # MCTS algorithm
│   ├── tictactoe.py    # Game logic
│   └── tree.py         # Tree data structure
│
└── frontend/
    └── src/
        ├── components/
        │   ├── GameBoard.tsx
        │   ├── ControlPanel.tsx
        │   ├── StartScreen.tsx
        │   └── TreeVisualization.tsx
        ├── App.tsx
        └── styles.css
```

## Credits

Based on [vgarciasc/mcts-viz](https://github.com/vgarciasc/mcts-viz)

## License

MIT

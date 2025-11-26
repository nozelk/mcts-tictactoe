# MCTS Tic-Tac-Toe Vizualizacija

Vizualizacija algoritma Monte Carlo Tree Search (MCTS) za igro Tic-Tac-Toe.

## Struktura projekta

```
MCSTtsx/
├── backend/          # Python Bottle API
│   ├── app.py        # Glavni strežnik
│   ├── mcts.py       # MCTS algoritem
│   ├── tictactoe.py  # Logika igre
│   ├── tree.py       # Drevesna struktura
│   └── requirements.txt
│
└── frontend/         # React TypeScript aplikacija
    ├── src/
    │   ├── components/
    │   │   ├── GameBoard.tsx
    │   │   ├── ControlPanel.tsx
    │   │   └── TreeVisualization.tsx
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── types.ts
    │   ├── tree.ts
    │   ├── api.ts
    │   └── styles.css
    ├── package.json
    └── vite.config.ts
```

## Zagon

### 1. Backend (Python Bottle)

```powershell
cd backend

# Ustvari virtualno okolje (opcijsko)
python -m venv venv
.\venv\Scripts\Activate

# Namesti odvisnosti
pip install -r requirements.txt

# Zaženi strežnik
python app.py
```

Backend teče na `http://localhost:8080`

### 2. Frontend (React + Vite)

```powershell
cd frontend

# Namesti odvisnosti
npm install

# Zaženi razvojni strežnik
npm run dev
```

Frontend teče na `http://localhost:3000`

## Uporaba

1. **Izberi kdo začne** - Človek ali Stroj
2. **Nastavi število iteracij** - Več iteracij = boljše odločitve MCTS
3. **Klikni "Zaženi MCTS"** - Algoritem se zažene in ustvari drevo
4. **Vizualiziraj korake**:
   - **Naslednja akcija** - Pokaže naslednji korak algoritma
   - **Naslednja iteracija** - Preskoči na naslednjo iteracijo
   - **Avto predvajanje** - Avtomatsko predvaja vse korake

## MCTS Algoritem

MCTS ima 4 faze v vsaki iteraciji:

1. **Selection (Izbira)** 🔴 - Izbere pot v drevesu z UCB1 formulo
2. **Expansion (Širitev)** 🟢 - Doda novo vozlišče (možno potezo)
3. **Simulation (Simulacija)** 🔵 - Odigra naključno igro do konca
4. **Backpropagation (Povratno širjenje)** 🟣 - Posodobi statistike nazaj do korena

### UCB1 Formula

$$UCB1 = \frac{w_i}{n_i} + \sqrt{\frac{2 \ln N}{n_i}}$$

Kjer:
- $w_i$ = število zmag vozlišča
- $n_i$ = število obiskov vozlišča
- $N$ = število obiskov starša

## Tehnologije

- **Backend**: Python 3, Bottle
- **Frontend**: React 18, TypeScript, Vite
- **Vizualizacija**: HTML5 Canvas

## Avtor

Bazirano na [vgarciasc/mcts-viz](https://github.com/vgarciasc/mcts-viz)

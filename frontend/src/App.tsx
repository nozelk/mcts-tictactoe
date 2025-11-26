import { useState, useCallback, useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { TreeVisualization } from './components/TreeVisualization';
import { ControlPanel } from './components/ControlPanel';
import { StartScreen, Theme, Language, AppMode } from './components/StartScreen';
import { MonteCarloPi } from './components/MonteCarloPi';
import { 
  BoardState, 
  Player, 
  Tree, 
  TreeNode,
  AlgAction,
  VisualizationState
} from './types';
import { 
  createTree, 
  GameNode, 
  makeDrawTree, 
  applyAction, 
  copyTree,
  getNode
} from './tree';
import { runMCTS } from './api';

const EMPTY_BOARD: BoardState = ['', '', '', '', '', '', '', '', ''];

function App() {
  // App state
  const [started, setStarted] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('mcts');
  const [gameStarted, setGameStarted] = useState(false); // After choosing who starts
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('sl');

  // Game state
  const [board, setBoard] = useState<BoardState>([...EMPTY_BOARD]);
  const [startingPlayer, setStartingPlayer] = useState<Player>('machine');
  const [iterations, setIterations] = useState(100);
  const [isRunning, setIsRunning] = useState(false);

  // MCTS visualization state
  const [visState, setVisState] = useState<VisualizationState>(VisualizationState.NONE);
  const [actionTrace, setActionTrace] = useState<AlgAction[][]>([]);
  const [finalTree, setFinalTree] = useState<Tree | null>(null);
  const [reconstructedTree, setReconstructedTree] = useState<Tree | null>(null);
  const [drawTree, setDrawTree] = useState<Tree | null>(null);
  const [currentIterationIdx, setCurrentIterationIdx] = useState(0);
  const [currentActionIdx, setCurrentActionIdx] = useState(0);
  const [totalActionsTillNow, setTotalActionsTillNow] = useState(0);
  const [bestMove, setBestMove] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('machine');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showHumanTurnPopup, setShowHumanTurnPopup] = useState(false);

  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for winner
  const checkWinner = (board: BoardState): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === 'X' ? 'machine' : 'human';
      }
    }
    if (board.every(cell => cell !== '')) return 'draw';
    return null;
  };

  // Handlers
  const handleCellClick = (index: number) => {
    if (board[index] !== '' || isRunning || gameOver) return;
    if (currentPlayer !== 'human') return; // Not human's turn
    
    const newBoard = [...board];
    newBoard[index] = 'O'; // Human is always O
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setGameOver(true);
      setWinner(result);
      return;
    }

    // Switch to machine's turn
    setCurrentPlayer('machine');
  };

  const handleIterationsSet = (value: number) => {
    setIterations(Math.max(1, Math.min(10000, value)));
  };

  const handleRunMCTS = async () => {
    // Check if it's human's turn
    if (currentPlayer === 'human') {
      setShowHumanTurnPopup(true);
      return;
    }
    
    setIsRunning(true);
    
    try {
      const result = await runMCTS(board, 'machine', iterations);
      
      // Initialize visualization
      const trace = result.trace;
      setActionTrace(trace);
      setBestMove(result.best_move);
      
      // Convert backend tree to our format
      const fTree: Tree = {
        nodes: result.tree.nodes.map((n, i) => {
          if (!n) return null;
          return {
            id: i,
            parent_id: n.parent_id,
            children_id: n.children_id,
            data: {
              move: n.data.move,
              value: n.data.value,
              simulations: n.data.simulations
            }
          } as TreeNode;
        })
      };
      setFinalTree(fTree);

      // Create reconstructed tree starting with just root
      const rTree = createTree(new GameNode(null));
      setReconstructedTree(rTree);

      // Apply first action
      if (trace.length > 0 && trace[0].length > 0) {
        applyAction(rTree, fTree, trace[0][0], 0);
      }

      const dTree = makeDrawTree(copyTree(rTree));
      setDrawTree(dTree);

      setCurrentIterationIdx(0);
      setCurrentActionIdx(0);
      setTotalActionsTillNow(0);
      setVisState(VisualizationState.VISUALIZING);

    } catch (error) {
      console.error('MCTS failed:', error);
      alert('Napaka pri zagonu MCTS. Preverite če teče backend strežnik.');
    }
    
    setIsRunning(false);
  };

  const isLastStep = useCallback(() => {
    return currentIterationIdx === actionTrace.length - 1 &&
           currentActionIdx === actionTrace[actionTrace.length - 1]?.length - 1;
  }, [currentIterationIdx, currentActionIdx, actionTrace]);

  const handleNextAction = useCallback(() => {
    if (!reconstructedTree || !finalTree || actionTrace.length === 0) return;

    if (isLastStep()) {
      setVisState(VisualizationState.LAST_STEP);
      return;
    }

    let newIterIdx = currentIterationIdx;
    let newActionIdx = currentActionIdx;
    let newTotal = totalActionsTillNow;

    if (currentActionIdx === actionTrace[currentIterationIdx].length - 1) {
      newActionIdx = 0;
      newIterIdx += 1;
      newTotal += 1;
    } else {
      newActionIdx += 1;
      newTotal += 1;
    }

    const action = actionTrace[newIterIdx][newActionIdx];
    const rTree = copyTree(reconstructedTree);
    applyAction(rTree, finalTree, action, newTotal);
    
    setReconstructedTree(rTree);
    setDrawTree(makeDrawTree(copyTree(rTree)));
    setCurrentIterationIdx(newIterIdx);
    setCurrentActionIdx(newActionIdx);
    setTotalActionsTillNow(newTotal);

  }, [reconstructedTree, finalTree, actionTrace, currentIterationIdx, currentActionIdx, totalActionsTillNow, isLastStep]);

  const handleNextIteration = useCallback(() => {
    if (!reconstructedTree || !finalTree || actionTrace.length === 0) return;

    if (isLastStep()) {
      setVisState(VisualizationState.LAST_STEP);
      return;
    }

    // Skip to end of current iteration
    let rTree = copyTree(reconstructedTree);
    let iterIdx = currentIterationIdx;
    let actionIdx = currentActionIdx;
    let total = totalActionsTillNow;

    const iteration = actionTrace[iterIdx];
    for (let i = actionIdx; i < iteration.length; i++) {
      if (i < iteration.length - 1) {
        const action = actionTrace[iterIdx][i + 1];
        total += 1;
        applyAction(rTree, finalTree, action, total);
      }
    }

    // Move to next iteration
    if (iterIdx < actionTrace.length - 1) {
      iterIdx += 1;
      actionIdx = 0;
      total += 1;
      const action = actionTrace[iterIdx][0];
      applyAction(rTree, finalTree, action, total);
    }

    setReconstructedTree(rTree);
    setDrawTree(makeDrawTree(copyTree(rTree)));
    setCurrentIterationIdx(iterIdx);
    setCurrentActionIdx(actionIdx);
    setTotalActionsTillNow(total);

  }, [reconstructedTree, finalTree, actionTrace, currentIterationIdx, currentActionIdx, totalActionsTillNow, isLastStep]);

  const handleAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
      setIsAutoPlaying(false);
      return;
    }

    setIsAutoPlaying(true);
    autoPlayRef.current = setInterval(() => {
      if (isLastStep()) {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
          autoPlayRef.current = null;
        }
        setIsAutoPlaying(false);
        setVisState(VisualizationState.LAST_STEP);
        return;
      }
      handleNextAction();
    }, 100);
  }, [handleNextAction, isLastStep]);

  const handleSkipToEnd = useCallback(() => {
    if (!reconstructedTree || !finalTree || actionTrace.length === 0) return;

    // Stop autoplay if running
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
      setIsAutoPlaying(false);
    }

    // Apply all remaining actions
    let rTree = copyTree(reconstructedTree);
    let total = totalActionsTillNow;

    for (let iterIdx = currentIterationIdx; iterIdx < actionTrace.length; iterIdx++) {
      const startActionIdx = iterIdx === currentIterationIdx ? currentActionIdx + 1 : 0;
      for (let actionIdx = startActionIdx; actionIdx < actionTrace[iterIdx].length; actionIdx++) {
        const action = actionTrace[iterIdx][actionIdx];
        total += 1;
        applyAction(rTree, finalTree, action, total);
      }
    }

    const lastIterIdx = actionTrace.length - 1;
    const lastActionIdx = actionTrace[lastIterIdx].length - 1;

    setReconstructedTree(rTree);
    setDrawTree(makeDrawTree(copyTree(rTree)));
    setCurrentIterationIdx(lastIterIdx);
    setCurrentActionIdx(lastActionIdx);
    setTotalActionsTillNow(total);
    setVisState(VisualizationState.LAST_STEP);
  }, [reconstructedTree, finalTree, actionTrace, currentIterationIdx, currentActionIdx, totalActionsTillNow]);

  const handleReset = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    
    setBoard([...EMPTY_BOARD]);
    setVisState(VisualizationState.NONE);
    setActionTrace([]);
    setFinalTree(null);
    setReconstructedTree(null);
    setDrawTree(null);
    setCurrentIterationIdx(0);
    setCurrentActionIdx(0);
    setTotalActionsTillNow(0);
    setBestMove(null);
    setCurrentPlayer(startingPlayer);
    setGameOver(false);
    setWinner(null);
    setGameStarted(false); // Show player selection popup again
  };

  // Start game with chosen player
  const handleStartGame = (player: Player) => {
    setStartingPlayer(player);
    setCurrentPlayer(player);
    setGameStarted(true);
  };

  // Make a random move for the current player
  const handleRandomMove = () => {
    if (gameOver || isRunning) return;
    
    // Find all empty cells
    const emptyCells = board
      .map((cell, index) => cell === '' ? index : -1)
      .filter(index => index !== -1);
    
    if (emptyCells.length === 0) return;
    
    // Pick a random empty cell
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    const newBoard = [...board];
    newBoard[randomIndex] = currentPlayer === 'machine' ? 'X' : 'O';
    setBoard(newBoard);
    
    const result = checkWinner(newBoard);
    if (result) {
      setGameOver(true);
      setWinner(result);
      return;
    }
    
    // Switch turns
    setCurrentPlayer(currentPlayer === 'machine' ? 'human' : 'machine');
  };

  // Make the best move (apply machine's move to board)
  const handleMakePlay = () => {
    if (bestMove === null || gameOver) return;

    const newBoard = [...board];
    newBoard[bestMove] = 'X'; // Machine is always X
    setBoard(newBoard);

    // Reset visualization state
    setVisState(VisualizationState.NONE);
    setActionTrace([]);
    setFinalTree(null);
    setReconstructedTree(null);
    setDrawTree(null);
    setCurrentIterationIdx(0);
    setCurrentActionIdx(0);
    setTotalActionsTillNow(0);
    setBestMove(null);

    const result = checkWinner(newBoard);
    if (result) {
      setGameOver(true);
      setWinner(result);
      return;
    }

    // Switch to human's turn
    setCurrentPlayer('human');
  };

  const handleNodeClick = (node: TreeNode) => {
    if (!reconstructedTree) return;

    // Find node in reconstructed tree and toggle collapse
    const rNode = getNode(reconstructedTree, node.id);
    if (rNode && rNode.data.should_show_collapse_btn) {
      rNode.data.collapsed = !rNode.data.collapsed;
      setDrawTree(makeDrawTree(copyTree(reconstructedTree)));
    }
  };

  // Calculate current action info
  const currentAction = actionTrace[currentIterationIdx]?.[currentActionIdx]?.kind || '---';
  const totalActions = actionTrace.flat().length;
  const actionProgress = `(${totalActionsTillNow}/${totalActions > 0 ? totalActions - 1 : 0})`;
  const iterationProgress = `(${currentIterationIdx}/${actionTrace.length > 0 ? actionTrace.length - 1 : 0})`;

  // Handle start with mode selection
  const handleStart = (mode: AppMode) => {
    setAppMode(mode);
    setStarted(true);
  };

  // Handle back to start screen
  const handleBackToStart = () => {
    setStarted(false);
    setGameStarted(false);
    resetGame();
  };

  // If not started, show start screen
  if (!started) {
    return (
      <StartScreen
        theme={theme}
        language={language}
        onThemeChange={setTheme}
        onLanguageChange={setLanguage}
        onStart={handleStart}
      />
    );
  }

  // If Monte Carlo Pi mode
  if (appMode === 'pi') {
    return (
      <MonteCarloPi
        theme={theme}
        language={language}
        onBack={handleBackToStart}
      />
    );
  }

  const translations = {
    sl: { 
      whoStarts: 'Kdo začne?', 
      human: 'Človek', 
      machine: 'Stroj', 
      yourTurn: 'Tvoja poteza!', 
      machineTurn: 'Stroj razmišlja...', 
      runMcts: 'Zaženi MCTS za stroja',
      humanTurnTitle: 'Človek je na vrsti!',
      humanTurnMsg: 'MCTS lahko zaženeš samo ko je stroj na vrsti. Najprej naredi svojo potezo.',
      ok: 'V redu'
    },
    en: { 
      whoStarts: 'Who starts?', 
      human: 'Human', 
      machine: 'Machine', 
      yourTurn: 'Your turn!', 
      machineTurn: 'Machine thinking...', 
      runMcts: 'Run MCTS for machine',
      humanTurnTitle: 'Human\'s turn!',
      humanTurnMsg: 'You can only run MCTS when it\'s the machine\'s turn. Make your move first.',
      ok: 'OK'
    },
    de: { 
      whoStarts: 'Wer beginnt?', 
      human: 'Mensch', 
      machine: 'Computer', 
      yourTurn: 'Du bist dran!', 
      machineTurn: 'Computer denkt...', 
      runMcts: 'MCTS für Computer starten',
      humanTurnTitle: 'Mensch ist dran!',
      humanTurnMsg: 'MCTS kann nur gestartet werden, wenn der Computer dran ist. Mach zuerst deinen Zug.',
      ok: 'OK'
    }
  };
  const t = translations[language];

  return (
    <div className={`app-container theme-${theme}`}>
      {/* Human turn warning popup */}
      {showHumanTurnPopup && (
        <div className="player-select-overlay">
          <div className="player-select-popup warning">
            <h2>👤 {t.humanTurnTitle}</h2>
            <p className="popup-message">{t.humanTurnMsg}</p>
            <button 
              className="player-select-btn machine" 
              onClick={() => setShowHumanTurnPopup(false)}
              style={{ width: '100%' }}
            >
              {t.ok}
            </button>
          </div>
        </div>
      )}

      {/* Player selection popup */}
      {!gameStarted && !gameOver && !showHumanTurnPopup && (
        <div className="player-select-overlay">
          <div className="player-select-popup">
            <h2>{t.whoStarts}</h2>
            <div className="player-select-buttons">
              <button className="player-select-btn human" onClick={() => handleStartGame('human')}>
                <span className="player-icon">👤</span>
                {t.human}
              </button>
              <button className="player-select-btn machine" onClick={() => handleStartGame('machine')}>
                <span className="player-icon">🤖</span>
                {t.machine}
              </button>
            </div>
          </div>
        </div>
      )}

      <ControlPanel
        currentPlayer={currentPlayer}
        onRandomMove={handleRandomMove}
        iterations={iterations}
        onIterationsSet={handleIterationsSet}
        onRunMCTS={handleRunMCTS}
        onReset={handleReset}
        onBack={() => setStarted(false)}
        isRunning={isRunning}
        gameOver={gameOver}
        language={language}
      >
        <GameBoard
          board={board}
          onCellClick={handleCellClick}
          disabled={isRunning || visState !== VisualizationState.NONE || !gameStarted}
          language={language}
        />
      </ControlPanel>

      <TreeVisualization
        tree={drawTree}
        initialBoard={board}
        onNodeClick={handleNodeClick}
        onNextAction={handleNextAction}
        onNextIteration={handleNextIteration}
        onAutoPlay={handleAutoPlay}
        onSkipToEnd={handleSkipToEnd}
        onMakePlay={handleMakePlay}
        isAutoPlaying={isAutoPlaying}
        isLastStep={visState === VisualizationState.LAST_STEP}
        canVisualize={visState !== VisualizationState.NONE}
        currentAction={currentAction}
        actionProgress={actionProgress}
        iterationProgress={iterationProgress}
        theme={theme}
        language={language}
      />

      {/* Game status overlay */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-message">
            {winner === 'draw' 
              ? (language === 'sl' ? 'Neodločeno!' : language === 'de' ? 'Unentschieden!' : 'Draw!') 
              : winner === 'machine' 
                ? (language === 'sl' ? 'Stroj je zmagal!' : language === 'de' ? 'Computer gewinnt!' : 'Machine wins!') 
                : (language === 'sl' ? 'Človek je zmagal!' : language === 'de' ? 'Mensch gewinnt!' : 'Human wins!')
            }
            <button className="restart-btn" onClick={handleReset}>
              {language === 'sl' ? 'Nova igra' : language === 'de' ? 'Neues Spiel' : 'New Game'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

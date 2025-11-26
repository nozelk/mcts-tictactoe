import { useState, useCallback, useRef, useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { TreeVisualization } from './TreeVisualization';
import { Language, Theme } from './StartScreen';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import {
  BoardState,
  Tree,
  TreeNode,
  AlgAction,
  VisualizationState
} from '../types';
import {
  createTree,
  GameNode,
  makeDrawTree,
  applyAction,
  copyTree
} from '../tree';

// Use same API URL as main game
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const EMPTY_BOARD: BoardState = ['', '', '', '', '', '', '', '', ''];

interface DemoGameProps {
  theme: Theme;
  language: Language;
  onBack: () => void;
}

interface DemoConfig {
  ai1Iterations: number;
  ai2Iterations: number;
  seed: number;
}

const translations = {
  sl: {
    title: 'Demo: AI vs AI',
    subtitle: 'Predstavitveni način za razlago MCTS',
    ai1: 'Š',
    ai1Full: 'Šibek',
    ai2: 'M',
    ai2Full: 'Močan',
    iterations: 'Iteracije',
    seed: 'Seed',
    lockSeed: 'Zakleni seed',
    start: 'Začni demo',
    pause: 'Pavza',
    resume: 'Nadaljuj',
    reset: 'Ponastavi',
    step: 'Korak',
    nextMove: 'Naslednja poteza',
    speed: 'Hitrost',
    slow: 'Počasi',
    medium: 'Srednje',
    fast: 'Hitro',
    turn: 'Na potezi',
    thinking: 'Razmišlja...',
    move: 'Poteza',
    winner: 'Zmagovalec',
    draw: 'Neodločeno',
    weak: 'ŠIBEK',
    strong: 'MOČAN',
    presets: 'Prednastavitve',
    preset1: '10 vs 100',
    preset2: '5 vs 50',
    preset3: '1 vs 100',
    currentIteration: 'Iteracija',
    totalIterations: 'od',
    phase: 'Faza',
    select: 'Izbira',
    expand: 'Širitev',
    simulate: 'Simulacija',
    backprop: 'Nazaj',
    runAI: 'Zaženi AI',
    skipToEnd: 'Preskoči',
    waitingStart: 'Klikni "Začni demo" za začetek',
    clickRun: 'Klikni "Zaženi AI" za MCTS',
  },
  en: {
    title: 'Demo: AI vs AI',
    subtitle: 'Presentation mode for explaining MCTS',
    ai1: 'W',
    ai1Full: 'Weak',
    ai2: 'S',
    ai2Full: 'Strong',
    iterations: 'Iterations',
    seed: 'Seed',
    lockSeed: 'Lock seed',
    start: 'Start Demo',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    step: 'Step',
    nextMove: 'Next Move',
    speed: 'Speed',
    slow: 'Slow',
    medium: 'Medium',
    fast: 'Fast',
    turn: 'Turn',
    thinking: 'Thinking...',
    move: 'Move',
    winner: 'Winner',
    draw: 'Draw',
    weak: 'WEAK',
    strong: 'STRONG',
    presets: 'Presets',
    preset1: '10 vs 100',
    preset2: '5 vs 50',
    preset3: '1 vs 100',
    currentIteration: 'Iteration',
    totalIterations: 'of',
    phase: 'Phase',
    select: 'Selection',
    expand: 'Expansion',
    simulate: 'Simulation',
    backprop: 'Backprop',
    runAI: 'Run AI',
    skipToEnd: 'Skip',
    waitingStart: 'Click "Start Demo" to begin',
    clickRun: 'Click "Run AI" for MCTS',
  },
  de: {
    title: 'Demo: AI vs AI',
    subtitle: 'Präsentationsmodus zur MCTS Erklärung',
    ai1: 'S',
    ai1Full: 'Schwach',
    ai2: 'St',
    ai2Full: 'Stark',
    iterations: 'Iterationen',
    seed: 'Seed',
    lockSeed: 'Seed sperren',
    start: 'Demo starten',
    pause: 'Pause',
    resume: 'Fortsetzen',
    reset: 'Zurücksetzen',
    step: 'Schritt',
    nextMove: 'Nächster Zug',
    speed: 'Geschwindigkeit',
    slow: 'Langsam',
    medium: 'Mittel',
    fast: 'Schnell',
    turn: 'Am Zug',
    thinking: 'Denkt nach...',
    move: 'Zug',
    winner: 'Gewinner',
    draw: 'Unentschieden',
    weak: 'SCHWACH',
    strong: 'STARK',
    presets: 'Voreinstellungen',
    preset1: '10 vs 100',
    preset2: '5 vs 50',
    preset3: '1 vs 100',
    currentIteration: 'Iteration',
    totalIterations: 'von',
    phase: 'Phase',
    select: 'Auswahl',
    expand: 'Erweiterung',
    simulate: 'Simulation',
    backprop: 'Rückprop',
    runAI: 'AI starten',
    skipToEnd: 'Überspringen',
    waitingStart: 'Klicke "Demo starten" zum Beginnen',
    clickRun: 'Klicke "AI starten" für MCTS',
  }
};

export function DemoGame({ theme, language, onBack }: DemoGameProps) {
  const t = translations[language];
  
  // Demo configuration
  const [config, setConfig] = useState<DemoConfig>({
    ai1Iterations: 10,
    ai2Iterations: 100,
    seed: 1  // Fixed seed for reproducibility
  });
  
  // Game state
  const [board, setBoard] = useState<BoardState>([...EMPTY_BOARD]);
  const [currentPlayer, setCurrentPlayer] = useState<'ai1' | 'ai2'>('ai1');
  const [moveNumber, setMoveNumber] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Demo control state
  const [demoStarted, setDemoStarted] = useState(false);
  
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
  
  // Speed control
  const speed = 'slow' as const;
  const speedDelays = { slow: 800, medium: 300, fast: 50 };
  
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // AI symbols for display (translated)
  const ai1Symbol = translations[language].ai1;
  const ai2Symbol = translations[language].ai2;
  
  // Check for winner (uses internal X/O)
  const checkWinner = (b: BoardState): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, bc, c] of lines) {
      if (b[a] && b[a] === b[bc] && b[a] === b[c]) {
        return b[a] === 'X' ? 'ai1' : 'ai2';
      }
    }
    if (b.every(cell => cell !== '')) return 'draw';
    return null;
  };
  
  // Convert internal X/O to display symbols
  const toDisplaySymbol = (cell: string): string => {
    if (cell === 'X') return ai1Symbol;
    if (cell === 'O') return ai2Symbol;
    return cell;
  };

  // Reset game
  const resetGame = useCallback(() => {
    setBoard([...EMPTY_BOARD]);
    setCurrentPlayer('ai1');
    setMoveNumber(0);
    setGameOver(false);
    setWinner(null);
    setDemoStarted(false);
    setVisState(VisualizationState.NONE);
    setActionTrace([]);
    setFinalTree(null);
    setReconstructedTree(null);
    setDrawTree(null);
    setCurrentIterationIdx(0);
    setCurrentActionIdx(0);
    setTotalActionsTillNow(0);
    setBestMove(null);
    setIsAutoPlaying(false);
    
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  // Check if last step
  const isLastStep = useCallback(() => {
    if (actionTrace.length === 0) return false;
    return currentIterationIdx === actionTrace.length - 1 &&
           currentActionIdx === (actionTrace[actionTrace.length - 1]?.length ?? 1) - 1;
  }, [currentIterationIdx, currentActionIdx, actionTrace]);

  // Run MCTS for current player
  const runMCTS = useCallback(async () => {
    const iterations = currentPlayer === 'ai1' ? config.ai1Iterations : config.ai2Iterations;
    // Use X/O internally for backend, display translated symbols
    const aiSymbol = currentPlayer === 'ai1' ? 'X' : 'O';
    
    try {
      const response = await fetch(`${API_BASE}/mcts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: board,
          player: aiSymbol,
          iterations: iterations,
          seed: config.seed + moveNumber
        })
      });
      
      const data = await response.json();
      const trace: AlgAction[][] = data.trace;
      setBestMove(data.best_move);
      setActionTrace(trace);

      // Build final tree
      const fTree: Tree = {
        nodes: data.tree.nodes.map((n: TreeNode | null) => {
          if (!n) return null;
          return {
            ...n,
            data: { ...n.data, action_id: 0 }
          } as TreeNode;
        })
      };
      setFinalTree(fTree);

      // Create reconstructed tree
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
      console.error('MCTS error:', error);
    }
  }, [board, currentPlayer, config, moveNumber]);

  // Apply one action step
  const handleNextAction = useCallback(() => {
    if (!reconstructedTree || !finalTree || actionTrace.length === 0) return;

    if (isLastStep()) {
      setVisState(VisualizationState.LAST_STEP);
      // Stop auto play
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
        setIsAutoPlaying(false);
      }
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

  // Next iteration - skip to end of current iteration
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
    } else {
      // Last iteration - go to last step
      actionIdx = iteration.length - 1;
    }

    setReconstructedTree(rTree);
    setDrawTree(makeDrawTree(copyTree(rTree)));
    setCurrentIterationIdx(iterIdx);
    setCurrentActionIdx(actionIdx);
    setTotalActionsTillNow(total);

    // Check if now at last step
    if (iterIdx === actionTrace.length - 1 && actionIdx === actionTrace[iterIdx].length - 1) {
      setVisState(VisualizationState.LAST_STEP);
    }

  }, [reconstructedTree, finalTree, actionTrace, currentIterationIdx, currentActionIdx, totalActionsTillNow, isLastStep]);

  // Skip to end
  const handleSkipToEnd = useCallback(() => {
    if (!finalTree || actionTrace.length === 0) return;

    // Stop auto play
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
      setIsAutoPlaying(false);
    }

    // Apply all remaining actions
    const rTree = reconstructedTree ? copyTree(reconstructedTree) : createTree(new GameNode(null));
    let total = totalActionsTillNow;

    for (let i = currentIterationIdx; i < actionTrace.length; i++) {
      const startJ = i === currentIterationIdx ? currentActionIdx + 1 : 0;
      for (let j = startJ; j < actionTrace[i].length; j++) {
        applyAction(rTree, finalTree, actionTrace[i][j], total);
        total++;
      }
    }

    setReconstructedTree(rTree);
    setDrawTree(makeDrawTree(copyTree(rTree)));
    setCurrentIterationIdx(actionTrace.length - 1);
    setCurrentActionIdx(actionTrace[actionTrace.length - 1].length - 1);
    setTotalActionsTillNow(total);
    setVisState(VisualizationState.LAST_STEP);

  }, [reconstructedTree, finalTree, actionTrace, currentIterationIdx, currentActionIdx, totalActionsTillNow]);

  // Make the best move
  const makeBestMove = useCallback(() => {
    if (bestMove === null || gameOver) return;
    
    const newBoard = [...board];
    // Use X/O internally, display will translate to Š/M etc.
    const symbol = currentPlayer === 'ai1' ? 'X' : 'O';
    newBoard[bestMove] = symbol;
    setBoard(newBoard);
    setMoveNumber(prev => prev + 1);
    
    const result = checkWinner(newBoard);
    if (result) {
      setGameOver(true);
      setWinner(result);
      setVisState(VisualizationState.NONE);
      return;
    }
    
    // Switch player and reset MCTS state
    setCurrentPlayer(prev => prev === 'ai1' ? 'ai2' : 'ai1');
    setVisState(VisualizationState.NONE);
    setActionTrace([]);
    setFinalTree(null);
    setReconstructedTree(null);
    setDrawTree(null);
    setCurrentIterationIdx(0);
    setCurrentActionIdx(0);
    setTotalActionsTillNow(0);
    setBestMove(null);
  }, [bestMove, board, currentPlayer, gameOver]);

  // Auto play toggle
  const handleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      // Stop
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      setIsAutoPlaying(false);
    } else {
      // Start
      setIsAutoPlaying(true);
      autoPlayRef.current = setInterval(() => {
        handleNextAction();
      }, speedDelays[speed]);
    }
  }, [isAutoPlaying, handleNextAction, speed, speedDelays]);

  // Update speed when changed
  useEffect(() => {
    if (autoPlayRef.current && isAutoPlaying) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        handleNextAction();
      }, speedDelays[speed]);
    }
  }, [speed, handleNextAction, isAutoPlaying, speedDelays]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  // Start demo - immediately runs MCTS
  const startDemo = useCallback(async () => {
    resetGame();
    setDemoStarted(true);
    // Trigger MCTS after state is set
    setTimeout(() => {
      runMCTS();
    }, 100);
  }, [resetGame, runMCTS]);

  // Get current phase name
  const getCurrentPhase = (): string => {
    if (actionTrace.length === 0 || !actionTrace[currentIterationIdx]) return '';
    const action = actionTrace[currentIterationIdx][currentActionIdx];
    if (!action) return '';
    
    switch (action.kind) {
      case 'selection': return t.select;
      case 'expansion': return t.expand;
      case 'simulation': return t.simulate;
      case 'backpropagation': return t.backprop;
      default: return '';
    }
  };

  // Progress calculation
  const actionProgress = actionTrace.length > 0 && actionTrace[currentIterationIdx]
    ? `${currentActionIdx + 1}/${actionTrace[currentIterationIdx].length}`
    : '0/0';
  const iterationProgress = actionTrace.length > 0
    ? `${currentIterationIdx + 1}/${actionTrace.length}`
    : '0/0';

  return (
    <div className={`demo-game theme-${theme}`}>
      <div className="demo-content">
        {/* Left side - Configuration */}
        <div className="demo-config">
          {/* Back button at top */}
          <button className="demo-back-btn" onClick={onBack}>← Nazaj</button>
          
          <div className="config-section">
            <div className="ai-config">
              <div className="ai-box ai1">
                <span className="ai-symbol">{t.ai1}</span>
                <span className="ai-strength">{t.weak}</span>
                <input
                  type="number"
                  value={config.ai1Iterations}
                  onChange={(e) => setConfig(prev => ({ ...prev, ai1Iterations: Math.max(1, parseInt(e.target.value) || 1) }))}
                  min={1}
                  max={1000}
                  disabled={visState !== VisualizationState.NONE}
                />
                <span className="iter-label">{t.iterations}</span>
              </div>
              <span className="vs">VS</span>
              <div className="ai-box ai2">
                <span className="ai-symbol">{t.ai2}</span>
                <span className="ai-strength">{t.strong}</span>
                <input
                  type="number"
                  value={config.ai2Iterations}
                  onChange={(e) => setConfig(prev => ({ ...prev, ai2Iterations: Math.max(1, parseInt(e.target.value) || 1) }))}
                  min={1}
                  max={1000}
                  disabled={visState !== VisualizationState.NONE}
                />
                <span className="iter-label">{t.iterations}</span>
              </div>
            </div>
          </div>

          <div className="demo-buttons">
            {!demoStarted ? (
              <button className="start-btn" onClick={startDemo}>{t.start}</button>
            ) : (
              <>
                {visState === VisualizationState.VISUALIZING && (
                  <>
                    <button 
                      className={isAutoPlaying ? 'pause-btn' : 'play-btn'} 
                      onClick={handleAutoPlay}
                    >
                      {isAutoPlaying ? t.pause : t.resume}
                    </button>
                    <button className="step-btn" onClick={handleNextAction}>{t.step}</button>
                    <button className="skip-btn" onClick={handleSkipToEnd}>{t.skipToEnd}</button>
                  </>
                )}
                {visState === VisualizationState.LAST_STEP && (
                  <button className="move-btn" onClick={makeBestMove}>{t.nextMove}</button>
                )}
                {visState === VisualizationState.NONE && !gameOver && (
                  <button className="run-btn" onClick={runMCTS}>{t.runAI}</button>
                )}
                <button className="reset-btn" onClick={resetGame}>{t.reset}</button>
              </>
            )}
          </div>

          {/* Phase Legend */}
          <div className="demo-legend">
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-dot selection"></div>
                <span>{t.select}</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot expansion"></div>
                <span>{t.expand}</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot simulation"></div>
                <span>{t.simulate}</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot backpropagation"></div>
                <span>{t.backprop}</span>
              </div>
            </div>
          </div>
          
          {/* Game Board - in left panel */}
          <div className="demo-board-section">
            <div className="board-header">
              <span className="turn-label">{t.turn}:</span>
              <span className={`turn-value ${currentPlayer}`}>
                {currentPlayer === 'ai1' ? t.ai1 : t.ai2}
              </span>
              <span className="move-num">#{moveNumber + 1}</span>
            </div>
            
            <GameBoard
              board={board.map(toDisplaySymbol) as BoardState}
              onCellClick={() => {}}
              disabled={true}
              language={language}
              customSymbols={true}
            />
            
            {/* MCTS Progress */}
            <div className="mcts-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: actionTrace.length > 0 ? `${((currentIterationIdx + 1) / actionTrace.length) * 100}%` : '0%' }}
                />
              </div>
              <div className="progress-text">
                {actionTrace.length > 0 
                  ? `Iter ${iterationProgress} | ${getCurrentPhase()}`
                  : `Iter 0/0`
                }
              </div>
            </div>
            
            {gameOver && (
              <div className="game-result">
                {winner === 'draw' ? t.draw : `${t.winner}: ${winner === 'ai1' ? t.ai1 : t.ai2}`}
              </div>
            )}
          </div>
          
          {/* UCB Calculator - embedded in left panel */}
          <div className="demo-ucb-panel">
            <div className="ucb-title">📊 UCB Kalkulator</div>
            <div className="ucb-formula-katex">
              <BlockMath math="UCB = \frac{v}{n} + C \cdot \sqrt{\frac{\ln(N)}{n}}" />
            </div>
            {drawTree && drawTree.nodes[0] ? (
              <div className="ucb-values-mini">
                <div className="ucb-row"><span className="ucb-var">v</span> = <span className="ucb-val">{drawTree.nodes[0].data.value}</span> <span className="ucb-desc">(vrednost)</span></div>
                <div className="ucb-row"><span className="ucb-var">n</span> = <span className="ucb-val">{drawTree.nodes[0].data.simulations}</span> <span className="ucb-desc">(simulacije)</span></div>
                <div className="ucb-row"><span className="ucb-var">N</span> = <span className="ucb-val">{drawTree.nodes[0].data.simulations}</span> <span className="ucb-desc">(starš)</span></div>
                <div className="ucb-row"><span className="ucb-var">C</span> = <span className="ucb-val">1.414</span> <span className="ucb-desc">(konstanta √2)</span></div>
              </div>
            ) : (
              <div className="ucb-hint-mini">Zaženi za prikaz</div>
            )}
          </div>
        </div>

        {/* Right side - Tree Visualization - always visible */}
        <div className="demo-tree">
          <TreeVisualization
            tree={drawTree}
            initialBoard={board.map(toDisplaySymbol) as BoardState}
            onNodeClick={() => {}}
            onNextAction={handleNextAction}
            onNextIteration={handleNextIteration}
            onAutoPlay={handleAutoPlay}
            onSkipToEnd={handleSkipToEnd}
            onMakePlay={makeBestMove}
            isAutoPlaying={isAutoPlaying}
            isLastStep={visState === VisualizationState.LAST_STEP}
            canVisualize={visState !== VisualizationState.NONE}
            currentAction={getCurrentPhase()}
            actionProgress={actionProgress}
            iterationProgress={iterationProgress}
            theme={theme}
            language={language}
            symbolTransform={toDisplaySymbol}
            alwaysShowUcb={false}
            hideUcbPanel={true}
          />
        </div>
      </div>
    </div>
  );
}

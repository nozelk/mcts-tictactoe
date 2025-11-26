import React from 'react';
import { Player } from '../types';
import { Language } from './StartScreen';

const translations = {
  sl: {
    title: 'MCTS Tic-Tac-Toe',
    human: 'Človek',
    machine: 'Stroj',
    current_turn: 'Na potezi:',
    random_move: '🎲 Naključna poteza',
    iterations: 'Iteracije',
    run_mcts: '▶ Zaženi MCTS',
    next_action: '→ Naslednja akcija',
    next_iteration: '⏭ Naslednja iter.',
    auto_play: '⏩ Avto predvajanje',
    stop_play: '⏹ Ustavi',
    skip_to_end: '⏭ Skoči na konec',
    reset: '↺ Ponastavi',
    legend: 'Legenda:',
    selection: 'Selection',
    expansion: 'Expansion',
    simulation: 'Simulation',
    backprop: 'Backprop.',
    action: 'Akcija:',
    progress: 'Napredek:',
    iteration: 'Iteracija:',
    back: '← Nazaj',
  },
  en: {
    title: 'MCTS Tic-Tac-Toe',
    human: 'Human',
    machine: 'Machine',
    current_turn: 'Current turn:',
    random_move: '🎲 Random Move',
    iterations: 'Iterations',
    run_mcts: '▶ Run MCTS',
    next_action: '→ Next Action',
    next_iteration: '⏭ Next Iter.',
    auto_play: '⏩ Auto Play',
    stop_play: '⏹ Stop',
    skip_to_end: '⏭ Skip to End',
    reset: '↺ Reset',
    legend: 'Legend:',
    selection: 'Selection',
    expansion: 'Expansion',
    simulation: 'Simulation',
    backprop: 'Backprop.',
    action: 'Action:',
    progress: 'Progress:',
    iteration: 'Iteration:',
    back: '← Back',
  },
  de: {
    title: 'MCTS Tic-Tac-Toe',
    human: 'Mensch',
    machine: 'Computer',
    current_turn: 'Am Zug:',
    random_move: '🎲 Zufälliger Zug',
    iterations: 'Iterationen',
    run_mcts: '▶ MCTS starten',
    next_action: '→ Nächste Aktion',
    next_iteration: '⏭ Nächste Iter.',
    auto_play: '⏩ Auto-Wiedergabe',
    stop_play: '⏹ Stopp',
    skip_to_end: '⏭ Zum Ende',
    reset: '↺ Zurücksetzen',
    legend: 'Legende:',
    selection: 'Selection',
    expansion: 'Expansion',
    simulation: 'Simulation',
    backprop: 'Backprop.',
    action: 'Aktion:',
    progress: 'Fortschritt:',
    iteration: 'Iteration:',
    back: '← Zurück',
  }
};

interface ControlPanelProps {
  // Current turn
  currentPlayer: Player;
  onRandomMove: () => void;
  
  // Iterations
  iterations: number;
  onIterationsSet: (value: number) => void;
  
  // Actions
  onRunMCTS: () => void;
  onReset: () => void;
  onBack: () => void;
  
  // State
  isRunning: boolean;
  gameOver: boolean;
  language: Language;
  
  children?: React.ReactNode;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentPlayer,
  onRandomMove,
  iterations,
  onIterationsSet,
  onRunMCTS,
  onReset,
  onBack,
  isRunning,
  gameOver,
  language,
  children
}) => {
  const t = translations[language];
  
  return (
    <div className="control-panel">
      <h1>{t.title}</h1>
      
      {/* Game Board */}
      <div className="game-board-container">
        {children}
      </div>
      
      {/* Current Turn */}
      <div className="control-group">
        <label>{t.current_turn}</label>
        <div className="current-turn-display">
          <span className={`turn-indicator ${currentPlayer}`}>
            {currentPlayer === 'human' ? `👤 ${t.human}` : `🤖 ${t.machine}`}
          </span>
        </div>
        <button
          className="nav-btn random-move full-width"
          onClick={onRandomMove}
          disabled={isRunning || gameOver}
        >
          {t.random_move}
        </button>
      </div>

      {/* Iterations Control */}
      <div className="control-group">
        <label>{t.iterations}</label>
        <div className="iterations-input-row">
          <input
            type="number"
            className="iterations-input"
            value={iterations}
            onChange={(e) => onIterationsSet(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={10000}
          />
        </div>
        <div className="iterations-presets">
          {[50, 100, 500, 1000].map(preset => (
            <button
              key={preset}
              className={`preset-btn ${iterations === preset ? 'active' : ''}`}
              onClick={() => onIterationsSet(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Run MCTS Button */}
      <button
        className="nav-btn primary full-width"
        onClick={onRunMCTS}
        disabled={isRunning}
      >
        {t.run_mcts}
      </button>

      {/* Legend */}
      <div className="legend">
        <h3>{t.legend}</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot selection"></div>
            <span>{t.selection}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot expansion"></div>
            <span>{t.expansion}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot simulation"></div>
            <span>{t.simulation}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot backpropagation"></div>
            <span>{t.backprop}</span>
          </div>
        </div>
      </div>

      {/* Reset & Back Buttons */}
      <div className="nav-controls">
        <button className="nav-btn" onClick={onReset}>{t.reset}</button>
        <button className="nav-btn" onClick={onBack}>{t.back}</button>
      </div>
    </div>
  );
};

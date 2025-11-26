import React from 'react';
import { BoardState, CellValue } from '../types';
import { Language } from './StartScreen';

// X = Machine, O = Human
const PLAYER_LABELS = {
  sl: { X: 'S', O: 'Č' },  // Stroj, Človek
  en: { X: 'M', O: 'H' },  // Machine, Human
  de: { X: 'C', O: 'P' },  // Computer, Person
};

// Demo symbols per language (first player, second player)
const DEMO_SYMBOLS = {
  sl: ['Š', 'M'],   // Šibek, Močan
  en: ['W', 'S'],   // Weak, Strong
  de: ['S', 'St'], // Schwach, Stark
};

interface GameBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  disabled: boolean;
  language?: Language;
  customSymbols?: boolean; // If true, board already contains display symbols
}

export const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick, disabled, language = 'en', customSymbols = false }) => {
  const labels = PLAYER_LABELS[language];
  const demoSyms = DEMO_SYMBOLS[language];
  
  const renderCell = (value: CellValue, index: number) => {
    const isEmpty = value === '';
    const isClickable = !disabled && isEmpty;
    
    // Determine cell class
    let playerClass = '';
    if (!isEmpty) {
      if (customSymbols) {
        // For demo: first symbol = player 1 (red/machine color), second = player 2 (blue/human color)
        if (value === demoSyms[0]) {
          playerClass = 'X'; // Use X styling (red)
        } else if (value === demoSyms[1]) {
          playerClass = 'O'; // Use O styling (blue)
        } else {
          playerClass = 'has-symbol';
        }
      } else {
        playerClass = value === 'X' ? 'X' : value === 'O' ? 'O' : '';
      }
    }
    
    const cellClass = [
      'board-cell',
      playerClass,
      isClickable ? 'clickable' : ''
    ].filter(Boolean).join(' ');

    // Display value: if custom symbols, show as-is; otherwise translate
    const displayValue = customSymbols ? value : (value === 'X' ? labels.X : value === 'O' ? labels.O : '');

    return (
      <button
        key={index}
        className={cellClass}
        onClick={() => isClickable && onCellClick(index)}
        disabled={!isClickable}
      >
        {displayValue}
      </button>
    );
  };

  return (
    <div className="game-board">
      {board.map((cell, index) => renderCell(cell, index))}
    </div>
  );
};

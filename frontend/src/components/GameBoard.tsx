import React from 'react';
import { BoardState, CellValue } from '../types';
import { Language } from './StartScreen';

// X = Machine, O = Human
const PLAYER_LABELS = {
  sl: { X: 'S', O: 'Č' },  // Stroj, Človek
  en: { X: 'M', O: 'H' },  // Machine, Human
  de: { X: 'C', O: 'P' },  // Computer, Person
};

interface GameBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  disabled: boolean;
  language?: Language;
}

export const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick, disabled, language = 'en' }) => {
  const labels = PLAYER_LABELS[language];
  
  const renderCell = (value: CellValue, index: number) => {
    const isClickable = !disabled && value === '';
    const cellClass = [
      'board-cell',
      value === 'X' ? 'X' : value === 'O' ? 'O' : '',
      isClickable ? 'clickable' : ''
    ].filter(Boolean).join(' ');

    const displayValue = value === 'X' ? labels.X : value === 'O' ? labels.O : '';

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

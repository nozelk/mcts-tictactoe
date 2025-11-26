import { MCTSResult, BoardState, Player } from './types';

// Use environment variable for API URL, fallback to /api for development
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function runMCTS(
  board: BoardState,
  player: Player,
  iterations: number
): Promise<MCTSResult> {
  const response = await fetch(`${API_BASE}/mcts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board,
      player,
      iterations,
    }),
  });

  if (!response.ok) {
    throw new Error('MCTS request failed');
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

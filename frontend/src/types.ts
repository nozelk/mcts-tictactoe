// Types for MCTS Visualization

export type Player = 'human' | 'machine';
export type CellValue = '' | 'X' | 'O';
export type BoardState = CellValue[];

export interface GameMove {
  player: Player;
  position: number | null;
}

export interface TreeNodeData {
  move: GameMove | null;
  value: number;
  simulations: number;
  // Visualization state
  selected?: boolean;
  expanded?: boolean;
  simulated?: boolean;
  backpropagated?: boolean;
  collapsed?: boolean;
  best_move?: boolean;
  simulated_board?: BoardState;
  // Layout
  x?: number;
  y?: number;
  mod?: number;
  final_x?: number;
  should_show_collapse_btn?: boolean;
  action_id?: number;
}

export interface TreeNode {
  id: number;
  parent_id: number;
  children_id: number[];
  data: TreeNodeData;
}

export interface Tree {
  nodes: (TreeNode | null)[];
}

export interface AlgAction {
  kind: 'selection' | 'expansion' | 'simulation' | 'backpropagation' | 'finish';
  node_id: number;
  old_data?: {
    old_value?: number;
    old_visits?: number;
  };
  new_data?: {
    result?: string;
    board?: BoardState;
    new_value?: number;
    new_visits?: number;
  };
}

export interface MCTSResult {
  best_move: number | null;
  trace: AlgAction[][];
  tree: Tree;
}

export enum GameState {
  SELECT_STARTING_PLAYER,
  WAITING_HUMAN_MOVE,
  WAITING_MACHINE_MOVE,
  RUNNING_MCTS,
  RUNNING_VIS,
  GAME_OVER
}

export enum VisualizationState {
  NONE,
  VISUALIZING,
  LAST_STEP
}

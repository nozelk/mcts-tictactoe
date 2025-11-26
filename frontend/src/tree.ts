import { Tree, TreeNode, TreeNodeData, GameMove, BoardState, AlgAction } from './types';

// Tree Node class for manipulation
export class GameNode implements TreeNodeData {
  move: GameMove | null;
  value: number;
  simulations: number;
  selected?: boolean;
  expanded?: boolean;
  simulated?: boolean;
  backpropagated?: boolean;
  collapsed?: boolean;
  best_move?: boolean;
  simulated_board?: BoardState;
  x?: number;
  y?: number;
  mod?: number;
  final_x?: number;
  should_show_collapse_btn?: boolean;
  action_id?: number;

  constructor(move: GameMove | null) {
    this.move = move;
    this.value = 0;
    this.simulations = 0;
  }

  copy(): GameNode {
    const newNode = new GameNode(this.move ? { ...this.move } : null);
    newNode.value = this.value;
    newNode.simulations = this.simulations;
    newNode.selected = this.selected;
    newNode.expanded = this.expanded;
    newNode.simulated = this.simulated;
    newNode.backpropagated = this.backpropagated;
    newNode.collapsed = this.collapsed;
    newNode.best_move = this.best_move;
    newNode.simulated_board = this.simulated_board ? [...this.simulated_board] : undefined;
    newNode.x = this.x;
    newNode.y = this.y;
    newNode.mod = this.mod;
    newNode.final_x = this.final_x;
    newNode.should_show_collapse_btn = this.should_show_collapse_btn;
    newNode.action_id = this.action_id;
    return newNode;
  }
}

// Tree manipulation functions
export function createTree(rootData: TreeNodeData): Tree {
  const root: TreeNode = {
    id: 0,
    parent_id: -1,
    children_id: [],
    data: rootData
  };
  return { nodes: [root] };
}

export function getNode(tree: Tree, id: number): TreeNode | null {
  if (id >= 0 && id < tree.nodes.length && tree.nodes[id]) {
    return tree.nodes[id];
  }
  return null;
}

export function getParent(tree: Tree, node: TreeNode): TreeNode | null {
  if (node.parent_id >= 0) {
    return tree.nodes[node.parent_id];
  }
  return null;
}

export function getChildren(tree: Tree, node: TreeNode): TreeNode[] {
  if (!node) return [];
  return node.children_id
    .map(id => tree.nodes[id])
    .filter((n): n is TreeNode => n !== null);
}

export function insertNode(tree: Tree, data: TreeNodeData, parent: TreeNode): TreeNode {
  const newNode: TreeNode = {
    id: tree.nodes.length,
    parent_id: parent.id,
    children_id: [],
    data: data
  };
  tree.nodes.push(newNode);
  parent.children_id.push(newNode.id);
  return newNode;
}

// Insert node with specific ID (for synchronizing with finalTree)
export function insertNodeWithId(tree: Tree, data: TreeNodeData, parent: TreeNode, nodeId: number): TreeNode {
  // Ensure array is big enough
  while (tree.nodes.length <= nodeId) {
    tree.nodes.push(null as unknown as TreeNode);
  }
  
  const newNode: TreeNode = {
    id: nodeId,
    parent_id: parent.id,
    children_id: [],
    data: data
  };
  tree.nodes[nodeId] = newNode;
  parent.children_id.push(newNode.id);
  return newNode;
}

export function copyTree(tree: Tree): Tree {
  const newNodes = tree.nodes.map(node => {
    if (!node) return null;
    return {
      id: node.id,
      parent_id: node.parent_id,
      children_id: [...node.children_id],
      data: { ...node.data }
    };
  });
  return { nodes: newNodes };
}

export function removeNode(tree: Tree, node: TreeNode): void {
  if (node.id === 0) return; // Can't remove root

  const removeRec = (n: TreeNode): number[] => {
    const removed: number[] = [];
    const children = getChildren(tree, n);
    
    for (const child of children) {
      removed.push(...removeRec(child));
    }
    
    const parent = getParent(tree, n);
    if (parent) {
      const idx = parent.children_id.indexOf(n.id);
      if (idx !== -1) {
        parent.children_id.splice(idx, 1);
      }
    }
    
    tree.nodes[n.id] = null as unknown as TreeNode;
    removed.push(n.id);
    
    return removed;
  };

  removeRec(node);
}

// Tree layout algorithm (Reingold-Tilford style)
export function prepareTreeLayout(tree: Tree): Tree {
  const root = tree.nodes[0];
  if (!root) return tree;

  root.data.y = 0;
  calculateInitialValues(tree, root, 0, { min_distance: 1 });
  calculateFinalValues(tree, root, 0);

  return tree;
}

function calculateInitialValues(tree: Tree, node: TreeNode, siblingIdx: number, configs: { min_distance: number }): void {
  const children = getChildren(tree, node);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.data.y = (node.data.y ?? 0) + 1;
    calculateInitialValues(tree, child, i, configs);
  }

  node.data.final_x = 0;
  node.data.mod = 0;

  if (children.length === 0) {
    // Leaf node
    node.data.x = siblingIdx === 0 ? 0 : siblingIdx;
  } else if (children.length === 1) {
    // Single child
    if (siblingIdx === 0) {
      node.data.x = children[0].data.x ?? 0;
    } else {
      const siblings = getSiblings(tree, node);
      node.data.x = (siblings[siblingIdx - 1]?.data.x ?? 0) + 1;
      node.data.mod = (node.data.x ?? 0) - (children[0].data.x ?? 0);
    }
  } else {
    // Multiple children
    const leftChild = children[0];
    const rightChild = children[children.length - 1];
    const mid = ((leftChild.data.x ?? 0) + (rightChild.data.x ?? 0)) / 2;

    if (siblingIdx === 0) {
      node.data.x = mid;
    } else {
      const siblings = getSiblings(tree, node);
      node.data.x = (siblings[siblingIdx - 1]?.data.x ?? 0) + 1;
      node.data.mod = (node.data.x ?? 0) - mid;
    }
  }

  fixConflicts(tree, node, siblingIdx, { min_distance: 1 });
}

function getSiblings(tree: Tree, node: TreeNode): TreeNode[] {
  const parent = getParent(tree, node);
  if (parent) {
    return getChildren(tree, parent);
  }
  return [];
}

function fixConflicts(tree: Tree, node: TreeNode, siblingIdx: number, configs: { min_distance: number }): void {
  const minDistance = configs.min_distance;
  let shiftValue = 0;

  const nodeContour = getLeftContour(tree, node, 0, {});
  const nodeContourLvls = Object.keys(nodeContour).map(Number);
  const nodeContourMaxLvl = Math.max(...nodeContourLvls);

  const siblings = getSiblings(tree, node);

  for (let i = 0; i < siblingIdx; i++) {
    const sibling = siblings[i];
    const siblingContour = getRightContour(tree, sibling, 0, {});
    const siblingContourLvls = Object.keys(siblingContour).map(Number);
    const siblingContourMaxLvl = Math.max(...siblingContourLvls);

    for (let lvl = node.data.y ?? 0; lvl <= Math.min(nodeContourMaxLvl, siblingContourMaxLvl); lvl++) {
      const distance = (nodeContour[lvl] ?? 0) - (siblingContour[lvl] ?? 0);
      if (distance + shiftValue < minDistance) {
        shiftValue = Math.max(minDistance - distance, shiftValue);
      }
    }
  }

  if (shiftValue > 0) {
    node.data.x = (node.data.x ?? 0) + shiftValue;
    node.data.mod = (node.data.mod ?? 0) + shiftValue;
  }
}

function getLeftContour(tree: Tree, node: TreeNode, modSum: number, contours: Record<number, number>): Record<number, number> {
  const lvl = node.data.y ?? 0;
  if (contours[lvl] === undefined) {
    contours[lvl] = (node.data.x ?? 0) + modSum;
  } else {
    contours[lvl] = Math.min(contours[lvl], (node.data.x ?? 0) + modSum);
  }

  const newModSum = modSum + (node.data.mod ?? 0);
  const children = getChildren(tree, node);
  
  for (const child of children) {
    getLeftContour(tree, child, newModSum, contours);
  }

  return contours;
}

function getRightContour(tree: Tree, node: TreeNode, modSum: number, contours: Record<number, number>): Record<number, number> {
  const lvl = node.data.y ?? 0;
  if (contours[lvl] === undefined) {
    contours[lvl] = (node.data.x ?? 0) + modSum;
  } else {
    contours[lvl] = Math.max(contours[lvl], (node.data.x ?? 0) + modSum);
  }

  const newModSum = modSum + (node.data.mod ?? 0);
  const children = getChildren(tree, node);
  
  for (const child of children) {
    getRightContour(tree, child, newModSum, contours);
  }

  return contours;
}

function calculateFinalValues(tree: Tree, node: TreeNode, modSum: number): void {
  node.data.final_x = (node.data.x ?? 0) + modSum;

  const children = getChildren(tree, node);
  for (const child of children) {
    calculateFinalValues(tree, child, (node.data.mod ?? 0) + modSum);
  }
}

// Apply action to tree for visualization reconstruction
// IMPORTANT: The reconstructed_tree and final_tree share the same node IDs
export function applyAction(tree: Tree, finalTree: Tree, action: AlgAction, actionId: number): void {
  // Reset all visualization states
  for (const node of tree.nodes) {
    if (node) {
      node.data.selected = false;
      node.data.expanded = false;
      node.data.simulated = false;
      node.data.backpropagated = false;
    }
  }

  switch (action.kind) {
    case 'selection':
      // Remove simulated nodes first
      const toRemove: TreeNode[] = [];
      for (const n of tree.nodes) {
        if (n && n.data.simulated_board) {
          toRemove.push(n);
        }
      }
      for (const n of toRemove) {
        const parent = getParent(tree, n);
        if (parent) {
          parent.data.should_show_collapse_btn = false;
        }
        removeNode(tree, n);
      }
      
      // Mark the node as selected - use the same ID from action
      const selectedNode = getNode(tree, action.node_id);
      if (selectedNode) {
        selectedNode.data.selected = true;
      }
      break;

    case 'expansion':
      // Get parent from final_tree using the node_id
      const finalNode = getNode(finalTree, action.node_id);
      if (finalNode) {
        const finalParent = getParent(finalTree, finalNode);
        if (finalParent) {
          // Find/get the parent in reconstructed tree with same ID
          const parent = getNode(tree, finalParent.id);
          if (parent) {
            // Insert new node with the SAME ID as in finalTree
            const newNode = insertNodeWithId(tree, new GameNode(finalNode.data.move), parent, action.node_id);
            newNode.data.action_id = actionId;
            newNode.data.expanded = true;
            newNode.data.collapsed = false;
          }
        }
      }
      break;

    case 'simulation':
      // Simulation is attached to the node with action.node_id
      const simParentNode = getNode(tree, action.node_id);
      if (simParentNode && action.new_data) {
        const simNode = insertNode(tree, new GameNode(simParentNode.data.move), simParentNode);
        simNode.data.simulated_board = action.new_data.board;
        simNode.data.simulated = true;
      }
      break;

    case 'backpropagation':
      const backpropNode = getNode(tree, action.node_id);
      if (backpropNode && action.new_data) {
        backpropNode.data.backpropagated = true;
        backpropNode.data.value = action.new_data.new_value ?? 0;
        backpropNode.data.simulations = action.new_data.new_visits ?? 0;
      }
      break;

    case 'finish':
      const finishNode = getNode(tree, action.node_id);
      if (finishNode) {
        finishNode.data.best_move = true;
      }
      break;
  }
}

// Create draw tree (with collapsed nodes removed)
export function makeDrawTree(tree: Tree): Tree {
  const dTree = copyTree(tree);

  // Mark nodes with children for collapse button
  for (const node of dTree.nodes) {
    if (node && getChildren(dTree, node).length > 0) {
      node.data.should_show_collapse_btn = true;
    }
  }

  // Remove children of collapsed nodes
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of dTree.nodes) {
      if (node) {
        const parent = getParent(dTree, node);
        if (parent && parent.data.collapsed) {
          removeNode(dTree, node);
          changed = true;
          break;
        }
      }
    }
  }

  return prepareTreeLayout(dTree);
}

// UCB1 calculation
export function calculateUCB1(node: TreeNode, parent: TreeNode): number {
  if (node.data.simulations === 0) return Infinity;
  
  const exploitation = node.data.value / node.data.simulations;
  const exploration = Math.sqrt(2 * Math.log(parent.data.simulations) / node.data.simulations);
  return exploitation + exploration;
}

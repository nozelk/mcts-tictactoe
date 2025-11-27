import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Tree, TreeNode, BoardState } from '../types';
import { getChildren, getParent, calculateUCB1 } from '../tree';
import { Language } from './StartScreen';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

type Theme = 'dark' | 'light' | 'blue' | 'forest' | 'sunset' | 'purple' | 'ocean' | 'glass';

// X = Machine, O = Human
const PLAYER_LABELS = {
  sl: { X: 'S', O: 'Č' },  // Stroj, Človek
  en: { X: 'M', O: 'H' },  // Machine, Human
  de: { X: 'C', O: 'P' },  // Computer, Person
};

interface TreeVisualizationProps {
  tree: Tree | null;
  initialBoard: BoardState;
  onNodeClick?: (node: TreeNode) => void;
  onNextAction?: () => void;
  onNextIteration?: () => void;
  onAutoPlay?: () => void;
  onSkipToEnd?: () => void;
  onMakePlay?: () => void;
  isAutoPlaying?: boolean;
  isLastStep?: boolean;
  canVisualize?: boolean;
  currentAction?: string;
  actionProgress?: string;
  iterationProgress?: string;
  theme?: Theme;
  language?: Language;
  symbolTransform?: (cell: string) => string;
  alwaysShowUcb?: boolean;
  hideUcbPanel?: boolean;
  perspectivePlayer?: 'X' | 'O';  // Which player's perspective for WIN/LOSS display
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

const NODE_SIZE = { x: 75, y: 115 };
const NODE_DISTANCE = { x: 0.5, y: 0.6 };
const BORDER_RADIUS = 12;

const THEME_COLORS = {
  dark: {
    canvasBg: '#0d1117',
    nodeBg: '#21262d',
    nodeHover: '#30363d',
    stroke: '#30363d',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    tileEmpty: '#161b22',
    tileStroke: '#30363d',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.4)',
    edgeColor: '#30363d',
  },
  light: {
    canvasBg: '#f6f8fa',
    nodeBg: '#ffffff',
    nodeHover: '#f3f4f6',
    stroke: '#d0d7de',
    text: '#24292f',
    textSecondary: '#57606a',
    tileEmpty: '#f6f8fa',
    tileStroke: '#d0d7de',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.1)',
    edgeColor: '#d0d7de',
  },
  blue: {
    canvasBg: '#0a1628',
    nodeBg: '#1c2d4a',
    nodeHover: '#243a5e',
    stroke: '#2d4a6f',
    text: '#a3c5e8',
    textSecondary: '#6b8eb8',
    tileEmpty: '#142238',
    tileStroke: '#2d4a6f',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.5)',
    edgeColor: '#2d4a6f',
  },
  forest: {
    canvasBg: '#0f1a0f',
    nodeBg: '#1a2e1a',
    nodeHover: '#264026',
    stroke: '#2d4a2d',
    text: '#a8d5a8',
    textSecondary: '#6fa06f',
    tileEmpty: '#152015',
    tileStroke: '#2d4a2d',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.5)',
    edgeColor: '#2d4a2d',
  },
  sunset: {
    canvasBg: '#1a0f0f',
    nodeBg: '#2e1a1a',
    nodeHover: '#402626',
    stroke: '#5a3535',
    text: '#f5c6c6',
    textSecondary: '#c48888',
    tileEmpty: '#201515',
    tileStroke: '#5a3535',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.5)',
    edgeColor: '#5a3535',
  },
  purple: {
    canvasBg: '#120f1a',
    nodeBg: '#231a35',
    nodeHover: '#332650',
    stroke: '#4a3570',
    text: '#d4c6f5',
    textSecondary: '#9f88c4',
    tileEmpty: '#1a1525',
    tileStroke: '#4a3570',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.5)',
    edgeColor: '#4a3570',
  },
  ocean: {
    canvasBg: '#0a1a1a',
    nodeBg: '#153535',
    nodeHover: '#1f4a4a',
    stroke: '#2a6060',
    text: '#a8e8e8',
    textSecondary: '#68b8b8',
    tileEmpty: '#102828',
    tileStroke: '#2a6060',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.5)',
    edgeColor: '#2a6060',
  },
  glass: {
    canvasBg: 'transparent',
    nodeBg: 'rgba(255,255,255,0.22)',
    nodeHover: 'rgba(255,255,255,0.32)',
    stroke: 'rgba(255,255,255,0.5)',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.75)',
    tileEmpty: 'rgba(255,255,255,0.15)',
    tileStroke: 'rgba(255,255,255,0.4)',
    xoText: '#ffffff',
    shadow: 'rgba(0,0,0,0.15)',
    edgeColor: 'rgba(255,255,255,0.5)',
  }
};

const ACTION_COLORS = {
  selection: '#e94560',
  expansion: '#00d9a5',
  simulation: '#4da8da',
  backpropagation: '#9333ea',
  bestMove: '#ff6b6b'
};

export const TreeVisualization: React.FC<TreeVisualizationProps> = ({
  tree,
  initialBoard,
  onNodeClick,
  onNextAction,
  onNextIteration,
  onAutoPlay,
  onSkipToEnd,
  onMakePlay,
  isAutoPlaying,
  isLastStep,
  canVisualize,
  currentAction,
  actionProgress,
  iterationProgress,
  theme = 'dark',
  language = 'en',
  symbolTransform,
  alwaysShowUcb = false,
  hideUcbPanel = false,
  perspectivePlayer = 'X'
}) => {
  const labels = PLAYER_LABELS[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = THEME_COLORS[theme];
  
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 100,
    zoom: 1
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<number>(-1);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(-1);
  const [ucbPanelHidden, setUcbPanelHidden] = useState(false);

  // Center tree on initial load
  useEffect(() => {
    if (!isInitialized && containerRef.current) {
      const container = containerRef.current;
      const centerX = container.clientWidth / 2 - NODE_SIZE.x / 2;
      setViewState({
        offsetX: centerX,
        offsetY: 80,
        zoom: 1
      });
      setIsInitialized(true);
    }
  }, [isInitialized, tree]);

  // Get node color based on state
  const getNodeColor = useCallback((node: TreeNode): string => {
    if (node.data.selected) return ACTION_COLORS.selection;
    if (node.data.expanded) return ACTION_COLORS.expansion;
    if (node.data.simulated) return ACTION_COLORS.simulation;
    if (node.data.backpropagated) return ACTION_COLORS.backpropagation;
    return colors.stroke;
  }, [colors.stroke]);

  // Helper function to draw rounded rectangle
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Draw a single node
  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    node: TreeNode,
    board: BoardState,
    playerLabels: { X: string; O: string }
  ) => {
    const x = (node.data.final_x ?? 0) * (1 + NODE_DISTANCE.x) * NODE_SIZE.x;
    const y = (node.data.y ?? 0) * (1 + NODE_DISTANCE.y) * NODE_SIZE.y;
    const boardSize = NODE_SIZE.x - 10;
    const tileSize = boardSize / 3;
    const boardOffset = 5;

    ctx.save();
    ctx.translate(x, y);

    const actionColor = getNodeColor(node);
    const hasAction = node.data.selected || node.data.expanded || node.data.simulated || node.data.backpropagated;
    
    // Draw shadow
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // Draw node background with rounded corners
    roundRect(ctx, 0, 0, NODE_SIZE.x, NODE_SIZE.y, BORDER_RADIUS);
    ctx.fillStyle = node.id === hoveredNodeId ? colors.nodeHover : colors.nodeBg;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw border
    roundRect(ctx, 0, 0, NODE_SIZE.x, NODE_SIZE.y, BORDER_RADIUS);
    if (hasAction) {
      ctx.strokeStyle = actionColor;
      ctx.lineWidth = 3;
    } else if (node.data.best_move) {
      ctx.strokeStyle = ACTION_COLORS.bestMove;
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();

    // Draw board state
    const displayBoard = node.data.simulated_board || board;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const tile = displayBoard[i * 3 + j];
        const tileX = boardOffset + j * tileSize;
        const tileY = boardOffset + i * tileSize;
        
        // Draw tile background with small radius
        roundRect(ctx, tileX + 1, tileY + 1, tileSize - 2, tileSize - 2, 4);
        if (tile === 'X') {
          ctx.fillStyle = ACTION_COLORS.selection;
        } else if (tile === 'O') {
          ctx.fillStyle = ACTION_COLORS.expansion;
        } else {
          ctx.fillStyle = colors.tileEmpty;
        }
        ctx.fill();
        
        // Draw tile border
        ctx.strokeStyle = colors.tileStroke;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Draw player label (H/M, Č/S, etc. or custom transform)
        if (tile) {
          ctx.fillStyle = colors.xoText;
          ctx.font = `bold ${tileSize * 0.55}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Use symbolTransform if provided, otherwise use playerLabels
          const displayLabel = symbolTransform 
            ? symbolTransform(tile)
            : (tile === 'X' ? playerLabels.X : playerLabels.O);
          ctx.fillText(displayLabel, tileX + tileSize / 2, tileY + tileSize / 2);
        }
      }
    }

    // Draw statistics
    const statsY = boardSize + 18;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('v:', 6, statsY);
    ctx.fillStyle = colors.text;
    ctx.fillText(`${node.data.value}`, 18, statsY);
    
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('n:', 38, statsY);
    ctx.fillStyle = colors.text;
    ctx.fillText(`${node.data.simulations}`, 50, statsY);
    
    if (tree && node.id !== 0) {
      const parent = getParent(tree, node);
      if (parent && node.data.simulations > 0) {
        const ucb = calculateUCB1(node, parent).toFixed(3);
        ctx.fillStyle = colors.textSecondary;
        ctx.fillText('ucb:', 6, statsY + 14);
        ctx.fillStyle = colors.text;
        ctx.fillText(ucb, 30, statsY + 14);
      }
    }

    // Draw collapse button
    if (node.data.should_show_collapse_btn && !node.data.simulated_board) {
      const btnY = NODE_SIZE.y + 8;
      ctx.beginPath();
      ctx.arc(NODE_SIZE.x / 2, btnY, 8, 0, Math.PI * 2);
      ctx.fillStyle = colors.stroke;
      ctx.fill();
      
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.data.collapsed ? '+' : '−', NODE_SIZE.x / 2, btnY);
    }

    // Draw simulation result label (Win/Loss/Draw) when simulated
    if (node.data.simulated && node.data.simulated_board) {
      const resultLabels = {
        sl: { win: 'ZMAGA', loss: 'PORAZ', draw: 'NEODL.' },
        en: { win: 'WIN', loss: 'LOSS', draw: 'DRAW' },
        de: { win: 'SIEG', loss: 'VERLUST', draw: 'UNENT.' }
      };
      const labels = resultLabels[language as keyof typeof resultLabels] || resultLabels.en;
      
      // Determine result based on value change (simulation adds +1 for win, -1 for loss, 0 for draw)
      // We look at the last action's effect
      let resultText = labels.draw;
      let resultColor = '#f59e0b'; // Yellow for draw
      
      // Check the simulated board for a winner
      const simBoard = node.data.simulated_board;
      const winLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];
      
      let winner: string | null = null;
      for (const [a, b, c] of winLines) {
        if (simBoard[a] && simBoard[a] === simBoard[b] && simBoard[a] === simBoard[c]) {
          winner = simBoard[a];
          break;
        }
      }
      
      // Determine WIN/LOSS from perspective of perspectivePlayer (default: X)
      const perspective = perspectivePlayer || 'X';
      if (winner === perspective) {
        // Current perspective player wins
        resultText = labels.win;
        resultColor = '#10b981'; // Green
      } else if (winner !== null) {
        // Other player wins - this is a loss from current perspective
        resultText = labels.loss;
        resultColor = '#ef4444'; // Red
      }
      
      // Draw result label below node
      const labelY = NODE_SIZE.y + 22;
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = resultColor;
      ctx.fillText(resultText, NODE_SIZE.x / 2, labelY);
    }

    ctx.restore();

    // Draw edges to children
    if (tree && !node.data.collapsed) {
      const children = getChildren(tree, node);
      if (children.length > 0) {
        ctx.save();
        ctx.strokeStyle = colors.edgeColor;
        ctx.lineWidth = 1.5;

        const parentCenterX = x + NODE_SIZE.x / 2;
        const lineY = y + NODE_SIZE.y + (NODE_DISTANCE.y / 2) * NODE_SIZE.y;

        ctx.beginPath();
        ctx.moveTo(parentCenterX, y + NODE_SIZE.y);
        ctx.lineTo(parentCenterX, lineY);
        ctx.stroke();

        if (children.length >= 1) {
          const firstChild = children[0];
          const lastChild = children[children.length - 1];
          const firstChildX = (firstChild.data.final_x ?? 0) * (1 + NODE_DISTANCE.x) * NODE_SIZE.x + NODE_SIZE.x / 2;
          const lastChildX = (lastChild.data.final_x ?? 0) * (1 + NODE_DISTANCE.x) * NODE_SIZE.x + NODE_SIZE.x / 2;
          
          ctx.beginPath();
          ctx.moveTo(firstChildX, lineY);
          ctx.lineTo(lastChildX, lineY);
          ctx.stroke();

          if (children.length === 1) {
            ctx.beginPath();
            ctx.moveTo(parentCenterX, lineY);
            ctx.lineTo(firstChildX, lineY);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    // Draw edge to parent
    if (node.id !== 0) {
      ctx.save();
      ctx.strokeStyle = node.data.simulated_board ? '#666' : colors.edgeColor;
      ctx.lineWidth = 1.5;
      
      if (node.data.simulated_board) {
        ctx.setLineDash([4, 4]);
      }
      
      const nodeCenterX = x + NODE_SIZE.x / 2;
      const parentLineY = y - (NODE_DISTANCE.y / 2) * NODE_SIZE.y;
      
      ctx.beginPath();
      ctx.moveTo(nodeCenterX, y);
      ctx.lineTo(nodeCenterX, parentLineY);
      ctx.stroke();
      
      ctx.restore();
    }
  }, [tree, hoveredNodeId, colors, getNodeColor, symbolTransform]);

  // Draw tree recursively
  const drawTree = useCallback((ctx: CanvasRenderingContext2D, node: TreeNode, board: BoardState) => {
    if (!tree) return;

    if (!node.data.collapsed) {
      const children = getChildren(tree, node);
      for (const child of children) {
        const childBoard = [...board];
        if (child.data.move && child.data.move.position !== null) {
          const symbol = child.data.move.player === 'machine' ? 'X' : 'O';
          childBoard[child.data.move.position] = symbol;
        }
        drawTree(ctx, child, childBoard);
      }
    }

    drawNode(ctx, node, board, labels);
  }, [tree, drawNode, labels]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !tree) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with theme background
    ctx.fillStyle = colors.canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.scale(viewState.zoom, viewState.zoom);

    const root = tree.nodes[0];
    if (root) {
      drawTree(ctx, root, initialBoard);
    }

    ctx.restore();
  }, [tree, viewState, initialBoard, drawTree, colors.canvasBg]);

  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    
    if (isDragging) {
      setViewState((prev: ViewState) => ({
        ...prev,
        offsetX: prev.offsetX + (e.clientX - lastMouse.x),
        offsetY: prev.offsetY + (e.clientY - lastMouse.y)
      }));
      setLastMouse({ x: e.clientX, y: e.clientY });
      if (canvas) canvas.style.cursor = 'grabbing';
      return;
    }

    if (tree && canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let foundNode = -1;
      let isOverCollapseBtn = false;
      
      for (const node of tree.nodes) {
        if (!node) continue;
        
        const nodeX = (node.data.final_x ?? 0) * (1 + NODE_DISTANCE.x) * NODE_SIZE.x * viewState.zoom + viewState.offsetX;
        const nodeY = (node.data.y ?? 0) * (1 + NODE_DISTANCE.y) * NODE_SIZE.y * viewState.zoom + viewState.offsetY;
        const nodeW = NODE_SIZE.x * viewState.zoom;
        const nodeH = NODE_SIZE.y * viewState.zoom;

        if (mouseX >= nodeX && mouseX <= nodeX + nodeW &&
            mouseY >= nodeY && mouseY <= nodeY + nodeH) {
          foundNode = node.id;
          break;
        }
        
        // Check if over collapse button
        if (node.data.should_show_collapse_btn && !node.data.simulated_board) {
          const btnCenterX = nodeX + (NODE_SIZE.x / 2) * viewState.zoom;
          const btnCenterY = nodeY + (NODE_SIZE.y + 8) * viewState.zoom;
          const btnRadius = 8 * viewState.zoom;
          const distance = Math.sqrt((mouseX - btnCenterX) ** 2 + (mouseY - btnCenterY) ** 2);
          if (distance <= btnRadius + 4) {
            foundNode = node.id;
            isOverCollapseBtn = true;
            break;
          }
        }
      }
      
      setHoveredNodeId(foundNode);
      
      // Set cursor based on what we're hovering
      if (foundNode !== -1 || isOverCollapseBtn) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'grab';
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNodeId(-1);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoveredNodeId !== -1 && tree) {
      const node = tree.nodes[hoveredNodeId];
      if (!node) return;
      
      // Check if click is on collapse button
      if (node.data.should_show_collapse_btn && !node.data.simulated_board) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const nodeX = (node.data.final_x ?? 0) * (1 + NODE_DISTANCE.x) * NODE_SIZE.x * viewState.zoom + viewState.offsetX;
          const nodeY = (node.data.y ?? 0) * (1 + NODE_DISTANCE.y) * NODE_SIZE.y * viewState.zoom + viewState.offsetY;
          
          // Collapse button center position
          const btnCenterX = nodeX + (NODE_SIZE.x / 2) * viewState.zoom;
          const btnCenterY = nodeY + (NODE_SIZE.y + 8) * viewState.zoom;
          const btnRadius = 8 * viewState.zoom;
          
          const distance = Math.sqrt((mouseX - btnCenterX) ** 2 + (mouseY - btnCenterY) ** 2);
          
          if (distance <= btnRadius + 4) {
            // Toggle collapsed state
            node.data.collapsed = !node.data.collapsed;
            // Force re-render
            setViewState(prev => ({ ...prev }));
            return;
          }
        }
      }
      
      // Select node for UCB panel
      setSelectedNodeId(node.id);
      
      // Also call onNodeClick if provided
      if (onNodeClick) {
        onNodeClick(node);
      }
    } else {
      // Click on empty space deselects
      setSelectedNodeId(-1);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setViewState((prev: ViewState) => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom + delta))
    }));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel, tree]);

  const zoomIn = () => setViewState((prev: ViewState) => ({ ...prev, zoom: Math.min(5, prev.zoom + 0.2) }));
  const zoomOut = () => setViewState((prev: ViewState) => ({ ...prev, zoom: Math.max(0.1, prev.zoom - 0.2) }));
  const resetView = () => {
    if (containerRef.current) {
      const centerX = containerRef.current.clientWidth / 2 - NODE_SIZE.x / 2;
      setViewState({ offsetX: centerX, offsetY: 80, zoom: 1 });
    }
  };

  // Find currently active node (selected/expanded/simulated/backpropagated)
  const getCurrentActiveNode = (): TreeNode | null => {
    if (!tree) return null;
    for (const node of tree.nodes) {
      if (node && (node.data.selected || node.data.expanded || node.data.simulated || node.data.backpropagated)) {
        return node;
      }
    }
    return null;
  };

  // UCB calculation helper - uses clicked node OR current active node
  const getUCBData = () => {
    if (!tree) return null;
    
    // Priority: clicked node > active node
    let node: TreeNode | null = null;
    let source: 'clicked' | 'active' | null = null;
    
    if (selectedNodeId >= 0) {
      node = tree.nodes[selectedNodeId] ?? null;
      source = 'clicked';
    } else {
      node = getCurrentActiveNode();
      source = node ? 'active' : null;
    }
    
    if (!node) return null;
    
    const parent = node.parent_id >= 0 ? tree.nodes[node.parent_id] : null;
    const v = node.data.value;
    const n = node.data.simulations;
    const N = parent?.data.simulations ?? 0;
    const C = Math.SQRT2; // √2 ≈ 1.414
    
    if (n === 0) {
      return { v, n, N, C, exploitation: 0, exploration: Infinity, ucb: Infinity, isRoot: !parent, source, nodeId: node.id };
    }
    
    const exploitation = v / n;
    const exploration = parent ? C * Math.sqrt(Math.log(N) / n) : 0;
    const ucb = exploitation + exploration;
    
    return { v, n, N, C, exploitation, exploration, ucb, isRoot: !parent, source, nodeId: node.id };
  };

  const ucbData = getUCBData();

  const ucbTranslations = {
    sl: {
      title: 'UCB Kalkulator',
      formula: 'Formula:',
      legend: 'Legenda:',
      v_desc: 'vrednost (zmage - porazi)',
      n_desc: 'število obiskov tega vozlišča',
      N_desc: 'število obiskov starša',
      C_desc: 'eksploracijska konstanta (√2)',
      exploitation: 'Eksploatacija',
      exploration: 'Eksploracija',
      result: 'UCB rezultat',
      root_note: '(koren nima starša)',
      click_hint: 'Klikni na vozlišče za prikaz UCB podatkov',
      current_node: 'Trenutno vozlišče',
      clicked_node: 'Izbrano vozlišče',
      active_node: 'Aktivno vozlišče',
      node_id: 'ID'
    },
    en: {
      title: 'UCB Calculator',
      formula: 'Formula:',
      legend: 'Legend:',
      v_desc: 'value (wins - losses)',
      n_desc: 'number of visits to this node',
      N_desc: 'number of visits to parent',
      C_desc: 'exploration constant (√2)',
      exploitation: 'Exploitation',
      exploration: 'Exploration',
      result: 'UCB result',
      root_note: '(root has no parent)',
      click_hint: 'Click on a node to show UCB data',
      current_node: 'Current node',
      clicked_node: 'Selected node',
      active_node: 'Active node',
      node_id: 'ID'
    },
    de: {
      title: 'UCB Rechner',
      formula: 'Formel:',
      legend: 'Legende:',
      v_desc: 'Wert (Siege - Niederlagen)',
      n_desc: 'Anzahl Besuche dieses Knotens',
      N_desc: 'Anzahl Besuche des Elternknotens',
      C_desc: 'Explorationskonst. (√2)',
      exploitation: 'Exploitation',
      exploration: 'Exploration',
      result: 'UCB Ergebnis',
      root_note: '(Wurzel hat kein Eltern)',
      click_hint: 'Klicke auf einen Knoten für UCB Daten',
      current_node: 'Aktueller Knoten',
      clicked_node: 'Ausgewählter Knoten',
      active_node: 'Aktiver Knoten',
      node_id: 'ID'
    }
  };
  const ut = ucbTranslations[language];

  return (
    <div className="visualization-panel" ref={containerRef}>
      {/* UCB Panel Toggle Button (when hidden) - only show if not alwaysShowUcb */}
      {/* UCB Panel Toggle Button (when hidden) - only show if not alwaysShowUcb and not hideUcbPanel */}
      {!hideUcbPanel && !alwaysShowUcb && ucbPanelHidden && (
        <button 
          className="ucb-panel-toggle show"
          onClick={() => setUcbPanelHidden(false)}
          title="Odpri UCB kalkulator"
        >
          📊 →
        </button>
      )}

      {/* UCB Calculator Panel - hide completely if hideUcbPanel */}
      {!hideUcbPanel && (
      <div className={`ucb-panel ${!alwaysShowUcb && ucbPanelHidden ? 'hidden' : ''}`}>
        <div className="ucb-header">
          <h3>{ut.title}</h3>
          {!alwaysShowUcb && (
            <button 
              className="ucb-hide-btn"
              onClick={() => setUcbPanelHidden(true)}
              title="Skrij panel"
            >
              ←
            </button>
          )}
        </div>
        
        <div className="ucb-formula">
          <span className="formula-label">{ut.formula}</span>
          <div className="formula-display-katex">
            <BlockMath math="UCB = \frac{v}{n} + C \cdot \sqrt{\frac{\ln(N)}{n}}" />
          </div>
        </div>
        
        {ucbData ? (
          <div className="ucb-values">
            <div className="ucb-source">
              <span className={`source-badge ${ucbData.source}`}>
                {ucbData.source === 'clicked' ? `🖱️ ${ut.clicked_node}` : `▶ ${ut.active_node}`}
              </span>
              <span className="node-id">{ut.node_id}: {ucbData.nodeId}</span>
            </div>
            <div className="ucb-row">
              <span className="ucb-var">v</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-val">{ucbData.v}</span>
              <span className="ucb-desc">{ut.v_desc}</span>
            </div>
            <div className="ucb-row">
              <span className="ucb-var">n</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-val">{ucbData.n}</span>
              <span className="ucb-desc">{ut.n_desc}</span>
            </div>
            <div className="ucb-row">
              <span className="ucb-var">N</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-val">{ucbData.N}</span>
              <span className="ucb-desc">{ut.N_desc} {ucbData.isRoot ? ut.root_note : ''}</span>
            </div>
            <div className="ucb-row">
              <span className="ucb-var">C</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-val">{ucbData.C.toFixed(3)}</span>
              <span className="ucb-desc">{ut.C_desc}</span>
            </div>
            <div className="ucb-divider"></div>
            <div className="ucb-calc-row">
              <span className="ucb-calc-label">{ut.exploitation}</span>
              <span className="ucb-calc-formula">v/n</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-calc-val">{ucbData.n > 0 ? ucbData.exploitation.toFixed(4) : '—'}</span>
            </div>
            <div className="ucb-calc-row">
              <span className="ucb-calc-label">{ut.exploration}</span>
              <span className="ucb-calc-formula">C·√(ln(N)/n)</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-calc-val">{ucbData.exploration === Infinity ? '∞' : ucbData.exploration.toFixed(4)}</span>
            </div>
            <div className="ucb-result">
              <span className="ucb-result-label">{ut.result}</span>
              <span className="ucb-equals">=</span>
              <span className="ucb-result-val">{ucbData.ucb === Infinity ? '∞' : ucbData.ucb.toFixed(4)}</span>
            </div>
          </div>
        ) : (
          <div className="ucb-hint">{ut.click_hint}</div>
        )}
        
        <div className="ucb-legend">
          <h4>{ut.legend}</h4>
          <div className="legend-grid">
            <span className="legend-var">v</span><span className="legend-eq">=</span><span>{ut.v_desc}</span>
            <span className="legend-var">n</span><span className="legend-eq">=</span><span>{ut.n_desc}</span>
            <span className="legend-var">N</span><span className="legend-eq">=</span><span>{ut.N_desc}</span>
            <span className="legend-var">C</span><span className="legend-eq">=</span><span>{ut.C_desc}</span>
          </div>
        </div>
      </div>
      )}

      {canVisualize && (
        <div className="viz-toolbar">
          <div className="toolbar-left">
            <span className={`action-badge ${currentAction}`}>{currentAction}</span>
            <span className="toolbar-progress">{actionProgress}</span>
            <span className="toolbar-iteration">Iter: {iterationProgress}</span>
          </div>
          <div className="toolbar-right">
            <button className="toolbar-btn" onClick={onNextAction} disabled={isLastStep} title="Naslednja akcija">→ Akcija</button>
            <button className="toolbar-btn" onClick={onNextIteration} disabled={isLastStep} title="Naslednja iteracija">⏭ Iter.</button>
            <button 
              className={`toolbar-btn ${isAutoPlaying ? 'danger' : ''}`} 
              onClick={onAutoPlay}
              disabled={isLastStep}
              title={isAutoPlaying ? 'Ustavi' : 'Avto predvajanje'}
            >
              {isAutoPlaying ? '⏹ Stop' : '▶ Play'}
            </button>
            <button className="toolbar-btn" onClick={onSkipToEnd} disabled={isLastStep} title="Skoči na konec">⏩ Konec</button>
            {isLastStep && (
              <button className="toolbar-btn primary" onClick={onMakePlay} title="Naredi potezo">✔ Naredi potezo</button>
            )}
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="tree-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
        <div className="zoom-slider-container">
          <input
            type="range"
            className="zoom-slider"
            min="10"
            max="500"
            value={viewState.zoom * 100}
            onChange={(e) => setViewState(prev => ({ ...prev, zoom: parseInt(e.target.value) / 100 }))}
          />
          <span className="zoom-level">{Math.round(viewState.zoom * 100)}%</span>
        </div>
        <button className="zoom-btn" onClick={zoomIn} title="Zoom in">+</button>
        <button className="zoom-btn reset" onClick={resetView} title="Reset pogled (100%)">⟲</button>
      </div>
    </div>
  );
};

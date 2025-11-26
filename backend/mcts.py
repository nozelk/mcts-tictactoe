"""
Monte Carlo Tree Search Algorithm
"""
import math
import random
from tree import Tree, Node
from tictactoe import TicTacToeBoard, GameMove, PLAYER, get_other_player, player_to_symbol

class GameNode:
    def __init__(self, move):
        self.move = move
        self.value = 0
        self.simulations = 0
    
    def copy(self):
        new_node = GameNode(self.move.copy() if self.move else None)
        new_node.value = self.value
        new_node.simulations = self.simulations
        return new_node

class AlgAction:
    def __init__(self, kind, node_id, old_data=None, new_data=None):
        self.kind = kind
        self.node_id = node_id
        self.old_data = old_data
        self.new_data = new_data
    
    def to_dict(self):
        result = {
            'kind': self.kind,
            'node_id': self.node_id
        }
        if self.old_data:
            result['old_data'] = self.old_data
        if self.new_data:
            result['new_data'] = self.new_data
        return result

def UCB1(node, parent):
    """Upper Confidence Bound 1 formula"""
    if node.data.simulations == 0:
        return float('inf')
    
    exploitation = node.data.value / node.data.simulations
    exploration = math.sqrt(2 * math.log(parent.data.simulations) / node.data.simulations)
    return exploitation + exploration

class MCTS:
    def __init__(self, model, player=PLAYER.MACHINE):
        self.model = model
        self.player = player
        
        # Create root node with opponent's "move" (represents current state)
        root_move = GameMove(get_other_player(player), None)
        root = Node(GameNode(root_move))
        self.tree = Tree(root)
    
    def run_search(self, iterations=50):
        """Run MCTS for given number of iterations"""
        trace = []
        
        for i in range(iterations):
            iteration_trace = self.run_search_iteration()
            trace.append([action.to_dict() for action in iteration_trace])
        
        # Find best move (most simulations)
        children = self.tree.get_children(self.tree.get(0))
        if children:
            best_node = max(children, key=lambda n: n.data.simulations)
            trace.append([AlgAction('finish', best_node.id).to_dict()])
            return {'move': best_node.data.move, 'trace': trace}
        
        return {'move': None, 'trace': trace}
    
    def run_search_iteration(self):
        """Single iteration: Select -> Expand -> Simulate -> Backpropagate"""
        # Selection
        select_res = self.select(self.model.copy())
        select_node = select_res['node']
        select_model = select_res['model']
        select_actions = select_res['actions']
        
        # Expansion
        expand_res = self.expand(select_node, select_model)
        expand_node = expand_res['node']
        expand_model = expand_res['model']
        expand_actions = expand_res['actions']
        
        # Simulation
        simulation = self.simulate(expand_node, expand_model)
        simulation_actions = simulation['actions']
        
        # Backpropagation
        backprop = self.backpropagate(expand_node, simulation['winner'])
        backprop_actions = backprop['actions']
        
        return select_actions + expand_actions + simulation_actions + backprop_actions
    
    def select(self, model):
        """Select phase: traverse tree using UCB1 until leaf or unexplored node"""
        node = self.tree.get(0)
        actions = [AlgAction('selection', node.id)]
        
        while not node.is_leaf() and self.is_fully_explored(node, model):
            node = self.get_best_child_ucb1(node)
            if node.data.move:
                model.make_move(node.data.move)
            actions.append(AlgAction('selection', node.id))
        
        return {'node': node, 'model': model, 'actions': actions}
    
    def get_best_child_ucb1(self, node):
        """Get child with highest UCB1 score"""
        children = self.tree.get_children(node)
        if not children:
            return node
        
        return max(children, key=lambda n: UCB1(n, node))
    
    def expand(self, node, model):
        """Expand phase: add new child node"""
        actions = []
        
        if model.check_win() == '':
            legal_positions = self.get_available_plays(node, model)
            if legal_positions:
                random_pos = random.choice(legal_positions)
                other_player = get_other_player(node.data.move.player)
                
                random_move = GameMove(other_player, random_pos)
                model.make_move(random_move)
                
                expanded_node = Node(GameNode(random_move))
                self.tree.insert(expanded_node, node)
                
                actions = [AlgAction('expansion', expanded_node.id)]
                return {'node': expanded_node, 'model': model, 'actions': actions}
        
        return {'node': node, 'model': model, 'actions': actions}
    
    def simulate(self, node, model):
        """Simulate phase: random playout until game ends"""
        current_player = node.data.move.player if node.data.move else self.player
        sim_model = model.copy()
        
        while sim_model.check_win() == '':
            current_player = get_other_player(current_player)
            sim_model.make_random_move(current_player)
        
        winner = sim_model.check_win()
        
        actions = [AlgAction('simulation', node.id, None, {
            'result': winner,
            'board': sim_model.grid[:]
        })]
        
        return {'winner': winner, 'actions': actions}
    
    def backpropagate(self, node, winner):
        """Backpropagate phase: update statistics up the tree"""
        actions = []
        current = node
        
        while current is not None:
            old_value = current.data.value
            old_visits = current.data.simulations
            
            current.data.simulations += 1
            
            if current.data.move and current.data.move.player:
                player_symbol = player_to_symbol(current.data.move.player)
                if winner == player_symbol:
                    current.data.value += 1
                elif winner != 'D' and winner != '':
                    current.data.value -= 1
            
            actions.append(AlgAction('backpropagation', current.id, 
                {'old_value': old_value, 'old_visits': old_visits},
                {'new_value': current.data.value, 'new_visits': current.data.simulations}
            ))
            
            if current.is_root():
                break
            current = self.tree.get_parent(current)
        
        return {'actions': actions}
    
    def is_fully_explored(self, node, model):
        """Check if all possible moves have been explored"""
        return len(self.get_available_plays(node, model)) == 0
    
    def get_available_plays(self, node, model):
        """Get legal positions not yet explored"""
        children = self.tree.get_children(node)
        explored_positions = {child.data.move.position for child in children if child.data.move}
        return [pos for pos in model.get_legal_positions() if pos not in explored_positions]

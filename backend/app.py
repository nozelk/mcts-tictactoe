"""
MCTS Tic-Tac-Toe Backend - Python Bottle
"""
from bottle import Bottle, response, request, static_file, run
import json
import random
from mcts import MCTS
from tictactoe import TicTacToeBoard, PLAYER

app = Bottle()

# CORS middleware
@app.hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With'

@app.route('/', method='OPTIONS')
@app.route('/<path:path>', method='OPTIONS')
def options_handler(path=None):
    return {}

@app.route('/api/mcts', method='POST')
@app.route('/mcts', method='POST')
def run_mcts():
    """
    Run MCTS algorithm on the given board state
    Request body: {
        "board": [9 elements: "", "X", "O"],
        "player": "X" | "O" | "machine" | "human",
        "iterations": number,
        "seed": optional number for reproducibility
    }
    """
    data = request.json
    board_state = data.get('board', [''] * 9)
    
    # Handle player - can be "X", "O", "machine", or "human"
    player_str = data.get('player', 'machine')
    if player_str in ['X', 'machine']:
        player = PLAYER.MACHINE
    else:
        player = PLAYER.HUMAN
    
    iterations = data.get('iterations', 100)
    seed = data.get('seed', None)
    
    # Set random seed if provided (for reproducible results)
    if seed is not None:
        random.seed(seed)
    
    # Create board from state
    board = TicTacToeBoard()
    board.grid = board_state[:]
    
    # Run MCTS
    mcts = MCTS(board.copy(), player)
    result = mcts.run_search(iterations)
    
    return json.dumps({
        'best_move': result['move'].position if result['move'] else None,
        'trace': result['trace'],
        'tree': serialize_tree(mcts.tree)
    })

def serialize_tree(tree):
    """Serialize tree for frontend"""
    nodes = []
    for node in tree.nodes:
        if node is None:
            nodes.append(None)
            continue
        nodes.append({
            'id': node.id,
            'parent_id': node.parent_id,
            'children_id': node.children_id,
            'data': {
                'move': {
                    'player': node.data.move.player if node.data.move else None,
                    'position': node.data.move.position if node.data.move else None
                } if node.data.move else None,
                'value': node.data.value,
                'simulations': node.data.simulations
            }
        })
    return {'nodes': nodes}

@app.route('/api/health', method='GET')
def health():
    return {'status': 'ok'}

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting MCTS Tic-Tac-Toe Backend on port {port}")
    run(app, host='0.0.0.0', port=port, debug=False)

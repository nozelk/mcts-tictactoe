"""
Tic-Tac-Toe Game Logic
"""
import random

class PLAYER:
    HUMAN = 'human'
    MACHINE = 'machine'

def get_other_player(player):
    return PLAYER.MACHINE if player == PLAYER.HUMAN else PLAYER.HUMAN

def player_to_symbol(player):
    return 'X' if player == PLAYER.MACHINE else 'O'

class GameMove:
    def __init__(self, player, position):
        self.player = player
        self.position = position
    
    def copy(self):
        return GameMove(self.player, self.position)
    
    def to_dict(self):
        return {
            'player': self.player,
            'position': self.position
        }

class TicTacToeBoard:
    def __init__(self):
        self.grid = [''] * 9
    
    def copy(self):
        new_board = TicTacToeBoard()
        new_board.grid = self.grid[:]
        return new_board
    
    def make_move(self, move):
        if move and move.position is not None:
            symbol = player_to_symbol(move.player)
            self.grid[move.position] = symbol
    
    def make_random_move(self, player):
        legal = self.get_legal_positions()
        if legal:
            pos = random.choice(legal)
            self.make_move(GameMove(player, pos))
            return pos
        return None
    
    def get_legal_positions(self):
        return [i for i, cell in enumerate(self.grid) if cell == '']
    
    def check_win(self):
        """
        Returns:
            'X' - Machine wins
            'O' - Human wins  
            'D' - Draw
            '' - Game continues
        """
        lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
            [0, 4, 8], [2, 4, 6]               # diagonals
        ]
        
        for line in lines:
            a, b, c = line
            if self.grid[a] and self.grid[a] == self.grid[b] == self.grid[c]:
                return self.grid[a]
        
        if '' not in self.grid:
            return 'D'  # Draw
        
        return ''  # Game continues
    
    def print_board(self):
        for i in range(3):
            row = self.grid[i*3:(i+1)*3]
            print(' | '.join(cell if cell else ' ' for cell in row))
            if i < 2:
                print('---------')

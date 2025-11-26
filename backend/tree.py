"""
Tree Data Structure for MCTS
"""

class Node:
    def __init__(self, data, id=-1, children_id=None, parent_id=-1):
        self.data = data
        self.id = id
        self.children_id = children_id if children_id else []
        self.parent_id = parent_id
    
    def copy(self):
        return Node(
            self.data.copy() if hasattr(self.data, 'copy') else self.data,
            self.id,
            self.children_id[:],
            self.parent_id
        )
    
    def has_n_children(self, n):
        return len(self.children_id) == n
    
    def is_leaf(self):
        return self.has_n_children(0)
    
    def is_root(self):
        return self.id == 0

class Tree:
    def __init__(self, root):
        root.id = 0
        self.nodes = [root]
    
    def get(self, id):
        if 0 <= id < len(self.nodes):
            return self.nodes[id]
        return None
    
    def insert(self, node, parent):
        node.id = len(self.nodes)
        node.parent_id = parent.id
        self.nodes.append(node)
        self.nodes[node.parent_id].children_id.append(node.id)
    
    def get_parent(self, node):
        if node.parent_id >= 0:
            return self.nodes[node.parent_id]
        return None
    
    def get_children(self, node):
        if not node:
            return []
        return [self.nodes[child_id] for child_id in node.children_id if child_id < len(self.nodes)]
    
    def get_siblings(self, node):
        parent = self.get_parent(node)
        if parent:
            return self.get_children(parent)
        return []
    
    def get_root(self):
        return self.get(0)
    
    def copy(self):
        new_tree = Tree.__new__(Tree)
        new_tree.nodes = [node.copy() for node in self.nodes]
        return new_tree
    
    def remove(self, node):
        """Remove node and its descendants"""
        if node.is_root():
            return []
        
        removed = self._remove_rec(node)
        self.nodes = [n for n in self.nodes if n is not None]
        
        # Reindex
        for i, n in enumerate(self.nodes):
            if n:
                old_id = n.id
                n.id = i
        
        return removed
    
    def _remove_rec(self, node):
        removed = []
        
        for child in self.get_children(node)[:]:
            removed.extend(self._remove_rec(child))
        
        parent = self.get_parent(node)
        if parent and node.id in parent.children_id:
            parent.children_id.remove(node.id)
        
        self.nodes[node.id] = None
        removed.append(node.id)
        
        return removed

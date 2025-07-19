"""
In-memory graph database for managing formula dependencies and topological sorting.
"""

import logging
from typing import Dict, List, Set, Any, Tuple, Optional
from collections import defaultdict, deque
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CellRef:
    """Represents a cell reference (e.g., A1, B5)"""
    column: str
    row: int
    
    def __str__(self):
        return f"{self.column}{self.row}"
    
    def __hash__(self):
        return hash((self.column, self.row))


@dataclass
class FormulaNode:
    """Represents a formula node in the dependency graph"""
    cell_ref: CellRef
    formula: str
    dependencies: Set[CellRef]
    dependents: Set[CellRef]
    value: Any = None
    is_evaluated: bool = False
    has_error: bool = False
    error_message: str = None


class DependencyGraph:
    """
    In-memory graph database for managing formula dependencies.
    Handles circular dependency detection and provides topological sorting.
    """
    
    def __init__(self):
        self.nodes: Dict[CellRef, FormulaNode] = {}
        self.adjacency_list: Dict[CellRef, Set[CellRef]] = defaultdict(set)
        self.reverse_adjacency_list: Dict[CellRef, Set[CellRef]] = defaultdict(set)
        self._evaluation_order: List[CellRef] = []
        self._dirty_cells: Set[CellRef] = set()
    
    def add_formula(self, cell_ref: CellRef, formula: str, dependencies: Set[CellRef]) -> bool:
        """Add or update a formula in the graph."""
        try:
            # Remove existing node if it exists
            if cell_ref in self.nodes:
                self._remove_node(cell_ref)
            
            # Create new node
            node = FormulaNode(
                cell_ref=cell_ref,
                formula=formula,
                dependencies=dependencies.copy(),
                dependents=set()
            )
            
            # Check for circular dependencies before adding
            logger.info(f"Testing for circular dependencies for {cell_ref} with dependencies {dependencies},{len(dependencies)}")
            if self._would_create_cycle(cell_ref, dependencies):
                logger.warning(f"Circular dependency detected for cell {cell_ref}")
                return False
            
            # Add node to graph
            self.nodes[cell_ref] = node
            
            # Update adjacency lists
            for dep in dependencies:
                self.adjacency_list[dep].add(cell_ref)
                self.reverse_adjacency_list[cell_ref].add(dep)
                
                # Update dependent's dependents list
                if dep in self.nodes:
                    self.nodes[dep].dependents.add(cell_ref)
            
            # Mark this cell and its dependents as dirty
            self._mark_dirty(cell_ref)
            
            # Recalculate evaluation order
            self._update_evaluation_order()
            
            logger.info(f"Added formula {formula} for cell {cell_ref}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding formula for cell {cell_ref}: {str(e)}")
            return False
    
    def get_evaluation_order(self) -> List[CellRef]:
        """Get the topologically sorted evaluation order for all formulas."""
        return self._evaluation_order.copy()
    
    def mark_cell_evaluated(self, cell_ref: CellRef, value: Any, has_error: bool = False, error_message: str = None):
        """Mark a cell as evaluated with its result."""
        if cell_ref in self.nodes:
            node = self.nodes[cell_ref]
            node.value = value
            node.is_evaluated = True
            node.has_error = has_error
            node.error_message = error_message
            
            # Remove from dirty cells
            self._dirty_cells.discard(cell_ref)
    
    def has_circular_dependency(self) -> Tuple[bool, Optional[List[CellRef]]]:
        """Check if the graph has circular dependencies."""
        visited = set()
        rec_stack = set()
        
        def dfs(node: CellRef, path: List[CellRef]) -> Optional[List[CellRef]]:
            visited.add(node)
            rec_stack.add(node)
            current_path = path + [node]
            
            for neighbor in self.adjacency_list[node]:
                if neighbor not in visited:
                    cycle = dfs(neighbor, current_path)
                    if cycle:
                        return cycle
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start = current_path.index(neighbor)
                    return current_path[cycle_start:] + [neighbor]
            
            rec_stack.remove(node)
            return None
        
        for node in self.nodes:
            if node not in visited:
                cycle = dfs(node, [])
                if cycle:
                    return True, cycle
        
        return False, None
    
    def get_graph_stats(self) -> Dict[str, Any]:
        """Get statistics about the dependency graph."""
        return {
            'total_formulas': len(self.nodes),
            'dirty_cells': len(self._dirty_cells),
            'evaluation_order_length': len(self._evaluation_order),
            'has_cycles': self.has_circular_dependency()[0],
            'max_dependencies': max(len(node.dependencies) for node in self.nodes.values()) if self.nodes else 0,
            'max_dependents': max(len(node.dependents) for node in self.nodes.values()) if self.nodes else 0
        }
    
    def _remove_node(self, cell_ref: CellRef):
        """Remove a node and all its connections from the graph."""
        if cell_ref not in self.nodes:
            return
        
        node = self.nodes[cell_ref]
        
        # Remove edges from dependencies
        for dep in node.dependencies:
            self.adjacency_list[dep].discard(cell_ref)
            if dep in self.nodes:
                self.nodes[dep].dependents.discard(cell_ref)
        
        # Remove edges to dependents
        for dependent in node.dependents:
            self.reverse_adjacency_list[dependent].discard(cell_ref)
            if dependent in self.nodes:
                self.nodes[dependent].dependencies.discard(cell_ref)
        
        # Remove from adjacency lists
        if cell_ref in self.adjacency_list:
            del self.adjacency_list[cell_ref]
        if cell_ref in self.reverse_adjacency_list:
            del self.reverse_adjacency_list[cell_ref]
        
        # Remove node
        del self.nodes[cell_ref]
    
    def _would_create_cycle(self, new_cell: CellRef, dependencies: Set[CellRef]) -> bool:
        """Check if adding this formula would create a circular dependency."""
        # Temporarily add the edges to check for cycles
        temp_adjacency = defaultdict(set)
        for cell, deps in self.adjacency_list.items():
            temp_adjacency[cell] = deps.copy()
        
        # Add new dependencies
        for dep in dependencies:
            temp_adjacency[dep].add(new_cell)
        
        # Check for cycles using DFS
        visited = set()
        rec_stack = set()
        
        def has_cycle_dfs(node: CellRef) -> bool:
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in temp_adjacency[node]:
                if neighbor not in visited:
                    if has_cycle_dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        # Check all nodes (including the new one)
        all_nodes = set(self.nodes.keys()) | {new_cell}
        for node in all_nodes:
            if node not in visited:
                if has_cycle_dfs(node):
                    return True
        
        return False
    
    def _mark_dirty(self, cell_ref: CellRef):
        """Mark a cell and all its dependents as dirty (needing re-evaluation)."""
        dirty_queue = deque([cell_ref])
        
        while dirty_queue:
            current = dirty_queue.popleft()
            if current in self._dirty_cells:
                continue
            
            self._dirty_cells.add(current)
            
            # Add all dependents to the queue
            if current in self.nodes:
                dirty_queue.extend(self.nodes[current].dependents)

    def get_dirty_cells(self) -> Set[CellRef]:
        """Get all cells that are marked as dirty."""
        return self._dirty_cells.copy()

    def _update_evaluation_order(self):
        """Update the topological evaluation order using Kahn's algorithm."""
        try:
            # Only sort formula nodes (nodes that have formulas)
            formula_nodes = list(self.nodes.keys())
            
            if not formula_nodes:
                self._evaluation_order = []
                logger.info("No formula nodes to sort")
                return
            
            # Calculate in-degrees only for formula nodes
            # A formula node's in-degree is the number of OTHER formula nodes it depends on
            in_degree = defaultdict(int)
            
            for node in formula_nodes:
                in_degree[node] = 0
                # Count dependencies that are also formula nodes
                for dep in self.nodes[node].dependencies:
                    if dep in self.nodes:  # Only count if dependency is also a formula node
                        in_degree[node] += 1
            
            # Initialize queue with formula nodes that have no formula dependencies
            queue = deque([node for node in formula_nodes if in_degree[node] == 0])
            result = []
            
            while queue:
                current = queue.popleft()
                result.append(current)
                
                # Decrease in-degree of dependent formula nodes
                for dependent in self.adjacency_list[current]:
                    if dependent in self.nodes:  # Only process if it's a formula node
                        in_degree[dependent] -= 1
                        if in_degree[dependent] == 0:
                            queue.append(dependent)
            
            # Check if all formula nodes were processed (no cycles among formulas)
            if len(result) != len(formula_nodes):
                logger.error(f"Topological sort failed - circular dependency detected among formulas. Processed {len(result)}/{len(formula_nodes)} nodes")
                # Still use partial result for debugging
                self._evaluation_order = result
            else:
                self._evaluation_order = result
            
            logger.info(f"Updated evaluation order: {[str(cell) for cell in self._evaluation_order]}")
            
        except Exception as e:
            logger.error(f"Error updating evaluation order: {str(e)}")
            self._evaluation_order = list(self.nodes.keys())
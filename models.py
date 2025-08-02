"""
Rubik's Cube Model and Logic
Core cube representation and move mechanics
"""
import random
import json
from typing import List, Dict, Tuple, Optional

class RubiksCube:
    def __init__(self, size: int = 3):
        """Initialize a solved cube with standard color scheme"""
        self.size = size
        self.faces = {
            'U': [['W' for _ in range(size)] for _ in range(size)],  # Up (White)
            'R': [['R' for _ in range(size)] for _ in range(size)],  # Right (Red)
            'F': [['G' for _ in range(size)] for _ in range(size)],  # Front (Green)
            'D': [['Y' for _ in range(size)] for _ in range(size)],  # Down (Yellow)
            'L': [['O' for _ in range(size)] for _ in range(size)],  # Left (Orange)
            'B': [['B' for _ in range(size)] for _ in range(size)]   # Back (Blue)
        }
        self.move_history = []
        
    def get_state(self) -> Dict:
        """Get current cube state in frontend-compatible format"""
        def flatten_face(face):
            """Convert NxN face to flat array of N² colors"""
            color_map = {
                'W': 'white',
                'R': 'red', 
                'G': 'green',
                'Y': 'yellow',
                'O': 'orange',
                'B': 'blue'
            }
            return [color_map.get(color, color.lower()) for row in face for color in row]
        
        state = {
            'front': flatten_face(self.faces['F']),
            'back': flatten_face(self.faces['B']), 
            'left': flatten_face(self.faces['L']),
            'right': flatten_face(self.faces['R']),
            'top': flatten_face(self.faces['U']),
            'bottom': flatten_face(self.faces['D']),
            'size': self.size  # Include cube size
        }
        
        return state
    
    def get_state_string(self) -> str:
        """Get cube state as string for hashing"""
        state = ''
        for face in ['U', 'R', 'F', 'D', 'L', 'B']:
            for row in self.faces[face]:
                for color in row:
                    state += color
        return state
    
    def is_solved(self) -> bool:
        """Check if cube is in solved state"""
        for face_name, face in self.faces.items():
            center_row = self.size // 2
            center_col = self.size // 2
            center_color = face[center_row][center_col]  # Get center piece color
            for row in face:
                for color in row:
                    if color != center_color:
                        return False
        return True
    
    def get_move_count(self) -> int:
        """Get number of moves made"""
        return len(self.move_history)
    
    def clone(self):
        """Create a deep copy of the cube"""
        new_cube = RubiksCube(self.size)
        new_cube.faces = json.loads(json.dumps(self.faces))
        new_cube.move_history = self.move_history.copy()
        return new_cube
    
    def reset(self):
        """Reset to solved state"""
        self.__init__(self.size)
    
    def rotate_face_clockwise(self, face: str):
        """Rotate a face 90 degrees clockwise for any size cube"""
        f = self.faces[face]
        n = self.size
        
        # Create temporary copy
        temp = [row[:] for row in f]
        
        # Rotate the face
        for i in range(n):
            for j in range(n):
                f[j][n-1-i] = temp[i][j]
    
    def rotate_face_counterclockwise(self, face: str):
        """Rotate a face 90 degrees counter-clockwise for any size cube"""
        f = self.faces[face]  
        n = self.size
        
        # Create temporary copy
        temp = [row[:] for row in f]
        
        # Rotate the face
        for i in range(n):
            for j in range(n):
                f[n-1-j][i] = temp[i][j]
    
    def apply_move(self, move: str) -> bool:
        """Apply a single move to the cube"""
        try:
            if move == 'U':
                self._move_U()
            elif move == "U'":
                self._move_U_prime()
            elif move == 'R':
                self._move_R()
            elif move == "R'":
                self._move_R_prime()
            elif move == 'F':
                self._move_F()
            elif move == "F'":
                self._move_F_prime()
            elif move == 'D':
                self._move_D()
            elif move == "D'":
                self._move_D_prime()
            elif move == 'L':
                self._move_L()
            elif move == "L'":
                self._move_L_prime()
            elif move == 'B':
                self._move_B()
            elif move == "B'":
                self._move_B_prime()
            else:
                return False
            
            self.move_history.append(move)
            return True
        except Exception:
            return False
    
    def apply_move_sequence(self, moves: List[str]):
        """Apply a sequence of moves"""
        for move in moves:
            self.apply_move(move)
    
    def generate_scramble(self, length: int = 25) -> List[str]:
        """Generate a random scramble sequence"""
        moves = ['U', "U'", 'R', "R'", 'F', "F'", 'D', "D'", 'L', "L'", 'B', "B'"]
        scramble = []
        last_face = ''
        
        for _ in range(length):
            # Avoid consecutive moves on same face
            available_moves = [m for m in moves if m[0] != last_face]
            move = random.choice(available_moves)
            scramble.append(move)
            last_face = move[0]
        
        return scramble
    
    def is_valid_state(self) -> bool:
        """Check if current state is valid and solvable"""
        # Count colors
        color_counts = {'W': 0, 'R': 0, 'G': 0, 'Y': 0, 'O': 0, 'B': 0}
        
        for face in self.faces.values():
            for row in face:
                for color in row:
                    if color in color_counts:
                        color_counts[color] += 1
                    else:
                        return False
        
        # Each color should appear exactly size² times
        expected_count = self.size * self.size
        return all(count == expected_count for count in color_counts.values())
    
    # Move implementations for any size cube
    def _move_U(self):
        """Up face clockwise for any size cube"""
        self.rotate_face_clockwise('U')
        
        # Rotate adjacent edges (top row)
        temp = self.faces['F'][0][:]
        self.faces['F'][0] = self.faces['R'][0][:]
        self.faces['R'][0] = self.faces['B'][0][:]
        self.faces['B'][0] = self.faces['L'][0][:]
        self.faces['L'][0] = temp
    
    def _move_U_prime(self):
        """Up face counter-clockwise for any size cube"""
        self.rotate_face_counterclockwise('U')
        
        # Rotate adjacent edges (reverse of U)
        temp = self.faces['F'][0][:]
        self.faces['F'][0] = self.faces['L'][0][:]
        self.faces['L'][0] = self.faces['B'][0][:]
        self.faces['B'][0] = self.faces['R'][0][:]
        self.faces['R'][0] = temp
    
    def _move_R(self):
        """Right face clockwise for any size cube"""
        self.rotate_face_clockwise('R')
        
        # For NxN cube, move right column of each face
        n = self.size
        temp = [self.faces['U'][i][n-1] for i in range(n)]
        for i in range(n):
            self.faces['U'][i][n-1] = self.faces['F'][i][n-1]
            self.faces['F'][i][n-1] = self.faces['D'][i][n-1]
            self.faces['D'][i][n-1] = self.faces['B'][n-1-i][0]
            self.faces['B'][n-1-i][0] = temp[i]
    
    def _move_R_prime(self):
        """Right face counter-clockwise for any size cube"""
        self.rotate_face_counterclockwise('R')
        
        n = self.size
        temp = [self.faces['U'][i][n-1] for i in range(n)]
        for i in range(n):
            self.faces['U'][i][n-1] = self.faces['B'][n-1-i][0]
            self.faces['B'][n-1-i][0] = self.faces['D'][i][n-1]
            self.faces['D'][i][n-1] = self.faces['F'][i][n-1]
            self.faces['F'][i][n-1] = temp[i]
    
    def _move_F(self):
        """Front face clockwise for any size cube"""
        self.rotate_face_clockwise('F')
        
        n = self.size
        temp = self.faces['U'][n-1][:]
        self.faces['U'][n-1] = [self.faces['L'][n-1-i][n-1] for i in range(n)]
        for i in range(n):
            self.faces['L'][i][n-1] = self.faces['D'][0][i]
        self.faces['D'][0] = [self.faces['R'][n-1-i][0] for i in range(n)]
        for i in range(n):
            self.faces['R'][i][0] = temp[i]
    
    def _move_F_prime(self):
        """Front face counter-clockwise for any size cube"""
        self.rotate_face_counterclockwise('F')
        
        n = self.size
        temp = self.faces['U'][n-1][:]
        for i in range(n):
            self.faces['U'][n-1][i] = self.faces['R'][i][0]
        for i in range(n):
            self.faces['R'][i][0] = self.faces['D'][0][n-1-i]
        for i in range(n):
            self.faces['D'][0][i] = self.faces['L'][i][n-1]
        for i in range(n):
            self.faces['L'][i][n-1] = temp[n-1-i]
    
    def _move_D(self):
        """Down face clockwise for any size cube"""
        self.rotate_face_clockwise('D')
        
        n = self.size
        temp = self.faces['F'][n-1][:]
        self.faces['F'][n-1] = self.faces['L'][n-1][:]
        self.faces['L'][n-1] = self.faces['B'][n-1][:]
        self.faces['B'][n-1] = self.faces['R'][n-1][:]
        self.faces['R'][n-1] = temp
    
    def _move_D_prime(self):
        """Down face counter-clockwise for any size cube"""
        self.rotate_face_counterclockwise('D')
        
        n = self.size
        temp = self.faces['F'][n-1][:]
        self.faces['F'][n-1] = self.faces['R'][n-1][:]
        self.faces['R'][n-1] = self.faces['B'][n-1][:]
        self.faces['B'][n-1] = self.faces['L'][n-1][:]
        self.faces['L'][n-1] = temp
    
    def _move_L(self):
        """Left face clockwise for any size cube"""
        self.rotate_face_clockwise('L')
        
        n = self.size
        temp = [self.faces['U'][i][0] for i in range(n)]
        for i in range(n):
            self.faces['U'][i][0] = self.faces['B'][n-1-i][n-1]
            self.faces['B'][n-1-i][n-1] = self.faces['D'][i][0]
            self.faces['D'][i][0] = self.faces['F'][i][0]
            self.faces['F'][i][0] = temp[i]
    
    def _move_L_prime(self):
        """Left face counter-clockwise for any size cube"""
        self.rotate_face_counterclockwise('L')
        
        n = self.size
        temp = [self.faces['U'][i][0] for i in range(n)]
        for i in range(n):
            self.faces['U'][i][0] = self.faces['F'][i][0]
            self.faces['F'][i][0] = self.faces['D'][i][0]
            self.faces['D'][i][0] = self.faces['B'][n-1-i][n-1]
            self.faces['B'][n-1-i][n-1] = temp[i]
    
    def _move_B(self):
        """Back face clockwise for any size cube"""
        self.rotate_face_clockwise('B')
        
        n = self.size
        temp = self.faces['U'][0][:]
        for i in range(n):
            self.faces['U'][0][i] = self.faces['R'][i][n-1]
        for i in range(n):
            self.faces['R'][i][n-1] = self.faces['D'][n-1][n-1-i]
        for i in range(n):
            self.faces['D'][n-1][i] = self.faces['L'][i][0]
        for i in range(n):
            self.faces['L'][i][0] = temp[n-1-i]
    
    def _move_B_prime(self):
        """Back face counter-clockwise for any size cube"""
        self.rotate_face_counterclockwise('B')
        
        n = self.size
        temp = self.faces['U'][0][:]
        for i in range(n):
            self.faces['U'][0][i] = self.faces['L'][n-1-i][0]
        for i in range(n):
            self.faces['L'][i][0] = self.faces['D'][n-1][i]
        for i in range(n):
            self.faces['D'][n-1][i] = self.faces['R'][n-1-i][n-1]
        for i in range(n):
            self.faces['R'][i][n-1] = temp[i]

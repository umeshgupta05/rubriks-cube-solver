from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import random
from datetime import datetime

from cube_solver import CubeSolver
from models import RubiksCube

app = Flask(__name__)
CORS(app)

# Global cube instance - default 3x3
cube = RubiksCube(3)
solver = CubeSolver()

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/new-cube', methods=['POST'])
def create_new_cube():
    """Create a new cube with specified size"""
    global cube
    try:
        data = request.get_json() or {}
        size = data.get('size', 3)
        
        # Validate size
        if size < 2 or size > 7:  # Reasonable limits
            return jsonify({
                'success': False,
                'error': 'Cube size must be between 2 and 7'
            }), 400
        
        cube = RubiksCube(size)
        
        return jsonify({
            'success': True,
            'size': size,
            'state': cube.get_state(),
            'is_solved': cube.is_solved(),
            'move_count': cube.get_move_count()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/state', methods=['GET'])
@app.route('/api/cube-state', methods=['GET'])
def get_cube_state():
    """Get current cube state"""
    return jsonify({
        'state': cube.get_state(),
        'is_solved': cube.is_solved(),
        'move_count': cube.get_move_count(),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/scramble', methods=['POST'])
def scramble_cube():
    """Generate and apply a random scramble"""
    try:
        data = request.get_json() or {}
        length = data.get('moves', 25)  # Changed from 'length' to 'moves' to match frontend
        
        print(f"Before scramble - Is solved: {cube.is_solved()}")
        print(f"Before scramble state: {cube.get_state()}")
        
        scramble_moves = cube.generate_scramble(length)
        print(f"Generated scramble moves: {scramble_moves}")
        
        cube.apply_move_sequence(scramble_moves)
        
        print(f"After scramble - Is solved: {cube.is_solved()}")
        print(f"After scramble state: {cube.get_state()}")
        
        result = {
            'success': True,
            'moves': scramble_moves,  # Changed from 'scramble' to 'moves'
            'state': cube.get_state(),
            'is_solved': cube.is_solved(),
            'move_count': cube.get_move_count()
        }
        
        print(f"Returning result: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"Scramble error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/move', methods=['POST'])
def execute_move():
    """Execute a single move"""
    try:
        data = request.get_json()
        move = data.get('move')
        
        if not move:
            return jsonify({
                'success': False,
                'error': 'Move is required'
            }), 400
        
        success = cube.apply_move(move)
        
        return jsonify({
            'success': success,
            'move': move,
            'state': cube.get_state(),
            'is_solved': cube.is_solved(),
            'move_count': cube.get_move_count()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/moves', methods=['POST'])
def execute_moves():
    """Execute multiple moves in sequence"""
    try:
        data = request.get_json()
        moves = data.get('moves', [])
        
        if not moves:
            return jsonify({
                'success': False,
                'error': 'Moves array is required'
            }), 400
        
        for move in moves:
            cube.apply_move(move)
        
        return jsonify({
            'success': True,
            'moves': moves,
            'state': cube.get_state(),
            'is_solved': cube.is_solved(),
            'move_count': cube.get_move_count()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/solve', methods=['POST'])
def solve_cube():
    """Solve the cube and return solution steps"""
    try:
        data = request.get_json() or {}
        algorithm = data.get('algorithm', 'kociemba')
        
        print(f"Solve request - Algorithm: {algorithm}")
        print(f"Cube state before solving: {cube.get_state()}")
        print(f"Is solved before: {cube.is_solved()}")
        
        if cube.is_solved():
            return jsonify({
                'success': True,
                'already_solved': True,
                'message': 'Cube is already solved!',
                'moves': [],
                'steps': [{'step': 'Already Solved', 'moves': [], 'description': 'Cube is already solved'}],
                'algorithm': algorithm,
                'time': 0
            })
        
        # Store current state before solving (for reference)
        initial_state = cube.get_state()
        initial_state_string = cube.get_state_string()
        
        # Create a working copy for solving
        working_cube = cube.clone()
        
        # Solve the working cube
        solution_result = solver.solve(working_cube, algorithm)
        
        print(f"Solution result: {solution_result}")
        
        if solution_result['success']:
            # Now apply the solution to the original cube
            if solution_result.get('moves'):
                print(f"Applying {len(solution_result['moves'])} moves to original cube")
                cube.apply_move_sequence(solution_result['moves'])
            
            print(f"Cube state after applying solution: {cube.get_state()}")
            print(f"Is solved after applying solution: {cube.is_solved()}")
            
            return jsonify({
                'success': True,
                'moves': solution_result['moves'],
                'steps': solution_result.get('steps', []),
                'algorithm': solution_result.get('algorithm', algorithm),
                'time': solution_result.get('time', 0),
                'initial_state': initial_state,
                'final_state': cube.get_state(),
                'is_solved': cube.is_solved(),
                'move_count': len(solution_result.get('moves', []))
            })
        else:
            return jsonify({
                'success': False,
                'error': solution_result.get('error', 'Failed to solve cube')
            }), 400
            
    except Exception as e:
        print(f"Solve error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/reset', methods=['POST'])
def reset_cube():
    """Reset cube to solved state"""
    try:
        cube.reset()
        return jsonify({
            'success': True,
            'state': cube.get_state(),
            'is_solved': cube.is_solved(),
            'move_count': cube.get_move_count()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/is_solved', methods=['GET'])
def check_solved():
    """Check if cube is solved"""
    try:
        return jsonify({
            'success': True,
            'solved': cube.is_solved(),
            'state': cube.get_state(),
            'move_count': cube.get_move_count()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get cube statistics"""
    try:
        return jsonify({
            'success': True,
            'stats': {
                'move_count': cube.get_move_count(),
                'is_solved': cube.is_solved(),
                'timestamp': datetime.now().isoformat(),
                'state_summary': cube.get_state_summary() if hasattr(cube, 'get_state_summary') else 'N/A'
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/validate', methods=['POST'])
def validate_cube():
    """Validate if current cube state is solvable"""
    try:
        is_valid = cube.is_valid_state()
        return jsonify({
            'success': True,
            'is_valid': is_valid,
            'state': cube.get_state()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("🎲 Starting Rubik's Cube Solver Server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔗 API Documentation: http://localhost:5000/api/cube-state")
    
    app.run(debug=True, host='0.0.0.0', port=5000)

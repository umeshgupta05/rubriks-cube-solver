/**
 * Move Engine - Coordinates between cube logic and 3D rendering
 * Ensures perfect synchronization between state and visualization
 */

class MoveEngine {
  constructor(cube, renderer) {
    this.cube = cube;
    this.renderer = renderer;
    this.moveHistory = [];
    this.isExecuting = false;
    this.executionQueue = [];

    // Event callbacks
    this.onMoveComplete = null;
    this.onSequenceComplete = null;
    this.onStateChange = null;
  }

  // Execute a single move with animation
  executeMove(move, animate = true) {
    return new Promise((resolve, reject) => {
      if (this.isExecuting && animate) {
        this.executionQueue.push({ move, animate, resolve, reject });
        return;
      }

      try {
        this.isExecuting = true;

        // Apply move to cube model
        const stateChanged = this.cube.applyMove(move);

        if (!stateChanged) {
          this.isExecuting = false;
          resolve(false);
          return;
        }

        // Update move history
        this.moveHistory.push({
          move: move,
          timestamp: Date.now(),
          state: this.cube.getStateString(),
        });

        // Update visual representation
        if (animate && this.renderer) {
          this.renderer.animateMove(move, () => {
            // Update colors after animation
            this.renderer.updateCubeColors(this.cube.faces);

            this.isExecuting = false;

            // Trigger callbacks
            if (this.onMoveComplete) {
              this.onMoveComplete(move, this.cube.isSolved());
            }
            if (this.onStateChange) {
              this.onStateChange(this.cube);
            }

            resolve(true);
            this.processQueue();
          });
        } else {
          // No animation - just update colors
          if (this.renderer) {
            this.renderer.updateCubeColors(this.cube.faces);
          }

          this.isExecuting = false;

          if (this.onMoveComplete) {
            this.onMoveComplete(move, this.cube.isSolved());
          }
          if (this.onStateChange) {
            this.onStateChange(this.cube);
          }

          resolve(true);
          this.processQueue();
        }
      } catch (error) {
        this.isExecuting = false;
        reject(error);
        this.processQueue();
      }
    });
  }

  // Execute a sequence of moves
  async executeSequence(moveString, animate = true, delay = 100) {
    const moves = this.parseMoveString(moveString);
    const results = [];

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];

      try {
        const result = await this.executeMove(move, animate);
        results.push({ move, success: result });

        // Add delay between moves if animating
        if (animate && delay > 0 && i < moves.length - 1) {
          await this.wait(delay);
        }
      } catch (error) {
        results.push({ move, success: false, error });
        break;
      }
    }

    if (this.onSequenceComplete) {
      this.onSequenceComplete(results, this.cube.isSolved());
    }

    return results;
  }

  // Parse move string into individual moves
  parseMoveString(moveString) {
    if (Array.isArray(moveString)) {
      return moveString;
    }

    return moveString
      .trim()
      .split(/\s+/)
      .filter((move) => move.length > 0)
      .map((move) => move.trim());
  }

  // Process execution queue
  processQueue() {
    if (this.executionQueue.length > 0 && !this.isExecuting) {
      const next = this.executionQueue.shift();
      this.executeMove(next.move, next.animate)
        .then(next.resolve)
        .catch(next.reject);
    }
  }

  // Utility wait function
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Scramble the cube
  async scramble(length = 25, animate = true) {
    const scrambleSequence = this.cube.generateScramble(length);
    await this.executeSequence(scrambleSequence, animate, animate ? 50 : 0);
    return scrambleSequence;
  }

  // Reset cube to solved state
  reset() {
    this.cube.reset();
    this.moveHistory = [];

    if (this.renderer) {
      this.renderer.updateCubeColors(this.cube.faces);
    }

    if (this.onStateChange) {
      this.onStateChange(this.cube);
    }
  }

  // Get current cube state
  getState() {
    return {
      faces: JSON.parse(JSON.stringify(this.cube.faces)),
      isSolved: this.cube.isSolved(),
      moveHistory: [...this.moveHistory],
      moveCount: this.cube.moveHistory.length,
    };
  }

  // Set animation speed
  setAnimationSpeed(speed) {
    if (this.renderer) {
      this.renderer.setAnimationSpeed(speed);
    }
  }

  // Get available moves
  getAvailableMoves() {
    return ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"];
  }

  // Validate move
  isValidMove(move) {
    return this.getAvailableMoves().includes(move);
  }

  // Get inverse of a move
  getInverseMove(move) {
    if (move.includes("'")) {
      return move.replace("'", "");
    } else {
      return move + "'";
    }
  }

  // Get move statistics
  getMoveStatistics() {
    const stats = {
      totalMoves: this.moveHistory.length,
      uniqueMoves: new Set(this.moveHistory.map((h) => h.move)).size,
      averageTime: 0,
      moveCounts: {},
    };

    // Count individual moves
    this.getAvailableMoves().forEach((move) => {
      stats.moveCounts[move] = this.moveHistory.filter(
        (h) => h.move === move
      ).length;
    });

    // Calculate average time between moves
    if (this.moveHistory.length > 1) {
      let totalTime = 0;
      for (let i = 1; i < this.moveHistory.length; i++) {
        totalTime +=
          this.moveHistory[i].timestamp - this.moveHistory[i - 1].timestamp;
      }
      stats.averageTime = totalTime / (this.moveHistory.length - 1);
    }

    return stats;
  }

  // Export state for saving/loading
  exportState() {
    return {
      faces: this.cube.faces,
      moveHistory: this.moveHistory,
      timestamp: Date.now(),
    };
  }

  // Import state from saved data
  importState(stateData) {
    try {
      this.cube.faces = JSON.parse(JSON.stringify(stateData.faces));
      this.cube.solved = this.cube.isSolved();
      this.moveHistory = stateData.moveHistory || [];

      if (this.renderer) {
        this.renderer.updateCubeColors(this.cube.faces);
      }

      if (this.onStateChange) {
        this.onStateChange(this.cube);
      }

      return true;
    } catch (error) {
      console.error("Failed to import state:", error);
      return false;
    }
  }

  // Check if cube can be solved from current state
  isValidState() {
    // Basic validation - check if we have the right number of each color
    const colorCounts = { W: 0, R: 0, G: 0, Y: 0, O: 0, B: 0 };

    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const color = this.cube.faces[face][row][col];
          if (colorCounts.hasOwnProperty(color)) {
            colorCounts[color]++;
          } else {
            return false; // Invalid color
          }
        }
      }
    }

    // Each color should appear exactly 9 times
    for (const color in colorCounts) {
      if (colorCounts[color] !== 9) {
        return false;
      }
    }

    return true;
  }

  // Get cube state as a compact string for algorithms
  getCompactState() {
    return this.cube.getStateString();
  }

  // Set callbacks
  setCallbacks(callbacks) {
    if (callbacks.onMoveComplete)
      this.onMoveComplete = callbacks.onMoveComplete;
    if (callbacks.onSequenceComplete)
      this.onSequenceComplete = callbacks.onSequenceComplete;
    if (callbacks.onStateChange) this.onStateChange = callbacks.onStateChange;
  }

  // Clear execution queue
  clearQueue() {
    this.executionQueue = [];
  }

  // Check if engine is busy
  isBusy() {
    return this.isExecuting || this.executionQueue.length > 0;
  }
}

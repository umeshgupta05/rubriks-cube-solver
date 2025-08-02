/**
 * API Client for Rubik's Cube Solver Backend
 * Handles all communication with Flask API
 */

class CubeAPI {
  constructor() {
    this.baseURL = ""; // Same origin
    this.currentState = this.createSolvedState();
  }

  /**
   * Create a solved cube state
   */
  createSolvedState() {
    return {
      front: Array(9).fill("green"), // F face - Green
      back: Array(9).fill("blue"), // B face - Blue
      left: Array(9).fill("orange"), // L face - Orange
      right: Array(9).fill("red"), // R face - Red
      top: Array(9).fill("white"), // U face - White
      bottom: Array(9).fill("yellow"), // D face - Yellow
    };
  }

  /**
   * Get current cube state
   */
  async getCubeState() {
    try {
      const response = await fetch(`${this.baseURL}/api/state`);
      if (!response.ok) throw new Error("Failed to get cube state");

      const data = await response.json();
      this.currentState = data.state;
      return data;
    } catch (error) {
      console.error("Error getting cube state:", error);
      throw error;
    }
  }

  /**
   * Reset cube to solved state
   */
  async resetCube() {
    try {
      const response = await fetch(`${this.baseURL}/api/reset`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to reset cube");

      const data = await response.json();
      this.currentState = data.state;
      return data;
    } catch (error) {
      console.error("Error resetting cube:", error);
      throw error;
    }
  }

  /**
   * Create a new cube of specified size
   */
  async newCube(size = 3) {
    try {
      const response = await fetch(`${this.baseURL}/api/new-cube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ size }),
      });

      if (!response.ok) throw new Error("Failed to create new cube");

      const data = await response.json();
      this.currentState = data.state;
      return data;
    } catch (error) {
      console.error("Error creating new cube:", error);
      throw error;
    }
  }

  /**
   * Scramble the cube
   */
  async scrambleCube(moves = 25) {
    try {
      const response = await fetch(`${this.baseURL}/api/scramble`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moves }),
      });

      if (!response.ok) throw new Error("Failed to scramble cube");

      const data = await response.json();
      this.currentState = data.state;
      return data;
    } catch (error) {
      console.error("Error scrambling cube:", error);
      throw error;
    }
  }

  /**
   * Apply a single move to the cube
   */
  async applyMove(move) {
    try {
      const response = await fetch(`${this.baseURL}/api/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ move }),
      });

      if (!response.ok) throw new Error(`Failed to apply move: ${move}`);

      const data = await response.json();
      this.currentState = data.state;
      return data;
    } catch (error) {
      console.error("Error applying move:", error);
      throw error;
    }
  }

  /**
   * Apply multiple moves in sequence
   */
  async applyMoves(moves) {
    try {
      const response = await fetch(`${this.baseURL}/api/moves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moves }),
      });

      if (!response.ok) throw new Error("Failed to apply moves");

      const data = await response.json();
      this.currentState = data.state;
      return data;
    } catch (error) {
      console.error("Error applying moves:", error);
      throw error;
    }
  }

  /**
   * Solve the cube using specified algorithm
   */
  async solveCube(algorithm = "kociemba") {
    try {
      const response = await fetch(`${this.baseURL}/api/solve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ algorithm }),
      });

      if (!response.ok) throw new Error("Failed to solve cube");

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Solving failed");
      }

      return data;
    } catch (error) {
      console.error("Error solving cube:", error);
      throw error;
    }
  }

  /**
   * Check if cube is solved
   */
  async isSolved() {
    try {
      const response = await fetch(`${this.baseURL}/api/is_solved`);
      if (!response.ok) throw new Error("Failed to check if solved");

      const data = await response.json();
      return data.solved;
    } catch (error) {
      console.error("Error checking if solved:", error);
      throw error;
    }
  }

  /**
   * Get cube statistics
   */
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/stats`);
      if (!response.ok) throw new Error("Failed to get stats");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting stats:", error);
      throw error;
    }
  }

  /**
   * Validate move notation
   */
  isValidMove(move) {
    const validMoves = [
      "F",
      "F'",
      "F2",
      "B",
      "B'",
      "B2",
      "R",
      "R'",
      "R2",
      "L",
      "L'",
      "L2",
      "U",
      "U'",
      "U2",
      "D",
      "D'",
      "D2",
    ];

    return validMoves.includes(move);
  }

  /**
   * Parse move sequence string
   */
  parseMoveSequence(moveString) {
    if (!moveString || typeof moveString !== "string") {
      return [];
    }

    return moveString
      .trim()
      .split(/\s+/)
      .filter((move) => move && this.isValidMove(move));
  }

  /**
   * Format move sequence for display
   */
  formatMoveSequence(moves) {
    if (!Array.isArray(moves)) {
      return "";
    }

    return moves.join(" ");
  }

  /**
   * Get move count from sequence
   */
  getMoveCount(moves) {
    if (!Array.isArray(moves)) {
      return 0;
    }

    return moves.length;
  }

  /**
   * Get opposite move
   */
  getOppositeMove(move) {
    const opposites = {
      F: "F'",
      "F'": "F",
      F2: "F2",
      B: "B'",
      "B'": "B",
      B2: "B2",
      R: "R'",
      "R'": "R",
      R2: "R2",
      L: "L'",
      "L'": "L",
      L2: "L2",
      U: "U'",
      "U'": "U",
      U2: "U2",
      D: "D'",
      "D'": "D",
      D2: "D2",
    };

    return opposites[move] || move;
  }

  /**
   * Reverse move sequence
   */
  reverseMoveSequence(moves) {
    if (!Array.isArray(moves)) {
      return [];
    }

    return moves
      .slice()
      .reverse()
      .map((move) => this.getOppositeMove(move));
  }

  /**
   * Handle API errors gracefully
   */
  handleError(error, context = "") {
    console.error(`API Error ${context}:`, error);

    // Return user-friendly error messages
    if (error.message.includes("Failed to fetch")) {
      return "Connection error. Please check if the server is running.";
    } else if (error.message.includes("404")) {
      return "API endpoint not found. Please check server configuration.";
    } else if (error.message.includes("500")) {
      return "Server error. Please try again or contact support.";
    } else {
      return error.message || "An unexpected error occurred.";
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/state`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export for use in other modules
window.CubeAPI = CubeAPI;

/**
 * Rubik's Cube Model - State representation and basic operations
 * Uses facelet model for simplicity and performance
 */

class RubiksCube {
  constructor() {
    // Initialize solved cube state
    this.faces = {
      // Each face is a 3x3 array, indexed as [row][col]
      U: [
        ["W", "W", "W"],
        ["W", "W", "W"],
        ["W", "W", "W"],
      ], // Up (White)
      R: [
        ["R", "R", "R"],
        ["R", "R", "R"],
        ["R", "R", "R"],
      ], // Right (Red)
      F: [
        ["G", "G", "G"],
        ["G", "G", "G"],
        ["G", "G", "G"],
      ], // Front (Green)
      D: [
        ["Y", "Y", "Y"],
        ["Y", "Y", "Y"],
        ["Y", "Y", "Y"],
      ], // Down (Yellow)
      L: [
        ["O", "O", "O"],
        ["O", "O", "O"],
        ["O", "O", "O"],
      ], // Left (Orange)
      B: [
        ["B", "B", "B"],
        ["B", "B", "B"],
        ["B", "B", "B"],
      ], // Back (Blue)
    };

    this.moveHistory = [];
    this.solved = true;
  }

  // Deep clone the cube state
  clone() {
    const newCube = new RubiksCube();
    newCube.faces = JSON.parse(JSON.stringify(this.faces));
    newCube.moveHistory = [...this.moveHistory];
    newCube.solved = this.solved;
    return newCube;
  }

  // Get current state as string for hashing/comparison
  getStateString() {
    let state = "";
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          state += this.faces[face][row][col];
        }
      }
    }
    return state;
  }

  // Check if cube is solved
  isSolved() {
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      const centerColor = this.faces[face][1][1];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (this.faces[face][row][col] !== centerColor) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Rotate a face 90 degrees clockwise
  rotateFaceClockwise(face) {
    const temp = JSON.parse(JSON.stringify(this.faces[face]));

    // Rotate the face itself
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.faces[face][j][2 - i] = temp[i][j];
      }
    }
  }

  // Rotate a face 90 degrees counter-clockwise
  rotateFaceCounterClockwise(face) {
    const temp = JSON.parse(JSON.stringify(this.faces[face]));

    // Rotate the face itself
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.faces[face][2 - j][i] = temp[i][j];
      }
    }
  }

  // Apply a move to the cube
  applyMove(move) {
    const originalState = this.getStateString();

    switch (move) {
      case "U":
        this.moveU();
        break;
      case "U'":
        this.moveUPrime();
        break;
      case "R":
        this.moveR();
        break;
      case "R'":
        this.moveRPrime();
        break;
      case "F":
        this.moveF();
        break;
      case "F'":
        this.moveFPrime();
        break;
      case "D":
        this.moveD();
        break;
      case "D'":
        this.moveDPrime();
        break;
      case "L":
        this.moveL();
        break;
      case "L'":
        this.moveLPrime();
        break;
      case "B":
        this.moveB();
        break;
      case "B'":
        this.moveBPrime();
        break;
    }

    this.moveHistory.push(move);

    // Update solved status
    const newState = this.getStateString();
    this.solved = this.isSolved();

    return originalState !== newState;
  }

  // Move implementations
  moveU() {
    this.rotateFaceClockwise("U");

    // Rotate adjacent edges
    const temp = [this.faces.F[0][0], this.faces.F[0][1], this.faces.F[0][2]];

    this.faces.F[0][0] = this.faces.R[0][0];
    this.faces.F[0][1] = this.faces.R[0][1];
    this.faces.F[0][2] = this.faces.R[0][2];

    this.faces.R[0][0] = this.faces.B[0][0];
    this.faces.R[0][1] = this.faces.B[0][1];
    this.faces.R[0][2] = this.faces.B[0][2];

    this.faces.B[0][0] = this.faces.L[0][0];
    this.faces.B[0][1] = this.faces.L[0][1];
    this.faces.B[0][2] = this.faces.L[0][2];

    this.faces.L[0][0] = temp[0];
    this.faces.L[0][1] = temp[1];
    this.faces.L[0][2] = temp[2];
  }

  moveUPrime() {
    this.rotateFaceCounterClockwise("U");

    // Rotate adjacent edges (reverse of U)
    const temp = [this.faces.F[0][0], this.faces.F[0][1], this.faces.F[0][2]];

    this.faces.F[0][0] = this.faces.L[0][0];
    this.faces.F[0][1] = this.faces.L[0][1];
    this.faces.F[0][2] = this.faces.L[0][2];

    this.faces.L[0][0] = this.faces.B[0][0];
    this.faces.L[0][1] = this.faces.B[0][1];
    this.faces.L[0][2] = this.faces.B[0][2];

    this.faces.B[0][0] = this.faces.R[0][0];
    this.faces.B[0][1] = this.faces.R[0][1];
    this.faces.B[0][2] = this.faces.R[0][2];

    this.faces.R[0][0] = temp[0];
    this.faces.R[0][1] = temp[1];
    this.faces.R[0][2] = temp[2];
  }

  moveR() {
    this.rotateFaceClockwise("R");

    const temp = [this.faces.U[0][2], this.faces.U[1][2], this.faces.U[2][2]];

    this.faces.U[0][2] = this.faces.F[0][2];
    this.faces.U[1][2] = this.faces.F[1][2];
    this.faces.U[2][2] = this.faces.F[2][2];

    this.faces.F[0][2] = this.faces.D[0][2];
    this.faces.F[1][2] = this.faces.D[1][2];
    this.faces.F[2][2] = this.faces.D[2][2];

    this.faces.D[0][2] = this.faces.B[2][0];
    this.faces.D[1][2] = this.faces.B[1][0];
    this.faces.D[2][2] = this.faces.B[0][0];

    this.faces.B[2][0] = temp[0];
    this.faces.B[1][0] = temp[1];
    this.faces.B[0][0] = temp[2];
  }

  moveRPrime() {
    this.rotateFaceCounterClockwise("R");

    const temp = [this.faces.U[0][2], this.faces.U[1][2], this.faces.U[2][2]];

    this.faces.U[0][2] = this.faces.B[2][0];
    this.faces.U[1][2] = this.faces.B[1][0];
    this.faces.U[2][2] = this.faces.B[0][0];

    this.faces.B[2][0] = this.faces.D[0][2];
    this.faces.B[1][0] = this.faces.D[1][2];
    this.faces.B[0][0] = this.faces.D[2][2];

    this.faces.D[0][2] = this.faces.F[0][2];
    this.faces.D[1][2] = this.faces.F[1][2];
    this.faces.D[2][2] = this.faces.F[2][2];

    this.faces.F[0][2] = temp[0];
    this.faces.F[1][2] = temp[1];
    this.faces.F[2][2] = temp[2];
  }

  moveF() {
    this.rotateFaceClockwise("F");

    const temp = [this.faces.U[2][0], this.faces.U[2][1], this.faces.U[2][2]];

    this.faces.U[2][0] = this.faces.L[2][2];
    this.faces.U[2][1] = this.faces.L[1][2];
    this.faces.U[2][2] = this.faces.L[0][2];

    this.faces.L[0][2] = this.faces.D[0][0];
    this.faces.L[1][2] = this.faces.D[0][1];
    this.faces.L[2][2] = this.faces.D[0][2];

    this.faces.D[0][0] = this.faces.R[2][0];
    this.faces.D[0][1] = this.faces.R[1][0];
    this.faces.D[0][2] = this.faces.R[0][0];

    this.faces.R[0][0] = temp[0];
    this.faces.R[1][0] = temp[1];
    this.faces.R[2][0] = temp[2];
  }

  moveFPrime() {
    this.rotateFaceCounterClockwise("F");

    const temp = [this.faces.U[2][0], this.faces.U[2][1], this.faces.U[2][2]];

    this.faces.U[2][0] = this.faces.R[0][0];
    this.faces.U[2][1] = this.faces.R[1][0];
    this.faces.U[2][2] = this.faces.R[2][0];

    this.faces.R[0][0] = this.faces.D[0][2];
    this.faces.R[1][0] = this.faces.D[0][1];
    this.faces.R[2][0] = this.faces.D[0][0];

    this.faces.D[0][0] = this.faces.L[0][2];
    this.faces.D[0][1] = this.faces.L[1][2];
    this.faces.D[0][2] = this.faces.L[2][2];

    this.faces.L[0][2] = temp[2];
    this.faces.L[1][2] = temp[1];
    this.faces.L[2][2] = temp[0];
  }

  moveD() {
    this.rotateFaceClockwise("D");

    const temp = [this.faces.F[2][0], this.faces.F[2][1], this.faces.F[2][2]];

    this.faces.F[2][0] = this.faces.L[2][0];
    this.faces.F[2][1] = this.faces.L[2][1];
    this.faces.F[2][2] = this.faces.L[2][2];

    this.faces.L[2][0] = this.faces.B[2][0];
    this.faces.L[2][1] = this.faces.B[2][1];
    this.faces.L[2][2] = this.faces.B[2][2];

    this.faces.B[2][0] = this.faces.R[2][0];
    this.faces.B[2][1] = this.faces.R[2][1];
    this.faces.B[2][2] = this.faces.R[2][2];

    this.faces.R[2][0] = temp[0];
    this.faces.R[2][1] = temp[1];
    this.faces.R[2][2] = temp[2];
  }

  moveDPrime() {
    this.rotateFaceCounterClockwise("D");

    const temp = [this.faces.F[2][0], this.faces.F[2][1], this.faces.F[2][2]];

    this.faces.F[2][0] = this.faces.R[2][0];
    this.faces.F[2][1] = this.faces.R[2][1];
    this.faces.F[2][2] = this.faces.R[2][2];

    this.faces.R[2][0] = this.faces.B[2][0];
    this.faces.R[2][1] = this.faces.B[2][1];
    this.faces.R[2][2] = this.faces.B[2][2];

    this.faces.B[2][0] = this.faces.L[2][0];
    this.faces.B[2][1] = this.faces.L[2][1];
    this.faces.B[2][2] = this.faces.L[2][2];

    this.faces.L[2][0] = temp[0];
    this.faces.L[2][1] = temp[1];
    this.faces.L[2][2] = temp[2];
  }

  moveL() {
    this.rotateFaceClockwise("L");

    const temp = [this.faces.U[0][0], this.faces.U[1][0], this.faces.U[2][0]];

    this.faces.U[0][0] = this.faces.B[2][2];
    this.faces.U[1][0] = this.faces.B[1][2];
    this.faces.U[2][0] = this.faces.B[0][2];

    this.faces.B[0][2] = this.faces.D[2][0];
    this.faces.B[1][2] = this.faces.D[1][0];
    this.faces.B[2][2] = this.faces.D[0][0];

    this.faces.D[0][0] = this.faces.F[0][0];
    this.faces.D[1][0] = this.faces.F[1][0];
    this.faces.D[2][0] = this.faces.F[2][0];

    this.faces.F[0][0] = temp[0];
    this.faces.F[1][0] = temp[1];
    this.faces.F[2][0] = temp[2];
  }

  moveLPrime() {
    this.rotateFaceCounterClockwise("L");

    const temp = [this.faces.U[0][0], this.faces.U[1][0], this.faces.U[2][0]];

    this.faces.U[0][0] = this.faces.F[0][0];
    this.faces.U[1][0] = this.faces.F[1][0];
    this.faces.U[2][0] = this.faces.F[2][0];

    this.faces.F[0][0] = this.faces.D[0][0];
    this.faces.F[1][0] = this.faces.D[1][0];
    this.faces.F[2][0] = this.faces.D[2][0];

    this.faces.D[0][0] = this.faces.B[2][2];
    this.faces.D[1][0] = this.faces.B[1][2];
    this.faces.D[2][0] = this.faces.B[0][2];

    this.faces.B[0][2] = temp[2];
    this.faces.B[1][2] = temp[1];
    this.faces.B[2][2] = temp[0];
  }

  moveB() {
    this.rotateFaceClockwise("B");

    const temp = [this.faces.U[0][0], this.faces.U[0][1], this.faces.U[0][2]];

    this.faces.U[0][0] = this.faces.R[0][2];
    this.faces.U[0][1] = this.faces.R[1][2];
    this.faces.U[0][2] = this.faces.R[2][2];

    this.faces.R[0][2] = this.faces.D[2][2];
    this.faces.R[1][2] = this.faces.D[2][1];
    this.faces.R[2][2] = this.faces.D[2][0];

    this.faces.D[2][0] = this.faces.L[0][0];
    this.faces.D[2][1] = this.faces.L[1][0];
    this.faces.D[2][2] = this.faces.L[2][0];

    this.faces.L[0][0] = temp[2];
    this.faces.L[1][0] = temp[1];
    this.faces.L[2][0] = temp[0];
  }

  moveBPrime() {
    this.rotateFaceCounterClockwise("B");

    const temp = [this.faces.U[0][0], this.faces.U[0][1], this.faces.U[0][2]];

    this.faces.U[0][0] = this.faces.L[2][0];
    this.faces.U[0][1] = this.faces.L[1][0];
    this.faces.U[0][2] = this.faces.L[0][0];

    this.faces.L[0][0] = this.faces.D[2][0];
    this.faces.L[1][0] = this.faces.D[2][1];
    this.faces.L[2][0] = this.faces.D[2][2];

    this.faces.D[2][0] = this.faces.R[2][2];
    this.faces.D[2][1] = this.faces.R[1][2];
    this.faces.D[2][2] = this.faces.R[0][2];

    this.faces.R[0][2] = temp[0];
    this.faces.R[1][2] = temp[1];
    this.faces.R[2][2] = temp[2];
  }

  // Apply a sequence of moves
  applyMoveSequence(moveSequence) {
    const moves = moveSequence.split(" ").filter((move) => move.trim() !== "");
    for (const move of moves) {
      this.applyMove(move.trim());
    }
  }

  // Generate a random scramble
  generateScramble(length = 25) {
    const moves = [
      "U",
      "U'",
      "R",
      "R'",
      "F",
      "F'",
      "D",
      "D'",
      "L",
      "L'",
      "B",
      "B'",
    ];
    const scramble = [];
    let lastMove = "";

    for (let i = 0; i < length; i++) {
      let move;
      do {
        move = moves[Math.floor(Math.random() * moves.length)];
      } while (move[0] === lastMove[0]); // Avoid consecutive moves on same face

      scramble.push(move);
      lastMove = move;
    }

    return scramble.join(" ");
  }

  // Reset to solved state
  reset() {
    this.faces = {
      U: [
        ["W", "W", "W"],
        ["W", "W", "W"],
        ["W", "W", "W"],
      ],
      R: [
        ["R", "R", "R"],
        ["R", "R", "R"],
        ["R", "R", "R"],
      ],
      F: [
        ["G", "G", "G"],
        ["G", "G", "G"],
        ["G", "G", "G"],
      ],
      D: [
        ["Y", "Y", "Y"],
        ["Y", "Y", "Y"],
        ["Y", "Y", "Y"],
      ],
      L: [
        ["O", "O", "O"],
        ["O", "O", "O"],
        ["O", "O", "O"],
      ],
      B: [
        ["B", "B", "B"],
        ["B", "B", "B"],
        ["B", "B", "B"],
      ],
    };
    this.moveHistory = [];
    this.solved = true;
  }

  // Get color mapping for rendering
  getColorMapping() {
    return {
      W: 0xffffff, // White
      R: 0xff0000, // Red
      G: 0x00ff00, // Green
      Y: 0xffff00, // Yellow
      O: 0xff8000, // Orange
      B: 0x0000ff, // Blue
    };
  }
}

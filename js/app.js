/**
 * Main Application Controller
 * Coordinates all components and handles user interactions
 */

class RubiksCubeApp {
  constructor() {
    this.cube = null;
    this.renderer = null;
    this.moveEngine = null;
    this.kociembaSolver = null;
    this.beginnerSolver = null;

    this.currentSolver = "kociemba";
    this.animationSpeed = 500;
    this.isAutoSolving = false;
    this.solutionInProgress = false;

    this.init();
  }

  async init() {
    try {
      // Initialize core components
      this.cube = new RubiksCube();
      this.renderer = new CubeRenderer("cubeCanvas");
      this.moveEngine = new MoveEngine(this.cube, this.renderer);

      // Initialize solvers
      this.kociembaSolver = new KociembaSolver();
      this.beginnerSolver = new BeginnerSolver();

      // Set up callbacks
      this.setupCallbacks();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize UI
      this.updateUI();

      this.logMessage(
        "Rubik's Cube Solver initialized successfully!",
        "success"
      );
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.logMessage(`Initialization error: ${error.message}`, "error");
    }
  }

  setupCallbacks() {
    this.moveEngine.setCallbacks({
      onMoveComplete: (move, isSolved) => {
        this.onMoveComplete(move, isSolved);
      },
      onSequenceComplete: (results, isSolved) => {
        this.onSequenceComplete(results, isSolved);
      },
      onStateChange: (cube) => {
        this.onStateChange(cube);
      },
    });
  }

  setupEventListeners() {
    // Main control buttons
    document.getElementById("scrambleBtn").addEventListener("click", () => {
      this.scrambleCube();
    });

    document.getElementById("solveBtn").addEventListener("click", () => {
      this.solveCube();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      this.resetCube();
    });

    // Manual move buttons
    document.querySelectorAll(".move-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const move = e.target.getAttribute("data-move");
        this.executeMove(move);
      });
    });

    // Animation speed slider
    const speedSlider = document.getElementById("speedSlider");
    speedSlider.addEventListener("input", (e) => {
      this.animationSpeed = parseInt(e.target.value);
      this.moveEngine.setAnimationSpeed(this.animationSpeed);
      document.getElementById("speedValue").textContent =
        `${this.animationSpeed}ms`;
    });

    // Algorithm selector
    document
      .getElementById("algorithmSelect")
      .addEventListener("change", (e) => {
        this.currentSolver = e.target.value;
        this.logMessage(
          `Switched to ${this.getSolverName()} algorithm`,
          "info"
        );
      });

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      this.handleKeyboard(e);
    });

    // Prevent context menu on canvas
    document
      .getElementById("cubeCanvas")
      .addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
  }

  // Execute a single move
  async executeMove(move) {
    if (this.moveEngine.isBusy()) {
      this.logMessage(
        "Please wait for current animation to complete",
        "warning"
      );
      return;
    }

    try {
      await this.moveEngine.executeMove(move, true);
      this.highlightMove(move);
    } catch (error) {
      this.logMessage(
        `Error executing move ${move}: ${error.message}`,
        "error"
      );
    }
  }

  // Scramble the cube
  async scrambleCube() {
    if (this.moveEngine.isBusy()) {
      this.logMessage(
        "Please wait for current operation to complete",
        "warning"
      );
      return;
    }

    try {
      this.setUIState("scrambling");
      this.logMessage("Scrambling cube...", "info");

      const scrambleSequence = await this.moveEngine.scramble(25, true);

      this.logMessage(`Scrambled with: ${scrambleSequence}`, "success");
      this.updateMoveSequence(scrambleSequence);
    } catch (error) {
      this.logMessage(`Scrambling error: ${error.message}`, "error");
    } finally {
      this.setUIState("ready");
    }
  }

  // Solve the cube
  async solveCube() {
    if (this.moveEngine.isBusy() || this.solutionInProgress) {
      this.logMessage("Solution already in progress", "warning");
      return;
    }

    if (this.cube.isSolved()) {
      this.logMessage("Cube is already solved!", "info");
      return;
    }

    try {
      this.solutionInProgress = true;
      this.setUIState("solving");

      const solver =
        this.currentSolver === "kociemba"
          ? this.kociembaSolver
          : this.beginnerSolver;
      const solverName = this.getSolverName();

      this.logMessage(`Starting ${solverName}...`, "info");
      this.clearSolutionSteps();

      const startTime = Date.now();

      // Solve using selected algorithm
      const solution = await solver.solve(this.cube, (message, progress) => {
        this.updateSolutionProgress(message, progress);
      });

      const solveTime = Date.now() - startTime;

      if (solution.moves && solution.moves.length > 0) {
        this.logMessage(
          `Solution found! ${solution.moves.length} moves in ${solveTime}ms`,
          "success"
        );

        this.displaySolutionInfo(solution, solveTime);
        this.updateMoveSequence(solution.moves.join(" "));

        // Execute solution with animation
        await this.executeSolution(solution.moves);
      } else {
        this.logMessage("No solution found or cube already solved", "warning");
      }
    } catch (error) {
      this.logMessage(`Solving error: ${error.message}`, "error");
      console.error("Solve error:", error);
    } finally {
      this.solutionInProgress = false;
      this.setUIState("ready");
    }
  }

  // Execute solution moves with animation
  async executeSolution(moves) {
    if (!moves || moves.length === 0) return;

    this.logMessage(`Executing solution: ${moves.length} moves`, "info");

    let moveIndex = 0;

    await this.moveEngine.executeSequence(moves, true, 150);

    this.logMessage("Solution executed successfully!", "success");
  }

  // Reset cube to solved state
  resetCube() {
    if (this.moveEngine.isBusy()) {
      this.logMessage(
        "Please wait for current operation to complete",
        "warning"
      );
      return;
    }

    this.moveEngine.reset();
    this.clearOutputs();
    this.logMessage("Cube reset to solved state", "info");
  }

  // Handle keyboard input
  handleKeyboard(e) {
    if (this.moveEngine.isBusy()) return;

    const keyMoveMap = {
      KeyU: "U",
      KeyR: "R",
      KeyF: "F",
      KeyD: "D",
      KeyL: "L",
      KeyB: "B",
    };

    if (keyMoveMap[e.code]) {
      const baseMove = keyMoveMap[e.code];
      const move = e.shiftKey ? baseMove + "'" : baseMove;
      this.executeMove(move);
      e.preventDefault();
    }

    // Special keys
    if (e.code === "Space") {
      this.scrambleCube();
      e.preventDefault();
    } else if (e.code === "Enter") {
      this.solveCube();
      e.preventDefault();
    } else if (e.code === "Escape") {
      this.resetCube();
      e.preventDefault();
    }
  }

  // Callback handlers
  onMoveComplete(move, isSolved) {
    this.updateUI();

    if (isSolved) {
      this.logMessage("🎉 Cube solved! Congratulations!", "success");
      this.showSolvedAnimation();
    }
  }

  onSequenceComplete(results, isSolved) {
    this.updateUI();

    if (isSolved) {
      this.logMessage("🎉 Solution complete! Cube is solved!", "success");
      this.showSolvedAnimation();
    }
  }

  onStateChange(cube) {
    this.updateUI();
  }

  // UI Update methods
  updateUI() {
    // Update cube status
    const status = this.cube.isSolved() ? "Solved" : "Scrambled";
    const statusElement = document.getElementById("cubeStatus");
    statusElement.textContent = status;
    statusElement.className = `value status-${status.toLowerCase()}`;

    // Update move count
    document.getElementById("movesCount").textContent =
      this.cube.moveHistory.length;

    // Update animation speed display
    document.getElementById("speedValue").textContent =
      `${this.animationSpeed}ms`;
  }

  setUIState(state) {
    const controls = document.querySelector(".controls-panel");
    const cubeContainer = document.querySelector(".cube-container");

    switch (state) {
      case "scrambling":
        controls.classList.add("solving");
        this.logMessage("🔀 Scrambling...", "info");
        break;
      case "solving":
        controls.classList.add("solving");
        this.logMessage("🧩 Solving...", "info");
        break;
      case "ready":
      default:
        controls.classList.remove("solving");
        break;
    }
  }

  updateMoveSequence(moves) {
    const element = document.getElementById("moveSequence");
    if (typeof moves === "string") {
      element.textContent = moves;
    } else if (Array.isArray(moves)) {
      element.textContent = moves.join(" ");
    }
  }

  displaySolutionInfo(solution, solveTime) {
    const stepsElement = document.getElementById("solutionSteps");

    let html = `<div class="solution-summary">`;
    html += `<strong>Algorithm:</strong> ${this.getSolverName()}<br>`;
    html += `<strong>Solution Length:</strong> ${solution.length} moves<br>`;
    html += `<strong>Solve Time:</strong> ${solveTime}ms<br>`;
    html += `</div>`;

    if (solution.steps && solution.steps.length > 0) {
      html += `<div class="solution-phases">`;
      solution.steps.forEach((step, index) => {
        html += `<div class="phase">`;
        html += `<strong>Step ${index + 1}:</strong> ${step.name || step}<br>`;
        if (step.moves && step.moves.length > 0) {
          html += `<span class="phase-moves">${step.moves.join(" ")}</span><br>`;
        }
        if (step.description) {
          html += `<em>${step.description}</em>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    stepsElement.innerHTML = html;

    // Update solution length in info panel
    document.getElementById("solutionLength").textContent = solution.length;
    document.getElementById("solveTime").textContent = `${solveTime}ms`;
  }

  updateSolutionProgress(message, progress) {
    const logElement = document.getElementById("algorithmLog");
    const progressMessage = `[${progress}%] ${message}`;

    const newEntry = document.createElement("div");
    newEntry.textContent = progressMessage;
    newEntry.className = "log-entry progress";

    logElement.appendChild(newEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }

  clearSolutionSteps() {
    document.getElementById("solutionSteps").innerHTML = "";
    document.getElementById("solutionLength").textContent = "-";
    document.getElementById("solveTime").textContent = "-";
  }

  clearOutputs() {
    document.getElementById("moveSequence").textContent = "";
    document.getElementById("solutionSteps").innerHTML = "";
    document.getElementById("algorithmLog").innerHTML = "";
    this.clearSolutionSteps();
  }

  highlightMove(move) {
    const moveButtons = document.querySelectorAll(`[data-move="${move}"]`);
    moveButtons.forEach((btn) => {
      btn.classList.add("move-highlight");
      setTimeout(() => {
        btn.classList.remove("move-highlight");
      }, 500);
    });
  }

  showSolvedAnimation() {
    // Add celebratory visual effect
    const cubeContainer = document.querySelector(".cube-container");
    cubeContainer.style.animation = "pulse 1s ease-in-out 3";

    setTimeout(() => {
      cubeContainer.style.animation = "";
    }, 3000);
  }

  logMessage(message, type = "info") {
    const logElement = document.getElementById("algorithmLog");
    const timestamp = new Date().toLocaleTimeString();

    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;

    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;

    // Limit log entries to prevent memory issues
    while (logElement.children.length > 100) {
      logElement.removeChild(logElement.firstChild);
    }
  }

  getSolverName() {
    return this.currentSolver === "kociemba"
      ? "Kociemba Two-Phase Algorithm"
      : "Layer by Layer (Beginner Method)";
  }

  // Public API methods
  getCurrentState() {
    return this.moveEngine.getState();
  }

  exportState() {
    return this.moveEngine.exportState();
  }

  importState(stateData) {
    return this.moveEngine.importState(stateData);
  }

  // Cleanup
  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Remove event listeners
    document.removeEventListener("keydown", this.handleKeyboard);
  }
}

// Global app instance
let cubeApp;

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  cubeApp = new RubiksCubeApp();
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (cubeApp) {
    cubeApp.destroy();
  }
});

// Export for external access
window.RubiksCubeApp = RubiksCubeApp;

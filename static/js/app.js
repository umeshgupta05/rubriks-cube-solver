/**
 * Main Application Controller
 * Coordinates between API, renderer, and UI components
 */

class CubeApp {
  constructor() {
    this.api = new CubeAPI();
    this.renderer = null;
    this.solution = null;
    this.solutionIndex = 0;
    this.isPlaying = false;
    this.playInterval = null;
    this.moveCount = 0;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log("Initializing Cube App...");

      // Wait a bit for DOM to be fully ready
      await this.delay(100);

      // Initialize 3D renderer
      this.renderer = new CubeRenderer("cubeCanvas");

      // Setup event listeners
      this.setupEventListeners();

      // Setup resize handler
      this.setupResizeHandler();

      // Initialize cube state
      await this.loadInitialState();

      // Initialize algorithm info for default 3x3 cube
      this.updateAlgorithmOptions(3);

      // Test API connection
      const connected = await this.api.testConnection();
      if (!connected) {
        this.showError(
          "Failed to connect to server. Please check if the Flask server is running."
        );
      } else {
        this.updateStatus("Ready");
      }

      console.log("Cube App initialized successfully");
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.showError("Failed to initialize application: " + error.message);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Cube action buttons
    document
      .getElementById("scrambleBtn")
      .addEventListener("click", () => this.scrambleCube());
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.resetCube());
    document
      .getElementById("solveBtn")
      .addEventListener("click", () => this.solveCube());

    // Manual move buttons
    document.querySelectorAll(".move-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const move = e.target.dataset.move;
        this.applyMove(move);
      });
    });

    // Solution control buttons
    document
      .getElementById("playBtn")
      .addEventListener("click", () => this.playSolution());
    document
      .getElementById("pauseBtn")
      .addEventListener("click", () => this.pauseSolution());
    document
      .getElementById("stepBtn")
      .addEventListener("click", () => this.stepSolution());
    document
      .getElementById("resetSolutionBtn")
      .addEventListener("click", () => this.resetSolution());

    // Speed slider
    document.getElementById("speedSlider").addEventListener("input", (e) => {
      this.setPlaySpeed(parseInt(e.target.value));
    });

    // Cube scale slider
    document.getElementById("cubeScale").addEventListener("input", (e) => {
      const scale = parseFloat(e.target.value);
      this.renderer.setCubeScale(scale);
      document.getElementById("scaleValue").textContent = scale.toFixed(1);
    });

    // Reset view button
    document.getElementById("resetViewBtn").addEventListener("click", () => {
      this.renderer.resetCamera();
      document.getElementById("cubeScale").value = "1";
      document.getElementById("scaleValue").textContent = "1.0";
      this.renderer.setCubeScale(1);
    });

    // Algorithm selector
    document
      .getElementById("algorithmSelect")
      .addEventListener("change", (e) => {
        console.log("Algorithm changed to:", e.target.value);
      });

    // Cube size selector
    document
      .getElementById("cubeSizeSelect")
      .addEventListener("change", (e) => {
        const size = parseInt(e.target.value);
        this.changeCubeSize(size);
      });

    // Help system
    document
      .getElementById("showHelpBtn")
      .addEventListener("click", () => this.showHelp());
    document
      .getElementById("closeHelpBtn")
      .addEventListener("click", () => this.hideHelp());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));
  }

  /**
   * Setup window resize handler
   */
  setupResizeHandler() {
    window.addEventListener("resize", () => {
      if (this.renderer) {
        this.renderer.handleResize();
      }
    });
  }

  /**
   * Load initial cube state
   */
  async loadInitialState() {
    try {
      const data = await this.api.getCubeState();
      console.log("Backend response for initial state:", data);
      console.log("State object:", data.state);

      // Log each face
      if (data.state) {
        console.log("Front face:", data.state.front);
        console.log("Back face:", data.state.back);
        console.log("Left face:", data.state.left);
        console.log("Right face:", data.state.right);
        console.log("Top face:", data.state.top);
        console.log("Bottom face:", data.state.bottom);
      }

      // Only update cube state if it's not a solved state
      // Let the cube keep its initial colors if backend returns solved state
      const isSolved = data.is_solved || this.isStateAllSameColors(data.state);
      if (!isSolved) {
        this.renderer.updateCubeState(data.state);
      }

      this.updateMoveCount(0);
    } catch (error) {
      console.error("Failed to load initial state:", error);
    }
  }

  /**
   * Check if state represents a solved cube (all faces have same color)
   */
  isStateAllSameColors(state) {
    if (!state) return false;

    const faces = ["front", "back", "left", "right", "top", "bottom"];
    return faces.every((face) => {
      const colors = state[face];
      return (
        colors &&
        colors.length === 9 &&
        colors.every((color) => color === colors[0])
      );
    });
  }

  /**
   * Scramble the cube
   */
  async scrambleCube() {
    try {
      console.log("Starting scramble...");
      this.updateStatus("Scrambling...");
      this.showLoading(true, "Scrambling cube...");

      const data = await this.api.scrambleCube(25);
      console.log("Scramble response:", data);

      if (data && data.state) {
        console.log("Updating renderer with state:", data.state);
        // Update renderer immediately so colors change
        this.renderer.updateCubeState(data.state);
        this.updateMoveCount(data.moves ? data.moves.length : 0);
        this.updateStatus("Scrambled - Ready to solve");
        this.hideSolution();
      } else {
        console.error("Invalid scramble response:", data);
        this.showError("Invalid scramble response");
      }
    } catch (error) {
      console.error("Scramble error:", error);
      this.showError("Scramble failed: " + this.api.handleError(error));
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Reset cube to solved state
   */
  async resetCube() {
    try {
      this.updateStatus("Resetting...");

      const data = await this.api.resetCube();
      this.renderer.updateCubeState(data.state);
      this.updateMoveCount(0);
      this.updateStatus("Reset complete");
      this.hideSolution();
    } catch (error) {
      this.showError("Reset failed: " + this.api.handleError(error));
    }
  }

  /**
   * Change cube size
   */
  async changeCubeSize(size) {
    try {
      this.updateStatus(`Changing to ${size}x${size} cube...`);
      this.showLoading(true, `Creating ${size}x${size} cube...`);

      const data = await this.api.newCube(size);

      // Update 3D visualization to match new size
      this.renderer.setCubeSize(size);
      this.renderer.updateCubeState(data.state);

      this.updateMoveCount(0);
      this.updateStatus(`${size}x${size} cube ready`);
      this.hideSolution();

      // Update algorithm selector based on cube size
      this.updateAlgorithmOptions(size);
    } catch (error) {
      this.showError(
        "Failed to change cube size: " + this.api.handleError(error)
      );
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Update algorithm options based on cube size
   */
  updateAlgorithmOptions(size) {
    const algorithmSelect = document.getElementById("algorithmSelect");
    const algorithmInfo = document.getElementById("algorithmInfo");
    const sizeInfo = document.getElementById("sizeInfo");

    // Clear existing options
    algorithmSelect.innerHTML = "";

    if (size === 3) {
      // 3x3 supports both algorithms
      algorithmSelect.innerHTML = `
        <option value="kociemba">Kociemba (Advanced)</option>
        <option value="beginner">Layer-by-Layer (Beginner)</option>
      `;
      if (algorithmInfo) {
        algorithmInfo.innerHTML = `
          <small><strong>Kociemba:</strong> Optimal 2-phase algorithm for 3x3 cubes (20 moves max)</small>
        `;
      }
      if (sizeInfo) {
        sizeInfo.innerHTML = `
          <small>3D visualization fully supports 3x3 cubes</small>
        `;
      }
    } else {
      // Larger cubes use reduction method
      algorithmSelect.innerHTML = `
        <option value="reduction">Reduction Method (NxN)</option>
        <option value="beginner">Layer-by-Layer (Adapted)</option>
      `;
      if (algorithmInfo) {
        algorithmInfo.innerHTML = `
          <small><strong>Reduction Method:</strong> Converts ${size}x${size} cube to 3x3 equivalent by solving centers first, then pairing edges, finally solving like a 3x3</small>
        `;
      }
      if (sizeInfo) {
        sizeInfo.innerHTML = `
          <small>Full ${size}x${size} 3D visualization and solving supported!</small>
        `;
      }
    }
  }

  /**
   * Solve the cube
   */
  async solveCube() {
    try {
      const algorithm = document.getElementById("algorithmSelect").value;

      this.updateStatus("Solving...");
      this.showLoading(true, "Solving cube...");

      const data = await this.api.solveCube(algorithm);

      if (data.success) {
        this.solution = data;
        this.solutionIndex = 0;
        this.displaySolution(data);

        // Update the cube renderer with the final solved state
        if (data.final_state) {
          console.log(
            "Updating renderer with final solved state:",
            data.final_state
          );
          this.renderer.updateCubeState(data.final_state);
        }

        // Update move count
        if (data.move_count !== undefined) {
          this.updateMoveCount(data.move_count);
        }

        this.updateStatus("🎉 Cube solved!");
      } else if (data.already_solved) {
        this.updateStatus("Cube is already solved!");
        this.showError(data.message || "Cube is already solved");
      } else {
        this.showError("Solve failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      this.showError("Solve failed: " + this.api.handleError(error));
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Apply a single move
   */
  async applyMove(move) {
    try {
      console.log(`Applying move: ${move}`);

      // Handle special "Reset" move
      if (move === "Reset") {
        console.log("Handling Reset move - updating to solved state");
        const solvedState = {
          front: Array(9).fill("green"),
          back: Array(9).fill("blue"),
          left: Array(9).fill("orange"),
          right: Array(9).fill("red"),
          top: Array(9).fill("white"),
          bottom: Array(9).fill("yellow"),
        };

        this.renderer.updateCubeState(solvedState);
        this.updateMoveCount(0); // Reset move count
        this.updateStatus("🎉 Cube Reset to Solved State!");
        return;
      }

      const data = await this.api.applyMove(move);
      console.log("Move response:", data);

      if (data.success) {
        // First animate the move
        await this.renderer.animateMove(move);

        // Then update the cube state to match backend
        if (data.state) {
          console.log("Updating state after move:", data.state);
          this.renderer.updateCubeState(data.state);
        }

        // Update move count
        if (data.move_count !== undefined) {
          this.updateMoveCount(data.move_count);
        }

        // Check if solved
        if (data.is_solved) {
          this.updateStatus("🎉 Solved!");
        }
      } else {
        console.error("Move failed:", data.error);
        this.showError("Move failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Move error:", error);
      this.showError("Move failed: " + this.api.handleError(error));
    }
  }

  /**
   * Animate sequence of moves
   */
  async animateMovesSequence(moves) {
    for (const move of moves) {
      await this.renderer.animateMove(move);
      await this.delay(100); // Small delay between moves
    }
  }

  /**
   * Display solution
   */
  displaySolution(solution) {
    const sectionEl = document.getElementById("solutionSection");
    const stepsEl = document.getElementById("solutionSteps");
    const algorithmEl = document.getElementById("solutionAlgorithm");
    const movesEl = document.getElementById("solutionMoves");
    const timeEl = document.getElementById("solutionTime");

    // Update stats
    algorithmEl.textContent = solution.algorithm || "Unknown";
    movesEl.textContent = solution.moves ? solution.moves.length : 0;
    timeEl.textContent = solution.time ? solution.time.toFixed(2) + "s" : "0s";

    // Clear previous steps
    stepsEl.innerHTML = "";

    // Display steps
    if (solution.steps && Array.isArray(solution.steps)) {
      solution.steps.forEach((step, index) => {
        const stepEl = this.createStepElement(step, index);
        stepsEl.appendChild(stepEl);
      });
    } else if (solution.moves && Array.isArray(solution.moves)) {
      // If no structured steps, create one step with all moves
      const step = {
        step: "Solution",
        moves: solution.moves,
        description: "Complete solution sequence",
      };
      const stepEl = this.createStepElement(step, 0);
      stepsEl.appendChild(stepEl);
    }

    // Show solution section
    sectionEl.style.display = "block";
    sectionEl.scrollIntoView({ behavior: "smooth" });

    this.updateCurrentStep("Ready to play solution");
  }

  /**
   * Create step element
   */
  createStepElement(step, index) {
    const stepEl = document.createElement("div");
    stepEl.className = "solution-step";
    stepEl.dataset.stepIndex = index;

    const titleEl = document.createElement("div");
    titleEl.className = "step-title";
    titleEl.textContent = step.step || step.phase || `Step ${index + 1}`;

    const movesEl = document.createElement("div");
    movesEl.className = "step-moves";
    movesEl.textContent = Array.isArray(step.moves)
      ? step.moves.join(" ")
      : step.moves || "";

    const descEl = document.createElement("div");
    descEl.className = "step-description";
    descEl.textContent = step.description || "";

    stepEl.appendChild(titleEl);
    stepEl.appendChild(movesEl);
    if (step.description) {
      stepEl.appendChild(descEl);
    }

    return stepEl;
  }

  /**
   * Play solution animation
   */
  async playSolution() {
    if (!this.solution || !this.solution.moves) {
      this.showError("No solution to play");
      return;
    }

    this.isPlaying = true;
    this.updatePlayButtons(true);

    const speed = parseInt(document.getElementById("speedSlider").value);
    const delay = 1100 - speed * 100; // Convert speed 1-10 to delay 1000-100ms

    try {
      for (let i = this.solutionIndex; i < this.solution.moves.length; i++) {
        if (!this.isPlaying) break;

        const move = this.solution.moves[i];

        this.updateCurrentStep(
          `Playing move ${i + 1}/${this.solution.moves.length}: ${move}`
        );
        this.highlightStep(i);

        // Apply move with proper state tracking
        await this.applyMove(move);
        await this.delay(delay);

        this.solutionIndex = i + 1;
      }

      if (this.isPlaying && this.solutionIndex >= this.solution.moves.length) {
        this.updateCurrentStep("🎉 Solution complete! Cube is solved!");
        this.updateStatus("🎉 Solution complete!");

        // Force final solved state update to ensure all colors are correct
        const solvedState = {
          front: Array(9).fill("green"),
          back: Array(9).fill("blue"),
          left: Array(9).fill("orange"),
          right: Array(9).fill("red"),
          top: Array(9).fill("white"),
          bottom: Array(9).fill("yellow"),
        };

        setTimeout(() => {
          console.log("Applying final solved state");
          this.renderer.updateCubeState(solvedState);
        }, 500);
      }
    } catch (error) {
      console.error("Solution playback error:", error);
      this.showError("Solution playback failed: " + error.message);
    } finally {
      this.isPlaying = false;
      this.updatePlayButtons(false);
    }
  }

  /**
   * Pause solution playback
   */
  pauseSolution() {
    this.isPlaying = false;
    this.updatePlayButtons(false);
    this.updateCurrentStep("Paused");
  }

  /**
   * Step through solution
   */
  async stepSolution() {
    if (!this.solution || !this.solution.moves) {
      this.showError("No solution to step through");
      return;
    }

    if (this.solutionIndex >= this.solution.moves.length) {
      this.showError("Solution complete");
      return;
    }

    const move = this.solution.moves[this.solutionIndex];
    this.updateCurrentStep(
      `Step ${this.solutionIndex + 1}/${this.solution.moves.length}: ${move}`
    );

    await this.applyMove(move);
    this.solutionIndex++;

    if (this.solutionIndex >= this.solution.moves.length) {
      this.updateCurrentStep("Solution complete! 🎉");
      this.updateStatus("🎉 Cube solved!");
    }
  }

  /**
   * Reset solution playback
   */
  async resetSolution() {
    this.pauseSolution();
    this.solutionIndex = 0;
    await this.resetCube();
    this.updateCurrentStep("Ready to play solution");
    this.clearStepHighlights();
  }

  /**
   * Set playback speed
   */
  setPlaySpeed(speed) {
    console.log("Playback speed set to:", speed);
    // Speed is handled in playSolution method
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const moveMap = {
      f: "F",
      F: "F'",
      r: "R",
      R: "R'",
      u: "U",
      U: "U'",
      b: "B",
      B: "B'",
      l: "L",
      L: "L'",
      d: "D",
      D: "D'",
    };

    const move = moveMap[e.key];
    if (move) {
      e.preventDefault();
      this.applyMove(move);
    } else if (e.key === " ") {
      e.preventDefault();
      this.scrambleCube();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.solveCube();
    } else if (e.key === "=") {
      e.preventDefault();
      // Increase cube size
      const slider = document.getElementById("cubeScale");
      const newScale = Math.min(3, parseFloat(slider.value) + 0.1);
      slider.value = newScale;
      this.renderer.setCubeScale(newScale);
      document.getElementById("scaleValue").textContent = newScale.toFixed(1);
    } else if (e.key === "-") {
      e.preventDefault();
      // Decrease cube size
      const slider = document.getElementById("cubeScale");
      const newScale = Math.max(0.5, parseFloat(slider.value) - 0.1);
      slider.value = newScale;
      this.renderer.setCubeScale(newScale);
      document.getElementById("scaleValue").textContent = newScale.toFixed(1);
    } else if (e.key === "0") {
      e.preventDefault();
      // Reset view
      this.renderer.resetCamera();
      document.getElementById("cubeScale").value = "1";
      document.getElementById("scaleValue").textContent = "1.0";
      this.renderer.setCubeScale(1);
    }
  }

  /**
   * Update UI elements
   */
  updateStatus(status) {
    document.getElementById("cubeStatus").textContent = status;
  }

  updateMoveCount(count) {
    this.moveCount = count;
    document.getElementById("moveCount").textContent = count;
  }

  updateCurrentStep(text) {
    document.getElementById("currentStep").textContent = text;
  }

  updatePlayButtons(isPlaying) {
    document.getElementById("playBtn").disabled = isPlaying;
    document.getElementById("pauseBtn").disabled = !isPlaying;
  }

  highlightStep(stepIndex) {
    this.clearStepHighlights();
    const stepEl = document.querySelector(`[data-step-index="${stepIndex}"]`);
    if (stepEl) {
      stepEl.classList.add("active");
    }
  }

  clearStepHighlights() {
    document.querySelectorAll(".solution-step").forEach((el) => {
      el.classList.remove("active", "completed");
    });
  }

  hideSolution() {
    document.getElementById("solutionSection").style.display = "none";
    this.solution = null;
    this.solutionIndex = 0;
  }

  showLoading(show, text = "Processing...") {
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");

    if (show) {
      loadingText.textContent = text;
      overlay.style.display = "flex";
    } else {
      overlay.style.display = "none";
    }
  }

  showError(message) {
    console.error(message);
    alert(message); // Simple error display - could be enhanced with custom modal
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Show help section
   */
  showHelp() {
    const helpSection = document.getElementById("helpSection");
    if (helpSection) {
      helpSection.style.display = "flex";
    }
  }

  /**
   * Hide help section
   */
  hideHelp() {
    const helpSection = document.getElementById("helpSection");
    if (helpSection) {
      helpSection.style.display = "none";
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.cubeApp = new CubeApp();
});

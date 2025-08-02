/**
 * 3D Cube Renderer using Three.js
 * Handles cube visualization, animations, and interactions
 */

class CubeRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element '${canvasId}' not found`);
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cubeGroup = null;
    this.cubies = [];
    this.cubeSize = 3; // Default cube size

    this.animationSpeed = 0.5;
    this.isAnimating = false;
    this.isUpdating = false;
    this.animationQueue = [];

    // Color mapping
    this.colors = {
      white: 0xffffff,
      yellow: 0xffff00,
      red: 0xff0000,
      orange: 0xff8800,
      blue: 0x0000ff,
      green: 0x00ff00,
      black: 0x000000,
    };

    // Initialize after a short delay to ensure canvas has dimensions
    setTimeout(() => this.init(), 50);
  }

  /**
   * Initialize the 3D scene
   */
  init() {
    try {
      console.log("Initializing CubeRenderer...");
      console.log("THREE.js version:", THREE.REVISION);
      console.log("Canvas element:", this.canvas);
      console.log(
        "Canvas dimensions:",
        this.canvas.clientWidth,
        "x",
        this.canvas.clientHeight
      );

      this.setupScene();
      this.setupCamera();
      this.setupRenderer();
      this.setupControls();
      this.setupLighting();
      this.createCube();
      this.startRenderLoop();

      console.log("CubeRenderer initialized successfully");
    } catch (error) {
      console.error("Failed to initialize CubeRenderer:", error);
      throw error;
    }
  }

  /**
   * Setup Three.js scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
  }

  /**
   * Setup camera
   */
  setupCamera() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 500;
    const aspect = width / height;

    console.log("Setting up camera with aspect ratio:", aspect);

    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup WebGL renderer
   */
  setupRenderer() {
    console.log("Setting up WebGL renderer...");

    // Force canvas dimensions if they're zero
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 500;

    console.log("Canvas dimensions:", width, "x", height);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xf0f0f0, 1);

    console.log("Renderer configured successfully");
  }

  /**
   * Setup orbit controls
   */
  setupControls() {
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;
      this.controls.enableRotate = true;

      // Set zoom limits
      this.controls.minDistance = 3;
      this.controls.maxDistance = 20;

      // Set rotation limits (optional)
      this.controls.maxPolarAngle = Math.PI; // Allow full vertical rotation
      this.controls.minPolarAngle = 0;

      // Smooth rotation and zoom
      this.controls.rotateSpeed = 1.0;
      this.controls.zoomSpeed = 1.2;
      this.controls.panSpeed = 0.8;

      console.log("OrbitControls initialized with rotation and zoom");
    } else {
      console.warn("OrbitControls not available, using basic camera");
      this.setupFallbackControls();
    }
  }

  /**
   * Setup fallback controls when OrbitControls is not available
   */
  setupFallbackControls() {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let rotationX = 0;
    let rotationY = 0;

    // Mouse events
    this.canvas.addEventListener("mousedown", (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      rotationY += deltaX * 0.01;
      rotationX += deltaY * 0.01;

      // Limit vertical rotation
      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

      this.updateCameraPosition(rotationX, rotationY);

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.canvas.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", (event) => {
      if (event.touches.length === 1) {
        isMouseDown = true;
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
      }
      event.preventDefault();
    });

    this.canvas.addEventListener("touchmove", (event) => {
      if (!isMouseDown || event.touches.length !== 1) return;

      const deltaX = event.touches[0].clientX - mouseX;
      const deltaY = event.touches[0].clientY - mouseY;

      rotationY += deltaX * 0.01;
      rotationX += deltaY * 0.01;

      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));
      this.updateCameraPosition(rotationX, rotationY);

      mouseX = event.touches[0].clientX;
      mouseY = event.touches[0].clientY;
      event.preventDefault();
    });

    this.canvas.addEventListener("touchend", () => {
      isMouseDown = false;
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const zoom = event.deltaY > 0 ? 1.1 : 0.9;
      this.camera.position.multiplyScalar(zoom);

      // Limit zoom
      const distance = this.camera.position.length();
      if (distance < 3) this.camera.position.normalize().multiplyScalar(3);
      if (distance > 20) this.camera.position.normalize().multiplyScalar(20);
    });

    console.log("Fallback controls with touch support initialized");
  }

  /**
   * Update camera position for manual controls
   */
  updateCameraPosition(rotationX, rotationY) {
    const distance = this.camera.position.length();
    this.camera.position.x =
      distance * Math.sin(rotationY) * Math.cos(rotationX);
    this.camera.position.y = distance * Math.sin(rotationX);
    this.camera.position.z =
      distance * Math.cos(rotationY) * Math.cos(rotationX);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup lighting
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Additional lights for better illumination
    const light1 = new THREE.DirectionalLight(0xffffff, 0.3);
    light1.position.set(-10, -10, -5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.3);
    light2.position.set(0, 0, 10);
    this.scene.add(light2);
  }

  /**
   * Create the 3D cube
   */
  createCube(size = this.cubeSize) {
    console.log(`Creating ${size}x${size}x${size} 3D cube...`);

    this.cubeGroup = new THREE.Group();
    this.cubies = [];

    const cubieSize = 0.95;
    const gap = 0.05;
    const totalSize = cubieSize + gap;

    // Calculate offset to center the cube
    const offset = ((size - 1) * totalSize) / 2;

    // Create NxNxN structure
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const cubie = this.createCubie(cubieSize);

          // Position cubie in NxN grid
          cubie.position.set(
            x * totalSize - offset,
            y * totalSize - offset,
            z * totalSize - offset
          );

          // Store grid position for state updates
          cubie.userData = { x, y, z, size };
          this.cubies.push(cubie);
          this.cubeGroup.add(cubie);
        }
      }
    }

    // Set initial scale
    this.cubeGroup.scale.set(1, 1, 1);

    this.scene.add(this.cubeGroup);
    console.log(
      `Created ${this.cubies.length} cubies for ${size}x${size}x${size} cube`
    );
    console.log("Cube group added to scene");

    // Update cube size property
    this.cubeSize = size;
  }

  /**
   * Change cube size and recreate visualization
   */
  setCubeSize(size) {
    if (size === this.cubeSize) return; // No change needed

    console.log(
      `Changing cube size from ${this.cubeSize}x${this.cubeSize} to ${size}x${size}`
    );

    // Remove existing cube
    if (this.cubeGroup) {
      this.scene.remove(this.cubeGroup);
    }

    // Clear cubies array
    this.cubies = [];

    // Create new cube with new size
    this.createCube(size);

    // Reset camera to fit new cube size
    this.adjustCameraForSize(size);
  }

  /**
   * Adjust camera position based on cube size
   */
  adjustCameraForSize(size) {
    if (!this.camera) return;

    // Calculate appropriate distance based on cube size
    const distance = Math.max(8, size * 2 + 3);

    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(0, 0, 0);

    if (this.controls) {
      this.controls.update();
    }
  }

  /**
   * Set cube scale
   */
  setCubeScale(scale) {
    if (this.cubeGroup) {
      scale = Math.max(0.5, Math.min(3, scale)); // Limit scale between 0.5 and 3
      this.cubeGroup.scale.set(scale, scale, scale);
      console.log("Cube scale set to:", scale);
    }
  }

  /**
   * Get current cube scale
   */
  getCubeScale() {
    return this.cubeGroup ? this.cubeGroup.scale.x : 1;
  }

  /**
   * Reset camera to default position
   */
  resetCamera() {
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);
    if (this.controls) {
      this.controls.reset();
    }
  }

  /**
   * Create individual cubie
   */
  createCubie(size) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    // Standard Rubik's cube colors: right=red, left=orange, top=white, bottom=yellow, front=green, back=blue
    const materials = [
      new THREE.MeshLambertMaterial({ color: this.colors.red }), // Right
      new THREE.MeshLambertMaterial({ color: this.colors.orange }), // Left
      new THREE.MeshLambertMaterial({ color: this.colors.white }), // Top
      new THREE.MeshLambertMaterial({ color: this.colors.yellow }), // Bottom
      new THREE.MeshLambertMaterial({ color: this.colors.green }), // Front
      new THREE.MeshLambertMaterial({ color: this.colors.blue }), // Back
    ];

    const cubie = new THREE.Mesh(geometry, materials);
    cubie.castShadow = true;
    cubie.receiveShadow = true;

    // Add edge lines
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    cubie.add(wireframe);

    return cubie;
  }

  /**
   * Update cube colors based on state
   */
  updateCubeState(state = null) {
    // Prevent multiple simultaneous updates
    if (this.isUpdating) {
      console.log("Update already in progress, skipping...");
      return;
    }

    this.isUpdating = true;

    try {
      if (!state) {
        // Default solved state - create arrays based on current cube size
        const faceSize = this.cubeSize * this.cubeSize;
        state = {
          front: Array(faceSize).fill("green"), // F face - Green
          back: Array(faceSize).fill("blue"), // B face - Blue
          left: Array(faceSize).fill("orange"), // L face - Orange
          right: Array(faceSize).fill("red"), // R face - Red
          top: Array(faceSize).fill("white"), // U face - White
          bottom: Array(faceSize).fill("yellow"), // D face - Yellow
        };
      }

      console.log(
        `Updating ${this.cubeSize}x${this.cubeSize} cube state with:`,
        state
      );

      // Update each face with proper NxN grid mapping
      this.updateFaceColors("front", state.front);
      this.updateFaceColors("back", state.back);
      this.updateFaceColors("left", state.left);
      this.updateFaceColors("right", state.right);
      this.updateFaceColors("top", state.top);
      this.updateFaceColors("bottom", state.bottom);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update specific face colors with NxN grid mapping
   */
  updateFaceColors(faceName, colors) {
    const expectedLength = this.cubeSize * this.cubeSize;
    if (!colors || colors.length !== expectedLength) {
      console.error(
        `Invalid colors array for ${this.cubeSize}x${this.cubeSize} face ${faceName}:`,
        colors,
        `Expected ${expectedLength}, got ${colors?.length}`
      );
      return;
    }

    console.log(
      `Updating ${faceName} with ${this.cubeSize}x${this.cubeSize} colors:`,
      colors
    );

    // Face material indices (same for all cube sizes)
    const faceIndices = {
      front: 4, // Z+ face
      back: 5, // Z- face
      right: 0, // X+ face
      left: 1, // X- face
      top: 2, // Y+ face
      bottom: 3, // Y- face
    };

    const materialIndex = faceIndices[faceName];
    if (materialIndex === undefined) {
      console.error("Unknown face name:", faceName);
      return;
    }

    // Update each cubie on this face
    for (let i = 0; i < colors.length; i++) {
      const colorName = colors[i];
      const colorValue = this.colors[colorName] || this.colors["white"];

      // Calculate grid position from index
      const row = Math.floor(i / this.cubeSize);
      const col = i % this.cubeSize;

      // Find the corresponding cubie based on face and position
      const cubie = this.findCubieForFacePosition(faceName, row, col);
      if (cubie && cubie.material[materialIndex]) {
        cubie.material[materialIndex].color.setHex(colorValue);
      }
    }
  }

  /**
   * Find cubie at specific face position
   */
  findCubieForFacePosition(faceName, row, col) {
    const size = this.cubeSize;

    // Convert face position to 3D coordinates
    let x, y, z;

    switch (faceName) {
      case "front":
        x = col;
        y = size - 1 - row;
        z = size - 1;
        break;
      case "back":
        x = size - 1 - col;
        y = size - 1 - row;
        z = 0;
        break;
      case "right":
        x = size - 1;
        y = size - 1 - row;
        z = size - 1 - col;
        break;
      case "left":
        x = 0;
        y = size - 1 - row;
        z = col;
        break;
      case "top":
        x = col;
        y = size - 1;
        z = size - 1 - row;
        break;
      case "bottom":
        x = col;
        y = 0;
        z = row;
        break;
      default:
        return null;
    }

    // Find cubie with matching coordinates
    return this.cubies.find(
      (cubie) =>
        cubie.userData.x === x &&
        cubie.userData.y === y &&
        cubie.userData.z === z
    );
  }

  /**
   * Find cubie at specific 3D position
   */
  findCubieAtPosition(targetPos) {
    return this.cubies.find((cubie) => {
      const pos = cubie.userData;
      return (
        pos[0] === targetPos[0] &&
        pos[1] === targetPos[1] &&
        pos[2] === targetPos[2]
      );
    });
  }

  /**
   * Animate cube move
   */
  async animateMove(move) {
    if (this.isAnimating) {
      this.animationQueue.push(move);
      return;
    }

    this.isAnimating = true;

    try {
      await this.performMoveAnimation(move);
    } catch (error) {
      console.error("Animation error:", error);
    }

    this.isAnimating = false;

    // Process queue
    if (this.animationQueue.length > 0) {
      const nextMove = this.animationQueue.shift();
      setTimeout(() => this.animateMove(nextMove), 50);
    }
  }

  /**
   * Perform move animation
   */
  async performMoveAnimation(move) {
    const moveInfo = this.parseMoveNotation(move);
    if (!moveInfo) return;

    const { face, direction, angle } = moveInfo;
    const cubies = this.getCubiesForFace(face);

    // Create rotation group
    const rotationGroup = new THREE.Group();
    this.scene.add(rotationGroup);

    // Move cubies to rotation group
    cubies.forEach((cubie) => {
      this.cubeGroup.remove(cubie);
      rotationGroup.add(cubie);
    });

    // Animate rotation
    await this.animateRotation(rotationGroup, face, angle);

    // Move cubies back to main group
    cubies.forEach((cubie) => {
      rotationGroup.remove(cubie);
      this.cubeGroup.add(cubie);
    });

    this.scene.remove(rotationGroup);
  }

  /**
   * Parse move notation
   */
  parseMoveNotation(move) {
    const moves = {
      F: { face: "front", direction: 1, angle: Math.PI / 2 },
      "F'": { face: "front", direction: -1, angle: -Math.PI / 2 },
      F2: { face: "front", direction: 2, angle: Math.PI },
      B: { face: "back", direction: 1, angle: Math.PI / 2 },
      "B'": { face: "back", direction: -1, angle: -Math.PI / 2 },
      B2: { face: "back", direction: 2, angle: Math.PI },
      R: { face: "right", direction: 1, angle: Math.PI / 2 },
      "R'": { face: "right", direction: -1, angle: -Math.PI / 2 },
      R2: { face: "right", direction: 2, angle: Math.PI },
      L: { face: "left", direction: 1, angle: Math.PI / 2 },
      "L'": { face: "left", direction: -1, angle: -Math.PI / 2 },
      L2: { face: "left", direction: 2, angle: Math.PI },
      U: { face: "top", direction: 1, angle: Math.PI / 2 },
      "U'": { face: "top", direction: -1, angle: -Math.PI / 2 },
      U2: { face: "top", direction: 2, angle: Math.PI },
      D: { face: "bottom", direction: 1, angle: Math.PI / 2 },
      "D'": { face: "bottom", direction: -1, angle: -Math.PI / 2 },
      D2: { face: "bottom", direction: 2, angle: Math.PI },
    };

    return moves[move];
  }

  /**
   * Get cubies for specific face
   */
  getCubiesForFace(face) {
    const faceMapping = {
      front: (pos) => pos.z === 2,
      back: (pos) => pos.z === 0,
      right: (pos) => pos.x === 2,
      left: (pos) => pos.x === 0,
      top: (pos) => pos.y === 2,
      bottom: (pos) => pos.y === 0,
    };

    const condition = faceMapping[face];
    return this.cubies.filter((cubie) => condition(cubie.userData));
  }

  /**
   * Animate rotation
   */
  async animateRotation(group, face, targetAngle) {
    const axis = this.getRotationAxis(face);
    const startRotation = group.rotation[axis];
    const endRotation = startRotation + targetAngle;

    return new Promise((resolve) => {
      const duration = 300; // ms
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);

        group.rotation[axis] =
          startRotation + (endRotation - startRotation) * eased;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Snap to exact angle and update positions
          group.rotation[axis] = endRotation;
          this.updateCubiePositions(group, face);
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Get rotation axis for face
   */
  getRotationAxis(face) {
    const axes = {
      front: "z",
      back: "z",
      right: "x",
      left: "x",
      top: "y",
      bottom: "y",
    };

    return axes[face] || "y";
  }

  /**
   * Update cubie positions after rotation
   */
  updateCubiePositions(group, face) {
    // Reset group rotation
    group.rotation.set(0, 0, 0);

    // Update cubie userData positions based on face rotation
    // This is a simplified approach - in a full implementation,
    // you'd need to properly track position changes
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = Math.max(0.1, Math.min(2, speed));
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.renderer || !this.camera) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Start render loop
   */
  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.controls) {
      this.controls.dispose();
    }
  }
}

// Export for use in other modules
window.CubeRenderer = CubeRenderer;

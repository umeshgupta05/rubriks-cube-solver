/**
 * 3D Cube Renderer using Three.js
 * Handles real-time visualization and animation synchronization
 */

class CubeRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cubeGroup = null;
    this.pieces = [];
    this.animationQueue = [];
    this.isAnimating = false;
    this.animationSpeed = 500; // milliseconds

    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    this.setupLighting();

    // Create cube
    this.createCube();

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener("resize", () => this.handleResize());
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point light for better illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.set(-5, -5, -5);
    this.scene.add(pointLight);
  }

  createCube() {
    this.cubeGroup = new THREE.Group();
    this.pieces = [];

    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const blackMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // Color mapping
    const colorMap = {
      W: 0xffffff, // White
      R: 0xff0000, // Red
      G: 0x00ff00, // Green
      Y: 0xffff00, // Yellow
      O: 0xff8000, // Orange
      B: 0x0000ff, // Blue
    };

    // Create 27 pieces (3x3x3)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const piece = new THREE.Mesh(geometry, blackMaterial.clone());
          piece.position.set(x, y, z);
          piece.castShadow = true;
          piece.receiveShadow = true;

          // Store piece information
          piece.userData = {
            position: { x, y, z },
            originalPosition: { x, y, z },
          };

          this.pieces.push(piece);
          this.cubeGroup.add(piece);
        }
      }
    }

    this.scene.add(this.cubeGroup);
    this.updateCubeColors();
  }

  updateCubeColors(cubeState = null) {
    if (!cubeState) {
      // Default solved cube
      cubeState = {
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
    }

    const colorMap = {
      W: 0xffffff,
      R: 0xff0000,
      G: 0x00ff00,
      Y: 0xffff00,
      O: 0xff8000,
      B: 0x0000ff,
    };

    // Update each piece's colors based on its position
    this.pieces.forEach((piece) => {
      const { x, y, z } = piece.position;
      const materials = [];

      // Create materials for each face
      for (let i = 0; i < 6; i++) {
        materials.push(new THREE.MeshLambertMaterial({ color: 0x000000 }));
      }

      // Right face (positive X)
      if (x > 0.5) {
        const row = Math.round(1 - y);
        const col = Math.round(z + 1);
        if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          materials[0].color.setHex(colorMap[cubeState.R[row][col]]);
        }
      }

      // Left face (negative X)
      if (x < -0.5) {
        const row = Math.round(1 - y);
        const col = Math.round(1 - z);
        if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          materials[1].color.setHex(colorMap[cubeState.L[row][col]]);
        }
      }

      // Top face (positive Y)
      if (y > 0.5) {
        const row = Math.round(1 - z);
        const col = Math.round(x + 1);
        if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          materials[2].color.setHex(colorMap[cubeState.U[row][col]]);
        }
      }

      // Bottom face (negative Y)
      if (y < -0.5) {
        const row = Math.round(z + 1);
        const col = Math.round(x + 1);
        if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          materials[3].color.setHex(colorMap[cubeState.D[row][col]]);
        }
      }

      // Front face (positive Z)
      if (z > 0.5) {
        const row = Math.round(1 - y);
        const col = Math.round(x + 1);
        if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          materials[4].color.setHex(colorMap[cubeState.F[row][col]]);
        }
      }

      // Back face (negative Z)
      if (z < -0.5) {
        const row = Math.round(1 - y);
        const col = Math.round(1 - x);
        if (row >= 0 && row < 3 && col >= 0 && col < 3) {
          materials[5].color.setHex(colorMap[cubeState.B[row][col]]);
        }
      }

      piece.material = materials;
    });
  }

  // Animate a single move
  animateMove(move, callback) {
    if (this.isAnimating) {
      this.animationQueue.push({ move, callback });
      return;
    }

    this.isAnimating = true;
    const axis = this.getMoveAxis(move);
    const angle = this.getMoveAngle(move);
    const pieces = this.getPiecesForMove(move);

    // Create rotation group
    const rotationGroup = new THREE.Group();
    this.scene.add(rotationGroup);

    // Move pieces to rotation group
    pieces.forEach((piece) => {
      this.cubeGroup.remove(piece);
      rotationGroup.add(piece);
    });

    // Animate rotation
    const startTime = Date.now();
    const duration = this.animationSpeed;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      rotationGroup.rotation[axis] = angle * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - move pieces back to cube group
        pieces.forEach((piece) => {
          rotationGroup.remove(piece);

          // Apply the rotation to the piece's position
          piece.position.applyMatrix4(rotationGroup.matrix);
          piece.rotation.setFromRotationMatrix(rotationGroup.matrix);

          // Round position to nearest integer to avoid floating point errors
          piece.position.x = Math.round(piece.position.x);
          piece.position.y = Math.round(piece.position.y);
          piece.position.z = Math.round(piece.position.z);

          this.cubeGroup.add(piece);
        });

        this.scene.remove(rotationGroup);
        this.isAnimating = false;

        if (callback) callback();

        // Process next animation in queue
        if (this.animationQueue.length > 0) {
          const next = this.animationQueue.shift();
          this.animateMove(next.move, next.callback);
        }
      }
    };

    animate();
  }

  getMoveAxis(move) {
    const face = move[0];
    switch (face) {
      case "U":
      case "D":
        return "y";
      case "R":
      case "L":
        return "x";
      case "F":
      case "B":
        return "z";
    }
  }

  getMoveAngle(move) {
    const isPrime = move.includes("'");
    const face = move[0];

    let baseAngle = Math.PI / 2; // 90 degrees

    // Adjust for face orientation
    if (face === "D" || face === "L" || face === "B") {
      baseAngle = -baseAngle;
    }

    // Reverse for prime moves
    if (isPrime) {
      baseAngle = -baseAngle;
    }

    return baseAngle;
  }

  getPiecesForMove(move) {
    const face = move[0];
    return this.pieces.filter((piece) => {
      const { x, y, z } = piece.position;

      switch (face) {
        case "U":
          return y > 0.5;
        case "D":
          return y < -0.5;
        case "R":
          return x > 0.5;
        case "L":
          return x < -0.5;
        case "F":
          return z > 0.5;
        case "B":
          return z < -0.5;
        default:
          return false;
      }
    });
  }

  // Animate a sequence of moves
  animateMoveSequence(moves, onMoveComplete, onSequenceComplete) {
    if (!Array.isArray(moves)) {
      moves = moves.split(" ").filter((move) => move.trim() !== "");
    }

    let index = 0;
    const animateNext = () => {
      if (index >= moves.length) {
        if (onSequenceComplete) onSequenceComplete();
        return;
      }

      const move = moves[index];
      this.animateMove(move, () => {
        if (onMoveComplete) onMoveComplete(move, index);
        index++;
        setTimeout(animateNext, 100); // Small delay between moves
      });
    };

    animateNext();
  }

  // Update animation speed
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  // Handle window resize
  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Animation loop
  animate() {
    requestAnimationFrame(() => this.animate());

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Cleanup
  dispose() {
    if (this.renderer) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }

    // Dispose geometries and materials
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

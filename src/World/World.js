import * as THREE from 'three';

/**
 * World - Manages the timeline-style world with long straight road
 */
export default class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;

    // Timeline dimensions
    this.timelineLength = 500; // Long timeline road
    this.roadWidth = 10; // Road width
    this.groundWidth = 30; // Ground extends beyond road

    // Create world elements
    this.createGround();
    this.createRoad();
    this.createRoadEdges();
    this.createMemoryLandmarks();

    // Proximity feedback settings
    this.proximityRadius = 15; // Detection radius
    this.currentHighlightedLandmark = null; // Only one highlighted at a time
    this.highlightIntensity = 0; // Current highlight intensity (0-1)
    this.highlightSpeed = 0.05; // Lerp speed for smooth transitions

    // Listen for updates to check proximity
    this.experience.time.on('tick', () => {
      this.update();
    });
  }

  /**
   * Create long ground plane for timeline
   */
  createGround() {
    // Create ground plane (long and narrow, like a timeline)
    const groundGeometry = new THREE.PlaneGeometry(
      this.groundWidth,
      this.timelineLength
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a, // Slightly lighter gray with muted blue tint
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, this.timelineLength / 2);
    ground.receiveShadow = true;
    this.scene.instance.add(ground);
  }

  /**
   * Create long straight road (timeline path)
   */
  createRoad() {
    // Main road surface
    const roadGeometry = new THREE.PlaneGeometry(
      this.roadWidth,
      this.timelineLength
    );
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Dark gray road
      roughness: 0.6,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, this.timelineLength / 2);
    road.receiveShadow = true;
    this.scene.instance.add(road);

    // Center line (timeline indicator)
    const centerLineGeometry = new THREE.PlaneGeometry(0.15, this.timelineLength);
    const centerLineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.02, this.timelineLength / 2);
    this.scene.instance.add(centerLine);
  }

  /**
   * Create road edges/boundaries
   */
  createRoadEdges() {
    const edgeHeight = 0.1;
    const edgeWidth = 0.3;

    // Left edge
    const leftEdgeGeometry = new THREE.BoxGeometry(
      edgeWidth,
      edgeHeight,
      this.timelineLength
    );
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    });
    const leftEdge = new THREE.Mesh(leftEdgeGeometry, edgeMaterial);
    leftEdge.position.set(
      -this.roadWidth / 2 - edgeWidth / 2,
      edgeHeight / 2,
      this.timelineLength / 2
    );
    leftEdge.castShadow = true;
    leftEdge.receiveShadow = true;
    this.scene.instance.add(leftEdge);

    // Right edge
    const rightEdge = new THREE.Mesh(leftEdgeGeometry, edgeMaterial);
    rightEdge.position.set(
      this.roadWidth / 2 + edgeWidth / 2,
      edgeHeight / 2,
      this.timelineLength / 2
    );
    rightEdge.castShadow = true;
    rightEdge.receiveShadow = true;
    this.scene.instance.add(rightEdge);
  }

  /**
   * Create memory landmarks along the timeline road
   */
  createMemoryLandmarks() {
    // Get memory data from MemoryManager
    const memories = this.experience.memoryManager.getMemoriesInOrder();

    // Store landmark references for proximity detection (only real memories)
    this.memoryLandmarks = [];
    
    // Left side X position for real memories
    const leftSideX = -6;
    // Right side X position for decorative objects
    const rightSideX = 6;
    
    memories.forEach((memory) => {
      // Create REAL memory on left side (X < 0)
      const memoryGroup = this.createMemoryPrefab(memory, leftSideX);
      const memoryLandmark = {
        group: memoryGroup,
        structure: memoryGroup.getObjectByName('buildingMesh'),
        structureMaterial: memoryGroup.getObjectByName('buildingMesh').material,
        position: new THREE.Vector3(leftSideX, 0, memory.zPosition),
        originalScale: 1,
        originalEmissive: new THREE.Color(0x000000),
        originalColor: memoryGroup.getObjectByName('buildingMesh').material.color.clone(),
        highlightIntensity: 0,
        memoryId: memory.id,
        isMemory: true
      };
      this.memoryLandmarks.push(memoryLandmark);
      
      // Create DECORATIVE copy on right side (X > 0)
      this.createDecorativeCopy(memory, rightSideX);
    });
  }

  /**
   * Create text texture from canvas
   * @param {string} text - Text to render
   * @param {number} fontSize - Font size in pixels
   * @param {string} backgroundColor - Background color hex
   * @param {string} textColor - Text color hex
   * @returns {THREE.CanvasTexture} Canvas texture
   */
  createTextTexture(text, fontSize = 32, backgroundColor = '#ffffff', textColor = '#000000') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    context.font = `bold ${fontSize}px Arial`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    canvas.width = textWidth + 40;
    canvas.height = textHeight + 20;
    
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = textColor;
    context.font = `bold ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Create memory prefab group
   * @param {Object} memory - Memory data object
   * @param {number} xPosition - X position (right side > 0)
   * @returns {THREE.Group} Memory group
   */
  createMemoryPrefab(memory, xPosition) {
    const memoryGroup = new THREE.Group();
    memoryGroup.name = `memory-${memory.id}`;
    memoryGroup.position.set(xPosition, 0, memory.zPosition);
    memoryGroup.userData.isMemory = true;
    memoryGroup.userData.memoryId = memory.id;

    // 1) Building (main structure)
    const buildingWidth = 3;
    const buildingHeight = 4;
    const buildingDepth = 3;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      roughness: 0.7,
      metalness: 0.2
    });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.name = 'buildingMesh';
    buildingMesh.position.y = buildingHeight / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    memoryGroup.add(buildingMesh);

    // 2) Title sign (memory title)
    const titleSignWidth = 2.5;
    const titleSignHeight = 0.8;
    const titleSignGeometry = new THREE.PlaneGeometry(titleSignWidth, titleSignHeight);
    const titleTexture = this.createTextTexture(memory.title, 24, '#ffffff', '#000000');
    const titleSignMaterial = new THREE.MeshStandardMaterial({
      map: titleTexture,
      side: THREE.DoubleSide
    });
    const titleSignMesh = new THREE.Mesh(titleSignGeometry, titleSignMaterial);
    titleSignMesh.name = 'titleSignMesh';
    titleSignMesh.position.set(0, buildingHeight + titleSignHeight / 2 + 0.3, buildingDepth / 2 + 0.1);
    titleSignMesh.rotation.y = Math.PI;
    titleSignMesh.castShadow = true;
    memoryGroup.add(titleSignMesh);

    // 3) Billboard (cover image placeholder)
    const billboardWidth = 2.5;
    const billboardHeight = 2;
    const billboardGeometry = new THREE.PlaneGeometry(billboardWidth, billboardHeight);
    const billboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a8a8a,
      side: THREE.DoubleSide
    });
    const billboardMesh = new THREE.Mesh(billboardGeometry, billboardMaterial);
    billboardMesh.name = 'billboardMesh';
    billboardMesh.position.set(buildingWidth / 2 + billboardWidth / 2 + 0.5, buildingHeight / 2, 0);
    billboardMesh.rotation.y = -Math.PI / 2;
    billboardMesh.castShadow = true;
    memoryGroup.add(billboardMesh);

    // 4) Date sign (smaller)
    const dateSignWidth = 1.5;
    const dateSignHeight = 0.4;
    const dateSignGeometry = new THREE.PlaneGeometry(dateSignWidth, dateSignHeight);
    const dateTexture = this.createTextTexture(memory.date, 16, '#f0f0f0', '#333333');
    const dateSignMaterial = new THREE.MeshStandardMaterial({
      map: dateTexture,
      side: THREE.DoubleSide
    });
    const dateSignMesh = new THREE.Mesh(dateSignGeometry, dateSignMaterial);
    dateSignMesh.name = 'dateSignMesh';
    dateSignMesh.position.set(0, buildingHeight + dateSignHeight / 2 + 1.2, buildingDepth / 2 + 0.1);
    dateSignMesh.rotation.y = Math.PI;
    dateSignMesh.castShadow = true;
    memoryGroup.add(dateSignMesh);

    this.scene.instance.add(memoryGroup);
    return memoryGroup;
  }

  /**
   * Create decorative copy (building only, no signs/billboard)
   * @param {Object} memory - Memory data object
   * @param {number} xPosition - X position (left side < 0)
   */
  createDecorativeCopy(memory, xPosition) {
    const decorativeGroup = new THREE.Group();
    decorativeGroup.position.set(xPosition, 0, memory.zPosition);
    decorativeGroup.userData.isDecorative = true;
    decorativeGroup.userData.isMemory = false;

    // Only building, no signs or billboard
    const buildingWidth = 3;
    const buildingHeight = 4;
    const buildingDepth = 3;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.7,
      metalness: 0.2
    });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.y = buildingHeight / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    decorativeGroup.add(buildingMesh);

    this.scene.instance.add(decorativeGroup);
  }

  /**
   * Update proximity detection and highlight effects
   */
  update() {
    // Wait for car to be initialized
    if (!this.experience.car) return;

    const car = this.experience.car;
    const carPosition = new THREE.Vector3(
      car.body.position.x,
      car.body.position.y,
      car.body.position.z
    );

    // Find closest memory landmark
    let closestLandmark = null;
    let closestDistance = Infinity;

    this.memoryLandmarks.forEach((landmark) => {
      const distance = carPosition.distanceTo(landmark.position);
      
      if (distance < this.proximityRadius && distance < closestDistance) {
        closestDistance = distance;
        closestLandmark = landmark;
      }
    });

    // Update highlight state and active memory
    if (closestLandmark !== this.currentHighlightedLandmark) {
      // Reset previous highlight
      if (this.currentHighlightedLandmark) {
        this.currentHighlightedLandmark.highlightIntensity = 0;
      }
      
      // Set new highlight
      this.currentHighlightedLandmark = closestLandmark;
      
      // Update active memory in MemoryManager
      if (closestLandmark && closestLandmark.memoryId) {
        this.experience.memoryManager.setActiveMemory(closestLandmark.memoryId);
      }
    } else if (!closestLandmark && this.currentHighlightedLandmark) {
      // Car exited all memory zones
      this.currentHighlightedLandmark.highlightIntensity = 0;
      this.currentHighlightedLandmark = null;
      this.experience.memoryManager.clearActiveMemory();
    }

    // Update all landmarks with smooth transitions (only real memories)
    this.memoryLandmarks.forEach((landmark) => {
      // Skip if not a memory (safety check)
      if (!landmark.isMemory) return;
      
      const isHighlighted = landmark === this.currentHighlightedLandmark;
      
      // Smoothly transition highlight intensity
      if (isHighlighted) {
        landmark.highlightIntensity = Math.min(
          1,
          landmark.highlightIntensity + this.highlightSpeed
        );
      } else {
        landmark.highlightIntensity = Math.max(
          0,
          landmark.highlightIntensity - this.highlightSpeed
        );
      }

      // Apply visual effects based on highlight intensity
      const intensity = landmark.highlightIntensity;
      
      // Scale effect (slight scale up)
      const targetScale = 1 + intensity * 0.1; // 10% scale increase at max
      landmark.group.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );

      // Emissive color effect (soft glow)
      const emissiveIntensity = intensity * 0.5; // Max 50% emissive
      const emissiveColor = new THREE.Color(0xffffff);
      emissiveColor.multiplyScalar(emissiveIntensity);
      landmark.structureMaterial.emissive.lerp(emissiveColor, 0.1);
      landmark.structureMaterial.emissiveIntensity = emissiveIntensity;

      // Brightness/color boost
      const colorBoost = new THREE.Color(landmark.originalColor);
      colorBoost.lerp(new THREE.Color(0xffffff), intensity * 0.3); // 30% brighter at max
      landmark.structureMaterial.color.lerp(colorBoost, 0.1);
    });
  }
}


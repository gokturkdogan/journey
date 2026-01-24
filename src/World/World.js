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

    // Store landmark references for proximity detection
    this.memoryLandmarks = [];
    
    memories.forEach((memory, index) => {
      // Extract position from memory data
      const zPosition = memory.worldPosition.z;
      const side = memory.worldPosition.x < 0 ? 'left' : 'right';
      
      const landmark = this.createMemoryLandmark(zPosition, side, memory.order);
      landmark.memoryId = memory.id; // Link landmark to memory
      this.memoryLandmarks.push(landmark);
    });
  }

  /**
   * Create a single memory landmark structure
   * @param {number} zPosition - Position along timeline (Z axis)
   * @param {string} side - 'left' or 'right' side of road
   * @param {number} memoryIndex - Index for visual variation
   */
  createMemoryLandmark(zPosition, side, memoryIndex) {
    const landmarkGroup = new THREE.Group();
    const sideOffset = side === 'left' ? -8 : 8; // Distance from road center
    landmarkGroup.position.set(sideOffset, 0, zPosition);

    // Base structure (building/platform)
    const baseWidth = 3;
    const baseDepth = 3;
    const baseHeight = 1;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a, // Neutral gray base
      roughness: 0.7,
      metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = baseHeight / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    landmarkGroup.add(base);

    // Main structure (building body) - varies by index
    const structureHeight = 2 + (memoryIndex % 3) * 0.5; // Vary height
    const structureWidth = 2.5;
    const structureDepth = 2.5;
    const structureGeometry = new THREE.BoxGeometry(
      structureWidth,
      structureHeight,
      structureDepth
    );
    // Neutral but readable building colors
    const buildingColors = [
      0x6a6a6a, // Light gray
      0x7a7a7a, // Medium gray
      0x6a7a6a, // Slight green-gray
      0x7a6a7a, // Slight purple-gray
      0x6a6a7a, // Slight blue-gray
      0x7a7a6a, // Slight yellow-gray
    ];
    const structureMaterial = new THREE.MeshStandardMaterial({
      color: buildingColors[memoryIndex % buildingColors.length], // Neutral readable colors
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x000000, // Start with no emissive
      emissiveIntensity: 0
    });
    const structure = new THREE.Mesh(structureGeometry, structureMaterial);
    structure.position.y = baseHeight + structureHeight / 2;
    structure.castShadow = true;
    structure.receiveShadow = true;
    landmarkGroup.add(structure);

    // Billboard (placeholder for image)
    const billboardWidth = 2;
    const billboardHeight = 1.5;
    const billboardGeometry = new THREE.PlaneGeometry(billboardWidth, billboardHeight);
    const billboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a8a8a, // Lighter color for contrast (billboard placeholder)
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      emissive: 0x000000, // Start with no emissive
      emissiveIntensity: 0
    });
    const billboard = new THREE.Mesh(billboardGeometry, billboardMaterial);
    billboard.position.set(
      0,
      baseHeight + structureHeight + billboardHeight / 2 + 0.2,
      structureDepth / 2 + 0.1
    );
    billboard.rotation.y = side === 'left' ? -Math.PI / 4 : Math.PI / 4; // Face road
    billboard.castShadow = true;
    landmarkGroup.add(billboard);

    // Billboard frame
    const frameThickness = 0.1;
    const frameGeometry = new THREE.BoxGeometry(
      billboardWidth + frameThickness * 2,
      billboardHeight + frameThickness * 2,
      frameThickness
    );
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.4
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.copy(billboard.position);
    frame.position.z += 0.05;
    frame.rotation.y = billboard.rotation.y;
    frame.castShadow = true;
    landmarkGroup.add(frame);

    // Title/Sign (placeholder)
    const signWidth = 1.5;
    const signHeight = 0.3;
    const signGeometry = new THREE.PlaneGeometry(signWidth, signHeight);
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(
      0,
      baseHeight + structureHeight + billboardHeight + 0.5,
      structureDepth / 2 + 0.1
    );
    sign.rotation.y = billboard.rotation.y;
    sign.castShadow = true;
    landmarkGroup.add(sign);

    // Sign support pole
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, signHeight, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.3
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(
      0,
      baseHeight + structureHeight + billboardHeight + signHeight / 2 + 0.2,
      structureDepth / 2 + 0.1
    );
    pole.rotation.z = Math.PI / 2;
    pole.castShadow = true;
    landmarkGroup.add(pole);

    this.scene.instance.add(landmarkGroup);

    // Store original states for smooth transitions
    const landmarkData = {
      group: landmarkGroup,
      structure: structure,
      structureMaterial: structureMaterial,
      billboard: billboard,
      billboardMaterial: billboardMaterial,
      position: new THREE.Vector3(sideOffset, 0, zPosition),
      originalScale: 1,
      originalEmissive: new THREE.Color(0x000000),
      originalColor: structureMaterial.color.clone(),
      billboardOriginalColor: billboardMaterial.color.clone(),
      highlightIntensity: 0
    };

    return landmarkData;
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

    // Update all landmarks with smooth transitions
    this.memoryLandmarks.forEach((landmark) => {
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

      // Billboard glow effect
      const billboardGlow = new THREE.Color(landmark.billboardOriginalColor);
      billboardGlow.lerp(new THREE.Color(0xaaaaaa), intensity * 0.4); // Lighter at max
      landmark.billboardMaterial.color.lerp(billboardGlow, 0.1);
      landmark.billboardMaterial.emissive.lerp(
        new THREE.Color(0xffffff).multiplyScalar(intensity * 0.3),
        0.1
      );
      landmark.billboardMaterial.emissiveIntensity = intensity * 0.3;
    });
  }
}


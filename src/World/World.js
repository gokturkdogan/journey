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
      color: 0x0f0f0f,
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
      color: 0x2a2a2a,
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
    // Define landmark positions along the timeline (chronological order)
    const landmarkPositions = [
      { z: 20, side: 'left' },   // Early memory
      { z: 50, side: 'right' },  // Memory 2
      { z: 80, side: 'left' },   // Memory 3
      { z: 120, side: 'right' }, // Memory 4
      { z: 160, side: 'left' },  // Memory 5
      { z: 200, side: 'right' }, // Memory 6
      { z: 240, side: 'left' },  // Memory 7
      { z: 280, side: 'right' }, // Memory 8
      { z: 320, side: 'left' },  // Memory 9
      { z: 360, side: 'right' }, // Memory 10
      { z: 400, side: 'left' },  // Memory 11
      { z: 440, side: 'right' }, // Memory 12
    ];

    landmarkPositions.forEach((pos, index) => {
      this.createMemoryLandmark(pos.z, pos.side, index + 1);
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
      color: 0x3a3a3a,
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
    const structureMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a + (memoryIndex * 0x050505), // Slight color variation
      roughness: 0.6,
      metalness: 0.3
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
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
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
  }
}


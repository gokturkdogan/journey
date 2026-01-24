import * as THREE from 'three';

/**
 * Scene - Manages the Three.js scene
 */
export default class Scene {
  constructor() {
    this.instance = new THREE.Scene();
    this.instance.background = new THREE.Color(0x1a1a1a);

    // Add visual references
    this.createGroundPlane();
    this.createAxisHelper();
  }

  /**
   * Create ground plane with grid texture
   */
  createGroundPlane() {
    // Create grid helper
    const gridSize = 50;
    const gridDivisions = 50;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    this.instance.add(gridHelper);

    // Create ground plane mesh for shadows
    const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    plane.position.y = 0;
    plane.receiveShadow = true;
    this.instance.add(plane);
  }

  /**
   * Create world axis helper (X, Y, Z)
   */
  createAxisHelper() {
    const axesHelper = new THREE.AxesHelper(5);
    this.instance.add(axesHelper);
  }
}

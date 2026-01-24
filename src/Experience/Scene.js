import * as THREE from 'three';

/**
 * Scene - Manages the Three.js scene
 */
export default class Scene {
  constructor() {
    this.instance = new THREE.Scene();
    this.instance.background = new THREE.Color(0x0a0a0a);

    // Add visual references (axis helper for debugging)
    this.createAxisHelper();
  }

  /**
   * Create world axis helper (X, Y, Z)
   */
  createAxisHelper() {
    const axesHelper = new THREE.AxesHelper(5);
    this.instance.add(axesHelper);
  }
}

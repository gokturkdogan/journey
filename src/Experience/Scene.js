import * as THREE from 'three';

/**
 * Scene - Manages the Three.js scene
 */
export default class Scene {
  constructor() {
    this.instance = new THREE.Scene();
    this.instance.background = new THREE.Color(0x1a1a1a);
  }
}

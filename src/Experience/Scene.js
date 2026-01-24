import * as THREE from 'three';

/**
 * Scene - Manages the Three.js scene
 */
export default class Scene {
  constructor() {
    this.instance = new THREE.Scene();
    
    // Set subtle background color (not black)
    this.instance.background = new THREE.Color(0x1a1a2e);

    // Add lighting
    this.createLights();

    // Add visual references (axis helper for debugging)
    this.createAxisHelper();
  }

  /**
   * Create basic lighting setup
   */
  createLights() {
    // Ambient light - low intensity for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.instance.add(ambientLight);

    // Directional light - simulating sunlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10); // Position above and to the side
    directionalLight.castShadow = true;

    // Shadow camera settings for better shadow quality
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.0001;

    this.instance.add(directionalLight);
    this.directionalLight = directionalLight;
  }

  /**
   * Create world axis helper (X, Y, Z)
   */
  createAxisHelper() {
    const axesHelper = new THREE.AxesHelper(5);
    this.instance.add(axesHelper);
  }
}

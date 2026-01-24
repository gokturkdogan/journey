import * as THREE from 'three';

/**
 * Renderer - Manages the WebGLRenderer with shadow support
 */
export default class Renderer {
  constructor(experience) {
    this.experience = experience;
    this.canvas = this.experience.canvas;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    // Create WebGLRenderer
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });

    // Enable shadow map
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;

    // Set initial size and pixel ratio
    this.resize();

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  /**
   * Handle window resize
   */
  resize() {
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * Render the scene (called each frame)
   */
  update() {
    this.instance.render(this.scene.instance, this.camera.instance);
  }
}

import * as THREE from 'three';

/**
 * Camera - Manages the PerspectiveCamera
 */
export default class Camera {
  constructor(experience) {
    this.experience = experience;
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Create PerspectiveCamera
    this.instance = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      1000
    );
    this.instance.position.z = 5;

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  /**
   * Handle window resize
   */
  resize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }
}

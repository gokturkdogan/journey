import Scene from './Scene.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import Time from './Time.js';

/**
 * Experience - Singleton class that orchestrates the Three.js application
 */
export default class Experience {
  static instance = null;

  constructor() {
    // Singleton pattern
    if (Experience.instance) {
      return Experience.instance;
    }
    Experience.instance = this;

    // Get canvas element
    this.canvas = document.getElementById('canvas');

    // Initialize core components
    this.time = new Time();
    this.scene = new Scene();
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);

    // Start the render loop
    this.time.on('tick', () => {
      this.update();
    });
  }

  /**
   * Update method called on each frame
   */
  update() {
    this.renderer.update();
  }

  /**
   * Handle window resize
   */
  resize() {
    this.camera.resize();
    this.renderer.resize();
  }
}

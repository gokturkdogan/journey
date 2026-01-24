/**
 * Time - Manages time and animation loop using requestAnimationFrame
 */
export default class Time {
  constructor() {
    // Event listeners storage
    this.listeners = {};

    // Time tracking
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16; // Default 60fps delta

    // Start the animation loop
    this.tick();
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   */
  emit(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }

  /**
   * Animation loop using requestAnimationFrame
   */
  tick() {
    const currentTime = Date.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;

    // Emit tick event
    this.emit('tick');

    // Continue the loop
    window.requestAnimationFrame(() => {
      this.tick();
    });
  }
}

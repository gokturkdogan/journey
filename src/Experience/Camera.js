import * as THREE from 'three';

/**
 * Camera - Manages the PerspectiveCamera with smooth car follow
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

    // Camera follow settings
    this.followDistance = 8; // Distance behind car
    this.followHeight = 3; // Height above ground
    this.smoothness = 0.1; // Lerp factor (lower = smoother, 0.1 = cinematic lag)

    // Current camera position (for smooth interpolation)
    this.currentPosition = new THREE.Vector3(0, this.followHeight, this.followDistance);
    this.instance.position.copy(this.currentPosition);

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  /**
   * Update camera to follow car smoothly
   * TEMPORARILY DISABLED FOR DEBUGGING - Camera is locked to fixed position
   */
  update() {
    // DEBUGGING MODE: Fixed camera position
    // Camera is locked to verify car rotation visually
    // When A/D is pressed, only the car should rotate, not the camera
    
    // Fixed camera position (looking down at car from above and behind)
    this.instance.position.set(0, 8, 10); // Fixed world position
    this.instance.lookAt(0, 1, 0); // Look at origin (where car starts)
    
    // Original follow logic disabled for debugging:
    /*
    // Wait for car to be initialized
    if (!this.experience.car) return;

    const car = this.experience.car;
    const carPosition = new THREE.Vector3(
      car.body.position.x,
      car.body.position.y,
      car.body.position.z
    );
    const carQuaternion = new THREE.Quaternion(
      car.body.quaternion.x,
      car.body.quaternion.y,
      car.body.quaternion.z,
      car.body.quaternion.w
    );

    // Get car's forward direction in world space (local Z+)
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(carQuaternion);

    // Calculate target position behind the car
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(carPosition);
    targetPosition.sub(forward.multiplyScalar(this.followDistance));
    targetPosition.y = carPosition.y + this.followHeight;

    // Smoothly interpolate camera position (lerp for cinematic lag)
    this.currentPosition.lerp(targetPosition, this.smoothness);
    this.instance.position.copy(this.currentPosition);

    // Look at car (with slight offset for better view)
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.copy(carPosition);
    lookAtTarget.y += 0.5; // Look slightly above car center

    // Smooth lookAt (prevents sudden jumps)
    this.instance.lookAt(lookAtTarget);
    */
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

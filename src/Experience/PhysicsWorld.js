import * as CANNON from 'cannon-es';

/**
 * PhysicsWorld - Manages the cannon-es physics world
 */
export default class PhysicsWorld {
  constructor(experience) {
    this.experience = experience;

    // Create physics world
    this.world = new CANNON.World();

    // Set gravity (negative Y for downward)
    this.world.gravity.set(0, -9.82, 0);

    // Fixed timestep settings
    this.fixedTimeStep = 1 / 60; // 60 FPS
    this.maxSubSteps = 3; // Maximum sub-steps for stability

    // Create ground plane
    this.createGround();

    // Listen for tick events to update physics
    this.experience.time.on('tick', () => {
      this.update();
    });
  }

  /**
   * Create a static ground plane collider
   */
  createGround() {
    // Create ground material with moderate friction
    const groundMaterial = new CANNON.Material('groundMaterial');
    groundMaterial.friction = 0.6; // Moderate friction (reduced to prevent locking)
    groundMaterial.restitution = 0.0; // No bouncing

    // Create ground body
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 }); // mass: 0 = static body
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    groundBody.material = groundMaterial;

    // Add to world
    this.world.addBody(groundBody);
    this.groundBody = groundBody;
    this.groundMaterial = groundMaterial;
  }

  /**
   * Update physics world with fixed timestep
   */
  update() {
    // Convert delta from milliseconds to seconds
    const deltaTime = this.experience.time.delta / 1000;

    // Step physics with fixed timestep
    this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
  }
}

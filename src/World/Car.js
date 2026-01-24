import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Car - Drivable car with physics and keyboard controls
 */
export default class Car {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;
    this.physicsWorld = this.experience.physicsWorld;

    // Car dimensions
    this.width = 1.6;
    this.height = 0.6;
    this.length = 3.5;

    // Car physics properties
    this.mass = 800; // kg
    this.maxSpeed = 25; // m/s
    this.acceleration = 25; // m/s² (increased to overcome static friction)
    this.brakingForce = 20; // m/s²
    this.steeringAngle = 0.3; // radians
    this.steeringSpeed = 2; // radians per second
    this.steeringTorque = 100; // Angular force for steering (increased for better responsiveness)
    this.colliderOffset = 0.1; // Lift collider slightly above ground

    // Current state
    this.currentSteering = 0;
    this.currentSpeed = 0;

    // Keyboard state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Create physics body
    this.createPhysicsBody();

    // Create visual mesh
    this.createMesh();

    // Setup keyboard controls
    this.setupControls();

    // Listen for updates
    this.experience.time.on('tick', () => {
      this.update();
    });
  }

  /**
   * Create physics body for the car
   */
  createPhysicsBody() {
    // Use box shape but lift it slightly to avoid edge collision issues
    // The slight lift prevents the car from getting stuck on ground edges
    const shape = new CANNON.Box(
      new CANNON.Vec3(this.length / 2, this.height / 2, this.width / 2)
    );

    // Create body
    this.body = new CANNON.Body({ mass: this.mass });
    this.body.addShape(shape);

    // Set initial position (lifted slightly above ground to avoid friction locking)
    const groundHeight = this.colliderOffset + this.height / 2;
    this.body.position.set(0, groundHeight, 0);

    // Lock rotation on X and Z axes to prevent tilting/bouncing
    this.body.fixedRotation = false;
    this.body.type = CANNON.Body.DYNAMIC;
    
    // Create car material with moderate friction (reduced to prevent locking)
    this.body.material = new CANNON.Material('carMaterial');
    this.body.material.friction = 0.6; // Moderate friction (reduced from 1.0)
    this.body.material.restitution = 0.0; // No bouncing

    // Create contact material between car and ground
    if (this.physicsWorld.groundMaterial) {
      const contactMaterial = new CANNON.ContactMaterial(
        this.body.material,
        this.physicsWorld.groundMaterial,
        {
          friction: 0.6, // Moderate friction (reduced from 1.0)
          restitution: 0.0,
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 3
        }
      );
      this.physicsWorld.world.addContactMaterial(contactMaterial);
    }

    // Moderate damping (reduced to prevent stalling)
    this.body.linearDamping = 0.3; // Reduced from 0.9
    this.body.angularDamping = 0.5; // Reduced from 0.9

    // Add to physics world
    this.physicsWorld.world.addBody(this.body);
  }

  /**
   * Create visual mesh for the car
   */
  createMesh() {
    // Create geometry
    const geometry = new THREE.BoxGeometry(
      this.length,
      this.height,
      this.width
    );

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      metalness: 0.7,
      roughness: 0.3
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add to scene
    this.scene.instance.add(this.mesh);

    // Create debug arrow helper (points forward)
    const arrowLength = 2;
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), // Forward direction (local Z+)
      new THREE.Vector3(0, this.height / 2 + 0.3, 0), // Position slightly above car center
      arrowLength,
      0xff0000, // Red color
      arrowLength * 0.2, // Head length
      arrowLength * 0.1 // Head width
    );
    
    // Add arrow as child of mesh so it moves and rotates with the car
    this.mesh.add(arrowHelper);
    this.debugArrow = arrowHelper;
  }

  /**
   * Setup keyboard controls
   */
  setupControls() {
    // Key down handler
    window.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.forward = true;
          break;
        case 's':
        case 'arrowdown':
          this.keys.backward = true;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = true;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = true;
          break;
      }
    });

    // Key up handler
    window.addEventListener('keyup', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.forward = false;
          break;
        case 's':
        case 'arrowdown':
          this.keys.backward = false;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = false;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = false;
          break;
      }
    });
  }

  /**
   * Update car physics and visuals
   */
  update() {
    // Get delta time in seconds
    const deltaTime = this.experience.time.delta / 1000;

    // Keep car at proper height above ground (prevent sinking)
    const groundHeight = this.colliderOffset + this.height / 2;
    if (this.body.position.y < groundHeight) {
      this.body.position.y = groundHeight;
    }

    // Prevent vertical velocity accumulation (lock Y velocity)
    const velocity = this.body.velocity;
    if (Math.abs(velocity.y) > 0.01) {
      velocity.y = 0;
      this.body.velocity = velocity;
    }

    // Lock rotation to Y axis only (prevent pitch and roll)
    // IMPORTANT: Only lock X and Z, Y (yaw) must remain free for steering
    const angularVelocity = this.body.angularVelocity;
    angularVelocity.x = 0; // Lock pitch rotation
    angularVelocity.z = 0; // Lock roll rotation
    // DO NOT lock angularVelocity.y - this is needed for steering!
    this.body.angularVelocity = angularVelocity;

    // Get car's forward direction in world space (local Z+)
    const forward = new CANNON.Vec3();
    this.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1), forward);

    // Calculate current speed in forward direction
    this.currentSpeed = forward.dot(velocity);

    // STEERING: Apply yaw rotation DIRECTLY to car physics body
    // A = rotate left (positive Y torque), D = rotate right (negative Y torque)
    // Applied ONLY to car.body - NEVER to camera, scene, or world
    if (this.keys.left) {
      // A key: rotate car left (positive Y torque on car body)
      const leftTorque = this.steeringTorque;
      this.body.applyTorque(new CANNON.Vec3(0, leftTorque, 0));
    } else if (this.keys.right) {
      // D key: rotate car right (negative Y torque on car body)
      const rightTorque = -this.steeringTorque;
      this.body.applyTorque(new CANNON.Vec3(0, rightTorque, 0));
    } else {
      // No steering input: damp angular velocity Y only
      const angularVel = this.body.angularVelocity;
      angularVel.y *= 0.9; // Gentle damping when no steering input
      this.body.angularVelocity = angularVel;
    }

    // Check if any movement input is active
    const hasInput = this.keys.forward || this.keys.backward;

    // Handle acceleration/braking (force along local Z axis)
    if (this.keys.forward) {
      // Accelerate forward (local Z+)
      // Always apply force to overcome static friction, even at max speed
      const forceMagnitude = this.acceleration * this.mass;
      const force = new CANNON.Vec3(0, 0, forceMagnitude);
      this.body.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));
      
      // Limit speed after applying force
      if (this.currentSpeed > this.maxSpeed) {
        const localVelocity = new CANNON.Vec3();
        const invQuat = this.body.quaternion.inverse();
        invQuat.vmult(velocity, localVelocity);
        localVelocity.z = Math.min(localVelocity.z, this.maxSpeed);
        const worldVelocity = new CANNON.Vec3();
        this.body.quaternion.vmult(localVelocity, worldVelocity);
        worldVelocity.y = 0;
        this.body.velocity = worldVelocity;
      }
    } else if (this.keys.backward) {
      // Brake or reverse (local Z-)
      if (this.currentSpeed > -this.maxSpeed * 0.5) {
        const force = new CANNON.Vec3(0, 0, -this.brakingForce * this.mass);
        this.body.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));
      }
    }

    // Strict idle stabilization when no input
    if (!hasInput) {
      // Get local velocity
      const localVelocity = new CANNON.Vec3();
      const invQuat = this.body.quaternion.inverse();
      invQuat.vmult(velocity, localVelocity);
      
      // Aggressively damp all horizontal velocity toward zero
      const dampingFactor = 0.85; // Strong damping (15% reduction per frame)
      localVelocity.x *= dampingFactor;
      localVelocity.z *= dampingFactor;
      
      // Clamp very small velocities to zero (prevent micro-movements)
      const velocityThreshold = 0.05; // m/s
      if (Math.abs(localVelocity.x) < velocityThreshold) {
        localVelocity.x = 0;
      }
      if (Math.abs(localVelocity.z) < velocityThreshold) {
        localVelocity.z = 0;
      }
      
      // Convert back to world space
      const worldVelocity = new CANNON.Vec3();
      this.body.quaternion.vmult(localVelocity, worldVelocity);
      worldVelocity.y = 0; // Keep Y locked
      this.body.velocity = worldVelocity;
      
      // Temporarily increase linear damping when idle for extra stability
      this.body.linearDamping = 0.8; // High damping when idle
    } else {
      // Restore normal damping when input is active
      this.body.linearDamping = 0.3;
    }

    // Speed limiting is now handled in forward/backward sections above
    // This ensures forces are always applied to overcome static friction

    // Sync mesh with physics body (perfect alignment)
    // This ensures the car mesh and its arrow helper rotate with the physics body
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    // CRITICAL: Sync quaternion from physics body to mesh
    // This makes the car visually rotate when steering is applied
    this.mesh.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w
    );
    // Arrow helper is a child of mesh, so it rotates automatically
  }
}

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
    this.colliderOffset = 0.1; // Lift collider slightly above ground

    // Current state
    this.currentSpeed = 0;

    // Keyboard state (only forward/backward)
    this.keys = {
      forward: false,
      backward: false
    };

    // Auto-navigation state
    this.isNavigating = false;
    this.navigationTarget = null;
    this.navigationArrivalDistance = 2; // Distance threshold for arrival

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
   * Navigate car to a specific world position (smooth movement)
   * @param {THREE.Vector3} targetPosition - Target world position
   */
  navigateTo(targetPosition) {
    // Convert THREE.Vector3 to CANNON.Vec3 (account for collider offset)
    this.navigationTarget = new CANNON.Vec3(
      targetPosition.x,
      targetPosition.y + this.colliderOffset + this.height / 2,
      targetPosition.z
    );

    // Enable auto-navigation (disables keyboard controls)
    this.isNavigating = true;
  }

  /**
   * Teleport car to a specific world position (instant)
   * @param {THREE.Vector3} targetPosition - Target world position
   */
  teleport(targetPosition) {
    // Convert THREE.Vector3 to CANNON.Vec3
    const cannonPosition = new CANNON.Vec3(
      targetPosition.x,
      targetPosition.y + this.colliderOffset + this.height / 2, // Account for collider offset
      targetPosition.z
    );

    // Set physics body position
    this.body.position.copy(cannonPosition);

    // Reset all velocities (stop movement)
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);

    // Reset rotation (face forward - Z+ direction)
    const forwardRotation = new CANNON.Quaternion();
    forwardRotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
    this.body.quaternion = forwardRotation;

    // Reset speed state
    this.currentSpeed = 0;

    // Sync mesh immediately
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    this.mesh.quaternion.set(0, 0, 0, 1);

    // Disable navigation
    this.isNavigating = false;
    this.navigationTarget = null;
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

    // Create material - distinct bright color
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3366, // Bright red/pink for visibility
      metalness: 0.5,
      roughness: 0.4
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
   * Setup keyboard controls (forward/backward only)
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

    // Lock ALL rotation (prevent any rotation - timeline movement only)
    const angularVelocity = this.body.angularVelocity;
    angularVelocity.x = 0; // Lock pitch rotation
    angularVelocity.y = 0; // Lock yaw rotation (no steering)
    angularVelocity.z = 0; // Lock roll rotation
    this.body.angularVelocity = angularVelocity;
    
    // Lock rotation quaternion to initial orientation
    // Keep car facing forward (Z+ direction) at all times
    const initialRotation = new CANNON.Quaternion();
    initialRotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0); // No rotation
    this.body.quaternion = initialRotation;

    // Get car's forward direction (always Z+ in world space - no rotation)
    const forward = new CANNON.Vec3(0, 0, 1);

    // Calculate current speed in forward direction (Z axis)
    this.currentSpeed = velocity.z;

    // Prevent sideways drift - lock X velocity (lateral movement)
    const lockedVelocity = new CANNON.Vec3(0, 0, velocity.z);
    lockedVelocity.y = 0; // Also lock Y velocity
    this.body.velocity = lockedVelocity;

    // Handle auto-navigation
    if (this.isNavigating && this.navigationTarget) {
      const currentPos = this.body.position;
      const targetPos = this.navigationTarget;
      
      // Calculate distance to target
      const distance = currentPos.distanceTo(targetPos);
      
      // Check if arrived
      if (distance < this.navigationArrivalDistance) {
        // Arrived - stop navigation and re-enable controls
        this.isNavigating = false;
        this.navigationTarget = null;
        this.body.velocity.set(0, 0, 0);
        this.currentSpeed = 0;
      } else {
        // Navigate towards target
        const direction = new CANNON.Vec3();
        targetPos.vsub(currentPos, direction);
        direction.normalize();
        
        // Apply force towards target (only Z axis movement)
        const targetZ = targetPos.z;
        const currentZ = currentPos.z;
        const zDistance = targetZ - currentZ;
        
        if (Math.abs(zDistance) > 0.5) {
          // Move forward or backward based on Z distance
          const navigationSpeed = 15; // Navigation speed
          const forceMagnitude = navigationSpeed * this.mass;
          const force = new CANNON.Vec3(0, 0, zDistance > 0 ? forceMagnitude : -forceMagnitude);
          this.body.applyForce(force, this.body.position);
        } else {
          // Close enough on Z axis, stop
          this.isNavigating = false;
          this.navigationTarget = null;
          this.body.velocity.set(0, 0, 0);
          this.currentSpeed = 0;
        }
      }
      
      // Skip keyboard input during navigation
      return;
    }

    // Check if any movement input is active
    const hasInput = this.keys.forward || this.keys.backward;

    // Handle acceleration/braking (force along world Z axis only)
    if (this.keys.forward) {
      // Accelerate forward (world Z+)
      // Always apply force to overcome static friction, even at max speed
      const forceMagnitude = this.acceleration * this.mass;
      const force = new CANNON.Vec3(0, 0, forceMagnitude);
      this.body.applyForce(force, this.body.position);
      
      // Limit speed after applying force
      if (this.currentSpeed > this.maxSpeed) {
        const lockedVel = new CANNON.Vec3(0, 0, this.maxSpeed);
        this.body.velocity = lockedVel;
      }
    } else if (this.keys.backward) {
      // Brake or reverse (world Z-)
      if (this.currentSpeed > -this.maxSpeed * 0.5) {
        const force = new CANNON.Vec3(0, 0, -this.brakingForce * this.mass);
        this.body.applyForce(force, this.body.position);
      }
    }

    // Strict idle stabilization when no input (skip during navigation)
    if (!hasInput && !this.isNavigating) {
      // Aggressively damp Z velocity toward zero
      const dampingFactor = 0.85; // Strong damping (15% reduction per frame)
      const dampedZ = velocity.z * dampingFactor;
      
      // Clamp very small velocities to zero (prevent micro-movements)
      const velocityThreshold = 0.05; // m/s
      const finalZ = Math.abs(dampedZ) < velocityThreshold ? 0 : dampedZ;
      
      // Lock velocity to Z axis only (no X or Y)
      const worldVelocity = new CANNON.Vec3(0, 0, finalZ);
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
    // Car orientation is locked - always facing forward (Z+)
    // No rotation sync needed since car never rotates
    this.mesh.quaternion.set(0, 0, 0, 1); // Identity quaternion (no rotation)
    // Arrow helper is a child of mesh, so it stays aligned forward
  }
}

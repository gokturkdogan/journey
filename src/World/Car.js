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
    this.acceleration = 15; // m/s²
    this.brakingForce = 20; // m/s²
    this.steeringAngle = 0.3; // radians
    this.steeringSpeed = 2; // radians per second

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
    // Create box shape
    const shape = new CANNON.Box(
      new CANNON.Vec3(this.length / 2, this.height / 2, this.width / 2)
    );

    // Create body
    this.body = new CANNON.Body({ mass: this.mass });
    this.body.addShape(shape);

    // Set initial position (above ground)
    this.body.position.set(0, 1, 0);

    // Add damping to prevent sliding
    this.body.linearDamping = 0.4; // Linear velocity damping
    this.body.angularDamping = 0.4; // Angular velocity damping

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

    // Handle steering
    if (this.keys.left) {
      this.currentSteering = Math.min(
        this.currentSteering + this.steeringSpeed * deltaTime,
        this.steeringAngle
      );
    } else if (this.keys.right) {
      this.currentSteering = Math.max(
        this.currentSteering - this.steeringSpeed * deltaTime,
        -this.steeringAngle
      );
    } else {
      // Return steering to center
      if (this.currentSteering > 0) {
        this.currentSteering = Math.max(
          this.currentSteering - this.steeringSpeed * deltaTime,
          0
        );
      } else if (this.currentSteering < 0) {
        this.currentSteering = Math.min(
          this.currentSteering + this.steeringSpeed * deltaTime,
          0
        );
      }
    }

    // Get car's forward direction in world space (for speed calculation)
    const forward = new CANNON.Vec3();
    this.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1), forward);

    // Calculate current speed in forward direction
    const velocity = this.body.velocity;
    this.currentSpeed = forward.dot(velocity);

    // Handle acceleration/braking (using local coordinates)
    if (this.keys.forward) {
      // Accelerate forward (local Z+)
      if (this.currentSpeed < this.maxSpeed) {
        this.body.applyLocalForce(
          new CANNON.Vec3(0, 0, this.acceleration * this.mass),
          new CANNON.Vec3(0, 0, 0)
        );
      }
    } else if (this.keys.backward) {
      // Brake or reverse (local Z-)
      if (this.currentSpeed > -this.maxSpeed * 0.5) {
        this.body.applyLocalForce(
          new CANNON.Vec3(0, 0, -this.brakingForce * this.mass),
          new CANNON.Vec3(0, 0, 0)
        );
      }
    } else {
      // Apply braking when no input (natural deceleration)
      this.body.applyLocalForce(
        new CANNON.Vec3(0, 0, -this.brakingForce * 0.3 * this.mass),
        new CANNON.Vec3(0, 0, 0)
      );
    }

    // Apply steering (only when moving) - local X axis
    if (Math.abs(this.currentSpeed) > 0.1) {
      this.body.applyLocalForce(
        new CANNON.Vec3(
          this.currentSteering * Math.abs(this.currentSpeed) * this.mass * 0.5,
          0,
          0
        ),
        new CANNON.Vec3(0, 0, 0)
      );
    }

    // Limit speed
    const speed = velocity.length();
    if (speed > this.maxSpeed) {
      velocity.scale(this.maxSpeed / speed);
      this.body.velocity = velocity;
    }

    // Sync mesh with physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}

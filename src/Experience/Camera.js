import * as THREE from 'three';

/**
 * Camera - Manages the PerspectiveCamera with CameraRig third-person follow
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
    this.followDistance = 12; // Distance from car (increased for overview)
    this.followHeight = 5; // Height above ground (increased for elevation)
    this.rigSmoothness = 0.1; // Lerp factor for CameraRig position (lower = smoother)

    // Mouse orbit control settings
    // Initial cinematic overview: left side, elevated, diagonal angle
    this.orbitYaw = -Math.PI / 2; // Horizontal rotation - left side of car (45 degrees)
    this.orbitPitch = Math.PI / 1.2; // Vertical rotation - elevated angle (30 degrees up)
    this.orbitSensitivity = 0.003; // Mouse sensitivity
    this.pitchMin = -Math.PI / 3; // Limit looking down (60 degrees)
    this.pitchMax = Math.PI / 3; // Limit looking up (60 degrees)

    // Mouse drag state
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Create CameraRig (Object3D that follows car)
    this.rig = new THREE.Object3D();
    this.scene = this.experience.scene;
    this.scene.instance.add(this.rig);

    // Add camera to rig (camera is child of rig, not car)
    this.rig.add(this.instance);

    // Set camera offset (will be adjusted by orbit angles)
    // Initial offset is neutral, orbit angles will position it
    this.instance.position.set(0, 0, 0);

    // Current rig position (for smooth interpolation)
    // Initialize to a cinematic overview position (left, elevated)
    this.currentRigPosition = new THREE.Vector3(-5, 5, 5);

    // Setup mouse controls
    this.setupMouseControls();

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  /**
   * Setup mouse drag controls for camera orbit
   */
  setupMouseControls() {
    // Mouse down - start dragging
    window.addEventListener('mousedown', (event) => {
      this.isDragging = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    });

    // Mouse move - rotate camera
    window.addEventListener('mousemove', (event) => {
      if (!this.isDragging) return;

      // Calculate mouse delta
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      // Update orbit angles
      this.orbitYaw -= deltaX * this.orbitSensitivity; // Horizontal rotation (yaw)
      this.orbitPitch -= deltaY * this.orbitSensitivity; // Vertical rotation (pitch)

      // Clamp pitch to prevent flipping
      this.orbitPitch = Math.max(this.pitchMin, Math.min(this.pitchMax, this.orbitPitch));

      // Update last mouse position
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    });

    // Mouse up - stop dragging
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mouse leave - stop dragging
    window.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }

  /**
   * Update camera rig to follow car smoothly with orbit control
   */
  update() {
    // Wait for car to be initialized
    if (!this.experience.car) return;

    const car = this.experience.car;
    const carPosition = new THREE.Vector3(
      car.body.position.x,
      car.body.position.y,
      car.body.position.z
    );

    // Calculate orbit position around car using spherical coordinates
    // Yaw: horizontal rotation around Y axis
    // Pitch: vertical rotation (tilt up/down)
    const orbitDistance = this.followDistance;
    
    // Spherical to Cartesian conversion
    const x = orbitDistance * Math.cos(this.orbitPitch) * Math.sin(this.orbitYaw);
    const y = orbitDistance * Math.sin(this.orbitPitch);
    const z = orbitDistance * Math.cos(this.orbitPitch) * Math.cos(this.orbitYaw);

    // Calculate target rig position (orbiting around car)
    // Positioned to the left, elevated, at diagonal angle
    const targetRigPosition = new THREE.Vector3();
    targetRigPosition.copy(carPosition);
    targetRigPosition.x += x;
    targetRigPosition.y += this.followHeight + y; // Add pitch offset and base height
    targetRigPosition.z += z;
    
    // Ensure camera doesn't clip through ground (minimum height)
    const minHeight = 2;
    if (targetRigPosition.y < minHeight) {
      targetRigPosition.y = minHeight;
    }

    // Smoothly interpolate rig position (lerp for cinematic lag)
    // If car just teleported, snap camera immediately
    const distance = this.currentRigPosition.distanceTo(targetRigPosition);
    if (distance > 20) {
      // Large distance change indicates teleport - snap immediately
      this.currentRigPosition.copy(targetRigPosition);
    } else {
      // Normal smooth interpolation
      this.currentRigPosition.lerp(targetRigPosition, this.rigSmoothness);
    }
    this.rig.position.copy(this.currentRigPosition);

    // Camera looks at the car and timeline road
    // Look slightly ahead along the road for better overview
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.copy(carPosition);
    lookAtTarget.z += 10; // Look ahead along the timeline road
    lookAtTarget.y += 0.5; // Look slightly above car center
    this.instance.lookAt(lookAtTarget);
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

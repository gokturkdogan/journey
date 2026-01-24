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
    this.followDistance = 8; // Distance behind car
    this.followHeight = 3; // Height above ground
    this.rigSmoothness = 0.1; // Lerp factor for CameraRig position (lower = smoother)

    // Mouse orbit control settings
    this.orbitYaw = 0; // Horizontal rotation (Y axis)
    this.orbitPitch = 0.3; // Vertical rotation (X axis) - start slightly above
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

    // Set camera offset (behind and above the rig position)
    this.instance.position.set(0, this.followHeight, this.followDistance);

    // Current rig position (for smooth interpolation)
    this.currentRigPosition = new THREE.Vector3(0, 0, 0);

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

    // Calculate orbit position around car using yaw and pitch
    const orbitDistance = this.followDistance;
    const orbitX = Math.sin(this.orbitPitch) * orbitDistance;
    const orbitY = Math.cos(this.orbitPitch) * orbitDistance;
    const orbitZ = Math.cos(this.orbitYaw) * orbitY;
    const orbitXOffset = Math.sin(this.orbitYaw) * orbitY;

    // Calculate target rig position (orbiting around car)
    const targetRigPosition = new THREE.Vector3();
    targetRigPosition.copy(carPosition);
    targetRigPosition.x += orbitXOffset;
    targetRigPosition.y += this.followHeight + orbitX; // Add pitch offset
    targetRigPosition.z += orbitZ;

    // Smoothly interpolate rig position (lerp for cinematic lag)
    this.currentRigPosition.lerp(targetRigPosition, this.rigSmoothness);
    this.rig.position.copy(this.currentRigPosition);

    // Camera always looks at the car
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.copy(carPosition);
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

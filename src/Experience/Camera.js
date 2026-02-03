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

    // Camera orbit angles (script-controlled only)
    // Initial cinematic overview: left side, elevated, diagonal angle
    this.orbitYaw = -Math.PI / 2; // Horizontal rotation - left side of car
    this.orbitPitch = Math.PI / 1.2; // Vertical rotation - elevated angle

    // Initial camera angles (for reset when exiting memory zone)
    this.initialYaw = -Math.PI / 2;
    this.initialPitch = Math.PI / 1.2;

    // Target camera angles (for smooth interpolation)
    this.targetYaw = this.initialYaw;
    this.targetPitch = this.initialPitch;

    // Memory zone camera angles
    this.zoneYaw = -Math.PI / 1.5;
    this.zonePitch = Math.PI / 0.9;

    // Camera transition settings
    this.angleLerpSpeed = 0.05; // Lerp speed for angle transitions
    this.memoryZoneRadius = 15; // Memory zone detection radius

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

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.resize();
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

    // Check if car is in memory zone
    let isInMemoryZone = false;
    if (this.experience.world && this.experience.world.memoryLandmarks) {
      this.experience.world.memoryLandmarks.forEach((landmark) => {
        const distance = carPosition.distanceTo(landmark.position);
        if (distance < this.memoryZoneRadius) {
          isInMemoryZone = true;
        }
      });
    }

    // Update target angles based on zone state
    if (isInMemoryZone) {
      this.targetYaw = this.zoneYaw;
      this.targetPitch = this.zonePitch;
    } else {
      this.targetYaw = this.initialYaw;
      this.targetPitch = this.initialPitch;
    }

    // Smoothly interpolate current angles to target angles
    this.orbitYaw = THREE.MathUtils.lerp(this.orbitYaw, this.targetYaw, this.angleLerpSpeed);
    this.orbitPitch = THREE.MathUtils.lerp(this.orbitPitch, this.targetPitch, this.angleLerpSpeed);

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

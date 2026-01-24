import * as THREE from 'three';

/**
 * World - Manages the explorable world with road and story zones
 */
export default class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;

    // Create world elements
    this.createGround();
    this.createRoad();
    this.createZones();
  }

  /**
   * Create large ground plane
   */
  createGround() {
    const groundSize = 200;
    
    // Create grid helper for reference
    const gridHelper = new THREE.GridHelper(groundSize, 50, 0x333333, 0x222222);
    gridHelper.position.y = 0;
    this.scene.instance.add(gridHelper);

    // Create ground plane mesh
    const planeGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    this.scene.instance.add(plane);
  }

  /**
   * Create visible road/path that guides forward
   */
  createRoad() {
    const roadWidth = 8;
    const roadLength = 150;
    
    // Create road plane
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.2
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, roadLength / 2); // Slightly above ground
    road.receiveShadow = true;
    this.scene.instance.add(road);

    // Add road markings (center line)
    const markingGeometry = new THREE.PlaneGeometry(0.2, roadLength);
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.3
    });
    const centerLine = new THREE.Mesh(markingGeometry, markingMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.02, roadLength / 2);
    this.scene.instance.add(centerLine);
  }

  /**
   * Create story zones along the road
   */
  createZones() {
    // Zone 1: Start / Introduction (at origin)
    this.createZone1();

    // Zone 2: Photo Gallery area (further along road)
    this.createZone2();

    // Zone 3: Memory / Story moment (even further)
    this.createZone3();

    // Zone 4: Ending / Future area (end of road)
    this.createZone4();
  }

  /**
   * Zone 1: Start / Introduction
   */
  createZone1() {
    const zone1Group = new THREE.Group();
    zone1Group.position.set(0, 0, 0);

    // Main structure - large box (start platform)
    const boxGeometry = new THREE.BoxGeometry(12, 2, 12);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.3,
      roughness: 0.7
    });
    const startBox = new THREE.Mesh(boxGeometry, boxMaterial);
    startBox.position.y = 1;
    startBox.castShadow = true;
    startBox.receiveShadow = true;
    zone1Group.add(startBox);

    // Marker cylinder on top
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0x5ba3f5,
      metalness: 0.5,
      roughness: 0.5
    });
    const marker = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    marker.position.y = 3.5;
    marker.castShadow = true;
    zone1Group.add(marker);

    this.scene.instance.add(zone1Group);
  }

  /**
   * Zone 2: Photo Gallery area
   */
  createZone2() {
    const zone2Group = new THREE.Group();
    zone2Group.position.set(0, 0, 40);

    // Main structure - wide platform
    const platformGeometry = new THREE.BoxGeometry(15, 1, 15);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xe24a4a,
      metalness: 0.2,
      roughness: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.5;
    platform.castShadow = true;
    platform.receiveShadow = true;
    zone2Group.add(platform);

    // Photo frames (vertical planes)
    for (let i = 0; i < 4; i++) {
      const frameGeometry = new THREE.PlaneGeometry(3, 4);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5a35b,
        side: THREE.DoubleSide,
        metalness: 0.4,
        roughness: 0.6
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      const angle = (i / 4) * Math.PI * 2;
      frame.position.set(
        Math.cos(angle) * 5,
        2.5,
        Math.sin(angle) * 5
      );
      frame.rotation.y = angle + Math.PI;
      frame.castShadow = true;
      zone2Group.add(frame);
    }

    this.scene.instance.add(zone2Group);
  }

  /**
   * Zone 3: Memory / Story moment
   */
  createZone3() {
    const zone3Group = new THREE.Group();
    zone3Group.position.set(0, 0, 80);

    // Main structure - elevated platform
    const baseGeometry = new THREE.BoxGeometry(10, 1, 10);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4ae24a,
      metalness: 0.3,
      roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    zone3Group.add(base);

    // Memory monument - tall cylinder
    const monumentGeometry = new THREE.CylinderGeometry(1.5, 2, 6, 8);
    const monumentMaterial = new THREE.MeshStandardMaterial({
      color: 0x5bf5a3,
      metalness: 0.4,
      roughness: 0.6
    });
    const monument = new THREE.Mesh(monumentGeometry, monumentMaterial);
    monument.position.y = 4;
    monument.castShadow = true;
    zone3Group.add(monument);

    // Surrounding boxes (memories)
    for (let i = 0; i < 6; i++) {
      const memoryBoxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const memoryBoxMaterial = new THREE.MeshStandardMaterial({
        color: 0xa3f55b,
        metalness: 0.2,
        roughness: 0.8
      });
      const memoryBox = new THREE.Mesh(memoryBoxGeometry, memoryBoxMaterial);
      const angle = (i / 6) * Math.PI * 2;
      memoryBox.position.set(
        Math.cos(angle) * 4,
        1.25,
        Math.sin(angle) * 4
      );
      memoryBox.castShadow = true;
      memoryBox.receiveShadow = true;
      zone3Group.add(memoryBox);
    }

    this.scene.instance.add(zone3Group);
  }

  /**
   * Zone 4: Ending / Future area
   */
  createZone4() {
    const zone4Group = new THREE.Group();
    zone4Group.position.set(0, 0, 120);

    // Main structure - large platform
    const endPlatformGeometry = new THREE.BoxGeometry(18, 2, 18);
    const endPlatformMaterial = new THREE.MeshStandardMaterial({
      color: 0xe24ae2,
      metalness: 0.4,
      roughness: 0.6
    });
    const endPlatform = new THREE.Mesh(endPlatformGeometry, endPlatformMaterial);
    endPlatform.position.y = 1;
    endPlatform.castShadow = true;
    endPlatform.receiveShadow = true;
    zone4Group.add(endPlatform);

    // Future structure - tall box tower
    const towerGeometry = new THREE.BoxGeometry(4, 8, 4);
    const towerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf55ba3,
      metalness: 0.5,
      roughness: 0.5
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 5;
    tower.castShadow = true;
    zone4Group.add(tower);

    // Surrounding pillars
    for (let i = 0; i < 8; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 8);
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0xa35bf5,
        metalness: 0.3,
        roughness: 0.7
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      const angle = (i / 8) * Math.PI * 2;
      pillar.position.set(
        Math.cos(angle) * 7,
        3.5,
        Math.sin(angle) * 7
      );
      pillar.castShadow = true;
      zone4Group.add(pillar);
    }

    this.scene.instance.add(zone4Group);
  }
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * World - Manages the timeline-style world with long straight road
 */
export default class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;

    // Timeline dimensions
    this.timelineLength = 500; // Long timeline road
    this.roadWidth = 10; // Road width
    this.groundWidth = 30; // Ground extends beyond road

    // Texture loader for cover images
    this.textureLoader = new THREE.TextureLoader();

    // Create world elements
    this.createGround();
    this.createRoadEdges();
    this.createMemoryLandmarks();
    this.createHouses();

    // Proximity feedback settings
    this.proximityRadius = 15; // Detection radius
    this.currentHighlightedLandmark = null; // Only one highlighted at a time
    this.highlightIntensity = 0; // Current highlight intensity (0-1)
    this.highlightSpeed = 0.05; // Lerp speed for smooth transitions

    // Memory detail view state
    this.activeDetailView = null;
    this.detailViewGroup = null;
    this.galleryBillboard = null;
    this.galleryCurrentIndex = 0;
    this.openButton = null;
    this.closeButton = null;
    this.prevButton = null;
    this.nextButton = null;
    this.hiddenObjects = [];
    this.detailOpen = false;
    this.detailTransitionProgress = 0;
    this.detailStartPos = new THREE.Vector3();
    this.detailEndPos = new THREE.Vector3();
    this.detailLerpSpeed = 0.08;

    // Raycaster for UI interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupRaycaster();

    // Listen for updates to check proximity
    this.experience.time.on('tick', () => {
      this.update();
    });
  }

  /**
   * Create long ground plane for timeline
   */
  createGround() {
    // Create ground plane (long and narrow, like a timeline)
    const groundGeometry = new THREE.PlaneGeometry(
      this.groundWidth,
      this.timelineLength
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a, // Slightly lighter gray with muted blue tint
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, this.timelineLength / 2);
    ground.receiveShadow = true;
    this.scene.instance.add(ground);
  }


  /**
   * Create road edges/boundaries
   */
  createRoadEdges() {
    const edgeHeight = 0.1;
    const edgeWidth = 0.3;

    // Left edge
    const leftEdgeGeometry = new THREE.BoxGeometry(
      edgeWidth,
      edgeHeight,
      this.timelineLength
    );
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    });
    const leftEdge = new THREE.Mesh(leftEdgeGeometry, edgeMaterial);
    leftEdge.position.set(
      -this.roadWidth / 2 - edgeWidth / 2,
      edgeHeight / 2,
      this.timelineLength / 2
    );
    leftEdge.castShadow = true;
    leftEdge.receiveShadow = true;
    this.scene.instance.add(leftEdge);

    // Right edge
    const rightEdge = new THREE.Mesh(leftEdgeGeometry, edgeMaterial);
    rightEdge.position.set(
      this.roadWidth / 2 + edgeWidth / 2,
      edgeHeight / 2,
      this.timelineLength / 2
    );
    rightEdge.castShadow = true;
    rightEdge.receiveShadow = true;
    this.scene.instance.add(rightEdge);
  }

  /**
   * Create houses along the road
   */
  createHouses() {
    const loader = new GLTFLoader();
    const modelPath = new URL('../assets/models/house.glb', import.meta.url).href;
    
    loader.load(
      modelPath,
      (gltf) => {
        const originalHouse = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(originalHouse);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        originalHouse.position.x = -center.x;
        originalHouse.position.y = -center.y;
        originalHouse.position.z = -center.z;
        
        originalHouse.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        const memories = this.experience.memoryManager.getMemoriesInOrder();
        
        memories.forEach((memory) => {
          const landmark = this.memoryLandmarks.find(l => l.memoryId === memory.id);
          if (landmark) {
            const buildingMesh = landmark.group.getObjectByName('buildingMesh');
            if (buildingMesh) {
              const house = originalHouse.clone();
              house.position.copy(landmark.position);
              house.position.y = 0;
              house.rotation.y = Math.PI / 2;
              house.scale.set(1, 1, 1);
              
              buildingMesh.visible = false;
              this.scene.instance.add(house);
            }
          }
        });
      },
      undefined,
      (error) => {
        console.error('House model yüklenemedi:', error);
      }
    );
  }

  /**
   * Create memory landmarks along the timeline road
   */
  createMemoryLandmarks() {
    // Get memory data from MemoryManager
    const memories = this.experience.memoryManager.getMemoriesInOrder();

    // Store landmark references for proximity detection (only real memories)
    this.memoryLandmarks = [];
    
    // Left side X position for real memories
    const leftSideX = -6;
    
    memories.forEach((memory) => {
      // Create REAL memory on left side (X < 0)
      const memoryGroup = this.createMemoryPrefab(memory, leftSideX);
      const openButton = this.createOpenButton(memoryGroup, memory);
      const memoryLandmark = {
        group: memoryGroup,
        structure: memoryGroup.getObjectByName('buildingMesh'),
        structureMaterial: memoryGroup.getObjectByName('buildingMesh').material,
        position: new THREE.Vector3(leftSideX, 0, memory.zPosition),
        originalScale: 1,
        originalEmissive: new THREE.Color(0x000000),
        originalColor: memoryGroup.getObjectByName('buildingMesh').material.color.clone(),
        highlightIntensity: 0,
        memoryId: memory.id,
        isMemory: true,
        openButton: openButton
      };
      this.memoryLandmarks.push(memoryLandmark);
    });
  }

  /**
   * Create text texture from canvas
   * @param {string} text - Text to render
   * @param {number} fontSize - Font size in pixels
   * @param {string} backgroundColor - Background color hex
   * @param {string} textColor - Text color hex
   * @returns {THREE.CanvasTexture} Canvas texture
   */
  createTextTexture(text, fontSize = 32, backgroundColor = '#ffffff', textColor = '#000000') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    context.font = `bold ${fontSize}px Arial`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    canvas.width = textWidth + 40;
    canvas.height = textHeight + 20;
    
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = textColor;
    context.font = `bold ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Create memory prefab group
   * @param {Object} memory - Memory data object
   * @param {number} xPosition - X position (right side > 0)
   * @returns {THREE.Group} Memory group
   */
  createMemoryPrefab(memory, xPosition) {
    const memoryGroup = new THREE.Group();
    memoryGroup.name = `memory-${memory.id}`;
    memoryGroup.position.set(xPosition, 0, memory.zPosition);
    memoryGroup.userData.isMemory = true;
    memoryGroup.userData.memoryId = memory.id;

    // Yerleşim offset değerleri (X ekseni boyunca)
    const OFFSET_DATE_SIGN = 0;
    const OFFSET_BUILDING = 3;
    const OFFSET_TITLE_SIGN = 7;
    const OFFSET_BILLBOARD = 11;

    // 1) Date sign (küçük sokak tabelası - MEMORY TARİHİ)
    const dateSignWidth = 1.5;
    const dateSignHeight = 0.4;
    const dateSignGeometry = new THREE.PlaneGeometry(dateSignWidth, dateSignHeight);
    const dateTexture = this.createTextTexture(memory.date, 16, '#f0f0f0', '#333333');
    const dateSignMaterial = new THREE.MeshStandardMaterial({
      map: dateTexture,
      side: THREE.DoubleSide
    });
    const dateSignMesh = new THREE.Mesh(dateSignGeometry, dateSignMaterial);
    dateSignMesh.name = 'dateSignMesh';
    dateSignMesh.position.set(OFFSET_DATE_SIGN, dateSignHeight / 2, 0);
    dateSignMesh.rotation.y = Math.PI;
    dateSignMesh.castShadow = true;
    memoryGroup.add(dateSignMesh);

    // 2) Building (ana yapı - EV / BİNA)
    const buildingWidth = 3;
    const buildingHeight = 4;
    const buildingDepth = 3;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      roughness: 0.7,
      metalness: 0.2
    });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.name = 'buildingMesh';
    buildingMesh.position.set(OFFSET_BUILDING, buildingHeight / 2, 0);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    memoryGroup.add(buildingMesh);

    // 3) Title sign (sokak tabelası - MEMORY İSMİ)
    const titleSignWidth = 2.5;
    const titleSignHeight = 0.8;
    const titleSignGeometry = new THREE.PlaneGeometry(titleSignWidth, titleSignHeight);
    const titleTexture = this.createTextTexture(memory.title, 24, '#ffffff', '#000000');
    const titleSignMaterial = new THREE.MeshStandardMaterial({
      map: titleTexture,
      side: THREE.DoubleSide
    });
    const titleSignMesh = new THREE.Mesh(titleSignGeometry, titleSignMaterial);
    titleSignMesh.name = 'titleSignMesh';
    titleSignMesh.position.set(OFFSET_TITLE_SIGN, titleSignHeight / 2, 0);
    titleSignMesh.rotation.y = Math.PI;
    titleSignMesh.castShadow = true;
    memoryGroup.add(titleSignMesh);

    // 4) Billboard (reklam billboard'u - KAPAK FOTOĞRAFI)
    const baseBillboardWidth = 2.5;
    const baseBillboardHeight = 2;
    const billboardGeometry = new THREE.PlaneGeometry(baseBillboardWidth, baseBillboardHeight);
    const billboardMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide
    });
    const billboardMesh = new THREE.Mesh(billboardGeometry, billboardMaterial);
    billboardMesh.name = 'billboardMesh';
    billboardMesh.position.set(OFFSET_BILLBOARD, 1.5, 0);
    billboardMesh.rotation.y = Math.PI;
    billboardMesh.castShadow = true;
    memoryGroup.add(billboardMesh);

    const imagePath = memory.coverImage.startsWith('/') 
      ? memory.coverImage 
      : new URL(`../assets/images/${memory.coverImage}`, import.meta.url).href;
    
    const coverTexture = this.textureLoader.load(
      imagePath,
      (texture) => {
        const image = texture.image;
        const aspectRatio = image.width / image.height;
        const targetHeight = 4;
        const targetWidth = targetHeight * aspectRatio;
        billboardMesh.scale.set(targetWidth / baseBillboardWidth, targetHeight / baseBillboardHeight, 1);
        billboardMaterial.map = texture;
        billboardMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn(`Cover image yüklenemedi: ${memory.coverImage}`, error);
      }
    );

    memoryGroup.rotation.y = Math.PI / 2 + Math.PI;

    this.scene.instance.add(memoryGroup);
    return memoryGroup;
  }

  /**
   * Create decorative copy (building only, no signs/billboard)
   * @param {Object} memory - Memory data object
   * @param {number} xPosition - X position (left side < 0)
   */
  createDecorativeCopy(memory, xPosition) {
    const decorativeGroup = new THREE.Group();
    decorativeGroup.position.set(xPosition, 0, memory.zPosition);
    decorativeGroup.userData.isDecorative = true;
    decorativeGroup.userData.isMemory = false;

    // Only building, no signs or billboard
    const buildingWidth = 3;
    const buildingHeight = 4;
    const buildingDepth = 3;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.7,
      metalness: 0.2
    });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.y = buildingHeight / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    decorativeGroup.add(buildingMesh);

    decorativeGroup.rotation.y = Math.PI / 2 + Math.PI;

    this.scene.instance.add(decorativeGroup);
  }

  
  /**
   * Setup raycaster for UI interactions
   */
  setupRaycaster() {
    window.addEventListener('click', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
      const intersects = this.raycaster.intersectObjects(this.scene.instance.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.isOpenButton) {
          this.openDetailView(object.userData.memoryId);
        } else if (object.userData.isCloseButton) {
          this.closeDetailView();
        } else if (object.userData.isPrevButton) {
          this.prevGalleryImage();
        } else if (object.userData.isNextButton) {
          this.nextGalleryImage();
        }
      }
    });
  }

  /**
   * Create open detail button
   */
  createOpenButton(memoryGroup, memory) {
    const buttonGeometry = new THREE.PlaneGeometry(1, 1);
    const buttonMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
    button.name = 'openButton';
    button.position.set(2, 5, 0);
    button.userData.isOpenButton = true;
    button.userData.memoryId = memory.id;
    button.visible = false;
    memoryGroup.add(button);
    return button;
  }

  /**
   * Open detail view
   */
  openDetailView(memoryId) {
    const memory = this.experience.memoryManager.getMemoryById(memoryId);
    if (!memory || !memory.gallery || memory.gallery.length === 0) return;

    const landmark = this.memoryLandmarks.find(l => l.memoryId === memoryId);
    if (!landmark) return;

    this.activeDetailView = memoryId;
    this.galleryCurrentIndex = 0;
    this.hiddenObjects = [];

    this.memoryLandmarks.forEach((l) => {
      if (l.openButton) {
        l.openButton.visible = false;
      }
    });

    this.scene.instance.traverse((object) => {
      if (object.type === 'Mesh' || object.type === 'Group') {
        if (object.userData.isMemory || object.userData.isDecorative || 
            object.name.includes('ground') || object.name.includes('road') ||
            object.name.includes('edge') || object.name.includes('line')) {
          if (object.visible) {
            this.hiddenObjects.push(object);
            object.visible = false;
          }
        }
      }
    });

    const buildingMesh = landmark.group.getObjectByName('buildingMesh');
    const buildingWorldPos = new THREE.Vector3();
    if (buildingMesh) {
      buildingMesh.getWorldPosition(buildingWorldPos);
    } else {
      buildingWorldPos.copy(landmark.position);
      buildingWorldPos.y = 2;
    }

    this.detailStartPos.copy(buildingWorldPos);
    this.detailStartPos.y = 3;
    this.detailEndPos.copy(buildingWorldPos);
    this.detailEndPos.y = 3;

    this.detailViewGroup = new THREE.Group();
    this.detailViewGroup.position.copy(this.detailStartPos);
    this.detailTransitionProgress = 0;
    this.detailOpen = true;

    const galleryWidth = 12;
    const galleryHeight = 8;
    const galleryGeometry = new THREE.PlaneGeometry(galleryWidth, galleryHeight);
    const galleryMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide
    });
    this.galleryBillboard = new THREE.Mesh(galleryGeometry, galleryMaterial);
    this.galleryBillboard.rotation.y = Math.PI / 2;
    this.detailViewGroup.add(this.galleryBillboard);

    this.loadGalleryImage(memory.gallery[0]);

    const buttonSize = 0.8;
    const buttonMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    this.closeButton = new THREE.Mesh(
      new THREE.PlaneGeometry(buttonSize, buttonSize),
      buttonMaterial.clone()
    );
    this.closeButton.position.set(galleryWidth / 2 + 0.8, galleryHeight / 2 + 0.8, 0.1);
    this.closeButton.userData.isCloseButton = true;
    this.galleryBillboard.add(this.closeButton);

    this.prevButton = new THREE.Mesh(
      new THREE.PlaneGeometry(buttonSize, buttonSize),
      buttonMaterial.clone()
    );
    this.prevButton.position.set(-galleryWidth / 2 - 0.8, -galleryHeight / 3 + 0.5, 0.1);
    this.prevButton.userData.isPrevButton = true;
    this.galleryBillboard.add(this.prevButton);

    this.nextButton = new THREE.Mesh(
      new THREE.PlaneGeometry(buttonSize, buttonSize),
      buttonMaterial.clone()
    );
    this.nextButton.position.set(galleryWidth / 2 + 0.8, -galleryHeight / 3 + 0.5, 0.1);
    this.nextButton.userData.isNextButton = true;
    this.galleryBillboard.add(this.nextButton);

    this.scene.instance.add(this.detailViewGroup);

    if (this.experience.camera) {
      this.experience.camera.targetYaw = 0;
      this.experience.camera.targetPitch = 0;
    }
  }

  /**
   * Close detail view
   */
  closeDetailView() {
    if (!this.activeDetailView) return;

    this.detailOpen = false;

    this.hiddenObjects.forEach((object) => {
      object.visible = true;
    });
    this.hiddenObjects = [];

    const landmark = this.memoryLandmarks.find(l => l.memoryId === this.activeDetailView);
    if (landmark && landmark.openButton) {
      landmark.openButton.visible = true;
    }

    if (this.detailViewGroup) {
      this.scene.instance.remove(this.detailViewGroup);
      this.detailViewGroup = null;
    }

    this.galleryBillboard = null;
    this.closeButton = null;
    this.prevButton = null;
    this.nextButton = null;
    this.activeDetailView = null;
    this.galleryCurrentIndex = 0;
    this.detailTransitionProgress = 0;

    if (this.experience.camera) {
      this.experience.camera.targetYaw = this.experience.camera.initialYaw;
      this.experience.camera.targetPitch = this.experience.camera.initialPitch;
    }
  }

  /**
   * Load gallery image
   */
  loadGalleryImage(imagePath) {
    if (!this.galleryBillboard) return;

    const fullPath = imagePath.startsWith('/') 
      ? imagePath 
      : new URL(`../assets/images/${imagePath}`, import.meta.url).href;

    this.textureLoader.load(
      fullPath,
      (texture) => {
        this.galleryBillboard.material.map = texture;
        this.galleryBillboard.material.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn(`Gallery image yüklenemedi: ${imagePath}`, error);
      }
    );
  }

  /**
   * Previous gallery image
   */
  prevGalleryImage() {
    if (!this.activeDetailView) return;
    const memory = this.experience.memoryManager.getMemoryById(this.activeDetailView);
    if (!memory || !memory.gallery) return;

    this.galleryCurrentIndex = (this.galleryCurrentIndex - 1 + memory.gallery.length) % memory.gallery.length;
    this.loadGalleryImage(memory.gallery[this.galleryCurrentIndex]);
  }

  /**
   * Next gallery image
   */
  nextGalleryImage() {
    if (!this.activeDetailView) return;
    const memory = this.experience.memoryManager.getMemoryById(this.activeDetailView);
    if (!memory || !memory.gallery) return;

    this.galleryCurrentIndex = (this.galleryCurrentIndex + 1) % memory.gallery.length;
    this.loadGalleryImage(memory.gallery[this.galleryCurrentIndex]);
  }

  /**
   * Update proximity detection and highlight effects
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

    // Find closest memory landmark
    let closestLandmark = null;
    let closestDistance = Infinity;

    this.memoryLandmarks.forEach((landmark) => {
      const distance = carPosition.distanceTo(landmark.position);
      
      if (distance < this.proximityRadius && distance < closestDistance) {
        closestDistance = distance;
        closestLandmark = landmark;
      }
    });

    // Update highlight state and active memory
    if (closestLandmark !== this.currentHighlightedLandmark) {
      // Reset previous highlight
      if (this.currentHighlightedLandmark) {
        this.currentHighlightedLandmark.highlightIntensity = 0;
        if (this.currentHighlightedLandmark.openButton) {
          this.currentHighlightedLandmark.openButton.visible = false;
        }
      }
      
      // Set new highlight
      this.currentHighlightedLandmark = closestLandmark;
      
      // Update active memory in MemoryManager
      if (closestLandmark && closestLandmark.memoryId) {
        this.experience.memoryManager.setActiveMemory(closestLandmark.memoryId);
        if (closestLandmark.openButton && !this.activeDetailView) {
          closestLandmark.openButton.visible = true;
        }
      }
    } else if (!closestLandmark && this.currentHighlightedLandmark) {
      // Car exited all memory zones
      this.currentHighlightedLandmark.highlightIntensity = 0;
      if (this.currentHighlightedLandmark.openButton) {
        this.currentHighlightedLandmark.openButton.visible = false;
      }
      this.currentHighlightedLandmark = null;
      this.experience.memoryManager.clearActiveMemory();
    }

    // Ensure only the current highlighted landmark's button is visible
    if (!this.activeDetailView) {
      this.memoryLandmarks.forEach((landmark) => {
        if (landmark.openButton) {
          landmark.openButton.visible = (landmark === this.currentHighlightedLandmark);
        }
      });
    }

    // Update all landmarks with smooth transitions (only real memories)
    this.memoryLandmarks.forEach((landmark) => {
      // Skip if not a memory (safety check)
      if (!landmark.isMemory) return;
      
      const isHighlighted = landmark === this.currentHighlightedLandmark;
      
      // Smoothly transition highlight intensity
      if (isHighlighted) {
        landmark.highlightIntensity = Math.min(
          1,
          landmark.highlightIntensity + this.highlightSpeed
        );
      } else {
        landmark.highlightIntensity = Math.max(
          0,
          landmark.highlightIntensity - this.highlightSpeed
        );
      }

      // Apply visual effects based on highlight intensity
      const intensity = landmark.highlightIntensity;
      
      // Scale effect (slight scale up)
      const targetScale = 1 + intensity * 0.1; // 10% scale increase at max
      landmark.group.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );

      // Emissive color effect (soft glow)
      const emissiveIntensity = intensity * 0.5; // Max 50% emissive
      const emissiveColor = new THREE.Color(0xffffff);
      emissiveColor.multiplyScalar(emissiveIntensity);
      landmark.structureMaterial.emissive.lerp(emissiveColor, 0.1);
      landmark.structureMaterial.emissiveIntensity = emissiveIntensity;

      // Brightness/color boost
      const colorBoost = new THREE.Color(landmark.originalColor);
      colorBoost.lerp(new THREE.Color(0xffffff), intensity * 0.3); // 30% brighter at max
      landmark.structureMaterial.color.lerp(colorBoost, 0.1);
    });

    // Update detail view billboard transition
    if (this.detailViewGroup) {
      if (this.detailOpen) {
        this.detailTransitionProgress = Math.min(1, this.detailTransitionProgress + this.detailLerpSpeed);
        const currentPos = new THREE.Vector3();
        currentPos.lerpVectors(this.detailStartPos, this.detailEndPos, this.detailTransitionProgress);
        this.detailViewGroup.position.copy(currentPos);
      } else {
        this.detailTransitionProgress = Math.max(0, this.detailTransitionProgress - this.detailLerpSpeed);
        if (this.detailTransitionProgress > 0) {
          const currentPos = new THREE.Vector3();
          currentPos.lerpVectors(this.detailStartPos, this.detailEndPos, this.detailTransitionProgress);
          this.detailViewGroup.position.copy(currentPos);
        }
      }
    }
  }
}


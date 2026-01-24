import * as THREE from 'three';

/**
 * MemoryManager - Centralized memory data and state system
 */
export default class MemoryManager {
  constructor(experience) {
    this.experience = experience;

    // Memory data structure
    this.memories = [
      {
        id: 'memory-1',
        title: 'Early Days',
        worldPosition: new THREE.Vector3(-8, 0, 20),
        order: 1
      },
      {
        id: 'memory-2',
        title: 'First Steps',
        worldPosition: new THREE.Vector3(8, 0, 50),
        order: 2
      },
      {
        id: 'memory-3',
        title: 'Growing Up',
        worldPosition: new THREE.Vector3(-8, 0, 80),
        order: 3
      },
      {
        id: 'memory-4',
        title: 'School Years',
        worldPosition: new THREE.Vector3(8, 0, 120),
        order: 4
      },
      {
        id: 'memory-5',
        title: 'Friendship',
        worldPosition: new THREE.Vector3(-8, 0, 160),
        order: 5
      },
      {
        id: 'memory-6',
        title: 'Adventure',
        worldPosition: new THREE.Vector3(8, 0, 200),
        order: 6
      },
      {
        id: 'memory-7',
        title: 'Milestone',
        worldPosition: new THREE.Vector3(-8, 0, 240),
        order: 7
      },
      {
        id: 'memory-8',
        title: 'Reflection',
        worldPosition: new THREE.Vector3(8, 0, 280),
        order: 8
      },
      {
        id: 'memory-9',
        title: 'Transformation',
        worldPosition: new THREE.Vector3(-8, 0, 320),
        order: 9
      },
      {
        id: 'memory-10',
        title: 'New Chapter',
        worldPosition: new THREE.Vector3(8, 0, 360),
        order: 10
      },
      {
        id: 'memory-11',
        title: 'Looking Forward',
        worldPosition: new THREE.Vector3(-8, 0, 400),
        order: 11
      },
      {
        id: 'memory-12',
        title: 'Future',
        worldPosition: new THREE.Vector3(8, 0, 440),
        order: 12
      }
    ];

    // Current state
    this.activeMemoryId = null;
    this.activeMemory = null;
    this.previousMemoryId = null;
  }

  /**
   * Get memory by ID
   * @param {string} memoryId - Memory identifier
   * @returns {Object|null} Memory object or null
   */
  getMemoryById(memoryId) {
    return this.memories.find(memory => memory.id === memoryId) || null;
  }

  /**
   * Get memory by order/index
   * @param {number} order - Timeline order (1-based)
   * @returns {Object|null} Memory object or null
   */
  getMemoryByOrder(order) {
    return this.memories.find(memory => memory.order === order) || null;
  }

  /**
   * Set active memory
   * @param {string} memoryId - Memory identifier to activate
   */
  setActiveMemory(memoryId) {
    if (this.activeMemoryId === memoryId) return; // Already active

    this.previousMemoryId = this.activeMemoryId;
    this.activeMemoryId = memoryId;
    this.activeMemory = this.getMemoryById(memoryId);
  }

  /**
   * Clear active memory
   */
  clearActiveMemory() {
    this.previousMemoryId = this.activeMemoryId;
    this.activeMemoryId = null;
    this.activeMemory = null;
  }

  /**
   * Get all memories
   * @returns {Array} Array of all memory objects
   */
  getAllMemories() {
    return this.memories;
  }

  /**
   * Get memories in chronological order
   * @returns {Array} Sorted array of memories
   */
  getMemoriesInOrder() {
    return [...this.memories].sort((a, b) => a.order - b.order);
  }
}

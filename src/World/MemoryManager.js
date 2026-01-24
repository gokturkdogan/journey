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
        description: 'The beginning of a beautiful journey, filled with wonder and discovery.',
        date: '2010-05-15',
        coverImage: '/images/memory1/cover.jpg',
        gallery: [
          '/images/memory1/1.jpg',
          '/images/memory1/2.jpg',
          '/images/memory1/3.jpg'
        ],
        zPosition: 20,
        side: 'left',
        isMemory: true,
        order: 1
      },
      {
        id: 'memory-2',
        title: 'First Steps',
        description: 'Taking the first steps into a new world, learning and growing with each moment.',
        date: '2012-08-22',
        coverImage: '/images/memory2/cover.jpg',
        gallery: [
          '/images/memory2/1.jpg',
          '/images/memory2/2.jpg',
          '/images/memory2/3.jpg',
          '/images/memory2/4.jpg'
        ],
        zPosition: 50,
        side: 'left',
        isMemory: true,
        order: 2
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
    const memory = this.memories.find(memory => memory.id === memoryId);
    if (!memory) return null;
    
    // Return memory with computed worldPosition
    return {
      ...memory,
      worldPosition: new THREE.Vector3(-6, 0, memory.zPosition)
    };
  }

  /**
   * Get memory by order/index
   * @param {number} order - Timeline order (1-based)
   * @returns {Object|null} Memory object or null
   */
  getMemoryByOrder(order) {
    const memory = this.memories.find(memory => memory.order === order);
    if (!memory) return null;
    
    // Return memory with computed worldPosition
    return {
      ...memory,
      worldPosition: new THREE.Vector3(-6, 0, memory.zPosition)
    };
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
   * @returns {Array} Sorted array of memories with worldPosition
   */
  getMemoriesInOrder() {
    return [...this.memories]
      .sort((a, b) => a.order - b.order)
      .map(memory => ({
        ...memory,
        worldPosition: new THREE.Vector3(-6, 0, memory.zPosition)
      }));
  }
}

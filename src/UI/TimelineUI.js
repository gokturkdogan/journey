/**
 * TimelineUI - Fixed timeline overlay showing memory progression
 */
export default class TimelineUI {
  constructor(experience) {
    this.experience = experience;
    this.memoryManager = this.experience.memoryManager;

    // Collapse state
    this.isCollapsed = true; // Start collapsed

    // Create timeline container
    this.createTimeline();

    // Listen for updates to highlight active memory
    this.experience.time.on('tick', () => {
      this.update();
    });
  }

  /**
   * Create timeline HTML structure
   */
  createTimeline() {
    // Create timeline container
    this.container = document.createElement('div');
    this.container.id = 'timeline-container';
    this.container.className = 'timeline-container';
    if (this.isCollapsed) {
      this.container.classList.add('collapsed');
    }
    document.body.appendChild(this.container);

    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'timeline-toggle';
    this.toggleButton.innerHTML = '▼';
    this.toggleButton.addEventListener('click', () => {
      this.toggle();
    });
    this.container.appendChild(this.toggleButton);

    // Create content wrapper (collapsible)
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'timeline-content';

    // Create timeline title
    const title = document.createElement('div');
    title.className = 'timeline-title';
    title.textContent = 'Timeline';
    this.contentWrapper.appendChild(title);

    // Create timeline line
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    this.contentWrapper.appendChild(timelineLine);

    // Create memory nodes container
    this.nodesContainer = document.createElement('div');
    this.nodesContainer.className = 'timeline-nodes';
    this.contentWrapper.appendChild(this.nodesContainer);

    this.container.appendChild(this.contentWrapper);

    // Create memory nodes
    this.createMemoryNodes();
  }

  /**
   * Toggle collapse/expand
   */
  toggle() {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      this.container.classList.add('collapsed');
      this.toggleButton.innerHTML = '▲';
    } else {
      this.container.classList.remove('collapsed');
      this.toggleButton.innerHTML = '▼';
    }
  }

  /**
   * Create memory nodes for all memories
   */
  createMemoryNodes() {
    const memories = this.memoryManager.getMemoriesInOrder();

    memories.forEach((memory, index) => {
      const node = document.createElement('div');
      node.className = 'timeline-node';
      node.dataset.memoryId = memory.id;
      node.dataset.order = memory.order;

      // Node marker (circle)
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      node.appendChild(marker);

      // Node label (title)
      const label = document.createElement('div');
      label.className = 'timeline-label';
      label.textContent = memory.title;
      node.appendChild(label);

      // Node order number
      const order = document.createElement('div');
      order.className = 'timeline-order';
      order.textContent = memory.order;
      node.appendChild(order);

      // Make node clickable for teleport
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        this.teleportToMemory(memory.id);
      });

      this.nodesContainer.appendChild(node);
    });
  }

  /**
   * Navigate car to memory location (smooth movement)
   * @param {string} memoryId - Memory identifier
   */
  teleportToMemory(memoryId) {
    const memory = this.memoryManager.getMemoryById(memoryId);
    if (!memory) return;

    // Set active memory
    this.memoryManager.setActiveMemory(memoryId);

    // Navigate car to memory position (smooth movement, controls disabled)
    const car = this.experience.car;
    if (car && car.navigateTo) {
      car.navigateTo(memory.worldPosition);
    }
  }

  /**
   * Update timeline to highlight active memory
   */
  update() {
    const activeMemoryId = this.memoryManager.activeMemoryId;

    // Update all nodes
    const nodes = this.nodesContainer.querySelectorAll('.timeline-node');
    nodes.forEach((node) => {
      const isActive = node.dataset.memoryId === activeMemoryId;

      if (isActive) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  }
}

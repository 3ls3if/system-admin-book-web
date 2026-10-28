/**
 * CONNECTED DOCS KNOWLEDGE GRAPH VIEW (OBSIDIAN STYLE)
 * High-performance HTML5 Canvas Force-Directed Network Graph
 * with Cyberpunk HUD aesthetics, interactive physics, category clustering,
 * hover tooltips, and instant document navigation.
 */

class ConnectedDocsGraph {
  constructor() {
    this.modal = null;
    this.canvas = null;
    this.ctx = null;
    this.isOpen = false;

    this.nodes = [];
    this.links = [];
    this.nodeMap = new Map();

    // Simulation Physics State
    this.simulation = null;
    this.transform = { x: 0, y: 0, k: 1 };
    this.isDragging = false;
    this.draggedNode = null;
    this.hoveredNode = null;
    this.activeDocPath = null;
    this.categoryFilter = 'ALL';

    // Mouse Interaction
    this.lastMouse = { x: 0, y: 0 };
    this.animId = null;
  }

  init() {
    this.modal = document.getElementById('cyber-graph-modal');
    this.canvas = document.getElementById('cyber-graph-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.initEventListeners();
  }

  initEventListeners() {
    // Open Graph button in HUD
    const openBtn = document.getElementById('btn-open-graph');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.open();
      });
    }

    // Close button
    const closeBtn = document.getElementById('btn-close-graph');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Search input inside graph HUD
    const graphSearch = document.getElementById('graph-search-input');
    if (graphSearch) {
      graphSearch.addEventListener('input', (e) => {
        this.searchAndFocusNode(e.target.value);
      });
    }

    // Category filter select
    const catFilter = document.getElementById('graph-category-filter');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.buildGraphData();
      });
    }

    // Reset View button
    const resetBtn = document.getElementById('btn-graph-reset-view');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetTransform();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }

    // Canvas Mouse & Touch Dragging / Zooming
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    // Resize listener
    window.addEventListener('resize', () => {
      if (this.isOpen) this.resizeCanvas();
    });
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.modal.clientWidth;
    this.canvas.height = this.modal.clientHeight;
  }

  open() {
    if (!this.modal) return;
    this.isOpen = true;
    this.modal.classList.add('active');
    this.resizeCanvas();
    this.populateCategoryFilter();
    this.buildGraphData();
    this.resetTransform();
    this.startSimulation();

    if (window.cyberSFX) window.cyberSFX.playConfirm();
  }

  close() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.classList.remove('active');
    if (this.simulation) this.simulation.stop();
    if (this.animId) cancelAnimationFrame(this.animId);
    if (window.cyberSFX) window.cyberSFX.playClick();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  populateCategoryFilter() {
    const catSelect = document.getElementById('graph-category-filter');
    if (!catSelect) return;
    const categories = new Set();
    window.githubService.flatDocs.forEach(d => {
      if (d.category) categories.add(d.category);
    });

    let html = `<option value="ALL">ALL CATEGORIES (${categories.size})</option>`;
    Array.from(categories).sort().forEach(cat => {
      html += `<option value="${cat}">${cat}</option>`;
    });
    catSelect.innerHTML = html;
    catSelect.value = this.categoryFilter;
  }

  /**
   * Constructs Nodes and Links for the knowledge graph
   */
  buildGraphData() {
    const rawDocs = window.githubService.flatDocs;
    if (!rawDocs || rawDocs.length === 0) return;

    this.nodes = [];
    this.links = [];
    this.nodeMap.clear();

    const categoryHubs = new Map();

    // 1. Filter docs if category filter active
    const filteredDocs = this.categoryFilter === 'ALL'
      ? rawDocs
      : rawDocs.filter(d => d.category === this.categoryFilter);

    // 2. Create Category Hub Nodes
    filteredDocs.forEach(doc => {
      const cat = doc.category || 'General';
      if (!categoryHubs.has(cat)) {
        const hubId = `hub_${cat.toLowerCase().replace(/[^\w]+/g, '_')}`;
        const hubNode = {
          id: hubId,
          title: cat.toUpperCase(),
          path: '',
          category: cat,
          isHub: true,
          radius: 12,
          color: window.CYBER_CONFIG.categoryColors[cat] || '#00f3ff',
          x: (Math.random() - 0.5) * 500,
          y: (Math.random() - 0.5) * 500,
          vx: 0,
          vy: 0
        };
        categoryHubs.set(cat, hubNode);
        this.nodes.push(hubNode);
        this.nodeMap.set(hubId, hubNode);
      }
    });

    // 3. Create Document Nodes
    filteredDocs.forEach((doc, idx) => {
      const cat = doc.category || 'General';
      const hub = categoryHubs.get(cat);
      const isCurrent = this.activeDocPath === doc.path;

      const docNode = {
        id: doc.id || `doc_${idx}`,
        title: doc.title,
        path: doc.path,
        category: cat,
        isHub: false,
        isCurrent: isCurrent,
        radius: isCurrent ? 8 : (doc.depth === 0 ? 6 : 4),
        color: window.CYBER_CONFIG.categoryColors[cat] || '#00f3ff',
        x: (hub ? hub.x : 0) + (Math.random() - 0.5) * 120,
        y: (hub ? hub.y : 0) + (Math.random() - 0.5) * 120,
        vx: 0,
        vy: 0
      };

      this.nodes.push(docNode);
      this.nodeMap.set(docNode.id, docNode);
      this.nodeMap.set(doc.path, docNode);

      // Connect to Category Hub
      if (hub) {
        this.links.push({
          source: hub,
          target: docNode,
          distance: 50,
          strength: 0.6
        });
      }

      // Connect to parent document if present
      if (doc.parent && this.nodeMap.has(doc.parent)) {
        const parentNode = this.nodeMap.get(doc.parent);
        this.links.push({
          source: parentNode,
          target: docNode,
          distance: 30,
          strength: 0.8
        });
      }
    });

    // Update Node Count Badge on HUD
    const countBadge = document.getElementById('graph-node-count');
    if (countBadge) {
      countBadge.textContent = `${this.nodes.length} NODES // ${this.links.length} LINKS`;
    }
  }

  startSimulation() {
    if (typeof d3 === 'undefined') {
      console.warn('D3 not loaded, using fallback layout');
      return;
    }

    if (this.simulation) this.simulation.stop();

    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links).id(d => d.id).distance(d => d.distance || 45).strength(d => d.strength || 0.5))
      .force('charge', d3.forceManyBody().strength(d => d.isHub ? -240 : -35))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(d => d.radius + 6))
      .alphaDecay(0.02)
      .on('tick', () => {
        // Ticks handled by render loop
      });

    this.renderLoop();
  }

  renderLoop() {
    const render = () => {
      if (!this.isOpen) return;
      this.draw();
      this.animId = requestAnimationFrame(render);
    };

    if (this.animId) cancelAnimationFrame(this.animId);
    render();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    this.ctx.save();
    // Center origin and apply zoom/pan transform
    this.ctx.translate(w / 2 + this.transform.x, h / 2 + this.transform.y);
    this.ctx.scale(this.transform.k, this.transform.k);

    const isHighlighting = !!this.hoveredNode;
    const connectedNodeIds = new Set();
    if (this.hoveredNode) {
      connectedNodeIds.add(this.hoveredNode.id);
      this.links.forEach(l => {
        const sId = l.source.id || l.source;
        const tId = l.target.id || l.target;
        if (sId === this.hoveredNode.id) connectedNodeIds.add(tId);
        if (tId === this.hoveredNode.id) connectedNodeIds.add(sId);
      });
    }

    // 1. Draw Links
    for (let i = 0; i < this.links.length; i++) {
      const link = this.links[i];
      const s = link.source;
      const t = link.target;
      if (!s || !t || typeof s.x === 'undefined') continue;

      const isConnected = isHighlighting && (connectedNodeIds.has(s.id) && connectedNodeIds.has(t.id));
      let strokeStyle = 'rgba(0, 243, 255, 0.12)';
      let lineWidth = 1;

      if (isHighlighting) {
        if (isConnected) {
          strokeStyle = s.color || '#00f3ff';
          lineWidth = 2.5;
        } else {
          strokeStyle = 'rgba(255, 255, 255, 0.03)';
        }
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(t.x, t.y);
      this.ctx.stroke();
    }

    // 2. Draw Nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (typeof node.x === 'undefined') continue;

      const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
      const isConnected = isHighlighting && connectedNodeIds.has(node.id);
      const isCurrentDoc = this.activeDocPath && this.activeDocPath === node.path;

      let radius = node.radius;
      let alpha = 1;

      if (isHighlighting && !isConnected) {
        alpha = 0.2;
      }

      // Outer Glow for Hubs or Active / Hovered nodes
      if (node.isHub || isHovered || isCurrentDoc) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius * (isHovered ? 2.5 : 2), 0, Math.PI * 2);
        this.ctx.fillStyle = `${node.color}22`;
        this.ctx.fill();
      }

      // Node Body
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, isHovered ? radius * 1.4 : radius, 0, Math.PI * 2);
      this.ctx.fillStyle = isCurrentDoc ? '#ff007f' : node.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fill();

      // Inner Border
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = isHovered ? 2 : 1;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;

      // Draw Label for Hubs or when zoomed in or when hovered
      if (node.isHub || isHovered || this.transform.k > 1.4) {
        this.ctx.font = node.isHub ? 'bold 11px Orbitron, sans-serif' : '10px Rajdhani, sans-serif';
        this.ctx.fillStyle = isHovered ? '#ffffff' : (node.isHub ? node.color : '#cbd5e1');
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.title, node.x, node.y + radius + (node.isHub ? 14 : 10));
      }
    }

    this.ctx.restore();
  }

  /* ================= MOUSE & CANVAS INTERACTIONS ================= */
  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Convert screen coordinates to world coordinates
    const worldX = (clientX - w / 2 - this.transform.x) / this.transform.k;
    const worldY = (clientY - h / 2 - this.transform.y) / this.transform.k;

    return { clientX, clientY, worldX, worldY };
  }

  findNodeAt(worldX, worldY) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const hitRadius = (node.radius + 6);
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }

  handleMouseDown(e) {
    const coords = this.getCanvasCoords(e);
    const clickedNode = this.findNodeAt(coords.worldX, coords.worldY);

    if (clickedNode) {
      this.draggedNode = clickedNode;
      clickedNode.fx = clickedNode.x;
      clickedNode.fy = clickedNode.y;
      if (this.simulation) this.simulation.alphaTarget(0.3).restart();
    } else {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    }
  }

  handleMouseMove(e) {
    if (!this.isOpen) return;
    const coords = this.getCanvasCoords(e);

    if (this.draggedNode) {
      this.draggedNode.fx = coords.worldX;
      this.draggedNode.fy = coords.worldY;
    } else if (this.isDragging) {
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.transform.x += dx;
      this.transform.y += dy;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    } else {
      const prevHover = this.hoveredNode;
      this.hoveredNode = this.findNodeAt(coords.worldX, coords.worldY);
      if (this.hoveredNode !== prevHover) {
        this.updateTooltip(this.hoveredNode, coords.clientX, coords.clientY);
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
        if (this.hoveredNode && window.cyberSFX) {
          window.cyberSFX.playHover();
        }
      }
    }
  }

  handleMouseUp() {
    if (this.draggedNode) {
      this.draggedNode.fx = null;
      this.draggedNode.fy = null;
      this.draggedNode = null;
      if (this.simulation) this.simulation.alphaTarget(0);
    }
    this.isDragging = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newK = Math.min(3.5, Math.max(0.2, this.transform.k * zoomFactor));
    this.transform.k = newK;
  }

  handleClick(e) {
    const coords = this.getCanvasCoords(e);
    const clickedNode = this.findNodeAt(coords.worldX, coords.worldY);

    if (clickedNode && clickedNode.path) {
      this.close();
      window.location.hash = `#/${clickedNode.path}`;
      if (window.cyberSFX) window.cyberSFX.playConfirm();
    }
  }

  updateTooltip(node, x, y) {
    const tooltip = document.getElementById('cyber-graph-tooltip');
    if (!tooltip) return;

    if (!node) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.style.display = 'block';
    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y + 15}px`;

    const categoryColor = window.CYBER_CONFIG.categoryColors[node.category] || 'var(--primary)';
    tooltip.innerHTML = `
      <div class="tooltip-header" style="color: ${categoryColor}">// ${node.isHub ? 'CLUSTER HUB' : node.category}</div>
      <div class="tooltip-title">${node.title}</div>
      ${node.path ? `<div class="tooltip-path">${node.path}</div><div class="tooltip-action">[CLICK TO ACCESS INTEL]</div>` : `<div class="tooltip-path">${node.category} Cluster</div>`}
    `;
  }

  searchAndFocusNode(query) {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const target = this.nodes.find(n => n.title.toLowerCase().includes(q) || (n.path && n.path.toLowerCase().includes(q)));
    if (target) {
      this.hoveredNode = target;
      this.transform.x = -target.x * this.transform.k;
      this.transform.y = -target.y * this.transform.k;
      this.transform.k = 1.6;
    }
  }

  resetTransform() {
    this.transform = { x: 0, y: 0, k: 0.85 };
  }
}

window.connectedGraph = new ConnectedDocsGraph();

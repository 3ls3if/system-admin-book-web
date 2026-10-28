/**
 * SIDEBAR NAVIGATION TREE & SEARCH ENGINE
 * Renders the collapsible hierarchical navigation, handles instant search,
 * bookmarks / favorites, and breadcrumb generation.
 */

class NavTree {
  constructor() {
    this.treeContainer = null;
    this.searchInput = null;
    this.activeDocPath = null;
    this.bookmarks = JSON.parse(localStorage.getItem('cyber_bookmarks') || '[]');
    this.activeTab = 'docs'; // 'docs' or 'bookmarks'
  }

  init() {
    this.treeContainer = document.getElementById('sidebar-tree');
    this.searchInput = document.getElementById('nav-search-input');
    this.initEventListeners();
  }

  initEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.searchInput.value = '';
          this.handleSearch('');
          this.searchInput.blur();
        }
      });
    }

    // Tab buttons (Docs vs Bookmarks)
    const tabDocsBtn = document.getElementById('tab-btn-docs');
    const tabBookmarksBtn = document.getElementById('tab-btn-bookmarks');

    if (tabDocsBtn && tabBookmarksBtn) {
      tabDocsBtn.addEventListener('click', () => {
        this.activeTab = 'docs';
        tabDocsBtn.classList.add('active');
        tabBookmarksBtn.classList.remove('active');
        this.renderTree();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });

      tabBookmarksBtn.addEventListener('click', () => {
        this.activeTab = 'bookmarks';
        tabBookmarksBtn.classList.add('active');
        tabDocsBtn.classList.remove('active');
        this.renderBookmarks();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }

    // Expand / Collapse all buttons
    const expandAllBtn = document.getElementById('btn-expand-all');
    const collapseAllBtn = document.getElementById('btn-collapse-all');

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        const folders = this.treeContainer.querySelectorAll('.cyber-tree-node.folder');
        folders.forEach(f => f.classList.remove('collapsed'));
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        const folders = this.treeContainer.querySelectorAll('.cyber-tree-node.folder');
        folders.forEach(f => f.classList.add('collapsed'));
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }
  }

  renderTree() {
    if (!this.treeContainer) return;
    const treeData = window.githubService.tree;

    if (!treeData || treeData.length === 0) {
      this.treeContainer.innerHTML = `
        <div class="cyber-tree-empty">
          <div class="empty-glitch">NO DATA DETECTED</div>
          <p>Connecting to neural database...</p>
        </div>`;
      return;
    }

    let html = '<ul class="cyber-tree-root">';
    treeData.forEach(node => {
      html += this.renderNode(node, 0);
    });
    html += '</ul>';

    this.treeContainer.innerHTML = html;
    this.highlightActive(this.activeDocPath);
  }

  renderNode(node, depth) {
    const hasChildren = node.children && node.children.length > 0;
    const isBookmark = this.isBookmarked(node.path);
    const categoryColor = window.CYBER_CONFIG.categoryColors[node.category] || 'var(--primary)';

    if (hasChildren) {
      return `
        <li class="cyber-tree-node folder" data-path="${node.path}">
          <div class="node-row" onclick="window.navTree.toggleFolder(this, event)">
            <span class="folder-caret">▶</span>
            <span class="node-icon">📁</span>
            <span class="node-title">${node.title}</span>
            <span class="node-badge" style="border-color:${categoryColor}44; color:${categoryColor}">${node.children.length}</span>
            <a href="#/${node.path}" class="node-direct-link" title="Open this index doc" onclick="event.stopPropagation();">↗</a>
          </div>
          <ul class="node-children">
            ${node.children.map(child => this.renderNode(child, depth + 1)).join('')}
          </ul>
        </li>
      `;
    } else {
      return `
        <li class="cyber-tree-node file" data-path="${node.path}">
          <a href="#/${node.path}" class="node-row file-link" onclick="if(window.cyberSFX) window.cyberSFX.playClick();">
            <span class="node-icon-dot"></span>
            <span class="node-title">${node.title}</span>
          </a>
        </li>
      `;
    }
  }

  toggleFolder(element, event) {
    event.stopPropagation();
    const folderNode = element.closest('.cyber-tree-node.folder');
    if (folderNode) {
      folderNode.classList.toggle('collapsed');
      if (window.cyberSFX) window.cyberSFX.playClick();
    }
  }

  handleSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      if (this.activeTab === 'bookmarks') {
        this.renderBookmarks();
      } else {
        this.renderTree();
      }
      return;
    }

    const flatDocs = window.githubService.flatDocs;
    const matches = flatDocs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.path.toLowerCase().includes(q) ||
      (d.category && d.category.toLowerCase().includes(q))
    ).slice(0, 50); // limit for fast DOM render

    if (matches.length === 0) {
      this.treeContainer.innerHTML = `
        <div class="cyber-search-empty">
          <div class="search-empty-icon">🔍</div>
          <div>ZERO INTEL FOUND</div>
          <small>No files matched query: "${query}"</small>
        </div>
      `;
      return;
    }

    let html = `<div class="cyber-search-results-header">// QUERY RESULTS: ${matches.length} MATCHES</div><ul class="cyber-search-list">`;
    matches.forEach(d => {
      const highlightedTitle = this.highlightMatch(d.title, q);
      const categoryColor = window.CYBER_CONFIG.categoryColors[d.category] || 'var(--primary)';
      html += `
        <li class="cyber-search-item ${this.activeDocPath === d.path ? 'active' : ''}">
          <a href="#/${d.path}" onclick="if(window.cyberSFX) window.cyberSFX.playClick();">
            <div class="search-item-cat" style="color: ${categoryColor}">// ${d.category || 'General'}</div>
            <div class="search-item-title">${highlightedTitle}</div>
            <div class="search-item-path">${d.path}</div>
          </a>
        </li>
      `;
    });
    html += '</ul>';

    this.treeContainer.innerHTML = html;
  }

  highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.substring(0, idx) +
      `<mark class="cyber-highlight">${text.substring(idx, idx + query.length)}</mark>` +
      text.substring(idx + query.length);
  }

  /* ================= BOOKMARKS / FAVORITES ================= */
  isBookmarked(path) {
    return this.bookmarks.some(b => b.path === path);
  }

  toggleBookmark(path, title, category) {
    const idx = this.bookmarks.findIndex(b => b.path === path);
    if (idx > -1) {
      this.bookmarks.splice(idx, 1);
    } else {
      this.bookmarks.push({ path, title, category, savedAt: Date.now() });
    }
    localStorage.setItem('cyber_bookmarks', JSON.stringify(this.bookmarks));
    this.updateBookmarkButton(path);

    if (this.activeTab === 'bookmarks') {
      this.renderBookmarks();
    }
    if (window.cyberSFX) window.cyberSFX.playConfirm();
  }

  updateBookmarkButton(activePath) {
    const btn = document.getElementById('btn-doc-bookmark');
    if (!btn) return;
    const isSaved = this.isBookmarked(activePath);
    btn.classList.toggle('bookmarked', isSaved);
    btn.innerHTML = isSaved
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> <span>SAVED</span>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> <span>BOOKMARK</span>`;
  }

  renderBookmarks() {
    if (!this.treeContainer) return;
    if (this.bookmarks.length === 0) {
      this.treeContainer.innerHTML = `
        <div class="cyber-tree-empty">
          <div class="empty-glitch">NO BOOKMARKS SAVED</div>
          <p>Click the Bookmark button on any document to save it here for fast access.</p>
        </div>`;
      return;
    }

    let html = `<div class="cyber-search-results-header">// SAVED BOOKMARKS (${this.bookmarks.length})</div><ul class="cyber-bookmarks-list">`;
    this.bookmarks.forEach(b => {
      const categoryColor = window.CYBER_CONFIG.categoryColors[b.category] || 'var(--primary)';
      html += `
        <li class="cyber-bookmark-item ${this.activeDocPath === b.path ? 'active' : ''}">
          <a href="#/${b.path}" class="bookmark-link" onclick="if(window.cyberSFX) window.cyberSFX.playClick();">
            <div class="bookmark-cat" style="color: ${categoryColor}">// ${b.category || 'General'}</div>
            <div class="bookmark-title">${b.title}</div>
          </a>
          <button class="bookmark-remove-btn" onclick="window.navTree.toggleBookmark('${b.path}');" title="Remove Bookmark">×</button>
        </li>
      `;
    });
    html += '</ul>';

    this.treeContainer.innerHTML = html;
  }

  /* ================= ACTIVE STATE & BREADCRUMBS ================= */
  highlightActive(path) {
    this.activeDocPath = path;
    this.updateBookmarkButton(path);

    if (!this.treeContainer) return;

    // Remove previous active classes
    const activeNodes = this.treeContainer.querySelectorAll('.active');
    activeNodes.forEach(n => n.classList.remove('active'));

    if (!path) return;

    // Add active class to matching node
    const matchingNode = this.treeContainer.querySelector(`[data-path="${path}"]`);
    if (matchingNode) {
      matchingNode.classList.add('active');

      // Expand all parent folders
      let parent = matchingNode.parentElement;
      while (parent && parent !== this.treeContainer) {
        if (parent.classList.contains('folder')) {
          parent.classList.remove('collapsed');
        }
        parent = parent.parentElement;
      }

      // Scroll into view inside sidebar
      matchingNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    this.renderBreadcrumbs(path);
  }

  renderBreadcrumbs(path) {
    const breadcrumbContainer = document.getElementById('cyber-breadcrumbs');
    if (!breadcrumbContainer) return;

    if (!path) {
      breadcrumbContainer.innerHTML = `<span class="crumb-root">CYBER-DOCS</span>`;
      return;
    }

    const doc = window.githubService.findDoc(path);
    const category = doc ? doc.category : 'Documentation';
    const title = doc ? doc.title : path.split('/').pop().replace(/\.md$/, '');

    breadcrumbContainer.innerHTML = `
      <a href="#/README.md" class="crumb-link">CORE</a>
      <span class="crumb-sep">/</span>
      <span class="crumb-cat">${category}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-active">${title}</span>
    `;
  }
}

window.navTree = new NavTree();

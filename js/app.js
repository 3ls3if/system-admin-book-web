/**
 * CYBERPUNK SYSADMIN DOCS - MAIN APPLICATION CONTROLLER
 * Orchestrates router, markdown loading, GitHub sync, HUD modals, and keyboard shortcuts.
 */

class CyberDocsApp {
  constructor() {
    this.currentDocPath = null;
    this.isSidebarOpen = true;
  }

  async init() {
    console.log('%c[CYBER-OS v2.0] INITIALIZING NEURAL DOCS INTERFACE...', 'color:#00f3ff; font-weight:bold; font-size:14px;');

    // 1. Initialize Subsystems
    window.cyberTheme.init();
    window.cyberSFX.init();
    window.navTree.init();
    window.connectedGraph.init();
    window.cyberMusic.updateUI();

    // 2. Play subtle boot sound on user interaction
    document.addEventListener('click', () => {
      window.cyberSFX.init();
    }, { once: true });

    // 3. Load Documentation Index
    await this.loadDocsIndex();

    // 4. Setup Router & Hash Listener
    this.setupRouter();

    // 5. Setup HUD Controls & Global Event Listeners
    this.setupGlobalControls();
    this.setupKeyboardShortcuts();

    // 6. Setup Scroll Spy for Table of Contents
    this.setupScrollSpy();

    console.log('%c[CYBER-OS v2.0] SYSTEM ONLINE // READY', 'color:#00ff66; font-weight:bold;');
  }

  async loadDocsIndex(forceRefresh = false) {
    const statusText = document.getElementById('hud-status-text');
    if (statusText) statusText.textContent = 'CONNECTING TO GITHUB NEURAL NET...';

    const result = await window.githubService.loadSummary(forceRefresh);

    if (result.success) {
      window.navTree.renderTree();
      if (statusText) {
        statusText.innerHTML = `<span class="status-live">●</span> ONLINE // ${result.count} DOCS LOADED [${result.source.toUpperCase()}]`;
      }
      this.showToast(`[SYSTEM] ${result.count} DOCS SYNCED (${result.source.toUpperCase()})`, 'success');
    } else {
      if (statusText) {
        statusText.innerHTML = `<span class="status-err">▲</span> SYSTEM ERROR // UNABLE TO REACH REPOSITORY`;
      }
      this.showToast('[ERROR] Failed to load docs index', 'danger');
    }
  }

  /* ================= SPA ROUTER ================= */
  setupRouter() {
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });

    // Handle initial route on page load
    this.handleRoute();
  }

  async handleRoute() {
    let hash = window.location.hash.slice(1); // remove '#'
    if (hash.startsWith('/')) hash = hash.slice(1);

    // If anchor link on current page (e.g. #heading-id)
    if (hash && !hash.endsWith('.md') && !hash.includes('/')) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Default to intro doc
    if (!hash || hash === '') {
      hash = 'README.md';
    }

    await this.loadDocument(hash);
  }

  async loadDocument(path) {
    if (this.currentDocPath === path) return;
    this.currentDocPath = path;

    const contentEl = document.getElementById('doc-markdown-container');
    const titleEl = document.getElementById('doc-header-title');
    const badgeEl = document.getElementById('doc-header-badge');
    const readTimeEl = document.getElementById('doc-meta-readtime');
    const wordsEl = document.getElementById('doc-meta-words');
    const editBtn = document.getElementById('btn-github-edit');

    // Show Cyber Loading HUD Skeleton
    contentEl.innerHTML = `
      <div class="cyber-loading-screen">
        <div class="cyber-spinner"></div>
        <div class="loading-text">DECRYPTING DATA STREAM // ${path}</div>
        <div class="loading-bar"><div class="loading-progress"></div></div>
      </div>
    `;

    // Highlight in navigation tree & update breadcrumbs
    window.navTree.highlightActive(path);
    window.connectedGraph.activeDocPath = path;

    try {
      const rawMarkdown = await window.githubService.fetchMarkdown(path);
      const docMeta = window.githubService.findDoc(path);

      // Render Markdown
      const { html, toc, frontmatter, stats } = window.cyberRenderer.render(rawMarkdown, path);

      // Inject content
      contentEl.innerHTML = html;

      // Update Header Metadata
      const docTitle = (frontmatter.title) || (docMeta ? docMeta.title : path.split('/').pop().replace(/\.md$/, ''));
      const docCategory = (docMeta ? docMeta.category : 'System Guide');

      if (titleEl) titleEl.textContent = docTitle;
      if (badgeEl) {
        badgeEl.textContent = `// ${docCategory.toUpperCase()}`;
        const catColor = window.CYBER_CONFIG.categoryColors[docCategory] || 'var(--primary)';
        badgeEl.style.borderColor = `${catColor}66`;
        badgeEl.style.color = catColor;
      }
      if (readTimeEl) readTimeEl.textContent = `${stats.readMinutes} MIN READ`;
      if (wordsEl) wordsEl.textContent = `${stats.words} WORDS`;

      // Update Edit Link
      if (editBtn) {
        editBtn.href = window.githubService.getEditUrl(path);
      }

      // Update Document Page Title
      document.title = `${docTitle} // CYBERPUNK SYSADMIN`;

      // Highlight Code Blocks with Prism
      if (typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(contentEl);
      }

      // Render On-this-page Table of Contents
      this.renderTableOfContents(toc);

      // Scroll view to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Failed to load document:', err);
      contentEl.innerHTML = `
        <div class="cyber-error-screen">
          <div class="error-badge">DATA BREACH // 404 NOT FOUND</div>
          <h2>TRANSMISSION INTERRUPTED</h2>
          <p>The requested file <code>${path}</code> could not be retrieved from the neural network.</p>
          <div class="error-actions">
            <a href="#/README.md" class="cyber-btn primary">RETURN TO INTRO</a>
            <button class="cyber-btn secondary" onclick="window.cyberApp.loadDocument('${path}')">RETRY FETCH</button>
          </div>
        </div>
      `;
    }
  }

  /* ================= ON-THIS-PAGE TOC ================= */
  renderTableOfContents(tocItems) {
    const tocContainer = document.getElementById('doc-toc-list');
    const tocWrapper = document.getElementById('doc-toc-wrapper');
    if (!tocContainer) return;

    if (!tocItems || tocItems.length === 0) {
      if (tocWrapper) tocWrapper.style.display = 'none';
      return;
    }

    if (tocWrapper) tocWrapper.style.display = 'block';

    let html = '';
    tocItems.forEach(item => {
      html += `
        <li class="toc-item level-${item.level}">
          <a href="#${item.id}" class="toc-link" onclick="if(window.cyberSFX) window.cyberSFX.playClick();">
            <span class="toc-dot">▪</span>
            <span class="toc-text">${item.text}</span>
          </a>
        </li>
      `;
    });

    tocContainer.innerHTML = html;
  }

  setupScrollSpy() {
    window.addEventListener('scroll', () => {
      const headings = document.querySelectorAll('.cyber-heading');
      if (headings.length === 0) return;

      let activeId = null;
      const scrollY = window.scrollY;

      headings.forEach(h => {
        const top = h.offsetTop - 120;
        if (scrollY >= top) {
          activeId = h.id;
        }
      });

      if (activeId) {
        const links = document.querySelectorAll('.toc-link');
        links.forEach(l => {
          if (l.getAttribute('href') === `#${activeId}`) {
            l.classList.add('active');
          } else {
            l.classList.remove('active');
          }
        });
      }
    }, { passive: true });
  }

  /* ================= GLOBAL CONTROLS & HUD ================= */
  setupGlobalControls() {
    // 1. Sidebar Toggle button
    const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
    const sidebarEl = document.getElementById('cyber-sidebar');
    if (toggleSidebarBtn && sidebarEl) {
      toggleSidebarBtn.addEventListener('click', () => {
        this.isSidebarOpen = !this.isSidebarOpen;
        sidebarEl.classList.toggle('closed', !this.isSidebarOpen);
        document.body.classList.toggle('sidebar-closed', !this.isSidebarOpen);
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }

    // 2. Sync GitHub button
    const syncBtn = document.getElementById('btn-sync-github');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.classList.add('syncing');
        if (window.cyberSFX) window.cyberSFX.playConfirm();
        await this.loadDocsIndex(true);
        if (this.currentDocPath) {
          window.githubService.cache.delete(this.currentDocPath);
          await this.loadDocument(this.currentDocPath);
        }
        setTimeout(() => syncBtn.classList.remove('syncing'), 1000);
      });
    }

    // 3. SFX Toggle button
    const sfxBtn = document.getElementById('btn-toggle-sfx');
    if (sfxBtn) {
      const updateSfxBtn = () => {
        const enabled = window.cyberSFX.enabled;
        sfxBtn.classList.toggle('active', enabled);
        sfxBtn.title = enabled ? 'Sound FX: ON' : 'Sound FX: OFF';
      };
      updateSfxBtn();
      sfxBtn.addEventListener('click', () => {
        window.cyberSFX.toggle();
        updateSfxBtn();
      });
    }

    // 4. Bookmark Button in Header
    const bookmarkBtn = document.getElementById('btn-doc-bookmark');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        if (!this.currentDocPath) return;
        const doc = window.githubService.findDoc(this.currentDocPath);
        const title = doc ? doc.title : this.currentDocPath;
        const cat = doc ? doc.category : 'General';
        window.navTree.toggleBookmark(this.currentDocPath, title, cat);
      });
    }

    // 5. Music Player Controls
    const musicPlayBtn = document.getElementById('music-btn-play');
    const musicPrevBtn = document.getElementById('music-btn-prev');
    const musicNextBtn = document.getElementById('music-btn-next');
    const musicSelect = document.getElementById('music-track-select');
    const musicVolume = document.getElementById('music-volume-slider');

    if (musicPlayBtn) musicPlayBtn.addEventListener('click', () => {
      window.cyberMusic.togglePlay();
      if (window.cyberSFX) window.cyberSFX.playClick();
    });
    if (musicPrevBtn) musicPrevBtn.addEventListener('click', () => {
      window.cyberMusic.prev();
      if (window.cyberSFX) window.cyberSFX.playClick();
    });
    if (musicNextBtn) musicNextBtn.addEventListener('click', () => {
      window.cyberMusic.next();
      if (window.cyberSFX) window.cyberSFX.playClick();
    });
    if (musicSelect) {
      // Populate track options
      let html = '';
      window.CYBER_CONFIG.playlist.forEach((track, idx) => {
        html += `<option value="${idx}">[${idx + 1}] ${track.title} (${track.tag})</option>`;
      });
      musicSelect.innerHTML = html;
      musicSelect.addEventListener('change', (e) => {
        window.cyberMusic.selectTrack(parseInt(e.target.value, 10));
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }
    if (musicVolume) {
      musicVolume.value = window.cyberMusic.volume;
      musicVolume.addEventListener('input', (e) => {
        window.cyberMusic.setVolume(parseFloat(e.target.value));
      });
    }

    // 6. Settings Modal
    const settingsBtn = document.getElementById('btn-open-settings');
    const settingsModal = document.getElementById('cyber-settings-modal');
    const settingsCloseBtn = document.getElementById('btn-close-settings');
    const settingsSaveBtn = document.getElementById('btn-save-settings');

    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
        document.getElementById('input-repo-owner').value = window.githubService.config.owner;
        document.getElementById('input-repo-name').value = window.githubService.config.repo;
        document.getElementById('input-repo-branch').value = window.githubService.config.branch;
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }
    if (settingsCloseBtn && settingsModal) {
      settingsCloseBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    }
    if (settingsSaveBtn && settingsModal) {
      settingsSaveBtn.addEventListener('click', async () => {
        const owner = document.getElementById('input-repo-owner').value.trim();
        const repo = document.getElementById('input-repo-name').value.trim();
        const branch = document.getElementById('input-repo-branch').value.trim();

        if (owner && repo && branch) {
          window.githubService.config.owner = owner;
          window.githubService.config.repo = repo;
          window.githubService.config.branch = branch;
          localStorage.setItem('cyber_repo_override', JSON.stringify({ owner, repo, branch }));

          settingsModal.classList.remove('active');
          if (window.cyberSFX) window.cyberSFX.playConfirm();
          this.showToast('[SYSTEM] Repository configured. Reloading...', 'success');
          await this.loadDocsIndex(true);
          window.location.hash = '#/README.md';
        }
      });
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if inside input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      // Ctrl + K or '/' -> Focus Search
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        const search = document.getElementById('nav-search-input');
        if (search) {
          search.focus();
          search.select();
        }
      }

      // 'G' or 'g' -> Toggle Connected Docs Graph
      if (e.key === 'g' || e.key === 'G') {
        window.connectedGraph.toggle();
      }

      // 'M' or 'm' -> Toggle Background Music
      if (e.key === 'm' || e.key === 'M') {
        window.cyberMusic.togglePlay();
      }

      // '[' -> Toggle Sidebar
      if (e.key === '[') {
        const btn = document.getElementById('btn-toggle-sidebar');
        if (btn) btn.click();
      }

      // 'Escape' -> Close modals
      if (e.key === 'Escape') {
        window.connectedGraph.close();
        window.cyberRenderer.closeLightbox();
        const settings = document.getElementById('cyber-settings-modal');
        if (settings) settings.classList.remove('active');
      }
    });
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('cyber-toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `cyber-toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-led"></div>
      <div class="toast-msg">${message}</div>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

window.cyberApp = new CyberDocsApp();
document.addEventListener('DOMContentLoaded', () => {
  window.cyberApp.init();
});

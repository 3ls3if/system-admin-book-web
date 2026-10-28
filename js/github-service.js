/**
 * GITHUB SERVICE & DYNAMIC CONTENT LOADER
 * Fetches SUMMARY.md and individual Markdown docs dynamically from GitHub
 * with automatic fallback, relative path resolution, and live reload.
 */

class GitHubService {
  constructor() {
    this.config = window.CYBER_CONFIG.github;
    this.tree = [];
    this.flatDocs = [];
    this.docMap = new Map(); // path -> doc
    this.cache = new Map(); // path -> markdown text
    this.isLoading = false;
    this.lastSynced = null;

    // Load custom repo override if saved
    const savedRepo = localStorage.getItem('cyber_repo_override');
    if (savedRepo) {
      try {
        const parsed = JSON.parse(savedRepo);
        this.config.owner = parsed.owner || this.config.owner;
        this.config.repo = parsed.repo || this.config.repo;
        this.config.branch = parsed.branch || this.config.branch;
      } catch (e) {}
    }
  }

  getRawUrl(relativePath) {
    // Strip leading slashes
    const cleanPath = relativePath.replace(/^\/+/, '');
    return `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${cleanPath}`;
  }

  getEditUrl(relativePath) {
    const cleanPath = relativePath.replace(/^\/+/, '');
    return `https://github.com/${this.config.owner}/${this.config.repo}/blob/${this.config.branch}/${cleanPath}`;
  }

  /**
   * Load SUMMARY.md dynamically from GitHub or fallback
   */
  async loadSummary(forceRefresh = false) {
    this.isLoading = true;
    const summaryUrl = `${this.getRawUrl(this.config.summaryFile)}${forceRefresh ? '?t=' + Date.now() : ''}`;

    try {
      // 1. Try dynamic fetch from GitHub
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(summaryUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'text/plain' }
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`GitHub returned status ${resp.status}`);
      }

      const mdText = await resp.text();
      this.parseSummaryMarkdown(mdText);
      this.lastSynced = new Date();
      console.log(`[CyberDocs] Synced ${this.flatDocs.length} docs dynamically from GitHub.`);
      return { success: true, source: 'github', count: this.flatDocs.length };
    } catch (err) {
      console.warn(`[CyberDocs] GitHub dynamic sync failed (${err.message}), loading bundled fallback...`);
      return await this.loadBundledFallback();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fallback loader using local bundled JSON
   */
  async loadBundledFallback() {
    try {
      const resp = await fetch(this.config.fallbackJsonUrl);
      if (!resp.ok) throw new Error('Fallback JSON not found');
      const data = await resp.json();
      this.tree = data.tree || [];
      this.flatDocs = data.flat || [];
      this.docMap.clear();
      this.flatDocs.forEach(d => this.docMap.set(d.path, d));
      this.lastSynced = new Date();
      console.log(`[CyberDocs] Loaded ${this.flatDocs.length} docs from bundled fallback.`);
      return { success: true, source: 'fallback', count: this.flatDocs.length };
    } catch (fallbackErr) {
      console.error('[CyberDocs] Failed to load bundled fallback:', fallbackErr);
      return { success: false, error: fallbackErr.message };
    }
  }

  /**
   * Parse SUMMARY.md text into hierarchical tree and flat doc index
   */
  parseSummaryMarkdown(content) {
    const lines = content.split(/\r?\n/);
    const tree = [];
    const stack = []; // [indent, node]
    const flatList = [];
    const docMap = new Map();

    const lineRegex = /^(\s*)\*\s+\[(.*?)\]\((.+)\)\s*$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.startsWith('#')) continue;

      const match = line.match(lineRegex);
      if (!match) continue;

      const indent = match[1].length;
      const title = match[2].trim();
      let path = match[3].trim();
      if (path.startsWith('<') && path.endsWith('>')) {
        path = path.slice(1, -1);
      }

      const node = {
        id: `doc_${flatList.length}`,
        title: title,
        path: path,
        children: []
      };

      while (stack.length > 0 && stack[stack.length - 1][0] >= indent) {
        stack.pop();
      }

      if (stack.length === 0) {
        node.category = title;
        node.parent = null;
        tree.push(node);
      } else {
        const parentNode = stack[stack.length - 1][1];
        node.category = parentNode.category || parentNode.title;
        node.parent = parentNode.path;
        parentNode.children.push(node);
      }

      stack.push([indent, node]);

      const flatItem = {
        id: node.id,
        title: node.title,
        path: node.path,
        category: node.category,
        parent: node.parent,
        depth: Math.floor(indent / 2)
      };

      flatList.push(flatItem);
      docMap.set(node.path, flatItem);
    }

    this.tree = tree;
    this.flatDocs = flatList;
    this.docMap = docMap;
  }

  /**
   * Fetch a single markdown file content dynamically
   */
  async fetchMarkdown(path) {
    // Check in-memory cache
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const rawUrl = this.getRawUrl(path);

    try {
      const resp = await fetch(rawUrl);
      if (!resp.ok) {
        throw new Error(`Document fetch failed with status ${resp.status}`);
      }
      const text = await resp.text();
      this.cache.set(path, text);
      return text;
    } catch (err) {
      console.error(`[CyberDocs] Error fetching doc ${path}:`, err);
      throw err;
    }
  }

  /**
   * Resolves relative URLs (e.g. images or links) relative to the active doc's directory
   */
  resolveRelativePath(activeDocPath, relativePath) {
    if (!relativePath || relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('#')) {
      return relativePath;
    }

    // Determine active document directory
    const parts = activeDocPath.split('/');
    parts.pop(); // remove file name
    const docDir = parts;

    const relParts = relativePath.split('/');
    const resultParts = [...docDir];

    for (const p of relParts) {
      if (p === '.' || p === '') {
        continue;
      } else if (p === '..') {
        if (resultParts.length > 0) {
          resultParts.pop();
        }
      } else {
        resultParts.push(p);
      }
    }

    return resultParts.join('/');
  }

  /**
   * Resolves an image source to an absolute GitHub raw URL
   */
  resolveImageUrl(activeDocPath, rawSrc) {
    if (!rawSrc) return '';
    if (rawSrc.startsWith('http://') || rawSrc.startsWith('https://') || rawSrc.startsWith('data:')) {
      return rawSrc;
    }
    const resolvedPath = this.resolveRelativePath(activeDocPath, rawSrc);
    return this.getRawUrl(resolvedPath);
  }

  /**
   * Find document by path or title
   */
  findDoc(pathOrTitle) {
    if (!pathOrTitle) return null;
    if (this.docMap.has(pathOrTitle)) {
      return this.docMap.get(pathOrTitle);
    }
    return this.flatDocs.find(d =>
      d.path.toLowerCase() === pathOrTitle.toLowerCase() ||
      d.title.toLowerCase() === pathOrTitle.toLowerCase()
    ) || null;
  }
}

window.githubService = new GitHubService();

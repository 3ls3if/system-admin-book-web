/**
 * MARKDOWN RENDERER & GITBOOK EXTENSION
 * Parses Markdown, GitBook hints, figures, relative images, internal links,
 * and handles Prism.js syntax highlighting with copy buttons and On-this-page ToC.
 */

class MarkdownRenderer {
  constructor() {
    this.tocItems = [];
    this.initMarked();
  }

  initMarked() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: true,
        mangle: false
      });
    }
  }

  /**
   * Pre-processes GitBook specific tags, frontmatter, and relative URLs
   */
  preprocessGitBook(markdown, activeDocPath) {
    let processed = markdown;

    // 1. Extract Frontmatter (--- ... ---)
    let frontmatter = {};
    const frontmatterMatch = processed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (frontmatterMatch) {
      const fmContent = frontmatterMatch[1];
      fmContent.split(/\r?\n/).forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          frontmatter[key] = val;
        }
      });
      processed = processed.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    }

    // 2. Parse GitBook Hints: {% hint style="styleName" %} ... {% endhint %}
    processed = processed.replace(/\{%\s*hint\s+style=["']?(\w+)["']?\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g, (match, style, content) => {
      const type = style.toLowerCase();
      let icon = 'ℹ️';
      let title = 'CYBER INTEL';
      if (type === 'warning') { icon = '⚠️'; title = 'WARNING // SECURITY NOTICE'; }
      else if (type === 'danger' || type === 'error') { icon = '🛑'; title = 'BREACH // CRITICAL ALERT'; }
      else if (type === 'success') { icon = '✅'; title = 'CLEARANCE // SYSTEM VERIFIED'; }

      return `\n<div class="cyber-callout cyber-callout-${type}">
        <div class="cyber-callout-header">
          <span class="callout-icon">${icon}</span>
          <span class="callout-title">${title}</span>
        </div>
        <div class="cyber-callout-body">${content.trim()}</div>
      </div>\n`;
    });

    // 3. Parse GitBook tabs: {% tabs %} ... {% tab title="..." %} ... {% endtab %} ... {% endtabs %}
    processed = processed.replace(/\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/g, (match, content) => {
      return `<div class="cyber-tabs-container">${content}</div>`;
    });
    processed = processed.replace(/\{%\s*tab\s+title=["'](.*?)["']\s*%\}([\s\S]*?)\{%\s*endtab\s*%\}/g, (match, title, tabContent) => {
      return `<div class="cyber-tab-pane" data-tab-title="${title}">
        <div class="cyber-tab-heading">TAB // ${title}</div>
        <div class="cyber-tab-content">${tabContent}</div>
      </div>`;
    });

    // 4. Resolve GitBook <figure><img src="..."> <figcaption>...</figcaption></figure>
    processed = processed.replace(/<figure>([\s\S]*?)<\/figure>/g, (match, inner) => {
      return `<div class="cyber-figure">${inner}</div>`;
    });

    // 5. Rewrite Markdown Image paths: ![alt](path)
    processed = processed.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      const cleanSrc = src.trim().replace(/^<|>$/g, '');
      const resolvedSrc = window.githubService.resolveImageUrl(activeDocPath, cleanSrc);
      return `![${alt}](${resolvedSrc})`;
    });

    // 6. Rewrite HTML img tags: <img src="..." ...>
    processed = processed.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/g, (match, before, src, after) => {
      const resolvedSrc = window.githubService.resolveImageUrl(activeDocPath, src.trim());
      return `<img${before}src="${resolvedSrc}"${after} loading="lazy" class="cyber-doc-image" onclick="window.cyberRenderer.openLightbox('${resolvedSrc}')">`;
    });

    // 7. Rewrite Markdown Links: [text](path.md)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, target) => {
      let cleanTarget = target.trim().replace(/^<|>$/g, '');

      // Leave external links and anchors untouched
      if (cleanTarget.startsWith('http://') || cleanTarget.startsWith('https://') || cleanTarget.startsWith('#') || cleanTarget.startsWith('mailto:')) {
        return `<a href="${cleanTarget}" target="_blank" rel="noopener noreferrer" class="cyber-external-link">${text} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
      }

      // If linking to a markdown file, route it internally via SPA hash
      if (cleanTarget.endsWith('.md')) {
        const resolvedPath = window.githubService.resolveRelativePath(activeDocPath, cleanTarget);
        return `<a href="#/${resolvedPath}" class="cyber-internal-link" onclick="if(window.cyberSFX) window.cyberSFX.playClick();">${text}</a>`;
      }

      return match;
    });

    return { processed, frontmatter };
  }

  /**
   * Main render function that converts Markdown to HTML
   */
  render(markdown, activeDocPath) {
    this.tocItems = [];
    const { processed, frontmatter } = this.preprocessGitBook(markdown, activeDocPath);

    let rawHtml = '';
    if (typeof marked !== 'undefined') {
      rawHtml = marked.parse(processed);
    } else {
      rawHtml = `<pre>${processed}</pre>`;
    }

    // Sanitize with DOMPurify
    let cleanHtml = rawHtml;
    if (typeof DOMPurify !== 'undefined') {
      cleanHtml = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['figure', 'figcaption'],
        ADD_ATTR: ['target', 'data-tab-title', 'loading', 'onclick', 'class']
      });
    }

    // Post-process HTML: Add IDs to Headings for Table of Contents, wrap tables and code blocks
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${cleanHtml}</div>`, 'text/html');
    const container = doc.body.firstElementChild;

    // Process Headings
    const headings = container.querySelectorAll('h1, h2, h3, h4');
    headings.forEach((h, index) => {
      const level = parseInt(h.tagName.substring(1), 10);
      const text = h.textContent.trim();
      const id = h.id || `heading-${index}-${text.toLowerCase().replace(/[^\w]+/g, '-')}`;
      h.id = id;

      // Wrap heading in cyber header anchor
      h.classList.add('cyber-heading');
      h.innerHTML = `<span class="heading-prefix">${'#'.repeat(level)}</span> <span class="heading-text">${h.innerHTML}</span> <a href="#${id}" class="heading-anchor" title="Direct link">§</a>`;

      // Collect for ToC (levels 2, 3)
      if (level >= 2 && level <= 3) {
        this.tocItems.push({
          id: id,
          text: text,
          level: level
        });
      }
    });

    // Wrap tables with cyber responsive scroller
    const tables = container.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('cyber-table');
      const wrapper = doc.createElement('div');
      wrapper.className = 'cyber-table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // Enhance code blocks with cyber header & copy button
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((pre, idx) => {
      pre.classList.add('cyber-code-block');
      const code = pre.querySelector('code');
      let lang = 'code';
      if (code) {
        const langMatch = (code.className || '').match(/language-(\w+)/);
        if (langMatch) lang = langMatch[1];
      }

      const header = doc.createElement('div');
      header.className = 'cyber-code-header';
      header.innerHTML = `
        <div class="code-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
        <span class="code-lang">// ${lang.toUpperCase()}</span>
        <button class="cyber-btn-copy" onclick="window.cyberRenderer.copyCode(this)" title="Copy Code">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span class="copy-text">COPY</span>
        </button>
      `;

      pre.parentNode.insertBefore(header, pre);
    });

    // Make all images click-to-zoom
    const images = container.querySelectorAll('img:not(.cyber-doc-image)');
    images.forEach(img => {
      img.classList.add('cyber-doc-image');
      const src = img.getAttribute('src');
      img.setAttribute('onclick', `window.cyberRenderer.openLightbox('${src}')`);
    });

    return {
      html: container.innerHTML,
      toc: this.tocItems,
      frontmatter: frontmatter,
      stats: this.calculateStats(markdown)
    };
  }

  calculateStats(markdown) {
    const text = markdown.replace(/<[^>]*>/g, '').replace(/[#*`_~\[\]\(\)]/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, readMinutes };
  }

  /**
   * Copy code to clipboard with visual feedback & SFX
   */
  copyCode(btn) {
    const header = btn.closest('.cyber-code-header');
    const pre = header.nextElementSibling;
    const code = pre ? pre.querySelector('code') || pre : null;
    if (!code) return;

    const textToCopy = code.innerText || code.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      btn.classList.add('copied');
      const textSpan = btn.querySelector('.copy-text');
      if (textSpan) textSpan.textContent = 'COPIED!';
      if (window.cyberSFX) window.cyberSFX.playConfirm();

      setTimeout(() => {
        btn.classList.remove('copied');
        if (textSpan) textSpan.textContent = 'COPY';
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }

  /**
   * Open Image Lightbox
   */
  openLightbox(src) {
    if (!src) return;
    const modal = document.getElementById('cyber-lightbox-modal');
    const img = document.getElementById('cyber-lightbox-img');
    if (modal && img) {
      img.src = src;
      modal.classList.add('active');
      if (window.cyberSFX) window.cyberSFX.playClick();
    }
  }

  closeLightbox() {
    const modal = document.getElementById('cyber-lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
      if (window.cyberSFX) window.cyberSFX.playClick();
    }
  }
}

window.cyberRenderer = new MarkdownRenderer();
